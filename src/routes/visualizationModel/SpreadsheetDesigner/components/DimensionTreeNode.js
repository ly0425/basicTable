/**
 * 维度树节点
 */

import React from 'react';
import { message, Tooltip, Checkbox, Tree } from '@vadp/ui';
import Node from './DimensionTreeNode';
import '../../../../style/pages/Dimentsion.less'
import { findDimNode } from '../BudgetUtils';
import { shortcutToolbarSignal } from 'public/ShortcutToolbar/signal';
const { TreeNode } = Tree;
function pauseEvent(e) {
  if (e.stopPropagation) e.stopPropagation();
  if (e.preventDefault) e.preventDefault();
  e.cancelBubble = true;
  e.returnValue = false;
  return false;
}
function setTreeLevel(list = [], level = 0) {
  for (let item of list) {
    item.level = level;
    if (item.children.length) {
      setTreeLevel(item.children, level + 1);
    }
  }
}


function createBudgetDimensionTree(list = []) {
  let nodeMap = new Map();
  let rootIds = [];
  if (!list[0] || !list[0].super_code) {
    return [];
  }

  for (let item of list) {
    if (item.super_code == '-1') {
      rootIds.push(item.code)
    }

    let dimNode = findDimNode(item)

    nodeMap.set(item.code, {
      ...item,
      children: [],
      code: item.code,
      super_code: item.super_code,
      dragType: 'budgetDimensionTree',
      direction: 'row',
      dimension: { id: dimNode.id, dataKey: dimNode.dataKey, dimDisplay: dimNode.name },
      id: item.id,
      display: item.name,
      level: item.level
    });
  }
  list.forEach((item) => {
    if (nodeMap.has(item.super_code)) {
      let currentNode = nodeMap.get(item.super_code);
      currentNode.children.push(nodeMap.get(item.code));
    }
  })
  rootIds = rootIds.map(item => {
    return nodeMap.get(item);
  })
  setTreeLevel(rootIds)
  return rootIds;
}




class DimensionTreeNode extends React.PureComponent {
  constructor(props) {
    super();
    this.state = {
      expand: false,
      showAll: false, // 是否显示全部
    }
    this.budgettreesignal = shortcutToolbarSignal.getByControlID('budgettree');
  }
  componentDidMount() {
    this.budgettreesignal.action.add(this.update_budget_tree_status);

  }
  componentWillUnmount() {
    this.budgettreesignal.action.remove(this.update_budget_tree_status);
    this.budgettreesignal.action.dispatch({ type: 'isDisabled', isDisabled: false });
    localStorage.removeItem('budgetTreeDragData');
  }
  renderTreeNodes = (childs) => {
    return (childs.map(item => {
      if (item.children.length) {

        return (
          <TreeNode title={item.name} key={item.code} dataRef={item}>
            {this.renderTreeNodes(item.children)}
          </TreeNode>
        );
      }
      return <TreeNode title={item.name} key={item.code} dataRef={item} />;
    }));
  }
  update_budget_tree_status = ({ istreeshow, type }) => {
    if (type === 'istreeshow') {
      this.setState({
        istreeshow
      })
    }
  }
  renderChild = () => {
    const { nodeInfo } = this.props;
    if (nodeInfo && nodeInfo.child) {
      const childs = createBudgetDimensionTree(nodeInfo.child, nodeInfo);
      if (nodeInfo.direction == 'row' && childs.length) {
        this.budgettreesignal.action.dispatch({ type: 'isDisabled', isDisabled: true });
        if (this.state.istreeshow) {
          return (<Tree
            onDragStart={this.onTreeDragStart}
            onDragOver={({ event, node }) => {
              pauseEvent(event)
            }}
            draggable
            onSelect={(selectedKeys, e) => {
              const { dataRef } = e.node.props;
              const { children, ...arg } = dataRef;
              this.props.selectNode({}, arg)
            }}
          >
            {this.renderTreeNodes(childs)}
          </Tree>)
        }

      }

      return nodeInfo.child.map(child => {
        return <Node
          key={child.uid}
          nodeInfo={child}
          selectNode={this.props.selectNode}
          selectedParent={this.props.selectedParent}
          selectedNodes={this.props.selectedNodes}
          expandNode={this.props.expandNode}
          restSelectNodes={this.props.restSelectNodes}
        />
      })
    }
  }
  onTreeDragStart = ({ event, node }) => {
    event.stopPropagation();
    const {
      props: {
        dataRef
      }
    } = node;
    let obj = {
      children: dataRef.children,
      code: dataRef.code,
      super_code: dataRef.super_code,
      dragType: 'budgetDimensionTree',
      direction: 'row',
      dimension: dataRef.dimension,
      id: dataRef.id,
      display: dataRef.display,
      level: dataRef.level
    }

    localStorage.setItem('budgetTreeDragData', JSON.stringify(obj));
    // event.dataTransfer.setData('text', JSON.stringify(dataRef))
    this.props.restSelectNodes();
  }
  // 预算指标是否加载根节点
  checked = (e) => {
    e.stopPropagation();
    this.setState({
      showAll: e.target.checked
    })
  }

