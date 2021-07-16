import React, { Component } from 'react';
import { Modal, Input, Select, Checkbox, Button, AutoComplete, Icon, Tooltip, Radio } from '@vadp/ui';
import Message from 'public/Message';
import { analysisModel } from 'components/Public/analysisModel';
import { ExpressionEditor, validateWithLexerAndParser, ExpressionEditorModal } from 'components/Public/ExpressionEditor';
import { ExpressionLexer } from '../../expressionEngine/ExpressionLexer';
import { ExpressionParser } from '../../expressionEngine/ExpressionParser';
import { createExpressionCategaries, addField, addCommonFunc, addAggregationFn, addParameterSettings, addContexts } from '../../expressionEngine/ExpressionCategory';
const Option = Select.Option;
const RadioGroup = Radio.Group;
const containerStyle = {
  position: 'relative',
  height: '95%',
};
const formItemStyle = {
  margin: '8px',
};


export default class GroupInfoModalMatrix2 extends Component {
  constructor(props) {
    super(props);
    this.getFields(props);
    this.state = this.getState(props);
    this.renderFields();
  }
  componentWillReceiveProps(nextProps) {
    this.getFields(nextProps);
    const newState = this.getState(nextProps);
    this.setState({ ...newState });
    this.renderFields();
  }
  getState = (props) => {
    const group = props.group;
    return {
      name: group.name,
      expression: group.expressions[0],
      visible: false,
      control: null,
      sort: group.sort,
    };
  }
  getFields(props) {
    this.dimensionFields = analysisModel.getFields(props.dataSource, 'dimension');
    this.AllFields = analysisModel.getFields(props.dataSource, null);
  }
  handleNameChanged = (e) => {
    this.setState({ name: e.target.value });
  }
  handleFieldChange = (value) => {
    const expression = value[0] != '=' ? `=Fields.${value}` : value;
    const index = this.dimensionFields.findIndex(g => g.aliasName === value);
    const currentState = { expression };
    if (index != -1) {
      currentState.name = value;
    }
    this.setState(currentState);
  }
  expressionEdit = (type, i, e) => {
    let expressionMap = {
      visible: true,
    }
    let defaultText = this.state.expression;
    if (type === 'sort') {
      expressionMap.type = type;
      expressionMap.i = i;
      defaultText = this.state.sort[i].expression;
    }
    e = i.stopPropagation ? i : e;
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    this.setState(expressionMap);
    const validate = validateWithLexerAndParser(ExpressionLexer, ExpressionParser, 'exe');
    this.state.control = (<ExpressionEditorModal
      visible
      defaultText={defaultText || ''}
      title='表达式编辑'
      categaries={createExpressionCategaries(true)(addField, true, this.AllFields)(addCommonFunc, true)(addAggregationFn, true)(addContexts, false)}
      onOk={this.onOkExpression.bind(this)}
      onCancel={this.onCancel}
      validate={(text) => {
        return validate(text[0] === '=' ? text.slice(1) : text)
      }}
    />);
  }
  onCancel = () => {
    this.setState({
      visible: false,
    });
  }
  handleCancel = () => {
    this.props.onCancel();
  }
  onOkExpression = (value) => {
    this.onCancel();
    if (this.state.type === 'sort') {
      this.sortChange(this.state.i, 'field', value);
    } else {
      this.handleFieldChange(value);
    }

  }
  handleSubmit = () => {
    const groupName = this.props.repeatGroupName(this.state.name, this.props.rowGroups, this.props.columnGroups);
    const group = this.props.group;
    if (group.name != this.state.name) {
      if (groupName != this.state.name) {
        Message.info('分组名称不能重复');
        return;
      }
    }
    let expression = this.state.expression;
    const groupInfo = {
      group: this.props.group,
      name: this.state.name,
      expressions: [expression],
      sort: this.state.sort,
      selectedGroupStart:this.props.selectedGroupStart,
      groupLeft:this.props.groupLeft,
    };
    this.props.onOk(groupInfo);
  }
  renderFields = () => {
    this.options = this.dimensionFields.map((item) => {
      return (<Option key={item.aliasName}>
        {item.comments || item.aliasName}
      </Option>);
    });
  }
  sortChange = (i, type, e) => {
    const sortMap = this.state.sort[i];
    let value = e.target ? e.target.value : e;
    if (type === 'field') {
      value = value[0] != '=' ? `=Fields.${value}` : value;
      sortMap.expression = value;
    } else if (type === 'direction') {
      sortMap.direction = value;
    }
    this.setState({
      sort: this.state.sort
    })
  }
  renderSort = () => {
    const options = [
      { label: '升序', value: 'asc' },
      { label: '降序', value: 'desc' },
    ];
    const select = this.state.sort.map((item, i) => {
      return (<div className='clearfix' style={{ marginBottom: '5px' }}>
        <div style={{ float: 'left' }}>
          <AutoComplete
            style={{ width: 300, marginBottom: '5px' }}
            placeholder="请选择"
            dataSource={this.options}
            value={item.expression}
            onChange={this.sortChange.bind(this, i, 'field')}
          >
            <Input addonAfter={
              <Tooltip placement="bottom" title={'排序表达式编辑'}>
                <span
                  onClick={this.expressionEdit.bind(this, 'sort', i)}
                  style={{ cursor: 'pointer', borderRadius: '0px', display: 'inline-block', width: '15px', height: '100%' }}
                >...</span>
              </Tooltip>}
            />
          </AutoComplete>
        </div>
        <div style={{ float: 'left', marginLeft: '10px' }}>
          <RadioGroup options={options} value={item.direction} onChange={this.sortChange.bind(this, i, 'direction')} />
          <Icon type="minus-circle" onClick={this.removeSortFiele.bind(this, i)} style={{ fontSize: 16, color: 'red', cursor: 'pointer' }} />
        </div>
      </div>)
    })
    return select;
  }
  removeSortFiele = (i) => {
    this.state.sort.splice(i, 1);
    this.setState({
      sort: this.state.sort,
    })
  }
  addSortField = () => {
    const sortMap = {
      expression: '',
      direction: 'asc'
    }
    this.state.sort.push(sortMap);
    this.setState({
      sort: this.state.sort,
    })
  }
  render() {
    const groups = this.props.groups;
    const expressionElement = this.state.visible ? this.state.control : null;
    let changed = true;
    return (<Modal
      title={'编辑分组'}
      visible={this.props.visible}
      destroyOnClose
      footer={null}
      width="550px"
      bodyStyle={{ height: 350, overflow: 'hidden' }}
      okText="确认"
      cancelText="取消"
      onCancel={this.handleCancel}
      wrapClassName="bi"
    >
      <div style={containerStyle}>
        <div style={{ height: '86%', overflow: 'auto' }}>
          <div style={formItemStyle}>
            <div>名称:</div>
            <div style={{ padding: '8px' }}>
              <Input
                onChange={this.handleNameChanged}
                value={this.state.name}
                style={{ width: 460 }}
              />
            </div>
          </div>
          <div style={formItemStyle}>
            <div> 分组表达式:</div>
            <div style={{ padding: '8px' }}>
              <AutoComplete
                style={{ width: 460 }}
                placeholder="请选择"
                dataSource={this.options}
                value={this.state.expression}
                onChange={this.handleFieldChange}
              >
                <Input addonAfter={
                  <Tooltip placement="bottom" title={'表达式编辑'}>
                    <span
                      onClick={this.expressionEdit.bind(this, 'group')}
                      style={{ cursor: 'pointer', borderRadius: '0px', display: 'inline-block', width: '15px', height: '100%' }}
                    >...</span>
                  </Tooltip>}
                />
              </AutoComplete>
            </div>
          </div>
          <div style={formItemStyle}>
            <div> 排序表达式:
              <Icon type="plus-circle" onClick={this.addSortField} style={{ fontSize: 16, float: 'right', cursor: 'pointer', marginTop: '3px' }} />
            </div>
            <div style={{ padding: '8px 0px 8px 8px' }}>
              {
                this.renderSort()
              }
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', left: '0px', right: '0px', bottom: '8px', textAlign: 'center' }}>
          <Button
            disabled={!changed}
            type="primary"
            onClick={this.handleSubmit}
          >确定</Button>
        </div>
        {expressionElement}
      </div>
    </Modal>);
  }
}
