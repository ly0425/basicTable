import React, { Component } from 'react';
import { Modal, Tree, Icon } from '@vadp/ui';
import lodash from 'lodash';

const { TreeNode } = Tree;

export default class AllModelsModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      models: []
    }
  }
  componentWillReceiveProps(nextProps) {
    const { models } = nextProps;
    this.setState({ models })
  }
  treeCheck = (data) =>{
    console.log(data)
  }
  renderModelsTree = (data) => {
    return data.map(item => {
      if (item.children.length) {
        return (
          <TreeNode title={item.title} key={item.key}>
            {this.renderModelsTree(item.children)}
          </TreeNode>
        );
      }
      return <TreeNode key={item.key} title={item.title} />;
    });

  }
  render() {
    return (<Modal
      visible={this.props.show}
      title="查看数据集"
      // onOk={this.handleOk}
      // onCancel={this.handleCancel}
      width={600}
      destroyOnClose={true}
    >
      <Tree
        checkable
        showLine
        defaultExpandAll
        onCheck={this.treeCheck}
      >
        {this.renderModelsTree(this.state.models)}
      </Tree>

    </Modal>);
  }
}