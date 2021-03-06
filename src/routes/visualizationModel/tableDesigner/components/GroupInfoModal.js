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
      Message.info('???????????????????????????');
      return;
    }
    let changed = true;
    const firstIndex = expressions.findIndex(e => e !== '');
    if (this.groupNext && firstIndex < 0) {
      changed = false;
    }
    const name = firstIndex >= 0 ? this.fields.filter(item => item.aliasName === expressions[firstIndex])[0].comments : '????????????';
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
      Message.info('???????????????????????????');
      return;
    }
    const expressions = this.state.expressions.filter(e => e !== '').map(e => `=Fields.${e}`);
    for (const exp of expressions) {
      const i = this.props.groups.findIndex((g, k) => {
        return k !== this.state.index && g.expressions.findIndex(e => e === exp) >= 0;
      });
      if (i >= 0) {
        Message.info(`??????????????????${exp.slice('=Fields.'.length)}?????????????????????`);
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
    // ???????????????????????????????????????????????????????????????
    if (this.groupNext && firstIndex < 0) {
      changed = false;
    }
    const name = firstIndex < 0 ? '????????????' : this.state.name;
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
      { label: '???????????????', value: 'p' },
      { label: '???????????????', value: 'n' },
    ];
    const groups = this.props.groups;
    const rowMerge = (this.props.columns[this.props.selection.left].rowMerge === undefined) ? true : this.props.columns[this.props.selection.left].rowMerge;
    const disabled = this.state.index < 0 || this.state.index >= groups.length;
    const { changed } = this.state;
    return (<Modal
      title={'????????????'}
      visible={this.props.visible}
      destroyOnClose
      footer={null}
      width="500px"
      bodyStyle={{ height: 350, overflow: 'hidden' }}
      okText="??????"
      cancelText="??????"
      onCancel={this.handleCancel}
      wrapClassName="bi"
    >
      <div style={containerStyle}>
        <div style={formItemStyle}>
          <div>??????</div>
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
        >???????????????</Checkbox>*/}
          <div> ???????????????<Icon type="plus-circle" onClick={this.addGroupField} style={{ fontSize: 16, float: 'right', cursor: 'pointer', marginTop: '3px' }} /></div>
          <div style={{ padding: '8px', maxHeight: '157px', overflow: 'auto' }}>
            {
              this.state.expressions.map((exp, index) => {
                return (<div><Select
                  value={exp}
                  placeholder="?????????"
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
              this.state.index !== -1 && !this.state.hasExpression && <div>????????????</div>
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
          >??????</Button>
        </div>
      </div>
    </Modal>);
  }
}
