import React, { Component } from 'react';
import { Modal, Form, InputNumber } from '@vadp/ui';
const FormItem = Form.Item;

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 3 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 21 },
  },
};

export default class BatchCopyModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sourceRow: 1,
      targetRowFrom: 1,
      targetRowTo: 1,
    };
  }

  handleOk = () => {
    const { sourceRow, targetRowFrom, targetRowTo } = this.state;
    this.props.onOk({
      sourceRow: sourceRow - 1,
      targetRowFrom: targetRowFrom - 1,
      targetRowTo: targetRowTo - 1
    });
  }

  handleCancel = () => {
    this.props.onCancel();
  }

  handleSourceRowChange = (value) => {
    this.setState({ sourceRow: parseInt(value) });
  }

  handleTargetRowFromChange = (value) => {
    this.setState({ targetRowFrom: parseInt(value) });
  }

  handleTargetRowToChagne = (value) => {
    this.setState({ targetRowTo: parseInt(value) });
  }

  render() {
    const { sourceRow, targetRowFrom, targetRowTo } = this.state;
    const { rowsCount } = this.props;
    return (
      <Modal
        title='批量复制单元格的值'
        visible={this.props.visible}
        onOk={this.handleOk}
        onCancel={this.handleCancel}
        width={550}
      >
        <div style={{ display: 'inline-block' }}>
          <label>把选中的列从第 </label>
          <label><InputNumber
            min={1}
            max={rowsCount}
            value={sourceRow}
            onChange={this.handleSourceRowChange}
          /></label>
          <label> 行</label>
          <label>复制到</label>
          <label>第 </label>
          <label><InputNumber
            min={1}
            max={rowsCount}
            value={targetRowFrom}
            onChange={this.handleTargetRowFromChange}
          /></label>
          <label> 到 </label>
          <label><InputNumber
            min={1}
            max={rowsCount}
            value={targetRowTo}
            onChange={this.handleTargetRowToChagne}
          /></label>
          <label> 行</label>
        </div>
      </Modal>
    );
  }
}