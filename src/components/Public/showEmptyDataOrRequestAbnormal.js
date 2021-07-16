import { getTheme } from '/src/routes/visualizationModel/chartDesigner/components/Public/getTheme.js';
//参数：状态，模型环境
const getWrapperStyle = function (type) {
    return {
        position: 'relative',
        width: '25%',
        height: '25%',
        background: `url('${window.localStorage.static_path}/static/images/bi/bi_widget_${type}.png') no-repeat center`,
        backgroundSize: 'contain',
        margin: '0 auto',
        top: '40%'
    }
}
const getNoDataTipStyle = function(){
    return {
        position: 'absolute',
        top: '110%',
        left: '50%',
        marginLeft: '-28px',
        fontSize: '14px',
        color: getTheme()=='light'?'rgba(0, 0, 0, 0.35)' : 'rgba(236, 255, 255, 0.35)'
    }
}
export const showEmptyDataOrRequestAbnormal = (noDataState, modelEnv) => {
    return (<div className="modelNoDataWrapper" style={noDataState == '暂无数据' ? getWrapperStyle(modelEnv) : {}}>
        <div className="noDataTip" style={getNoDataTipStyle()}>
            {noDataState}
        </div>
    </div>);
};