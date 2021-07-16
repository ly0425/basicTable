import React, {PureComponent } from 'react';
import { publicComponentBox} from '../ConditionsModalCore';
// －－－－－－－参数字段组件－－－－－－－－
export default  class  DataChain  extends  PureComponent  {
    componentWillReceiveProps(nextProps){
  
    }
    componentDidMount(){
  
    }
    render() {
      const { value,required,item, index,hiddenTBHB,width} = this.props;
      let obj = {};
      const name = 'Select';
  
      let objdata = [
        { key: 0, value: 'origin', children: "原值" },
        { key: 1, value: 'yearOverYear', children: "同比率" },
        { key: 2, value: 'Chain', children: "环比率" },
      ]
      let children = []
      objdata.map(item=>{
        children.push(publicComponentBox("Option", item))
      })
      let that = this;
      let rangeComparison = item["referenceInfo"]["rangeComparison"]?item["referenceInfo"]["rangeComparison"]:[]
      obj = {
        className: "FieldSelect",
        children: children,
        placeholder: '对比',
        value:rangeComparison,
        onChange: (value) => { that.props.onChange(value, index); },
        style: { width: width},
        allowClear:false
      };
      const fieldNameClassName=hiddenTBHB ? "hiddenTBHB":"DataChainshow";
      return (
        <div  className={"field-operation field-name DataChain "+fieldNameClassName} style={{marginRight: "8px",marginLeft:"0","width": width}}>
          {
            hiddenTBHB?"原值":
          publicComponentBox(name, obj)
        }
        </div>
      );
    }
  }
  