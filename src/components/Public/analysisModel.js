import CollectionUtil from './CollectionUtil';
const connectInfo = {
  "id": "",
  "from": {
    "elementId": "",
    "anchor": ""
  },
  "to": {
    "elementId": "",
    "anchor": ""
  },
  "joinInfo": {
    "joinType": "INNERJOIN",
    "relations": []
  }

}
class fieldInfo {
  fieldName = '';
  displayName = '';
  dataType = '';
  aggregationType = '';
  fieldType = 'dimension';
  isChecked = false;
}

class tableInfo {
  tableName = '';
  displayName = '';
  isMainTable = false;
  fieldsInfo = {
    fieldName: "id",
    comments: "",
    isChecked: false,
    dataType: "",
    fieldType: ""
  }
}
class associateInfo {
  tableName = '';
  fieldsInfo = [];
  associateInfos = [];
}

class factTableModel {
  tableName = '';
  displayName = '';
  fieldsInfo = [];
  associateInfos = [];
}

class analysisModel {
  name = '';
  description = '';
  categoryid = '';
  title = {};
  //factTableModel:Object.assign({},factTableModel);
  tableList = [];
  userDefineFields = [];
  connectInfo = [];

  findTableModel(tableName, target) {
    // var a =this.name;
    // console.log(a);

    for (var i = 0; i < target.associateInfos.length; i++) {
      if (target.associateInfos[i].tableName == tableName) {
        return target.associateInfos[i];
      }
      this.findTableModel(target.associateInfos[i], target);
    }
  };

  isExistInassociateInfos(tableName, associateInfos) {
    for (var i = 0; i < associateInfos.length; i++) {
      if (associateInfos[i].tableName == tableName) {
        return true;
      }
    }
    return false;
  }
  static updateFieldAliasName() {
    for (let table of this.editModel.tableList) {
      for (let field of table.fieldsInfo) {
        let fieldCount = analysisModel.getSameFieldCount(this.editModel, field.fieldName);
        if (fieldCount > 1) {
          field.aliasName = aliasNameFn(table.tableName,field.fieldName)
        }
      }
    }
  }
  static updateFieldParameterSet(model,setData,fieldsInfoTableName) {
    let tableList=model.tableList
    let {IDColumn,CodeColumn,NameColumn}=setData;
    if(tableList.length >0){ 
             tableList.forEach((table,index)=>{
                      if(table.tableName==fieldsInfoTableName){
                           for (let field of table.fieldsInfo) {
                                if (field.fieldName == IDColumn || field.fieldName == CodeColumn  || field.fieldName == NameColumn) {
                                      field.signColumn={...setData}
                                }else{
                                      field.signColumn=null  
                                }
                           }
                           tableList[index].signColumn={ ...setData}
                      }
              })
        }
  }
   static getFieldElementValue(model,TableName,currentField,element){
          const table=analysisModel.getTableFromModel(model,TableName);
          for (let field of table.fieldsInfo) {
                 if (field.fieldName == currentField) {
                      return field[element];
                 }
          }
          return null;
  }
  //参照设置
  static setReferenceInfo(model,referenceInfo,TableName,currentField){
      let tableList=model.tableList;
      if(tableList.length >0){ 
               tableList.forEach((table,index)=>{
                        if(table.tableName==TableName){

                             for (let field of table.fieldsInfo) {
                                     if (field.fieldName == currentField) {
                                            field.referenceInfo=referenceInfo ? {
                                                  ...referenceInfo
                                                } :null
                                     }   
                              }
                            
                        }
                })
          }
  }
  
  static getTableFromModel(model, tableName) {
    if (!model || !model.tableList || model.tableList.length <= 0) {
      return null;
    }
    for (let table of model.tableList) {
      if (table.tableName == tableName) {
        return table;
      }
    }
    return null;
  }

  static getFieldFromModel(model, fieldaliasName) {
    if (!model || !model.tableList || model.tableList.length <= 0) {
      return null;
    }
    for (let table of model.tableList) {
      for (let field of table.fieldsInfo) {
        if (field.aliasName == fieldaliasName || field.fieldName == fieldaliasName) {
          return field;
        }
      }
    }
    return null;
  }

