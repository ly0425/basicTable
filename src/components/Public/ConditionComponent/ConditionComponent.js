import React, {  Component  } from 'react';
import SingleSelectAddComponent from "./ComponentList/SingleSelectAddComponent";
// －－－－－－－－引入条件参数变量-----－－－
import { customdateOperation } from './Operations';
import {  dataTypeJudgeDate, typeLoop, CascaderDataFn,
  constructionData, CascaderDataDisabledFn, deepCopyUseJSON ,deTemporaryStorage} from './ConditionsModalCore';
import {mergeObject} from './conditionsPublic-function.js';
import {_analysisModel} from '@/components/public/AnalysisModelFn';
import GroupList from './ConditionComList/GroupList.js';
import {submitOnOk} from './ConditionComList/submitOnOk.js'
import {conversionDataFn} from './ConditionComList/GroupListFn';
let runTime = false;
let dashboardIDcopy = "";
let temporaryStorage = "temporaryStorage";
let benchmarkDateCopy = new Date()//由后台传进来的基本日期表示
function getValues(values) {
  if(typeof(values)=="string")return values;
  return values.map((item) => {
    return item.key;
  });
}
// －－－－－－－弹出框－－－－－－－－
class Conditions extends  Component  {
  static defaultProps = {
    data: [],
    fields: [],
    disabled: [],
    onOk: () => { },
    onCancel: () => { },
  };
  constructor(props) {
    super(props);
    this.state = {
      propsData:[],
      data: [],
      fields: [], // 重构后台传来的数据
      comparisonFields: props.fields, // －－初始值进行比对，存根－－
      customData: [], // －－存储最近数据查询的数据－－
      runTime,
      fieldOperationbclass: true,
      closeSettingBut:false
    };
    this.publicInit = this.publicInit.bind(this);
    this.temporaryStorage = this.temporaryStorage.bind(this);
  }
  recycleDataValue(){
    let data = this.state.data || []
    for (const key in data) {
      if (this.refs[key]) {
        this.refs[key].submit();
        data[key] = this.refs[key].submit();
      }
    }
    return data
  }
  // －－－－－－－添加条件按钮－－－－－－－－
  add = (obj, key) => {
    const arr = this.recycleDataValue();
    let isAdd = true;
    if (obj) {
      if (key == 'listData') {
        if (!arr[key]) {
          arr[key] = [];
          arr[key].push(obj);
        } else if (!arr[key].some(item => item.aliasName ? item.aliasName == obj.aliasName : item.fieldName == obj.fieldName)) {
          arr[key].push(obj);
        } else {
          isAdd = false;
        }
      } else if (key === 'customDate') {
        arr[key] = [];
        arr[key].push(obj);
      } else if (!arr[key]) {
        arr[key] = obj;
      } else if (arr[key].length) {
        isAdd = false;
      } else {
        arr[key] = obj;
      }
      // console.log(arr,"arr")
      if (isAdd) {
        this.setState({
          data: arr,
        }, () => {
          this.changeFields();
        });
      }
    }
  };
  componentDidUpdate(){
       if(this.props.needcomponentDidUpdate)this.props.needcomponentDidUpdate();
  }
  remove = (index, key) => {
    const data = this.recycleDataValue();

    if (key == 'listData') {
      data[key].splice(index, 1);
    } else {
      data[key] = [];
    }
    this.setState(() => {
      return {
        data: data,
        suijishu:Math.random()
      };
    }, () => {
      // console.log(this.state.data)
      this.changeFields();
    });
  };
  linkageInfoChangeData=(item = {}) => {
    // console.log("linkageInfoChangeData",item)
    if (this.refs[item.type]) {
      const data = this.refs[item.type].submit();
      data.forEach((originItem) => {
        if (item.target.fieldName == originItem.fieldName) {
          originItem.values = '';
          this.refs[item.type].changeData(data);
        }
      });
    }
  }
  parentFieldForTargetField=(list = [], targetField, ) => {
    const reData = [];
    list.forEach((item) => {
      if (this.refs[item.type]) {
        const data = this.refs[item.type].submit();

        data.forEach((originItem) => {
          if (item.parentField == (originItem.aliasName) && originItem.values && originItem.linkageInfo) {
            let filterField = '';
            const filterAliasName = '';
            originItem = conversionDataFn(deepCopyUseJSON(originItem));
            if (originItem.linkageInfo.target.fieldName == targetField) {
              filterField = originItem.linkageInfo.target.filterField;
               // filterAliasName = linkageInfoitem.filterAliasName ||linkageInfoitem.filterField
            }
            // console.log(originItem,"originItem")
            if(originItem.values && originItem.values.length){

              const obj = {
                values: originItem.linkField?originItem.linkField:getValues(originItem.values),
                fieldName: filterField,
              };
              reData.push(obj);
            }
          }
        });
      }
    });
    // console.log(reData,"reData")
    return reData;
  }
    // －－－已选过的变灰处理－－－
  changeFields=() => {
    const newfields = deepCopyUseJSON(this.state.comparisonFields);
    const fields = CascaderDataDisabledFn(this.state.data, newfields);
    this.temporaryStorage()
    // console.log(this.state.data)
    this.setState({
      fields,
    });
  }

