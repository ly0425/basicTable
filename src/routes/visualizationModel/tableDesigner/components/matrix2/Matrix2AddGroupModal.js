import React, { Component } from 'react';
import { Modal, Select, Checkbox, Radio } from '@vadp/ui';
import Message from 'public/Message';
import { analysisModel } from 'components/Public/analysisModel';

const Option = Select.Option;
const CheckboxGroup = Checkbox.Group;
const RadioGroup = Radio.Group;

class Matrix2AddGroupModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: 1,
      posistion: [],
      expression:''
    };
    this.fields = analysisModel.getFields(this.props.dataSource, 'dimension','dimension');
  }
  componentWillReceiveProps(nextProps) {
    this.fields = analysisModel.getFields(nextProps.dataSource, 'dimension','dimension');
    this.setState({
      value: 1,
      posistion: [],
      expression:''
    });
  }
  handleCancel = () => {
    this.props.onCancel();
  }
  // handleValueChange = (e) => {
 
  // }
  handleFieldChange = (value) => {
    const expression = value;
    this.setState({ expression });
  }
  handlePosistionChange = (p) => {
   this.setState({ posistion: p });   
  }
  // handeRowChange = (e) => {

  // }
  // isNewRow = (e)=> {

  // }
  // isNewRowData = (e)=>{

  // }
  handleSubmit = () => {
    if (this.state.value === 1 && this.state.expression === '') {
      Message.info('必须选择分组字段');
      return;
    }
    const field = this.fields.find(f => f.aliasName === this.state.expression);

    const group = this.state.value === 1 ? {
      expression: (this.state.expression === 'customDetail') ? '' : this.state.expression,
      posistion: (this.state.expression === 'customDetail') ? [] : this.state.posistion,
      title: field.comments || field.aliasName,
      // rowValue: this.state.rowValue,
      // newRowData: this.state.newRowData,
    } : {
        posistion: [],
      };
    this.props.onOk(group);
  };
  filterOption = (input, option) => {
    return option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
  }
  renderFields = () => {
    // 查询下拉内容
    const options = this.fields.map((item) => {
      return (<Option key={item.aliasName}>
        {item.comments || item.aliasName}
      </Option>);
    });
    return options;
  }

  render() {
    const options = [
      { label: '添加头部', value: 'p' },
      { label: '添加尾部', value: 'n' },
    ];
    const radioStyle = {
      display: 'block',
      height: '50px',
      lineHeight: '50px',
    };
    return (
      <Modal
        title={'添加分组'}
        visible={this.props.visible}
        width="500px"
        okText="确认"
        onOk={this.handleSubmit}
        cancelText="取消"
        onCancel={this.handleCancel}
        wrapClassName="bi"
      >
        <div>
          <RadioGroup onChange={this.handleValueChange} value={this.state.value}>
            <Radio style={radioStyle} value={1}>
              分组字段
              <Select
                showSearch
                value={this.state.expression}
                style={{ marginLeft: '50px', width: 300 }}
                placeholder="请选择"
                onSelect={this.handleFieldChange}
                filterOption={this.filterOption}
              >
                {this.renderFields()}
              </Select>
            </Radio>
          </RadioGroup>

          <div>
             {this.props.canRow && <CheckboxGroup
              disabled={!this.props.canRow}
              style={{ height: '40px', lineHeight: '40px' }}
              options={options}
              onChange={this.handlePosistionChange}
              value={this.state.posistion}
            />}
          </div>
        </div>
      </Modal >
    );
  }
}
export default Matrix2AddGroupModal;