  static createTableByDom(table) {
    let tableInfo = {};
    let tableId = table.id;
    let tableTitleID = tableId + "_title";
    let isSetMainTable = false;
    tableInfo.tableName = tableId;
    tableInfo.displayName = $('#' + tableTitleID).text();
    tableInfo.location = { left: 0, top: 0 };
    tableInfo.location.left = table.style.left;
    tableInfo.location.top = table.style.top;
    tableInfo.location.style = table.style;
    tableInfo.isHideFieldList = false;//false默认展开 true默认收起
    //tableInfo.search=table.search;
    let mainTable = $(table).find('.table_head_selecteded');
    if (mainTable.length > 0) {
      tableInfo.isMainTable = true;
      isSetMainTable = true;
    }
    //存储过程
    let tableType = $(table).find('.table_head_procedure');
    if(tableType.length > 0){
          tableInfo.tableType = "procs";
    }
    tableInfo.fieldsInfo = [];
    analysisModel.setFields(tableInfo.fieldsInfo, tableId);
    return tableInfo;
  }
  static mergeFields(sourcefields, tableId) {
    let tableFields = [];
    analysisModel.setFields(tableFields, tableId);
    for (let tableField of tableFields) {
      let tempField = CollectionUtil.getItemByAttributeName(sourcefields, 'fieldName', tableField.fieldName);
      // console.log(tableField,"tempField",tempField)
      if (!tempField) {
        sourcefields.push(tableField);
      } else {
        tempField.comments = tableField.comments;
        tempField.isChecked = tableField.isChecked;
      }
    }
  }
  static setFields(fields, tableId) {
    var $ = window.$;
    let selectSecond = '#' + tableId + ' input[type=checkbox]';
    let checkedFieldsSencond = $(selectSecond);
    let selectFirst = '#' + tableId + '_TableBody input[type=text]';
    let checkedFieldsFirst = $(selectFirst);
    for (var i = 0; i < checkedFieldsSencond.length; i++) {
      let field = Object.assign({}, fieldInfo);
      field.tableName = checkedFieldsSencond[i].getAttribute('tablename');
      field.fieldName = checkedFieldsSencond[i].name;
      if(checkedFieldsSencond[i] || checkedFieldsSencond[i].getAttribute('aliasname')){

        field.aliasName = checkedFieldsSencond[i].getAttribute('aliasname');
      }
      field.comments = checkedFieldsFirst[i].value;
      field.isChecked = checkedFieldsSencond.get(i).checked;
      field.dataType = checkedFieldsSencond.eq(i).attr("dataType").toLowerCase();
      if (field.dataType.indexOf("int") >= 0 ||
          field.dataType.indexOf("number") >= 0 ||
          field.dataType.indexOf("numeric") >= 0 ||
          field.dataType.indexOf("float") >= 0 ||
          field.dataType.indexOf("double") >= 0 ||
          field.dataType.indexOf("decimal") >= 0 ||
          field.dataType.indexOf("bigint") >= 0) {
          field.fieldType = 'measure'; //度量
      } else {
        field.fieldType = 'dimension'; //维度
      }
      fields.push(field);
    }
    return fields;
  };

  isExistConnection(id, connections) {
    for (var i = 0; i < connections.length; i++) {
      if (connections[i].id == id) {
        return true;
      }
    }
    return false;
  }

  static isExistMainTable(model) {
    for (let table of model.tableList) {
      if (table.isMainTable) {
        return true;
      }
    }
    return false;
  }

