import React, { Component } from 'react';
import { Modal } from '@vadp/ui';

// 用 Promise 把模态对话框包装起来
export default class Dialog extends Component {
  static confirm(args) {
    return new Promise((resolve, reject) => {
      Modal.confirm({
        ...args,
        onOk: () => resolve(1),
        onCancel: () => resolve(0),
      });
    });
  }

  _promise;
  _resolve;
  _reject;

  constructor(props) {
    super(props);
    this.state = { visible: false };
  }

  openDialog(args) {
    if (!this._promise) {
      let that = this;
      this._promise = new Promise((resolve, reject) => {
        that._resolve = resolve;
        that._reject = reject;
      });
    }
    this.setState({ visible: true, args });
    return this._promise;
  }

  handleCancel = () => {
    this.close();
    if (this._resolve) {
      this._resolve(0);
    }
  }

  handleOk = (e) => {
    this.close();
    if (this._resolve) {
      this._resolve(e);
    }
  }

  close() {
    this.setState({ visible: false });
    this._promise = null;
  }

  render() {
    if (!this.state.visible) {
      return <div style={{ display: 'none' }}></div>;
    }
    const { component: Com } = this.props;
    const props = { ...this.props };
    return <Com {...props}
      {...this.state.args}
      visible={this.state.visible}
      onCancel={this.handleCancel}
      onOk={this.handleOk}
      destroyOnClose
    />;
  }
}