import React, {  Component , PureComponent } from 'react';
import { Collapse, Checkbox, Tooltip,Icon ,Select,Radio} from '@vadp/ui';
import {relativeDateChange,dateBackForLinkFn,dateFormatForDatePicker,getContextFormatForOption} from "../Operations"
const CheckboxGroup = Checkbox.Group;
const { Option } = Select;


   // －－－－－－－类型判断－－－－－－－－
   const dataTypeJudgeDate = (val) => {
    return val && (val.toLowerCase() == 'date' || val.toLowerCase() == 'timestamp' || val.toLowerCase() == 'datetime');
  };
let options = [
  { label: '必填项', value: "required" },
  { label: '相对日期', value: "relativeDate" },
  { label: '隐藏项', value: "hidden" },

];
const defaultCheckedList = [];

class App extends Component {
  state = {
    checkedList: defaultCheckedList,
    indeterminate: true,
    checkAll: false,
    isShowSettingAttribute: false,

  };

  onChange = (checkedList) => {
    console.log(checkedList,"checkedList")
    this.props.onChangeCheckedListFn(checkedList)
  }
  componentWillReceiveProps(nextProps){
    console.log(nextProps,"nextProps")
    if(!nextProps.isShowRelativeDate){
      options = [
        { label: '必填项', value: "required" },
        { label: '隐藏项', value: "hidden" },
      ]
    }else{
      options = [
        { label: '必填项', value: "required" },
        { label: '相对日期', value: "relativeDate" },
        { label: '隐藏项', value: "hidden" },
      ]
    }
  }

  render() {
    return (
        <CheckboxGroup options={options} defaultValue={this.props.checkedList} onChange={this.onChange} />
    );
  }
}
class ContextFormatSetting extends Component{

  render() {
    const {value} = this.props
    const ContextFormatForOption=getContextFormatForOption();
    return (
      <div className="SettingRelativeDate">
        <label>上下文</label>
        <Select
          showSearch
          style={{ width: "70%" }}
          placeholder="选择上下文"
          optionFilterProp="children"
          onChange={this.props.onChange}
          value={value}

        >

          {
            ContextFormatForOption.map(item=>{
               if(item.value) {
                   return <Option key={item.key} value={item.key} itemValue={item.value}>{item.label}</Option>
                }else{
                   return null
                }
            })
          }
        </Select>
      </div>
    );
  }
}
class SettingRelativeDate extends Component{

  render() {
    const {value} = this.props
    return (
      <div className="SettingRelativeDate">
        <label>期间—月</label>
        <Select
          showSearch
          style={{ width: "70%" }}
          placeholder="选择相对日期"
          optionFilterProp="children"
          onChange={this.props.onChange}
          value={value}

        >
            <Option  value={"none"}>{"空"}</Option>

          {
            relativeDateChange[0].map(item=>{
              return <Option key={item.key} value={item.key}>{item.label}</Option>
            })
          }
        </Select>
      </div>
    );
  }
}
class DatePickerFormat extends Component{

  render() {
    const {value} = this.props
    return (
      <div className="SettingRelativeDate">
        <label>日期格式</label>
        <Select
          showSearch
          style={{ width: "70%" }}
          placeholder="选择日期格式"
          optionFilterProp="children"
          onChange={this.props.onChange}
          value={value}

        >

          {
            dateFormatForDatePicker.map(item=>{
              return <Option key={item.key} value={item.key}>{item.label}</Option>
            })
          }
        </Select>
      </div>
    );
  }
}


const SliceTimeAll = [
  {
    key: 'CurrentPeriodAndAllPeriod',label:"拆分结尾时间"
  },
  {
    key: 'none',label:"空"
  },
]
const hiddenYear='year-hidden';
const hiddenMonth='month-hidden';
const hiddenHalfyear='halfyear-hidden';
const hiddenSeason='season-hidden';
const DisplaynoneList = [
  // {
  //   key: 'all-display-none',label:"隐藏全部选项"
  // },
  // {
  //   key: 'halfyear',label:"隐藏半年"
  // },
  // {
  //   key: 'season',label:"隐藏季度"
  // },
  // {
  //   key: 'none',label:"空"
  // },
    {
      key:hiddenYear,label:"年"
    },
    {
      key: hiddenHalfyear,label:"半年"
    },
    {
      key:hiddenMonth,label:"月"
    }, 
    {
      key:hiddenSeason,label:"季度"
    },
]


