import Message from '@/components/public/Message';
import NetUtil from '@/containers/HttpUtil';
export function LoadAnalysisModelList(params) {
  return dispatch => {
    console.log('LoadAnalysisModelList');
    NetUtil.get('/analysismodel/get?pageIndex=1&pageSize=15', null, function(data) {
      console.log(data);
      //下面的就是请求来的数据
      dispatch({ type: "LOAD_ANALYSISMODELLIST", data: data.data.list });
    }, function(data) {
      console.log(data);
    });
  }
}

export function AddAnalysisModel(content, id) {
  return dispatch => {
    console.log('LoadAnalysisModelList');
    NetUtil.get('/analysismodel/add', null, function(data) {
      console.log(data);
      //下面的就是请求来的数据
      dispatch({ type: "ADD_ANALYSISMODEL", data: data.data.list });
    }, function(data) {
      console.log(data);
    });
  }
}

export function DeleteAnalysisModel(analysisModelId) {
  //这里要发出请求，从数据库删除该条项目**********************
  return (dispatch) => {
    //少这个api
    var para={
      id:analysisModelId
    }
    NetUtil.post('/analysismodel/delete', para, function(data) {
      console.log(data,'/analysismodel/delete');
      //下面的就是请求来的数据
      if(data.code==200){
        Message.success(data.message);

      }else{
        Message.error(data.message);

      }
      dispatch({ type: "DELETE_ANALYSISMODEL", data: analysisModelId });
    }, function(data) {
      Message.error(data.message);
    });
  }
}
export function UpdateAnalysisModel(content, id) {
  return (dispatch) => {
    //少这个api
    NetUtil.get('/analysismodel/update', null, function(data) {
      console.log(data);
      //下面的就是请求来的数据
      dispatch({ type: "UPDATE_ANALYSISMODEL", data: data.data.list });
    }, function(data) {
      console.log(data);
    });
  }
}
export function getAnalysisModel(params) {
  return dispatch => {
    NetUtil.get('/analysismodel/getall', null, function(data) {
      console.log(data);
      dispatch({ type: "GET_ANALYSISMODELLIST", data: data.data });
    }, function(data) {
      console.log(data);
    });
  }
}
export function analysisModelChange(params) {
  if(params.id==null){
    return {type:"ANALYSIS_MODEL_CHANGE",datasource:[], analysisModuleId:""} ;
  }
  return dispatch => {
    var that = this ;
    NetUtil.get("analysismodel/getAssociateInfo/"+params.id,null,function(data){
    // NetUtil.get("analysismodel/get/"+params.id,null,function(data){
      var jsData = {} ;
      try {
        jsData = JSON.parse(data.data.analysis_model$content);
  　　} catch(error) {
        console.error("json解析报错了：",error)
  　　} finally {

  　　}
      //更新ChartModel中的分析模型的ID
      dispatch({ type: "ANALYSIS_MODEL_CHANGE", datasource: jsData, analysisModelId: params.id })
    },function(data){
      console.log(data)
    })
  }
}
export function getAnalysisTable(params) {
  return dispatch => {
    NetUtil.get('/analysis/get?id='+params.id, null, function(data) {
      console.log(data);
      dispatch({ type: "GET_ANALYSISTABLE", data: data.data });
    }, function(data) {
      console.log(data);
    });
  }
}

export function setDataModelValue(params){
    return {type:"SET_DATA_MODEL_VALUE",...params};
}
