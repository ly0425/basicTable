import React, { Component } from 'react';
import { Input, Tree, Select, Menu, Row, Col, Modal, Alert, Button, Tooltip, Form } from '@vadp/ui';
import addressConverter from 'xlsx-populate/lib/addressConverter';
const FormItem = Form.Item;

const formItemLayout = {
  labelCol: { span: 5 },
  wrapperCol: { span: 19 },
};

class ImportIndexesDialog extends Component {
  constructor(props) {
    super(props);
    const { getFieldDecorator } = props.form;
  }
  handleOk = () => {
    this.props.form.validateFields({ force: true }, (err, values) => {
      if (!err) {
        const { onOk } = this.props;
        let rowStart = parseInt(values.rowStart);
        let rowEnd = parseInt(values.rowEnd);
        let colStart = parseInt(values.colStart);
        let colEnd = parseInt(values.colEnd);
        onOk({
          ...values,
          rowStart: Math.min(rowStart, rowEnd),
          rowEnd: Math.max(rowStart, rowEnd),
          colStart: Math.min(colStart, colEnd),
          colEnd: Math.max(colStart, colEnd),
        });
      }
    });
  }
  renderRowSelect = (onChange) => {
    const { rowCount } = this.props;
    const options = [];
    for (let i = 0; i < rowCount; i++) {
      options.push(<Select.Option key={i}>{i + 1}</Select.Option>);
    }
    return (<Select onChange={onChange}>{options}</Select>);
  }
  renderColSelect = (onChange) => {
    const { colCount } = this.props;
    const options = [];
    for (let i = 0; i < colCount; i++) {
      const colName = addressConverter.columnNumberToName(i + 1);
      options.push(<Select.Option key={i}>{colName}</Select.Option>);
    }
    return (<Select onChange={onChange}>{options}</Select>);
  }

  handleRowStartChange = (value) => {
    const { getFieldValue, setFieldsValue } = this.props.form;
    if (parseInt(getFieldValue('rowEnd')) < parseInt(value)) setFieldsValue({ 'rowEnd': value });
  }

  handleRowEndChange = (value) => {
    const { getFieldValue, setFieldsValue } = this.props.form;
    if (parseInt(getFieldValue('rowStart')) > parseInt(value)) setFieldsValue({ 'rowStart': value });
  }

  handleColStartChange = (value) => {
    const { getFieldValue, setFieldsValue } = this.props.form;
    if (parseInt(getFieldValue('colEnd')) < parseInt(value)) setFieldsValue({ 'colEnd': value });
  }

  handleColEndChange = (value) => {
    const { getFieldValue, setFieldsValue } = this.props.form;
    if (parseInt(getFieldValue('colStart')) > parseInt(value)) setFieldsValue({ 'colStart': value });
  }

  render() {
    const { visible, onCancel, category } = this.props;
    const { getFieldDecorator } = this.props.form;
    return (
      <Modal
        visible={visible}
        onOk={this.handleOk}
        onCancel={onCancel}
        destroyOnClose
        title='??????????????????'
      >
        <div style={{ marginTop: 10 }}>
          <Form>
            <FormItem
              label='????????????'
              {...formItemLayout}
            >
              {getFieldDecorator('category', {
                initialValue: category,
                rules: [{
                  required: true,
                  whitespace: true,
                  message: "???????????????",
                }, {
                  max: 50,
                  message: '???????????? 50 ??????',
                }],
              })(
                <Input />
              )}
            </FormItem>
            <FormItem
              label='??????????????????'
              {...formItemLayout}
            >
              {getFieldDecorator('rowStart', {
                initialValue: '0',
              })(this.renderRowSelect(this.handleRowStartChange))}
            </FormItem>
            <FormItem
              label='??????????????????'
              {...formItemLayout}
            >
              {getFieldDecorator('rowEnd', {
                initialValue: '0',
              })(this.renderRowSelect(this.handleRowEndChange))}
            </FormItem>
            <FormItem
              label='??????????????????'
              {...formItemLayout}
            >
              {getFieldDecorator('colStart', {
                initialValue: '0',
              })(this.renderColSelect(this.handleColStartChange))}
            </FormItem>
            <FormItem
              label='??????????????????'
              {...formItemLayout}
            >
              {getFieldDecorator('colEnd', {
                initialValue: '0',
              })(this.renderColSelect(this.handleColEndChange))}
            </FormItem>
            <FormItem>
              <div style={{ color: 'gray' }}>????????????????????????????????????1_?????????2..._?????????1_?????????2...</div>
            </FormItem>
          </Form>
        </div>
      </Modal>
    );
  }
}

export default Form.create()(ImportIndexesDialog);