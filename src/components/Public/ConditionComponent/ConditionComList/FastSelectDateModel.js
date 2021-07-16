import React, {Component} from 'react';
import { Radio } from '@vadp/ui'; 
import moment from 'moment';
export default class FastSelectDateModel extends Component {
  constructor(props) {
        super(props);
        this.state={
          type:"" 
        }
        this.valueX=[null,null];
        this.onChange=this.onChange.bind(this);
    }
    componentDidMount(){
       this.init(this.props);
    }
    componentWillReceiveProps(nextProps){
        this.init(nextProps)
    }
    
    init(props){
         if(!!props.values){
          if(Array.isArray(props.values) && props.values.length && (props.values[0]!=this.valueX[0]) || (props.values[1]!=this.valueX[1])){
              this.setState({
                type:""
              })   
          }
        }
    }  
    backNMonths(n){ //n 从当前年月开始后退n个月
      const format="YYYY-MM";
      return moment(moment()).subtract(n, 'months').format(format);
    } 
    onChange(e){ //目前格式只有年月"YYYY-MM"
       const value=e.target.value; 
       let result=[]; 
       let x1=null;
       if(value=="nearly3Months"){
          x1= this.backNMonths(3); 
       }else if(value=="nearly6Months"){ 
          x1= this.backNMonths(6); 
       }else if(value=="thisYear"){
          x1= moment().get('year')+"-01"; 
       }
       let x2=this.backNMonths(1);
       if(x1>x2)x2=x1;
       if(x1 && x2)result=[x1,x2];
       this.setState({
        type:value 
      })
        this.valueX=result;
       if(result.length && this.props.onChange)this.props.onChange(result); 
    }
  render() { 
    return (
      <div className="fast-select-date">
      <Radio.Group value={this.state.type} buttonStyle="solid" onChange={this.onChange}>
          <Radio.Button value="nearly3Months">近3个月</Radio.Button>
          <Radio.Button value="nearly6Months">近6个月</Radio.Button>
          <Radio.Button value="thisYear">本年</Radio.Button> 
      </Radio.Group>
    </div>
    )
  }
}
 