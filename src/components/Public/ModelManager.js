import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Row, Col ,Modal} from '@vadp/ui';
import { LoadModelList, loadTreeData, renderTree } from '../../actions/modelManagerAction.js';
import ModelList from './modelList.js';
import TreeView from './treeView.js';
import SearchCAndReload from './SearchCAndReload.js';
import NothingMessage from './NothingMessage.js';
import Message from './Message.js';
import { illegalSymbolCheck } from './illegalSymbolCheckUtil';
import BICache from './BICache.js';
import {handleAllSysParam} from './cacheUtil';
class ModelManager extends Component {
  constructor(props) {
    super(props);
    this.current = '';
    this.urlType = this.props.urlType;
  }
  componentWillMount() {
    // this.props.dispatch(emptyModelList(this.props.urlType));
  }
  componentDidMount() {
    // 这里不能这么同步加载treeData和modelList，模型列表不显示，要用promise回调
    // this.props.dispatch(LoadTreeData({title:""}));
    // this.props.dispatch(LoadModelList(this.props.selectedKeys[0], this.props.selectedKeys));
    handleAllSysParam();
    this.loadTree({ title: '', urlType: this.props.urlType });
  }
  componentWillUnmount() {
  }
  loadTree(obj) {
    // 用promise回调加载list(then方法里绑定的是回调函数)
    const that = this;

    loadTreeData(obj).then((value) => {
      if (value.status == 200) {
        console.log('value',value)
        BICache.benchmarkDate = value.benchmarkDate;
        console.log('treeview BICache benchmarkDate',BICache.benchmarkDate)
        // 把treeNode放到store中渲染tree
        that.props.dispatch(renderTree(value.result,obj.urlType));
        if (value.result.length === 0) return;
        // 默认加载第一个树节点的ModelList，从ToolBar返回时要加载相应树节点的模型数据
        const selectedKey = (that.props.selectedKeys === undefined || that.props.selectedKeys.length <= 0) ? [value.result[0].key] : that.props.selectedKeys;
        that.current = that.props.current;
        // 新增模型重新从第一页加载,编辑返回当页，paramType是保存模型后存放在redux中的一个属性，用来区分是add还是edit
        if (that.props.paramType === 'add') {
          that.current = 1;
        }
        if (that.props.operator === 'delete' && that.props.modelList.length < 1 && that.props.current > 1) {
          that.current = that.props.current - 1;
        }
        that.props.dispatch(LoadModelList({
          selectedKey,
          value: '',
          urlType: obj.urlType,
          pageIndex: that.current,
          pageSize: that.props.pageSize }));
      } else {
        Message.error('加载失败!');
      }
    }, (error) => {
      console.log(error);
    });
  }
  reloadDataAfterDeleteRecord() {
    this.loadTree({ title: '', urlType: this.props.urlType });
  }
  changeHandle(value) {
    // 不合法
    if (illegalSymbolCheck(value)) {
      Message.error('非法英文字符(~#^$@%&*?\/<>)请更换');
      return;
    }
    this.loadTree({ title: value, urlType: this.props.urlType });
    this.emptySelectedRightInputValue();
  }
  emptySelectedRightInputValue() {
    // －－－调用子组件modelist，用来清空搜索框值－－－－
    this.refs.getAllData.emptySelectedInputValue();
  }
  render() {
    const {modelManagerTreeData}=this.props;
    return (
      <div className="bi">
        <div className="container-fluid analysis_container margin0 padding0" style={{ height:this.props.readOnly?`calc(100vh - 300px)`: `calc(100vh - ${window.BI_APP_CONFIG.headHeight})` }}>
          <Row>
            <Col sm={4} md={4} lg={4} className="left-part-common">
              <ul className="mgb0 bi-border-bottom">
                <li className="datasource fsz14 bi-border-bottom" > 分类主题结构 </li>
              </ul>
              <div className="pd15 pdt24">
                <SearchCAndReload
                  changeHandle={this.changeHandle.bind(this)}
                />

                {
              modelManagerTreeData &&  modelManagerTreeData.length === 0 ? NothingMessage()
                  :
                <TreeView
                  dispatch={this.props.dispatch}
                  treeNodes={modelManagerTreeData || []}
                  directType={this.props.urlType} //解决bug bi-2033切换分类主题不起作用
                  selectedKeys={this.props.selectedKeys}
                  emptySelectedRightInputValue={this.emptySelectedRightInputValue.bind(this)}
                />
              }

              </div>
            </Col>
            <Col sm={20} md={20} lg={20} className="right_part" id="container" style={{ height:this.props.readOnly?`calc(100vh - 300px)`: `calc(100vh - ${window.BI_APP_CONFIG.headHeight})`,overflow:"scroll" }}>
              <ModelList
                total={this.props.total}
                dataSource={this.props.modelList}
                dispatch={this.props.dispatch}
                selectedKeys={this.props.selectedKeys}
                directType={this.props.urlType}
                current={this.props.current}
                pageSize={this.props.pageSize}
                reloadDataAfterDeleteRecord={this.reloadDataAfterDeleteRecord.bind(this)}
                ref="getAllData"
                urlType={this.props.urlType}
                readOnly={this.props.readOnly}
                getMarkValue={this.props.getMarkValue}
              />
               <Modal
          title="Basic Modal"
        >
          <p>Some contents...</p>
          <p>Some contents...</p>
          <p>Some contents...</p>
        </Modal>
            </Col>
          </Row>

           <Modal
          title="Basic Modal"
        >
          <p>Some conddddddddddddddtents...</p>
          <p>Some contents...</p>
          <p>Some contents...</p>
        </Modal>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  modelManagerTreeData: state.modelManager[`${ownProps.urlType}ModelManagerTreeData`],
  selectedKeys: state.modelManager[`${ownProps.urlType}SelectedKeys`],
  modelList: state.modelManager[`${ownProps.urlType}ModelList`],
  total: state.modelManager[`${ownProps.urlType}Total`],
  current: state.modelManager[`${ownProps.urlType}Current`],
  pageSize: state.modelManager[`${ownProps.urlType}PageSize`],
  //directType: state.modelManager.directType,
  paramType: state.modelManager.paramType, // 用来记录是新增还是编辑
  operator: state.modelManager.operator, // 用来记录是否是删除
});

export default connect(mapStateToProps)(ModelManager);
