import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Modal } from '@vadp/ui';
import FunctionIndex from 'public/Index/FunctionIndex';

export default class FunctionModal extends Component {
  constructor(props) {
    super(props);
    const { defaultText } = props;
    this.state = { text: defaultText };
  }
  handleTextChanged = (text) => {
    this.setState({ text });
  };
  handleOk = () => {
    const { onOk } = this.props;
    onOk(this.state.text);
  };
  handleCancel = () => {
    const { onCancel } = this.props;
    onCancel();
  };
  renderContent() {
    return (
      <FunctionIndex
        text={this.state.text}
        onTextChanged={this.handleTextChanged}
        pageParams={this.props.pageParams}
        expandRowFields={this.props.expandRowFields}
        validate={this.props.validate}
      />
    );
  }
  render() {
    const { visible, title } = this.props;
    return (<Modal
      visible={visible}
      title={title || '导入函数'}
      onOk={this.handleOk}
      onCancel={this.handleCancel}
      width={1200}
      maskClosable={false}
      wrapClassName="oes-function-modal bi"
    >
      {this.renderContent()}
    </Modal>);
  }
}

FunctionModal.propTypes = {
  visible: PropTypes.bool, // 是否可见
  defaultText: PropTypes.string, // 默认文本
  title: PropTypes.string, // 标题
  onOk: PropTypes.func, // 点击确定
  onCancel: PropTypes.func, // 点击取消
};
