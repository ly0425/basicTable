import React, { Component } from 'react';
import { connect } from 'react-redux';
import { SheetBase, ToolbarItem, ToolbarRadioItem } from "./SpreadsheetControl";
import BatchSelect from './BatchSelect';
import { getSelectedCellTextBox, getSelectedCellFontInfo, getSelectedCell } from '../SpreadsheetSelectors';
import TextBox from '../../components/TextBox';
import PropertyUtils from '../../tableDesigner/components/PropertyUtils';
import { defaultTextBox } from 'model/ReportModel/Spreadsheet';
import { Input, Spin, Tooltip, notification, Modal, Table, Icon, Select, Button, Popconfirm, Popover, Checkbox, message } from '@vadp/ui';
import { getReportData, exportFileData, saveData, getCheckResult, serverCalc, serverAccess, printExcel, directlyPrintExcel, getExcelPrintSolution, saveExcelPrintSolution, updateExpandData, } from '../SpreadsheetApi';
import UrlUtil from 'components/Public/UrlUtil';
import * as SpreadsheetUtil from './SpreadsheetUtils';
import ToolBar from 'public/ToolBar';
import Message from '~/components/Public/Message';
import { routerRedux } from 'dva/router';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';
import { bindTableActions, createRuntimeSheet } from '../SpreadsheetRuntimeDvaModel';
import { fetchedData } from './Expression/IndexCache';
import PropTypes from 'prop-types';
import PrintModal from '../../../dashboard/dashboardDesigner/components/PrintModal';
import Dialog from '../../../../components/Public/Dialog';
import isRoutePublic, { isHttpPublic } from 'constants/IntegratedEnvironment';
import produce from 'immer';
import axios from 'axios';
import { formulaTransform } from 'utils/formulaTransform';
import lodash from 'lodash';
import MultiplePeriodsSummaryModal from './MultiplePeriodsSummaryModal';

const { Option } = Select;
// json 的浮动行按列存的，内存中模型按行存的。
function jsonToData(json) {
  const { fixedMap, floatAreaMap, expandAreaMap } = json;
  const newFixedMap = fixedMap || {};
  const newFloatAreaMap = {};
  const newExpandAreaMap = {};

  // 浮动行
  if (floatAreaMap) {
    const floatAreaKeys = Object.keys(floatAreaMap);
    for (const key of floatAreaKeys) {
      newFloatAreaMap[key] = floatAreaJsonToData(floatAreaMap[key]);
    }
  }

  // 展开行
  if (expandAreaMap) {
    const expandAreaKeys = Object.keys(expandAreaMap);
    for (const key of expandAreaKeys) {
      newExpandAreaMap[key] = expandAreaJsonToData(expandAreaMap[key]);
    }
  }

  return { fixedMap: newFixedMap, floatAreaMap: newFloatAreaMap, expandAreaMap: newExpandAreaMap };
}

function floatAreaJsonToData(json) {
  const { floatMap, floatRowCount } = json;
  if (!floatRowCount) {
    return {};
  }
  // 列转成行
  const floatRows = [];
  const floatKeys = floatMap ? Object.keys(floatMap) : [];
  for (let rowIndex = 0; rowIndex < floatRowCount; rowIndex++) {
    const row = {};
    for (const key of floatKeys) {
      const floatColumn = floatMap[key];
      if (floatColumn instanceof Array) {
        let value = floatColumn[rowIndex];
        // {} 表示未录入过的
        if (typeof value !== 'object') {
          row[key] = value;
        }
      }
    }
    floatRows.push(row);
  }
  return floatRows;
}

function expandAreaJsonToData(json) {
  const { expandMap, expandRowCount } = json;
  if (!expandRowCount) {
    return {};
  }
  // 列转成行
  const expandRows = [];
  const expandKeys = expandMap ? Object.keys(expandMap) : [];
  for (let rowIndex = 0; rowIndex < expandRowCount; rowIndex++) {
    const row = {};
    for (const key of expandKeys) {
      const expandColumn = expandMap[key];
      if (expandColumn instanceof Array) {
        let value = expandColumn[rowIndex];
        // {} 表示未录入过的
        if (typeof value !== 'object') {
          row[key] = value;
        }
      }
    }
    expandRows.push(row);
  }
  return expandRows;
}

function dataToJson(data, rowProps) {
  const { fixedMap, floatAreaMap, expandAreaMap } = data;
  if (!floatAreaMap) {
    return { fixedMap };
  }
  const newFloatAreaMap = getFloatAreaMapJson(rowProps, floatAreaMap);
  if (!expandAreaMap)
    return { fixedMap, floatAreaMap: newFloatAreaMap };

  const newExpandAreaMap = getExpandAreaMapJson(rowProps, expandAreaMap);
  return { fixedMap, floatAreaMap: newFloatAreaMap, expandAreaMap: newExpandAreaMap };
}

function getFloatAreaMapJson(rowProps, floatAreaMap) {
  const newFloatAreaMap = {};
  let floatRowId;
  let floatRows;
  for (const rowProp of rowProps) {
    if (rowProp.rowType === 'float') {
      // 新浮动区
      if (rowProp.id !== floatRowId) {
        if (floatRowId && floatRows) {
          newFloatAreaMap[floatRowId] = floatAreaDataToJson(floatRows);
        }
        floatRows = [];
      }
      floatRows.push(floatAreaMap[rowProp.id][rowProp.floatId]);
      floatRowId = rowProp.id;
    }
  }
  if (floatRowId && floatRows) {
    newFloatAreaMap[floatRowId] = floatAreaDataToJson(floatRows);
  }
  return newFloatAreaMap;
}

