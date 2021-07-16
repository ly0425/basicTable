import { analysisModel} from '@/components/Public/analysisModel';
import {getAnalysisConditions,getConditionByAnalysisID}  from '@/components/Public/analysisConditionModel';
import {_analysisModel} from '@/components/Public/AnalysisModelFn';
import NetUtil from '@/containers/HttpUtil';


export function updateDatasourceID(item){ //数据源id
    return {"type":"UPDATE_DATASOURCEID","dataSourceID":item};
}
export function updateIsShowEditTableJoinModal(value){//单击连接线 显示
    return {"type":"UPDATE_ISSHOWEDITTABLEJOINMODAL","isShowEditTableJoinModal":value};
}
export function updateExcondition(item){ //显示参照设置 级次字段等
    return {"type":"UPDATE_EXCONDITION","excondition":item};
}

export function updateExconditionByType(item){ //
    return {"type":"UPDATE_EXCONDITIONBYTYPE","info":item};
}

export function deleteExconditionByTableName(item){ 
    return {"type":"DELETE_EXCONDITIONBYTYTABLENAME",item};
}

export function getEditModel(type,analysis_modelID){ //得到editModel
  
         return dispatch => {
          if(type=="edit"){
                NetUtil.get(`/analysismodel/getAssociateInfo/${analysis_modelID}`, null, (data) => {
                       const editModel=handleData(data,analysis_modelID);
                       _analysisModel.handleCompatible(editModel);//兼容处理
                       dispatch({ type:"UPDATE_EDITMODEL",editModel});
                        dispatch(updateOriginalData({
                            type:"editModel", 
                            editModel:JSON.stringify(editModel),//保存原始数据 
                        }));
                       dispatch(updateDatasourceID(data.data.datasource$id));
                       initExcondition(data.data.analysis_model$id,data.data.datasource$id,dispatch);
                }, (data) => {
                     console.log(data)
                });
            }else if(type=="add"){
                const editModel={
                      categoryid: "",
                      connectInfo: [],
                      description: "",
                      name: "",
                      tableList: [],
                      title: {},
                      userDefineFields: []
                  }
                 dispatch({ type:"UPDATE_EDITMODEL",editModel});
                 dispatch(updateOriginalData({
                    type:"editModel", 
                    editModel:JSON.stringify(editModel),//修改一个别名 
                }));
                 initExcondition(analysis_modelID,null,dispatch);
            }
      }
}

export function updateEditModel(item){ //更新EditModel
    return {"type":"UPDATE_EDITMODEL","editModel":item};
}

export function updateTablePage(item){//是否显示table页
    return {"type":"UPDATE_TABLEPAGE","isShowTablePage":item.isShowTablePage}
}

export function updateIsHideFieldList(item){//展开收起
    return {"type":"UPDATE_ISHIDEFIELDLIST","isHideFieldList":item.isHideFieldList}
}

export function updateEditModelByType(item){ //更新EditModelByType
    return {"type":"UPDATE_EDITMODELBYTYPE","editModelInfo":item};
}
export function updateOriginalData(item){ //更新EditModelByType
    return {"type":"UPDATE_ORIGINALDATA","item":item};
}
function initExcondition(analysisID,dataSourceID,dispatch){
          //获取条件
          getAnalysisConditions((conditions)=>{
            // console.log(conditions,"conditions")
                let excondition=getConditionByAnalysisID(conditions,analysisID);
                if(excondition.content)excondition={
                        ...excondition.content,
                        analysisID:analysisID,
                        dataSourceID:dataSourceID,
                        id:excondition.id
                 }
                if(!excondition || !excondition.fields)excondition={
                      "fields":[],
                      "dataSourceID":dataSourceID,
                      "analysisID":analysisID
                };
                dispatch(updateExcondition(excondition));
                dispatch(updateOriginalData({
                    type:"excondition", 
                    excondition:JSON.stringify(excondition),//修改一个别名 
                }));
          })
    }

function handleData(data,analysis_modelID){
           // 编辑 
          let editModel = null;
          let editModelData = data.data;
          if (editModelData.analysis_model$content) {
                editModel = JSON.parse(editModelData.analysis_model$content);
                editModel={
                   ...editModel,
                   id:analysis_modelID,
                   subjectID:editModelData.analysis_model$category_id,
                   oldName:editModel.name
                }
                changeConnectInfoId(editModel.connectInfo);
                analysisModel.updateDataType(editModel.tableList); // 后端dataType已经统一处理，但是旧版本下dataType有问题，临时处理，后期需要去掉
                return editModel;
          }
          return editModel;       
  }
function changeConnectInfoId(connectInfo){//id重新渲染
       if(connectInfo){
             connectInfo.map((conn,connIndex)=>{
                     conn.id="con_"+getRandom();
              })
       }
  }
function  getRandom() {
      let ran = Math.random() + "";
      ran = ran.substring(2);
      return ran;
  }