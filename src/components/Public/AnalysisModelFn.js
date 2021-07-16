import {Select} from '@vadp/ui';
const Option=Select.Option;
import NetUtil from '@/containers/HttpUtil';
import { analysisModel,aliasNameFn } from './analysisModel';
import {updateEditModelByType,updateExconditionByType} from '@/actions/analysisModelNewAction';
import Message from './Message';
import copy from 'copy-to-clipboard';
const getFieldOption=(datasourceData,datasourceID,UrlType)=>{
       if(datasourceData && datasourceData.length>0){
          return datasourceData.map((item,index)=>{
          	   if(item.id==datasourceID || UrlType=="add")
               return <Option index={index} id={item.id}  key={item.id} value={item.id}>{item.name}</Option>
          })
       }else{
          return null;
       }
}

const getConditionFields=(excondition,tableName)=>{
      const exFields = excondition.fields.filter((field, fieldIndex) => {
        return (field.tableName == tableName);
      });
      return exFields.concat();
}
const  getFields=(excondition,tableList,tableName) =>{
    if(excondition && excondition.fields){
      for(let item of tableList.fieldsInfo){
        for(let item1 of excondition.fields){
          if(item.fieldName==item1.fieldName && item.tableName == item1.tableName){
            item.referenceInfo=item1.referenceInfo;
            break;
          }
        }
      }
    }
    return tableList.fieldsInfo.concat() || [];
  }
class _analysisModel {
    //分析模型修改了一些东西，conditions还是旧的，有些信息需要更新，比如别名
    static updateConditionsUseNewFields(conditions,fields,isUpdateCondition){
         if(conditions && conditions.length && fields && fields.length){
               conditions.map((cond,condIndex)=>{
                    for(let field of fields){
                      if(cond.tableName == field.tableName && (cond.fieldName == field.fieldName) && (cond.analysisModelId ==field.analysisModelId)){
                          //更新别名
                          if(field.aliasName){
                                conditions[condIndex].aliasName=field.aliasName;
                           }else{
                                if(cond.aliasName)delete conditions[condIndex].aliasName;
                           }
                           if(isUpdateCondition){
                                  //参照字段 期间字段不更新
                                  if(cond.referenceInfo && cond.referenceInfo.type && cond.referenceInfo.type=="externalReference"){

                                  }else if(field.referenceInfo){
                                        const {type}=field.referenceInfo
                                        if(type && type!="range")conditions[condIndex].referenceInfo=JSON.parse(JSON.stringify(field.referenceInfo));
                                  }else{
                                        if(cond.referenceInfo)delete cond.referenceInfo;
                                  }
                            }

                      }
                    } 
                    
               })
         }
    }
    static handleCompatible(editModel){//兼容处理 jianrong
           _analysisModel.compatibleLocaltion(editModel);
    }