//将期间范围字段末尾时间变成本期时间
class SliceTime extends React.Component {

  render() {
    const {value} =this.props;
    return (
      <div className="SettingRelativeDate">
      <label>拆分期间</label>
      <Select
        showSearch
        style={{ width: "70%" }}
        placeholder="请选择"
        optionFilterProp="children"
        onChange={this.props.onSliceTime}
        value={value}

      >

        {
          SliceTimeAll.map(item=>{
            return <Option key={item.key} value={item.key}>{item.label}</Option>
          })
        }
      </Select>
    </div>
    );
  }
}
//隐藏期间对应的时间段选项
class Displaynone extends React.Component {
  getValue(value){
         if(value=="none"){
            return [];
         }else if(value=="all-display-none"){
           return [hiddenYear,hiddenHalfyear,hiddenMonth,hiddenSeason]
         }
         return value; 
  }
  render() {
    const {value} =this.props;
    return (
      <div className="SettingRelativeDate">
      <label>隐藏时段选项</label>
      <Select
        showSearch
        style={{ width: "70%" }}
        placeholder="请选择"
        optionFilterProp="children"
        onChange={this.props.onDisplaynone}
        value={this.getValue(value)} 
        mode="tags"
      > 
        {
          DisplaynoneList.map(item=>{
            return <Option key={item.key} value={item.key}>{item.label}</Option>
          })
        }
      </Select>
    </div>
    );
  }
}

class SettingComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fieldOperationbclass: true,
      isShowRelativeDateForRange:false,
      isShowDatePickerFormat:false,
      checkedList:[],
      RelativeDateForRange:0
    };

    this.SettingAttributeBut = this.SettingAttributeBut.bind(this);
    this.checkedListChangeFn = this.checkedListChangeFn.bind(this);
    this.onOk = this.onOk.bind(this);
  }
  SettingAttributeBut=(type) => {
    this.setState({ isShowSettingAttribute: type });
  }

  checkedListChangeFn(data){
    let checkedList = []
    options.map(item=>{
      // console.log(item)
      if(data[item.value]){

        checkedList.push(item.value)
      }
    })
    let isShowRelativeDate = false 

    if((data.referenceInfo && (data.referenceInfo.type === 'yearMonth' || data.referenceInfo.type === 'year'  || data.referenceInfo.type === 'month') )|| ( data.referenceInfo  && dataTypeJudgeDate(data.dataType) && data.referenceInfo.type !="range")){
      isShowRelativeDate = true
    }

    this.setState({checkedList:checkedList,isShowRelativeDate:isShowRelativeDate,})
  }
  onOk(checkedList,RelativeDateForRange,DateFormat,CurrentPeriodAndAllPeriod,rangeDisplaynone,ContextFormat){
    // console.log(checkedList,"ok",RelativeDateForRange)
    const { data, index,benchmarkDate } = this.props;
    let dataResult=JSON.parse(JSON.stringify(data));//避免污染data
    let datacopy = JSON.parse(JSON.stringify(data));

    //先做空，再赋值
    options.map(item=>{
      dataResult[index][item.value]=false
    })
    checkedList.map(item=>{
      if(item){
        dataResult[index][item]=true;
      }
    })
    if(datacopy[index].referenceInfo && datacopy[index].referenceInfo.type === "range"){
      dataResult[index].referenceInfo["relativeDate"] = RelativeDateForRange?RelativeDateForRange:"none";
      dataResult[index].referenceInfo["rangeDisplaynone"] = rangeDisplaynone?rangeDisplaynone:"none";

      if(dataResult[index].dataType.indexOf("CurrentPeriodAndAllPeriod")!=-1){
        dataResult[index].dataType= dataResult[index].dataType.replace("CurrentPeriodAndAllPeriod", "")
      }
      if(CurrentPeriodAndAllPeriod!="none"){
        dataResult[index].dataType=`${dataResult[index].dataType}${CurrentPeriodAndAllPeriod}`
      }
      if(RelativeDateForRange!="none"){
        let format = 'YYYY-MM'
        if(datacopy[index].referenceInfo.content && datacopy[index].referenceInfo.content.openCalendar){
          format = 'YYYY-MM-DD'
        }
        if(datacopy[index].referenceInfo.content.isSingleCalendar){
          dataResult[index].values = dateBackForLinkFn(RelativeDateForRange,benchmarkDate,format,0)

        }else{

          dataResult[index].values = dateBackForLinkFn(RelativeDateForRange,benchmarkDate,format)
        }
        console.log(dataResult[index].values)
      }else{
        dataResult[index].values = ""
      }
    }
    if(datacopy[index].dataType.toLowerCase()  === "date" || (datacopy[index].referenceInfo && datacopy[index].referenceInfo.content && datacopy[index].referenceInfo.content.openCalendar)){
      dataResult[index]["DateFormat"] = DateFormat?DateFormat:"YYYY-MM-DD"
    }
      if(ContextFormat && ContextFormat.key){
            if(ContextFormat.key=="none"){//无
                  if(dataResult[index]["ContextFormat"])delete dataResult[index].ContextFormat;
                  dataResult[index].values = "";
            }else{
                  dataResult[index]["ContextFormat"]=ContextFormat;
                  dataResult[index].values =ContextFormat.value;//
            }
      }
      if(datacopy[index].relativeDate != dataResult[index].relativeDate){
        dataResult[index].values = ""
      }
    

    this.SettingAttributeBut(false)
    this.props.onOk(checkedList,index,dataResult)
  }
  componentWillMount(){
    const {  data, index } = this.props;
    if(data && data.length && data[index]){

      this.checkedListChangeFn(data[index])
    }
  }
  componentWillReceiveProps(nextProps){
    console.log(nextProps,"next")
    this.checkedListChangeFn(nextProps.data[nextProps["index"]])
  }

  render() {
    const {isShowSettingAttribute,checkedList,isShowRelativeDate} = this.state;
    const { data, index,benchmarkDate } = this.props;
    // const { newWindowSize, name } = setData;
    // console.log(data,index)
    return (
      <div style={{display:"inline-block "}}>

      <Tooltip title="设置">
        <i className="icon iconfont icon-setup cursor-pointer delete-btn"
          onClick={()=>{this.SettingAttributeBut(true)}}
        ></i>
      </Tooltip>
        {
          isShowSettingAttribute && <SettingAttribute 
          checkedList = {checkedList}
          onOk = {this.onOk}
          isShowRelativeDate = {isShowRelativeDate}
          benchmarkDate={benchmarkDate}
          data={data[index]}
           />
        }      
        </div>
    );
  }
}

