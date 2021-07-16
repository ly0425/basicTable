import React, { Component } from 'react';
import { connect } from 'react-redux';
import AnalysisModelSelect from 'src/components/Public/analysisModelSelect';
import TableTree from 'src/components/Public/tableTree.js';
import SearchC from 'src/components/Public/searchC.js';
import { analysisModelChange } from '/src/actions/chartDataSourceAction.js';
class ModelReference extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isShowDimensionSearch: false,
      isShowMeasureSearch: false,
      isShowChartDataSource: true,
      dimensionCondition: '',
      measureCondition: '',
    };
    this.analysisModelId = this.props.analysisModelId;
  }
  componentWillReceiveProps(nextprops) {
    this.analysisModelId = this.newAnalysisModelId || nextprops.analysisModelId;
  }
  //确定维度还是度量
  showSearch(param) {
    if (param == 'dimension') {
      this.setState({ isShowDimensionSearch: true });
    } else {
      this.setState({ isShowMeasureSearch: true });
    }
  }
  clearCondition(param) {
    if (param == 'dimension') {
      this.setState({
        dimensionCondition: ""
      });
    } else {
      this.setState({
        measureCondition: ""
      });
    }
  }
  searchDimension = (value) => {
    this.setState({
      isShowDimensionSearch: false,
      dimensionCondition: value
    });
  }
  searchMeasure = (value) => {
    this.setState({
      isShowMeasureSearch: false,
      measureCondition: value
    });
  }
  tableDataSourceToggle = () => {
    this.setState({
      isShowChartDataSource: !this.state.isShowChartDataSource
    })
  };
  analysisModelChange(analysisModelId) {
    this.newAnalysisModelId = analysisModelId;
    this.props.dispatch(analysisModelChange({ id: analysisModelId }));
  }
  onDragStart(event, controlName = '') {
    let text = { controlName: controlName, control: controlName }
    text = JSON.stringify(text)
    event.dataTransfer.setData('text', text);
    // event.dataTransfer.setData('controlName', controlName);
    // event.dataTransfer.setData('control', controlName);
  };
  render() {
    const { leftBoard1Width } = this.props;
    const controlStyle = { width: '100%', height: 26, fontSize: 12 };
    const iStyle = { height: 26, lineHeight: '26px' }
    let Bistyle = { width: leftBoard1Width };
    if (window.BI_APP_CONFIG.bi_integratedMode) {
      Bistyle.height = 'calc(100vh)';
    }
    let dataSourceElement =
      (<div className="chart-datasource pd0 base-border-right" style={{...Bistyle,height:'100%'}}>
        <div className="pd0 mg0 collapse-header-div">
          <ul className="mg0 bi-border-bottom" style={{ height: '40px' }}>
            <li className="datasource" style={{ height: '40px', lineHeight: '40px' }}>数据</li>
            <li className="collapse-arrow" style={{ top: '11px' }}>
            <i className="icon iconfont icon-left" onClick={this.tableDataSourceToggle.bind(this)} /></li>
          </ul>
        </div>
        <div className="pd15" style={{ padding: '15px 15px 0px 15px' }}>
          <div className="tabletree-input" style={{ height: 30, lineHeight: '30px' }}>
            <span className="letterspace2">控件</span>
          </div>
          <ul className="tableTree-ul" style={{
            height: '121px', marginTop: 0
            , marginBottom: 0
          }}>
            <li id="tableLi"
              draggable='true' onDragStart={(e) => this.onDragStart(e, 'table')} style={controlStyle}>
              <div id="liTable" style={iStyle}><i className="icon iconfont icon-Dynamicform" style={iStyle} /><span>动态表格</span></div>
            </li>
            <li id="matrixLi" draggable='true'
              onDragStart={(e) => this.onDragStart(e, 'matrix')} style={controlStyle}>
              <div id="matrix" style={iStyle}><i className="icon iconfont icon-matrix" style={iStyle} /><span>交叉表格</span></div>
            </li>
            <li id="matrix2" draggable='true'
              onDragStart={(e) => this.onDragStart(e, 'matrix2')} style={controlStyle}>
              <div id="matrix2" style={iStyle}><i className="icon iconfont icon-Textbox" style={iStyle} /><span>复杂表格</span></div>
            </li>
            <li id="textBoxLi" draggable='true'
              onDragStart={(e) => this.onDragStart(e, 'textarea')} style={controlStyle}>
              <div id="textBox" style={iStyle}><i className="icon iconfont icon-Textbox" style={iStyle} /><span>文本框</span></div>
            </li>
          </ul>
        </div>
        <div className="pd15 dynamicTable" style={{height:'calc(100% - 205px)'}}>
          <AnalysisModelSelect
            analysisModelId={this.analysisModelId || this.props.analysisModuleId}
            analysisModelChange={this.analysisModelChange.bind(this)}
            categoryId={this.props.categoryId}
          />
          {
            this.state.isShowDimensionSearch ?
              <div className="tabletree-input">
                <SearchC changeHandle={this.searchDimension} />
              </div>
              :
              <div className="tabletree-input">
                <span className="letterspace2 fll">维度</span>
                <i
                  className="icon iconfont icon-search cursor-pointer fsz14 flr"
                  onClick={this.showSearch.bind(this, 'dimension')}
                />
                <i title="获取全部" className="icon iconfont icon-ALL cursor-pointer fsz14 flr mgr8"
                   onClick={this.clearCondition.bind(this, 'dimension')} />
              </div>
          }
          <TableTree ttype="dimension" filter={this.state.dimensionCondition} datasource={this.props.datasource} />
          {
            this.state.isShowMeasureSearch ?
              <div className="tabletree-input">
                <SearchC changeHandle={this.searchMeasure} />
              </div>
              :
              <div className="tabletree-input">
                <span className="letterspace2 fll">度量</span>
                <i
                  className="icon iconfont icon-search cursor-pointer fsz14 flr"
                  onClick={this.showSearch.bind(this, 'measure')}
                />
                <i title="获取全部" className="icon iconfont icon-ALL cursor-pointer fsz14 flr mgr8"
                   onClick={this.clearCondition.bind(this, 'measure')} />

              </div>
          }
          <TableTree ttype="measure" filter={this.state.measureCondition} datasource={this.props.datasource} />
        </div>
      </div>);
    return (
      this.state.isShowChartDataSource ?
        dataSourceElement
        :
        <div className="w42 fll">
          <div className="datasourceCollapse-header cursor-pointer base-border-right bi-border-bottom">
            <i
              className="icon iconfont icon-right"
              onClick={this.tableDataSourceToggle.bind(this)}
            />
          </div>
          <div className="datasourceCollapse base-border-right">
            <span>数据源</span>
          </div>
        </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    datasource: state.chartDataSource.datasource,
  };
};

export default connect(
  mapStateToProps
)(ModelReference);
