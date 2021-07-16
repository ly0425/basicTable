import React, { Component } from 'react';
import { Modal, Input, Select, Checkbox, Button, Icon } from '@vadp/ui';
import Message from 'public/Message';
import { analysisModel } from 'components/Public/analysisModel';

const Option = Select.Option;
const CheckboxGroup = Checkbox.Group;
const containerStyle = {
  position: 'relative',
  height: '95%',
};
const formItemStyle = {
  margin: '8px',
};

const biTheSorting = (current) => {
  const res = [];
  const json = {};
  for (let i = 0; i < current.length; i++) {
    if (!json[current[i]]) {
      res.push(current[i]);
      json[current[i]] = 1;
    }
  }
  return res;
};

export default class GroupInfoModal extends Component {
  constructor(props) {
    super(props);
    this.getFields(props);
    this.state = this.getState(props);
    this.selected = false;
  }
  componentWillReceiveProps(nextProps) {
    this.getFields(nextProps);
    const newState = this.getState(nextProps);
    this.setState({ ...newState });
  }
  getState = (props) => {
    const group = props.groups[props.index];
    this.groupNext = props.groups[props.index + 1];
    const hasExpression = group.expressions.length > 0;
    const posistion = [];
    if (this.groupNext) {
      if (group.startRow !== this.groupNext.startRow) {
        posistion.push('p');
      }
      if (group.endRow !== this.groupNext.endRow) {
        posistion.push('n');
      }
    }
    return {
      index: props.index,
      name: group.name,
      hasExpression,
      expressions: hasExpression ? group.expressions.map(e => (e.substr('=Fields.'.length))) : [''],
      posistion: biTheSorting(posistion),
      changed: false,
    };
  }
  getFields(props) {
    this.fields = analysisModel.getFields(props.dataSource, 'dimension');
  }
  handleNameChanged = (e) => {
    const { groups, index } = this.props;
    const changed = this.state.changed || e.target.value !== groups[index].name;
    this.setState({ name: e.target.value, changed });
  }
  handleFieldChange = (index, value) => {
    const expressions = [...this.state.expressions];
    expressions.splice(index, 1, value);
    const count = expressions.filter(e => e === value).length;
    if (count > 1) {
      Message.info('分组表达式不能重复');
      return;
    }
    let changed = true;
    const firstIndex = expressions.findIndex(e => e !== '');
    if (this.groupNext && firstIndex < 0) {
      changed = false;
    }
    const name = firstIndex >= 0 ? this.fields.filter(item => item.aliasName === expressions[firstIndex])[0].comments : '详细信息';
    this.setState({
      expressions,
      name,
      changed,
    });
  }
  handleCancel = () => {
    this.props.onCancel();
  }
  handleSubmit = () => {
    const idx = this.props.groups.findIndex((g, i) => {
      return g.name === this.state.name && i !== this.state.index;
    });
    if (idx >= 0) {
      Message.info('分组名称不能重复。');
      return;
    }
    const expressions = this.state.expressions.filter(e => e !== '').map(e => `=Fields.${e}`);
    for (const exp of expressions) {
      const i = this.props.groups.findIndex((g, k) => {
        return k !== this.state.index && g.expressions.findIndex(e => e === exp) >= 0;
      });
      if (i >= 0) {
        Message.info(`分组表达式【${exp.slice('=Fields.'.length)}】已经被使用。`);
        return;
      }
    }

    const groupInfo = {
      index: this.state.index,
      name: this.state.name,
      expressions,
      posistion: this.state.posistion,
    };
    this.props.onOk(groupInfo);
  }
  addGroupField = () => {
    const { expressions } = this.state;
    this.setState({ expressions: [...expressions, ''] });
  }
  removeGroupField = (index) => {
    const expressions = [...this.state.expressions];
    let changed = !!expressions[index] || this.state.changed;
    expressions.splice(index, 1);
    const firstIndex = expressions.findIndex(e => e !== '');
    // 有子组的分组必须有分组表达式，否则不能保存
    if (this.groupNext && firstIndex < 0) {
      changed = false;
    }
    const name = firstIndex < 0 ? '详细信息' : this.state.name;
    this.setState({ expressions, changed, name });
  }
  renderFields = () => {
    const options = this.fields.map((item) => {

      return (<Option key={item.aliasName}>

        {item.comments || item.aliasName}
      </Option>);
    });
    return options;
  }
  handlePosistionChange = (p) => {
    this.selected = true;
    this.setState({ posistion: p, changed: true });
  }
  render() {
    const options = [
      { label: '显示分组头', value: 'p' },
      { label: '显示分组尾', value: 'n' },
    ];
    const groups = this.props.groups;
    const rowMerge = (this.props.columns[this.props.selection.left].rowMerge === undefined) ? true : this.props.columns[this.props.selection.left].rowMerge;
    const disabled = this.state.index < 0 || this.state.index >= groups.length;
    const { changed } = this.state;
    return (<Modal
      title={'编辑分组'}
      visible={this.props.visible}
      destroyOnClose
      footer={null}
      width="500px"
      bodyStyle={{ height: 350, overflow: 'hidden' }}
      okText="确认"
      cancelText="取消"
      onCancel={this.handleCancel}
      wrapClassName="bi"
    >
      <div style={containerStyle}>
        <div style={formItemStyle}>
          <div>名称</div>
          <div style={{ padding: '8px' }}>
            <Input
              disabled={disabled}
              onChange={this.handleNameChanged}
              value={this.state.name}
            />
          </div>
        </div>
        <div style={formItemStyle}>
          {/*<Checkbox
          disabled={disabled || this.state.index < groups.length - 1}
          onChange={this.handHasExpressionChanged}
          checked={this.state.hasExpression}
        >分组表达式</Checkbox>*/}
          <div> 分组表达式<Icon type="plus-circle" onClick={this.addGroupField} style={{ fontSize: 16, float: 'right', cursor: 'pointer', marginTop: '3px' }} /></div>
          <div style={{ padding: '8px', maxHeight: '157px', overflow: 'auto' }}>
            {
              this.state.expressions.map((exp, index) => {
                return (<div><Select
                  value={exp}
                  placeholder="请选择"
                  style={{ width: 370, float: 'left' }}
                  onSelect={this.handleFieldChange.bind(this, index)}
                >
                  <Option value="">---</Option>
                  {this.renderFields()}
                </Select>
                  <Icon onClick={this.removeGroupField.bind(this, index)} style={{ float: 'right' }} type="minus-circle" />
                </div>);
              })
            }

            {/*
              this.state.index !== -1 && !this.state.hasExpression && <div>明细数据</div>
            */}
          </div>
        </div>
        {(this.state.index !== (this.props.groups.length - 1) && rowMerge) ? (<div style={{ 'boxSizing': 'borderBox', 'paddingLeft': '8px', 'marginTop': '-15px' }}>
          <CheckboxGroup
            style={{ height: '40px', lineHeight: '40px' }}
            options={options}
            onChange={this.handlePosistionChange}
            value={this.state.posistion}
          />
        </div>) : null}
        <div style={{ position: 'absolute', left: '0px', right: '0px', bottom: '8px', textAlign: 'center' }}>
          <Button
            disabled={!changed}
            type="primary"
            onClick={this.handleSubmit}
          >确定</Button>
        </div>
      </div>
    </Modal>);
  }
}