class SettingAttribute extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fieldOperationbclass: true,
      checkedList:this.props.checkedList,
      RelativeDateForRange:this.props.RelativeDateForRange,
      ContextFormat:this.props.ContextFormat,
      DateFormat:this.props.DateFormat,
      isSliceTime:false,
      CurrentPeriodAndAllPeriod:"none",
      rangeDisplaynone:"none"
    };
    this.onChangeCheckedListFn = this.onChangeCheckedListFn.bind(this);
    this.onChangeRelativeDate = this.onChangeRelativeDate.bind(this);
    this.onChangeDateFormat = this.onChangeDateFormat.bind(this);
    this.onSliceTime = this.onSliceTime.bind(this);
    this.onDisplaynone = this.onDisplaynone.bind(this);
    this.onChangeContextFormat=this.onChangeContextFormat.bind(this);
  }
  onChangeCheckedListFn(data){
    this.setState({checkedList:data})
 
  }
  onChangeRelativeDate(value){
    console.log(value)
    this.setState({RelativeDateForRange:value})

  }
  onChangeDateFormat(value){
    console.log(value)
    this.setState({DateFormat:value})

  }
  onSliceTime(value){
    console.log(value)
    if(value){
      this.setState({CurrentPeriodAndAllPeriod:value})
    }

  }
  onDisplaynone(value){
    console.log(value)
    if(value){
      this.setState({rangeDisplaynone:value})
    }

  }
  onChangeContextFormat(value,options){
    console.log(value)
    this.setState({ContextFormat:{
         key:value,
         value:options.props.itemValue
    }})
}
  componentDidMount(){
    
    const { checkedList,data} = this.props;
    let isShowRelativeDateForRange = false
    let isShowDatePickerFormat = false
    let RelativeDateForRange = 0
    let DateFormat = 0
    let isSliceTime = false;
    let CurrentPeriodAndAllPeriod =null
    let rangeDisplaynone =null
    let ContextFormat={
      "key":"none",
      "value":"none" //默认无
   }
   let isShowContextFormat=false;
   const isDate=(data.referenceInfo && (data.referenceInfo.type === "range"  && data.referenceInfo.rangeType === 'month') ) ? true :false;
    if(isDate){ 
      isShowRelativeDateForRange = true
      RelativeDateForRange = data.referenceInfo.relativeDate?data.referenceInfo.relativeDate:"none"
    }
    if(data.referenceInfo && (data.referenceInfo.type === "range")){
      CurrentPeriodAndAllPeriod= data.dataType.indexOf("CurrentPeriodAndAllPeriod")!=-1?"CurrentPeriodAndAllPeriod":"none"
      rangeDisplaynone= data.referenceInfo.rangeDisplaynone?data.referenceInfo.rangeDisplaynone:"none"
      isSliceTime=true
    }
    if(data.dataType=="date"  || (data.referenceInfo && data.referenceInfo.content && data.referenceInfo.content.openCalendar)){
      isShowDatePickerFormat = true
      DateFormat=data.DateFormat?data.DateFormat:'YYYY-MM-DD'
    }
    if(data.operation!="range_all" && !isDate){
      isShowContextFormat=true;
      if(data.ContextFormat && data.ContextFormat.key)ContextFormat=data.ContextFormat;
   }
    this.setState({
      checkedList,
      isShowRelativeDateForRange,
      isShowDatePickerFormat,
      DateFormat,
      RelativeDateForRange,
      isSliceTime,
      CurrentPeriodAndAllPeriod,
      rangeDisplaynone,
      ContextFormat:ContextFormat,
      isShowContextFormat:isShowContextFormat
    })
  }
  render() {
    const { checkedList,RelativeDateForRange,isShowRelativeDateForRange,isShowDatePickerFormat,DateFormat,isSliceTime,CurrentPeriodAndAllPeriod,rangeDisplaynone,ContextFormat,isShowContextFormat } = this.state;
    const {benchmarkDate}=this.props;
    // const { newWindowSize, name } = setData;
    return (<div className="actionModal-toolContent setting-board-ant-collapse-content setting-board">

        <App 
          checkedList={checkedList}
          onChangeCheckedListFn={this.onChangeCheckedListFn}
          isShowRelativeDate = {this.props.isShowRelativeDate}
        />
        {
          isShowRelativeDateForRange ?
          <SettingRelativeDate
            onChange={this.onChangeRelativeDate}
            value={RelativeDateForRange}
           />
           :null
        }
         {
          isShowContextFormat?
             <ContextFormatSetting
                onChange={this.onChangeContextFormat}
                value={ContextFormat.key}
            /> 
          : null
        }
        {
          /*isSliceTime?
          <SliceTime 
          onSliceTime={this.onSliceTime} 
          value={CurrentPeriodAndAllPeriod} />
          :null 天雨说一个项目上有使用，以后这个功能不会再用了*/
        }
        {
          isSliceTime?
          <Displaynone
          onDisplaynone={this.onDisplaynone} 
          value={rangeDisplaynone}
          />
          :null
        }
        {
          isShowDatePickerFormat ?
          <DatePickerFormat
            onChange={this.onChangeDateFormat}
            value={DateFormat}
            />
          :null
        }
        {
        benchmarkDate ? <div>
          后台基准日期：{benchmarkDate}
        </div> :null
      }
        <b className="close-but" onClick={()=>{
          this.props.onOk(checkedList,RelativeDateForRange,DateFormat,CurrentPeriodAndAllPeriod,rangeDisplaynone,ContextFormat)}}>
          <Icon type="arrow-right" />
        </b>


    </div>);
  }
}



// export default SettingComponent;
export {SettingAttribute, SettingComponent}