   //Number 修改为度量
   static getFieldType(field,dataType) {
      if(dataType=="int" && field.fieldType !="measure"){
          return "measure" //度量矫正
      }else{
         return field.fieldType;
      }
  }
  static updateTableListByTableID(tableId,tableList){ //要更新的tableID
         let tableModel = analysisModel.createTableByDom($("#"+tableId).get(0));
         tableList.forEach(function(table,index,modelTablelist){
              if(table.tableName == tableId){
                   modelTablelist.splice(index,1)   
              }
         })
         tableList.push(tableModel);
  }
  //后端dataType已经统一处理，但是旧版本下dataType有问题，临时处理，后期需要去掉
  static  updateDataType(tableList){
      if(tableList && tableList.length >0){
          for (let table of tableList){
               let fieldsInfo=table.fieldsInfo;
               if(fieldsInfo && fieldsInfo.length >0){
                    for (let field of fieldsInfo){
                           field.dataType=analysisModel.getFieldDataType(field);
                    }
               }
          }
      }
  }
  static getFieldDataType(field,type=1) {
    //return field.dataType;
    //后端统一处理
    if(field.type!="group"){
            let dataType="";
            if(type){
               if(field.dataType)dataType=field.dataType.toLowerCase();
            }else{
               if(field.dataTypeName)dataType=field.dataTypeName.toLowerCase();
            }
            if (dataType.indexOf('int') >= 0 ||
                dataType.indexOf('float') >= 0 ||
                dataType.indexOf('double') >= 0 ||
                dataType.indexOf('number') >= 0 ||
                dataType.indexOf('numeric') >= 0 ||
                dataType.indexOf('bigint') >= 0||
                dataType.indexOf('bigdecimal')>=0) {
              return 'int';
            }else if(dataType.indexOf('datetree') >= 0){
               return 'dateTree';//日期级次字段
            } else if (dataType.indexOf('date') >= 0) {
              return 'date';
            }
    }
    return 'string';
  }
  static getFields(model, type,modelType,expressionType) {
    let fields = [];
    if (!model) {
      return fields;
    }
    if (!model.tableList) {
      return fields;
    }
    for (let table of model.tableList) {
      for (let field of table.fieldsInfo) {
        if (!field.isChecked) {
          continue;
        }
        if (type == field.fieldType) {
          fields.push(analysisModel.getField(field));
        } //isDimension
        if (!type) {
         fields.push(analysisModel.getField(field));
        }
      }
    }
    for (let userDefinedField of model.userDefineFields) {
      if (modelType === undefined && (type === userDefinedField.fieldType || type ===undefined)) {
       fields.push({ ...userDefinedField, aliasName: userDefinedField.aliasName || userDefinedField.fieldName });
      }
    }
    if(model.expressionsFields){//expressionType 有值时才显示
         for (let expressionsField of model.expressionsFields) {
          if (expressionType  && (type === expressionsField.fieldType || type ===undefined)) {
             fields.push({ ...expressionsField, aliasName: expressionsField.aliasName || expressionsField.fieldName });
          }
        }
    }
    return fields;
  }
  static getAllFields(model, type,modelType,expressionType) {
    let fields = [];
    if (!model) {
      return fields;
    }
    if (!model.tableList) {
      return fields;
    }
    for (let table of model.tableList) {
      for (let field of table.fieldsInfo) {

        if (type == field.fieldType) {
          fields.push(analysisModel.getField(field));
        } //isDimension
        if (!type) {
         fields.push(analysisModel.getField(field));
        }
      }
    }
    for (let userDefinedField of model.userDefineFields) {
      if (modelType === undefined && (type === userDefinedField.fieldType || type ===undefined)) {
       fields.push({ ...userDefinedField, aliasName: userDefinedField.aliasName || userDefinedField.fieldName });
      }
    }
    if(model.expressionsFields){//expressionType 有值时才显示
         for (let expressionsField of model.expressionsFields) {
          if (expressionType  && (type === expressionsField.fieldType || type ===undefined)) {
             fields.push({ ...expressionsField, aliasName: expressionsField.aliasName || expressionsField.fieldName });
          }
        }
    }
    return fields;
  }
  static formatFields(fields){
       let newFields=[];
       for(let field of fields){
              newFields.push(analysisModel.getField(field)); 
       }
       return newFields;
  }
  static getField(field){
    let newField={ ...field};
    newField.aliasName=field.aliasName || field.fieldName ;
    newField.dataType=analysisModel.getFieldDataType(field); //后端对数据类型做统一处理
    //newField.fieldType=analysisModel.getFieldType(field,newField.dataType);//Number 修改为度量
    return newField;
  }
  static getSameFieldCount(model, fieldName, tableName) {
    let fieldCount = 0;
    if (!model) {
      return fieldCount;
    }
    for (let table of model.tableList) {
      for (let field of table.fieldsInfo) {
        if (field.fieldName == fieldName || field.fieldName.toLowerCase()== fieldName.toLowerCase() && tableName !=field.tableName) {
          fieldCount+=1;
          this.tempSavetempModelForAliasName(model)

        }
      }
    }
    return fieldCount;
  }

