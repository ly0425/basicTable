
// －－－－－－－－－不等式条件，统一变量－－－－－－5/8－－－－－
import moment from 'moment';
// import { renderTree } from '~/actions/modelManagerAction';

const Operation = {
  '=': '等于',
  '>': '大于',
  '<': '小于',
  '<>': '不等于',
  '>=': '大于等于',
  '<=': '小于等于',
  // "range_all": "区间于", 联动不需要区间这个操作符 modify by kxl 20180206
};

const intOperation = {
  '=': '等于',
  '>': '大于',
  '<': '小于',
  '<>': '不等于',
  '>=': '大于等于',
  '<=': '小于等于',
  'range_all': '区间于',
  'in': '包含',
  'notin': '不包含',

};
const dateOperation = {
  '=': '等于',
  '>': '大于',
  '<': '小于',
  '>=': '大于等于',
  '<=': '小于等于',
  "range_all": '区间于',

};
const stringOperation = {
  '=': '等于',
  '<>': '不等于',
  'll': '左匹配',
  'rl': '右匹配',
  'like': '模糊匹配',
  'in': '包含',
  'notin': '不包含',
};
const booleanANDfloatOperation = {
  '>': '大于',
  '<': '小于',
  '>=': '大于等于',
  '<=': '小于等于',
  "range_all": '区间于',
};
// －－实体－－－
const entityOperation = {
  '=': '等于',
  '<>': '不等于',
  in: '包含',
  notin: '不包含',
};
const dateTree = {
  '=': '等于',
  '<>': '不等于',
}
// －－varchar－－－
const varcharOperation = {
  '=': '等于',
  '<>': '不等于',
  ll: '左匹配',
  rl: '右匹配',
  like: '模糊匹配',
  in: '包含',
  not_in: '不包含',
};

const customDate = {
  // Y: '年',
  M: '月',
  d: '天',
  h: '时',
  m: '分',
};
const customYear = {
  Y: '年',
};
const customMonth = {
  M: '月',
};
const levelLinkage = {
  '=': '等于',
  '<>': '不等于',
}
const remindCustomeFn  = (param)=>{
  let obj = {
    Y: '今年',
    M: '本月',
    d: '今天',
    h: '当前小时',
    m: '当前分钟',
  }
  let obj2 = {
    Y: '年',
    M: '个月',
    d: '天',
    h: '小时',
    m: '分钟',
  }
  return obj2[param]
}
// 特殊区间
const customRange = {
  "range_all": '区间于',
  '=': '等于',
}
/** 取当前账套编码 */
const getCurrentCopyCode=()=>{
   if(window.app && window.app.getContextInfo){
         return app.getContextInfo().copy.code;
    }else {
       return "false";
    }
  
}
/** 取当前账套名称 */
const getCurrentCopyName=()=>{
  if(window.app && window.app.getContextInfo){
      return app.getContextInfo().copy.name;
 }else {
    return "false";
 }
}
const getContextFormatForOption=()=>{
  const CurrentUser=(window.app && window.app.getCurrentUser) ? window.app.getCurrentUser() : {
     compCode:"false",
     compName:"false",
     id:"false",
     name:"false" 
  };

  const contextFormatForOption= [
      {
         key: 'currentLoginOrganizationCode',
         label:"当前登录组织编码",
         value:"当前登录组织编码"
         //value:CurrentUser.compCode
      },
      {
         key: 'currentLoginOrganizationName',
         label:"当前登录组织名称",
         value:"当前登录组织名称",
         //value:CurrentUser.compName
      },
      {
         key: 'currentLoginUserCode',
         label:"当前登录用户编码",
         value:"当前登录用户编码", 
         //value:CurrentUser.id
      },
      {
         key: 'currentLoginUserName',
         label:"当前登录用户名称",
         value:"当前登录用户名称", 
         //value:CurrentUser.name
      },
      {
        key: 'currentLoginCopyCode',
        label:"当前登录账套编码",
        value:"当前登录账套编码", 
        //value:getCurrentCopyCode()
     },
     {
        key: 'currentLoginCopyName',
        label:"当前登录账套名称",
        value:"当前登录账套名称",  
        //value:getCurrentCopyName()
     },
      /*{
         key: 'currentLoginTime',label:"当前登录时间",
         value:""
      },*/
      {
         key: 'none',
         label:"无",
         value:"none"
      }
  ]
  return contextFormatForOption;
}
// －－－－－－－customdate－－－－－－－－
const customdateOperation = (def)=>{
  let operation = "M";
  if(def == "year"){
    operation = "Y";
  }
  return {
    operation: operation,
    customDate: { value: 'customDate', label: '最近数据查询' },
  };
}

// －－－－－－－dataType进行区分显示选择不同的参数样式方法－－－－－－－－

