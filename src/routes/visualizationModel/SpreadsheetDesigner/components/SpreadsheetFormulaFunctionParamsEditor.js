import React, { Component } from 'react';
import { Row, Col, Modal, Input, Select } from '@vadp/ui';
const Option = Select.Option;

export default class SpreadsheetFormulaFunctionParamsEditor extends Component {
  constructor(props) {
    super(props);
    const { funcItem } = this.props;
    const { params } = funcItem;
    this.state = { currentParam: params[0], values: new Map() };
  }
  componentDidMount() {

  }
  handleValueChange = (param, value) => {
    let { values } = this.state;
    let { name } = param;
    values.set(name, value);
    this.setState({ values });
  };
  getFunctionString() {
    const { funcItem } = this.props;
    const { value, params } = funcItem;
    const { values } = this.state;
    let str = value;
    params.forEach(p => {
      let paramValue = values.has(p.name) ? values.get(p.name) : '';
      str = str.replace('${' + p.name + '}', paramValue);
    });
    return str;
  }

  renderDatasource(param) {
    let { datasource } = param;
    if (datasource) {
      return datasource.map(data => (
        <Option key={data.vlaue} value={data.value}>{data.text}</Option>
      ));
    }
  }

  render() {
    const { visible, funcItem, onOk, onCancel } = this.props;
    const { params } = funcItem;
    const { values, currentParam } = this.state;
    return (
      <Modal
        visible={visible}
        title={`${funcItem.title} 函数参数`}
        onOk={e => onOk(this.getFunctionString())}
        onCancel={onCancel}
        mask={false}
        maskClosable={false}
        wrapClassName='SpreadsheetFormulaFunctionParamsEditor bi'>
        <div className='functionParamsEditor'>
          <table><tbody>
            {params.map((param, index) => {
              return (
                <tr key={param.name}>
                  <td>{param.name}</td>
                  <td>
                    <Select mode="combobox"
                      autoFocus={index === 0}
                      value={values.has(param.name) ? values.get(param.name) : ''}
                      onChange={value => this.handleValueChange(param, value)}
                      onFocus={e => {
                        this.setState({ currentParam: param });
                      }}
                      style={{ width: 200 }}>
                      {this.renderDatasource(param)}
                    </Select>
                  </td>
                </tr>
              );
            })}</tbody></table>
          <hr />
          <div>
            {currentParam && <span>{currentParam.description}</span>}
          </div>
        </div>
      </Modal>
    );
  }
}