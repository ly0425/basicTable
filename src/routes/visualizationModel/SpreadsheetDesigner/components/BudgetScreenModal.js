
import React, { Component } from 'react'
import { Modal, TreeSelect } from 'vadp-ui';
const { TreeNode } = TreeSelect;
const recursiveStructure = (data) => {
  if (data.length == 0) {
    return [];
  }
  let arrs = data.map(item => item.code);
  if (new Set(arrs).size !== arrs.length) {
    return data.map(row => { return { ...row, key: row.id, title: row.display, value: row.id } })
  }
  const nodeMap = new Map();
  // 将数组项放入Map
  data.forEach((row) => {
    nodeMap.set(row.id, { ...row, key: row.id, title: row.display, value: row.id });
  });
  data.forEach((v, i) => {
    let cList = data.filter((item) => {
      return (item.code.substring(0, v.code.length) == v.code);
    });
    const index = cList.findIndex((item) => {
      return (item.code == v.code)
    });
    cList.splice(index, 1);
    cList = cList.sort((a, b) => { return a.code - b.code });
    cList = cList.filter(item => item.code.length == cList[0].code.length);
    cList.forEach((item) => {
      if (!nodeMap.get(v.id).children) {
        nodeMap.get(v.id).children = [];
      }
      if (nodeMap.get(v.id)) {
        nodeMap.get(v.id).children.push(nodeMap.get(item.id));
      }
    })
  })
  let trees = [];
  nodeMap.forEach(item => trees.push(item));
  trees = trees.sort((a, b) => { return a.code - b.code });
  trees = trees.filter(item => item.code.length == trees[0].code.length);
  return trees;
}
export default class BudgetScreenModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: undefined,
    };
  }
  componentDidMount() {
    const { echoData } = this.props;

    let value = echoData.map(item => item.id);
    this.setState({ value })
  }
  onChange = value => {
    this.setState({ value });
  };
  handleOk = () => {
    const { data } = this.props;
    let values = this.state.value.map(item => {
      return data.filter(v => v.id == item)[0];
    })
    this.props.handleOk(values)
  }
  render() {
    const { data, visible, handleCancel } = this.props;

    return (
      <div className="budgetModalWrapper">
        <Modal
          title="维度筛选"
          width={660}
          visible={visible}
          onOk={this.handleOk}
          onCancel={handleCancel}
          wrapClassName="budgetModalWrapper"
        >
          <TreeSelect
            style={{ width: 300 }}
            // value={this.state.value}
            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
            placeholder="请选择"
            value={this.state.value}
            allowClear
            multiple
            treeData={recursiveStructure(data)}
            onChange={this.onChange}
          >
          </TreeSelect>
        </Modal>
      </div>
    )
  }
}
