import React, { Component } from 'react';
import { Input, Collapse, TreeSelect, Select } from '@vadp/ui';
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
import Dimension from './Dimension';
import { bindModel } from '~/models/utils';
import { TitleSearch } from './modelReference';
const Panel = Collapse.Panel;
const TreeNode = TreeSelect.TreeNode;

class ToolBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isShowIndexClassSearch: false,
      isShowIndexSearch: false,
    }
    this.actions = bindModel(SpreadsheetDvaModel, props.dispatch);
  }

  componentDidMount() {
    this.actions.loadTree();
  }

  tableDataSourceToggle = () => {
    const { isShowChartDataSource, onToggle } = this.props;
    onToggle && onToggle(!isShowChartDataSource);
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
  handleDragField(field, event) {
    console.log('drag field', field);
    let dragType = 'field';
    if (field.dimensionSpecificVal) {
      dragType = 'dimensionSpecificVal';
    }
    const text = JSON.stringify({ ...field, dragType });
    event.dataTransfer.setData('text', text);
  }
  handleAnalysisModelChange = (value) => {
    this.actions.selectAnalysisModel({ id: value });
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
  renderIndexes(selectedNode) {
    return (
      <div style={{ height: 'calc(100% - 32px)', minHeight: 240 }}>
        <TitleSearch
          title='指标'
          isSearch={this.state.isShowIndexSearch}
          onSearch={this.handleIndexSearch.bind(this)}
          onShowSearch={() => this.setState({ isShowIndexSearch: true })}
          onShowAll={this.clearIndexCondition.bind(this)}
        />
        <IndexList
          word={this.state.word}
          containerStyle={{ maxHeight: 'calc(100% - 40px)', overflow: 'hidden auto' }}
        />
      </div>
    );
  }
  handleIndexSearch = (text) => {
    this.setState({ isShowIndexSearch: false, word: text });
  }
  clearIndexCondition() {
    this.setState({ word: '' });
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
      <div style={{ height: 'calc(100% - 32px)', minHeight: 240 }}>
        <Select onChange={this.handleAnalysisModelChange} style={{ width: '100%', marginTop: 5 }}
          placeholder='请选择分析模型'
        >
          {analysisModels && analysisModels.map(m => (
            <Select.Option key={m.id}>{m.name}</Select.Option>
          ))}
        </Select>
        <div className='dimensionInfo' style={{ height: 'calc(100% - 49px)', marginTop: 12 }}>
          <div style={{ fontWeight: 'bold' }}>维度</div>
          <div style={{ maxHeight: 'calc(50% - 27px)', overflow: 'hidden auto' }}>
            {
              dimensionArray.map(this.renderField)}
          </div>
          <div style={{ fontWeight: 'bold', marginTop: 12 }}>度量</div>
          <div style={{ maxHeight: 'calc(50% - 27px)', overflow: 'hidden auto' }}>
            {measureArray.map(this.renderField)}
          </div>
        </div>
      </div>
    );
  }
  render() {
    const controlStyle = { width: '100%', height: 30, fontSize: 12 };
    let treeNodes = this.props.indexClassTreeNodes || [];
    if (this.props.spreadsheet.categoryTree) {
      treeNodes = [...treeNodes, this.props.spreadsheet.categoryTree];
    }
    let selectedNode = this.props.spreadsheet.selectedAnalysisNode;
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
              <div className="pd15" style={{ height: 'calc(100% - 46px)', overflow: 'auto', padding: '5px' }}>
                <Collapse accordion defaultActiveKey={['2']} style={{ height: '100%' }}>
                  <Panel header='维度' key='1'>
                    <div style={{ height: 'calc(100% - 32px)' }}>
                      <Dimension pageParams={this.props.pageParams} />
                    </div>
                  </Panel>
                  <Panel header='数据模型' key='2'>
                    <div style={{ height: 'calc(100%)', overflow: 'auto' }}>
                      <TreeSelect
                        showSearch
                        style={{ width: '100%' }}
                        value={{ value: selectedNode && selectedNode.key }}
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
                      {/* {selectedNode && this.renderFields(selectedNode)} */}
                      {(selectedNode && selectedNode.isAnalysis)
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
)(ToolBox)
