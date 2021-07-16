import NetUitl from '/src/containers/HttpUtil';
import {_analysisModel} from './AnalysisModelFn';

//删除分析模型条件
const deleteAnalysisCondition  = (excondition) => {
       if(excondition && excondition.id){
               NetUitl.post("/condition/delete/",{"id":excondition.id},function(data){
                     console.log(data) 
              });
       }
};
//删除分析模型条件
const deleteAnalysisConditionByTableName=(excondition,tableName)=>{
      let newFields=excondition.fields.filter((field,fieldIndex)=>{
           return !(field.tableName ==tableName || field.type =="group")
      })
      excondition.fields=newFields;
}
//获取分析模型的条件字段
const getAnalysisConditions= (callback) => {
        NetUitl.get("/condition/getall/",null,function(data){
              if(data && data.code==200){
                   callback(data.data);
              }else{
                  callback(null);
              }
        });
}; 
//获取Condition，并且合并Fields，Condition
const getAnalysisConditionsAndMergeFields  = (fields,analysisModelId,callback) => {
       getAnalysisConditions(function (conditions) {
               const excondition=getConditionByAnalysisID(conditions,analysisModelId);
               mergeFieldsAndCondition(fields,excondition.content);
               callback(fields);
       })
};

const getAliasName=(fields,tableName,fieldName)=>{
      let aliasName=null;
      if(fields){
          for(let field of fields){
                if((field.tableName ==tableName) && (field.fieldName==fieldName)){
                     return field.aliasName || field.fieldName;
                }
          }
      }
      return aliasName;
}

