import React, { Component } from 'react';
import { Modal, Spin } from '@vadp/ui';
import NetUtil from '/src/containers/HttpUtil';
import LinkAgeAction from './LinkAgeAction';
// import VHChart from 'components/Public/VHChart'; //ly注释
import Message from './Message';
import SpreadsheetPreview from '@/routes/visualizationModel/SpreadsheetDesigner/components/SpreadsheetPreview';
import { analysisModel } from './analysisModel';
import VHTable from '@/routes/visualizationModel/tableDesigner/components/table/VHTable';
import MatrixUtil from '@/routes/visualizationModel/tableDesigner/components/matrix/matrixUtils';
import ArrayUtil from './ArrayUtil.js';
import OtherUtil from './OtherUtil';
import DashboardModel from '@/routes/dashboard/dashboardDesigner/components/DashboardModel';
import produce from 'immer';
import * as SpreadsheetUtils from '@/routes/visualizationModel/SpreadsheetDesigner/components/SpreadsheetUtils';
import { isHttpPublic } from '@/constants/IntegratedEnvironment';
import RightBoard from '@/routes/datamodel/RightBoard';
import { mergeAnalysisFieldsAndReference } from './analysisConditionModel.js';
import { getProcInfo, getAnalysismodelInfo } from './Fields.js';
import { analysisDataSourceTypeFn } from '@/components/Public/analysisConditionModel';
import XlsxPopulate from 'xlsx-populate';
import { tableToSheet } from '@/model/XlsxUtils';

import { defaultTextBox } from '@/model/ReportModel/Spreadsheet';
import { showEmptyDataOrRequestAbnormal } from './showEmptyDataOrRequestAbnormal.js';
import PrintTemplateModal from './PrintTemplateModal.js'
// import LinkageButton from "public/userCase/LinkageButton"; //ly注释
import _ from 'lodash'
const MATRIX2 = 'matrix2';
const matrixUtil = MatrixUtil;
const theme = window.$('body').prop('class').toLowerCase();
const urlDownload = (v, fileName) => {
  let isblob = typeof v == 'string';
  const url = isblob ? v : window.URL.createObjectURL(v);
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.href = url;
  a.download = fileName;
  a.click();
  if (!blob) {
    window.URL.revokeObjectURL(url);
  }
  document.body.removeChild(a);
}


var oes_biurl;
//财务账簿
function toAcctVouchInput (vouchId, isTmpVouch, isWatch, callBackFun, vchData, isAudit, isDraft, isTemplet, otherId, vouchSource) {
  var dialog = top.XDialogUtil.createDialog({
    title: "联动",
    width: "1020",
    height: "670",
    resizable: true,
    isMax: true,
    isExpand: false,
    //url:unieap.cmpPath+"?page=acctAccounts-vouch-vouchInput-vouchInput-vouch",
    url: oes_biurl + "page=acctVouch-vouch-vouch",
    iconCloseComplete: true,
    onComplete: function () {
      if (callBackFun && typeof (callBackFun) == "function")
        callBackFun();
    }
  });
  var param = { t: new Date().getTime() };
  if (vouchId) {
    param.vouchId = vouchId;
  }

  if (isTmpVouch)
    param.isTmpVouch = isTmpVouch ? 1 : 0;
  if (vchData && vchData.getRowSet() && vchData.getRowSet().primary.length > 0) {
    var newPrimary = [];
    function sortVouchObj (aObj, bObj) {
      if (typeof (aObj.vouchNo) == "undefined")
        return aObj.vouchId - bObj.vouchId;
      else
        return aObj.vouchNo - bObj.vouchNo;
    }
    var primary1 = typeof (vchData.primary) != "undefined" ? vchData.primary : vchData.getRowSet().primary;
    if (primary1 && primary1.length > 0) {
      for (var z = 0; z < primary1.length; z++) {
        var t = primary1[z];
        if (t && t.vouchId && t.vouchId != -1) {
          if (newPrimary.length < 1) {
            newPrimary[newPrimary.length] = t;
          } else {
            var isHas = false;
            for (var z1 = 0; z1 < newPrimary.length; z1++) {
              var t1 = newPrimary[z1];
              if (t1 && t1.vouchId) {
                if (t1.vouchId == t.vouchId) {
                  isHas = true;
                  break;
                }
              }
            }
            if (!isHas) {
              newPrimary[newPrimary.length] = t;
            }
          }
        }
      }
    }

    //		vchData.getRowSet().primary=newPrimary.sort(sortVouchObj);影响表格的S 所以暂时隐藏 
    param.VouchDATA = vchData;
  }


  param.isAudit = (isAudit && isAudit == 1 ? 1 : 0);
  param.isDraft = isDraft && isDraft == 1 ? 1 : 0;
  param.isTemplet = isTemplet && isTemplet == 1 ? 1 : 0;
  param.vouchSource = vouchSource || '01';
  if (param.isDraft == 1 || param.isTemplet == 1) {
    param.otherId = otherId;
    isWatch = 1;
  }
  if (isWatch) {
    param.firstIsWatch = param.isWatch = isWatch ? 1 : 0;
  }
  param.dialogId = dialog.id;
  dialog.dialogData = param;

  dialog.show();

  //	$("#"+dialog.id).find("iframe").attr("scrolling","no");
  $("#" + dialog.id).find("[dojoattachpoint='dialogMainContent']").css("height", "100%");
}

