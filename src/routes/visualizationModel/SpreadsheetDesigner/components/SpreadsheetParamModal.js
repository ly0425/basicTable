import React, { Component } from 'react';
import { connect } from 'react-redux';
import Message from 'public/Message';
import ConditionsModal from 'components/Public/ConditionsModal';
import { updateParams } from '../SpreadsheetAction';
import * as SpreadsheetApi from "../SpreadsheetApi";

// 缓存高阶函数
function cacheFunc(func, getKey) {
  const map = new Map();
  return {
    exec: function () {
      const key = getKey(...arguments);
      if (map.has(key)) {
        return map.get(key);
      } else {
        const fu = func(...arguments);
        map.set(key, fu);
        return fu;
      }
    },
    clear: function () {
      map.clear();
    }
  };
}

// 获取公式中的指标
const getIndexes = (expression) => {
  let regex = /Indexes\.([\w\u4E00-\u9FA5]+)\.Value/g;
  let result;
  let items = [];
  while (result = regex.exec(expression), result !== null) {
    items.push({ value: result[0], name: result[1] || result[2], index: result.index });
  }
  let regex2 = /getPreviousPeriod\(\"([\w\u4E00-\u9FA5]+)\"\,/g;
  result = null;
  while (result = regex2.exec(expression), result !== null) {
    items.push({ value: result[0], name: result[1] || result[2], index: result.index });
  }
  return items;
};

// 获取指标内容
const getIndexContents = (indexName) => {
  return SpreadsheetApi.fetchIndexByName(indexName).then(data => {
    if (data.indexType === '0' || data.indexType === 0) {
      if (data.dataType === '0' || data.dataType === 0) {
        let model = JSON.parse(data.content);
        model.index_id = data.id;
        model.index_name = indexName;
        return [model];
      } else {
        //基于服务接口
        return [];
      }
    } else {
      //复合指标
      let exp = JSON.parse(data.content);
      let indexes = getIndexes(exp);
      return Promise.all(indexes.map(index => cacheGetIndexContents.exec(index.name)))
        .then(data => data.reduce((a, b) => a.concat(b)));
    }
  }).catch(() => {
    return Promise.resolve([]);
  });
};

const cacheGetIndexContents = cacheFunc(getIndexContents, name => name);
const cacheGetAnalysisFields = cacheFunc(SpreadsheetApi.getAnalysisFields, id => id);

// 1. 获取表格中用到的基本指标定义
const getTableIndexContents = (sheet) => {
  let names = new Set();
  const promises = [];
  for (const row of sheet.tableRows) {
    for (const cell of row) {
      let text = cell.textBox.value;
      if (typeof text === 'string' && text.trim().indexOf('=') === 0) {
        let indexes = getIndexes(text);
        for (const index of indexes) {
          if (!names.has(index.name)) {
            promises.push(cacheGetIndexContents.exec(index.name));
            names.add(index.name);
          }
        }
      }
    }
  }
  return Promise.all(promises).then(data => {
    const map = new Map();
    data.forEach(a => {
      a.forEach(b => {
        if (!map.has(b.index_id)) {
          map.set(b.index_id, b);
        }
      });
    });
    return [...map.values()];
  });
};
// 2. 过滤出指标中值为空的参数
const filterEmptyParams = (contents) => {
  console.log('contents', contents);
  const map = new Map();
  for (const content of contents) {
    const { analysis_module_id, index_id } = content;
    if (!map.has(index_id)) {
      // 找到值为空的参数
      const emptyParams = content.params.filter(p => !p.valueArray || p.valueArray.length == 0 || !p.valueArray[0]);
      if (emptyParams.length > 0) {
        map.set(index_id, {
          analysis_module_id,
          params: emptyParams,
        });
      }
    }
  }
  return [...map.values()];
};
// 3. 参数带上分析模型中取出的字段
const withFields = (simpleContents) => {
  console.log('simpleContents', simpleContents);
  return Promise.all(simpleContents.map(
    ({ analysis_module_id, params }) => {
      return cacheGetAnalysisFields.exec(analysis_module_id)
        .then(fields => ({ analysis_module_id, params, fields }));
    }
  ));
};
// 4. 得到字段集合
const toFields = async (simpleContentsWithFields, sheet) => {
  console.log('simpleContentsWithFields', simpleContentsWithFields);
  const map = new Map();
  for (const { params, fields } of simpleContentsWithFields) {
    for (const param of params) {
      const { fieldName } = param.field;
      if (!map.has(fieldName)) {
        const field = fields.find(f => f.fieldName === fieldName || f.aliasName === fieldName);
        map.set(fieldName, field);
      }
    }
  }

  // 还得取行上的分析模型上的字段
  for (const rowProp of sheet.rowProps) {
    if (rowProp.analysisModelId) {
      const fields = await cacheGetAnalysisFields.exec(rowProp.analysisModelId);
      for (const field of fields) {
        map.set(field.fieldName, field);
      }
    }
  }

  return [...map.values()];
};

export const getEditingFields = async (sheet) => {
  if (!sheet) {
    return;
  }
  cacheGetIndexContents.clear();
  cacheGetAnalysisFields.clear();
  const contents = await getTableIndexContents(sheet);
  const simpleContents = await filterEmptyParams(contents);
  const simpleContentsWithFields = await withFields(simpleContents);
  const fields = await toFields(simpleContentsWithFields, sheet);
  return fields;
};

const SpreadsheetParamModal = class extends Component {
  constructor(props) {
    super(props);
    this.handleValueChange = this.handleValueChange.bind(this);
    let data;
    if (!props.spreadsheet.params) {
      data = [];
    } else {
      data = props.spreadsheet.params.map(p => {
        return { ...p };
      });
    }
    this.state = {
      data: data,
      // [{
      //     dataType: "int",
      //     fieldName: "Money",
      //     index: "",
      //     operation: "=",
      //     values: 1
      // }],
      fields: []
      // fields: [{
      //     dataType: "int",
      //     fieldName: "Money"
      // }]
    };
    this.loadFields();
  }
  async loadFields() {
    const fields = await getEditingFields(this.props.sheet);
    if (fields && fields.length > 0) {
      this.setState({
        fields: [...this.state.fields, ...fields.map((field) => {
          return {
            ...field,
            dataType: (field.dataType && field.dataType.indexOf('int') >= 0) ? 'int' : field.dataType,
          };
        })],
      });
    } else {
      this.handleCancel();
      Message.info('所有指标都不存在动态参数。');
    }
  }

  handleCancel() {
    this.props.onClose();
  }
  hangleOk(data) {
    console.log('data:::', data);
    this.props.dispatch(updateParams(data));
    this.props.onClose();
  }
  handleValueChange(e, p) {
    p.value = e.target.value;
    this.setState(this.state);
  }
  render() {
    if (this.state.fields && this.state.fields.length > 0) {
      return (<ConditionsModal
        disabled={false}
        data={this.state.data}
        visible={this.props.visible}
        fields={this.state.fields}
        onCancel={this.handleCancel.bind(this)}
        onOk={this.hangleOk.bind(this)}
        type={null}
        params={[]}
      />);
    } else {
      return null;
    }
  }
};

const mapStateToProps = (state, ownProps) => {
  const sheet = state.Spreadsheet.ReportBody.sheets[0];
  return {
    // TODO 考虑多个 sheet
    sheet: sheet && sheet.present,
    spreadsheet: state.Spreadsheet
  }
};
export default connect(mapStateToProps)(SpreadsheetParamModal);