//合并FieldsAndCondition ccccccccccccccccc
const mergeFieldsAndCondition=(fields,excondition,isConditions)=>{//isConditions fields 是不是 Conditions？
    // console.log(fields,"mergeFieldsAndCondition",excondition)

         if(excondition && excondition.fields && excondition.fields.length > 0){
                    excondition.fields.map((conditionField,conditionFieldIndex)=>{
                         if(conditionField.type=="group"){
                             conditionField.groupFields.forEach((fiel,groupFieldIndex)=>{

                                     let field=getFieldByFieldNameGroup(fields,fiel,conditionField);
                                       if(field)field.groupInfo={
                                         "id":conditionField.id || null,
                                         "name":conditionField.name || null
                                       }
                             })

                         }else{
                            let field=getFieldByFieldName(fields,conditionField.fieldName,conditionField); //fields 会变
                              //联动字段
                              if(field && conditionField.linkageInfo){
                                   if(conditionField.linkageInfo.isNew){//兼容新版本，转换为别名
                                              const {tableName:sourceTableName,conditionFieldName:sourceConditionFieldName,filterFieldName:sourceFilterFieldName}=conditionField.linkageInfo.source;
                                              const {tableName:targetTableName,conditionFieldName:targetConditionFieldName,filterFieldName:targetFilterFieldName}=conditionField.linkageInfo.target;
                                              const _sourceFilterFieldName=getAliasName(fields,sourceTableName,sourceFilterFieldName) || sourceFilterFieldName;
                                              //const _targetConditionFieldName=getAliasName(fields,targetTableName,targetConditionFieldName) || targetConditionFieldName;
                                              //const _targetFilterFieldName=getAliasName(fields,targetTableName,targetFilterFieldName) || targetFilterFieldName;
                                              const _targetConditionFieldName=targetConditionFieldName;
                                              const _targetFilterFieldName=targetFilterFieldName; //BISSWTGL-506
                                              if(_sourceFilterFieldName && _targetConditionFieldName && _targetFilterFieldName){
                                                      field["linkageInfo"]={
                                                          source: {  //源
                                                            tableName:conditionField.tableName, // 源tableName
                                                            filterField:_sourceFilterFieldName, // 源条件
                                                            fieldName:sourceConditionFieldName,
                                                          },
                                                          target: { //目标
                                                            tableName:targetTableName, // 目标tableName
                                                            fieldName:_targetConditionFieldName,  // 目标条件 只能是参照字段
                                                            filterField:_targetFilterFieldName, // 目标字段
                                                          }
                                                      }
                                              }
                                              
                                   }else{
                                         field["linkageInfo"]=conditionField.linkageInfo;
                                   }
                                   
                              }
                              //参照字段
                              if(field && conditionField.referenceInfo){
                                  // field.referenceInfo=conditionField.referenceInfo;
                                  // if(field.referenceInfo || field.referenceInfo.type=="treeref"){
                                  if(field.referenceInfo){
                                      let referenceInfo=field.referenceInfo;
                                      referenceInfo.dataSourcekey= excondition.dataSourceID?excondition.dataSourceID:sessionStorage.getItem("dataSourceID");
                                      
                                      if(referenceInfo.content && referenceInfo.content.conditions){
                                            referenceInfo.content.conditions.map((item,itemIndex)=>{
                                                     if((item.tableName == field.tableName) && (item.fieldName == field.fieldName)){
                                                            item.referenceInfo=deepCopyUseJSON(referenceInfo);
                                                     }
                                            })
                                      }
                                  }
                              }
                              if(!isConditions){
                                  //日期级次字段
                                  if(!field && conditionField.dateTree=="dateTree"){
                                      fields.push({
                                        ...conditionField,
                                        analysisModelId:fields[0]?fields[0].analysisModelId:"",
                                        dataType:"dateTree",
                                        fieldName:"dateTree_$Gradation"
                                      });
                                  }
                                  //期间字段
                                  if(!field && conditionField.dateLevel=="dateLevel"){
                                      fields.push({
                                        ...conditionField,
                                        analysisModelId:fields[0]?fields[0].analysisModelId:"",
                                        dataType:"dateLevel",
                                        fieldName:"dateLevel_$Period"
                                      });
                                  }
                            }
                         }
                    })
         }
         
}
//使用fieldName，getField
const getFieldByFieldName=(fields,fieldName,conditionField)=>{
  if(fields && fields.length){
    for (let field of fields){

      // console.log(fields,field.aliasName ,fieldName,conditionField.tableName,field.tableName,"-------")
      if( (fieldName ==field.aliasName || fieldName ==field.fieldName ) && field.tableName==conditionField.tableName){
        // console.log("--t-----")
        if(!conditionField.referenceInfo){
          delete field.referenceInfo
        }else{

          //field.referenceInfo = conditionField.referenceInfo; 
          //需要兼容天雨同级目录加的rangeType rangeComparison等 

           if(field.referenceInfo)
              {
                field.referenceInfo.type =conditionField.referenceInfo.type;
                field.referenceInfo.content=conditionField.referenceInfo.content;
             }else{
                field.referenceInfo = conditionField.referenceInfo;
             }
        }

        return field
      }

      // else{
      //   console.log("--f-----")

      //   if(field.referenceInfo){
      //     delete field.referenceInfo
      //     return field
      //   }
      // }
    }
  }
}
const getFieldByFieldNameGroup=(fields,fiel,conditionField)=>{
  if(fields && fields.length){
    if(!fiel.tableName){ //兼容老版本
      for (let field of fields){ 
        if( fiel ==field.aliasName || fiel ==field.fieldName ){
           return field;
        }
       }
    }else{
        for (let field of fields){ 
          if( (fiel.tableName ==field.tableName) && (fiel.fieldName ==field.fieldName) ){
             return field;
          }
         }    
    }
    
  }
}
//去重
const uniqueExcondition=(fields)=>{
    if(fields){
     var result = [];
     var obj = {};
     for(var i =0; i<fields.length; i++){
           const item=fields[i];
           let key=item.fieldName;
           if(item.tableName){
               key+="&"+item.tableName;
           }
           if(!obj[key] ){
              result.push(item);
              obj[key] = true;
          }
     }
     return result;
   }else{
     return fields;
   }
}
//用分析模型id获取分析模型条件
const getConditionByAnalysisID=(conditions,analysisID)=>{
        let excondition=null;
        let id=null;
        try{
             conditions.map((condition,conditionIndex)=>{
                    if(condition.analysis_module_id == analysisID && condition.is_remove!=1){
                         excondition=JSON.parse(condition.content); 
                         excondition.fields=uniqueExcondition(excondition.fields); 
                         id=condition.id;
                    }
             })
        }catch(error){

        }
        return {"id":id,"content":excondition};
}

