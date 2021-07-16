import React, { Component } from 'react';
import { Modal, Tree, Input, Select, Checkbox, Button } from '@vadp/ui';
import SplitPane from 'react-split-pane';
import Message from 'public/Message';
import { analysisModel } from 'components/Public/analysisModel';

const confirm = Modal.confirm;
const TreeNode = Tree.TreeNode;
const Option = Select.Option;

const containerStyle = {
  position: 'relative',
  height: '100%',
};
const formItemStyle = {
  margin: '8px',
};
const paneStyle = {
  borderStyle: 'solid',
  borderWidth: '1px',
  borderColor: '#d9d9d9',
  overflow: 'auto',
};
const resizeStyle1 = {
  width: '4px',
  cursor: 'ew-resize',
};
export default class EditGroupModal extends Component {
  constructor(props) {
    super(props);
    this.getFields(props);
    this.state = {
      index: -1,
      name: '',
      hasExpression: false,
      expression: '',
    };
  }
  componentWillReceiveProps(nextProps) {
    this.getFields(nextProps);
  }
  getFields(props) {
    this.fields = analysisModel.getFields(props.dataSource, 'dimension');
  }
  handleNameChanged = (e) => {
    this.setState({ name: e.target.value });
  }
  handHasExpressionChanged = (e) => {
    const hasExpression = e.target.checked;
    const tableModel = this.props.control.model;
    const groups = tableModel.rowGroups;
    let expression = '';
    if (hasExpression) {
      const expressions = groups[this.state.index].expressions;
      if (expressions.length > 0) {
        expression = expressions[0].substr('=Fields.'.length);
      }
    }
    this.setState({ hasExpression, expression });
  }
  handleFieldChange = (value) => {
    const expression = value;
    this.setState({ expression });
  }
  handleGroupChanged = (SelectedKeys, e) => {
    const index = e.node.props.index;
    const tableModel = this.props.control.model;
    const groups = tableModel.rowGroups;
    const group = index > -1 ? groups[index] : null;
    const name = group && group.name;
    const hasExpression = group && group.expressions.length > 0;
    const expression = hasExpression && group.expressions[0].substr('=Fields.'.length);
    this.setState({ index, name, hasExpression, expression });
  }
  handleCancel = () => {
    this.props.onCancel();
  }
  handleDeleteGroup = () => {
    const control = this.props.control;
    const index = this.state.index;
    confirm({
      title: '删除分组',
      content: '是否删除关联组？',
      okText: '确认',
      cancelText: '取消',
      onOk() {
        control.actions.deleteGroup(index);
      },
    });
  }
  handleEditGroup = () => {
    const groupInfo = {
      index: this.state.index,
      name: this.state.name,
      expressions: this.state.hasExpression ? [`=Fields.${this.state.expression}`] : [],
    };
    const control = this.props.control;
    control.actions.editGroup(groupInfo);
  }
  renderFields = () => {
    const options = this.fields.map((item) => {
      return (<Option key={item.aliasName}>
        {item.comments || item.aliasName}
      </Option>);
    });
    return options;
  }
  render() {
    const tableModel = this.props.control.model;
    const groups = tableModel.rowGroups;
    const disabled = this.state.index < 0 || this.state.index >= groups.length;
    let changed = false;
    if (!disabled) {
      const group = groups[this.state.index];
      if (group.name !== this.state.name) {
        changed = true;
      } else if (group.expressions.length > 0 && !this.state.hasExpression) {
        changed = true;
      } else if (group.expressions.length === 0 && this.state.hasExpression) {
        changed = true;
      } else if (group.expressions.length > 0) {
        if (group.expressions[0] !== `=Fields.${this.state.expression}`) {
          changed = true;
        }
      }
    }
    const renderTreeNode = (p) => {
      const name = groups[p].name;
      if (p < groups.length - 1) {
        return (<TreeNode title={name} key={name} index={p} >
          {renderTreeNode(p + 1)}
        </TreeNode>);
      } else {
        return (<TreeNode title={name} key={name} index={p} />);
      }
    };
    return (<Modal
      title={'编辑分组'}
      visible={this.props.visible}
      destroyOnClose
      footer={null}
      width="600px"
      bodyStyle={{ height: 450, overflow: 'auto' }}
      okText="确认"
      cancelText="取消"
      onCancel={this.handleCancel}
      wrapClassName="bi"
    >
      <div style={containerStyle}>
        <SplitPane
          split="vertical"
          defaultSize="35%"
          resizerStyle={resizeStyle1}
          pane1Style={paneStyle}
          pane2Style={paneStyle}
        >
          <Tree
            showLine
            onSelect={this.handleGroupChanged}
          >
            {renderTreeNode(0)}
          </Tree>
          <div>
            <Button
              disabled={this.state.index === -1}
              style={{ margin: '8px' }}
              onClick={this.handleDeleteGroup}
            >删除分组</Button>
            <div style={formItemStyle}><span>名称</span>
              <Input
                disabled={disabled}
                onChange={this.handleNameChanged}
                value={this.state.name}
              />
            </div>
            <div style={formItemStyle}><Checkbox
              disabled={disabled || this.state.index < groups.length - 1}
              onChange={this.handHasExpressionChanged}
              checked={this.state.hasExpression}
            >分组表达式</Checkbox>
              <div style={{ padding: '8px' }}>
                <Select
                  disabled={!this.state.hasExpression}
                  value={this.state.expression}
                  placeholder="请选择"
                  style={{ width: 300 }}
                  onSelect={this.handleFieldChange}
                >
                  {this.renderFields()}
                </Select>
                {
                  this.state.index !== -1 && !this.state.hasExpression && <div>明细数据</div>
                }
              </div>
            </div>
            <div style={{ position: 'absolute', left: '0px', right: '0px', bottom: '8px', textAlign: 'center' }}>
              <Button
                disabled={!changed}
                type="primary"
                onClick={this.handleEditGroup}
              >应用</Button>
            </div>
          </div>
        </SplitPane>
      </div>
    </Modal>);
  }
}
