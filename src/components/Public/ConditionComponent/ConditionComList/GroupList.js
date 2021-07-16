import React, { Component } from 'react';
// －－－－－－－－引入条件参数变量-----－－－
import {remindCustomeFn } from '../Operations';
import {deepCopyUseJSON} from '../ConditionsModalCore';
import FormItemsList from './FormItemsList';
import FormItemsGroup from './FormItemsGroup';
import FormItemsDate from './FormItemsDate';
let runTime = false;
import {analysisDataForInputTextFn,stringFn} from './GroupListFn.js';
import {customDateChange} from './submitOnOk';
import {isMultipleCeferenceSelect} from '../objManger/ref'
// －－－－－－－参数字段组件－－－－－－－－
export default  class GroupList extends Component {
    constructor(props) {
      super(props);
      this.state = {
        data: [],
        remindCustome:""
      };
      this.OperationChangeAndInputTextChange = this.OperationChangeAndInputTextChange.bind(this);
      this.changeData = this.changeData.bind(this);
      this.onDeselect = this.onDeselect.bind(this);// ref删除
      this.parentFieldForTargetField = this.parentFieldForTargetField.bind(this);
      this.onChangeCheckbox = this.onChangeCheckbox.bind(this);
      this.onChangeSetting = this.onChangeSetting.bind(this);
      this.onFieldSelectChange = this.onFieldSelectChange.bind(this);
      this.onDataChainChange = this.onDataChainChange.bind(this);
    }
      // －－－－－－绑定特殊区间变换方法-----
    onFieldSelectChange = (value, index,) => {
      const arr = deepCopyUseJSON(this.state.data)
      arr[index]["referenceInfo"]["rangeType"] = value;
      if(arr[index].referenceInfo && arr[index].referenceInfo.content && !arr[index].referenceInfo.content.openCalendar){
        arr[index]["values"]= ",";
      }
      this.setState({
        data:arr
      })
    };
      // －－－－－－同比，环比，选项-----
    onDataChainChange = (value, index,) => {
      const arr = deepCopyUseJSON(this.state.data)
      arr[index]["referenceInfo"]["rangeComparison"] = value;
      this.setState({
        data:arr
      })
    };
  