//更新分析模型条件
const updateAnalysisCondition  = (excondition,analysis_module_id) => {
        // console.log(excondition,"excondition")
       if(excondition && excondition.fields){
              const param={
                        "analysis_module_id":analysis_module_id,
                        "content":JSON.stringify(excondition)
              }
              if(excondition.id){ //update
                     NetUitl.post("/condition/update", {
                        "id":excondition.id,
                        ...param
                      }, function(data) {
                            console.log(data)
                    });
              }else{
                    NetUitl.post("/condition/add", param, function(data) {
                            console.log(data)
                    });
              }
          }
};

//原有分析模型字段要和另一张表的参照信息合并，得到新的分析模型字段(判断是否发"/condition/getall/"请求)wangyuzhen
const mergeAnalysisFieldsAndReference = (data, analysisModelFields, analysisModelId, callback) => {
    if (data.data.conditionModel) { //如果有conditionModel就不用再发请求
      let conditionModel = JSON.parse(data.data.conditionModel); //分析模型保存的另一张表的参照表信息
      //原有分析模型字段要和另一张表的参照信息合并，得到新的分析模型字段
      mergeFieldsAndCondition(analysisModelFields, conditionModel);
      callback(analysisModelFields);
    } else {
      getAnalysisConditionsAndMergeFields(analysisModelFields, analysisModelId, function (analysisModelFields) {
        callback(analysisModelFields);
      })
    }
}