  /**
  * 展开关闭当前节点（只有非叶子节点可展开关闭）
  */
  expand = (e) => {
    e.stopPropagation();
    const { showAll } = this.state;
    const { nodeInfo } = this.props;
    if (!nodeInfo.isLeaf) {
      this.props.expandNode(nodeInfo, showAll);
    }
  }

  /**
   * 选中节点
   * 1.选中单个叶子节点
   * 2.多选叶子节点时，需满足当前选中的叶子节点与已选中的叶子节点处于同一父节点下
   * 3.可选中维度节点或度量根节点
   */
  onSelect = (e) => {
    e.stopPropagation();
    const { nodeInfo, selectedNodes } = this.props;
    if ((!nodeInfo.isLeaf && nodeInfo.level !== 0) || nodeInfo.name === '度量') { // 维度可选中，度量根节点可选中
      this.props.selectNode(e, nodeInfo);
    } else if (nodeInfo.isLeaf) {
      // 判断当前选中节点是否与选中节点属于同一类别
      const allDimension = selectedNodes.every(i => i.type === 'budgetDimension');
      const allMesure = selectedNodes.every(i => i.type === 'budgetMeasure');
      if (selectedNodes.length === 0) {
        this.props.selectNode(e, nodeInfo);
      } else if (
        (
          allDimension && nodeInfo.type === 'budgetDimension'
          && selectedNodes[0].parentNode && selectedNodes[0].parentNode.uid === nodeInfo.parentNode.uid
        )
        || (allMesure && nodeInfo.type === 'budgetMeasure')
      ) {
        this.props.selectNode(e, nodeInfo);
      } else {
        this.props.selectNode(e, nodeInfo, true);
        // message.warn('只允许多选同一类别内容')
      }
    }
  }

