import React, { Component } from 'react';
import { Modal, Radio } from '@vadp/ui';
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;
const containerStyle = {
  position: 'relative',
  height: '95%',
};
const formItemStyle = {
  margin: '8px',
};
const radioStyle = {
  display: 'block',
  height: '30px',
  lineHeight: '30px',
  marginBottom: '8px',
  width: '454px',
  textAlign: 'center',
};

export default class GroupListModal2 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: 0
    }
  }
  handleCancel = () => {
    this.props.onCancel();
  }
  onChange = (e) => {
    this.setState({
      value: e.target.value
    })
  }
  handleSubmit = () => {
    this.props.onOk(this.props.groupRelatedInfo.currentSelectedGroup[this.state.value], this.state.value);
  }
  render() {
    const { groupRelatedInfo } = this.props;
    return (<Modal
      title={'选择分组'}
      visible={this.props.visible}
      destroyOnClose
      width="550px"
      bodyStyle={{ height: 350, overflow: 'auto' }}
      okText="确认"
      cancelText="取消"
      onCancel={this.handleCancel}
      wrapClassName="bi"
      onOk={this.handleSubmit}
    >
      <div style={containerStyle}>
        <div style={{ height: '86%', overflow: 'auto' }}>
          <div style={formItemStyle}>
            <div> 分组选择:</div>
            <div style={{ padding: '8px' }}>
              <RadioGroup onChange={this.onChange} value={this.state.value}>
                {
                  groupRelatedInfo.currentSelectedGroup.map((item, i) => {
                    return (<RadioButton style={radioStyle} value={i}>{item.name}</RadioButton>)
                  })
                }
              </RadioGroup>
            </div>
          </div>

        </div>
      </div>
    </Modal>);
  }
}