function floatAreaDataToJson(floatRows) {
  if (!floatRows || floatRows.length === 0) {
    return { floatMap: {}, floatRowCount: 0 };
  }
  // 行转成列
  const floatRowCount = floatRows.length;
  const floatMap = {};
  // 所有浮动 key
  const keys = new Set();
  for (const row of floatRows) {
    for (const key of Object.keys(row)) {
      keys.add(key);
    }
  }
  for (const key of keys) {
    const column = [];
    for (let rowIndex = 0; rowIndex < floatRows.length; rowIndex++) {
      const row = floatRows[rowIndex];
      if (row.hasOwnProperty(key)) {
        column.push(row[key]);
      } else {
        // {} 代表未录入
        column.push({});
      }
    }
    floatMap[key] = column;
  }
  return { floatMap, floatRowCount };
}

function getExpandAreaMapJson(rowProps, expandAreaMap) {
  const newExpandAreaMap = {};
  let expandRowId;
  let expandRows;
  for (const rowProp of rowProps) {
    if (rowProp.rowType === 'expand') {
      // 新浮动区
      if (rowProp.id !== expandRowId) {
        if (expandRowId && expandRows) {
          newExpandAreaMap[expandRowId] = expandAreaDataToJson(expandRows);
        }
        expandRows = [];
      }
      expandRows.push(expandAreaMap[rowProp.id][rowProp.floatId]);
      expandRowId = rowProp.id;
    }
  }
  if (expandRowId && expandRows) {
    newExpandAreaMap[expandRowId] = expandAreaDataToJson(expandRows);
  }
  return newExpandAreaMap;
}

function expandAreaDataToJson(expandRows) {
  if (!expandRows || expandRows.length === 0) {
    return { expandMap: {}, expandRowCount: 0 };
  }
  // 行转成列
  const expandRowCount = expandRows.length;
  const expandMap = {};
  // 所有浮动 key
  const keys = new Set();
  for (const row of expandRows) {
    for (const key of Object.keys(row)) {
      keys.add(key);
    }
  }
  for (const key of keys) {
    const column = [];
    for (let rowIndex = 0; rowIndex < expandRows.length; rowIndex++) {
      const row = expandRows[rowIndex];
      if (row.hasOwnProperty(key)) {
        column.push(row[key]);
      } else {
        // {} 代表未录入
        column.push({});
      }
    }
    expandMap[key] = column;
  }
  return { expandMap, expandRowCount };
}

