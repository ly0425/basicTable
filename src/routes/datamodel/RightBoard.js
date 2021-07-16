import React,{Component} from 'react'
import {connect} from 'react-redux'
import { routerRedux } from 'dva/router';
import ToolBar from '/src/components/Public/ToolBar';
import {Modal,Table, Icon, Tooltip} from '@vadp/ui';
function noop(){}
class RightBoard extends Component{
  constructor(props) {
    super(props);

  }
  getToolBarData(){
    let common=[{
      title: '返回',
      handler: this.rollBackToList.bind(this),
      type: 'goBack',
    }, {
      title: '保存',
      handler: this.showSaveModal.bind(this, 'save'),
      type: 'save',
    }];
    return common;
  }
  showSaveModal(){

  }
  rollBackToList() {
    let self=this;
    Modal.confirm({
      title: '',
      content: "当前数据未保存,确认返回吗？",
      className:"bi bi-ant-confirm-confirm",
      okText: '确认',
      cancelText: '取消',
      onOk() {
        self.props.dispatch(routerRedux.push("/visualizationModel/IntelligentReportManager"));
      },
      onCancel() {
        return;
      }
    });
  }
  showEditExpression(record){
    this.props.showEditExpression && this.props.showEditExpression(record)
  }
  render(){
    const columns = [{
      title: '标签',
      dataIndex: 'name',
      key: 'name'
    }, {
      title: '表达式',
      dataIndex: 'expression',
      key: 'expression'
    }, {
      title: '操作',
      key: 'action',
      render: (text, record, index) => (
          <span className="table_iconpd">
		       <Tooltip placement="bottomLeft" key={'edit'} title={'编辑'}>
	               <a className="ant-dropdown-link" onClick={this.showEditExpression.bind(this, record)}><i className="icon iconfont icon-edit"></i></a>
	            </Tooltip>
		    </span>
      ),
    }];

    const data = [{
      key: 'PO_L_Year',
      name: '标签1',
      expression: 'a.xls:a2'
    }, {
      key: '2',
      name: '标签2',
      expression: 'a1+a2'
    }, {
      key: '3',
      name: '标签3',
      expression: 'a1+a2'
    }];
    //菜单功能的集合
    const ToolBarData = this.getToolBarData();
    return (
        <div>
          <div className="header-div">
            <ToolBar data={ToolBarData} ref="tabsToolBar"  title={"智能报告"}/>
          </div>
          <div  className="model-list">
            <Table columns={columns} dataSource={data} />
          </div>
        </div>

    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    theme: state.global.theme,
  }
}
export default connect(mapStateToProps)(RightBoard);