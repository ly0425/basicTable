import React, { Component } from 'react';
import { Layout, Tooltip, Modal, Button, Icon, Spin } from '@vadp/ui';
import ModelReference from './modelReference';
import SpreadsheetDesignArea from './SpreadsheetDesignArea';
import Common from 'components/Print/Common';
import { connect } from 'react-redux';
import { routerRedux } from 'dva/router';
import NetUtil from 'containers/HttpUtil';
import { addTable, reset, previewTable, updateParams, toggleProperty } from '../SpreadsheetAction';
import * as SpreadsheetUtil from './SpreadsheetUtils';
import SaveModal from 'public/SaveModal';
import ToolBar from 'public/ToolBar';
import UrlUtil from 'components/Public/UrlUtil';
import Message from 'public/Message';
import SpreadsheetParamModal from './SpreadsheetParamModal';
import isRoutePublic from 'constants/IntegratedEnvironment';
import { fetchTemplate, saveTemplate } from '../SpreadsheetApi';
import SheetTemplate from './SheetTemplate';
import SplitPane from 'react-split-pane';
import PropTypes from 'prop-types';
import { setSelectedNode } from 'routes/datamodel/index/indexActions';
const comm = new Common();
const { Sider } = Layout;
let analysisModelID;

/**
 * 基本 BI 功能
 */
export class SpreadsheetModelBase extends Component {
  static contextTypes = {
    // 是否在弹窗中
    isInModal: PropTypes.bool
  }

