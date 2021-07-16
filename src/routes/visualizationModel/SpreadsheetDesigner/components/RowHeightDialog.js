import React, { Component } from 'react';
import { Input, Tree, Select, Menu, Row, Col, Modal, Alert, Button, Tooltip, Form, InputNumber } from '@vadp/ui';
import addressConverter from 'xlsx-populate/lib/addressConverter';
const FormItem = Form.Item;

const formItemLayout = {
  labelCol: { span: 5 },
  wrapperCol: { span: 19 },
};

class RowHeightDialog extends Component {
  constructor(props) {
    super(props);
    const { getFieldDecorator } = props.form;
  }
  handleOk = () => {
    this.props.form.validateFields({ force: true }, (err, values) => {
      if (!err) {
        const { onOk } = this.props;
        let rowHeight = parseInt(values.number);
        onOk(rowHeight);
      }
    });
  }

  render() {
    const { visible, onCancel, title, number } = this.props;
    const { getFieldDecorator } = this.props.form;
    return (
      <Modal
        visible={visible}
        onOk={this.handleOk}
        onCancel={onCancel}
        destroyOnClose
        title={title}
      >
        <div style={{ margin: 0 }}>
          <Form>
            <FormItem
              label={title}
              {...formItemLayout}
            >
              {getFieldDecorator('number', {
                initialValue: number,
                rules: [{
                  required: true,
                  message: "请输入数值",
                }],
              })(
                <InputNumber size='small' min={5} max={1000} />
              )}
            </FormItem>
          </Form>
        </div>
      </Modal>
    );
  }
}

export default Form.create()(RowHeightDialog);