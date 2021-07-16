import NetUtil from 'containers/HttpUtil';
import IndexService from './components/Expression/IndexService';
import { analysisModel } from 'public/analysisModel';
import {
  getAnalysisConditions,
  getConditionByAnalysisID,
  mergeFieldsAndCondition,
  getAnalysisConditionsAndMergeFields,
} from 'components/Public/analysisConditionModel';

export class CommonServerError {
  message;
  constructor(message) {
    this.message = message;
  }
}

export class ServerFail extends CommonServerError {
  constructor(data) {
    const { status, error, path, message } = data;
    if (status) {
      const newMessage = `服务器错误，${status} ${error}`;
      super(newMessage);
      this.status = status;
      this.error = error;
      this.path = path;
    } else {
      const { code, errorCode } = data;
      const newMessage = `服务器 ${errorCode || code} 错误`;
      super(newMessage);
      this.code = code;
      this.errorCode = errorCode;
    }
  }
}

export class ServerError extends CommonServerError {
  constructor(data) {
    const { code, msg } = data;
    super(msg);
    this.code = code;
    this.msg = msg;
  }
}

const serv = new IndexService();

const mock = false;

export const fetchByGet = (url, params, useQueue = false) => {
  return new Promise((resolve, reject) => {
    const onSuccess = (data) => {
      if (data.code === 200) {
        resolve(data.data);
      } else if (data.blob) {
        resolve(data);
      } else {
        reject(new ServerError(data));
      }
    };
    const onFail = (data) => {
      reject(new ServerFail(data));
    };
    if (useQueue) {
      serv.addRequest({ method: 'get', url, params, successFun: onSuccess, failedFun: onFail });
    } else {
      NetUtil.get(url, params, onSuccess, onFail);
    }
  });
};

export const fetchByPost = (url, par, useQueue = false, headers = undefined) => {
  return new Promise((resolve, reject) => {
    const onSuccess = (data) => {
      if (data.code === 200) {
        resolve(data.data);
      } else {
        reject(new ServerError(data));
      }
    };
    const onFail = (data) => {
      reject(new ServerFail(data));
    };
    if (useQueue) {
      serv.addRequest({ method: 'post', url, par, successFun: onSuccess, failedFun: onFail });
    } else {
      NetUtil.post(url, par, onSuccess, onFail, headers);
    }
  });
};

export function fetchIndexes(indexes, params) {
  const url = '/excel/biParallelComput';
  const par = { biIndexes: indexes, biParams: params };
  return fetchByPost(url, par);
}

export function fetchIndexByName(name) {
  const url = '/index/getByName/' + encodeURIComponent(name);
  return fetchByGet(url, null, true);
}

export function fetchIndexData(contents) {
  const url = '/index/analysis/getData';
  const par = contents;
  return fetchByPost(url, par, true);
}

export function getAnalysisModels(categoryId) {
  return fetchByGet(`/analysismodel/getByCategoryId/${categoryId}`);
}

// 获得分析模型的字段
export function getAnalysisFields(id) {
  if (id === '0') {
    return Promise.resolve([]);
  }
  const url = "analysismodel/getAssociateInfo/" + id;
  return fetchByGet(url).then(data => {
    let fields = analysisModel.getFields(JSON.parse(data.analysis_model$content));
    if (fields) {
      fields = fields.map(item => {
        const field = {
          ...item,
          analysisModelId: id,
          dataType: analysisModel.getFieldDataType(item),
        };
        if (item.hasOwnProperty('isChecked') && !field.hasOwnProperty('checked')) {
          field.checked = item.isChecked;
        }
        return field;
      });
    }
    let analysis_modelCondition = null;
    if (data.analysis_model$condition) analysis_modelCondition = JSON.parse(data.analysis_model$condition);
    return new Promise((resolve, reject) => {
      mergeFieldsAndCondition(fields, analysis_modelCondition);
      resolve(fields);
      // getAnalysisConditionsAndMergeFields(fields, id, newFields => { //性能优化
      //   resolve(newFields);
      // });
    });
  });
}

export function fetchVH_INDEX(indexes, pageParams, reportId) {
  console.log('fetchVH_INDEX', indexes);
  if (!mock) {
    return fetchByPost('/excel/fetchData', {
      financeIndexes: indexes,
      pageParams,
      reportId,
    });
  }

  return new Promise(resolve => {
    setTimeout(() => {
      resolve(indexes.map(i => ({
        ...i,
        value: {
          code: 200,
          data: Math.round(Math.random() * 100),
        }
      })));
    }, 1000);
  });
}

export function fetchTableModel(modelID) {
  return fetchByGet('tables/get/' + modelID);
}

export function saveSpreadsheetModel(type, para) {
  let url;
  if (type === 'add') {
    url = '/excel/add';
  } else if (type === 'update') {
    url = '/excel/update';
  }
  return fetchByPost(url, para);
}

// 模板
export function fetchTemplate(reportId) {
  return fetchByGet('excel/getReportModel/' + reportId);
}