      // －－－－－－绑定等式关系变换的方法-----
    onOperationChange = (value, index,) => {
      this.OperationChangeAndInputTextChange(value, index, 1);
    };
      // －－－－－－输入框的变化方法-----
    onInputTextChange = (value, index,type,submit) => {
      this.OperationChangeAndInputTextChange(value, index, 2,submit);
    };
        // －－－－－－输入框和等式关系变换共用方法-----
    OperationChangeAndInputTextChange = (value, index, type,submit ) => {
      const arr = deepCopyUseJSON(this.state.data);
      const selectType = analysisDataForInputTextFn(arr[index]); // 根据选择的类型来对应相应的数据解析。
      let _value = '';
      if (type === 2) {
        switch (selectType) {
          case 1:
            _value = (Array.isArray(value) ? `${value[0]},${value[1]}` : value);
            break;
          case 2:
            _value = value;
            break;
          case 3:
            _value = value;
            break;
          case 4:
            _value = Array.isArray(value) ? value : [value];
            break;
        }
        arr[index].values = _value;
        this.deleteContextFormat(arr[index]);
      } else {
        arr[index].operation = value;
        _value = arr[index].values;
        if(selectType==4){  //只有参照时候才能使用
          if(isMultipleCeferenceSelect(value)){//value == 'in' || value == 'notin'
            if(Array.isArray(arr[index].values)){
              _value = arr[index].values 
            } 
          }else{
            if(Array.isArray(arr[index].values)){
              _value = [arr[index].values[arr[index].values.length-1]]
            }
            if(stringFn(arr[index].values)){
              _value = arr[index].values.split(",")
              _value = _value[_value.length-1]    //将多数变成少数
            }
          }
          arr[index].values = _value;
        }
      }
      if(arr[index].referenceInfo && (arr[index].referenceInfo.type=="yearMonth"
      || arr[index].referenceInfo.type=="year" || arr[index].referenceInfo.type=="month"
      )){ //BI-2207 BI-2222	
            if(arr[index].operation !="range_all"){
                  if(Array.isArray(arr[index].values)){
                      _value = arr[index].values[arr[index].values.length-1];
                      arr[index].values = _value;
                  }
                  if(arr[index].valueArray)delete arr[index].valueArray;
            }
      }
      if(arr[index].dataType=="date" && arr[index].operation !="range_all"){
        if(arr[index].valueArray)delete arr[index].valueArray;
      }
      if(arr[index].linkageInfo){
        // console.log(value[0].linkField)
        arr[index]["linkField"] = Array.isArray(value) ? value[0].linkField: value&&value.key ? value.key:"";
      }
      if(arr[index].referenceInfo && arr[index].referenceInfo.relativeDate){
        // console.log(value[0].linkField)
        arr[index]["referenceInfo"]["relativeDate"] = "none"
      }
      // console.log(arr,"change houde")
      let remindCustome = null
      if(arr[index].customDate){
  
        let copyArr = deepCopyUseJSON(arr[index])
        customDateChange(copyArr,"到")
        remindCustome = {
          time:copyArr.values.split(","),
          operation:remindCustomeFn(copyArr.operationNew),
          value:copyArr.valuesNew
        };
      }
      //用values 重置valueArray 
      if(arr[index].valueArray){
         if(Array.isArray(arr[index].values)){
            arr[index].valueArray=JSON.parse(JSON.stringify(arr[index].values));
         }else if(typeof(arr[index].values)=="string"){
           arr[index].valueArray=arr[index].values.split(",");
         }
        
      }
      const data = { data: arr,remindCustome:remindCustome };
      this.setState(() => {
        return data;
      }, () => {
        if (arr[index].linkageInfo) {
          this.props.linkageInfoChangeData(arr[index].linkageInfo);
        }
           this.props.temporaryStorage();
          if(submit=="submit"){//触发按钮
                  if(this.props.handleSubmit)this.props.handleSubmit();
          }
      });
       
    }
    deleteContextFormat(data){ //删除上下文
      if(data.ContextFormat){
        // console.log(value[0].linkField)
        delete data["ContextFormat"];
      }
  }
    onChangeCheckbox = (value, index, arr, type = 'listData') => {
      if (type === 'groupInfo') {
        arr.map((item) => {
          item.commonUse = value.target.checked;
        });
      } else {
        arr[index].commonUse = value.target.checked;
      }
      const data = { data: arr };
  
      this.setState(data, () => {
  
      });
    }
    onChangeSetting = (value,index,arr, type = 'listData')=>{
        
       const data = { data: arr };
        this.setState(data)
    }
    onDeselect(value, index) {
      const data = this.state.data;
      const newvalues = [];
      if (data[index] && Array.isArray(data[index].values)) {
        data[index].values.forEach((item) => {
          if (item.key != value.key && item.label != value.label) {
            newvalues.push(item);
          }
        });
      } 
      this.deleteRelation(data[index],data)
      data[index].values = newvalues;
      this.deleteContextFormat(data[index]);
      // console.log(data,newvalues,"dataonDeselect")
      this.setState({ data }, () => {
        this.props.temporaryStorage()
      });
    }
    deleteRelation(data0,data){
       const newvalues=[];
      //删除联动相关的 
        if(data0 && data0.linkageInfo && data0.linkageInfo.target 
          && data0.linkageInfo.target.tableName
          && data0.linkageInfo.target.fieldName 
          ){
                data.map((item,itemIndex)=>{
                        if(item.tableName ==data0.linkageInfo.target.tableName 
                          && item.fieldName ==data0.linkageInfo.target.fieldName
                          ){
                            data[itemIndex].values=newvalues;
                            this.deleteRelation(data[itemIndex],data);//继续
                        }
                })
        }
    }
    submit() {
      return this.state.data;
    }
    changeData(data) {
      this.setState({ data });
    }
    parentFieldForTargetField(parentField, targetField) {
      return this.props.parentFieldForTargetField(parentField, targetField);
    }
    onClear(index,data){
      
      // this.setState({data:data})
    }
    componentWillMount() {
      this.setState(() => {
        return { data: this.props.data, prevdata: deepCopyUseJSON(this.props.data) };
      }, () => {
      });
    }
    componentWillReceiveProps(nextprops) {
      this.setState(() => {
        return { data: nextprops.data, prevdata: deepCopyUseJSON(nextprops.data) };
      }, () => {
      });
    }
  
  
    render() {
      const { data,remindCustome } = this.state;
      const { type,benchmarkDateCopy,mode } = this.props;
      return (
        <div className={`condition-group-${mode}`}>{
          data.length ?
              type === 'listData' ? <FormItemsList
                      data={data}
                      type={type}
                      that={this}
                      benchmarkDateCopy={benchmarkDateCopy}
                 />
                  : (type === 'customDate' ?
                  <FormItemsDate 
                       data={data}
                      type={type}
                      that={this}
                      remindCustome={remindCustome}
                  /> : 
                  <FormItemsGroup
                      data={data}
                      type={type}
                      that={this}
                      index={0}
                      runTime={runTime}
                  />)
  
              : null
  
        }
        </div>
      );
    }
  }

  