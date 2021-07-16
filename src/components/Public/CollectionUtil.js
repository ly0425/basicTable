import { momentDate,CustomDate,timeChange } from './ConditionComponent/Operations';

class CollectionUtil {
  static contains = (arr, obj, key) => {
    let i = arr.length;
    if (i == 0) return false;
    while (i--) {
      if (arr[i][key] && obj[key] && arr[i][key].toLowerCase() === obj[key].toLowerCase()) {
      // if (arr[i][key] === obj[key]) {
        return true;
      }
    }
    return false;
  }
  static remove = (arr, val) => {
    const index = arr.indexOf(val);
    if (index > -1) {
      arr.splice(index, 1);
    }
  };

  static removeByAttributeName = (objectList, attributeName, value) => {
    let index = 0;
    for (let i = 0; i < objectList.length; i++) {
      if (objectList[i][attributeName] == value) {
        index = i;
        break;
      }
    }
    objectList.splice(index, 1);
  };


  static getItemByAttributeName = (objectList, attributeName, value) => {
    if (objectList == null || objectList.length == 0) {
      return null;
    }
    const index = 0;
    for (let i = 0; i < objectList.length; i++) {
      if (objectList[i][attributeName] == value) {
        return objectList[i];
      }
    }
    return null;
  };
  static modifyItemByAttributeName = (objectList, attributeName, value1, newAttribute, value2) => {
    const index = 0;
    for (let i = 0; i < objectList.length; i++) {
      if (objectList[i][attributeName] == value1) {
        objectList[i][newAttribute] = value2;
      }
    }
  };

  static unique(arr) {
    const res = [];
    const json = {};
    for (let i = 0; i < arr.length; i++) {
      if (!json[arr[i]]) {
            res.push(arr[i]);
            json[arr[i]] = 1;
          }
    }
    return res;
  }
  // －－添加－－－
  static filterArr(data = [],conditionInfo=null,benchmarkDate) {
    let _data = JSON.stringify(data);
    _data = JSON.parse(_data);
    let newDataValue = _data.filter((item) => {
      // if ((item.values !== '' && item.values != null) || item.groupInfo) { //条件组空的也需要
        if(item.referenceInfo){
          if ( item.referenceInfo.type === 'ref') {
             const {content}=item.referenceInfo
             if(content && (content.displayField == content.field)){ //BI-2296
                  const isArr = Array.isArray(item.values);
                  if (isArr) {
                    const vaules = item.values.map(item => item.key);
                    // console.log(vaules,"---=")
                    item.values = vaules.join(',');
                    if(item.operation=="in" || item.operation=="notin"){
                      item["valueArray"] = vaules;
                    }
                  }
            }
          }
        }
        // console.log(item)
        return item;
      // }
    });
    newDataValue = newDataValue.length ? conditionsModal(newDataValue,conditionInfo,benchmarkDate) : newDataValue;
    return newDataValue;
  }
}
const conditionsModal = (data,conditionInfo=null,benchmarkDate) => {
  let newDataValue = data;
  let del = false;
  let index = null;
  data.forEach((itemf) => {
    let {dataType, values, operation , fieldName} = itemf;
    if (conditionInfo && conditionInfo['fieldName'] === fieldName && operation === '='){
        if(conditionInfo['dateBackNumber']){
          dateBack(itemf, conditionInfo['dateBackNumber'],benchmarkDate)
        }
      //单日历
    }else if(conditionInfo && conditionInfo.referenceInfo && conditionInfo.referenceInfo.content && conditionInfo.referenceInfo.content.isSingleCalendar){
      //dateBackForSingleCalendar(itemf, conditionInfo['dateBackNumber'],benchmarkDate)    
    }
    data.forEach((item, i) => {
      if (itemf.comments == item.comments && item.operationNew && itemf.values && !itemf.operationNew && itemf.index == item.index) {
        del = true;
        index = i;
      }
    });
  });
  if (del) {
    newDataValue = data.filter((item, i) => {
      return i != index;
    });
  }
  console.log(newDataValue,'conditionsModal');
  return newDataValue;
};

const dateBack = (itemf, dateBackNumber,benchmarkDate) => {
  const {  values, operation, referenceInfo, dataType } = itemf;
  let type = referenceInfo?referenceInfo.type:dataType;
  itemf.operation = 'range_all';
  let newval = values;
  if(itemf.relativeDate && dateBackNumber){
    newval = CustomDate["RelativeDateChangeDate"](values,benchmarkDate);
  }
  itemf.values = `${timeChange(type, dateBackNumber, newval)},${newval}`;
  console.log(itemf, 'itemf');
};
//单日历
const dateBackForSingleCalendar=(itemf, dateBackNumber,benchmarkDate) => {
  const {  values , referenceInfo, dataType,valueArray } = itemf;
  const {rangeType,content}=referenceInfo;
  let type=null;
  if(rangeType =="half_year"){ //半年

  }else if(rangeType =="month"){ //年月
     type="yearMonth";
  }else if(rangeType =="quarter"){ //季度

  }else if(rangeType =="year"){ //年

  }
  if(valueArray && valueArray.length && type){
    itemf.valueArray[0]=timeChange(type, dateBackNumber, valueArray[0]);
  }
  itemf.values=itemf.valueArray.join(",");
};

// const timeChange = (type, dateBackNumber = 0, values) => {
//   let gettime = new Date(values);
//   switch (type) {
//     case 'year':
//       gettime = values - dateBackNumber;
//       break;
//     case 'month':
//       gettime = values - dateBackNumber;
//       break;
//     case 'yearMonth':
//       gettime = momentDate('YYYY-MM', gettime.setMonth(gettime.getMonth() - dateBackNumber));
//       break;
//     case 'date':
//       gettime = momentDate('YYYY-MM-DD', gettime.getTime(values) - dateBackNumber * 24 * 3600000);
//       break;

//   }
//   return gettime;
// };


export default CollectionUtil;
