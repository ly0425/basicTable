import React from 'react';
// import { Tooltip, Checkbox } from '@vadp/ui';
// import FieldOperationInputText from './FieldOperationInputText';
// －－－－－－－－引入条件参数变量-----－－－
import {  range_all_dataFn, yearOverYearValuesFn } from '../Operations';
import {dataTypeJudgeDate, rangeChangeJudge, emptyNotZero} from '../ConditionsModalCore';

  //区间类型
// const createFormItemsRange = (data, key, that, index, runtime,) => {
//     const { isShowCheckBox, isShowDelete ,mode} = that.props;
//       // －－－－－－－formItems初始化－－－－－－－－
//       if (data && data[index] && (data[index].commonUse || mode !== "plane") ){
  
//         const formItems = (
//           <div className="createFormItemsList-li createFormItemsRange">
  
//             <div className="FormItems">
//               {
//                 <FieldOperationInputText
//                 that={that}
//                 index={index}
//                 dataItem={data[index]}
//                 fieldType={"FieldSelect"}
//                 /> 
//               }
  
//             </div>
//             {
//               mode !== "plane" ? //平铺不需要设置按钮
//              <div className="op">
//                 {
//                 isShowCheckBox && <Tooltip title="设置常用项">
//                   <Checkbox
//                     checked={data[index].commonUse}
//                     className="commonUse-btn"
//                     onChange={(value) => { that.onChangeCheckbox(value, index, data, 'groupInfo'); }}
//                   />
//                 </Tooltip>
//                }
                
//                 {
//                 isShowDelete &&
//                 <i
//                   className=" icon iconfont icon-delete_o delete-btn"
//                   onClick={() => { that.props.remove(0, key); }}
//                 />
//               }
//               </div>
//               :null
//             }
//           </div>
//         );
  
//         return formItems;
//       }
//   };
  const analysisDataForInputTextFn = (obj) => {
    let type = 1;
    if (obj.referenceInfo) {
      if (obj.referenceInfo.type === 'treeref') {
        type = 3;
      } else if (obj.referenceInfo.type === 'ref') {
        type = 4;
      } else if (obj.operation && obj.operation === 'range_all' && false) {
        type = 1;
      }else if (obj.referenceInfo.type === 'dateTree') {
        type = 1;
      }
       else {
        type = 2;
      }
    } else {
      type = 1;
    }
    return type;
  };
  //year-over-year
  
 
  const conversionDataFn = (newItem) => {
    const { operation, referenceInfo, linkageInfo } = newItem;
    console.log(newItem.values,"newItem.values")
  
    if (newItem.values) {
      if (operation == 'range_all') {
        newItem.values = range_all_dataFn(newItem.values);
        if( referenceInfo && referenceInfo.rangeComparison == "yearOverYear"){
          // console.log(newItem.values)
          let arr = [];
          if(Array.isArray(newItem.values)){
            arr=newItem.values;
          }else{
            arr=newItem.values.split(",");
          }
          
          arr[0] = yearOverYearValuesFn(newItem,arr)
          newItem.values = arr.join(",")
  
        }
        if(referenceInfo && !(referenceInfo.content && referenceInfo.content.isSingleCalendar)){
          newItem.values = typeof newItem.values == "string"?newItem.values: newItem.values.join()
          // newItem.values = newItem.values.join()
        }
        //valueArray用来将区间于类型中的逗号问题进行数组区分的
        newItem["valueArray"]= newItem.values && typeof(newItem.values)=='string'? newItem.values.split(","):newItem.values
      } else if ((newItem.dataType.toLowerCase() == 'int' || dataTypeJudgeDate(newItem.dataType)) && emptyNotZero(newItem.values) && !newItem.customDate) {
        if (operation != 'in' && operation != 'notin') {
          newItem.values = rangeChangeJudge(newItem.values);
        }
      }
      if (referenceInfo) {
        const { type } = referenceInfo;
        if(type=="ref"){
          newItem["refLable"] =""
          if(newItem.values && newItem.values.length ){
            if(Array.isArray(newItem.values)){
              newItem.values.map(item=>{
                newItem["refLable"]+=item.label
              })
            }else{
              newItem["refLable"]+=newItem.values
            }
          }
          
        }
        // ZHCW-12635
        if(referenceInfo.type === 'externalReference'){
          return newItem;
        }
        if(operation !== 'range_all' && newItem && stringFn(newItem.values)){
          newItem.values = rangeChangeJudge(newItem.values);
        }
      }
  
    }
  
    return newItem;
  };
  const stringFn=(val)=>{
    return typeof val == "string"  && val.indexOf(",")>-1
  }
export {analysisDataForInputTextFn,conversionDataFn,stringFn}