    static updateEditModel(editModel){ //更新editModel 保存时更新
         this.updateLocation2(editModel);
         this.updateServiceForProc(editModel);
         this.updateClearReferenceInfo(editModel);//清掉editModel里的参照字段等
         //search(editModel,"all","");//显示全部
    }
    static updateClearReferenceInfo(editModel){//多余的referenceInfo
      if(editModel && editModel.tableList && editModel.tableList.length >0){
        for(let list of  editModel.tableList){
                  for(let table of list.fieldsInfo){
                    if(table.referenceInfo)delete table.referenceInfo;
                  }
            }    
        }
      }
    static updateServiceForProc(editModel){  //存储过程
      if(editModel.tableList && editModel.tableList.length && editModel.tableList[0].tableType =="procs")
         {
             const tableListIndex0=editModel.tableList[0];
             editModel.serviceName =tableListIndex0.displayName;

             editModel.serviceType = "proc";

         }
    }
    static compatibleLocaltion(editModel){ //兼容location 不使用style 转化为格式{width:,height:,top:,left:}
           if(editModel && editModel.tableList && editModel.tableList.length >0){
                 editModel.tableList.map((table,tableIndex)=>{ //更新位置
                       if(table.location && table.location.style){
                              const location=_analysisModel.transformStyle(table.location.style);
                              table.location={...location};
                              console.log(location,"locationlocationlocationlocationlocation")
                       }
                 })
           }
    }
    static updateLocation2(editModel){
         editModel.tableList.map((item,itemIndex)=>{ //更新位置
                const element=document.getElementById(item.tableName);
                if(element.offsetLeft==0 && element.offsetTop==0){//数据配置保存的时候，表关系配置隐藏状态下取不到真实的offsetLeft,offsetTop,这样判断不太合理，先这样吧

                }else{
                   item.location.left=element.offsetLeft+"px";
                   item.location.top=element.offsetTop+"px";
                }


       })
    }
     static updateLocation(editModel,tableName,_location){
        editModel.tableList.map((item,itemIndex)=>{ //更新位置
            if(item.tableName==tableName){
                if(_location.left)item.location.left=_location.left+"px";
                if(_location.top)item.location.top=_location.top+"px";
                if(_location.width)item.location.width=_location.width;
                if(_location.height)item.location.height=_location.height;
           }
       })
    }
   static transformStyle(style){
         let newStyle={};
         let styleArr=style.split(";");
         for (let item of styleArr){
             const newItem=$.trim(item);
             if(newItem!=""){
                  let AArr=newItem.split(":");
                  if(AArr[0]!="position")
                  newStyle[AArr[0]]=AArr[1].trim();
             }
         }
         return newStyle;
   }
   static onCopy(text){
      copy(text);
      Message.success("复制成功！");
   }
   static freshingTables(dispatch,editModel,dataSourceID){

         if(editModel && editModel.tableList && editModel.tableList.length >0){
                  let fieldsInfosArr=[];
                  let index=0;
                  editModel.tableList.map((table,tableIndex)=>{
                            NetUtil.get(`/datadict/get_table_info/${dataSourceID}/${table.tableName}`, null, (data) => {
                                if(data.code==200){
                                    index ++;
                                   let fieldsInfo=_analysisModel.getFieldsInfo(data.data,table.tableName);
                                   fieldsInfosArr.push({
                                       tableName:table.tableName,
                                       fieldsInfo:fieldsInfo
                                   });
                                   if(index==editModel.tableList.length){
                                        dispatch(updateEditModelByType({
                                              "type":"freshingTables",//刷新
                                              "value":fieldsInfosArr
                                         }));
                                        //Message.success('刷新成功！');
                                   }
                                 }else{
                                     Message.success('后台异常，请检查是否退出登录！');
                                 }

                            },(data) => { console.log(data); });
                  })

         }
   }
   static freshingTablesAtReducer(editModel,fieldsInfosArr){
             if(editModel && editModel.tableList && editModel.tableList.length >0){
                 for (let table of editModel.tableList){
                      for (let newTable of  fieldsInfosArr){
                           if(table.tableName==newTable.tableName){
                                 _analysisModel.compIsChecked(table.fieldsInfo,newTable.fieldsInfo);
                                 _analysisModel.compIsChecked(table.fieldsInfo,newTable.fieldsInfo);
                                 table.fieldsInfo=[
                                   ...newTable.fieldsInfo
                                 ];
                           }
                      }
                 }
                  Message.success('刷新成功！');
             }
   }
  static compIsChecked(oldTableFieldsInfo,newTableFieldsInfo){ //isChecked
       for (let oldT of oldTableFieldsInfo){
            for(let newT of newTableFieldsInfo){
                if(oldT.fieldName==newT.fieldName){
                    newT.isChecked=oldT.isChecked;
                    if(oldT.isCustomAliasName){
                      newT.aliasName=oldT.aliasName;
                      newT.isCustomAliasName=true;
                    }
                    if(oldT.isCustomComments && (newT.comments!=oldT.comments)){ //自定义注释
                      newT.comments=oldT.comments;
                      newT.isCustomComments=true;
                    }
                    if(newT.comments!=oldT.comments){//兼容旧版本
                         newT.isCustomComments=true;
                         newT.comments=oldT.comments;
                    }
                }
            }
       }
  }
  static isProcsOrApisByTable(table){
       if(table && table.tableType){
           return (table.tableType=="procs" || table.tableType=="apis" || table.tableType=="sqls");
       }
       return false;
   }
   static isProcsOrApis(editModel){
     if(editModel && editModel.tableList && editModel.tableList.length >0){
          const _isProcsOrApis=editModel.tableList.some((item,itemIndex)=>{return _analysisModel.isProcsOrApisByTable(item);})
          return _isProcsOrApis;
        }else{
           return false;
        }
   }

