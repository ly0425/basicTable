import React, { Component } from 'react';
import { Input, Button, Tree, Modal } from '@vadp/ui';

const { TextArea } = Input;

// 一级目录
const typesOne = [
  { typeName: '字段', parent: '7-0' },
  { typeName: '常见函数', parent: '8-3' },
];
// 二级目录
const typesTwo = [
  { typeName: '函数', parent: '8-3' },
];
// 说明与项的列表
const term = [
  {
    title: 'Len',
    parent: '8-3-5',
    explain: '返回一个整数，该整数包含存储变量所需的字符串中的字符数或字节数。',
    example: '=Len(field)',
    type: 'function',
  },
  {
    title: 'Left',
    parent: '8-3-6',
    explain: '返回一个字符串，该字符串包含从某个字符串左侧开始的指定数量的字符。',
    example: '=Left(field,6)',
    type: 'function',
  },
  {
    title: 'Right',
    parent: '8-3-7',
    explain: '返回一个字符串，该字符串包含某个字符串从右侧开始的指定数量的字符。',
    example: '=Right(field,6)',
    type: 'function',
  },
  {
    title: 'Mid',
    parent: '8-3-8',
    explain: '返回一个字符串，该字符串包含某个字符串的指定数量的字符。',
    example: '=Mid(field,3,4)',
    type: 'function',
  },
  {
    title: 'IIf',
    parent: '8-3-9',
    explain: '根据表达式的值返回两个对象中的一个。',
    example: '=IIf(field=="1","是","否")',
    type: 'function',
  },
  {
    title: 'sum',
    parent: '8-3-0',
    explain: '求和函数',
    example: '=sum(field)',
    type: 'function',
  },
  {
    title: 'count',
    parent: '8-3-1',
    explain: '计数',
    example: '=count(field)',
    type: 'function',
  },
  {
    title: 'avg',
    parent: '8-3-2',
    explain: '求平均值',
    example: '=avg(field)',
    type: 'function',
  },
  {
    title: 'max',
    parent: '8-3-3',
    explain: '求最大值',
    example: '=max(field)',
    type: 'function',
  },
  {
    title: 'min',
    parent: '8-3-4',
    explain: '求最小值',
    example: '=min(field)',
    type: 'function',
  },
];
const TreeNode = Tree.TreeNode;
class ExpressionEditor extends Component {
  constructor(props) {
    super(props);
    if (props.fields != null && props.fields.length !== 0) {
      props.fields.forEach((v, i) => {
        term.push({
          title: v.comments,
          value: `Fields.${v.aliasName || v.fieldName}`,
          parent: `7-0-${i}`,
          explain: v.fieldType === 'measure' ? '度量字段' : '维度字段',
          example: '',
          type: 'field',
        });
      });
    }
    this.state = {
      termData: [],
      explain: '',
      example: '',
      value: props.value,
      cursurPosition: 0,
    };
  }
  onChange(e) {
    this.setState({
      value: e.target.value,
    });
  }
  // 项的双击事件，和图标的点击事件
  onDoubleClick = (data) => {
    let value = this.state.value;
    const input = document.getElementById('input');
    const arr = Object.assign(data);
    if (value.length === 0) {
      input.value = '=';
    }
    if (arr.value) {
      value = `${input.value}${arr.value}`;
    } else {
      value = `${input.value}${arr.title}(`;
    }
    this.setState({
      value,
    });
  }
  // 树节点点击事件
  onClickTerm(selectedKeys) {
    for (let j = 0; j < term.length; j++) {
      if (term[j].parent === selectedKeys) {
        this.setState({
          explain: term[j].explain,
          example: term[j].example,
        });
      }
    }
  }