  /**
   * 根据当前节点类型，绑定拖拽内容
   * 1.可单选或多选拖入叶子节点；
   * 2.可拖入维度节点，则绑定维度+维度下所有成员
   * 提交数据格式：{
      dragType: 'budgetMeasure' | 'budgetDimension',
      measures?: Measure[],
      dimension?: Dimension,
      dimensionValues?: DimensionValue[],
      };
   */
  onDragStart = (e) => {
    e.stopPropagation();
    const { nodeInfo, selectedNodes } = this.props;

    let dragInfo;
    let array = [];
    if (!nodeInfo.isLeaf) { // 此时拖拽为根节点，不是叶子节点，讲当前所有叶子结点存起来
      array = nodeInfo.childCopy.map(c => ({
        id: c.id,
        code: c.code,
        display: c.name,
      }))
      let dimNode = nodeInfo;
      // 带有 detailType 的是预算指标分类节点，需要再往上找一级
      if (dimNode.detailType) {
        dimNode = dimNode.parentNode;
      }
      dragInfo = {
        dragType: 'budgetDimension',
        dimension: {
          id: dimNode.id,
          dataKey: dimNode.dataKey,
          dimDisplay: dimNode.name,
        },
        dimensionValues: array,
        direction: nodeInfo.direction
      }
    } else {
      if (nodeInfo.type === 'budgetMeasure') {
        array = [
          {
            id: nodeInfo.id,
            expandDisplay: nodeInfo.name,
            editType: nodeInfo.editType,
          }
        ];
        if (selectedNodes && selectedNodes.length > 0) {
          array = selectedNodes.map(item => (
            {
              id: item.id,
              expandDisplay: item.name,
              editType: item.editType,
            }
          ))
        }
        dragInfo = {
          dragType: 'budgetMeasure',
          measures: array
        }
      } else {
        array = [
          {
            id: nodeInfo.id,
            code: nodeInfo.code,
            display: nodeInfo.name,
          }
        ];
        if (selectedNodes && selectedNodes.length > 0) {
          array = selectedNodes.map(item => (
            {
              id: item.id,
              code: item.code,
              display: item.name,
            }
          ))
        }
        // 维度节点
        const dimNode = findDimNode(nodeInfo);
        dragInfo = {
          dragType: 'budgetDimension',
          dimension: {
            id: dimNode.id,
            dataKey: dimNode.dataKey,
            dimDisplay: dimNode.name,
          },
          dimensionValues: array,
          direction: nodeInfo.direction
        }
      }
    }
    e.dataTransfer.setData('text', JSON.stringify(dragInfo))
    this.props.restSelectNodes();
  }

  onDragOver = (e) => {
    e.preventDefault();
  }

  render() {
    const { onDragStart, nodeInfo, selectedNodes, selectedParent } = this.props;
    const { expand } = this.state;
    const nodeStyle = nodeInfo.expand ? 'dimension-tree-node-expand' : 'dimension-tree-node-close'
    let nodeContentStyle;
    if (!nodeInfo.isLeaf) { // 非叶子节点判断是否被选中
      nodeContentStyle = selectedParent && selectedParent.uid === nodeInfo.uid ? 'dimension-tree-node-parent-selected' : 'dimension-tree-node-parent-normal';
    } else {
      nodeContentStyle = selectedNodes.find(i => i.uid === nodeInfo.uid) ? 'dimension-tree-node-selected' : 'dimension-tree-node-normal'
    }

    return (<div
      id={nodeInfo.uid}
      style={{ width: '100%', paddingLeft: `${nodeInfo.level * 12}px` }}
    >
      <div className={'dimension-tree-node'}
        draggable={nodeInfo.level !== 0 && (nodeInfo.isLeaf || (!nodeInfo.isLeaf && nodeInfo.child && nodeInfo.child.length > 0))}
        onDragStart={this.onDragStart}
        onDragOver={this.onDragOver}
      >
        {!nodeInfo.isLeaf
          && <div className={'dimension-tree-node-icon'} onClick={this.expand}>
            <span
              className={nodeStyle}
            />
          </div>}
        <span
          onClick={this.onSelect}
          className={nodeContentStyle}
          style={{ paddingLeft: nodeInfo.isLeaf ? '0px' : '0px' }}
        >
          <Tooltip placement="right" title={nodeInfo.code ? `${nodeInfo.name}（${nodeInfo.code}）` : nodeInfo.name}>
            {nodeInfo.name}
          </Tooltip>
        </span>
        {/* {nodeInfo.name === '预算指标' && !nodeInfo.isLeaf && <span style={{ paddingLeft: '2px', verticalAlign: '1px' }}>
        <Checkbox value={this.state.showAll} onChange={this.checked} />
        只展开末级节点
      </span>} */}
      </div>
      {nodeInfo.expand && this.renderChild()}
    </div>)
  }
}

export default DimensionTreeNode;
