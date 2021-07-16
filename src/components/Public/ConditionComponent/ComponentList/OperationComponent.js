
import React, {  Component , PureComponent } from 'react';
import {  publicComponentBox } from '../ConditionsModalCore';
// －－－－－－－－引入条件参数变量-----－－－
import OperationTypeFn from '../Operations';

// －－－－－－－创建不等式条件选项－－－－－－－－
class OperationComponent extends  PureComponent  {
    constructor(props){
      super(props);
      this.state={
        obj:{}
      }
      this.publicInit=this.publicInit.bind(this);
    }
    componentWillReceiveProps(nextprops){
      this.publicInit(nextprops);
    }
    componentDidMount(){
      this.publicInit(this.props);
    }
    publicInit(props){
      const { item, style, disabled, index, className } = props;
      // －－－－－－根据传进来的dataType进行区分显示选择不同的参数样式－－－－－－
      const operations = OperationTypeFn(item);
      // －－－－－－－－将operations参数进行实例化-----－
      const children = [];

      const arrayData = Object.keys(operations);
      for (let i = 0; i < arrayData.length; i++) {
        const k = arrayData[i];
        const obj = {
          key: k,
          value: k,
          children: operations[k],
        };

        // if (item.commonUse && k != '=' && k != 'range_all') { // 如果是常用项 只可以选择等于和区间于
        //   continue;
        // }
        children.push(publicComponentBox('Option', obj));
      }
      const that = this;
      const obj = {
        showSearch: true,
        className: className || '',
        placeholder: '运算符',
        onChange: (value) => { that.props.onChange(value, index); },
        disabled,
        value: item.operation,
        children,
      };

      this.setState({
        obj:obj
      })
    }
    render() {

      return publicComponentBox('Select', this.state.obj);
    }
  }


  export default OperationComponent;