  onClick(selectedKeys) {
    const div = {
      marginLeft: '10px',
      marginTop: '10px',
      cursor: 'pointer',
    };
    this.state.termData = [];
    const arr = [];
    for (let i = 0; i < selectedKeys.length; i++) {
      for (let j = 0; j < term.length; j++) {
        if (term[j].parent.substring(0, 3) === selectedKeys[i]) {
          arr.push(<div
            onDoubleClick={this.onDoubleClick.bind(this, term[j])}
            onClick={this.onClickTerm.bind(this, term[j].parent)}
            style={div}
            key={term[j].parent}
          >
            {term[j].title}
          </div>);
        }
      }
    }
    this.setState({
      termData: arr,
      explain: '',
      example: '',
    });
  }
  // 确定事件
  onSubmit() {
    this.props.onOk(this.state.value);
  }
  // 取消事件
  onCancel = () => {
    this.props.onCancel();
  };
  // 生成树结构
  tree = () => {
    const arr = [];
    for (let i = 0; i < typesOne.length; i++) {
      const index = [];
      for (let j = 0; j < typesTwo.length; j++) {
        if (typesTwo[j].parent.substring(0, 1) === typesOne[i].parent) {
          index.push(<TreeNode title={typesTwo[j].typeName} key={typesTwo[j].parent} />);
        }
      }
      if (index.length !== 0) {
        arr.push(<TreeNode title={typesOne[i].typeName} key={typesOne[i].parent} >
          {index}
        </TreeNode>);
      } else {
        arr.push(<TreeNode title={typesOne[i].typeName} key={typesOne[i].parent} />);
      }
    }
    return arr;
  }
  render() {
    // 初始化图标大小
    const img = {
      fontSize: '22px',
      marginRight: '4px',
    };
    return (
      <Modal
        title={'表达式编辑器'}
        className="table-expression-editor-modal"
        visible={this.props.visible}
        closable
        maskClosable={false}
        width="450px"
        bodyStyle={{ paddingTop: '10px' }}
        onCancel={this.onCancel.bind(this)}
        okText="确定"
        cancelText="取消"
        footer={[
          <div style={{ marginRight: '35px' }}>
            <Button onClick={this.onCancel.bind(this)} >取消</Button>
            <Button type="primary" onClick={this.onSubmit.bind(this)}>保存</Button>
          </div>,
        ]}
        wrapClassName="bi"
      >
        <div >
          <div className="mgb10">为以下项设置表达式(S):value</div>
          <TextArea id="input" style={{ resize: 'none', height: '100px' }} autosize={false} value={this.state.value} onChange={this.onChange.bind(this)} />
          <div style={{ marginBottom: 10, marginTop: 10, width: '100%', display: 'flex' }}>
            <i id="plus" style={{ fontSize: '22px', marginRight: '4px', marginTop: '5.5px' }}
              className="icon iconfont icon-plus"
              onClick={this.onDoubleClick.bind(this, { value: '+' })} />
            <i id="reduce" style={img} className="icon iconfont icon-reduce"
              onClick={this.onDoubleClick.bind(this, { value: '-' })} />
            <i id="ride" style={img} className="icon iconfont icon-ride"
              onClick={this.onDoubleClick.bind(this, { value: '*' })} />
            <i id="except" style={img} className="icon iconfont icon-except"
              onClick={this.onDoubleClick.bind(this, { value: '/' })} />
            <i id="percentile" style={img} className="icon iconfont icon-percentile"
              onClick={this.onDoubleClick.bind(this, { value: '%' })} />
            <i id="left_parenthesis" style={img} className="icon iconfont icon-left_parenthesis"
              onClick={this.onDoubleClick.bind(this, { value: '(' })} />
            <i id="right_parenthesis" style={img} className="icon iconfont icon-right_parenthesis"
              onClick={this.onDoubleClick.bind(this, { value: ')' })} />
            <i id="comma" style={img} className="icon iconfont icon-comma"
              onClick={this.onDoubleClick.bind(this, { value: ',' })} />
          </div>
          <div style={{ width: '100%', display: 'flex' }}>
            <div style={{ width: '32%' }}>
              <div className="mgb5">类别(C)</div>
              <div className="table-expression-editor-tree">
                <Tree
                  showLine
                  onSelect={this.onClick.bind(this)}
                >
                  {this.tree()}
                </Tree>
              </div>
            </div>
            <div style={{ marginLeft: '1%', width: '32%' }}>
              <div className="mgb5">项(I)</div>
              <div className="table-expression-editor-tree">
                {this.state.termData}
              </div>
            </div>
            <div style={{ marginLeft: '1%', height: '200px', width: '33%' }}>
              <br />
              <div style={{ marginTop: '10px' }}>
                <div className="table-expression-editor-instruction">
                  <span className="instruction-title">说明</span>
                  <span>
                    {this.state.explain}
                  </span>
                </div>
                <div className="table-expression-editor-instruction">
                  <span className="instruction-title">示例</span>
                  <span>
                    {this.state.example}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}
export default ExpressionEditor;
