
import React, { Component } from 'react';
import { Modal, Input, Icon, Select } from '@vadp/ui';
import produce from 'immer';
const { Option } = Select;
let defaultParameters = [
  {
    key:"tableName",
    val:"",
  },
  {
    key:"displayField",
    val:"",
  },
  {
    key:"fieldName",
    val:"",
  },
  {
    key:"asc",
    val: true,
  },
]
class ExternalReference extends Component {
  constructor(props) {
    super(props);
    this.state = {
      url: 'reference/getAnalysisModelFieldVal?',
      parameters: defaultParameters.concat([]),
    };
  }
  componentDidMount() {
    const { url, parameters } = this.props.referenceInfo;
    if (url || parameters) {
      this.setState(this.props.referenceInfo);
    }
  }
  renderParameters() {
    const { parameters } = this.state;
    return parameters.map((item, i) => {
      return (
        <div style={{ display: 'flex', marginTop: '6px' }}>
          key: <Input style={{ margin: '0px 15px' }} value={item.key} disabled={true} />
            value: <Input style={{ margin: '0px 15px' }} value={item.val} onChange={this.parameChange.bind(this, i)} />
          <Icon type="minus-circle" onClick={this.removeParame.bind(this, i)} style={{ fontSize: 16, float: 'right', cursor: 'pointer', marginTop: '3px', color: 'red' }} />
        </div>
      )
    })
  }
  removeParame(i) {
    let parameters = produce(this.state.parameters, (d) => {
      d.splice(i, 1)
    });
    this.setState({ parameters })
  }
  parameChange(i, e) {
    let parameters = produce(this.state.parameters, (d) => {
      d[i].val = e.target.value;
    });
    this.setState({ parameters })
  }
  addParameter = () => {

    if (!this.currentParamKey.input.value || !this.currentParamval.input.value) {
      return;
    }
    let parameters = produce(this.state.parameters, (d) => {
      let index = d.findIndex((item) => item.key == this.currentParamKey.input.value);
      if (index != -1) {
        d[index].val = this.currentParamval.input.value;
      } else {
        d.push({
          key: this.currentParamKey.input.value,
          val: this.currentParamval.input.value
        })
      }
    })
    this.currentParamKey.input.value = '';
    this.currentParamval.input.value = '';
    this.setState({ parameters })
  }
  urlChange = (e) => {
    this.setState({ url: e.target.value })
  }
  getCurrentState() {
    const { url, parameters } = this.state;
    return { url, parameters };
  }
  render() {
    return (<React.Fragment>
      <div style={{ display: 'flex', marginBottom: '15px' }}>
        <h2>url???</h2>
        <Input style={{ margin: '0 0 0 15px' }} onChange={this.urlChange} value={this.state.url} />
      </div>
      <h2 style={{ marginBottom: '15px' }}>???????????????</h2>
      <div style={{ display: 'flex' }}>
        key: <Input style={{ margin: '0px 15px' }} ref={(e) => { this.currentParamKey = e }} />
                        value: <Input style={{ margin: '0px 15px' }} ref={(e) => { this.currentParamval = e }} />
        <Icon type="plus-circle" onClick={this.addParameter} style={{ fontSize: 16, float: 'right', cursor: 'pointer', marginTop: '3px' }} />
      </div>
      <h2 style={{ margin: '15px 0px' }}>???????????????</h2>
      <div style={{ height: '100px', overflow: 'auto' }}>
        {
          this.renderParameters()
        }
      </div>
    </React.Fragment>)
  }
}
class DefaultReference extends Component {
  constructor(props) {
    super(props);
    let referenceInfo = props.referenceInfo || {};
    this.state = {
      table: referenceInfo.table || '',
      displayField: referenceInfo.displayField || '',
      orderField: referenceInfo.orderField || ''
    };
  }
  tableChange = (table) => {
    this.setState({ table })
  }
  displayFieldChange = (displayField) => {
    this.setState({ displayField })
  }
  orderFieldChange = (orderField) => {
    this.setState({ orderField })
  }
  getCurrentState() {
    const { table, displayField, orderField } = this.state;
    return { table, displayField, orderField };
  }
  render() {
    const { tableList } = this.props;
    const { table, displayField, orderField } = this.state;
    let index = tableList.findIndex(item => item.tableName == table);
    let fields = [];
    if (index != -1) {
      fields = tableList[index].fieldsInfo;
    }
    return (<React.Fragment>
      <div style={{ display: 'flex', marginBottom: '10px' }}>
        <span style={{ width: '45px' }}>?????????</span>
        <Select style={{ width: 'calc(100% - 45px)' }} value={table} onChange={this.tableChange}>
          {
            tableList.map((item) => {
              return (<Option value={item.tableName}>{item.displayName}</Option>)
            })
          }
        </Select>
      </div>
      <div style={{ display: 'flex', marginBottom: '10px' }}>
        <span style={{ width: '90px' }}>???????????????</span>
        <Select style={{ width: 'calc(100% - 45px)' }} onChange={this.displayFieldChange} value={displayField}>
          {
            fields.map((item) => {
              return (<Option value={item.aliasName || item.fieldName}>{item.comments}</Option>)
            })
          }
        </Select>
      </div>
      <div style={{ display: 'flex', marginBottom: '10px' }}>
        <span style={{ width: '90px' }}>???????????????</span>
        <Select style={{ width: 'calc(100% - 45px)' }} onChange={this.orderFieldChange} value={orderField}>
          {
            fields.map((item) => {
              return (<Option value={item.aliasName || item.fieldName}>{item.comments}</Option>)
            })
          }
        </Select>
      </div>
    </React.Fragment>)
  }
}

