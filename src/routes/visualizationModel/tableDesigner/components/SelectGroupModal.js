import React, { Component } from 'react';
import { Modal, Radio } from '@vadp/ui';
import Message from 'public/Message';

const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const radioStyle = {
  display: 'block',
  height: '50px',
  lineHeight: '50px',
};
const radioGroupStyle = {
  width: '100%',
};

const isDisabled = (groups, cornerSize, index, type) => {
  let disabled = false;
  const g = groups[index];
  switch (type) {
    case 'col':
      if (index < groups.length - 1) {
        if (groups[index + 1].colPosition !== g.colPosition) {
          disabled = true;
        }
      } else if (g.colPosition < cornerSize.columns) {
        disabled = true;
      }
      break;
    case 'header':
      if (index < groups.length - 1) {
        if (groups[index + 1].startRow !== g.startRow) {
          disabled = true;
        }
      } else {
        disabled = true;
      }
      break;
    case 'footer':
      if (index < groups.length - 1) {
        if (groups[index + 1].endRow !== g.endRow) {
          disabled = true;
        }
      } else {
        disabled = true;
      }
      break;
    default:
      break;
  }
  return disabled;
};

class SelectGroupModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: -1,
    };
  }
  componentWillReceiveProps() {
    this.setState({
      index: -1,
    });
  }
  componentDidMount(){
    this.setState({
      value: 0,
    });
  }
  handleCancel = () => {
    this.props.onCancel();
  }

  handleValueChange = (e) => {
    const newState = { value: e.target.value };
    this.setState(newState);
  }

  handleSubmit = () => {
    if (this.state.value === -1) {
      Message.info('必须选择分组');
      return;
    }

    if (this.props.callBack) {
      this.props.callBack(this.state.value);
    }
  };

  render() {
    const { groups, cornerSize, type } = this.props;
    return (
      <Modal
        title={'选择分组'}
        visible={this.props.visible}
        width="500px"
        okText="确认"
        onOk={this.handleSubmit}
        cancelText="取消"
        onCancel={this.handleCancel}
        wrapClassName="bi"
      >
        <div>
          <RadioGroup
            style={radioGroupStyle}
            onChange={this.handleValueChange}
            value={this.state.value}
          >
            {
              groups.map((g, idx) => {
                const disabled = isDisabled(groups, cornerSize, idx, type);
                return (<RadioButton
                  key={g.name}
                  disabled={disabled}
                  style={radioStyle}
                  value={idx}
                >
                  {`${g.name}`}  {/* (${g.expressions.length > 0 ? g.expressions[0] : ''})  暂时先不展示表达式 */}  
                </RadioButton>);
              })
            }
          </RadioGroup>
        </div>
      </Modal >
    );
  }
}
export default SelectGroupModal;
