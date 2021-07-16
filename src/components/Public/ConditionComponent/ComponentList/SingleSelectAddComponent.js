import React, {  Component , PureComponent } from 'react';
import { Button } from '@vadp/ui';
import {  publicComponentBox } from '../ConditionsModalCore';



const dataDefault = {
    operation: '=', // 设置初始值，避免设置两个查询条件时有一个operation是空字符串
  };


  const groupInfoValue = (data) => {
    const list = [];
    data.forEach((item) => {
      list.push(Object.assign({}, dataDefault, item.obj));
    });
    return list;
  };

const filedType = (selectedOptions) => {
  console.log(selectedOptions,"selectedOptions")
    let type = 'listData';
    if (Array.isArray(selectedOptions) && selectedOptions.length && selectedOptions[0].children) {
      if (selectedOptions[0].children[0].obj.customDate) {
        type = 'customDate';
      } else {
        type = selectedOptions[0].value;
      }
    }
    return type;
  };
// －－－－－－－创建参数字段－－－－－－－－
class SingleSelectAddComponent extends  Component  {
    constructor(props) {
      super(props);
      this.state = {
        value: '',
        tempValue: null,
        tempKey: 'listData',
        isAdd: true,
        obj:{}
      };
      this.onChange = this.onChange.bind(this);
      this.publicInit = this.publicInit.bind(this);
    }
    onChange(value, selectedOptions) {
      console.log(value, selectedOptions,"value, selectedOptions")
      if (selectedOptions.length) {
        let isAdd = true;
        let tempValue = null;
        let tempKey = filedType(selectedOptions);
        if (tempKey === 'listData') {
          tempValue = selectedOptions[0].obj;
          tempValue = Object.assign({}, dataDefault, tempValue);
        } else if (tempKey === 'customDate') {
          if (value.length > 1) {
            tempKey = selectedOptions[0].value;
            tempValue = Object.assign({}, dataDefault, selectedOptions[1].obj);
          } else {
            isAdd = false;
          }
        } else {
          tempKey = selectedOptions[0].value;
          tempValue = groupInfoValue(selectedOptions[0].children);
        }
  
        this.setState({
          tempValue,
          tempKey,
          isAdd,
        });
      }
    }
    onClickAdd() {
      if (this.state.isAdd) {
        this.props.add(this.state.tempValue, this.state.tempKey);
      } else {
        Message.error('最近日期类型，请选择具体日期');
      }
    }
    componentDidMount(){
      this.publicInit(this.props)
    }
    componentWillReceiveProps(nextprops){
      console.log("componentWillReceiveProps",nextprops)
      this.publicInit(nextprops)

    }
    publicInit(props){
      let obj = {};
      const that = this;
      obj = {
        showSearch:true,
        placeholder: '参数',
        options: props.fields,
        onChange: (value, selectedOptions) => { that.onChange(value, selectedOptions); },
        changeOnSelect: 'changeOnSelect',
        style: { width: '460px' },
        fieldNames:{ label: 'label', value: 'value', children: 'children' },
        getPopupContainer: () => { if (document.getElementById('area')) { return document.getElementById('area'); } else { return document.body; } },
      };
      this.setState({obj:obj})
    }
    render() {
      const { fields, index, fieldOperationbclass } = this.props;
      const { value,obj } = this.state;

      return (
        <div className={fieldOperationbclass ? 'field-operation-select' : 'field-operation-select Cascader-select'} id="area">
          {
            fields.length?publicComponentBox('Cascader', obj):null
          }
          <Button
            style={{ marginLeft: '9px', width: '74px', padding: 0 }}
            key={'add'}  onClick={this.onClickAdd.bind(this)}
          >添加参数</Button>
        </div>
      );
    }
  }

  export default SingleSelectAddComponent