class Enumeration extends Component {
  constructor(props) {
    super(props);
    this.state = {
      parameters: [],
    };
  }
  componentDidMount() {
    const {  parameters } = this.props.referenceInfo;
    if ( parameters) {
      console.log(this.props.referenceInfo)
      this.setState(this.props.referenceInfo);
    }
  }
  renderParameters() {
    const { parameters } = this.state;
    return parameters.map((item, i) => {
      return (
        <div style={{ display: 'flex', marginTop: '6px' }}>
          key: <Input style={{ margin: '0px 15px' }} value={item.key} disabled={true} />
            value: <Input style={{ margin: '0px 15px' }} value={item.val} onChange={this.parameChange.bind(this, i)} />
          <Icon type="minus-circle" onClick={this.removeParame.bind(this, i)} style={{ fontSize: 16, float: 'right', cursor: 'pointer', marginTop: '3px', color: 'red' }} />
        </div>
      )
    })
  }
  removeParame(i) {
    let parameters = produce(this.state.parameters, (d) => {
      d.splice(i, 1)
    });
    this.setState({ parameters })
  }
  parameChange(i, e) {
    let parameters = produce(this.state.parameters, (d) => {
      d[i].val = e.target.value;
    });
    this.setState({ parameters })
  }
  addParameter = () => {

    if (!this.currentParamKey.input.value || !this.currentParamval.input.value) {
      return;
    }
    let parameters = produce(this.state.parameters, (d) => {
      let index = d.findIndex((item) => item.key == this.currentParamKey.input.value);
      if (index != -1) {
        d[index].val = this.currentParamval.input.value;
      } else {
        d.push({
          key: this.currentParamKey.input.value,
          val: this.currentParamval.input.value
        })
      }
    })
    this.currentParamKey.input.value = '';
    this.currentParamval.input.value = '';
    this.setState({ parameters })
  }

  getCurrentState() {
    const {  parameters } = this.state;
    return {  parameters };
  }
  render() {
    return (<React.Fragment>
      <h2 style={{ marginBottom: '15px' }}>???????????????</h2>
      <div style={{ display: 'flex' }}>
        key: <Input style={{ margin: '0px 15px' }} ref={(e) => { this.currentParamKey = e }} />
                        value: <Input style={{ margin: '0px 15px' }} ref={(e) => { this.currentParamval = e }} />
        <Icon type="plus-circle" onClick={this.addParameter} style={{ fontSize: 16, float: 'right', cursor: 'pointer', marginTop: '3px' }} />
      </div>
      <h2 style={{ margin: '15px 0px' }}>???????????????</h2>
      <div style={{ height: '100px', overflow: 'auto' }}>
        {
          this.renderParameters()
        }
      </div>
    </React.Fragment>)
  }
}
class ReferenceModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      types: [
        { key: 'year', val: 'date', title: '???' },
        { key: 'month', val: 'date', title: '???' },
        { key: 'yearmonth', val: 'date', title: '??????' },
        { key: 'date', val: 'date', title: '??????' },
        { key: 'parameterEnum', val: 'parameterEnum', title: '??????' },
        { key: 'reference', val: 'reference', title: '??????' },
        { key: 'externalReference', val: 'reference', title: '????????????' },
        { key: 'customReference', val: 'reference', title: '???????????????' },
      ],
      // selectKey: 'externalReference'
      selectKey: 'parameterEnum'
    };
    if (props.referenceInfo && props.referenceInfo.type) {
      this.state.selectKey = props.referenceInfo.type;
    }
  }

  onOk = () => {
    const { onOk } = this.props;
    const { selectKey, types } = this.state;
    let currentKey = types.find((item) => item.key === selectKey).val;
    onOk({
      type: selectKey,
      [currentKey]: this.tab.getCurrentState(),
    });
  }
  typesChange = (selectKey) => {
    this.setState({ selectKey })
  }
  render() {
    const { referenceInfo, tableList } = this.props;
    const { selectKey, types } = this.state;
    let template;
    let currentKey = types.find((item) => item.key === selectKey).val;
    console.log(referenceInfo, currentKey)
    if (selectKey === 'externalReference' || selectKey === 'customReference') {
      template = (<ExternalReference ref={(e) => { this.tab = e }} referenceInfo={referenceInfo[currentKey] || {}} />)
    } else if (selectKey === 'reference') {
      template = (<DefaultReference ref={(e) => { this.tab = e }} referenceInfo={referenceInfo[currentKey] || {}} tableList={tableList} />)
    } else if (selectKey === 'parameterEnum') {
      template = (<Enumeration ref={(e) => { this.tab = e }} referenceInfo={referenceInfo[currentKey] || {}} />)
    } else {
      template = null;
    }
    return (
      <Modal
        title={'????????????'}
        visible={this.props.visible}
        okText="??????"
        bodyStyle={{ height: '307px' }}
        onOk={this.onOk}
        cancelText="??????"
        onCancel={this.props.onCancel}
        wrapClassName="bi"
      >

        <div>
          <div style={{ display: 'flex', marginBottom: '10px' }}>
            <span style={{ width: '45px' }}>?????????</span>
            <Select value={selectKey} style={{ width: 'calc(100% - 45px)' }} onChange={this.typesChange}>
              {
                types.map((item) => {
                  return (<Option value={item.key}>{item.title}</Option>)
                })
              }
            </Select>
          </div>
          {template}
        </div>
      </Modal>
    )
  }
}


export default ReferenceModal;