  //deepCompare有可能出现错误：Maximum call stack size exceeded
  // shouldComponentUpdate(nextProps, nextState) {
  //   // var shouldUpdate = /* some logic */
  //   //－－－－进行表格的深度比对－－－－－
  //   // console.log(deepCompare(this, nextProps, nextState),"shouldComponentUpdate" )
  //   return deepCompare(this, nextProps, nextState)

  // }
  componentDidMount() {
    this.publicInit(this.props);

  }
      // －－－－－－－参数发生改变时候－－－－－－－－
  componentWillReceiveProps = (nextProps) => {
    if (!this.state.data.length) {
      this.publicInit(nextProps);
    }
  };

  publicInit(props) {
    let { data, disabled, fields, runTime, isShowDateList,mode, linkBackDate,dashboardID,isRender,popup } = props;
    //更新别名
    _analysisModel.updateConditionsUseNewFields(data,fields,1);
    dashboardIDcopy = dashboardID;
    //多个仪表板同时存在，条件会混乱 加了个id
     temporaryStorage = popup?"temporaryStoragepopup":"temporaryStorage"+dashboardID;
    //  console.log(popup,"popup",temporaryStorage,dashboardID,isRender)
    if(deTemporaryStorage(temporaryStorage)){
       data = deTemporaryStorage(temporaryStorage);
    }
    const propsData = data ? deepCopyUseJSON(data) : [];
    // -－－－－对于默认数据进行分流处理，分成查询项设置和最近数据查询两个部分－－－－－－
    const _runTime = this.props.runTime ? this.props.runTime : runTime;
    // －－－－判断是否有时间类型，就要添加最近数据查询－－－－
    let customData = [];
    let newfields = deepCopyUseJSON(fields);
    // console.log(fields,"customData")

    if (isShowDateList) {
      customData = customDataFn(fields);
      newfields = customData.concat(newfields);
    }

    if (data.length && data[data.length - 1].customDate) {
      const item = data[data.length - 1];
      item.operation = item.operationNew;
      item.values = item.valuesNew;
    }
    const { CascaderData, fieldOperationbclass } = CascaderDataFn(newfields);
    newfields = CascaderData;
    // console.log(newfields,"customData")
    benchmarkDateCopy = sessionStorage.getItem("benchmarkDate")?sessionStorage.getItem("benchmarkDate"):"";
    
    this.setState(() => {
      return {
        data: constructionData(data, customData,benchmarkDateCopy,isRender),
        temporaryStoragekey:temporaryStorage,
        disabled,
        fields: newfields,
        customData: customData || [],
        runTime: _runTime,
        comparisonFields: newfields,
        fieldOperationbclass,
        propsData
      };
    }, () => {
      this.changeFields();
    });
    // console.log(this.state.data)
  }
  // －－－－－－－提交按钮－－－－－－－－
  handleSubmit = (e) => {
    let newdata = [];
    for (const key in this.state.data) {
      if (this.refs[key]) {
        newdata = newdata.concat(this.refs[key].submit());
      }
    }
    // console.log(newdata,"newdata")
    sessionStorage.removeItem("dashboardID");//多个仪表板同时存在，条件会混乱
    return newdata;
  };
  temporaryStorage(dataarr=null){
    let temporaryStoragekey = this.state.temporaryStoragekey

    if(dataarr){
      sessionStorage.setItem(temporaryStoragekey, JSON.stringify(dataarr));

    }else{

      let data = this.handleSubmit();
      if(dashboardIDcopy){
        sessionStorage.setItem(temporaryStoragekey, JSON.stringify(data));
        sessionStorage.setItem('dashboardID', dashboardIDcopy);
      }
    }
    

  }

