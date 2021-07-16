import NetUtil from '../containers/HttpUtil';
import ChartConst from '/src/containers/ChartConst'

export function analysisModelChange(params) {
  if (params.id == null) {
    return { type: ChartConst.AnalysisModel_Change, datasource: [], analysisModelId: "" };
  }
  return dispatch => {
    NetUtil.get("analysismodel/getAssociateInfo/" + params.id, null, function(data) {
      let jsData;
      let datasourceId;
      let tableAndProcName;
      try {
        jsData = JSON.parse(data.data.analysis_model$content);

        datasourceId = data.data.datasource$id; //给参数设置用
        tableAndProcName = JSON.parse(data.data.datasource$tables); //表和存储过程的集合
      } catch (error) {
        console.error("data 解析报错了：", error)
      } finally {

      }
      //更新ChartModel中的分析模型的ID和tableTree的维度度量
      let procs;
      //如果返回的分析模型是存储过程的，再把procs保存到chartModel里
      if(jsData.type &&　jsData.type=="procedure"){
         procs = tableAndProcName.procs && tableAndProcName.procs[0] && tableAndProcName.procs[0].name ? tableAndProcName.procs[0].name : null;
      }
      dispatch({ type: ChartConst.AnalysisModel_Change,
        datasource: jsData,
        analysisModelId: params.id,
         datasourceId: datasourceId,
         procName: procs });
    }, function(data) {
      console.log(data)
    })
  }
}
export function showChartDataSource() {
  return { type: "SHOW_CHART_DATASOURCE" };
}

export function chartDataSourceVisible(isVisible) {
  return { type: "CHART_DATASOURCE_VISIBLE", isVisible };
}
export function resetDataSource() {
  return { type: "RESET_DATA_SOURCE" };
}
export function refreshTableTreeByExpressions(data) {
  return { type: "REFRESH_TABLETREE_BY_EXPRESSIONS", data };
}