class analysisConditionModel {
  //清空级次字段 参照字段 等 对应setReferenceInfo
  static clearReferenceInfo(excondition,currentField,tableName,editModel){
            if(excondition){
                let fields=excondition.fields;
                if(fields.length > 0){
                      for (let i=fields.length-1;i>=0;i--){
                            const field=fields[i];
                            if(field.tableName==tableName && ( field.fieldName ==currentField )){
                                if(field.linkageInfo){ //有联动管理
                                    if(field.referenceInfo) delete field.referenceInfo; //写死了，需要优化
                                }else{
                                    fields.splice(i,1); 
                                }
                                
                            }
                      }
                }

          }
          _analysisModel.updateClearReferenceInfo(editModel); //这里的也要清掉
          console.log(excondition.fields,"777777777777777")
  }
  //设置级次字段 参照字段 等
  static setReferenceInfo(excondition,result,aliasName,currentField,tableName){
          //type="treeref" 级次字段  "ref"，参照字段，"year" 年，"mouth" 月，"yearmouth" 年月，"day" 天
          // console.log(excondition,result,aliasName,currentField,tableName)
          if(excondition){
                let fields=excondition.fields;
                let thisField={
                         tableName:tableName,
                         fieldName: currentField,
                         referenceInfo:result
                      }; //当前的字段
                for (let i=fields.length-1;i>=0;i--){
                     const field=fields[i];
                     if( (field.tableName==tableName && (field.fieldName==currentField))){
                            if(field.linkageInfo){ //写死了，需要优化
                                      thisField.linkageInfo=field.linkageInfo;//联动管理
                            } 
                            fields.splice(i,1); //删除这个，thisField替换
                     } 
                }
                //fields.concat([thisField]);
                fields.push(thisField);
          }
        console.log(excondition.fields,"excondition.fields")

  }
  //获取 type，参考上方
  static getReferenceInfoType(excondition,currentField,tableName){
         if(excondition && excondition.fields){
             let fields=excondition.fields;
             for(let field of fields){
                 if((tableName ==field.tableName) && (field.fieldName==currentField)){
                        if(field.referenceInfo) return field.referenceInfo.type;
                 }
             }
         }
        return null;
  }
  //联动设置
  static updateLinkageSetting(excondition,result) {
         if(excondition){
             let fields=excondition.fields;
             for (let i=0;i<fields.length;i++){
                    const field=fields[i];
                    if(field.linkageInfo)delete field.linkageInfo; //清空联动
              }
             result.map((item,itemIndex)=>{
                   const {tableName ,conditionFieldName }=item.source;
                   if(fields.length == 0){
                       addLinkageSetting(fields,item);
                   }else{
                       for (let i=0;i<fields.length;i++){
                                const field=fields[i];
                                if((field.fieldName==conditionFieldName) && (field.tableName==tableName)){
                                      field.linkageInfo=item;
                                      break;
                                }else if(i==fields.length -1){
                                      addLinkageSetting(fields,item);
                                }
                       }
                   }
             })
         }
         function addLinkageSetting(fields,item){
                      const {tableName ,conditionFieldName }=item.source;
                       fields.push({
                         tableName:tableName,
                         fieldName:conditionFieldName,
                         linkageInfo:item
                      })
         }
  }
  //条件组设置
  static updateFieldGroupSetting(excondition,result) {
        if(excondition){
             let oldFields=excondition.fields;
             let fields=oldFields.filter((field,fieldType)=>{
                    return field.type!="group";
             })
             result.map((item,itemIndex)=>{
                   fields.push({
                       fieldName:"group"+item.id,
                       type:"group",
                       ...item
                   })
             })
             excondition.fields=fields;
         }
        //  console.log(excondition.fields,"xcondition.fields")
  }
  //条件组设置
  static updateDateTreeSetting(excondition,result,tableName) {
        if(excondition){
             let oldFields=excondition.fields;
             let fields=oldFields.filter((field,fieldType)=>{
                    return !(field.dateTree=="dateTree" && field.tableName ==tableName);
             })
             fields.push({
                 tableName:tableName,
                 //fieldName:"dateTree"+result.id,
                 fieldName:'dateTree_$Gradation',
                 ...result
             })
             excondition.fields=fields;
         }
  }
  //条件组设置
  static deleteDateTreeSetting(excondition,result,tableName) {
      // console.log(excondition,result,tableName)
        if(excondition){
             let oldFields=excondition.fields;
             let fields=oldFields.filter((field,fieldType)=>{
                    return !(field.dateTree=="dateTree" && field.tableName ==tableName);
             })
             excondition.fields=fields;
         }
  }
   //条件组设置
  static updateRangeSetting(excondition,result,tableName) {
        if(excondition){
             let oldFields=excondition.fields;
             let fields=oldFields.filter((field,fieldType)=>{
                    return !(field.dateLevel=="dateLevel" && field.tableName ==tableName);
             })
             fields.push({
                 tableName:tableName,
                 fieldName:'dateLevel_$Period',
                 //fieldName:"dateLevel"+result.id,
                 ...result
             })
             console.log(fields)
             excondition.fields=fields;
         }
  }
  //条件组设置
  static deleteRangeSetting(excondition,result,tableName) {
      // console.log(excondition,result,tableName)
        if(excondition){
             let oldFields=excondition.fields;
             let fields=oldFields.filter((field,fieldType)=>{
                    return !(field.dateLevel=="dateLevel" && field.tableName ==tableName);
             })
             excondition.fields=fields;
         }
  }

}
const deepCopyUseJSON = (value) => {
  let newValue = JSON.stringify(value);
  newValue = JSON.parse(newValue);
  return newValue;
};
const analysisDataSourceTypeFn =(type)=>{
      //前后台不一致要进行匹配，吕天宇
      let typeObj={
        apis:"api",
        tables:"table",
        procs:"proc",
        proc:"proc",
        procedure:"proc" //历史问题照成前后多个类型来判断存储过程
      }
  if(type){

    return typeObj[type]
  }
  return type;
}
export {
  analysisConditionModel,
  deleteAnalysisCondition,
  deleteAnalysisConditionByTableName,
  getAnalysisConditions,
  getConditionByAnalysisID,
  updateAnalysisCondition,
  getAnalysisConditionsAndMergeFields,
  mergeFieldsAndCondition,
  mergeAnalysisFieldsAndReference,
  analysisDataSourceTypeFn
};