   static setReferenceInfo(dispatch,key,tableName,fieldName,result){
         if(key=="year" || key=="month" || key =="yearMonth" ||  key =="yearMonthDay"){
             dispatch(updateExconditionByType({
                "type":"addReferenceInfo",//增加
                "param":{
                    "tableName":tableName,
                    "fieldName":fieldName,
                    "result":{"type":key,"content": null}
                }
            }));
         }else if(key=="ref" || key=="treeref"){
            dispatch(updateExconditionByType({
                "type":"addReferenceInfo",//增加
                "param":{
                    "tableName":tableName,
                    "fieldName":fieldName,
                    "result":{...result}
                }
            }));

         }else{

         }
  }
 static clearReferenceInfo(dispatch,selectedKeys,tableName,fieldName){
          if(selectedKeys.length >0)
            {
                dispatch(updateExconditionByType({
                  type:"clearReferenceInfo",//清空
                  param:{
                      tableName:tableName,
                      fieldName:fieldName
                  }
                }));
            }
  }
    /*static search(editModel,tableName,_searchValue){
        for (let table of editModel.tableList) {
            if (table.tableName == tableName || tableName=="all") {
                   for (let field of table.fieldsInfo){
                            if(value.trim()!=""){ //搜索
                                 let searchValue=_searchValue.toLowerCase();
                                 let fieldNameTL=field.fieldName.toLowerCase();
                                 let commentsTL=(field.comments || field.fieldName).toLowerCase();
                                 if(fieldNameTL.includes(searchValue) || commentsTL.includes(searchValue)){
                                     field.isHide=false;//显示
                                 }else{
                                     field.isHide=true;//隐藏
                                 }
                           }else if{ //显示全部
                                 if(field.isHide)delete field.isHide;
                           }
                   }
            }
        }
    }*/
    //更新分析模型条件
    static postAnalysisCondition(excondition,analysis_module_id,callback){
            // console.log(excondition,"excondition")
           if(excondition && excondition.fields){
                  const param={
                            "analysis_module_id":analysis_module_id,
                            "content":JSON.stringify(excondition)
                  }
                  if(excondition.id){ //update
                         NetUtil.post("/condition/update", {
                            "id":excondition.id,
                            ...param
                          }, function(data) {
                            callback()
                        });
                  }else{
                        NetUtil.post("/condition/add", param, function(data) {
                             callback()
                        });
                  }
              }
    }
    static search(editModel,tableName,_searchValue){
        for (let table of editModel.tableList) {
            if (table.tableName == tableName || tableName=="all") {
                   table.search=_searchValue;
            }
        }
    }



    static getFieldsInfo(fields,tableName){
          let fieldsInfo=[];
          if(fields && fields.length)fields.map((item,itemIndex)=>{
              fieldsInfo.push(this.formmatFieldInfo(item,tableName));
          })
          return fieldsInfo;
    }
    static formmatFieldInfo(field,tableName){
           return{
                "aliasName": field.aliasName || null,
                "comments": field.comments?field.comments:field.fieldName,
                "dataType": this.getDataType(field.dataType),
                "fieldName":field.fieldName,
                "fieldType": this.getFieldType(field.dataType),
                "isChecked": field.isChecked || false,
                "tableName": tableName,
                "isLeaf": field.isLeaf,
                "parentName": field.parentName,
                "parentId": field.parentId,
                "orderNo": field.orderNo,
           }
      }
    static getDataType(dataType){
         if(dataType && dataType.toLowerCase()){
             return dataType.toLowerCase()
         }else{
            return dataType;
         }
    }
    static getFieldType(dataType){
            const _dataType =this.getDataType(dataType);
            if(!_dataType)return 'dimension'; //维度
            if (_dataType.indexOf("int") >= 0 ||
                _dataType.indexOf("number") >= 0 ||
                _dataType.indexOf("numeric") >= 0 ||
                _dataType.indexOf("float") >= 0 ||
                _dataType.indexOf("double") >= 0 ||
                _dataType.indexOf("decimal") >= 0 ||
                _dataType.indexOf("bigint") >= 0) {
                return 'measure'; //度量
            } else {
              return'dimension'; //维度
            }
      }
    static getFieldByTableNameFieldName(editModel,tableName,fieldName){
              if(editModel && editModel.tableList && editModel.tableList.length >0){
                     for(let table of editModel.tableList){
                          if(table.tableName == tableName && table.fieldsInfo && table.fieldsInfo.length >0){ //找到table
                               for(let field of table.fieldsInfo){
                                    if(field.fieldName == fieldName)return field;
                               }
                          }
                     }
              }
              return null;
      }
        static modifyFieldInfo(model,pram) {
          const {tableName,fieldName,fieldType,hasExpression}=pram;//hasExpression 判断是不是计算字段
           if(!hasExpression){
               for (let table of model.tableList) {
                  if (table.tableName == tableName) {
                    for (let field of table.fieldsInfo) {
                      if (field.fieldName == fieldName) {
                        field.fieldType = fieldType
                        return;
                      }
                    }
                  }
                }
           }else{
                  //自定义计算字段
                  if(model.userDefineFields){
                    for (let defineTable of model.userDefineFields) {
                      if (defineTable.tableName == tableName) {
                            defineTable.fieldType = fieldType
                            return;
                      }
                    }
                  }
           }
          }


static  updateFieldAliasName(editModel) { //别名更新
    if(!(editModel && editModel.tableList)) return false;
    for (let table of editModel.tableList) {
      for (let field of table.fieldsInfo) {
        if(field.isCustomAliasName){ //自定义别名不做处理
              
        }else{
            let fieldCount = analysisModel.getSameFieldCount(editModel, field.fieldName);
            if (fieldCount > 1) {
              field.aliasName = aliasNameFn(table.tableName,field.fieldName);
            }else{
              if(field.aliasName)delete field.aliasName;
            }
        }
      }
    }
  }
}
export {getFieldOption,getConditionFields,getFields,_analysisModel};