  state = {
    saveModalVisible: false,
    paramModelVisible: false,
    isShowChartDataSource: true,
    leftPaneWidth: 200,
  };
  editType = UrlUtil.getUrlParams(this.props, 'type');
  saveData = {
    name: '',
    remark: ''
  };
  componentDidMount() {
    let json = [];
    if (this.editType === "edit") {
      let that = this;
      //主题id（新增）或者模型id（编辑）
      this.modelID = UrlUtil.getUrlParams(this.props, 'id');
      this.category_id = this.props.selectedKeys[0];
      NetUtil.get('tables/get/' + this.modelID, null, function (data) {
        if (data.data == undefined) return;
        analysisModelID = data.data.analysis_module_id;
        try {
          json = JSON.parse(data.data.content);
          that.saveData.name = data.data.name;
          that.saveData.remark = data.data.remark;
        } catch (error) {
          console.error("json解析报错了：", error);
          return;
        } finally {

        }
        let table = SpreadsheetUtil.jsonToTable(json, data.data.analysis_module_id);
        //刷新表格->表格展现
        let objTablePara = {
          areaName: 'ReportBody',
          table
        };
        that.props.dispatch(addTable(objTablePara));
        // 参数设置
        that.props.dispatch(updateParams(json.params));

        that.keepSavedData();
      }, function (data) {
        console.log(data)
      })
    } else {
      this.category_id = UrlUtil.getUrlParams(this.props, 'id');
      NetUtil.get('/analysismodel/getall', null, function (data) {
        if (data.data && data.data.length > 0) {
          analysisModelID = data.data[0].analysis_model$id;
        }
      }, function (data) {
        console.log(data);
      });
    }
    /* 增加快捷键Ctrl+S保存功能-start edit by liuran */
    document.addEventListener('keydown', (e) => {
      if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
        e.preventDefault();
        this.handleSave();
      }
    });
    /* 增加快捷键Ctrl+S保存功能-end */
  }
  componentWillUnmount() {
    this.props.dispatch(reset());
  }
  keepSavedData() {
    const { ReportBody, conditions } = this.props;
    let table;
    if (ReportBody.sheets && ReportBody.sheets.length > 0) {
      table = { ...ReportBody.sheets[0].present };
    }
    this.setState({ savedData: { table, params: conditions } });
  }
  needSave() {
    const { savedData } = this.state;
    const { ReportBody, conditions: params } = this.props;
    const savedTable = savedData && savedData.table;
    const savedParams = savedData && savedData.params;
    let table;
    if (ReportBody.sheets && ReportBody.sheets.length > 0) {
      table = ReportBody.sheets[0].present;
    }

    if (params != savedParams) {
      return false;
    }
    if (table && savedTable) {
      return table.tableRows !== savedTable.tableRows
        || table.widths !== savedTable.widths
        || table.heights !== savedTable.heights
        || table.position !== savedTable.position;
    }
    return !!table !== !!savedTable;
  }
  saveTableModel(saveData) {
    if (saveData.name) {
      this.saveData.name = saveData.name;
    }
    if (typeof saveData.remark !== 'undefined') {
      this.saveData.remark = saveData.remark;
    }
    if (!this.saveData.name) {
      Message.info('必须输入模型名称！');
      return;
    }
    let that = this;
    let objTables = this.props.ReportBody.sheets;
    if (objTables.length === 0) {
      return;
    }

    if (!analysisModelID) {
      alert('分析模型不能为空。');
      return;
    }

    if (!SpreadsheetUtil.validateTemplate(objTables[0].present)) {
      return;
    }

    let tableJson = SpreadsheetUtil.tableToJson(objTables, analysisModelID);
    // 参数设置
    tableJson.params = this.props.conditions;
    let para = {
      name: this.saveData.name,
      remark: this.saveData.remark,
      type: 'excel',
      category_id: this.category_id,
      content: JSON.stringify(tableJson),
      analysis_module_id: analysisModelID//分析模型id
    };
    let url;
    if (this.editType === "add") {
      url = '/excel/add';
    } else {
      para.id = this.modelID;
      url = '/excel/update';
    }
    NetUtil.post(url, para, function (data) {
      if (data.code === 200) {
        if (that.editType === 'add') {
          that.modelID = data.data;
          that.editType = 'edit';
        }
        Message.success('保存成功。');
        that.props.dispatch(routerRedux.push(`${isRoutePublic}visualizationModel/SpreadsheetModelManager`));

        that.keepSavedData();
      } else {
        Message.error('保存失败。');
      }
    }, function (data) {
      console.log(data);
      Message.error('保存失败。');
    });
  }

  // 工具栏按钮函数
  handleSave() {
    this.showSaveModal();
  }
  hideSaveModal = () => {
    this.setState({ saveModalVisible: false });
  }
  showSaveModal = () => {
    if (this.props.ReportBody.sheets.length > 0) {
      this.setState({ saveModalVisible: true });
    }
  }
  tryGoBack() {
    // 先判断是否需要保存
    if (this.needSave()) {
      this.setState({ confirmSaveModalVisible: true });
    } else {
      this.goBack();
    }
  }
  tryGoDashboard() {
    if (this.needSave()) {
      this.setState({ confirmSaveModalVisible: true });
    } else {
      window.history.back();
    }
  }
  goBack() {
    this.props.dispatch(routerRedux.push(`${isRoutePublic}visualizationModel/SpreadsheetModelManager`));
  }
  previewStatus() {
    if (this.props.ReportBody.sheets.length > 0) {
      this.props.dispatch(previewTable(true));
    }
  }
  showParameterSettingModal() {
    if (this.props.ReportBody.sheets.length > 0) {
      this.setState({ paramModelVisible: true });
    }
  }
  togglePropsSetting() {
    this.props.dispatch(toggleProperty());
  }
  toolBarData() {
    const toolSetup = [{
      title: '返回',
      handler: this.tryGoBack.bind(this),
      type: 'goBack',
    }, {
      title: '预览',
      handler: this.previewStatus.bind(this),
      type: 'savePriview',
    }, {
      title: '参数设置',
      handler: this.showParameterSettingModal.bind(this),
      type: 'parameterSetting',
    }, {
      title: '保存',
      handler: this.handleSave.bind(this),
      type: 'save',
      // className: 'icon iconfont icon-save' + (this.needSave() ? ' spreadsheet-need-save' : ''),
      className: 'icon iconfont icon-save',
    }, {
      title: '属性设置 ',
      handler: this.togglePropsSetting.bind(this),
      type: 'propsSetting',
    }
      // {
      //   title: '录入界面（临时测试入口）',
      //   handler: () => this.props.dispatch(routerRedux.push(`${isRoutePublic}visualizationModel/SpreadsheetRuntime/${this.reportId || this.modelID}`)),
      //   type: 'data',
      // }
    ];
    if (this.props.match.params.params === '{"goBackUrl":"dashboard"}' || this.props.match.params.params === '{"goBackUrl":"tabs"}') {
      toolSetup.unshift({
        title: '仪表板',
        handler: this.tryGoDashboard.bind(this),
        type: 'dashboard'
      })
    }
    return toolSetup;
  }
  getReportName() {
    return this.saveData.name;
  }
  handleToggle = () => {
    this.setState(state => ({ isShowChartDataSource: !state.isShowChartDataSource }));
  }
  handleResize = (size) => {
    this.setState({ leftPaneWidth: size });
  }
  renderToolBox() {
    return <ModelReference isShowChartDataSource={this.state.isShowChartDataSource} onToggle={this.handleToggle} />;
  }
  render() {
    const { inModal: showInModal = false } = this.props;
    const saveModal = this.state.saveModalVisible ?
      (<SaveModal
        category_id={this.category_id}
        data={this.saveData}
        visible={this.state.saveModalVisible}
        onOk={this.saveTableModel.bind(this)}
        onCancel={this.hideSaveModal}
        modelType="excel"
      />) : null;

    let ID = comm.isCheckEmpty(UrlUtil.getUrlParams(this.props, 'id'));
    let className = 'margin0 padding0 spreadsheet-model';
    if (this.context && this.context.isInModal) {
      className += ' spreadsheet-model-in-modal';
    }
    if (this.props.className) {
      className += ' ' + this.props.className;
    }
    let subHeight = showInModal ? '16px' : '64px';
    return (
      <div className="bi" style={{ height: '100%' }}>
        <SplitPane className={className}
          style={{
            position: 'relative',
            // 这里的高度设置需要考虑到组件处于弹框中的情况，需要区别对待一下
            height: showInModal ? 'calc(100vh - ' + subHeight + ')' : '100%',
          }}
          pane2Style={{ MSFlex: '1 1 0%' }}

          split="vertical"
          allowResize={this.state.isShowChartDataSource}
          minSize={135}
          size={this.state.isShowChartDataSource ? this.state.leftPaneWidth : 'auto'}
          onChange={this.handleResize}
          resizerStyle={{
            width: '6px',
            margin: '0 -3px',
            zIndex: 2,
            cursor: this.state.isShowChartDataSource ? 'ew-resize' : '',
          }}
        >
          {/* 左侧面板 */}
          {this.renderToolBox()}
          {/* 右侧面板 */}
          <div style={{ height: '100%' }}>
            <ToolBar data={this.toolBarData()} title={this.getReportName()} />
            <SpreadsheetDesignArea
              id={ID}
              params={this.props.params || this.props.match.params}
              sheetComponent={this.props.sheetComponent}
              reportName={this.getReportName()}
              pageParams={this.pageParams}
            />
          </div>
          {/* 注意 SplitPane 中只支持两个子组件，对话框等组件不能再添加进来 */}
        </SplitPane>
        {saveModal}
        {this.state.paramModelVisible && <SpreadsheetParamModal visible={true} onClose={() => this.setState({ paramModelVisible: false })} />}
        {this.state.confirmSaveModalVisible && (
          <Modal visible={this.state.confirmSaveModalVisible} title='返回'
            wrapClassName="bi"
            onCancel={e => {
              this.setState({ confirmSaveModalVisible: false });
            }}
            footer={[
              <Button onClick={e => {
                this.setState({ confirmSaveModalVisible: false });
                this.showSaveModal();
              }}>保存</Button>,
              <Button onClick={e => {
                this.setState({ confirmSaveModalVisible: false });
                this.goBack();
              }}>不保存</Button>,
              <Button onClick={e => {
                this.setState({ confirmSaveModalVisible: false });
              }}>取消</Button>
            ]}>是否保存修改？</Modal>
        )}
      </div>
    )
  }
}

