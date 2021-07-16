/**
 * 维度列表
 * 
 */

import React from 'react';
import { connect } from 'react-redux';
import { message, Input, Tooltip } from '@vadp/ui';
import { fetchDimensionList, fetchMeasureList, fetchDimensionValues } from '../BudgetApi';
import DimensionTreeNode from './DimensionTreeNode';
import lodash from 'lodash';

let searchTimer = null;
const maxListLength = 500;

class Dimension extends React.PureComponent {

  constructor(props) {
    super();
    this.state = {
      selectedParent: undefined, // 选中的父节点
      selectedNode: [], // 多选的子节点
      root: [],
      loading: true
    }

  }

  componentDidMount() {
    const res = this.loadRootInfo();
    res.then(data => {
      this.setState({
        root: data,
        loading: false
      })
    })
      .catch(e => {
        console.log(e, 'error')
        this.setState({
          loading: false
        })
      })
    window.addEventListener('click', this.handleClick)
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.handleClick)
  }

  handleClick = (e) => {
    this.setState({
      selectedNode: []
    });
    // this.props.dispatch({
    //   type: 'Spreadsheet/resetSelectedNode'
    // })
  }

  loadRootInfo = async () => {
    try {
      const { pageParams } = this.props;
      const dimensionList = await fetchDimensionList(pageParams.modelId);
      const measureList = await fetchMeasureList(pageParams.modelId);
      const measure = measureList.map(item => {
        return {
          id: item.id,
          name: item.expandDisplay,
          isLeaf: true,
          type: 'budgetMeasure',
          uid: item.id,
          editType: item.editType,
          level: 1,
        }
      });
      const dimensionRow = [];
      const dimensionColumn = [];
      const page = [];
      dimensionList.forEach(item => {
        // 行/列维度不包括“预算年度”、“版本“
        if (item.id !== 'ACCT_YEAR' && item.id !== 'BUDG_VERSION') {
          dimensionRow.push({
            id: item.id,
            name: item.dimDisplay,
            dataKey: item.dataKey,
            isLeaf: false,
            expand: false,
            level: 1,
            type: 'budgetDimension',
            direction: 'row',
            uid: `${item.id}-row`,
          })
          dimensionColumn.push({
            id: item.id,
            name: item.dimDisplay,
            dataKey: item.dataKey,
            isLeaf: false,
            expand: false,
            level: 1,
            type: 'budgetDimension',
            direction: 'column',
            uid: `${item.id}-column`,
          })
        } else {
          page.push({
            id: item.id,
            name: item.dimDisplay,
            dataKey: item.dataKey,
            isLeaf: false,
            expand: false,
            level: 1,
            type: 'budgetDimension',
            direction: 'page',
            uid: `${item.id}-page`,
          })
        }
      })

      let res = [];

      // 隐藏页面维度

      // if (page) {
      //   page.push({
      //     id: 'DEPT_ID',
      //     name: '预算科室',
      //     dataKey: 'V_BUDG_DEPT_BUSI',
      //     isLeaf: false,
      //     expand: false,
      //     level: 1,
      //     type: 'budgetDimension',
      //     direction: 'page',
      //     uid: 'DEPT_ID-page',
      //   });
      //   const pageDimension = [
      //     {
      //       id: 'dimension-page',
      //       uid: 'dimension-page',
      //       name: '页面维度',
      //       child: page,
      //       isLeaf: false,
      //       expand: false,
      //       level: 0,
      //       direction: 'page'
      //     }
      //   ];
      //   res = res.concat(pageDimension)
      // }

      if (dimensionRow) {
        const dimensionRoot = [
          {
            id: 'dimension-row',
            uid: 'dimension-row',
            name: '行维度',
            child: dimensionRow,
            isLeaf: false,
            expand: false,
            level: 0,
            direction: 'row'
          }
        ]
        res = res.concat(dimensionRoot);

      }
      if (dimensionColumn) {
        const dimensionColumnRoot = [
          {
            id: 'dimension-column',
            uid: 'dimension-column',
            name: '列维度',
            child: dimensionColumn,
            isLeaf: false,
            expand: false,
            level: 0,
            direction: 'column'
          }
        ]
        res = res.concat(dimensionColumnRoot);
      }

      if (measure) {
        const measureRoot = [
          {
            id: 'measure',
            uid: 'measure',
            name: '度量',
            child: measure,
            type: 'budgetMeasure',
            isLeaf: false,
            expand: false,
            level: 0
          }
        ]
        res = res.concat(measureRoot)
      }
      return res;
    } catch (e) {
      console.log('e', e)
      return [];
    }
  }

  /**
   * 渲染列表
   */
  renderList = () => {
    const { root, selectedParent, selectedNode } = this.state;
    return root.map(node => {
      return <DimensionTreeNode
        key={node.uid}
        nodeInfo={node}
        expandNode={this.expandNode}
        selectNode={this.selectNode}
        selectedParent={selectedParent}
        selectedNodes={selectedNode}
        restSelectNodes={this.restSelectNodes}
      />
    })
  }

  /**
   * 展开节点
   */
  expandNode = async (node, isLast) => {
    const { root } = this.state;
    const newRoot = root.slice()
    const dummyRoot = {
      id: 'root',
      child: newRoot
    }
    let matchNode = this.findNode(dummyRoot, node.uid);
    let matchNodeCopy = this.findNode(dummyRoot, node.uid);
    if ((node && !node.child) || (node.name === '预算指标' && !node.expand)) {
      if (node.dataKey) {
        const children = await fetchDimensionValues(
          node.dataKey,
          { ...this.props.pageParams, isLast: isLast ? 1 : 0 },
          node.detailType,
        )
        // const children = await fetchDimensionValues(node.dataKey, this.props.pageParams)
        if (children && children.length === 0) {
          message.warn('当前维度下无成员!')
        }
        const child = children.map(i => {
          const childNode = {
            id: i.id,
            name: i.display,
            code: i.code,
            parentNode: node,
            isLeaf: !!i.leaf,
            dataKey: i.dataKey,
            type: 'budgetDimension',
            uid: `${i.id}-${node.id}-${node.direction}`,
            direction: node.direction,
            level: 1,
            super_code: i.super_code
          };
          if (node.name === '预算指标') {
            // 指标指标下面分类的 id
            childNode.detailType = i.id;
          }
          return childNode;
        });

        const childCopy = lodash.cloneDeep(child);
        child.splice(maxListLength, child.length - maxListLength);

        matchNode = Object.assign({}, matchNode, {
          child,
          childCopy
        });

        matchNodeCopy = Object.assign({}, matchNode, {
          child: childCopy
        });

        const { selectedDimension } = this.props;
        // 选中的根节点与当前展开节点相同时，则将当前成员变量存进去
        if (selectedDimension && selectedDimension[0].uid === node.uid) {
          const childMap = new Map();
          child.forEach(c => {
            childMap.set(c.name, c)
          })
          this.props.dispatch({
            type: 'Spreadsheet/selectedNode',
            node: [
              node,
              childMap
            ]
          })
        }
      }
    }

    matchNode = Object.assign({}, matchNode, {
      expand: !node.expand,
    });

    matchNodeCopy = Object.assign({}, matchNodeCopy, {
      expand: !node.expand,
    })

    const updateRoot = this.updateNode(JSON.parse(JSON.stringify(dummyRoot)), matchNode);
    const updateRootCopy = this.updateNode(JSON.parse(JSON.stringify(dummyRoot)), matchNodeCopy);
    this.setState({
      root: updateRoot.child,
      copyData: updateRootCopy.child
    })

  }

  /**
   * 选中节点
   * seleteOtherNode： 是否选中其他根节点数据标示
   * node： 选中节点内容
   */
  selectNode = (e, node, seleteOtherNode) => {
    const { selectedNode } = this.state;
    if (seleteOtherNode) {
      this.setState({
        selectedNode: [node]
      });
      return false;
    }
    let array = selectedNode.slice();
    if (!node.isLeaf) { // 非根节点，并且非叶子节点, 认为选中维度
      const childMap = new Map(); // 以孩子节点名称为key， 存放当前孩子节点内容
      if (node.child) {
        const tempChild = node.childCopy ? node.childCopy : node.child
        tempChild.forEach(child => {
          childMap.set(child.name, child)
        });
      }
      this.setState({
        selectedParent: node
      }, () => {
        // 选中当前维度根节点，点击“匹配”按钮时，将表格中内容与当前维度下成员进行匹配比对
        this.props.dispatch({
          type: 'Spreadsheet/selectedNode',
          node: [
            node,
            childMap
          ]
        })
      })
    } else {
      const matchIndex = array.findIndex(i => i.id === node.id);
      if (e.shiftKey) { // shift 按键多选
        const dummyRoot = {
          id: 'root',
          child: this.state.root
        }
        const parent = this.findParentNode(dummyRoot, node);
        if (parent) {
          const firstIndex = parent.child.findIndex(i => i.id === this.lastSelectNode.id);
          const lastIndex = parent.child.findIndex(i => i.id === node.id);
          const min = Math.min(firstIndex, lastIndex); // 找出最大最小位置
          const max = Math.max(firstIndex, lastIndex)
          if (firstIndex > -1 && lastIndex > -1) {
            const selected = parent.child.slice(min, max + 1);
            array = selected
            this.setState({
              selectedNode: array
            })
            // 记录当前选中节点，点击“绑定”按钮时，将当前维度信息绑定到选中的单元格上
            this.props.dispatch({
              type: 'Spreadsheet/selectSingleLeafNode',
              node: array
            })
          }
        }
      } else {
        if (matchIndex === -1) {
          array.push(node);
          this.props.dispatch({
            type: 'Spreadsheet/selectSingleLeafNode',
            node: array
          })
        } else {
          array = array.slice(0, matchIndex).concat(array.slice(matchIndex + 1))
        }
        this.setState({
          selectedNode: array
        })
      }
      if (matchIndex === -1) {
        this.lastSelectNode = node; // 记录上次选中节点
      }
    }



  }

  /**
   * 取消选中所有得节点
   */
  restSelectNodes = () => {
    this.setState({
      selectedNode: []
    })
  }

  /**
   * 根据id查找对应节点
   */
  findNode = (root, id) => {
    if (root.uid === id) {
      return root
    }
    if (root.child) {
      for (let i = 0, l = root.child.length; i < l; i++) {
        const node = this.findNode(root.child[i], id);
        if (node) {
          return node
        }
      }
    }
    return null
  }

  /**
   * 更新id=XXX得节点内容
   */
  updateNode = (root, node) => {
    const res = root;
    if (res.uid === node.uid) {
      return node;
    }
    if (res.child) {
      for (let i = 0, l = res.child.length; i < l; i++) {
        res.child[i] = this.updateNode(res.child[i], node)
      }
    }
    return res;
  }

  /**
   * 查找当前childNode对应的父节点
   * 默认不会选中根节点，只会选中叶子节点
   */
  findParentNode = (root, childNode, parent = null) => {
    if (!root) {
      return undefined;
    }
    if (root.uid === childNode.uid) {
      return parent
    }
    if (root.child) {
      for (let i = 0, l = root.child.length; i < l; i++) {
        const parent = this.findParentNode(root.child[i], childNode, root);
        if (parent) {
          return parent;
        }
      }
    }
    return undefined;
  }

  getSearchResult = (node, root, keyWord) => {
    if (root.uid === node.uid) {
      if (root.child && root.child.length) {
        root.child = root.child.filter(item => item.name.indexOf(keyWord) > -1);
        root.child.splice(maxListLength, root.child.length - maxListLength);
      }
      else {
        message.warning('当前节点未展开！');
      }
      return root;
    }
    if (root.child) {
      for (let i = 0, l = root.child.length; i < l; i++) {
        root.child[i] = this.getSearchResult(node, root.child[i], keyWord);
      }
    }
    return root;
  }

  searchChange = (e) => {
    clearTimeout(searchTimer);
    const keyWord = e.target.value;
    searchTimer = setTimeout(() => {
      const state = lodash.cloneDeep(this.state);
      let { selectedParent, root, copyData } = state;
      root = lodash.cloneDeep(copyData);
      const rootData = root.find(item => item.direction === selectedParent.direction);
      const rootDataIndex = root.findIndex(item => item.direction === selectedParent.direction);
      state.root[rootDataIndex] = this.getSearchResult(selectedParent, rootData, keyWord);
      this.setState(state);
    }, 500)
  }
  render() {
    return (
      <React.Fragment>
        <div style={{ marginBottom: 16 }}>
          <Input placeholder={this.state.selectedParent ? this.state.selectedParent.name : '未选择搜索节点'} onChange={this.searchChange} disabled={this.state.selectedParent ? false : true} />
        </div>
        <div
          style={{ height: 'calc(100% - 16px)', overflow: 'auto' }}
        >
          {this.state.loading
            && <div style={{ textAlign: 'center' }}>数据加载中...</div>}
          {this.renderList()}
        </div>
      </React.Fragment>
    );
  }
}


export const mapStateToProps = (state, ownProps) => ({
  selectedDimension: state.Spreadsheet.selectedDimension,
});

export default connect(mapStateToProps)(Dimension);