  componentWillUnmount() {
    // sessionStorage.setItem('ref', JSON.stringify([]));
  }

  render() {
    const { fields, data, runTime, fieldOperationbclass, isShowSettingAttribute } = this.state;
    const { isShowCheckBox, mode, isShowSelectFields, isShowDateList, isShowDelete, closeSettingBut,hiddenItem,isHiddenOperation,fieldWidth,inputTextWidth,handleSubmit} = this.props;
    const classname = `conditionComponent-${mode}`;
    return (
      <div className={classname} >

        {
            isShowSelectFields && mode == 'list' && <div className="conditions_selectFields">
              <SingleSelectAddComponent
                fields={fields}
                index={1}
                add={this.add.bind(this)}
                fieldOperationbclass={fieldOperationbclass}
              />
            {/* <MoreSelectAddComponent
                fields={fields}
                index={1}
                add={this.add.bind(this)}
                fieldOperationbclass={fieldOperationbclass}
            /> */}
            </div>
        }
        <div className={`conditions-${mode}`}>
          {
            Object.keys(data).map((item) => {
              if (item !== 'customDate' && data[item].length ) {
                return (<GroupList
                  ref={item}
                  type={typeLoop(item)}
                  remove={this.remove}
                  data={data[item]}
                  isShowCheckBox={isShowCheckBox}
                  isShowDelete={isShowDelete}
                  except="customDate"
                  linkageInfoChangeData={this.linkageInfoChangeData}
                  parentFieldForTargetField={this.parentFieldForTargetField}
                  temporaryStorage = {this.temporaryStorage}
                  mode={mode}
                  closeSettingBut={closeSettingBut}
                  hiddenItem={hiddenItem}
                  benchmarkDateCopy={benchmarkDateCopy}
                  isHiddenOperation={isHiddenOperation}
                  fieldWidth={fieldWidth}
                  inputTextWidth={inputTextWidth}
                  handleSubmit={handleSubmit? handleSubmit:()=>{}}
                />);
              }
            })
          }
          {

            data.customDate && data.customDate.length ? <GroupList
              ref="customDate"
              type={typeLoop('customDate')}
              remove={this.remove}
              data={data.customDate}
              isShowCheckBox={isShowCheckBox}
              isShowDelete={isShowDelete}
              temporaryStorage = {this.temporaryStorage}
              mode={mode}
              hiddenItem={hiddenItem}
              benchmarkDateCopy={benchmarkDateCopy}
              isHiddenOperation={isHiddenOperation}
              fieldWidth={fieldWidth}
              inputTextWidth={inputTextWidth}
              handleSubmit={handleSubmit? handleSubmit:()=>{}}
            /> : null
          }
        </div>
      </div>
    );
  }
};
const customDataFn = (fields) => {
  const data = [];
  fields.forEach((olditem) => {
    let {referenceInfo} = olditem;
    if(!olditem.customDate){
      if (dataTypeJudgeDate(olditem.dataType) && !referenceInfo) {

        let item;
        item = deepCopyUseJSON(mergeObject(customdateOperation(), olditem));
        data.push(item);
      }
      if (referenceInfo){
        if(referenceInfo.type == "yearMonth" || referenceInfo.type == "year"){
          let newitem = deepCopyUseJSON(olditem)
          // delete newitem.referenceInfo
          let item;
          item = deepCopyUseJSON(mergeObject(customdateOperation(referenceInfo.type), newitem));
          data.push(item);
        }
      }
    }
  });
  return data;
};
export { Conditions, submitOnOk };
