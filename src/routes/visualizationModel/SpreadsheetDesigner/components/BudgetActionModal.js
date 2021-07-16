import React, { Component } from 'react';
import { Icon, Select, Cascader, Form, Button, Modal, Table, Tooltip, Collapse, InputNumber, Input, Checkbox, Radio } from '@vadp/ui';
import { getBudgTrialBalanceTemplate } from '../BudgetApi';
const FormItem = Form.Item;
const Option = Select.Option;

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

export default class BudgetActionModal extends Component {
  constructor(props) {
    super(props);
    const { value } = props;
    this.state = { value };
  }

  componentDidMount() {
    console.log('BudgetActionModal componentDidMount');
    this.load();
  }

  async load() {
    const { datas } = await getBudgTrialBalanceTemplate(this.props.pageParams.acctYear);
    this.setState({ datas });
  }

  handleChange = (value) => {
    this.setState({ value });
  }

  handleOk = () => {
    const item = this.state.datas.find(x => x.template_id === this.state.value);
    this.props.onOk(item);
  }

  render() {
    const { datas } = this.state;
    return (
      <Modal
        title='动作'
        visible={this.props.visible}
        width="700px"
        onOk={this.handleOk}
        onCancel={this.props.onCancel}
        okText="确定"
        cancelText="取消"
        wrapClassName="bi"
      >
        <div style={{ marginBottom: 12 }}>
          <FormItem label="目标报表" {...formItemLayout} >
            <Select style={{ width: '100%' }} value={this.state.value} onChange={this.handleChange}>
              {datas && datas.map(item => <Option value={item.template_id}>{item.template_name}</Option>)}
            </Select>
          </FormItem>
        </div>
      </Modal>
    );
  }
}