const OperationTypeFn = (type) => {
  let operations = {};
  // console.log(type,"type")
  let {referenceInfo} = type;
  if(type.levelLinkage){
    operations=levelLinkage;
  }
  else{

    if (type.customDate) {
      if(referenceInfo){
        if (referenceInfo.type == "yearMonth" || referenceInfo.type == "month" ){
          operations = customMonth;
        }else if (referenceInfo.type == "year"){
          operations = customYear;
        }else if(referenceInfo.type == "range"){ // 特殊区间
          operations=customRange;
        }
      }else{
        operations = customDate;
      }
    }else{

      if (type.signColumn && type.dataType.toLowerCase() === 'string') {
       operations = entityOperation;
      }else if(referenceInfo && referenceInfo.type!="dateTree" && referenceInfo.type!="ref"){
      if (referenceInfo.type == "yearMonth" || referenceInfo.type == "month" || referenceInfo.type == "year"){
        operations = dateOperation;
      }
     }
      else {
       switch (type.dataType) {
         case 'varchar':
           operations = stringOperation;
           break;
         case 'int':
           operations = intOperation;
           break;
         case 'date':
           operations = dateOperation;
           break;
         case 'datetime':
           operations = dateOperation;
           break;
         case 'boolean':
           operations = booleanANDfloatOperation;
           break;
         case 'float':
           operations = booleanANDfloatOperation;
           break;
         case 'entity':
           operations = entityOperation;
           break;
         case 'dateTree':
           operations = dateTree;
           break;
         default:
           operations = stringOperation;
       }
     }
    }
  }
  return operations;
};

const dateTimeChange = (operation, dateBackNumber, baseDate=0) => {
  let gettime = new Date();
  if(baseDate){
    return timeChange(operation, dateBackNumber, baseDate)
  }else{
    switch (operation) {
      case 'year':
        gettime = gettime.getFullYear();
        break;
      case 'month':
        gettime = gettime.getMonth()+1;
        break;
      case 'yearMonth':
        gettime = momentDate('YYYY-MM', gettime);
        break;
     case 'yearMonthDay':
          gettime = momentDate('YYYY-MM-DD', gettime);
          break;
      default :
        gettime = momentDate('YYYY-MM-DD HH:mm:ss',gettime)
        break;
    }
  }

  return gettime;
};
// －－－－－－－时间转换－－－－－－－－
const timeChange = (type, dateBackNumber = 0, values) => {
  console.log(type,dateBackNumber,values,"dateBackNumber")
  let gettime = values?new Date(values):new Date();
  switch (type) {
    case 'year':
      gettime = values - dateBackNumber;
      break;
    case 'month':
      gettime = values - dateBackNumber;
      break;
    case 'yearMonth':
      gettime = momentDate('YYYY-MM', gettime.setMonth(gettime.getMonth() - dateBackNumber));
      break;
    case 'yearMonthDay':
      gettime = momentDate('YYYY-MM-DD', gettime.setMonth(gettime.getMonth() - dateBackNumber));
      break;
    case 'date':
      gettime = momentDate('YYYY-MM-DD HH:mm:ss', gettime.getTime(values) - dateBackNumber * 24 * 3600000);
      break;
    case 'M':
      gettime = momentDate('YYYY-MM-DD HH:mm:ss', gettime.setMonth(gettime.getMonth(values) - dateBackNumber))
      break;
    case 'd':
        gettime = momentDate('YYYY-MM-DD HH:mm:ss', gettime.getTime(values) - dateBackNumber * 24 * 3600000);
      break;
    case 'h':
        gettime = momentDate('YYYY-MM-DD HH:mm:ss', gettime.getTime(values) - dateBackNumber * 3600000);
      break;
    case 'm':
        gettime =momentDate('YYYY-MM-DD HH:mm:ss', gettime.getTime(values) - dateBackNumber * 60000);
      break;
  }
  return gettime;
};
const momentDate = (formatType, date = null) => {
  let newDate = new Date();
  if (date) {
    newDate = new Date(date);
  }
  return moment(newDate).format(formatType);
};

// 相对日期  这个符号不能前端写的原因是，显示会有偏差
let relativeDateChange =[
  [
    {key:"yearMonth",value:"yearMonth",label:"本月"},
    {key:"lastYearMonth",value:"lastYearMonth",label:"上月"},
    // {key:"nowYearMonth",value:"nowYearMonth",label:"当年"}  不知道干什么的 影响发版
  ],
  [
    {key:"yearMonth",value:"yearMonth",label:"本月"},
    {key:"lastYearMonth",value:"lastYearMonth",label:"上月"}
  ],
  [
    {key:"month",value:"month",label:"本月"},
    {key:"lastMonth",value:"lastMonth",label:"上月"}
  ],
  [
    {key:"today",value:"today",label:"今天"},
    {key:"yesterday",value:"yesterday",label:"昨天"},
    {key:"beforeYesterday",value:"beforeYesterday",label:"前天"},
  ],
    [{key:"year",value:"year",label:"今年"},
    {key:"lastYear",value:"lastYear",label:"去年"}
  ],
]



