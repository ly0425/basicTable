import React, { Component } from 'react';
import { Input, Collapse, TreeSelect, Select, Icon, } from '@vadp/ui';
import { connect } from 'react-redux';
import NetUtil from 'containers/HttpUtil';
import IndexClassTree from 'public/Index/IndexClassTree';
import { IndexClassSearchBase } from 'public/Index/IndexClassSearch';
import IndexList from 'public/Index/IndexList';
import { setSelectedNode } from 'routes/datamodel/index/indexActions';
//import TableTree from './TableTree.js';
import { searchIndexClass } from 'routes/datamodel/index/indexActions';
import { loadIndexClass, loadIndexList, setIndexClass } from 'routes/datamodel/index/indexActions';
import SpreadsheetDvaModel from '../SpreadsheetDvaModel';
import { bindModel } from '~/models/utils';
import { async } from 'rxjs/internal/scheduler/async';
import { getGroupedFieldValue } from '../SpreadsheetApi';
const Panel = Collapse.Panel;
const TreeNode = TreeSelect.TreeNode;

const TitleSearch = ({ title, isSearch, onShowSearch, onSearch, onShowAll }) => {
  return (
    isSearch ? <div className="tabletree-input" style={{ height: '40px' }}>
      <IndexClassSearchBase onSearch={onSearch} />
    </div> : <div className="tabletree-input" style={{ height: '40px' }}>
        <span className="letterspace2 fll">{title}</span>

        <i className="icon iconfont icon-search cursor-pointer fsz14  flr" onClick={onShowSearch}></i>
        <i title="获取全部" className="icon iconfont icon-ALL cursor-pointer fsz14 flr mgr8" onClick={onShowAll}></i>
      </div>
  );
};

class ModelReference extends Component {
  actions = {
    ...SpreadsheetDvaModel.producers,
    ...SpreadsheetDvaModel.effects,
  }; // 欺骗 Code
  constructor(props) {
    super(props);
    this.state = {
      isShowIndexClassSearch: false,
      isShowIndexSearch: false,
      dimensionValArray: []
    }
    this.actions = bindModel(SpreadsheetDvaModel, props.dispatch);
  }

  componentDidMount() {
    this.actions.loadTree();
  }

  searchNode(nodes, condition) {
    if (!nodes) return;
    for (const node of nodes) {
      if (condition(node)) return node;
      const child = this.searchNode(node.children, condition);
      if (child) return child;
    }
  }

  onIndexClassChange = (value) => {
    const key = typeof value == 'object' ? value.value : value;
    let node = this.searchNode(this.props.indexClassTreeNodes, n => n.key === key);
    if (node) {
      this.actions.selectAnalysisNode({ node: null });
      this.props.dispatch(setSelectedNode(node));
    } else {
      node = this.searchNode([this.props.spreadsheet.categoryTree], n => n.key === key);
      this.actions.selectAnalysisNode({ node });
    }
  }

  filterTreeNode = (inputValue, treeNode) => {
    return treeNode.props.title.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0;
  }

  tableDataSourceToggle = () => {
    const { isShowChartDataSource, onToggle } = this.props;
    onToggle && onToggle(!isShowChartDataSource);
  }

