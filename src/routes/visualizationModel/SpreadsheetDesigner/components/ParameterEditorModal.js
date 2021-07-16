import React, { Component } from 'react';
import { Button, Input, Radio, Form, Modal } from '@vadp/ui';

class ParameterEditorModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
        cellList:[]
    }
  }

  handleSubmit = () => {
    if(this.state.cellList.length > 0)
      this.props.handleUpdateParameters(this.state.cellList);
  }
  handleCancel = () => {
    const { onCancel } = this.props;
    onCancel && onCancel();
  }
  render() {
    const { visible } = this.props;
    return (<Modal
      visible={visible}
      title='函数参数编辑'
      onOK={this.handleSubmit}
      onCancel={this.handleCancel}
      width="740px"
    //   height="600px"
      okText="确定"
      cancelText="取消"
      maskClosable={true}
      mask={true}
      destroyOnClose
    >
      <div>
        {
          this.state.cellList.map((item, index) => {
            return (
                // <ul key={index} className={`${style['tab-list']} ${style['table-list']} ${style['can-move']}`}>
                <ul key={index} className={`${style['tab-list']} ${style['table-list']} ${style['can-move']}`}>
                    <li><Radio value={item.key}></Radio></li>
                    <li>{item.positionName}</li>
                    <li><div contentEditable={true} >{item.value}</div></li>
                    <li>
                        <i className="iconfont icon-bianji" onClick={this.editTableList.bind(this, item)}></i>
                        {
                            item.sysFlag === '0' ?
                                <Popconfirm title="确认删除此页签?" onConfirm={this.delTableList.bind(this, index)}>
                                    <i className="iconfont icon-delete"></i>
                                </Popconfirm>
                                :
                                ''
                        }
                    </li>
                </ul>
            )
        })
        }
      </div>
      <div style={{ margin: '20px 0 0 0' }}>
        <Form>
          <Form.Item label='范围' >
          </Form.Item>
        </Form>
      </div>
    </Modal>);
  }
}

export default Form.create()(ParameterEditorModal);