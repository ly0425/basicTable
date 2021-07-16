import React, { Component } from 'react';
import { Modal, Button } from '@vadp/ui';
import { connect } from 'react-redux';
import { routerRedux } from 'dva/router';
import SaveModal from '@/components/Public/SaveModal';
import { setDataModelValue } from '@/actions/analysisModelAction';
import { modelReferenceVisible } from '@/actions/modelReferenceAction';
import NetUitl from '@/containers/HttpUtil';
import ConditionsModal from '@/components/Public/ConditionsModal';
// // import { resetDataSource } from 'actions/chartDataSourceAction.js'; // ly注释
import { analysisModel } from '@/components/Public/analysisModel';
import VHTable from '@/components/Public/VHTableAdapter';
// import UrlUtil from '/src/components/Public/UrlUtil';
// import ReportDesignArea from './ReportDesignArea';
// import { addTable, toggleShowProperty, resetTableState, updateTableMessageHead, updateTableMessageFoot, updateReportGroupsExp } from '../DynamicTableActions.js';
// import Matrix2Util from './matrix2/matrix2Utils';
// import MatrixUtil from './matrix/matrixUtils';
// import DynamicTableUtil from './DynamicTableUtils';
// import ModelReference from './ModelReference.js';
// import CollectionUtil from '/src/components/Public/CollectionUtil';
// import isRouterPublic from '/src/constants/IntegratedEnvironment';
// import TableHeadOrFootUtils from './TableHeadOrFootUtils';
// import { analysisModelChange } from '/src/actions/chartDataSourceAction.js';
// import { getProcInfo, analysisModelIdAdd } from '/src/components/Public/Fields.js';
// import { getAnalysisConditions, getConditionByAnalysisID, mergeFieldsAndCondition, analysisDataSourceTypeFn } from '/src/components/Public/analysisConditionModel';
// import VariableModal from './VariableModal';
// import QueryPlanModal from './QueryPlanModal';
// import Resize from '/src/components/Public/Resize';
// import { goToAnalysis } from '/src/components/Public/UrlUtil';
// import isRoutePublic from '/src/constants/IntegratedEnvironment';
const matrix2Util = Matrix2Util;
const matrixUtil = MatrixUtil;
const dynamicUtil = DynamicTableUtil;
const tableHeadOrFootUtil = TableHeadOrFootUtils;
const confirm = Modal.confirm;
const yearTotal = function (table) { //本年累计对条件特殊处理
  let newtable = JSON.parse(JSON.stringify(table));
  let state = true;
  return state ? newtable : state;
}
const lineMap = {
  isleftBoard1Resize: false,
}
class TableModel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      type: '', // 区分另存为
      conditionModal4Design: false,
      conditionsModalData: [],
      saveModalVisible: false,
      showCondition: false,
      previewModalVisible: false,
      variableVisible: false,
      queryPlanVisible: false,
      modelFields: [], // 分析模型所有字段，包括存储过程和api
      variableList: [],
      queryPlanSaveData: {
        columns: [],
        conditions: [],
        rowGroups: [],
        colGroups: [],
        orders: []
      },
      leftBoard1Width: 130,

    };
    this.analysisConditions = null;
    this.analysisCondition = null;
    this.analysisModelId = '';
    this.editType = UrlUtil.getUrlParams(this.props, 'type');
    if (this.editType !== 'edit') {
      this.category_id = UrlUtil.getUrlParams(this.props, 'id');
    }
    this.saveData = {
      name: '',
      remark: '',
    };
    this.toolBarData = [
      {
        title: '返回',
        handler: this.goBack.bind(this),
        type: 'goBack',
      },
      {
        title: '保存',
        handler: this.showSaveModel.bind(this, 'save'),
        type: 'save',
      },

      // {
      //   title: '另存为',
      //   handler: this.showModel.bind(this, 'as'),
      //   type: 'saveAs',
      // },
      {
        title: '预览',
        handler: this.previewModalVisible.bind(this),
        type: 'savePriview',
      },
      {
        title: '参数设置',
        handler: this.showParameterSettingModal.bind(this),
        type: 'parameterSetting',
      },
      {
        title: '变量设置 ',
        handler: this.showVariableSetting.bind(this),
        type: 'data',
      },

      {
        title: '查询方案设计器',
        handler: this.showQueryPlan,
        type: 'layout_seven',//
      },
      {
        title: '分析模型',
        handler: this.toAnalysis.bind(this),
        type: 'editWord',
      },
      {
        title: '属性设置 ',
        handler: this.showPropsSetting.bind(this),
        type: 'propsSetting',
      },
      ,
    ];
    if (UrlUtil.getUrlParams(this.props, 'params')) {
      this.toolBarData.shift();//返回去掉 删除第一个
      this.toolBarData.unshift({
        title: '返回上一级',
        handler: this.goToDashboard.bind(this),
        type: 'goToDashboard',
      });
    }
    if (this.editType === 'edit') {
      this.toolBarData.splice(1, 0, {
        title: '另存为',
        handler: this.printTemplate.bind(this),
        type: 'printset',
      })
    }
  }
 
  componentDidMount() {
    sessionStorage.setItem('temporaryStorage', JSON.stringify([])); // 为了清除参照的缓存
    let reportJson = [];
    if (this.editType === 'edit') {
      // app && app.addMenuListener && app.addMenuListener(this.listenerCloseAndSwitch)
      const that = this;
      // 主题id（新增）或者模型id（编辑）
      this.modelID = UrlUtil.getUrlParams(this.props, 'id');
      //this.category_id = this.props.selectedKeys[0];
      NetUitl.get(`tables/get/${this.modelID}`, null, (data) => {
        if (data.data === undefined) return;
        try {
          reportJson = JSON.parse(data.data.content);

        } catch (error) {
          Message.error(`获取报表模型报错了：${error}`);
          return;
        }
        if (reportJson.queryPlanData) {
          that.setState({
            queryPlanSaveData: reportJson.queryPlanData
          })
        }
        that.analysisModelId = data.data.analysis_module_id;
        that.category_id = data.data.category_id;
        // 刷新数据源-->维度和度量字段展现
        that.props.dispatch(analysisModelChange({ id: data.data.analysis_module_id }));
        // 刷新表格->表格展现
        const controlModel = {
          areaName: 'Body',
        };
        const reportItems = reportJson.Report.ReportBody.Items;
        if (reportItems.Tables && reportItems.Tables.length > 0) {
          const table = reportItems.Tables[0];
          if (table.type === 'table') {
            controlModel.table = dynamicUtil.JsonToTable(table,
              reportJson.Report.ReportHeader,
              reportJson.Report.dataSets);
            that.state.variableList = controlModel.table.tableProperty.globalVariableList;
          } else if (table.type === 'matrix2') {
            controlModel.table = matrix2Util.JsonToTable(table);
            that.state.variableList = controlModel.table.variableList || [];
          } else {
            controlModel.table = matrixUtil.JsonToTable(table);
          }
          that.state.conditionsModalData = controlModel.table.conditions;
        }
        const headData = tableHeadOrFootUtil.setDataStructure(reportJson.Report.ReportHeader);
        that.props.dispatch(updateTableMessageHead({ HeadOrFoot: headData }));
        this.initialHeader = headData;
        const FootData = tableHeadOrFootUtil.setDataStructure(reportJson.Report.ReportFooter);
        that.props.dispatch(updateTableMessageFoot({ HeadOrFoot: FootData }));
        this.initialFooter = FootData;
        that.props.dispatch(addTable(controlModel));
        this.initialModel = controlModel.table;
        if (reportJson.Report.printInfo ) {
          that.props.dispatch(updateReportGroupsExp({ reportGroupsExp: { value: reportJson.Report.printInfo.reportGroupExp,
            textboxId:reportJson.Report.printInfo.textboxId,
            formatString:reportJson.Report.printInfo.formatString,
          } }))

        }
        that.saveData.name = data.data.name;
        that.saveData.remark = data.data.remark;
      }, (data) => {
        Message.error(data);
      });
    }
    this.getAnalysisConditions();
  }
  // listenerCloseAndSwitch = (type, callF) => {
  //   if (type == "close" &&this.change()) {
  //
  //     confirm({
  //       title: '',
  //       content: "当前数据未保存,确认关闭吗？",
  //       okText: '确认',
  //       className: "bi bi-ant-confirm-confirm",
  //       cancelText: '取消',
  //       onOk() {
  //         callF();
  //       },
  //       onCancel() {
  //         return false;
  //       }
  //     });
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }
  componentWillReceiveProps(nextProps) {
    // this.updateAnalysisCondition();
    // if(nextProps.Body.tables.length === 0){
    //   this.setState({ variableList: [] });
    // }
    this.getAnalysismodelFields(nextProps);
  }
  toAnalysis = () => {
    if (this.editType == 'add') {
      Message.info('新增时不可跳转，请先保存');
      return;
    }
    const that = this;
    if (!this.change()) {
      that.props.dispatch(routerRedux.push(isRoutePublic + "dataModel/AnalysisModelNew/edit/" + this.props.analysisModuleId + "?goBackUrlForanalysisModel"));
      return;
    } else {

      confirm({
        title: '',
        content: '当前数据未保存，是否保存？',
        className: "bi bi-ant-confirm-confirm",
        okText: '确认',
        cancelText: '取消',
        onOk() {
          goToAnalysis.apply(that, [{ analysisModelId: that.props.analysisModuleId }, that.saveTableModal])
        },
        onCancel() {
          that.props.dispatch(routerRedux.push(isRoutePublic + "dataModel/AnalysisModelNew/edit/" + that.props.analysisModuleId + "?goBackUrlForanalysisModel"));
        }
      });
    }
    // this.props.dispatch(routerRedux.push("/dataModel/AnalysisModelNew/edit/" + this.props.analysisModuleId + "?goBackUrlForanalysisModel"));
  }
  goToDashboard() {
    const extraParams = UrlUtil.getUrlParams(this.props, 'params');
    const self = this;
    this.saveTableModal(() => {
      window.history.back();
      // self.props.dispatch(routerRedux.push(decodeURIComponent(JSON.parse(extraParams).goBackUrl)));
    })
  }
  getAnalysisConditions() {
    getAnalysisConditions((conditions) => {
      this.analysisConditions = conditions;
      // this.updateAnalysisCondition();
    })
  }
  // updateAnalysisCondition() {
  //   console.log(this.props.analysisModuleId)
  //   this.analysisCondition = getConditionByAnalysisID(this.analysisConditions, this.props.analysisModuleId).content;
  //   console.log(this.analysisCondition)
  // }
  // componentWillUpdate() {
  //   this.updateAnalysisCondition();
  // }
  componentWillUnmount() {
    this.props.dispatch(modelReferenceVisible(true));
    // this.props.dispatch(resetDataSource());
    this.props.dispatch(resetTableState());
    this.props.dispatch(setDataModelValue({ id: null }));
    // app && app.addMenuListener && app.removeMenuListener(this.listenerCloseAndSwitch)
  }
  showSaveModel = (type) => {
    this.setState({
      saveModalVisible: true,
      type,
    });
    this.saveType = '';
  }
  change = () => {
    let b = false;
    const { Header, Footer } = this.props;
    if (JSON.stringify(this.initialModel) != JSON.stringify(this.props.Body.tables[0]) ||
      JSON.stringify(this.initialHeader) != JSON.stringify(Header) ||
      JSON.stringify(this.initialFooter) != JSON.stringify(Footer)) {
      b = true;
    }
    return b;
  }
  // 返回按钮方法
  goBack() {
    const that = this;
    if (this.editType === 'add' || !this.change()) {
      this.props.dispatch(routerRedux.push(isRouterPublic + 'visualizationModel/TableModelManager'));
      return;
    }
    confirm({
      title: '',
      content: '当前数据未保存,确认返回吗？',
      className: "bi bi-ant-confirm-confirm",
      okText: '确认',
      cancelText: '取消',
      onOk() {
        that.props.dispatch(routerRedux.push(isRouterPublic + 'visualizationModel/TableModelManager'));
      }
    });
  }
  // 属性设置对话框
  showPropsSetting() {
    const clickObj = {
      key: 'propsSetting',
    };
    this.props.dispatch(toggleShowProperty());
    this.tableToolBar.ButtonClick(clickObj);
  }

  // 打印模板
  printTemplate() {
    this.setState({
      saveModalVisible: true,
      type: 'save',
    });
    this.saveType = 'print';
    // this.saveTableModal(() => {

    // }, true)
  }

  // 保存模型
  saveTableModal(cb, isPrintTemplate) {

    const self = this;
    let type = 'table';
    const objTables = this.props.Body.tables; // 获取表格
    const objTablesHead = this.props.Header; // 获取头部
    const objTablesFoot = this.props.Footer;
    const reportGroups = this.props.reportGroupsExp;
    if (objTables.length === 0) {
      return;
    }
    if (!this.props.dataSource.name) {
      Message.warning('分析模型不能为空');
      return;
    }


    let tableJson = {};

    if (objTables.length > 0) {
      const table = objTables[0];
      if (table.type === 'table') {
        let newtable = yearTotal(table);
        if (!newtable) {
          return;
        }
        // 因为要根据本年累计需求对table进行处理，在这里把table改为一个全新数据
        tableJson = dynamicUtil.tableToJson({ ...newtable, }, this.props.analysisModuleId, objTablesHead, objTablesFoot, this.state.variableList,);
      } else if (table.type === 'matrix2') {
        type = 'matrix2';
        const groupNames = this.getMatrix2GroupNames(table);
        let { variableList } = this.state;
        const groupNameSet = new Set(groupNames);
        variableList = variableList.filter(v => groupNameSet.has(v.groupName));
        tableJson = matrix2Util.tableToJson({ ...table, }, this.props.analysisModuleId, objTablesHead, objTablesFoot, variableList,);
      } else {
        type = 'matrix';
        tableJson = matrixUtil.tableToJson(table,
          this.props.analysisModuleId, this.state.conditionsModalData, objTablesHead, objTablesFoot);
      }
      tableJson.queryPlanData = this.state.queryPlanSaveData;
      tableJson.Report.printInfo = {
        reportGroupExp: reportGroups.value,
        formatString:reportGroups.formatString,
        textboxId:reportGroups.textboxId
      }

    }

    if (tableJson === undefined) {
      return;
    }
    this.initialHeader=objTablesHead;
    this.initialFooter=objTablesFoot;
    this.initialModel=objTables[0];
    const para = {
      name: this.saveData.name,
      type,
      category_id: this.category_id, // 分类的id
      remark: this.saveData.remark,
      content: JSON.stringify(tableJson),
      analysis_module_id: this.props.analysisModuleId, // 分析模型id

    };
    let url;
    if (this.editType === 'add') {
      url = '/tables/add';
    } else {
      if (!isPrintTemplate) {
        url = '/tables/update';
        para.id = this.modelID;// 表格的id
      } else {
        url = '/tables/add';
        para.source_table = this.modelID;
      }
    }

    NetUitl.post(url, para, (data) => {
      if (data.code === 200) {
        if (isPrintTemplate) {
          self.props.dispatch(routerRedux.push(isRouterPublic + "visualizationModel/TableModelManager"));
        }
        if (self.editType === 'add') {
          self.modelID = data.data;
          self.editType = 'edit';
          self.props.dispatch(routerRedux.push(isRouterPublic + "visualizationModel/TableModelManager"));
        }
        Message.success('保存成功。');
        this.props.dispatch(analysisModelChange({}));
        if (typeof cb === 'function') {
          cb()
        }
      } else {
        Message.error(data.message || data.msg || '保存失败');
      }
    }, (data) => {
      Message.error(data.message || data.msg || '保存失败');
    });

  }
  // 另存为方法
  saveAs() {
    const type = 'table';
    const objTables = [...this.props.Body.tables];
    if (objTables.length === 0) {
      return;
    }
    if (!this.props.analysisModuleId) {
      Message.warning('分析模型不能为空');
      return;
    }
    let tableJson = {};
    if (objTables.length > 0) {
      objTables.name = objTables[0].tableProperty.title;
      tableJson = dynamicUtil.tableToJson(objTables, this.props.analysisModuleId);
    }
    const para = {
      name: this.saveData.name,
      type,
      remark: this.saveData.remark,
      content: JSON.stringify(tableJson),
      analysis_module_id: this.props.analysisModuleId, // 分析模型id
    };
    const url = '/tables/add';
    para.category_id = this.category_id; // 分类的id
    NetUitl.post(url, para, (data) => {
      // self.props.dispatch(routerRedux.push("/visualizationModel/TableModelManager"));
    }, (data) => {
      Message.error(data);
    });
  }
  // 属性的窗口
  previewModalVisible() {

    this.setState({
      previewModalVisible: !this.state.previewModalVisible,
    });
  }
  clearconditionsModal = () => {
    this.setState({
      conditionsModalData: []
    })
  }
  async getAnalysismodelFields(props) {
    let fields = [];
    const type = props.dataSource && props.dataSource.serviceType;
    if (!type) {
      if (props.dataSource && props.dataSource.connectInfo) {
        analysisModel.getFields(props.dataSource, null).forEach((item) => {
          fields.push({
            ...item,
            dataType: analysisModel.getFieldDataType(item),
          });
        });
      }
      fields = analysisModelIdAdd(props.analysisModuleId, fields);
    } else {
      let params = {};
      if (props.dataSource && props.dataSource.tableList) {
        params = {
          type: analysisDataSourceTypeFn(type),
          procName: props.dataSource.tableList[0] ? props.dataSource.tableList[0]['displayName'] : null, analysisModelId: props.analysisModuleId
        }
      }
      params.apiName = props.dataSource.procedureName;

      fields = await getProcInfo(params);

    }
    mergeFieldsAndCondition(fields, getConditionByAnalysisID(this.analysisConditions, props.analysisModuleId).content);

    this.setState({
      modelFields: fields
    })
  }
  handleVerticalLine1MouseDown(event) {//左1按下
    // this.setState({
    //   isleftBoard1Resize: true
    // })
    lineMap.isleftBoard1Resize = true;

    this.eventL = event.clientX;
  }
  handleMouseMove(event) {
    if (lineMap.isleftBoard1Resize) {  //左1拖动
      event.preventDefault();
      // const newWidth = Resize.getNewWidth(event.clientX, this.refs.verticalLine1.offsetLeft + this.state.leftBoard1Width, this.state.leftBoard1Width);
      let newWidth = event.clientX - this.eventL + this.state.leftBoard1Width;
      this.eventL = event.clientX;
      newWidth = Resize.getWidth(newWidth);
      this.setState({ leftBoard1Width: newWidth });
    }
  }
  stopResize = () => { //停止
    // this.setState({
    //   isleftBoard1Resize: false
    // })
    lineMap.isleftBoard1Resize = false;
  }
  render() {
    const wh = window.innerHeight;
    const ww = window.innerWidth;
    // 菜单功能的集合
    const fields = this.state.modelFields;

    // 保存弹框是否打开
    const saveModal = this.state.saveModalVisible ?
      (<SaveModal
        data={this.saveData}
        visible={this.state.saveModalVisible}
        onCancel={saveModalVisible => this.saveCancel(saveModalVisible)}
        onOk={this.saveClick.bind(this)}
        type={this.state.type}
        modelType="tables"

      />) : null;
    const variableModal = this.state.variableVisible ? (<VariableModal
      visible={this.state.variableVisible}
      onCancel={variableVisible => this.showVariableSetting(variableVisible)}
      onOk={variableList => this.addVariableSaveClick(variableList)}
      variableList={this.state.variableList}
      groupNames={this.state.groupNames}
    />) : null;

    // 条件对话框

    const queryPlanModal = this.state.queryPlanVisible ? (<QueryPlanModal
      visible={this.state.queryPlanVisible}
      queryPlanMap={this.state.queryPlanMap}
      onCancel={() => { this.showQueryPlan() }}
      onOk={this.queryPlanSave}
      fields={this.state.modelFields}
      tableList={this.props.dataSource.tableList || []}
    />) : null;
    console.log(this.state.conditionModal4Design, this.state.conditionsModalData, fields)
    const putUpParameter =
      this.state.showCondition ?
        (<ConditionsModal
          disabled={this.state.conditionModal4Design}
          data={JSON.parse(JSON.stringify(this.state.conditionsModalData))}
          visible={this.state.showCondition}
          fields={fields}
          onCancel={showCondition => this.showParameterSettingModal(showCondition)}
          onOk={conditionsModalData => this.additionConditionSaveClick(conditionsModalData)}
        />) : null;
    const categoryId = this.category_id;
    return (
      <div className='bi'>
        <div className="margin0 padding0"
          style={{ position: 'relative', height: window.BI_APP_CONFIG.bi_integratedMode ? 'calc(100vh)' : 'calc(100vh - 64px)', overflow: 'hidden' }}
          onMouseUp={this.stopResize} onMouseLeave={this.stopResize}
          onMouseMove={this.handleMouseMove.bind(this)}
        >
          <ModelReference analysisModelId={this.analysisModelId} categoryId={categoryId} leftBoard1Width={this.state.leftBoard1Width} />
          <div ref="verticalLine1" style={{ position: 'absolute', height: '100%', left: `${this.state.leftBoard1Width - 6}px` }}
            className="vertical-line vertical-line-right" onMouseDown={this.handleVerticalLine1MouseDown.bind(this)}>
            <div className="vertical-line-header-bg"></div>
          </div>
          <ToolBar data={this.toolBarData} ref={(bar) => { this.tableToolBar = bar; }} title={this.saveData.name} />
          <ReportDesignArea
            id={this.props.id}
            match={this.props}
            conditionsModalData={this.state.conditionsModalData}
            clearconditionsModal={this.clearconditionsModal}
            variableList={this.state.variableList}
            leftBoard1Width={this.state.leftBoard1Width}
            sumComtitionFields={fields}
          />
          {saveModal}
          {putUpParameter}
          {variableModal}
          {queryPlanModal}
          <Modal
            title={'预览'}
            className="table-preview-modal"
            visible={this.state.previewModalVisible}
            closable
            width={ww - 40}
            style={{ top: '0px' }}
            bodyStyle={{ height: `${wh - 207}px` }}
            onCancel={this.previewModalVisible.bind(this)}
            footer={
              // [ <Button style={{float:'left'}}  size="large" onClick={this.restore.bind(this)}>还原</Button>,
              <Button type="primary" size="large" onClick={this.previewModalVisible.bind(this)}>确定</Button>
              // ]
            }
            wrapClassName="bi"
          >
            {this.getTable()}
          </Modal>
        </div>
      </div>
    );
  }
  restore = () => {
    this.tableObj.restore();
  };
  // 预览获取  要预览的模型
  getTable = (e) => {
    if (!this.state.previewModalVisible) {
      return null;
    }
    const tables = this.props.Body.tables;
    const objTablesHead = this.props.Header;
    const objTablesFoot = this.props.Footer;
    let model;

    if (tables.length > 0) {
      const table = tables[0];
      const type = table.type;
      table.conditions = CollectionUtil.filterArr(table.conditions);
      if (table.type === 'table') {
        const newtable = yearTotal(table);
        if (!newtable) {
          return null;
        }
        model = dynamicUtil.tableToJson(newtable, this.props.analysisModuleId, objTablesHead, objTablesFoot, this.state.variableList);
      } else if (table.type === 'matrix2') {
        model = matrix2Util.tableToJson(table, this.props.analysisModuleId, objTablesHead, objTablesFoot, this.state.variableList);
      } else {
        model = matrixUtil.tableToJson(table, this.props.analysisModuleId,
          this.state.conditionsModalData, objTablesHead, objTablesFoot);
      }
      return (<VHTable
        ref={(vh) => { this.tableObj = vh; }}
        type={type}
        table={model}
      />);
    } else {
      return null;
    }
  };
  // 条件的成功回调
  additionConditionSaveClick(conditionsModalData) {
    // conditionsModalData = CollectionUtil.filterArr(conditionsModalData);
    this.state.conditionsModalData = conditionsModalData;
    if (this.props.Body.tables.length > 0) {
      const table = this.props.Body.tables[0];
      table.conditions = conditionsModalData;
    }
    this.showParameterSettingModal(null);
  }
  addVariableSaveClick(variableList) {
    this.setState({ variableList });
    this.showVariableSetting();
  }
  queryPlanSave = (queryPlanSaveData) => {
    this.setState({ queryPlanSaveData })
    this.showQueryPlan();
  }
  showParameterSettingModal() {
    this.setState({
      showCondition: !this.state.showCondition,
    });
  }
  getMatrix2GroupNames = (table) => {
    const groupNames = [];
    groupNames.push('全局');
    for (const m of table.rowGroups.values()) {
      for (const v of m.values()) {
        for (const i of v) {
          groupNames.push(i.name);
        }
      }
    }
    for (const m of table.columnGroups.values()) {
      for (const v of m.values()) {
        for (const i of v) {
          groupNames.push(i.name);
        }
      }
    }
    return groupNames;
  }

  showQueryPlan = () => {
    const visible = this.state.queryPlanVisible;
    let queryPlanMap = {};
    if (!visible) {
      const tables = this.props.Body.tables;
      if (tables.length === 0) {
        Message.info('请先添加表格组件。');
        return;
      }
      if (!this.props.analysisModuleId) {
        Message.info('请先选择分析模型。');
        return;
      }
      const table = tables[0];
      const fields = analysisModel.getFields(this.props.dataSource);
      const type = table.type;
      queryPlanMap.type = type;

      const { queryPlanSaveData: { columns, conditions, rowGroups, colGroups, orders } } = this.state;
      // if (type == 'table') {
      //   queryPlanMap.column = JSON.parse(JSON.stringify(table.columns)).map(item => {
      //     let c = columns.find(c => c.fieldName == item.fieldName);
      //     if (c) {
      //       item.columnAttributeMap = c;
      //     }
      //     return item;
      //   });

      // }
      queryPlanMap.linkageList = this.state.queryPlanSaveData.linkageList||[]
      queryPlanMap.fields = fields.map(item => {
        let c = conditions.find(c => c.fieldName == item.aliasName || c.fieldName == item.fieldName);
        if (c) {
          item.conditionAttributeMap = c;
        }
        c = rowGroups.find(c => c.fieldName == item.aliasName || c.fieldName == item.fieldName);
        if (c) {
          item.rowGroupsAttributeMap = c;
        }
        c = colGroups.find(c => c.fieldName == item.aliasName || c.fieldName == item.fieldName);
        if (c) {
          item.colGroupsAttributeMap = c;
        }
        c = orders.find(c => c.fieldName == item.aliasName || c.fieldName == item.fieldName);
        if (c) {
          item.ordersAttribute = c;
        }
        if (type != 'matrix') {
          c = columns.find(c => c.fieldName == item.aliasName || c.fieldName == item.fieldName);
          if (c) {
            item.columnAttributeMap = c;
          }
        }
        return item;
      });
    }
    this.setState({
      queryPlanVisible: !visible, queryPlanMap
    })
  }
  showVariableSetting() {
    const visible = this.state.variableVisible;
    let groupNames = [];
    if (!visible) {
      const tables = this.props.Body.tables;
      if (tables.length === 0) {
        Message.info('请先添加表格组件。');
        return;
      }
      const type = tables[0].type;
      if (type === 'table') {
        groupNames = ['全局', '局部'];
      } else if (type === 'matrix2') {
        const table = tables[0];
        groupNames = this.getMatrix2GroupNames(table);
        let { variableList } = this.state;
        const groupNameSet = new Set(groupNames);
        variableList = variableList.filter(v => groupNameSet.has(v.groupName));
        this.setState({ variableList });
      } else {
        Message.info('交叉表不支持变量。');
        return;
      }
    }
    this.setState({
      variableVisible: !visible,
      groupNames,
    });
  }
  saveCancel() {
    this.setState({
      saveModalVisible: !this.state.saveModalVisible,
    });
  }
  saveClick(saveData, type) {
    let that = this;
    if (saveData.name) {
      this.saveData.name = saveData.name;
    }
    if (typeof saveData.remark !== 'undefined') {
      this.saveData.remark = saveData.remark;
    }
    if (this.saveData.name) {
      if (type === 'save') {
        this.saveTableModal(() => {
          that.props.dispatch(routerRedux.push(isRouterPublic + 'visualizationModel/TableModelManager'));
        }, this.saveType == 'print' ? true : false); // 本身的保存和修改方法
      } else {
        this.saveAs(); // 另存
      }
    } else {
      Message.info('必须输入模型名称！');
    }
  }
}
const mapStateToProps = (state, ownProps) => {
  return {
    analysisModuleId: state.analysisModel.analysisModelId,
    Body: state.DynamicTableReducer.Body,
    Header: state.DynamicTableReducer.Header,
    Footer: state.DynamicTableReducer.Footer,
    // selectedKeys: state.modelManager.selectedKeys,
    dataSource: state.chartDataSource.datasource, // 修改
    datasourceId: state.chartDataSource.datasourceId,
    reportGroupsExp: state.DynamicTableReducer.reportGroupsExp,
  };
};
export default connect(mapStateToProps)(TableModel);
