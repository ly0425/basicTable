import React, { Component } from 'react';
import { Modal, Row, Col, Input, Icon, Button, Select, Tooltip, message, Checkbox } from '@vadp/ui';
import produce from 'immer';
// import Message from 'public/Message';

const Option = Select.Option;

class VariableModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      variableList: [],
    };
  }
  componentDidMount() {
    this.setVariableList(this.props)
  }
  componentWillReceiveProps(nextProps) {
    this.setVariableList(nextProps)
  }
  setVariableList = (props) => {
    this.setState({
      variableList: props.variableList,
    })
  }
  handleCancel = () => {
    this.props.onCancel(false);
  }
  onOk = () => {

    const errList = this.state.variableList.filter(item => !item.isThrough).map((item, i) => { return i + 1 });
    if (errList.length) {
      message.error(`第${errList.join(',')}条变量不符合输入规则！`);
      return;
    }
    if(this.state.variableList.find(item=>!item.name||!item.expression)){
      message.error('请把所有为空的变量填写完整！')
      return;
    }
    const names = this.state.variableList.map(v => v.name);
    const set = new Set();
    for (const name of names) {
      if (set.has(name)) {
        message.error(`分组名称${name}不能重复！`);
        return;
      } else {
        set.add(name);
      }
    }
    this.props.onOk(this.state.variableList);
  }
  addVariable = () => {
    const variableList = produce(this.state.variableList, draft => {
      draft.push({
        name: '',
        expression: '',
        isThrough: true,
        groupName: '全局',
      });
    });
    this.setState({
      variableList,
    });
  }
  updataVariable = (i, key, e) => {
    const variableList = produce(this.state.variableList, draft => {
      draft[i][key] = e.target.value;
      if (key === 'name') {
        if (/[^a-zA-Z\d]/g.test(e.target.value)) {
          draft[i].isThrough = false;
        } else {
          draft[i].isThrough = true;
        }
      }
    });
    this.setState({
      variableList,
    });
  }
  deleteVariable = (i) => {
    let variableList = produce(this.state.variableList, draft => {
      draft.splice(i, 1)
    })
    this.setState({
      variableList,
    })
  }
  groupChange = (i, v) => {
    const variableList = produce(this.state.variableList, draft => {
      draft[i].groupName = v;
    });
    this.setState({
      variableList,
    });
  }
  render() {
    const { variableList } = this.state;
    return (
      <Modal
        title={''}
        visible={this.props.visible}
        width="800px"
        okText="确认"
        onOk={this.onOk}
        cancelText="取消"
        onCancel={this.handleCancel}
        wrapClassName="bi"

      >
        <div>
          <Button type="primary" style={{ borderRadius: '0px' }} onClick={this.addVariable}>新增变量</Button>
          <Row gutter={16} type="flex" justify="space-around" align="middle" style={{ margin: '10px 0px' }}>
            <Col className="gutter-row" span={8}>
              <span style={{ fontWeight: 'bold' }}>名称</span>
            </Col>
            <Col className="gutter-row" span={2} />
            <Col className="gutter-row" span={8}>
              <span style={{ fontWeight: 'bold' }}>表达式</span>
            </Col>
            <Col className="gutter-row" span={4}>
              <span style={{ fontWeight: 'bold' }}>作用范围</span>
            </Col>
          </Row>
          <div style={{maxHeight:'370px',overflow:'auto'}}>
            {
              variableList.map((item, i) => {
                return (<Row gutter={16} type="flex" justify="space-around" align="middle" style={{ margin: '10px 0px' }}>
                  <Col className="gutter-row" span={8}>
                    <Tooltip placement="left" title="变量格式为大小写字母和数字，不可输入特殊字符">
                      <Input placeholder="请输入变量" style={{ borderColor: !item.isThrough && 'red' }} value={item.name} onChange={this.updataVariable.bind(this, i, 'name')} />
                    </Tooltip>
                  </Col>
                  <Col className="gutter-row" style={{ textAlign: 'center' }} span={2}>
                    等于
                </Col>
                  <Col className="gutter-row" span={8}>
                    <Input placeholder="请输入等于得表达式" value={item.expression} onChange={this.updataVariable.bind(this, i, 'expression')} />
                  </Col>
                  <Col className="gutter-row" span={2}>
                    <Select onChange={this.groupChange.bind(this, i)} value={item.groupName}>
                      {
                        this.props.groupNames.map((n) => {
                          return <Option key={n} value={n}>{n}</Option>;
                        })
                      }
                    </Select>
                  </Col>
                  <Col className="gutter-row" span={2}>
                    <Icon type="minus-circle" onClick={this.deleteVariable.bind(this, i)} style={{ fontSize: 16, color: 'red', cursor: 'pointer' }} />
                  </Col>
                </Row>);
              })
            }
          </div>
        </div>
      </Modal>
    );
  }
}
export default VariableModal;