class CellError extends Component {
  handleDoubleClick = (event) => {
    const { onBeginEdit } = this.props;
    onBeginEdit && onBeginEdit(this.props);
  };
  render() {
    // const errMsg =this.props.value.errMsg;
    const errMsg = '公式配置错误，请重新设置';
    return (
      <div style={{
        height: '100%', width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
        onDoubleClick={this.handleDoubleClick}>
        <Tooltip title={errMsg}>
          <Icon style={{
            color: 'orange',
            marginRight: 5,
          }} type="warning" />
          Error
        </Tooltip>
      </div>
    );
  }
}

class SheetRuntime extends SheetBase {
  constructor(props) {
    super(props);
    this.state.periodSelect = {
      value: props.pageParams.period,
      type: props.pageParams.periodType,
      data: {
        "1": [
          { text: "一月", value: "01" },
          { text: "二月", value: "02" },
          { text: "三月", value: "03" },
          { text: "四月", value: "04" },
          { text: "五月", value: "05" },
          { text: "六月", value: "06" },
          { text: "七月", value: "07" },
          { text: "八月", value: "08" },
          { text: "九月", value: "09" },
          { text: "十月", value: "10" },
          { text: "十一月", value: "11" },
          { text: "十二月", value: "12" }
        ],
        "2": [
          { text: "一季度", value: "01" },
          { text: "二季度", value: "02" },
          { text: "三季度", value: "03" },
          { text: "四季度", value: "04" }
        ],
        "3": [
          { text: "上半年", value: "01" },
          { text: "下半年", value: "02" }
        ]
      }
    }
  }
  componentDidMount() {
    super.componentDidMount();
    this.setState({ checkStatus: this.props.checkStatus })
    // window.onbeforeunload = function (e) {
    //   e.returnValue = 'a';
    //   return 'a';
    // }
  }
  componentWillUnmount() {
    let spreadsheetPrintIframe = document.getElementById('spreadsheetPrintIframe');
    if (spreadsheetPrintIframe) {
      spreadsheetPrintIframe.parentNode.removeChild(spreadsheetPrintIframe);
    }
  }
  insertRowDisabled = () => {
    const { selectedRanges } = this.model;
    if (!selectedRanges || selectedRanges.length != 1) {
      return true;
    }
    const selection = selectedRanges[0];
    const { top, bottom, type } = selection;
    if (type !== 'row' || top !== bottom) {
      return true;
    }
    const { rowProps } = this.model;
    const rowProp = rowProps[top];
    if (rowProp.rowType !== 'float' && rowProp.rowType !== 'expand') {
      return true;
    }
  }
  removeRowDisabled = () => {
    const { selectedRanges } = this.model;
    if (!selectedRanges || selectedRanges.length != 1) {
      return true;
    }
    const selection = selectedRanges[0];
    const { top, bottom, type } = selection;
    if (type !== 'row' || top !== bottom) {
      return true;
    }
    const { rowProps } = this.model;
    const rowProp = rowProps[top];
    if (rowProp.rowType !== 'float' && rowProp.rowType !== 'expand') {
      return true;
    }
    if (rowProp.rowType === 'float') {
      const { floatAreaMap } = this.model;
      if (Object.keys(floatAreaMap[rowProp.id]).length < 2) {
        return true;
      }
    }
    if (rowProp.rowType === 'expand') {
      const { expandAreaMap } = this.model;
      if (Object.keys(expandAreaMap[rowProp.id]).length < 2) {
        return true;
      }
    }
  }
  async serverProcess(func) {
    // 先保存
    try {
      await this.props.onSave(false);
    } catch (er) {
      Message.warning('保存失败');
      return;
    }
    // 服务端计算
    const { pageParams, reportId } = this.props;
    pageParams.period = this.state.periodSelect.value;
    let errors;
    let result = await func({ pageParams, reportId: reportId });
    let requireReport;
    if (result && func === serverAccess) {
      requireReport = result.requireReport;
      result = result.failedFetchDepict;
    }
    if (result) {
      const reportCode = this.props.pageParams.reportCode;
      errors = result[reportCode];
    }
    // 取数后提示用户是否重新取展开行数据
    if (func === serverAccess && requireReport && requireReport.length > 0) {
      const isExpand = await Dialog.confirm({
        title: '提示',
        content: '已存在数据，是否要删除现有数据并重新取数？',
        okText: '是',
        cancelText: '否',
        autoFocusButton: 'cancel',
      });
      if (isExpand) {
        await updateExpandData(reportId, this.props.pageParams);
      }
    }
    // 重新读取数据
    await this.props.onInit();
    const action = func === serverAccess ? '取数' : '计算';
    if (errors && errors.length > 0) {
      Message.warning(`${action}完成，${errors.length} 条公式错误。`);
    } else {
      Message.success(`${action}成功`);
    }
  }
  async handleAccess() {
    // this.props.dispatch({
    //   type: 'SpreadsheetRuntime/compute',
    //   dispatch: this.props.dispatch,
    //   reportId: this.props.reportId,
    //   pageParams: this.props.pageParams,
    //   isClearIndex: true,
    //   onSave: this.props.onSave,
    // });

    try {
      this.setState({ accessLoading: true });
      // 服务端计算
      await this.serverProcess(serverAccess);
    } finally {
      this.setState({ accessLoading: false });
    }
  }
  async handleCompute() {
    // this.props.dispatch({
    //   type: 'SpreadsheetRuntime/compute',
    //   dispatch: this.props.dispatch,
    //   reportId: this.props.reportId,
    //   pageParams: this.props.pageParams,
    //   onSave: this.props.onSave,
    // });

    try {
      this.setState({ computeLoading: true });
      // 服务端计算
      await this.serverProcess(serverCalc);
    } finally {
      this.setState({ computeLoading: false });
    }
  }
  async handleCheck() {
    try {
      await this.props.onSave(false);
    } catch (er) {
      Message.warning('保存失败');
    }
    try {
      let { search } = this.props.location;
      search = search.replace(/period=[0-1][1-4]/, `period=${this.state.periodSelect.value}`);
      const result = await getCheckResult(this.model.dataId, search);
      console.log('审核结果', result);
      const notPassed = result && result.length > 0 && result.filter(r => !r.isPass);
      const state = lodash.cloneDeep(this.state);
      state.bottomInfo.visible = false;
      this.setState(lodash.cloneDeep(state), () => {
        if (notPassed && notPassed.length > 0) {
          const { reportName, pageParams: { reportCode } } = this.props;
          const { periodSelect } = this.state;
          const period = periodSelect.data[periodSelect.type].find(item => item.value === periodSelect.value).text;
          const data = notPassed.map(({ formula, msg, remark, type, isPass }, i) => ({
            key: i + 1, formula, msg, remark, type: type ? type : '基本平衡公式', period, reportName, isPass, reportCode
          }))
          // state.notPassed = notPassed;
          const { pageParams } = lodash.cloneDeep(this.props);
          delete pageParams.buttonRight;
          pageParams.checkStatus = 0;
          let pageParamsStr = '';
          for (let key in pageParams) {
            pageParamsStr += `&${key}=${pageParams[key]}`;
          }
          const url = `${isHttpPublic}excel/updateState/?${pageParamsStr.substring(1, pageParamsStr.length)}`;
          axios.get(url)
            .then((response) => {
              if (response.data.status === '0') {
                state.bottomInfo.data["1"] = data;
                state.bottomInfo.data["2"] = lodash.cloneDeep(data).filter(item => item.type === '基本平衡公式').map((item, index) => { item.key = index + 1; return item; });
                state.bottomInfo.data["3"] = lodash.cloneDeep(data).filter(item => item.type === '逻辑性公式').map((item, index) => { item.key = index + 1; return item; });
                state.bottomInfo.data["4"] = lodash.cloneDeep(data).filter(item => item.type === '核实性公式').map((item, index) => { item.key = index + 1; return item; });
                state.bottomInfo.activeKey = "1";
                state.bottomInfo.period = period;
                state.checkStatus = 0;
                state.bottomInfo.visible = true;
                this.setState(state);
              }
              else {
                Message.warning('审核失败！');
              }
            });
        }
        else {
          Message.success('审核通过');
        }
      });
    }
    catch (er) {
      Message.warning('审核失败：' + er.msg || '未知错误');
    }
  }
  formatValueToString(value, formatObject) {
    if (typeof value === 'object') return '';
    value = this.formatCellValue({ value, formatObject });
    if (value === null || value === undefined) return '';
    if (typeof value !== 'string') return `${value}`;
    return value;
  }
  getPrintData() {
    const sheet = this.props.sheet.present;
    const { fixedMap, floatAreaMap, rowProps } = sheet;
    const data = dataToJson({ fixedMap, floatAreaMap }, rowProps);
    const { tableRows } = sheet;
    const printData = { fixedMap: {}, floatAreaMap: {} };
    for (let i = 0; i < tableRows.length; i++) {
      const { rowType, id } = rowProps[i];
      if (!rowType || rowType === 'fixed') {
        for (const cell of tableRows[i]) {
          if (cell.id) {
            printData.fixedMap[cell.id] = this.formatValueToString(data.fixedMap[cell.id], cell.textBox.formatObject);
          }
        }
      } else if (rowType === 'float') {
        const area = data.floatAreaMap[id];
        if (area) {
          printData.floatAreaMap[id] = { floatMap: {}, floatRowCount: area.floatRowCount };
          for (const cell of tableRows[i]) {
            if (cell.id && area.floatMap[cell.id]) {
              printData.floatAreaMap[id].floatMap[cell.id] = area.floatMap[cell.id].map(value =>
                this.formatValueToString(value, cell.textBox.formatObject));
            }
          }
        }
      }
    }
    return printData;
  }
  getPrintJson = () => {
    const printSheet = produce(this.props.sheet.present, draft => {
      const { tableRows } = draft;
      for (let i = 0; i < tableRows.length; i++) {
        const row = tableRows[i];
        for (let j = 0; j < row.length; j++) {
          const cell = row[j];
          cell.textBox.expression = undefined;
          const value = this.model.getTextBoxValue(i, j);
          const formattedValue = this.formatValueToString(value, cell.textBox.formatObject);
          cell.textBox.value = formattedValue;
          cell.id = undefined;
          cell.isUserIndex = undefined;
        }
      }
    });
    return SpreadsheetUtil.tableToJson([{ present: printSheet }]);
  }
  printPreview = (e) => {
    console.log(e);
    const config = this.convertPrintSolutionToConfig(e);
    // 由于打印不支持浮动行数据，直接把数据拼到模板里用来打印
    // const data = this.getPrintData();
    const param = { excel: this.getPrintJson(), data: undefined, config: JSON.stringify(config) };
    console.log('Print,', param);
    printExcel(param).then(data => {
      // Message.success('调用打印接口成功');
      this.setState({ printPdfUrl: `${isHttpPublic}excel/previewPDF?filePath=` + encodeURIComponent(data) });
    }).catch(err => {
      console.log(err);
      Message.error('调用打印接口失败');
    });
  }
  directlyPrint = () => {
    getExcelPrintSolution(this.props.reportId, this.props.pageParams.userCode).then(solution => {
      let config;
      if (solution) {
        config = this.convertPrintSolutionToConfig(JSON.parse(solution));
      } else {
        config = {
          "PrintScheme": {
            "PageSet": {
              "PageKind": 'A4',
              "PageHeight": 2970,
              "PageWidth": 2100,
              "Landscape": true,
              "PageMargin": {
                "Left": 100,
                "Right": 100,
                "Top": 100,
                "Bottom": 100,
              }
            },
            "Order": 1,
            HorizionalToOne: false,
            VerticalToOne: false,
            "HavePage": false
          }
        };
      }
      const param = { excel: this.getPrintJson(), data: undefined, config: JSON.stringify(config), reportId: this.props.sheet.present.id };
      directlyPrintExcel(param).then(data => {
        // Message.success('调用打印接口成功');
        // this.setState({ printPdfUrl: `${isHttpPublic}excel/previewPDF?filePath=` + encodeURIComponent(data) });
        var iframe = document.getElementById('spreadsheetPrintIframe');
        if (!iframe) {
          iframe = document.createElement('iframe');
          iframe.id = 'spreadsheetPrintIframe';
          iframe.style.display = 'none';
          document.body.appendChild(iframe);
        }
        iframe.src = `${isHttpPublic}excel/previewPDF?filePath=` + encodeURIComponent(data);
        iframe.onload = function () {
          setTimeout(function () {
            iframe.focus();
            iframe.contentWindow.print();
          }, 5);
        };

      }).catch(err => {
        console.log(err);
        Message.error(err.msg || '调用打印接口失败');
      });
    });
  }
  showPrintModal = () => {
    getExcelPrintSolution(this.props.reportId, this.props.pageParams.userCode).then(solution => {
      let printSettings;
      if (solution) {
        printSettings = JSON.parse(solution);
      } else {
        printSettings = {
          type: "print",
          pageKind: "A4",
          printDirection: "0",
          marginTop: 100,
          marginBottom: 100,
          marginLeft: 100,
          marginRight: 100,
          width: 2100,
          height: 2970,
          zoom: '0',
        };
      }
      this.setState({
        printSettings,
        printModalVisible: true,
      });
    });
  }
  printHandleCancel = (e) => {
    this.setState({
      printModalVisible: false,
    });
  }
  savePlan = (e) => {
    const solution = JSON.stringify(e);
    saveExcelPrintSolution(this.props.reportId, this.props.pageParams.userCode, solution).then(() => {
      Message.success('保存成功');
    }).catch(err => {
      Message.error('保存失败');
    });
  }
  /** 把打印方案转换为打印设置（两者结构不一样） */
  convertPrintSolutionToConfig(e) {
    let PageKind = e.pageKind;
    if (PageKind === 'custom')
      PageKind = 'UserDefine';
    let HorizionalToOne = false, VerticalToOne = false;
    if (e.zoom === '0') {
      HorizionalToOne = false;
      VerticalToOne = false;
    }
    else if (e.zoom === '1') {
      HorizionalToOne = true;
      VerticalToOne = true;
    }
    else if (e.zoom === '2') {
      HorizionalToOne = false;
      VerticalToOne = true;
    }
    else if (e.zoom === '3') {
      HorizionalToOne = true;
      VerticalToOne = false;
    }
    const config = {
      "PrintScheme": {
        "PageSet": {
          "PageKind": PageKind,
          "PageHeight": e.height,
          "PageWidth": e.width,
          "Landscape": e.printDirection === '1',
          "PageMargin": {
            "Left": e.marginLeft,
            "Right": e.marginRight,
            "Top": e.marginTop,
            "Bottom": e.marginBottom,
          }
        },
        "Order": 1,
        HorizionalToOne,
        VerticalToOne,
        "HavePage": false
      }
    };
    return config;
  }

  renderExtraElement() {
    // 是否隐藏保存打印方案按钮
    // 如果获取不到参数，默认没有权限
    let hideSavePrintCase = true;
    let hidePreviewPlan = true;
    const { buttonRight } = this.props.pageParams;
    if (buttonRight) {
      const buttonRightJson = JSON.parse(buttonRight);
      // console.log('buttonRightJson', buttonRightJson);
      hideSavePrintCase = !this.hasRight(buttonRightJson, 'hideSavePrintCase');
      hidePreviewPlan = !this.hasRight(buttonRightJson, '预览方案');
    }
    return (
      this.state.printModalVisible ? <PrintModal
        visible={this.state.printModalVisible}
        printPdfUrl={this.state.printPdfUrl}
        preview={(e) => this.printPreview(e)}
        onCancel={(e) => this.printHandleCancel(e)}
        savePlan={(e) => this.savePlan(e)}
        data={this.state.printSettings}
        hideSavePrintCase={hideSavePrintCase}
        hidePreviewPlan={hidePreviewPlan}
      >
      </PrintModal> : null
    );
  }
  hasRight(buttonRightJson, buttonTitle) {
    const hideSavePrintCaseItem = buttonRightJson.find(x => x.title === buttonTitle);
    if (hideSavePrintCaseItem && hideSavePrintCaseItem.isEnabled === 'T') {
      return true;
    }
    return false;
  }
  handlePeriodChange = (value) => {
    const newState = produce(this.state, draft => {
      draft.periodSelect.value = value;
    })
    this.setState({ ...newState }, () => {
      this.props.periodChange(value);
    });
  }
  exportFile = async () => {
    console.log(this.props.pageParams)
    let getData = {};
    ({
      modCode: getData.modCode,
      compCode: getData.compCode,
      copyCode: getData.copyCode,
      acctYear: getData.acctYear,
      periodType: getData.periodType,
      period: getData.period,
    } = this.props.pageParams);
    getData.reportIds = this.props.reportId;
    let str = '';
    for (let key in getData) {
      str += `${key}=${getData[key]}&`
    }
    str = str.slice(0, str.length - 1)
    function downloadCb(blob, fileNames) {
      const fileName = `${fileNames || '导出文件'}.xlsx`;
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        // If IE, you must uses a different method.
        window.navigator.msSaveOrOpenBlob(blob, fileName);
      } else {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    }

    let res = await exportFileData(str);
    let { blob, fileName } = res;
    downloadCb(blob, fileName)

    // axios.get('/OES/bi/excel/exportDatas?' + str, {}, { responseType: 'blob' }).then((response) => {
    // response.blob().then((blob)=>{
    // downloadCb(new Blob([response.data]))
    // })

    // let blob = new Blob([response.data])
    // if ('download' in document.createElement('a')) { // 不是IE浏览器
    //   let url = window.URL.createObjectURL(blob);
    //   let link = document.createElement('a');
    //   link.style.display = 'none';
    //   link.href = url;
    //   link.setAttribute('download', `导出文件.xls`);
    //   document.body.appendChild(link);
    //   link.click();
    //   document.body.removeChild(link);
    //   window.URL.revokeObjectURL(url);
    // } else { // IE 10+
    //   window.navigator.msSaveBlob(blob, `导出文件.xls`);
    // }

    // })
    // this.exportExcel && this.exportExcel();
  }
  renderToolbar() {
    // if (this.props.hideToolbar) {
    //   return;
    // }
    let formulaEle;
    let formula = '';
    const cell = this.props.selectedCell;
    const periodType = this.state.periodSelect.type;
    if (cell && cell.isUserIndex === 'y') {
      const value = cell.textBox.value;
      if (typeof value === 'string' && value.trim().indexOf('=') === 0) {
        formula = value;
      }
      if (typeof value === 'string' && value.trim().indexOf('=VH_INDEX') === 0) {
        formula = formulaTransform(value);
      }
    }
    formulaEle = (
      <div style={{
        marginLeft: 10,
        marginTop: 10,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        display: 'block',
        lineHeight: '20px',
        position: 'relative',
        paddingRight: 200
      }}>
        <span>公式：</span>
        <span title={formula}>{formula}</span>
        <div style={{ position: 'absolute', right: 0, top: 0 }}>审核状态：{this.state.checkStatus ? '审核通过' : '未审核/审核未通过'}</div>
      </div>
    );
    let showCompute = false;
    let showAccess = false;
    let showCheck = false;
    let showPrint = false;
    let showPrintPreview = false;
    let showExport = false;
    const { buttonRight } = this.props.pageParams;
    if (buttonRight) {

      const buttonRightJson = JSON.parse(buttonRight);
      // console.log(buttonRightJson)
      showCompute = this.hasRight(buttonRightJson, '计算');
      showAccess = this.hasRight(buttonRightJson, '取数');
      showCheck = this.hasRight(buttonRightJson, '审核');
      showPrint = this.hasRight(buttonRightJson, '打印');
      showPrintPreview = this.hasRight(buttonRightJson, '打印预览');
      showExport = this.hasRight(buttonRightJson, '导出');
    }
    return (
      <div className="toolbar">
        {
          periodType === "1" || periodType === "2" || periodType === "3" ?
            <Select onChange={this.handlePeriodChange} placeholder="请选择期间" value={this.state.periodSelect.value} style={{ width: 150, marginLeft: 10 }}>
              {this.state.periodSelect.data[periodType].map(item => <Option value={item.value}>{item.text}</Option>)}
            </Select>
            :
            ''
        }
        <ToolbarItem disabled={this.insertRowDisabled()} onClick={this.insertRowUp} title="向上插入行" iconName='icon-xiangshangcharuhang' />
        <ToolbarItem disabled={this.insertRowDisabled()} onClick={this.insertRowDown} title="向下插入行" iconName='icon-xiangxiacharuhang' />
        <ToolbarItem disabled={this.removeRowDisabled()} onClick={this.removeRows} title="删除行" iconName='icon-shanchuhang' />
        {showAccess && <Button style={{ marginLeft: 10 }} onClick={this.handleAccess.bind(this)} disabled={this.state.computeLoading} loading={this.state.accessLoading}>取数</Button>}
        {showCompute && <Button style={{ marginLeft: 10 }} onClick={this.handleCompute.bind(this)} disabled={this.state.accessLoading} loading={this.state.computeLoading}>计算</Button>}
        {showCheck && <Popconfirm
          title='审核前会自动保存，确定吗？'
          onConfirm={this.handleCheck.bind(this)}
          okText='保存并审核'
          cancelText='取消'
        >
          <Button style={{ marginLeft: 10 }} disabled={this.state.accessLoading || this.state.computeLoading}>审核</Button>
        </Popconfirm>}
        {showPrintPreview && <Button style={{ marginLeft: 10 }} onClick={this.showPrintModal}>打印预览</Button>}
        {showPrint && <Button style={{ marginLeft: 10 }} onClick={this.directlyPrint}>打印</Button>}
        {<Button style={{ marginLeft: 10 }} onClick={this.exportFile}>导出</Button>}
        {this.props.pageParams.periodType !== '4' &&
          <React.Fragment>
            <Popover
              content={
                <div>
                  <p style={{ marginBottom: 8 }}><span>当前年度：</span><Input size="small" style={{ width: 140 }} disabled value={this.props.pageParams.acctYear} /></p>
                  <p style={{ marginBottom: 8 }}><span>期间类型：</span><Input size="small" style={{ width: 140 }} disabled value={this.props.pageParams.periodType === '1' ? '月份' : this.props.pageParams.periodType === '2' ? '季度' : '半年'} /></p>
                  <p style={{ marginBottom: 8 }}><span style={{ verticalAlign: 'top' }}>选择期间：</span><Checkbox.Group onChange={this.multiplePeriodsChange} style={{ width: 140 }} options={this.state.periodSelect.data[this.props.pageParams.periodType].map(item => { return { label: item.text, value: item.value } })} /></p>
                  <p style={{ textAlign: 'right' }}><Button style={{ marginRight: 8 }} onClick={this.multiplePeriods} size="small">取消</Button><Button onClick={this.multiplePeriodsSummary} size="small" type="primary">查询</Button></p>
                </div>
              }
              title="选择参与汇总的期间"
              placement="rightTop"
              trigger="click"
              visible={this.state.popover}
            >
              <Button onClick={this.multiplePeriods} style={{ marginLeft: 10 }}>多期汇总查询</Button>
            </Popover>
            {this.state.multiplePeriodsSummaryModal && <MultiplePeriodsSummaryModal periodList={this.state.multiplePeriods} periodListData={this.state.periodSelect.data} pageParams={this.props.pageParams} reportName={this.props.reportName} reportId={this.props.reportId} cancel={this.multiplePeriodsSummary} />}
          </React.Fragment>
        }
        {formulaEle}
      </div>
    );
  }
  multiplePeriods = () => {
    this.setState({ popover: !this.state.popover });
  }
  multiplePeriodsChange = (value) => {
    this.setState({ multiplePeriods: value });
  }
  multiplePeriodsSummary = () => {
    if (this.state.multiplePeriods && this.state.multiplePeriods.length) {
      this.setState({ multiplePeriodsSummaryModal: !this.state.multiplePeriodsSummaryModal, popover: false });
    }
    else {
      message.warning('请选择期间！');
    }
  }
  renderCellMenu() {
    return null;
  }
  renderTableMenu() {
    return null;
  }
  renderRowMenu() {
    const insertDisabled = this.insertRowDisabled();
    const removeDisabled = this.removeRowDisabled();
    if (insertDisabled && removeDisabled) return;
    return (
      <ContextMenu id={this.menu_row}>
        {!insertDisabled && <MenuItem onClick={this.insertRowUp}>
          {this.renderMenuItemIcon('icon-xiangshangcharuhang')}
          向上插入行
        </MenuItem>}
        {!insertDisabled && <MenuItem onClick={this.insertRowDown}>
          {this.renderMenuItemIcon('icon-xiangxiacharuhang')}
          向下插入行
        </MenuItem>}
        {!removeDisabled && <MenuItem onClick={this.removeRows}>
          {this.renderMenuItemIcon('icon-shanchuhang')}
          删除行
        </MenuItem>}
      </ContextMenu>
    );
  }
  renderColMenu() {
    return null;
  }
  renderCellContent(cellProps) {
    const { rowIndex, columnIndex, cell, width, height, editingCell } = cellProps;
    const isCurrentEditing = editingCell && editingCell.row === rowIndex && editingCell.col === columnIndex;
    if (isCurrentEditing) {
      // 输入框不由 TextBox 来渲染
      return;
    }
    if (cell.loading) {
      return (
        <div style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Spin size="small" />
        </div>
      );
    }
    let textBox = cell.textBox;
    const value = this.model.getTextBoxValue(rowIndex, columnIndex);
    if (textBox.value !== value) {
      textBox = { ...textBox, value };
    }
    // 错误信息的显示
    if (textBox.value && typeof textBox.value === 'object') {
      // textBox = { ...textBox, value: textBox.value.errMsg };
      return (
        <CellError
          value={textBox.value}
          rowIndex={rowIndex}
          columnIndex={columnIndex}
          onBeginEdit={this.handleBeginEdit}
        />
      );
    }
    return (
      <TextBox
        textBox={textBox}
        cell={cell}
        defaultTextBox={defaultTextBox}
        format={this.formatCellValue}
        {...{ rowIndex, columnIndex, width, height }}
        onDrop={this.handleTextBoxDrop}
        onBeginEdit={this.handleBeginEdit}
        onCommitEdit={this.handleCommitEdit}
        animateValue={this.model.animateValue && cell.isUserIndex === 'y'}
        // isEditing={isCurrentEditing}
        fontSizeUnit='pt'
      />
    );
  }
  renderCellExtra(args) {
    const { cell } = args;
    // 公式不可录入
    const value = cell.textBox.value;
    if (typeof value === 'string' && value.trim().indexOf('=') === 0) {
      // return super.renderCellExtra(args, '\'');
      return;
    }
    // return super.renderCellExtra(args, <Icon type="edit" />);
  }
  getRowKey(rowIndex) {
    const { rowProps } = this.model;
    const prop = rowProps[rowIndex];
    if (prop.rowType === 'float') {
      return `${prop.id}-${prop.floatId}`;
    } else if (prop.rowType === 'expand') {
      return rowIndex;
    } else {
      return prop.id;
    }
  }
  beginEdit(...args) {
    if (this.props.readOnly) {
      return;
    }
    super.beginEdit(...args);
  }
}

class PreviewCell extends Component {

  formatValue() {
    const { cell } = this.props;
    let value = cell.textBox.value;
    // if (cell.isFormula) {
    //   if (!cell.loading) {
    //     value = cell.result;
    //   }
    // } else {
    //   value = cell.textBox.value;
    // }
    if (typeof value === 'boolean') {
      return value.toString().toUpperCase();
    } else {
      const formatObject = cell.textBox && cell.textBox.formatObject;
      const result = formatObject ? PropertyUtils.conversionFormat(value, formatObject) : value;
      if (typeof result === 'undefined') {
        return '';
      } else if (typeof result === 'object' && !result) {
        return '';
      } else {
        return `${result}`;
      }
    }
  }

  render() {
    const { cell } = this.props;
    if (cell.loading) {
      return (<div style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Spin size="small" />
      </div>);
    }
    const { rowIndex, columnIndex, width, height } = this.props;
    const value = this.formatValue();
    const textBox = { ...cell.textBox, value };

    return (
      <TextBox
        textBox={textBox}
        defaultTextBox={defaultTextBox}
        {...{ rowIndex, columnIndex, width, height }}
      />
    );
  }
}

class SheetRuntimeContainer extends Component {
  static contextTypes = {
    // 是否在弹窗中
    isInModal: PropTypes.bool
  }

  search;
  pageParams = {};
  constructor(props) {
    super(props);
    // 查询字符串
    this.search = this.props.location.search;
    // 页面参数
    if (this.search.indexOf('?') === 0) {
      let array = this.search.slice(1).split('&');
      for (const str of array) {
        const pair = str.split('=');
        if (pair.length === 2) {
          this.pageParams[pair[0]] = decodeURIComponent(pair[1]);
        }
      }
      console.log('pageParams', this.pageParams);
    }
  }
  componentDidMount() {
    this.init();
  }
  componentWillUnmount() {
    this.props.dispatch({ type: 'SpreadsheetRuntime/dispose' });
    this.props.dispatch({ type: 'SpreadsheetRuntime/RESET' });
  }
  async init(period) {
    this.reportId = UrlUtil.getUrlParams(this.props, 'id');
    if (period) {
      this.search = this.search.replace(/period=[0-1][0-9]/, `period=${period}`);
    }
    const response = await getReportData(this.reportId, this.search);
    if (!response || !response.content) {
      notification.open({
        message: '提示',
        description: '尚未设置报表模板。',
        duration: 0,
      });
      return;
    }
    this.reportName = response.reportName;
    this.checkStatus = response.checkStatus;
    if (this.reportName) {
      // 门户控制了标题，所以这行不管用，title 被门户覆盖了。
      document.title = this.reportName;
    }
    const json = JSON.parse(response.content);
    let table = SpreadsheetUtil.jsonToTable(json, response.analysis_module_id, createRuntimeSheet);
    // 隐藏行
    const { rowProps } = table.present;
    const heights = [...table.present.heights];
    for (let i = 0; i < rowProps.length; i++) {
      const rowProp = rowProps[i];
      if (rowProp.isHidden) heights[i] = 0;
    }
    table.present.heights = heights;
    // 隐藏列
    const { colProps } = table.present;
    const widths = [...table.present.widths];
    for (let i = 0; i < colProps.length; i++) {
      const colProp = colProps[i];
      if (colProp.isHidden) widths[i] = 0;
    }
    table.present.widths = widths;
    //刷新表格->表格展现
    this.props.dispatch({ type: 'SpreadsheetRuntime/loadRuntimeTemplate', table, templateJson: json });
    // 参数设置
    this.props.dispatch({ type: 'SpreadsheetRuntime/UPDATE_PARAMS', params: json.params });
    // 取数结果
    let fetchData;
    if (response.fetchData) {
      fetchData = JSON.parse(response.fetchData);
      Object.assign(fetchedData, fetchData);
    }
    // 数据
    const dataId = response.dataId;
    let data = {};
    if (response.data) {
      data = jsonToData(JSON.parse(response.data));
    }
    // let { expandData } = response;
    // if (typeof expandData === 'string' && expandData) {
    //   try {
    //     expandData = JSON.parse(expandData);
    //   } catch (err) {
    //     expandData = undefined;
    //   }
    // }
    this.props.dispatch({ type: 'SpreadsheetRuntime/loadRuntimeData', data, fetchData, dataId });

    // 前端计算非 OES 指标公式
    this.props.dispatch({
      type: 'SpreadsheetRuntime/compute',
      dispatch: this.props.dispatch,
      reportId: this.reportId,
      pageParams: this.pageParams,
      onSave: this.props.onSave,
    });
  }
  periodChange = (period) => {
    this.pageParams.period = period;
    this.init(period);
  }
  needSave() {
    return false;
  }
  isLocked() {
    return this.pageParams.lockStatus === '1'
      || this.pageParams.sendStatus === '1';
  }
  async handleSave(sheet, showMessage = true) {
    if (this.isLocked()) {
      return;
    }
    const { fixedMap, floatAreaMap, expandAreaMap, dataId, rowProps } = sheet;
    const result = await saveData({
      reportId: this.reportId,
      data: JSON.stringify(dataToJson({ fixedMap, floatAreaMap, expandAreaMap }, rowProps)),
      dataId,
      fetchData: (fetchedData && Object.keys(fetchedData).length > 0)
        ? JSON.stringify({ ...fetchedData }) : undefined,
      pageParams: this.pageParams,
    }, this.reportId);
    if (result) {
      this.props.dispatch({ type: 'SpreadsheetRuntime/setDataId', dataId: result });
    }
    if (showMessage) {
      Message.success('保存成功');
    }
  }
  toolBarData() {
    if (this.isLocked()) {
      return [];
    }
    return [{
      title: '保存',
      type: 'save',
      className: 'icon iconfont icon-save' + (this.needSave() ? ' spreadsheet-need-save' : ''),
      component: (
        <Popconfirm
          placement="bottomRight"
          title='保存后变为未审核，确定吗？'
          onConfirm={() => this.handleSave(this.props.sheet.present)}
          okText='保存'
          cancelText='取消'
        >
          <i className='icon iconfont icon-save' />
        </Popconfirm>
      ),
    },
      // {
      //   title: '打开模板（临时）',
      //   handler: () => this.props.dispatch(routerRedux.push(`${isRoutePublic}visualizationModel/SpreadsheetModel/edit/${this.reportId}`)),
      //   type: 'excel',
      //   className: 'icon iconfont icon-excel',
      // }
    ];
  }
  render() {
    if (!this.props.sheet) {
      return null;
    }
    const isLocked = this.isLocked();
    let title = this.reportName ? this.reportName + ' - ' : '';
    if (this.pageParams.reportCode) {
      title = this.pageParams.reportCode + ' - ' + title;
    }
    title += isLocked ? '查看' : '录入';
    if (!isLocked && this.needSave()) {
      title = '*' + title;
    }
    let className = 'spreadsheet-model spreadsheet-runtime';
    if (this.context && this.context.isInModal) {
      className += ' spreadsheet-model-in-modal';
    }

    return (
      <div className='bi'>
        <div className={className} style={{
          height: this.pageParams.showMode === 'menu' ? 'calc(100vh - 116px)' : (window.BI_APP_CONFIG.bi_integratedMode ? 'calc(100vh)' : 'calc(100vh - 16px)'),
        }}>
          <ToolBar data={this.toolBarData()} title={title} />
          <div style={{ height: this.pageParams.showMode === 'menu' ? 'calc(100% - 32px)' : 'calc(100% - 46px)', width: '100%' }}>
            <SheetRuntime
              areaName='printBodyArea'
              {...this.props}
              reportId={this.reportId}
              pageParams={this.pageParams}
              onInit={() => this.init()}
              onSave={(showMessage) => this.handleSave(this.props.sheet.present, showMessage)}
              hideToolbar={isLocked}
              readOnly={isLocked}
              isCellHidden={true}
              periodChange={this.periodChange}
              reportName={this.reportName}
              checkStatus={this.checkStatus}
            />
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  sheet: state.SpreadsheetRuntime.ReportBody.sheets[0],
  selectedCell: getSelectedCell(state, 'SpreadsheetRuntime'),
});

const mapDispatchToProps = (dispatch) => ({
  actions: bindTableActions(dispatch),
  dispatch,
});

export default connect(mapStateToProps, mapDispatchToProps)(SheetRuntimeContainer);