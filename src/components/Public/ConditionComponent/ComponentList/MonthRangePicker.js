import React, {Component} from 'react';
import { DatePicker,Radio } from '@vadp/ui';
import moment from 'moment';
const { MonthPicker ,RangePicker} = DatePicker;
export default class MonthRangePicker extends Component {
  constructor(props) {
        super(props);
        this.state = {
                startValue:null ,
                endValue: null,
                endOpen: false,
                startOpen:false,
            };
        this.onStartChange=this.onStartChange.bind(this);
        this.onEndChange=this.onEndChange.bind(this);
    }
    componentDidMount(){
       this.init(this.props);
    }
    componentWillReceiveProps(nextProps){
        this.init(nextProps)
    }
    getMomentValue(date){
        return moment(date,this.props.format);
    }
    init(props){
        const values=props.value && props.value._i;
        if(values && Array.isArray(values)){ //仪表板中
            
            this.setState({
              startValue:values[0]!="" ? this.getMomentValue(values[0]) :null,
              endValue:values[1]!="" ? this.getMomentValue(values[1]) :null
            })
        }else{ //图表中
            const values=props.value;
            if(values && Array.isArray(values)){
              this.setState({
                startValue:values[0],
                endValue:values[1],
              })
            }
        }
       
    }
    disabledStartDate = startValue => {
        const { endValue } = this.state;
        if (!startValue || !endValue) {
            return false;
        }
        return startValue.valueOf() > endValue.valueOf();
  }

  disabledEndDate = endValue => {
    const { startValue } = this.state;
    if (!endValue || !startValue) {
      return false;
    }
    return endValue.valueOf() < startValue.valueOf();
  }
  onStartChange = value => {
     const {endValue}=this.state;
      let newValues=!endValue ? [value,value] :[value,endValue]
      let list={
        startValue:value,
        startOpen:false,
        endValue:newValues[1],
      }
      this.setState(list);
      this.onChangeCommon(newValues);
      
  }
  onEndChange = value => {
    const {startValue}=this.state;
    let newValues=!startValue ? [value,value] :[startValue,value];
    let list={
      endValue:value,
      endOpen:false,
      startValue:newValues[0]
    }
    this.setState(list);
    this.onChangeCommon(newValues);
}
  onChangeCommon(newValues){
    const {onPanelChange,onChange}=this.props;
    if(onPanelChange){
        if(newValues.length && newValues[0] && newValues[1]){
          onPanelChange(newValues); 
        }else{
           if(onChange)onChange(["",""],["",""]);
        }
        
    }
  }
 

  handleStartOpenChange = open => {
      this.setState({ startOpen: open });
    // if (!open) {
    //   this.setState({ endOpen: true });
    // }
  }

  handleEndOpenChange = open => {
    this.setState({ endOpen: open });
  }

  render() {
    const { startValue, endValue, endOpen ,startOpen} = this.state;
    return (
      <div style={{"display":"flex"}}>
        <MonthPicker
          disabledDate={this.disabledStartDate}
          showTime
          format={this.props.format}
          value={startValue}
          placeholder="开始日期"
          onChange={this.onStartChange}
          open={startOpen}
          onOpenChange={this.handleStartOpenChange}
        />
        ~
        <MonthPicker
          disabledDate={this.disabledEndDate}
          showTime
          format={this.props.format}
          value={endValue}
          placeholder="结束日期"
          onChange={this.onEndChange}
          open={endOpen}
          onOpenChange={this.handleEndOpenChange}
        />  
      </div>
     
    )
  }
}
// OESSSWTGL-18937 
// 日期控件支持选择本月到本月方法：1、目前antd使用版本为3.6.5；可升级到3.26.18，只需要修改代码antd-with-locales.min.js；缺点：（1）更新后样式部分有异常，（2）与vadp集成版本不一致，不方便维护。

// 2、可以修改antd-with-locales.min.js源码，难度较大。

// 3、开发人员写个组件，可控性强，研究后建议采用此办法。