function pauseEvent (e) {
  if (e.stopPropagation) e.stopPropagation();
  if (e.preventDefault) e.preventDefault();
  e.cancelBubble = true;
  e.returnValue = false;
  return false;
}
class VHTableAdapter extends Component {
  static defaultProps = {
    fixed: false,
    modelId: '',
    conditions: [],
    linkAgeAction: new LinkAgeAction(),
  }
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      modalData: <div />,
      component: '',
      modalDataHeight: (props.clientHeight && typeof props.clientHeight === 'number') ? parseInt(props.clientHeight) * 0.8 : (document.documentElement.clientHeight || document.body.clientHeight) * 0.8,
      modalDataWidth: 520,
      title: '联动 ',
      padding: '12px',
      spinBool: false,
      printTemplateVisible: false,
      linkageData: null,
    };
    this.history = [];
    this.timer = null;

  }

  componentDidMount () {
    this.params = {
      modelId: this.props.modelId,
      conditions: this.props.conditions,
      parameters: this.props.parameters,
      oneTable: this.props.oneTable,
      userCase: this.props.userCase || {},
    };
    if (this.props.data && this.props.data.modelId) {
      this.params.modelId = this.props.data.modelId;
    }
    this.parameters = this.props.parameters;
    this.getModalAndData(this.params);

    // window.addEventListener('resize', this.tableResize);
    const elementResizeDetectorMaker = require('element-resize-detector');
    const erd = elementResizeDetectorMaker();
    const that = this;

    erd.listenTo(this.view, (element) => {
      that.tableResize(element);
    });
  }

  componentWillReceiveProps (nextProps) {
    // if (nextProps.modelId === '') {
    //   return;
    // }
    // if (nextProps.modelId === this.props.modelId
    //     && (nextProps.conditions === this.props.conditions)
    // ) {

    const userCaseKey = Object.getOwnPropertyNames(nextProps.userCase || {});
    if (nextProps.modelId === '' && !nextProps.data && nextProps.conditions === this.props.conditions) {
      return;
    }
    if (nextProps.modelId === this.props.modelId
      && (nextProps.conditions === this.props.conditions && !nextProps.data ||
        (nextProps.conditions && nextProps.conditions.length === 0 && this.props.conditions && this.props.conditions.length === 0 && !nextProps.data)
        && !userCaseKey.length)
    ) {
      return;
    }

    this.params = {
      modelId: nextProps.modelId,
      conditions: nextProps.conditions,
      parameters: nextProps.parameters,
      oneTable: nextProps.oneTable,
      userCase: nextProps.userCase || {},
    };
    if (nextProps.data && nextProps.data.modelId) {
      this.params.modelId = nextProps.data.modelId;
    }
    this.parameters = nextProps.parameters;
    this.getModalAndData(this.params);
  }

  componentWillUnmount () {
    // window.removeEventListener('resize', this.tableResize);
  }
  tableResize = (element) => {
    console.log(this.viewClientWidth, element.clientWidth)

    if (this.props.liId != undefined) {
      clearTimeout(this.timer);

      this.timer = setTimeout(() => {
        // this.refreshByModalId(this.params)
        // const component = this.state.component;
        // component.key = Math.random();
        // this.setState({
        //   component
        // })
        this.VHTable && this.VHTable.forceUpdate();
      }, 1000)
    }
  }
  onCellClick = (record, columnName, action, conditions, isTableHead = '') => {
    if (action && ((action.targetObject && action.targetObject.length > 0) || action.openUrl)) {
      this.HandleAction(record, action, conditions, isTableHead);
    }
    if (this.props.events && this.props.events.click) {
      const data = {
        record,
        title: columnName,
        value: record[columnName],
        // dashboardId:this.props.dashboardId
      };
      // if (conditions && conditions.length) {
      //   conditions.forEach(item => {
      //     record[item.fieldName] = item.values;
      //   })
      // }
      this.props.events.click(data, 'table');
    }
  }

  getModalAndData = (params) => {
    this.checkUserInfo(() => {
      if (params.modelId) {
        this.refreshByModalId(params);
      } else {
        this.refreshByModel();
      }
    });
  }
  checkUserInfo = (cb) => {
    // let userInfo = sessionStorage.getItem('userInfo');
    // if (!userInfo) {
    NetUtil.get('tables/user', null, (data) => {
      if (data.code === 200) {
        let userInfo = {};
        userInfo.userloginname = data.data.userName || '';
        userInfo.username = data.data.name || '';
        userInfo.orgcode = data.data.orgCode || '';
        userInfo.orgname = data.data.orgName || '';
        sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
        cb();
      } else {
        cb();
      }
    }, () => {
      cb();
    });
    // } else {
    //   cb();
    // }
  }
  async setData (conditons, modelInfo, queryPlanData) {
    if (this.props.events && this.props.events.setData) {
      const typeInfo = await getAnalysismodelInfo({ id: modelInfo.analysisModelId });
      if (typeInfo.status && typeInfo.serviceType) {
        const procList = await getProcInfo({ analysisModelId: modelInfo.analysisModelId, type: analysisDataSourceTypeFn(typeInfo.serviceType) });
        if (procList.length) {
          conditons = procList;
        }
      }

      this.props.events.setData(conditons, modelInfo, queryPlanData);
    }
  };
  savePrintPlan = (action = {}) => {
    const model_id = this.params.modelId;
    if (this.props.type == 'excel') {
      const solution = JSON.stringify(action);
      const userCode = '11';
      NetUtil.post('/excel/saveExcelPrintSolution', {
        reportId: model_id, userCode, solution
      }, (data) => {
        if (data.code === 200) {
          Message.success('保存成功');
        } else {
          Message.error('保存失败！');
        }
      })

      return;
    }
    const currentTemplate = this.VHTable.getPrintTemplate() || {};
    currentTemplate.action = action;
    currentTemplate.name = 'xxx方案';
    const adaptive = this.VHTable.tableProperty.adaptive;
    if (adaptive) {
      currentTemplate.widths = [];
    }
    if (!this.VHTable.printTemplateList.length) {
      currentTemplate.isDefault = true;
      this.VHTable.printTemplateList.push(currentTemplate)
    }
    const is_system = action.planType ? true : false;
    const solutionJSON = JSON.stringify(this.VHTable.printTemplateList);
    NetUtil.post('tables/updatePrintSolution', {
      model_id, solutionJSON, is_system
    }, (data) => {
      if (data.code === 200) {
        Message.success('保存成功');
      } else {
        Message.error('保存失败！');
      }
    })
  }
  getQueryPlanColWidths = () => {
    const currentTemplate = this.VHTable.getPrintTemplate() || {};
    return {
      widths: currentTemplate.widths,
      columns: this.columns
    };
  }
  getCurrentPrintAction = () => {
    if (this.props.type == 'excel') {
      return;
    }
    return (this.VHTable.getPrintTemplate() || {}).action;
  }
  userCaseVisible = () => {
    if (Object.getOwnPropertyNames(this.params.userCase || {}).length) {
      if (!this.state.printTemplateVisible) {
        this.setState({ printTemplateVisible: true })
      } else {
        this.setState({ printTemplateVisible: false })
      }

    }
  }
  printOrExportTable = (action = {}, cb, printTemplateId) => {
    this.printCb = cb;

    if (!Object.getOwnPropertyNames(action).length) {
      action = this.printACtion;
    }
    this.printACtion = action;

    const id = this.currentModelId;
    const apis = this.props.apis;
    const dashboardId = this.props.dashboardId;
    let printTemplate = {};
    let sortConditions = null;
    const newAction = produce(action, (draft) => {
      delete draft.type;
    })
      //this.VHTable不存在就无法下载

    if(!this.VHTable){
      Message.warning("下钻情况下,无法下载表格！")
        return
    }
    if (action.type === 'export') {
      this.setState({
        spinBool: true,
      })
    }
    if (this.VHTable.sortConditions) {
      sortConditions = this.VHTable.sortConditions;
    }
    const conditions = this.newConditions(this.conditions, this.params.userCase ? this.params.userCase.conditions : []);
    const userCase = { ...this.params.userCase }
    if (this.params.userCase) {
      if (conditions) {
        userCase.conditions = conditions.map((item) => {
          if (item.operation === 'in' || item.operation === 'range_all') {
            if (typeof item.values === 'string' && item.values) {
              return { ...item, values: item.values.split(',') }
            } else if (typeof (item.values) === "object") {
              return { ...item, values: item.values.map(i => i.key) }
            }

          } else if (item.values) {
            return { ...item, values: [], value: typeof item.values === 'string' ? item.values : item.values.join(',') }
          }
          return item;
        })
          // ZHCW-12673
          .filter(item => (item.value && item.value !== ' ') || (item.values && item.values.length))
      }
    }
    let postData = {
      id, conditions: userCase && Object.keys(userCase).length ? [] : this.conditions, apis, dashboardId, pageIndex: 1, action, sortConditions: sortConditions, userCase: userCase
    };
    if ((action.type === 'print' && this.props.type != 'excel')) {
      printTemplate = this.VHTable.getPrintTemplate() || {};
      const adaptive = this.VHTable.tableProperty.adaptive;
      if (adaptive != undefined && !adaptive) {
        postData.template = {
          action: printTemplate.action || newAction,
          widths: printTemplate.widths
        };
      }
    }

    let url = 'tables/print/';
    if (this.props.type == 'excel') {
      if (action.type === 'export' && action.fileType == 'excel') {
        XlsxPopulate.fromBlankAsync()
          .then(workbook => {
            const sheet = workbook.sheet('Sheet1');
            tableToSheet(this.VHTable.getPrintTable(), sheet, (cell) => {
              return { ...cell, textBox: SpreadsheetUtils.mergeObject(cell.textBox, defaultTextBox) };
            });
            // Write.
            workbook.outputAsync()
              .then((blob) => {
                urlDownload(blob, action.name);

              });
          });
        this.setState({
          spinBool: false,
        })
        return;
      }
      url = '/excel/printExcel';
      let PageKind = 'UserDefine';
      let HorizionalToOne = false, VerticalToOne = false;
      if (action.HorizionalToOne) {
        HorizionalToOne = action.HorizionalToOne
      }
      if (action.VerticalToOne) {
        VerticalToOne = action.VerticalToOne
      }
      const config = {
        "PrintScheme": {
          "PageSet": {
            "PageKind": action.pageKind || 'A4',
            "PageHeight": action.height || 2970,
            "PageWidth": action.width || 2100,
            "Landscape": action.printDirection == "1" ? true : false,
            "PageMargin": {
              "Left": action.marginLeft || 100,
              "Right": action.marginRight || 100,
              "Top": action.marginTop || 100,
              "Bottom": action.marginBottom || 100,
            }
          },
          "Order": 1,
          HorizionalToOne,
          VerticalToOne,
          "HavePage": false
        }
      };
      let data;
      const excelJson = SpreadsheetUtils.tableToJson([{ present: this.VHTable.getPrintTable() }]);
      postData = { excel: excelJson, data, config: JSON.stringify(config) };
    }
    if (action.templateId) {
      postData.printTemplateId = action.templateId;
    }
    NetUtil.post(url, postData, (data) => {
      this.setState({
        spinBool: false,
      })
      if (!data) {
        Message.error('后台错误，请查看日志！');
        return;
      }
      if (action.type === 'export') {
        let { blob, fileName } = data;
        if (this.props.type == 'excel') {
          if (action.fileType == 'pdf') {
            urlDownload(`${isHttpPublic}excel/previewPDF?filePath=` + encodeURIComponent(data.data), action.name);
          }
          return;
        }
        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
          // If IE, you must uses a different method.
          window.navigator.msSaveOrOpenBlob(blob, fileName);
        } else {
          urlDownload(blob, fileName);
        }
      } else if (action.type === 'print') {
        let fileName = data.data.fileName;
        let printUrl = '';
        if (this.props.type == 'excel') {
          printUrl = `${isHttpPublic}excel/previewPDF?filePath=` + encodeURIComponent(data.data);
        } else {
          printUrl = `${isHttpPublic}tables/previewPDF?fileName=` + fileName
        }
        if (typeof this.printCb === 'function') {
          this.printCb(printUrl, this.VHTable.tableProperty ? this.VHTable.tableProperty.isReport : false)
        }
      }
    }, () => {
      Message.error('后台错误，请查看日志！');
    });
  }
  newConditions = (source, target) => {
    if (source && target) {
      const bucket = {};
      source.forEach((item) => {
        bucket[item.fieldId] = item.values;
      });
      target.map((item) => {
        // const value = bucket[item.fieldId];
        // if (value) {
        //   // item.value = value;
        //   item.values = value;
        //   // if (value instanceof String) {
        //   //   item.values = [value];
        //   // }
        //   return {...item,values:value}
        // }

        item.values = bucket[item.fieldId];
        return item;
      });
      return target;
    }
  };
  validateFn = (params) => {
    NetUtil.post('querycase/validateUserCase', params, (data) => {
      console.log(data,'datadata')
      if(data.code === 200) {

      } else {
        Modal.warning({
          title: data.data || data.msg,
          cancelText: '关闭'
        });
      }
    }, (data) => {
      Message.error(data.msg || '接口报错');
    });
  }
  refreshByModalId = async (params, pageIndex = 1) => {
    let instance = [];
    const that = this;
    const id = params.modelId;
    this.currentModelId = params.modelId;
    that.conditions = ArrayUtil.objMergeToHeavy(params.conditions || that.props.conditions, params.parameters || that.props.parameters || []);
    const apis = that.props.apis;
    const dashboardId = that.props.dashboardId;
    const url = this.props.type === 'excel' ? 'excel/getAllData/' : 'tables/getAllData/';
    that.setState({
      component: (<Spin />),
    });

    const conditions = this.newConditions(that.conditions, params.userCase ? params.userCase.conditions : []);
    const userCase = { ...params.userCase }
    if (params.userCase) {
      if (conditions) {
        userCase.conditions = conditions.map((item) => {
          if (item.operation === 'in' || item.operation === 'range_all' || item.operation === 'relative') {
            if (typeof item.values === 'string' && item.values) {
              return { ...item, values: item.values.split(',') }
            } else if (typeof (item.values) === "object") {
              if(item.dataType === 'date' && item.operation === "relative"){
                return { ...item, values: item.value&& item.values[0].split(",") }
              }else {
                return { ...item, values: item.values.map(i => i.key) }
              }
            }

          } else if (item.values) {
            return { ...item, values: [], value: typeof item.values === 'string' ? item.values : item.values.join(',') }
          }
          return item;
        })
          //ZHCW-12673
          // .filter(item => (item.value && item.value !== ' ') || (item.values && item.values.length))
      }
    }

    let netObj = { id, conditions: userCase && Object.keys(userCase).length ? [] : that.conditions, apis, dashboardId, pageIndex, userCase: userCase, }
    if (userCase && userCase.isAssociationQuery) {
      netObj.isAssociationQuery = true
      delete userCase.isAssociationQuery;
    }
    // if(JSON.stringify(userCase) !== '{}'){
    //   const validate = {
    //     ...userCase,
    //     reportId: dashboardId
    //   }
    //   validate.conditions.map((item) => {
    //     if (item.dataType === 'date' && item.value) {
    //       item.values = [];
    //     } else {
    //       if(item.operation === "in" || item.operation === "range_all") {
    //         item.value = "";
    //       } else {
    //         item.values = [];
    //       }
    //     }
    //   });
    //   this.validateFn(validate)
    // }
    NetUtil.post(url, netObj, (data) => {

      if (data.code !== 200) {
        this.setState({
          component: data.msg||'接口报错',
        });
        return;
      }
      if (data.data === null) return;
      const tableModel = JSON.parse(data.data.controlModel.content);
      instance = tableModel.Report.ReportBody.Items;

      let padding = '12px';
      // if (tableModel.Report.ReportHeader.isShow) {
      //   padding = '0px 12px 12px 12px';
      // } else {
      //   padding = '12px';
      // }
      if (this.props.popup) {
        padding = '0px';
      }
      // if (data.data.ifExistDefaultUserCase === false) {
      //   this.props.dashboardModel.setState({
      //     userCaseModalVisible: true,
      //   })
      // }
      if (data.data.controlModel.type === 'excel') {
        const table = SpreadsheetUtils.jsonToTable(tableModel).present;
        SpreadsheetPreview.fetchDashboardParams(table).then(ps => {
          that.setData(ps, { id: "test1111", fields: [], componentName: data.data.controlModel.name });
          that.setState({
            component: <SpreadsheetPreview
              table={table}
              params={tableModel.params}
              clickHandle={that.props.clickHandle}
              conditions={that.conditions}
              ref={ref => this.VHTable = ref}
            />,
          });
        });
        return;
      }

      let table_modeltableProperty = instance.Tables[0].tableProperty ? instance.Tables[0].tableProperty : {
        isReport: instance.Tables[0].isReport,
        isReportUseaCaseSum: instance.Tables[0].isReportUseaCaseSum,
        adaptive: true,
      }
      let queryPlanData = {
        ifExistDefaultUserCase: data.data.ifExistDefaultUserCase,
        usercaseId: data.data.usercaseId,
        cacheKey: data.data.customObject  && data.data.customObject.cacheKey, 
        tableModelId: data.data.controlModel.id,
        isAPIDefine: data.data.isAPIDefine,
        isReport: table_modeltableProperty.isReport,
        adaptive: table_modeltableProperty.adaptive,
        isReportUseaCaseSum: table_modeltableProperty.isReportUseaCaseSum,
      };

      if(tableModel.queryPlanData&& tableModel.queryPlanData.linkageList && tableModel.queryPlanData.linkageList.length > 1){
      // if(tableModel.queryPlanData&& tableModel.queryPlanData.linkageList){
        if(!this.LinkageButton){
          this.LinkageButton =  (<LinkageButton linkageData={tableModel.queryPlanData.linkageList} handleLinkageChange={this.handleLinkageChange.bind(this)}
                                                reportId={this.props.dashboardId} onProgrammeChange={this.onProgrammeChange.bind(this)}
          />)
        }
      }

      let linkage = this.LinkageButton
      if (data.data.controlModel.type === 'table') {
        const dataSet = tableModel.Report.dataSets[0];
        const fields = data.data.analysisModelFields[dataSet.analysisModelId];
        this.columns = instance.Tables[0].columns;
        const modelFields = instance.Tables[0].columns.filter(f => {
          if (f.fieldName && f.fieldName.indexOf('column&@Name') === -1) {
            return { fieldName: f.fieldName, comments: f.comments || f.fieldName }
          } else {
            return false;
          }
        });

        let newAnalysisModelfields = (fields.map((item) => {
          return { ...item, analysisModelId: dataSet.analysisModelId }
        })).filter((item) => {
          return item.checked == true;
        });
        let modelInfo = {
          id,
          fields: modelFields.map(f => ({ fieldName: f.fieldName, text: f.comments })),
          componentName: data.data.controlModel.name,
          analysisModelId: dataSet.analysisModelId
        }

        // modelInfo.fields = ArrayUtil.objMergeToHeavy((dataSet.conditions || []).map(f => {
        //   return { fieldName: f.fieldName, text: f.comments }
        // }), modelInfo.fields)
        let newConditions = dataSet.conditions.filter(item => !item.hidden);
        if (newConditions.length > 0) {
          that.setData(newConditions.map((item) => {
            return { ...item, analysisModelId: dataSet.analysisModelId }
          }), modelInfo, queryPlanData)
        } else {
          // getAnalysisConditionsAndMergeFields(newAnalysisModelfields, dataSet.analysisModelId, function (analysisModelFields) {
          //   that.setData(analysisModelFields, modelInfo);
          // })
          mergeAnalysisFieldsAndReference(data, newAnalysisModelfields, dataSet.analysisModelId, function (analysisModelFields) {
            that.setData(analysisModelFields, modelInfo, queryPlanData);
          });
        }
        that.conditions = ArrayUtil.objMergeToHeavy(that.conditions, newConditions);
        userCase.cacheKey = queryPlanData.cacheKey
        that.setState({
          padding,
          component: (<VHTable
            tableType={'table'}
            ref={ref => this.VHTable = ref}
            events={that.props.events}
            headerModel={tableModel.Report.ReportHeader}
            footerModel={tableModel.Report.ReportFooter}
            model={instance.Tables[0]}
            fixed={that.props.fixed}
            clickHandler={that.onCellClick}
            conditions={that.conditions}
            dataSet={{ ...dataSet, ...instance.Tables[0].tableProperty }}
            data={Object.assign({}, data.data.controlData)}
            linkages={that.props.linkages}
            liId={that.props.liId}
            refresh={that.props.refresh}
            containerType={that.props.containerType}
            dimensions={that.props.dimensions}
            procedures={that.props.procedures}
            apis={that.props.apis}
            booksReport={{ refreshByModalId: this.refreshByModalId, params: { ...params, userCase } }}
            modelId={params.modelId}
            oneTable={params.oneTable}
            useOuterApi={that.props.useOuterApi}
            view={this.view}
            userCase={userCase}
            pageIndex={pageIndex}
            linkage={linkage}
          />),
        });
      } else if (data.data.controlModel.type === 'matrix') {
        const matrix = instance.Tables[0];
        const model = matrix.model;
        const anaId = matrix.analysisModelID;

        NetUtil.get(`analysismodel/getAssociateInfo/${anaId}`, null, (d) => {
          const fields = analysisModel.getFields(JSON.parse(d.data.analysis_model$content));
          const modelFieldSet = new Set(matrixUtil.getMatrixFeilds(model).map(f => f.fieldName));
          const modelFields = fields.filter(f => modelFieldSet.has(f.aliasName || f.fieldName));
          let newConditions = matrix.conditions.filter(item => !item.hidden);
          that.setData(newConditions.length > 0 ?
            newConditions : fields,
            {
              id,
              fields: modelFields.map(f => ({ ...f, text: f.comments })),
              componentName: data.data.controlModel.name,
              analysisModelId: anaId
            }, queryPlanData);
        });
        that.conditions = ArrayUtil.objMergeToHeavy(that.conditions, matrix.conditions.filter(item => !item.hidden));
        const dataSet = { ...matrix.tableProperty, analysisModelId: anaId };
        that.setState({
          padding,
          component: <VHTable
            tableType={'matrix'}
            ref={ref => this.VHTable = ref}
            model={model}
            headerModel={tableModel.Report.ReportHeader}
            footerModel={tableModel.Report.ReportFooter}
            fixed={that.props.fixed}
            clickHandler={that.onCellClick}
            conditions={that.conditions}
            dataSet={dataSet}
            data={Object.assign({}, data.data.controlData)}
            containerType={that.props.containerType}
            liId={that.props.liId}
            tableProperty={matrix.tableProperty}
            modelId={params.modelId}
            useOuterApi={that.props.useOuterApi}
            view={this.view}
            oneTable={params.oneTable}
            userCase={userCase}
          />,
        });
      } else if (data.data.controlModel.type === MATRIX2) {
        const model = instance.Tables[0];
        const fields = data.data.analysisModelFields[model.analysisModelId];
        let newConditions = model.conditions.filter(item => !item.hidden);
        that.conditions = ArrayUtil.objMergeToHeavy(that.conditions, newConditions);
        let newAnalysisModelfields = (fields.map((item) => {
          return { ...item, analysisModelId: model.analysisModelId }
        })).filter((item) => {
          return item.checked == true;
        });

        if (newConditions.length > 0) {
          that.setData(newConditions.map((item) => {
            return { ...item, analysisModelId: model.analysisModelId }
          }), { id, fields: [], componentName: data.data.controlModel.name, analysisModelId: model.analysisModelId }, queryPlanData)
        } else {
          // getAnalysisConditionsAndMergeFields(newAnalysisModelfields, dataSet.analysisModelId, function (analysisModelFields) {
          //   that.setData(analysisModelFields, modelInfo);
          // })
          mergeAnalysisFieldsAndReference(data, newAnalysisModelfields, model.analysisModelId, function (analysisModelFields) {
            that.setData(analysisModelFields,
              { id, fields: [], componentName: data.data.controlModel.name, analysisModelId: model.analysisModelId },
              queryPlanData);
          });
        }

        that.setState({
          padding,
          component: <VHTable
            tableType={MATRIX2}
            ref={ref => this.VHTable = ref}
            model={model}
            fixed={that.props.fixed}
            clickHandler={that.onCellClick}
            conditions={that.conditions}
            dataSet={{}}
            data={Object.assign({}, data.data.controlData)}
            headerModel={tableModel.Report.ReportHeader}
            footerModel={tableModel.Report.ReportFooter}
            modelId={params.modelId}
            containerType={that.props.containerType}
            useOuterApi={that.props.useOuterApi}
            view={this.view}
            oneTable={params.oneTable}
            liId={that.props.liId}
            userCase={userCase}
            booksReport={{ refreshByModalId: this.refreshByModalId, params: { ...params, userCase } }}
            pageIndex={pageIndex}
            linkage={linkage}
          />,
        });
      }
    }, (data) => {


      this.setState({
        component: '接口报错:' + data.message,
      });
      Message.error('接口报错:' + data.message);
    });
  };
  refreshByModel = () => {
    let padding = '0px';
    if (this.props.type === 'table') {
      const model = this.props.table;
      if (!model) {
        this.setState({
          component: showEmptyDataOrRequestAbnormal('暂无数据', 'chart'),
        });
        return;
      }
      this.setState({
        padding,
        component: <VHTable
          tableType={'table'}
          ref={ref => this.VHTable = ref}
          events={this.props.events}
          model={model.Report.ReportBody.Items.Tables[0]}
          headerModel={model.Report.ReportHeader}
          footerModel={model.Report.ReportFooter}
          fixed
          clickHandler={this.onCellClick}
          conditions={model.Report.dataSets[0].conditions}
          dataSet={model.Report.dataSets[0]}
          view={this.view}
        />,
      });
    } else if (this.props.type === 'matrix') {
      const model = this.props.table ? this.props.table.Report.ReportBody.Items.Tables[0] : null;
      if (!model) {
        this.setState({
          component: '表格模型设计不完整',
        });
        return;
      }
      const report = this.props.table.Report;
      const dataSet = model ? { ...model.tableProperty, analysisModelId: model.analysisModelID } : {};
      this.setState({
        padding,
        component: <VHTable
          tableType={'matrix'}
          ref={ref => this.VHTable = ref}
          model={model.model}
          fixed
          clickHandler={this.onCellClick}
          conditions={model.conditions}
          dataSet={dataSet}
          tableProperty={model.tableProperty}
          headerModel={report.ReportHeader}
          footerModel={report.ReportFooter}
          view={this.view}
        />,
      });
    } else if (this.props.type === MATRIX2) {
      const report = this.props.table.Report;
      const model = report.ReportBody.Items.Tables[0];
      this.setState({
        padding,
        component: <VHTable
          tableType={MATRIX2}
          ref={ref => this.VHTable = ref}
          model={model}
          fixed
          clickHandler={this.onCellClick}
          conditions={model.conditions}
          dataSet={{}}
          headerModel={report.ReportHeader}
          footerModel={report.ReportFooter}
          view={this.view}
        />,
      });
    } else {
      this.setState({
        component: <SpreadsheetPreview
          table={this.props.table}
          params={this.props.conditions}
          conditions={this.props.table.conditions || []}
          setData={that.setData}
          ref={ref => this.VHTable = ref}
        />,
      });
    }
  }

  restore () {
    if (this.history.length > 0) {
      const lastData = this.history.pop();
      this.refreshByModalId(lastData);
    }
  }
  showSelf = (conditions, modalData) => {
    const newParams = {
      modelId: this.props.modelId,
      conditions: this.props.conditions,
    };
    this.history.push(newParams);
    // if (conditions.type === 'table' || conditions.type === 'matrix' || conditions.type === 'excel') {
    //   this.refreshByModalId({
    //     modelId: conditions.modelId,
    //     conditions: conditions.conditions,
    //   });
    // } else {
    //   this.setState({
    //     component: <VHChart
    //       theme={theme}
    //       modelId={conditions.modelId}
    //       conditions={conditions.conditions}
    //     />,
    //     data: [],
    //   });
    // }
    this.setState({ component: modalData })
  };
  HandleAction (record, action, condition = [], isTableHead) {
    let actions = JSON.parse(JSON.stringify(action));
    // if(this.LinkageButton){
      if (this.state.linkageDataAction) {
        actions = _.cloneDeep(this.state.linkageDataAction)
      }
    // }
    const that = this;

    actions.conditions = actions.conditions.map((item, idx) => {
      const fieldName = item.value.indexOf('=Fields.') > -1 ? item.value.split('=Fields.')[1] : item.value;
      const tableCondition = condition.filter((item) => { return (item.aliasName || item.fieldName) === fieldName ? true : false });
      if (record[fieldName]) {
        return {
          index: idx,
          dataType: item.dataType,
          fieldName: item.fieldName,
          operation: item.operation,
          values: record[fieldName],
          comments: item.comments,
          tableName: item.tableName
        };
      } else if (tableCondition.length > 0) {
        return {
          ...tableCondition[0],
          values: tableCondition[0].values || '',
        }
        // return {
        //   index: idx,
        //   dataType: tableCondition[0].dataType,
        //   fieldName: tableCondition[0].aliasName || tableCondition[0].fieldName,
        //   operation: tableCondition[0].operation,
        //   values: tableCondition[0].values,
        //   comments: tableCondition[0].comments,
        //   refLable: tableCondition[0].refLable
        // };
      } else if (isTableHead && typeof isTableHead === 'string') {
        return {
          index: idx,
          dataType: item.dataType,
          fieldName: item.fieldName,
          operation: item.operation,
          values: isTableHead,
          comments: item.comments,
        };
      } else {
        return {}
      }
    });
    actions.conditions = actions.conditions.filter((item) => { return item.fieldName ? true : false });
    if (isTableHead && typeof isTableHead === 'string') {
      actions.conditions = ArrayUtil.objMergeToHeavy(that.parameters || [], actions.conditions)
    }
    let modelId = !actions.targetObject || !actions.targetObject.length ? null : actions.targetObject[actions.targetObject.length - 1].split('.')[0];
    const conditions = {
      modelId,
      conditions: actions.conditions,
    };

    let title = actions.setData ? `<span style="font-weight:bold">${actions.setData.name || '联动'}</span>` : '联动';
    var conditionsHtml = '';
    if (that.props.popupInfo && that.props.popupInfo.isConditionToPopup) {
      conditions.conditions = ArrayUtil.objMergeToHeavy(actions.conditions, that.props.popupInfo.intoPopupCondition)
    }
    if (actions.setData && actions.setData.isShowAllParams) {

      // conditions.conditions = ArrayUtil.objMergeToHeavy(actions.conditions, that.conditions || [])
      if (conditions.conditions.length) {
        conditionsHtml = '（';
      }

      conditions.conditions.forEach((item, i) => {
        let v = item.refLable || item.values;
        if (v) conditionsHtml += `${v.replace(',', '-').replace(/quarter/g, '季度').replace(/halfyear-1/g, '上半年').replace(/halfyear-2/g, '下半年')}`
        if (i == conditions.conditions.length - 1) {
          conditionsHtml += '）';
        } else {
          conditionsHtml += '——';
        }
      })

    } else {
      let showList = actions.setData ? actions.setData.showList || [] : [];
      for (let i = 0; i < showList.length; i++) {
        for (let key in record) {
          if (showList[i].split('.')[1] === key) {
            conditionsHtml += `-${record[key]}`;
          }
        }
      }
      // conditionsHtml += '）';
    }
    // conditionsHtml = `<span title=${conditionsHtml}>${conditionsHtml}</span>`;
    title += conditionsHtml;
    title = <div title={conditionsHtml} style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} dangerouslySetInnerHTML={{ __html: title }}></div>;

    const clientWidth = that.props.clientWidth ? that.props.clientWidth : (document.documentElement.clientWidth || document.body.clientWidth);
    const modalWidth = clientWidth * (actions.setData ? actions.setData.newWindowSize.slice(0, actions.setData.newWindowSize.length - 1) / 100 : 1);
    const modalDataWidth = actions.setData ? modalWidth : 520;
    const newPopupInfo = OtherUtil.getPopupInfo(this.props.popupInfo);
    let modalData = null;
    let elementName = '';
    let url;
    let par;
    if (actions.type === 'dashboard') {
      let displayWidth = modalWidth - 60;
      let displayHeight = this.state.modalDataHeight - 48;
      //  过滤非常用查询项
      modalData = (<DashboardModel
        type="iframe"
        id={conditions.modelId}
        externalParameters={ArrayUtil.objMergeToHeavy(conditions.conditions, that.props.parameters)}
        externalDimensions={that.props.dimensions}
        externalProcedures={that.props.procedures}
        externalApis={that.props.apis}
        externalMeasures={that.props.measures}
        width={actions.target == '_blank' ? `${displayWidth}px` : null}
        height={actions.target == '_blank' ? `${displayHeight}px` : document.body.clientHeight - 100 + "px"}
        popup={actions.target == 'pageJump' ? false : true}
        popupInfo={newPopupInfo}
        // popupInfo={this.props.popupInfo}
        userCase={that.state.linkageDataAction ? { conditions: conditions.conditions, isAssociationQuery: true } : null}
        loadType={'action'}
      />)
      elementName = "DashboardModel";
    } else if (action.type === 'storyboard') {
      modalData = (
        <RightBoard
          urlParamsType={"view"}
          saveBoard={() => { }}
          urlParamsId={conditions.modelId}
          designerType={"storyboard"}
          popup={actions.target == 'pageJump' ? false : true}
          popupInfo={newPopupInfo}
          externalParameters={ArrayUtil.objMergeToHeavy(conditions.conditions, that.props.parameters)}
        />
      );
      elementName = "RightBoard";
    } else if (actions.type === 'table' || actions.type === 'matrix' || actions.type === 'excel' || actions.type === 'matrix2') {
      modalData = (<VHTableAdapter
        modelId={conditions.modelId}
        conditions={conditions.conditions}
        popupInfo={newPopupInfo}
        userCase={that.state.linkageDataAction ? { conditions: conditions.conditions, isAssociationQuery: true } : null}
      />);
      elementName = "VHTable";
    } else if (actions.type === 'chart') {
      let measures = [];
      actions.measures.forEach((item) => { measures.push({ fieldName: item, orderType: '' }) })
      let tableTreeLinkChart = {};
      if (actions.measures[0] && typeof actions.dimension === 'object' && actions.dimension[0]) {
        tableTreeLinkChart.dimension = actions.dimension[0];
        tableTreeLinkChart.measure = actions.measures[0];
        tableTreeLinkChart.children = record.children;
        if (!record.children) {
          return;
        }
      }


      modalData = (<VHChart
        theme={theme}
        modelId={conditions.modelId}
        conditions={conditions.conditions}
        measures={measures}
        tableTreeLinkChart={tableTreeLinkChart}
        popupInfo={newPopupInfo}
      />)
      elementName = "VHChartFather";
    } else {
      url = action.openUrl;
      let index = url.indexOf('?');
      let targetFieldTable = [];
      if (index != -1) {
        url = url.slice(index + 1);
        let array = url.split('&');

        for (const str of array) {
          const pair = str.split('=');
          // if (pair.length === 2) {
          let key = pair[0];
          const value = decodeURIComponent(pair[1]);
          let currentField = conditions.conditions.find(item => item.fieldName == key);
          targetFieldTable.push({
            fieldName: key,
            comments: currentField ? currentField.values : value,
          })
          // }
        }
      }
      par = '';
      if (targetFieldTable.length) {
        url = action.openUrl.slice(0, index + 1);
        targetFieldTable.forEach(item => {
          par += `&${item.fieldName}=${item.comments}`
        })
        par = par.slice(1)
      } else {
        url = action.openUrl;
      }
      modalData = (<iframe src={url + par} width='100%' height='95%'> </iframe>)
      elementName = 'iframe';
    }
    if (actions.target === '_self') {
      conditions.type = actions.type;
      this.showSelf(conditions, modalData);
      return;
    }
    if (actions.target == 'pageJump') {

      if (app.openFictionMenu) {
        let pageJumptitle = `${actions.setData ? actions.setData.name || '新界面' : '新界面'}`;
        if (conditions.conditions.length) {
          pageJumptitle = `${pageJumptitle}-`
        }
        let pageJumpConditions = conditions.conditions.map((item) => {
          let values = item.values;
          if (Array.isArray(values)) {
            values = values.map(c => c.key || '')
          }
          return {...item,values}
        })
        pageJumpConditions.forEach((item, i) => {
          let pageJumpstr = '';
          if (i != conditions.conditions.length - 1) {
            pageJumpstr = ','
          }
          pageJumptitle += `${Array.prototype.join.call(item.values || '', '').replace(/\/quarter/g, '季度')}${pageJumpstr}`
        })
        let id = conditions.modelId;
        const paramX = { elementProps: modalData.props, type: conditions.type, title:pageJumptitle, id, elementName };
        if (actions.urlType == "platform") {

          app.openFictionMenu({ type: 2, url: url + par, title:pageJumptitle, id: id, },
          )
        } else {
          this.time = setTimeout(()=>{
            clearTimeout(this.time)
            app.openFictionMenu({ type: 3, url: "/bi/ActionVModel/" + id, title:pageJumptitle, id: id, other: paramX },
            paramX)
          },300)
        }

      }
      return;
    }

    if (actions.target == '_blank') {
      if (actions.urlType == "platform") {
        const newurl = url + par;
        if (unieap && top.XDialogUtil) {
          // const dialog = top.XDialogUtil.createDialog({
          //   title: '联动',
          //   height: that.state.modalDataHeight + 'px',
          //   width: modalDataWidth + 'px',
          //   resizable: true,
          //   isMax: true,
          //   isExpand: false,
          //   url: newurl,
          // });
          // dialog.show();
          oes_biurl = url;
          let currentField = conditions.conditions.find(item => item.fieldName == "vouchId");
          toAcctVouchInput(currentField.values, false, false)
        }
        return;
      }
    }
    this.setState({
      conditions,
      visible: !that.state.visible,
      modalDataHeight: that.state.modalDataHeight,
      modalDataWidth: modalDataWidth,
      title,
      modalData,
    });
  }
  getRandom = () => {
    let ran = Math.random() + "";
    ran = ran.substring(2);
    return ran;
  }
  hideModal () {
    this.setState({
      visible: false,
      modalData: null,
    });
  }
  getViewDom = ref => {
    this.view = ref;
  };
  vHTableScroll = (e) => {
    e = e || window.event;
    pauseEvent(e)


    if (e.target.scrollLeft != this.scrollLeft) {
      // this.VHTable&&this.VHTable.forceUpdate()

      // this.VHTable.setVhTableScroll && this.VHTable.setVhTableScroll(e.target.scrollLeft)
      // clearTimeout(this.timer);

      this.timer = setTimeout(() => { //触发太频繁了,取最后一次，不然有性能问题,这种体验最好用这种
        this.VHTable && this.VHTable.forceUpdate();
      }, 1000)
      // setTimeout(() => { //节流得方式，界面渲染看着有点难受，还是用异步队列把,放到事件循环最后，不阻塞dom
      //   this.VHTable && this.VHTable.forceUpdate();
      // },0)

      this.scrollLeft = e.target.scrollLeft;
    }
  }

  handleLinkageChange = (value) => {
    this.setState({
      linkageDataAction: value
    })
  }

  onProgrammeChange=(value,record) => {
    NetUtil.get(`usercase/get/${value}`, null, (data) => {
      if (data.code === 200) {
        this.params.userCase  = {
          ...data.data,
          scheme: record,
        }
        this.params.userCase.columns.map(item => item.code = item.fieldName)
        this.refreshByModalId(this.params);
      } else {
        message.error(data.msg);
      }
    }, (data) => {
      message.error(data.msg || '接口报错');
    });
  }
  render () {
    let content;

    if (!this.state.component) {
      content = <Spin />;
    } else {
      content = this.state.component;
    }


    return (
      <div id="tableDiv" className="vhtable-tablediv bi" onScroll={(e) => { this.vHTableScroll(e) }} ref={this.getViewDom} style={{ padding: this.state.padding, height: '100%', paddingLeft: '0px', paddingRight: '0px', width: '99%', margin: '0 auto' }}>
        {/* 高度是界面设计器用的 */}
        {content}
        {this.state.spinBool && < div style={{ textAlign: 'center', height: '100%' }}>
          <Spin style={{ position: 'absolute', top: '50%' }} />
        </div>}
        <Modal
          title={this.state.title}
          visible={this.state.visible}
          closable
          onCancel={this.hideModal.bind(this)}
          wrapClassName="vertical-center-modal bi"
          width={this.state.modalDataWidth}
          bodyStyle={{ height: this.state.modalDataHeight, overflow: 'auto' }}
          footer={null}
        >
          {this.state.modalData}
        </Modal>
        {

          this.state.printTemplateVisible && <PrintTemplateModal
            visible={this.state.printTemplateVisible}
            id={this.currentModelId}
            handleCancel={() => { this.setState({ printTemplateVisible: false }) }}
            handleOk={({ printTemplateId }) => {
              this.setState({ printTemplateVisible: false })
              this.printOrExportTable({}, this.printCb, printTemplateId)
            }}
          />
        }
      </div >
    );
  }
}
VHTableAdapter.getColumns = (data) => {
  const content = JSON.parse(data.content);
  if (data.type === 'table') {
    return content.Report.ReportBody.Items.Tables[0].columns;
  } else if (data.type === 'matrix') {
    const model = content.Report.ReportBody.Items.Tables[0].model;
    return matrixUtil.getMatrixFeilds(model);
  } else {
    return [];
  }
};
export default VHTableAdapter;
