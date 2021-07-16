import Message from '@/components/public/Message';
// －－－－－－－－引入条件参数变量-----－－－
import { dateTimeChange,momentDate } from '../Operations';
import { emptyNotZero, deepCopyUseJSON ,constructionData} from '../ConditionsModalCore';
import {conversionDataFn} from './GroupListFn'; 
const getConditionsTransform=(list, onOk)=>{
     //list 条件组，onOk回调函数 that 可以不传
     list = constructionData(list, [],"",true).listData;     
     submitOnOk(list,onOk);  
}
const submitOnOk = (list, onOk, that) => { 
    const newData = [];
    let newItem; // －－newitem是一个对象－－
      // －－判断是否data并且数组类型－－－
    const customData = [];
    let data = deepCopyUseJSON(list);
    data = [...data, ...customData];
    let breakSubmit = false;
    if (data && Array.isArray(data) && data.length) {
      for (const item of data) {
        if (item.required && !emptyNotZero(item.values)) {
          breakSubmit = true;
          Message.error(`${item.comments}，值不能为空！`);
          break;
        }
        if (that && that.props && that.props.type == 'procedure' && !emptyNotZero(item.values)) {
          breakSubmit = true;
          Message.error(`${item.comments}为必填项，值不能为空！`);
          break;
        }
        newItem = Object.assign({}, true, item);
        newItem.fieldName = item.fieldName;
        newItem = conversionDataFn(newItem);
  
        if (newItem.operation) {
          customDateChange(newItem)
          if(newItem.referenceInfo && newItem.referenceInfo.content && newItem.referenceInfo.content.openCalendar){
            newItem["copyDateValues"]=newItem.values
            let values = new CheckDateValues(newItem.values,newItem.referenceInfo.rangeType).copyDateValuesFn()
            console.log(values,"------")
            if(values){
              newItem.values=values
            }else{
              newItem.values=""
              breakSubmit=true
            }
            
          }
          //空数组后台处理异常
          if(newItem.values && newItem.values.length==0 && Array.isArray(newItem.values)){
              delete newItem.values;
          }
          if(newItem.referenceInfo && newItem.referenceInfo.type=="year"){
            if(newItem.valueArray)delete newItem.valueArray; //BI-2389 年字段无故多出valueArray
          }
          if(newItem.referenceInfo && newItem.referenceInfo.type=="range"){
               const vArray=newItem.valueArray;
               if(vArray && Array.isArray(vArray)){
                   if(vArray[0]=="" || vArray[1]==""){
                     breakSubmit=true;
                     Message.error(`查询条件不完整`);
                   }
               }
          }
            newData.push(newItem);
          }
  
      }
    }
    console.log(newData, 'newDatabreakSubmit完成');
    if (!breakSubmit) {
      onOk(newData);// 将数组返回给父组件
    }
  };
  //全日历显示数据处理方案

class CheckDateValues {
    isGo=true
    messageInfo="(请调整日历选择)："
    values=''
    constructor(values,type){
      this.arr = values?values.split(","):[]
      this.type = type;
      this.arr.map((item,i)=>{
        let type = "fist"
        if(i){
          type = "last"
        }
        this[`${type}Day`] = new Date(item).getDate()
        this[`${type}Month`] = new Date(item).getMonth()+1
        this[`${type}Year`] = new Date(item).getFullYear()
      })
    }
    copyDateValuesFn = () =>{
      if(!this.arr.length){
        return this.values
      }
      this.checkFullDayFn()
      if(this.isGo){
        this[`check${this.type}Fn`]()
        if(!this.isGo){
          Message.error(this.messageInfo,20,4);
        }
      }else{
          Message.error(this.messageInfo,20,4);
      }
      return this.values
    }
    checkFullDayFn = ()=>{
      if(this.fistDay!=1){
        this.messageInfoPublicFn(0,"日期")
      }
      if(this.lastDay!=this.lastDayObjFn()){
        this.messageInfoPublicFn(1,"日期")
      }
    }
    checkmonthFn = ()=>{
      this.values = `${momentDate('YYYY-MM',new Date(this.arr[0]))},${momentDate('YYYY-MM',new Date(this.arr[1]))}`
    }
    checkyearFn = ()=>{  
      if(this.fistMonth!=1){
        this.messageInfoPublicFn(0,"年初")
      }
      if(this.lastMonth!=12){
        this.messageInfoPublicFn(1,"年末")
      }
      if(this.isGo){
        this.values = `${momentDate('YYYY',new Date(this.arr[0]))},${momentDate('YYYY',new Date(this.arr[1]))}`
      }
    }
    checkseasonFn = ()=>{  
      if((this.fistMonth!=1 && this.fistMonth!=4 && this.fistMonth!=7 && this.fistMonth!=10) ||(this.lastMonth-this.fistMonth)!=2){
        this.messageInfoPublicFn(0,"季度");
        this.messageInfoPublicFn(1,"季度");
      }
      if(this.isGo){
        this.values = `${momentDate('YYYY',new Date(this.arr[0]))}/season-${(this.fistMonth+2)/3},${momentDate('YYYY',new Date(this.arr[1]))}/season-${this.lastMonth/3}`
      }
    }
    checkhalf_yearFn = ()=>{
      if(this.fistMonth!=1 && this.fistMonth!=7){
        this.messageInfoPublicFn(0,"半年")
      }
      if(this.lastMonth!=6 && this.lastMonth!=12){
        this.messageInfoPublicFn(1,"半年")
      }
  
      if(this.isGo){
        this.values = `${momentDate('YYYY',new Date(this.arr[0]))}/halfyear-${this.fistMonth==1?1:2},${momentDate('YYYY',new Date(this.arr[1]))}/halfyear-${this.lastMonth==6?1:2}`
      }
    }
  
    messageInfoPublicFn = (type,time)=>{
        this.isGo = false
        if(type){
          this.messageInfo+=`-结尾${time}不完整`;
        }else{
          this.messageInfo+=`开始${time}不完整`;
        }
    }
    lastDayObjFn= ()=>{
      let datebase = new Date(this.arr[1])
      return new Date(datebase.getFullYear(), datebase.getMonth()+1,  0).getDate()
    }
  }
  const customDateChange = (newItem,symbol=",")=>{
      // －－更换计算时间－－
    if (newItem.customDate) {
      let values = null;
      let lastValue = null;
      let gettime = null;
      newItem.operationNew = newItem.operation;
      newItem.valuesNew = !emptyNotZero(newItem.comments) ? '' : newItem.values;
      const {referenceInfo} = newItem;
        if(referenceInfo){
          lastValue = dateTimeChange(referenceInfo.type)
          values = [lastValue];
          gettime = dateTimeChange(referenceInfo.type, newItem.values,lastValue);
  
        }else{
          lastValue = dateTimeChange()
          values = [lastValue];
          gettime = dateTimeChange(newItem.operation, newItem.values, lastValue);
  
        }
        values.unshift(gettime);
  
        newItem.values = values.join(symbol);
        if (!emptyNotZero(newItem.valuesNew)) {
          newItem.values = '';
        }
        newItem.operation = 'range_all';
      }
  
  }
export {getConditionsTransform,submitOnOk,customDateChange}