import React, { Component } from 'react';
import { Modal, Select, Checkbox, Radio } from '@vadp/ui';
import Message from 'public/Message';
import { analysisModel } from 'components/Public/analysisModel';

const Option = Select.Option;
const CheckboxGroup = Checkbox.Group;
const RadioGroup = Radio.Group;

class AddGroupModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: 1,
      expression: '',
      posistion: [],
      rowValue: true,
      isSelected: true,
      newRow: true,
      newRowData: '',
    };
    this.fields = analysisModel.getFields(this.props.dataSource, 'dimension','dimension');
    this.detailData(this.props);
  }
  componentWillReceiveProps(nextProps) {
    this.fields = analysisModel.getFields(nextProps.dataSource, 'dimension','dimension');
    this.setState({
      value: 1,
      expression: '',
      posistion: [],
      rowValue: true,
      isSelected: true,
      newRow: true,
      newRowData:'',
    });
    this.detailData(nextProps);
  }
  handleCancel = () => {
    this.props.onCancel();
  }
  detailData = (props) => {
    if(!props.noDetail){
       this.fields.push({
         aliasName: 'customDetail',
         comments:'详细信息',
       })
    }
  }
  handleValueChange = (e) => {
    const newState = { value: e.target.value };
    if (newState.value === 2) {
      newState.expression = '';
      newState.posistion = [];
    }
    this.setState(newState);
  }
  handleFieldChange = (value) => {
    const expression = value;
    this.setState({ expression });

  }
  handlePosistionChange = (p) => {
    this.setState({ posistion: p });
  }
  handeRowChange = (e) => {
    const posistion = !(e.target.value) ? [] : this.state.posistion;
    this.setState({
      rowValue: e.target.value,
      isSelected: e.target.value,
      posistion
      });
  }
  isNewRow = (e)=> {
    const newRowData = e.target.value ? this.state.newRowData : '';
    this.setState({
      newRow: e.target.value,
      newRowData,
    });
  }
  isNewRowData = (e)=>{
    this.setState({
      newRowData: e.target.value,
    });
  }
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
      rowValue: this.state.rowValue,
      newRowData: this.state.newRowData,
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
    const isGroupiBody = this.state.isSelected && this.props.canRow ? true : false;
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
          {/* (!this.props.noDetail) && <Radio style={radioStyle} value={2} >显示明细数据</Radio>*/}
          </RadioGroup>

          {(this.props.noDetail) && <RadioGroup style={radioStyle} onChange={this.handeRowChange} value={this.state.rowValue}>
            <span style={{'fontSize' : '12px'}}>是否插入分组列</span> &nbsp; &nbsp;
            <Radio  value={true}>是</Radio>
            <Radio  value={false}>否</Radio>
          </RadioGroup>}

          {(!this.props.noDetail) && <RadioGroup style={radioStyle} onChange={this.isNewRow} value={this.state.newRow}>
            <span style={{'fontSize' : '12px'}}>是否添加新行</span> &nbsp; &nbsp;
            <Radio  value={true}>是</Radio>
            <Radio  value={false}>否</Radio>
          </RadioGroup>}
          {
            (this.state.newRow && (!this.props.noDetail)) && <RadioGroup style={radioStyle} value={this.state.newRowData}
            onChange={this.isNewRowData}
            options={[
                { label: '上', value: 'top' },
                { label: '下', value: 'bottom' },
            ]}>
            </RadioGroup>
          }
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
export default AddGroupModal;
