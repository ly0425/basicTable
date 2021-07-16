class BICache {
	static currentAnalysisModel; 
	static analysisConditions;//分析模型条件（包括参照、年月字段、级次、联动等）
	static benchmarkDate; //基准日期，用户配置，可替代查询条件里的相对日期
}
export default BICache;