import React, { Component } from 'react';
import { Modal, Checkbox, Select, Button, Input, Icon } from '@vadp/ui';
import lodash from 'lodash';
import { message } from 'antd';

const { Option } = Select;
const operators = [
  { text: '=', value: '=' },
  { text: '!=', value: '!=' },
  { text: '>', value: '>' },
  { text: '>=', value: '>=' },
  { text: '<', value: '<' },
  { text: '<=', value: '<=' },
  { text: 'like', value: 'like' }
]
export default class ExpressionModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expressions: [],
      expressionSelection: [],
      operatorSet: []
    }
  }
  componentWillReceiveProps(nextProps) {
    const { expressions, show } = nextProps;
    if (expressions !== undefined && expressions.length) {
      this.setState({ expressions });
    }
    else if (show) {
      this.setState({ expressions: [] },()=>{
        this.addExpression();
      });
    }
  }
  addExpression = () => {
    let { expressions } = lodash.cloneDeep(this.state);
    expressions.push({
      id: new Date().getTime(),
      fieldName: undefined,
      operation: undefined,
      value: undefined,
      valueType: 'String'
    });
    this.setState({ expressions });
  }
  deleteExpression = () => {
    let { expressions, expressionSelection } = lodash.cloneDeep(this.state);
    if (expressionSelection.length > 0) {
      let map = new Map();
      expressions.forEach(item => map.set(item.id, item));
      expressionSelection.forEach(item => map.delete(item));
      expressionSelection = [];
      this.setState({ expressions: [...map.values()], expressionSelection });
    }
  }
  expressionSelection = (checkedValues) => {
    this.setState({ expressionSelection: checkedValues });
  }
  parameterChange = (index, value, extra) => {
    let { expressions } = lodash.cloneDeep(this.state);
    const aliasName = extra.props['data-aliasName'];
    const tableName = extra.props['data-tableName'];
    let operatorSet = [];
    const dataType = extra.props['data-type'];

    switch (dataType) {
      case 'int':
        operatorSet = operators.filter(item => item.value !== 'like');
        break;

      case 'string':
        operatorSet = operators.filter(item => (item.value !== '>' && item.value !== '>=' && item.value !== '<' && item.value !== '<='));
        break;

      default:
        operatorSet = lodash.cloneDeep(operators);
    }
    expressions[index]['fieldName'] = value;
    expressions[index]['tableName'] = tableName;
    expressions[index]['aliasName'] = aliasName;
    expressions[index]['operation'] = undefined;
    expressions[index]['value'] = undefined;
    expressions[index]['valueType'] = 'String';
    expressions[index]['dataType'] = dataType;
    this.setState({ expressions, operatorSet });
  }
  operatorChange = (index, value) => {
    let { expressions } = lodash.cloneDeep(this.state);
    expressions[index]['operation'] = value;
    this.setState({ expressions });
  }
  operatorFocus = (index) => {
    const { expressions } = lodash.cloneDeep(this.state);
    const dataType = expressions[index]['dataType'];
    let operatorSet = [];
    if (dataType) {
      switch (dataType) {
        case 'int':
          operatorSet = operators.filter(item => item.value !== 'like');
          break;

        case 'string':
          operatorSet = operators.filter(item => (item.value !== '>' && item.value !== '>=' && item.value !== '<' && item.value !== '<='));
          break;

        default:
          operatorSet = lodash.cloneDeep(operators);
      }
    }
    this.setState({ operatorSet });
  }
  valueChange = (index, e) => {
    let { expressions } = lodash.cloneDeep(this.state);
    expressions[index]['value'] = e.target.value;
    this.setState({ expressions });
  }
  switchMultipleTable = (index, e) => {
    let { expressions } = lodash.cloneDeep(this.state);
    expressions[index]['valueType'] = expressions[index]['valueType'] === 'String' ? 'json' : 'String';
    if (expressions[index]['valueType'] === 'json') {
      expressions[index]['value'] = {
        "analysis_model$id": undefined,
        "fieldName": "",
      }
    }
    else {
      expressions[index]['value'] = undefined;
    }
    this.setState({ expressions });
  }
  handleOk = () => {
    let { expressions } = lodash.cloneDeep(this.state);
    // if (!expressions.length) {
    //   message.warning('未设置表达式！');
    //   return false;
    // }
    for (const item of expressions) {
      if (!item.fieldName || !item.operation || (item.valueType === 'String' && !item.value) || (item.valueType === 'json' && !item.value.analysisModelId) || (item.valueType === 'json' && !item.value.fieldName)) {
        message.warning('表达式输入不完整！');
        return false;
      }
    }
    this.props.handle(expressions);
    this.setState({
      expressions: [],
      expressionSelection: [],
      operatorSet: []
    });
  }
  handleCancel = () => {
    this.props.handle(null);
    this.setState({
      expressions: [],
      expressionSelection: [],
      operatorSet: []
    });
  }
  renderExpressionParameterOption = () => {
    const { cellAnalysisModelId, tables } = this.props
    const fields = cellAnalysisModelId ? tables.filter(item => item['analysis_model$id'] === cellAnalysisModelId)[0]['fieldsInfo'] : tables[0]['fieldsInfo'];
    return fields.map((item, index) => {
      return <Option data-aliasName={item.aliasName} data-tableName={item.tableName} data-type={item.dataType} value={item.fieldName} key={item.fieldName + index}>{item.aliasName ? item.aliasName : item.fieldName}</Option>
    });
  }
  renderExpressionTableOption = () => {
    const tables = this.props.tables.map((item) => {
      return { name: item['analysis_model$name'], value: item['analysis_model$id'] }
    });
    return tables.map((item) => {
      return <Option data-name={item.name} value={item.value} key={item.value}>{item.name}</Option>
    });
  }
  renderExpressionFieldOption = (index) => {
    const { expressions } = lodash.cloneDeep(this.state);
    const modelSelectID = expressions[index]['value']['analysisModelId'];
    if (modelSelectID) {
      const fields = this.props.tables.find(item => item['analysis_model$id'] === modelSelectID).fieldsInfo;
      return fields.map((item, item_index) => {
        return <Option data-aliasName={item.aliasName} data-tableName={item.tableName} value={item.fieldName} key={item.fieldName + item_index}>{item.aliasName ? item.aliasName : item.fieldName}</Option>
      });
    }
  }
  expressionTableChange = (index, value, extra) => {
    let { expressions } = lodash.cloneDeep(this.state);
    const name = extra.props['data-name'];
    // expressions[index]['value']['analysis_model$name'] = name;
    expressions[index]['value']['analysisModelId'] = value;
    expressions[index]['value']['aliasName'] = null;
    expressions[index]['value']['tableName'] = "";
    expressions[index]['value']['fieldName'] = undefined;
    this.setState({ expressions });
  }
  expressionFieldChange = (index, value, extra) => {
    let { expressions } = lodash.cloneDeep(this.state);
    const aliasName = extra.props['data-aliasName'];
    const tableName = extra.props['data-tableName'];
    expressions[index]['value']['aliasName'] = aliasName;
    expressions[index]['value']['tableName'] = tableName;
    expressions[index]['value']['fieldName'] = value;
    this.setState({ expressions });
  }
  render() {
    return (<Modal
      visible={this.props.show}
      title="表达式编辑器"
      onOk={this.handleOk}
      onCancel={this.handleCancel}
      width={760}
      wrapClassName="bi"
      destroyOnClose={true}
    >
      <div style={{ marginBottom: 16 }}>
        <Button onClick={this.addExpression}>新增</Button>
        <Button style={{ marginLeft: 8 }} onClick={this.deleteExpression}>删除</Button>
      </div>
      <Checkbox.Group onChange={this.expressionSelection}>
        {
          this.state.expressions.map((expression, expression_index) => {
            return (
              <div>
                <Checkbox key={expression.id} value={expression.id} style={{ marginRight: 10 }}></Checkbox>
                <Select value={expression.fieldName} onChange={this.parameterChange.bind(this, expression_index)} placeholder="选择参数" style={{ width: 190, marginRight: 10, marginBottom: 10 }}>
                  {
                    this.renderExpressionParameterOption()
                  }
                </Select>
                <Select value={expression.operation} onFocus={this.operatorFocus.bind(this, expression_index)} onChange={this.operatorChange.bind(this, expression_index)} placeholder="选择操作符" style={{ width: 110, marginRight: 10, marginBottom: 10 }}>
                  {
                    this.state.operatorSet.map((item, index) => {
                      return <Option value={item.value} key={item.value}>{item.text}</Option>
                    })
                  }
                </Select>
                <Input style={{ width: 322, marginRight: 10, verticalAlign: 'top', display: expression.valueType === 'json' ? 'none' : 'inline-block' }} value={expression.value} onChange={this.valueChange.bind(this, expression_index)} placeholder="请输入表达式值" />
                {
                  expression.valueType === 'json' ?
                    <div style={{ verticalAlign: 'top', display: 'inline-block' }}>
                      <Select value={expression['value']['analysisModelId']} onChange={this.expressionTableChange.bind(this, expression_index)} style={{ width: 156, marginRight: 10 }} placeholder="选择模型">
                        {this.renderExpressionTableOption()}
                      </Select>
                      <Select value={expression['value']['fieldName']} onChange={this.expressionFieldChange.bind(this, expression_index)} style={{ width: 156, marginRight: 10 }} placeholder="选择字段">
                        {this.renderExpressionFieldOption(expression_index)}
                      </Select>
                    </div>
                    :
                    ''
                }
                <i style={{ cursor: 'pointer' }} onClick={this.switchMultipleTable.bind(this, expression_index)} className={expression.valueType === 'String' ? "icon iconfont icon-edit" : "icon iconfont icon-table-name"}></i>
              </div>
            )
          })
        }
      </Checkbox.Group>
    </Modal>);
  }
}