const dateFormat = {
  date: 'YYYY-MM-DD HH:mm:ss',
  yearMonth: 'YYYY-MM',
  yearMonthDay:'YYYY-MM-DD'

};
const dateFormatForDatePicker = [
  {
    key: 'YYYY-MM-DD HH:mm:ss',label:"日期时分秒"
  },
  {
    key: 'YYYY-MM-DD',label:"日期"
  },
  // {
  //   key: 'YYYY-MM',label:"月"
  // }
]


//有关range_all的公用处理方法数据状态'a,b'||',a'=>''||'a,'=>'';返回数据

const range_all_dataFn =(values)=>{
  if(typeof values=="string"){

    return values = (values.match('undefined') || values.endsWith(',') || values.startsWith(',')) ? '' :
    (values.match(',') ? values.length ? values : ''
    : `${values},${values}`);
  }else{
    return values
  }
}

// 动态处理同比问题
const yearOverYearValuesFn  = (item,arr) =>{
  let oneVal = arr[0];
  if(item.referenceInfo && item.referenceInfo.type == "range" && item.referenceInfo.rangeComparison=="yearOverYear"){
    if(item.referenceInfo.rangeType == "month"){
         oneVal = `${arr[0].split('-')[0]}-${arr[1].split('-')[1]}`
    }else{
      if(arr[1] && arr[1].split('/').length>1 && arr[0] && arr[0].split('/').length){
         oneVal = `${arr[0].split('/')[0]}/${arr[1].split('/')[1]}`
      }
    }
  }
  return oneVal
}
//同比环比，给图标用
let rangeComparison = {
  yearOverYear:"yearOverYear",
  origin:"origin",
  Chain:"Chain"
}
// 自定义日期累，其中包含相对日期转换方法
class CustomDate {
  static RelativeDateChangeDate = (str,benchmarkDate=null,format='YYYY-MM') =>{
    let date = str
    let datebase =benchmarkDate ? new Date(benchmarkDate):new Date()
    let newdate = benchmarkDate ? benchmarkDate:new Date()
    console.log(datebase,"datebase",str)
    switch(str){
      case "yearMonth":
          newdate = new Date(datebase.getFullYear(), datebase.getMonth()+1,  0);
      break;
      case "lastYearMonth":
           newdate = new Date(datebase.getFullYear(), datebase.getMonth(),  0);
      break;
      case "today":
           newdate = datebase;
      break;
      case "yesterday":
           newdate = new Date(datebase.getTime()-24*60*60*1000);
      break;
      case "beforeYesterday":
           newdate = new Date(datebase.getTime()-24*60*60*1000*2);
      break;
      case "year":
           newdate = datebase.getFullYear()
      break;
      case "lastYearMonth":
           newdate = datebase.getFullYear()-1

      break;
    }
    date = momentDate(format,newdate);
    return date
  }

}
const dateBackForLinkFn = (values,benchmarkDate,format,dateBackNumber=11) =>{
  console.log(values,"values--")
  if(!format){
    format='YYYY-MM'
  }
  if(values=="nowYearMonth"){
    let datebase =   benchmarkDate ? new Date(benchmarkDate):new Date();
    if(datebase.getMonth()+1<4){

      let one = CustomDate["RelativeDateChangeDate"]("lastYearMonth",benchmarkDate,format);
      console.log(values,timeChange("yearMonth", dateBackNumber, one),one)

      return `${timeChange("yearMonth", dateBackNumber, one)},${one}`;
    }else{
      let one = new Date(datebase.getFullYear(), datebase.getMonth(),  0)
      console.log(one,"one")

      return `${datebase.getFullYear()}-01,${momentDate(format,one)}`
    }
  }else{
    if(values!="none"){
      let one = CustomDate["RelativeDateChangeDate"](values,benchmarkDate,format);
      console.log("one",one,momentDate(format,one),format)
      return `${timeChange("yearMonth", dateBackNumber, one)},${momentDate(format,one)}`;
    }
  }

}
const dashboardModelConditionFn = (data)=>{
  for(var i=0;i<data.length;i++){
    if(data[i].referenceInfo && data[i].referenceInfo.relativeDate && data[i].referenceInfo.relativeDate=="nowYearMonth"){
      console.log(data[i],"------d--------")
      data[i].values=dateBackForLinkFn("nowYearMonth",null,'YYYY-MM',11)
      return
    }
  }
  console.log(data,"----------------")
return
}



export default OperationTypeFn;
export {
  Operation,
  dateTimeChange,
  momentDate,
  dateFormat,
  dateFormatForDatePicker,
  range_all_dataFn,
  customdateOperation,
  timeChange,
  remindCustomeFn,
  yearOverYearValuesFn,
  rangeComparison,
  relativeDateChange,
  CustomDate,
  dateBackForLinkFn,
  dashboardModelConditionFn,
  getContextFormatForOption
 }
;
