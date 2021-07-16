import React, {  Component , PureComponent } from 'react';
import { Button, Tooltip, Checkbox, Select } from '@vadp/ui';


class FieldSelect extends  PureComponent  {
    componentWillReceiveProps(nextProps){
  
    }
    componentDidMount(){
  
    }
    render() {
      const { value,required,data, index } = this.props;
      let obj = {};
      const name = 'Select';
  
      let objdata = [
        { key: 0, value: 'halfYear', children: "年-半年" },
        { key: 1, value: 'quarter', children: "年-季" },
        { key: 2, value: 'year', children: "年" },
        { key: 3, value: 'month', children: "月" },
      ]
      let children = []
      objdata.map(item=>{
        children.push(publicComponentBox("Option", item))
      })
      let that = this;
      obj = {
        className: "FieldSelect",
        children: children,
        placeholder: '区间',
        style: { width: '87px' },
        onChange: (value) => { that.props.onChange(value, index); },
  
      };
      console.log(data,"obj")
      return (
        <div className="field-name">
          {
          publicComponentBox(name, obj)
        }
        </div>
      );
    }
  }


  // －－－－－－－参数字段组件－－－－－－－－
class Field extends  PureComponent  {
    render() {
      const { value,required } = this.props;
      let obj = {};
      const name = 'label';
  
  
      obj = {
        className: 'conditionModal-ellipsis',
        children: <Tooltip title={value}>
          {required?<b>*</b>:null}
          <span>{value}</span>
        </Tooltip>,
        style: { width: '87px' },
      };
  
      return (
        <div className="field-name">
          {
          publicComponentBox(name, obj)
        }
        </div>
      );
    }
  }