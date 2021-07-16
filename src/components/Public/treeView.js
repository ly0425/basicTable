import React, { Component } from 'react';
import { Table, Tree } from '@vadp/ui';
import { LoadModelList } from '../../actions/modelManagerAction.js';

const TreeNode = Tree.TreeNode;

class TreeView extends Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
  }
  onSelect = (selectedKeys, info) => {
    // this.props.dispatch(LoadModelList({ selectedKey: selectedKeys, value: "", urlType: this.props.directType }));
    //用selectedKeys点击两次后selectedKeys就消失，模型数据就不会再加载；info.node.props.eventKey一直存在
    this.props.dispatch(LoadModelList({ selectedKey: [info.node.props.eventKey], value: "", urlType: this.props.directType }));
    // －－－调用子组件modelist，当点击转换树时候，用来清空搜索框值－－－－
    this.props.emptySelectedRightInputValue()
  }
  render() {
    const loop = data => data.map((item) => {
      if (item.children && item.children.length > 0) {
        return (
          <TreeNode key={item.key} title={item.title} desc={item.desc}>
            {loop(item.children)}
          </TreeNode>
        );
      }
      let _title=item.title;
      if(item.num || item.num==0){
        _title=_title+" ("+item.num+")"
      }
      return <TreeNode key={item.key} title={_title} desc={item.desc} />;
    });

    let noDataElement = this.props.treeNodes;
    let element =
      this.props.treeNodes.length==undefined ?
        {noDataElement} :
        <Tree showLine  defaultExpandedKeys={this.props.selectedKeys} selectedKeys={this.props.selectedKeys} onSelect={this.onSelect}>
          {loop(this.props.treeNodes)}
        </Tree>
       
    return (
      <div className="bi-tree bi-left-part" style={{height : `calc(100vh - ${window.BI_APP_CONFIG.headHeight} - 105px)`}}>
        {element}
      </div>
    )
  }
}
export default TreeView