  static getSameAliasNameFieldCount(model, aliasName, tableName, fieldName) {  //别名
    let fieldCount = 0;
    if (!model) {
      return fieldCount;
    }
    for (let table of model.tableList) {
      for (let field of table.fieldsInfo) {
        const _fAliasName = field.aliasName || field.fieldName;
        if (!(tableName == field.tableName && fieldName ==field.fieldName)){
            if (_fAliasName == aliasName || _fAliasName.toLowerCase()== aliasName.toLowerCase()) {
              fieldCount+=1;
            }
        }
      }
    }
    return fieldCount;
  }
  static tempSavetempModelForAliasName = (model)=>{
    let tableList = model.tableList;
    let obj = {}
    if(tableList.length ){
      tableList.map((item,i)=>{
        //当什么都没有时候我们就将以前的都改掉---为了减轻实施人员重新做分析模型
        obj[item.tableName]=i;
      })
      
    }
    
    sessionStorage.setItem("tempModelForAliasName",JSON.stringify(obj));
  }
 static getTableListLocation(model,table) {
    let selectTable=$("#"+table.tableName);
    let location = {};
    if (!model) {
      return location;
    }
    let position=selectTable.position();
    location={
          ...table.location,
          style:selectTable.attr("style")
    } 
    return location;
  }
  static modifyFieldInfo(model, tableName, fieldName, value) {
    for (let table of model.tableList) {
      if (table.tableName == tableName) {
        for (let field of table.fieldsInfo) {
          if (field.fieldName == fieldName) {
            field.fieldType = value
            return;
          }
        }
      }
    }
    //自定义计算字段
    if(model.userDefineFields){
      for (let defineTable of model.userDefineFields) {
        if (defineTable.tableName == tableName) {
              defineTable.fieldType = value
              return;
        }
      }
    }
    
  }

  static getConnection(model, conn) {
    for (let con of model.connectInfo) {
      if (con.id == conn.id) {
        return con;
      }
      if (conn.sourceId == con.from.elementId && conn.targetId == con.to.elementId) {
        return con;
      }
    }
    return null;
  }

  static getConnectionIndex(model, conn) {
    let index = -1;
    for (let con of model.connectInfo) {
      index++;
      if (con.id == conn.id) {
        return index;
      }
      if (conn.sourceId == con.from.elementId && conn.targetId == con.to.elementId) {
        return index;
      }
    }
    return -1;
  }

  static removeConnection(model, conn) {
    let index = analysisModel.getConnectionIndex(model, conn);
    if (index >= 0) {
      model.connectInfo.splice(index, 1);
    }
    console.log(model.connectInfo);
  }
  static checkModelFields(model, type) {
    let hasChecked = false;
    for (let table of model.tableList) {
      hasChecked = false;
      for (let field of table.fieldsInfo) {
        if (type == 'checked' && field.isChecked) {
          hasChecked = true;
          break;
        } //
      }
      if (!hasChecked) {
        return false;
      }
    }
    return true;
  }

  static checkModelConneciton(model) {
    let hasIn = false;
    let hasOut = false;
    for (let table of model.tableList) {
      for (let con of model.connectInfo) {
        // if(table.tableName==con.from.elementId){
        //   hasOut=true;
        //   continue;
        // }
        if (table.isMain == false && table.tableName == con.to.elementId) {
          hasIn = true;
          break;
        }
      }
    }
    if (!hasIn) {
      return false;
    }
    return true;

  }
  static resetAnalysisModel() {
    let model = new analysisModel();
    return model;
  }
}
function  getTableObj(table){
          let tableObj = {};
          tableObj.name = table.tableName;
          tableObj.displayName = table.displayName;
          tableObj.fields = table.fieldsInfo;
          if(table.location.style){
              tableObj.style=table.location.style; //如果有style优先style,保证宽度高度的渲染
          }else{
              tableObj.top = table.location.top;
              tableObj.left = table.location.left;
          }
          tableObj.isHideFieldList = table.isHideFieldList || false; //false默认展开 true默认收起
          tableObj.isMainTable = table.isMainTable;
          tableObj.search = table.search;
          tableObj.tableType=table.tableType;
          if(table.isHide) tableObj.isHide=table.isHide;
          return tableObj;
}
const getNewAName=(str)=>{
      let result=str;
      if(result.substr(0, 1)=="_"){
        result=result.substring(1,result.length);
        result=getNewAName(result);
       }else{
         return result;
       } 
}
//别名命名方法 lvtianyutianjia
const aliasNameFn = (tableName,fieldName)=>{
  // let tempModelForAliasName =JSON.parse(sessionStorage.getItem("tempModelForAliasName")) ;
  // let fieldNameC = fieldName
  // let aliasName = fieldNameC;

  //   if(tempModelForAliasName[tableName]){
  //     aliasName = `${fieldName}${tempModelForAliasName[tableName]}`;
  //   }
   const aliasName = `${tableName}_${fieldName}`;
   if(aliasName.length >30){
      let newAName=aliasName.substring(aliasName.length-30,aliasName.length);
      newAName=getNewAName(newAName);
      return newAName;
   }else{
    return aliasName;
   }
  
}
export { analysisModel, connectInfo, fieldInfo, tableInfo, associateInfo ,getTableObj, aliasNameFn};
