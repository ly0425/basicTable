/**
 * 维度公式弹窗
 * 对付用吧
 */
import React from 'react';
import { message, Modal, Input, Tree, Select, Menu, Row, Col, Alert, Button, Tooltip } from '@vadp/ui';
// import DimensionTreeNode from './DimensionTreeNode';
import { fetchDimensionList, fetchDimensionValues } from '../BudgetApi';
import '../../../../style/pages/DimensionFormulaModal.less';
import '../../../../style/pages/Dimentsion.less'


const commonItems = [
  { text: '(', value: '(', title: '左括号' },
  { text: ')', value: ')', title: '右括号' },
  { text: ',', value: ',', title: '逗号' },
  { text: '+', value: '+', title: '加' },
  { text: '-', value: '-', title: '减' },
  { text: '×', value: '*', title: '乘' },
  { text: '÷', value: '/', title: '除' },
  { text: '&', value: '&', title: '字符串连接' },
];

class DimensionFormulaModal extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      dimensionRoot: [],
      measureRoot: [],
      selectMeasure: [],
      selectDimension: [],
      textValue: props.defaultText || '', // 公式值
      floatCellDimension: false, // 是否是浮动行的维度公式
    }
    this.initData(props.sheet);
  }
  
  componentWillReceiveProps(newProps) {
    const {selectedRanges} = newProps;
    if (newProps.sheet !== this.props.newProps) {
      this.initData(newProps.sheet);
      this.setState({
        textValue: newProps.defaultText
      })
    }
    // if (newProps.sheet.present.selectedRanges !== this.props.sheet.present.selectedRanges) {
    this.checkFloatRow(newProps);
    // }
  }

  /** 检查是否时浮动行， 如果为浮动行， 则将当前浮动行绑定的维度赋值给当前数据 */
  checkFloatRow = (newProps) => {
    const {selectedRanges, rowProps, colProps, tableRows} = newProps.sheet.present;
    if (selectedRanges && selectedRanges[0]) {
      const {top, left} = selectedRanges[0];
      if (rowProps && rowProps[top] && rowProps[top].rowType === 'float') {
        const matchDimension = tableRows[top].find(cell => {
          return cell.dimensionData && cell.dimensionData.dimension
        });
        const matchMeasure = tableRows.find(row => {
          if (row[left].measure && row[left].measure.expandDisplay) {
           return row
          }
        })
        if (matchDimension && matchMeasure) {
          const formular = `=FX.取编制数(${matchDimension.dimensionData.dimension.dimDisplay}, E.${matchMeasure[left].measure.expandDisplay})`
          this.setState({
            textValue: formular,
            floatCellDimension: true
          })
        }
      } 
    }
  }

  // 将当前表格中已存放的维度/度量/页面维度加载出来
  initData = (sheet) => {
    const {tableRows, rowProps, pageDimensions} = sheet.present;
    const obj = this.getDimension(tableRows, rowProps);
    const {dimensionChildMap, dimensionMap} = obj;
    const dimensionList = [...dimensionChildMap.keys()];
    const map = new Map();
    const array = [];
    if (pageDimensions) {
      pageDimensions.forEach(item => {
        const dimension = item.dimension;
        const child = item.dimensionValues ? item.dimensionValues[0] : undefined;
        if (dimension && child) {
          const children = [{
            id: child.id,
            name: child.display,
            code: child.code,
            parentNode: node,
            isLeaf: true,
            type: 'budgetDimension',
            // uid: `${child.id}-${node.id}`,
          }]
          const node = {
            id: dimension.id,
            name: dimension.dimDisplay,
            dataKey:  dimension.dataKey,
            isLeaf: false,
            expand:false,
            level: 1,
            type: 'budgetDimension',
            uid: `${dimension.id}`,
            // child: children
            child: []
          }
          array.push(node);
        }
      })
    }

    if (dimensionList && dimensionList.length > 0) {
      dimensionList && dimensionList.forEach(key => {
        const list = dimensionChildMap.get(key);
        // 数据需去重
        if (!map.get(key) && list) {
          map.set(key, key);
          const parent = dimensionMap.get(key);
          const node = {
            id: parent.id,
            name: parent.dimDisplay,
            dataKey:  parent.dataKey,
            isLeaf: false,
            expand:false,
            level: 1,
            type: 'budgetDimension',
            uid: `${parent.id}`,
            child: []
          }
          const child = []
          list && list.forEach(i => {
            if(i) {
              child.push({
                id: i.id,
                name: i.display,
                code: i.code,
                parentNode: node,
                isLeaf: true,
                type: 'budgetDimension',
                uid: `${i.id}-${node.id}`,
              })
            }
          });
          // node.child = child
          array.push(node);
        }
      });
      this.setState({
        dimensionRoot: array
      })
    }
    
    const measure = obj.measureMap;
    if (measure) {
      const measureList = [...measure.values()];
      const array = [];
      if (measureList && measureList.length > 0) {
       measureList.forEach(item => {
          array.push({
            id: item.id,
            name: item.expandDisplay,
            isLeaf: true,
            type: 'budgetMeasure',
            uid: item.id
          })
        });
        const measureRoot = {
          id: 'measure',
          uid: 'measure',
          name: '度量',
          child: array,
          type: 'budgetMeasure',
          isLeaf: false,
          expand: false,
          level: 0
        }
        const root = [measureRoot];
        this.setState({
          measureRoot: root
        });
      }
    }
  }

  // 排除浮动行上绑定的维度
  getDimension = (tableRows, rowProps) => {
    const dimensionMap = new Map();
    const dimensionChildMap = new Map(); // 存放每个维度成员
    const measureMap = new Map(); // 存放当前表格中所有度量
   
    tableRows.forEach((row, index) => {
      if (rowProps[index].rowType !== 'float'){
        row.forEach(column => {
          if (column.measure) {
            if (!measureMap.get(column.measure.id)) {
              measureMap.set(column.measure.id, column.measure);
            }
          } else if (column.dimensionData) {
       
            const key = column.dimensionData.dimension.id;
            if (!dimensionMap.get(key)) {
              dimensionMap.set(key, column.dimensionData.dimension);
            }
            if (dimensionChildMap.get(key)) {
              // push方法返回push对象， 原数组改变
              dimensionChildMap.get(key).push(column.dimensionData.value)
              dimensionChildMap.set(key, dimensionChildMap.get(key))
            } else {
              dimensionChildMap.set(key, [column.dimensionData.value]);
            }
          }
        });
      }
    });
    return {
      'dimensionMap': dimensionMap,
      'dimensionChildMap': dimensionChildMap,
      'measureMap': measureMap
    }
  }

  // 渲染维度列表
  renderDimensionList = () => {
    const {dimensionRoot} = this.state;
    if (dimensionRoot && dimensionRoot.length === 0) {
      return <div>暂无维度数据</div>
    }
    return dimensionRoot.map(i => {
      return <TreeNode
        key={i.uid}
        nodeInfo={i}
        rootNode={dimensionRoot}
        expandNode={this.expandNode}
        selectNode={this.selectNode}
        selectedNode={this.state.selectDimension}
      />
    })
  }

  // 渲染度量列表
  renderMeasureList = () => {
    const {measureRoot} = this.state;
    if (measureRoot && measureRoot.length === 0) {
      return <div>暂无度量数据</div>
    }
    return measureRoot.map(node => {
      return <TreeNode
        key={node.uid}
        nodeInfo={node}
        rootNode={measureRoot}
        expandNode={this.expandNode}
        selectNode={this.selectNode}
        selectedNode={this.state.selectMeasure}
      />
    })
  }

  /**
   * 展开节点
   */
  expandNode = async (node, root) => {
    const newRoot = root.slice();
    const matchIndex = root.findIndex(i => i.id === node.id);
    newRoot[matchIndex].expand = !newRoot[matchIndex].expand;
    if (node.type === "budgetDimension") {
      this.setState({
        dimensionRoot: newRoot
      })
    } else {
      this.setState({
        measureRoot: newRoot
      })
    }
  }

  /**
   * 选中节点
   */
  selectNode = (e, node) => {
    const {selectMeasure} = this.state;
    const {selectDimension, textValue} = this.state;
    let array = selectDimension.slice();
    let measureArray = selectMeasure;
    if (node.type === 'budgetDimension') { // 维度
      
      const matchIndex = array.findIndex(i => i.uid === node.uid);
      if (matchIndex > -1) {
        array = array.slice(0, matchIndex).concat(array.slice(matchIndex + 1))
      } else {

        // 如果跟节点被选中，则取消选中孩子节点，同理 孩子节点被选中，根节点取消选中；
        const matchParentIndex = array.findIndex(i => {
          if (i.isLeaf) {
            return i.parentNode.uid === node.uid // 此时孩子节点被选中， 又选中了父节点
          }
        });
        const matchChildIndex = []
        // 孩子节点被选中， 再次选中父节点时，孩子节点取消选中
        if(matchParentIndex > - 1) {
          array = array.slice(0, matchParentIndex).concat(array.slice(matchParentIndex + 1))
        }
        array.push(node)
      }
      this.setState({
        selectDimension: array,
      })
    } else { // 度量
      if (node.uid === 'measure') {
        return false;
      }
      const { selectMeasure, textValue } = this.state;
      const matchIndex = selectMeasure.findIndex(i => i.id === node.id);
      if (matchIndex > -1) {
        measureArray = [];
        this.setState({
          selectMeasure: []
        })
      } else {
        measureArray= [node];
        this.setState({
          selectMeasure: [node]
        })
      }
    }
    const value = this.getTextValue(array, measureArray);
    this.setState({
      textValue: value
    })
  }

  // 选中维度/度量后，渲染文本框中的显示值
  getTextValue = (array, selectMeasure) => {
    let dStr = '';
    let eStr = '';
    const data = array.map(i => {
      let str = '';
      if (i.isLeaf) {
        str = `D.${i.parentNode.name}$${i.name}`;
      } else {
        str = `D.${i.name}$默认成员`;
      }
      return str;
    });
    if (data.length > 0) {
      dStr = data.join('__');
    }
    if (selectMeasure.length > 0) {
      eStr = selectMeasure[0].name
    }
    let value = ''
    if (dStr && eStr) {
      value = `=FX.取编制数(${dStr}, E.${eStr})`
    } else if (!dStr && eStr) {
      value = `=FX.取编制数(E.${eStr})`
    } else if (dStr && !eStr) {
      value = `=FX.取编制数(${dStr})`
    };
    return value;
  }

  /**
   * 取消选中所有得节点
   */
  restSelectNodes = () => {
    this.setState({
      selectedNode: []
    })
  }

  renderCommonItems = () => {
    return (<div className='commonItems'>
      {commonItems.map(item => (
        <Tooltip key={item.value} title={item.title} placement="bottom">
          <span>
            <Button
              // onClick={e => {this.insertString(item.value);}}
            >
              {item.text}
            </Button>
          </span>
        </Tooltip>
      ))}
    </div>);
  }

  handleTextChange = (e) => {
    this.setState({
      textValue: e.target.value
    })
  }

  confirm = () => {
    const {textValue, selectMeasure, selectDimension, floatCellDimension} = this.state;
    if (floatCellDimension) {
      this.props.onConfirm(textValue);
      return;
    }
    if (!textValue) {
      message.warn('请输入内容！')
      return;
    }
    if (selectDimension.length === 0) {
      message.warn('请选择维度!')
      return;
    }
    if (selectMeasure.length === 0) {
      message.warn('请选择度量！');
      return;
    }
    this.props.onConfirm(textValue);
  }

  afterClose = () => {
    this.setState({
      dimensionRoot: [],
      measureRoot: [],
      selectMeasure: [],
      selectDimension: [],
      textValue: '', // 公式值
      floatCellDimension: false
    })
  }

  render () {
    const {visible, sheet} = this.props;
    return (<Modal
      title={'维度公式'}
      visible={visible}
      maskClosable={false}
      onOk={this.confirm}
      onCancel={this.props.onCancel}
      width={800}
      afterClose={this.afterClose}
    >
      <section className={'dimension-formula-modal-container'}>
        <Input
          value={this.state.textValue}
          onChange={this.handleTextChange}
        />
        {/* <div>
          {this.renderCommonItems()}
        </div> */}
        <ul className={'list-container'}>
          <li className={'list-item'}>
            <ul>
              <li>FX.取编制数</li>
            </ul>
          </li>
          <li className={'list-item'}>
            {this.renderDimensionList()}
          </li>
          <li className={'list-item'}>
            {this.renderMeasureList()}
          </li>
        </ul>
      </section>
    </Modal>)
  }
}