  onDragControl = (ev, controlName) => {
    let text = {
      controlName: controlName,
    }
    text = JSON.stringify(text);
    ev.dataTransfer.setData("text", text);
    console.log(text);
  }
  clearClassCondition() {
    //搜索清空
    this.props.dispatch(searchIndexClass(""));
  }
  clearIndexCondition() {
    this.setState({ word: '' });
  }
  handleClassSearch = (text) => {
    this.props.dispatch(searchIndexClass(text));
    this.setState({ isShowIndexClassSearch: false });
  }
  handleIndexSearch = (text) => {
    this.setState({ isShowIndexSearch: false, word: text });
  }
  handleAnalysisModelChange = (value) => {
    this.actions.selectAnalysisModel({ id: value });
  }
  handleDragField(field, event) {
    console.log('drag field', field);
    let dragType = 'field';
    if (field.dimensionSpecificVal) {
      dragType = 'dimensionSpecificVal';
    }
    const text = JSON.stringify({ ...field, dragType });
    event.dataTransfer.setData('text', text);
  }
  dimensionValChange = async (v) => {
    if (v) {
      const { fields } = this.props.spreadsheet;
      const currentMap = fields.filter(item => item.fieldType == 'dimension' && ((item.aliasName || item.fieldName) == v))[0];
      try {
        const res = await getGroupedFieldValue({
          groupfield: [
            {
              tableName: currentMap.tableName,
              aliasName: (currentMap.aliasName || currentMap.fieldName)
            }
          ],
          id: currentMap.analysisModelId
        })

        this.setState({
          dimensionValArray: res,
        })
      } catch (err) {
        console.log(err);
      }
    }
  }
  renderTreeNodes(nodes) {
    if (!nodes || nodes.length === 0) {
      return;
    }
    return nodes.map(node => (
      <TreeNode value={node.key} node={node} title={node.title} key={node.key}>
        {this.renderTreeNodes(node.children)}
      </TreeNode>
    ));
  }
  renderIndexes(selectedNode) {
    return (
      <div style={{ height: '100%' }}>
        <TitleSearch
          title='指标'
          isSearch={this.state.isShowIndexSearch}
          onSearch={this.handleIndexSearch.bind(this)}
          onShowSearch={() => this.setState({ isShowIndexSearch: true })}
          onShowAll={this.clearIndexCondition.bind(this)}
        />
        <IndexList
          word={this.state.word}
          containerStyle={{ maxHeight: '300px', overflow: 'hidden auto' }}
        />
      </div>
    );
  }
  renderField = (field) => {
    return (
      <div
        style={{ cursor: 'pointer' }}
        key={field.aliasName}
        draggable="true"
        onDragStart={this.handleDragField.bind(this, field)}
      >{field.comments}</div>
    );
  }
  renderDimensionV = (field) => {
    const { dimensionValArray } = this.state;
    return (
      <Panel header={field.comments} key={field.aliasName || field.fieldName} style={{
        border: 0,
        overflow: 'hidden',
      }}>
        {
          dimensionValArray.map(item => {
            const dimensionSpecificVal = item[field.aliasName || field.fieldName];
            return (<p style={{ textIndent: '2em', cursor: 'pointer' }}
              draggable="true"
              onDragStart={this.handleDragField.bind(this, { ...field, dimensionSpecificVal })}>
              {dimensionSpecificVal}
            </p>)
          })
        }
      </Panel>
    )
  }
  renderFields(selectedNode) {
    const { analysisModels, fields } = this.props.spreadsheet;
    const dimensionArray = [];
    const measureArray = [];
    const { spreadsheet } = this.props;
    const { ReportBody } = spreadsheet;
    const { sheets } = ReportBody;
    let spreadsheetType;
    if (sheets.length) {
      spreadsheetType = sheets[0].present.spreadsheetType;
    }
    const cb = spreadsheetType == 'specialCost' ? this.renderDimensionV : this.renderField;
    if (fields) {
      for (const field of fields) {
        if (field.fieldType === 'dimension') {
          dimensionArray.push(field);
        } else if (field.fieldType === 'measure') {
          measureArray.push(field);
        }
      }
    }
    return (
      <div style={{ width: '100%', height: '100%' }}>
        <Select onChange={this.handleAnalysisModelChange} style={{ width: '100%', marginTop: 5 }}
          placeholder='请选择分析模型'
        >
          {analysisModels && analysisModels.map(m => (
            <Select.Option key={m.id}>{m.name}</Select.Option>
          ))}
        </Select>
        <div className='dimensionInfo' style={{ overflow: 'visible', height: '100%', margin: '12px 0px' }}>
          <div style={{ fontWeight: 'bold', marginTop: 10 }}>维度</div>
          <div style={{ maxHeight: '150px', overflow: 'auto' }}>
            {
              spreadsheetType == 'specialCost' ? (<Collapse
                bordered={false}
                onChange={this.dimensionValChange}
                expandIcon={({ isActive }) => <Icon type="caret-right" rotate={isActive ? 90 : 0} />}
                accordion
              >{dimensionArray.map(cb)}</Collapse>) :
                dimensionArray.map(cb)}
          </div>
          <div style={{ fontWeight: 'bold', marginTop: 10 }}>度量</div>
          <div style={{ maxHeight: '150px', overflow: 'auto' }}>
            {measureArray.map(this.renderField)}
          </div>
        </div>
      </div>
    );
  }
  render() {
    const controlStyle = { width: '100%', height: 30, fontSize: 12 };
    let treeNodes = this.props.indexClassTreeNodes;
    if (this.props.spreadsheet.categoryTree) {
      treeNodes = [...treeNodes, this.props.spreadsheet.categoryTree];
    }
    const selectedNode = this.props.spreadsheet.selectedAnalysisNode || this.props.selectedNode;
    const treeSelectValue = (selectedNode && selectedNode.key) ? { value: selectedNode.key } : undefined;
    return (
      <div className='spreadsheet-toolbox' style={{ height: '100%' }}>
        {
          this.props.isShowChartDataSource ?
            (<div className="chart-datasource pd0 base-border-right" style={{ height: '100%', width: '100%' }}>
              <div className="pd0 mg0 collapse-header-div" style={{ width: '100%' }}>
                <ul className="mg0 bi-border-bottom">
                  <li className="datasource">工具</li>
                  <li className="collapse-arrow"><i className="icon iconfont icon-left"
                    onClick={this.tableDataSourceToggle.bind(this)}></i></li>
                </ul>
              </div>
              <div className="pd15" style={{ height: 'calc(100% - 46px)', minHeight: '600px', padding: '5px' }}>

                <Collapse accordion defaultActiveKey={['2']} style={{ height: '100%' }}>
                  <Panel header='控件' key='1'>
                    <ul className="tableTree-ul" style={{ height: '35px' }}>
                      <li draggable='true' onDragStart={(e) => this.onDragControl(e, 'spreadsheet')} style={controlStyle}>
                        <i className="fa fa-table"></i><span>电子表格</span>
                      </li>
                    </ul>
                  </Panel>
                  <Panel header='数据模型' key='2'>
                    <div style={{ height: '75%' }}>

                      <TreeSelect
                        showSearch
                        style={{ width: '100%' }}
                        value={treeSelectValue}
                        dropdownStyle={{ maxHeight: 300, overflow: 'auto' }}
                        placeholder='请选择分类'
                        treeDefaultExpandAll
                        dropdownMatchSelectWidth={false}
                        labelInValue
                        onChange={this.onIndexClassChange}
                        filterTreeNode={this.filterTreeNode}
                      >
                        {this.renderTreeNodes(treeNodes)}
                      </TreeSelect>

                      {/* <TitleSearch
                        title='分类'
                        isSearch={this.state.isShowIndexClassSearch}
                        onSearch={this.handleClassSearch.bind(this)}
                        onShowSearch={() => this.setState({ isShowIndexClassSearch: true })}
                        onShowAll={this.clearClassCondition.bind(this)}
                      /> */}
                      {/* <div style={{ minHeight: '150px', height: 'calc(40% - 100px)', overflow: 'auto', marginRight: '-15px' }}>
                        <IndexClassTree onChange={this.onIndexClassChange} />
                      </div> */}
                      {selectedNode && selectedNode.isAnalysis
                        ? this.renderFields(selectedNode)
                        : this.renderIndexes(selectedNode)}
                    </div>
                  </Panel>
                </Collapse>

              </div>
            </div>) : (<div className="w42 fll">
              <div className="datasourceCollapse-header cursor-pointer base-border-right bi-border-bottom">
                <i className="icon iconfont icon-right"
                  onClick={this.tableDataSourceToggle.bind(this)}
                ></i>
              </div>
              <div className="datasourceCollapse base-border-right">
                <span>工具</span>
              </div>
            </div>)
        }
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => ({
  indexClassTreeNodes: state.indexModel.indexClass.nodes || [],
  selectedNode: state.indexModel.indexClass.selected,
  spreadsheet: state.Spreadsheet,
})
export default connect(
  mapStateToProps
)(ModelReference)
export {
  TitleSearch
}