export function saveTemplate(type, para) {
  let url;
  if (type === 'add') {
    // url = '/excel/addModel';
    url = '/excel/updateModel';
  } else if (type === 'update') {
    url = '/excel/updateModel';
  }
  return fetchByPost(url, para);
}
export function exportFileData(str) {
  if (!mock) {
    return fetchByGet('excel/exportDatas?' + str);
  }

  return fetchTableModel(reportId).then(res => {
    let str = localStorage.getItem('excelRuntime');
    let storage = {};
    if (str) {
      storage = JSON.parse(str);
    }
    res.dataId = 'asdf';
    if (storage[reportId]) {
      const { data, fetchData } = storage[reportId];
      res.data = data;
      res.fetchData = fetchData;
    }
    console.log('`````````````````', res);
    return res;
  });
}
export function getReportData(reportId, search) {
  if (!mock) {
    return fetchByGet('excel/getReportData/' + reportId + search);
  }

  return fetchTableModel(reportId).then(res => {
    let str = localStorage.getItem('excelRuntime');
    let storage = {};
    if (str) {
      storage = JSON.parse(str);
    }
    res.dataId = 'asdf';
    if (storage[reportId]) {
      const { data, fetchData } = storage[reportId];
      res.data = data;
      res.fetchData = fetchData;
    }
    console.log('`````````````````', res);
    return res;
  });
}

export function saveData(para, reportId) {
  if (!mock) {
    return fetchByPost('excel/validateAndSaveData', para);
  }

  let str = localStorage.getItem('excelRuntime');
  let storage = {};
  if (str) {
    storage = JSON.parse(str);
  }
  storage[reportId] = para;
  localStorage.setItem('excelRuntime', JSON.stringify(storage));
  return;
}

export function getCheckResult(dataId, search) {
  return fetchByGet('/excel/checkReport/' + dataId + search);
}

export function fetchCrossData(para) {
  return fetchByPost('/excel/getCrossData', para);
}

export function fetchTemplateList(pageParams) {
  return fetchByGet('/excel/getCrossModels', pageParams);
}

export function fetchIndexList(reportId) {
  return fetchByGet('/excel/getCrossIndexes', { reportId });
}

export function serverAccess(para) {
  return fetchByPost('/excel/getFetchData', para);
}

export function serverCalc(para) {
  return fetchByPost('/excel/compute', para);
}

export function batchAddIndexes(categoryName, names) {
  return fetchByPost('/excel/batchImportIndex', { categoryName, indexList: names.map(name => ({ name })) })
    .then(data => data.map(d => ({ ...d, code: d.id })));
}

export function uploadxml(file, reportName) {
  const form = new FormData();
  form.append('file', file);
  form.append('reportName', reportName);
  return fetchByPost('/onetouchmigration/uploadxml', form, false, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
}

export function getExpandData({ excel, biParams, rowType = 'expand', contextInfo = {}, template = {} }) {
  convertAnalysisModelConditions(excel, biParams, contextInfo, template);
  biParams = convertBiParams(biParams, contextInfo);
  return fetchByPost('/excel/getExpandData', { excel, biParams, rowType });
}


function convertAnalysisModelConditions(excel, biParams, contextInfo, template) {
  if (biParams) {
    const source = template.Report ? template : excel;
    const rowProps = source.Report.ReportBody.Items.Sheets.rowProps;
    console.log(contextInfo)
    const { edit_dept, edit_dept_list, acctYear, edit_dept_id } = contextInfo;
    for (let item of rowProps) {
      if (item.analysisModelConditions && item.analysisModelConditions.length) {
        let analysisModelConditions = item.analysisModelConditions;
        for (let c of analysisModelConditions) {
          let values = c.value.replace(/edit_dept_id\(\)/g, edit_dept_list || edit_dept_id).replace(/getBudgYear\(\)/g, parseInt(acctYear));
          values = values.replace(/edit_dept\(\)/g, edit_dept_list || edit_dept).replace(/getBudgYear\(\)/g, parseInt(acctYear));
          const operation = (c.value && (c.value.includes('edit_dept') || c.value.includes('edit_dept_id')) && edit_dept_list) ? 'IN' : c.operator;
          let data = {
            analysisModelId: item.analysisModelId,
            fieldName: c.field,
            operation,
            values
          }
          if (c.dataType) {
            data.dataType = c.dataType;
          }
          biParams.push(data)
        }
      }
    }
  }
}
function convertBiParams(biParams, contextInfo) {
  if (biParams) {
    biParams = biParams.map(p => {
      const param = { ...p };
      if (param.referenceInfo && param.referenceInfo.content) {
        if (param.referenceInfo.content.ConditionField) {
          param.fieldName = param.referenceInfo.content.ConditionField;
        }
      }
      if (param.values instanceof Array) {
        param.values = param.values.map(value => {
          let result;
          if (value && typeof value === 'object')
            result = value.key;
          else
            result = value;
          if (typeof result === 'string') {
            const arr = result.split('/');
            if (arr.length > 0)
              result = arr[arr.length - 1];
          }
          return result;
        }).join(',');
      }
      else if (param.values === '=getCurrentAcctYear()') {
        param.values = contextInfo.acctYear;
      }
      return param;
    });
  }
  return biParams;
}

export function getExpandDataByGroupInfo({ excel, biParams, list_groupinfo }) {
  biParams = convertBiParams(biParams);
  return fetchByPost('/excel/getExpandDataByGroupInfo', { excel, biParams, list_groupinfo });
}

export function printExcel(param) {
  return fetchByPost('/excel/printExcel', param);
}

export function directlyPrintExcel(param) {
  return fetchByPost('/excel/directPrint', param);
}

export function getExcelPrintSolution(reportId, userCode) {
  return fetchByGet('/excel/getExcelPrintSolution', { reportId, userCode });
}

export function saveExcelPrintSolution(reportId, userCode, solution) {
  return fetchByPost('/excel/saveExcelPrintSolution', { reportId, userCode, solution });
}

export function updateExpandData(reportId, pageParams) {
  return fetchByGet('/excel/updateExpandData', { ...pageParams, reportIds: reportId });
}

export function getGroupedFieldValue(req) {
  return fetchByPost('/analysismodel/getGroupedFieldValue', req);
}