export default DimensionFormulaModal;


class TreeNode extends React.PureComponent {
  constructor(props) {
    super();
    this.state = {
      expand: false
    }
  }

  expand = (e) => {
    e.stopPropagation();
    const { nodeInfo } = this.props;
    if (!nodeInfo.isLeaf) {
      this.props.expandNode(nodeInfo, this.props.rootNode)
    }
  }

  onSelect = (e) => {
    e.stopPropagation();
    this.props.selectNode(e, this.props.nodeInfo)
  }

  renderChild = () => {
    const {nodeInfo} = this.props;
    if (nodeInfo && nodeInfo.child) {
      if (nodeInfo.child.length === 0) {
        return <div>暂无数据</div>
      }
      return nodeInfo.child.map(child => {
        return <TreeNode
          key={child.uid}
          nodeInfo={child}
          selectNode={this.props.selectNode}
          selectedNode={this.props.selectedNode}
          expandNode={this.props.expandNode}
        />
      })
    }
  }

  render () {
    const {nodeInfo, selectedNode} = this.props;
    const { expand } = this.state;
    const nodeStyle = nodeInfo.expand ? 'dimension-tree-node-expand' : 'dimension-tree-node-close'
    // const nodeContentStyle = selectedNode && selectedNode.findIndex(i => i.uid === nodeInfo.uid) > -1  ? 'dimension-tree-node-selected' : 'dimension-tree-node-normal'
    const nodeContentStyle = selectedNode && selectedNode.findIndex(i => i.uid === nodeInfo.uid) > -1  ? {backgroundColor: '#40a9ff'} : {backgroundColor: 'transparent'}
    return (<div
      id={nodeInfo.uid}
      style={{width: '100%'}}
    >
    <div className={'dimension-tree-node'}
      onClick={this.expand}
    >
      {!nodeInfo.isLeaf
        && <span
          className={nodeStyle}
        />}
      <span
        onClick={this.onSelect}
        style={{...nodeContentStyle, paddingLeft: nodeInfo.isLeaf ? '24px' : '12px'}}
      >
        <Tooltip placement="right" title={nodeInfo.name}>
          {nodeInfo.name}
        </Tooltip>
      </span>
    </div>
    {nodeInfo.expand && this.renderChild()}
  </div>)
  }
}
