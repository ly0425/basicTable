import React, { Component } from 'react';
import { Button, Input, Radio, Form, Modal } from '@vadp/ui';

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 5 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 19 },
  },
};

class ReplaceModal extends Component {
  constructor(props) {
    super(props);
  }
  handleReplaceAll = () => {
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        this.props.onReplaceAll(values);
      }
    });
  }
  handleCancel = () => {
    const { onCancel } = this.props;
    onCancel && onCancel();
  }
  render() {
    const { visible } = this.props;
    const footer = [<Button key="submit" type="primary" onClick={this.handleReplaceAll}>
      批量替换
  </Button>];
    const { getFieldDecorator } = this.props.form;
    return (<Modal
      visible={visible}
      title='替换'
      footer={footer}
      onCancel={this.handleCancel}
    >
      <div style={{ margin: '20px 0 0 0' }}>
        <Form>
          <Form.Item
            {...formItemLayout}
            label='查找内容'
          >
            {getFieldDecorator('search', {
              rules: [{
                required: true, message: '请输入要查找的内容',
              }],
            })(
              <Input />
            )}
          </Form.Item>
          <Form.Item
            {...formItemLayout}
            label='替换为'
          >
            {getFieldDecorator('replacement', {
              rules: [],
            })(
              <Input />
            )}
          </Form.Item>
          <Form.Item
            {...formItemLayout}
            label='范围'
          >
            {getFieldDecorator('range', { initialValue: 'formula' })(
              <Radio.Group>
                <Radio value='formula'>公式</Radio>
                <Radio value='all'>全部</Radio>
              </Radio.Group>
            )}
          </Form.Item>
        </Form>
      </div>
    </Modal>);
  }
}

export default Form.create()(ReplaceModal);