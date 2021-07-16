import React, { Component } from 'react';
import { Input, Tree, Select, Menu, Row, Col, Modal, Alert, Button, Tooltip, Form } from '@vadp/ui';

export default class WorksheetSelectDialog extends Component {
  constructor(props) {
    super(props);
    this.state = { importSheetIndex: 0 };
  }

  handleOk = () => {
    this.setState({ visible: false });
    this.props.onOk(this.state.importSheetIndex);
  }

  render() {
    const { visible, onCancel, workbook } = this.props;
    return (
      <Modal
        visible={visible}
        onOk={this.handleOk}
        onCancel={onCancel}
        destroyOnClose
        title='选择要导入的工作表'
      >
        <Select showSearch optionFilterProp='children' defaultValue={0} style={{ width: '100%' }}
          onChange={v => this.setState({ importSheetIndex: v })}
        >
          {workbook && workbook.sheets().map((s, i) => <Option key={i} value={i}>{s.name()}</Option>)}
        </Select>
      </Modal>
    );
  }
}