/**
 * OES 调用，模板设计
 */
class SpreadsheetTemplate extends SpreadsheetModelBase {
  isTemplateEdit;
  search;
  pageParams = {};
  constructor(props) {
    super(props);
    // 查询字符串
    this.search = props.location.search;
    // 页面参数
    if (this.search.indexOf('?') === 0) {
      let array = this.search.slice(1).split('&');
      for (const str of array) {
        const pair = str.split('=');
        if (pair.length === 2) {
          this.pageParams[pair[0]] = decodeURIComponent(pair[1]);
        }
      }
      window.pageParams = this.pageParams;
      console.log('pageParams', this.pageParams);
    }
  }
  componentDidMount() {
    this.init();
    const { onLoad } = this.props;
    onLoad && onLoad(() => {
      this.handleIsChanged();
      this.handleSave();
    });
    /* 增加快捷键Ctrl+S保存功能-start edit by liuran */
    document.addEventListener('keydown', (e) => {
      if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
        e.preventDefault();
        this.handleSave();
      }
    });
    /* 增加快捷键Ctrl+S保存功能-end */
  }
  async init() {
    this.reportId = UrlUtil.getUrlParams(this.props, 'id');
    this.category_id = this.props.selectedKeys[0];
    let data;
    try {
      data = await fetchTemplate(this.reportId);
    } catch (err) {
      if (err.code === 99999) {
        // 不存在
        this.generateTable();
        return;
      }
    }
    if (!data || !data.content || !data.reportId) {
      this.generateTable();
      return;
    }
    this.isTemplateEdit = true;
    const json = JSON.parse(data.content);
    this.saveData.name = data.name;
    this.saveData.remark = data.remark;
    this.saveData.tableJson = json;
    let table = SpreadsheetUtil.jsonToTable(json, data.analysis_module_id);
    if (table && data.indexes) {
      // 显示指标编码及名称
      table.present.indexMap = {};
      data.indexes.forEach(({ indexId, indexName, indexCode }) => {
        table.present.indexMap[indexId] = { code: indexCode || '', name: indexName || '' };
      });
    }
    table.present.isFinance = true;
    //刷新表格->表格展现
    let objTablePara = {
      areaName: 'ReportBody',
      table
    };
    this.props.dispatch(addTable(objTablePara));
    // 参数设置
    this.props.dispatch(updateParams(json.params));

    this.keepSavedData();
  }
  generateTable() {
    this.props.dispatch({
      type: 'Spreadsheet/generateTable',
      columnCount: 20,
      rowCount: 30,
    });
  }
  handleIsChanged() {
    const newTableJson = JSON.parse(JSON.stringify(SpreadsheetUtil.tableToJson(this.props.ReportBody.sheets)));
    const oldTableJson = JSON.parse(JSON.stringify(this.saveData.tableJson));
    const isSame = {
      compare: function (oldData, newData) {
        if (oldData === newData) return true
        if (isSame.isObject(oldData) && isSame.isObject(newData) && Object.keys(oldData).length === Object.keys(newData).length) {
          for (const key in oldData) {
            if (oldData.hasOwnProperty(key)) {
              if (!isSame.compare(oldData[key], newData[key])) {
                return false
              }
            }
          }
        } else if (isSame.isArray(oldData) && isSame.isArray(oldData) && oldData.length === newData.length) {
          for (let i = 0, length = oldData.length; i < length; i++) {
            if (!isSame.compare(oldData[i], newData[i])) {
              return false
            }
          }
        } else {
          return false
        }
        return true
      },
      isObject: function (obj) {
        return Object.prototype.toString.call(obj) === '[object Object]'
      },
      isArray: function (arr) {
        return Object.prototype.toString.call(arr) === '[object Array]'
      }
    }
    return !isSame.compare(oldTableJson, newTableJson);
  }
  handleSave() {
    this.handleSaveAsync();
  }

  async handleSaveAsync() {
    const saveData = this.saveData;
    let that = this;
    let objTables = this.props.ReportBody.sheets;
    if (objTables.length === 0) {
      return;
    }

    if (!SpreadsheetUtil.validateTemplate(objTables[0].present)) {
      return;
    }

    let tableJson = SpreadsheetUtil.tableToJson(objTables);
    // 参数设置
    tableJson.params = this.props.conditions;
    let para = {
      ...this.pageParams,
      reportId: this.reportId,
      name: this.saveData.name || '',
      // remark 由 URL 传来
      // remark: this.saveData.remark,
      type: 'excel',
      category_id: this.category_id,
      content: JSON.stringify(tableJson),
    };
    let saveType;
    if (!this.isTemplateEdit) {
      saveType = 'add';
    } else {
      saveType = 'update';
    }
    try {
      this.setState({ saving: true });
      const data = await saveTemplate(saveType, para);
      if (!this.isTemplateEdit) {
        this.isTemplateEdit = true;
      }
      Message.success('保存成功。');
      this.saveData.tableJson = tableJson;
      that.keepSavedData();
    } catch (err) {
      console.log(err);
      if (err.code === 501) Message.error(err.msg);
      else Message.error('保存失败。');
    } finally {
      this.setState({ saving: false });
    }
  }
  toolBarData() {
    let saveSpin;
    if (this.state.saving) {
      const saveIcon = <Icon type="loading" style={{ fontSize: 18 }} spin />;
      saveSpin = <Spin indicator={saveIcon} />;
    }
    return [{
      title: '保存',
      handler: this.handleSave.bind(this),
      type: 'save',
      // className: 'icon iconfont icon-save' + (this.needSave() ? ' spreadsheet-need-save' : ''),
      className: 'icon iconfont icon-save',
      // component: saveSpin,
    }, {
      title: '属性设置 ',
      handler: this.togglePropsSetting.bind(this),
      type: 'propsSetting',
    }];
  }
  getReportName() {
    return this.pageParams.reportName;
  }
}

/**
 * 总入口
 */
class SpreadsheetModelContainer extends Component {

  editType = UrlUtil.getUrlParams(this.props, 'type');
  componentDidMount() {
    this.props.dispatch(setSelectedNode());
  }
  render() {
    if (this.editType === 'template') {
      // 报表定义
      SpreadsheetUtil.setIsBI(false);
      return <SpreadsheetTemplate {...this.props} sheetComponent={SheetTemplate} />;
    } else {
      return <SpreadsheetModelBase {...this.props} />;
    }
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    analysisModuleId: state.analysisModel.analysisModuleId,
    ReportBody: state.Spreadsheet.ReportBody,
    selectedKeys: state.modelManager.selectedKeys,
    conditions: state.Spreadsheet.params
  }
}
export default connect(mapStateToProps)(SpreadsheetModelContainer);
