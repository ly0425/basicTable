import React, { Component } from 'react';
import { Table, Input, Button, Popconfirm, Tooltip, Modal } from '@vadp/ui';
import { DeleteModel,DeleteModels, LoadModelList, FilterModelList } from 'actions/modelManagerAction.js';
import NetUitl from 'containers/HttpUtil';
import SearchC from './searchC.js';
import Message from './Message.js';
import { DeleteAnalysisModel } from 'actions/analysisModelAction';
import { routerRedux } from 'dva/router';
import DashboardModal from './dashboardModal.js';
import DashboardModalOES from './dashboardModalOES.js';
import DashboardModalDRG from './dashboardModalDRG.js';
import DashboardModalVADP from './dashboardModalVADP.js';
import moment from 'moment';
import DataUrlModal from './DataUrlModal.js';
import { pageSize } from 'constants/Common.js';
import WrapperTableColumnTooltip from 'components/Public/WrapperTableColumnTooltip.js';
import WrapperTableColumn from 'components/Public/WrapperTableColumn.js';
import { getComponentBodyProperty, getTdWidthDynamically } from './DynamicTdEllipsis.js';
import { illegalSymbolCheck } from './illegalSymbolCheckUtil.js';
import isRoutePublic from 'constants/IntegratedEnvironment';
import IRModal from 'routes/intelligentReport/intelligentReportDesigner/components/intelligentReportModal.js';
import { saveIntelligentReport } from 'actions/intelligentReportAction';
import SaveModal from 'components/Public/SaveModal';
import NetUtil from 'containers/HttpUtil';
import TreeModal from 'public/treeModal';
function showTotal(total) {
  return `共 ${total} 条 `;
}

const ModelListInfos={  //给复制用
      "charts":{
          "id":"chart_model$id",
          "name":"chart_model$name"
      },
      "tables":{
        "id":"table_model$id",
        "name":"table_model$name"
      },
      "htmlcontainer":{
        "id":"htmlcontainer$id",
        "name":"htmlcontainer$name"
      },
      "dashboard":{
        "id":"dashboard_model$id",
        "name":"dashboard_model$name"
      },
      "newdashboard":{
        "id":"newdashboard_model$id",
        "name":"newdashboard_model$name"
      }
}
class ModelList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      height: 300,
      pagination: {
        current: props.current || 1,
        pageSize: props.pageSize || pageSize,
        total: this.props.total,
        showTotal,
        // showSizeChanger: true,
        // showQuickJumper: true,
        // onShowSizeChange: this.onShowSizeChange.bind(this),
        // onChange: this.onChange.bind(this)
      },
      modalVisible: false,
      dataUrlmodalVisible: false,
      record: '',
      tableWidth: 0,
      istest: false,
      analysismodel: {
        modalVisible: false,
      },
      selectedRowKeys: [],
      copyIndexsData: null,//批量复制
      indexClassTreeModal: false,
    };
    this.searchValue = '';
    this.emptySelectedInputValue = this.emptySelectedInputValue.bind(this);
    this.analysismodelModalVisible = this.analysismodelModalVisible.bind(this);
    this.routerGo = this.routerGo.bind(this);
    // this.addPublic = this.addPublic.bind(this);
  }
  componentDidMount() {
    const self = this;
    this.calcTableBodyHeight();
    window.addEventListener('resize', () => {
      self.calcTableBodyHeight();
    });
  }
  // 浏览器窗口变化时，table body的高度相应变化，决定scroll的y值
  calcTableBodyHeight() {
    const height = document.documentElement.clientHeight || document.body.clientHeight;
    const height2 = height - 290;
    this.setState({ height: height2 });
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.rowSelection && this.props.rowSelection.selectedRowKeys && this.props.rowSelection.selectedRows) {
      this.setState({
        selectedRowKeys: this.props.rowSelection.selectedRowKeys,
        selectedRows: this.props.rowSelection.selectedRows
      })
    }

    this.setState({
      pagination: {
        current: nextProps.current,
        pageSize: nextProps.pageSize
      }
    });
  }
  componentWillMount() { //回显选中项
    if (this.props.rowSelection && this.props.rowSelection.selectedRowKeys && this.props.rowSelection.selectedRows) {
      this.setState({
        selectedRowKeys: this.props.rowSelection.selectedRowKeys,
        selectedRows: this.props.rowSelection.selectedRows
      })
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', () => {

    });
  }
  setModalVisible(modalVisible, r, tag) {
    let newState;
    newState = {
      ...this.state,
      modalVisible: modalVisible,
      record: r,
      tag: tag ? tag : ""
    };
    this.setState(newState);
  }
  setDataUrlModalVisible(modalVisible) {
    let newState;
    newState = {
      ...this.state,
      dataUrlmodalVisible: modalVisible,
    };
    this.setState(newState);
    if (modalVisible == false) {
      this.changeHandle('');
    }
  }
  analysismodelModalVisible(modalVisible) {
    console.log(modalVisible);
    let newState;
    newState = {
      analysismodel: { modalVisible },
    };
    this.setState(newState);
  }
  getColumns() {
    let columns;
    if (this.props.directType == 'charts') {
      columns = [{
        title: '模型名称',
        dataIndex: 'chart_model$name',
        key: 'chart_model$name',
        width: 120,
        // fixed:'left',
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '所属分类',
        dataIndex: 'category$name',
        key: 'category$name',
        width: 100,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '所属分析模型',
        dataIndex: 'analysis_model$name',
        key: 'analysis_model$name',
        width: 120,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '创建者',
        dataIndex: 'chart_model$creator',
        key: 'chart_model$creator',
        width: 80,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '创建时间',
        dataIndex: 'chart_model$createTime',
        key: 'chart_model$createTime',
        width: 120,
        defaultSortOrder: 'descend',
        // sorter:(a,b)=>DateChangeForIE(a.chart_model$createTime,b.chart_model$createTime),
        sorter: true,
        render: text => <WrapperTableColumn text={text} />,
      }, {
        title: '修改者',
        dataIndex: 'chart_model$updater',
        key: 'chart_model$updater',
        width: 80,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '修改时间',
        dataIndex: 'chart_model$updateTime',
        key: 'chart_model$updateTime',
        width: 120,
        defaultSortOrder: 'descend',
        // sorter:(a,b)=>DateChangeForIE(a.chart_model$createTime,b.chart_model$createTime),
        sorter: true,
        render: text => <WrapperTableColumn text={text} />,
      }];
      if (this.isShowColumn()) {
        columns.push({
          title: '操作',
          key: 'action',
          width: 100,
          render: (text, record, index) => (
            <span className="table_iconpd">
              <Tooltip placement="bottomLeft" key={'edit'} title={'编辑'}>
                <a className="ant-dropdown-link" onClick={this.editModel.bind(this, record)}><i className="icon iconfont icon-edit" /></a>
              </Tooltip>
              <Popconfirm overlayClassName="bi" title="确认要删除该图表模型吗?" onConfirm={() => this.onDelete(index, record)}>
                <Tooltip placement="bottomLeft" key={'delete'} title={'删除'}>
                  <a href="#"><i className="icon iconfont icon-delete_o " /></a>
                </Tooltip>
              </Popconfirm>
              <Tooltip placement="bottomLeft" key={'saveAs'} title={'复制'}>
                <a className="ant-dropdown-link" onClick={this.copyModel.bind(this, record)}><i className="icon iconfont icon-bicopy1" /></a>
              </Tooltip>
            </span>
          ),
        })
      }
    } else if (this.props.directType == 'tables') {
      columns = [{
        title: '模型名称',
        dataIndex: 'table_model$name',
        key: 'table_model$name',
        width: 120,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '所属分析模型',
        dataIndex: 'analysis_model$name',
        key: 'analysis_model$name',
        width: 120,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '所属分类',
        dataIndex: 'category$name',
        key: 'category$name',
        width: 80,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '表格类型',
        dataIndex: 'table_model$type',
        key: 'table_model$type',
        width: 80,
        render: (value, row, index) => {
          switch (value) {
            case 'table':
              return { children: <WrapperTableColumn text={'动态表格'} width={60} /> };
            case 'matrix':
              return { children: <WrapperTableColumn text={'交叉表格'} width={60} /> };
            case 'matrix2':
              return { children: <WrapperTableColumn text={'复杂表格'} width={60} /> };
            default:
              return { children: <WrapperTableColumn text={'未知类型'} width={60} /> };
          }
        },
      }, {
        title: '创建者',
        dataIndex: 'table_model$creator',
        key: 'table_model$creator',
        width: 80,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '创建时间',
        dataIndex: 'table_model$createTime',
        key: 'table_model$createTime',
        width: 120,
        defaultSortOrder: 'descend',
        // sorter: (a, b) => DateChangeForIE(a.table_model$createTime,b.table_model$createTime),
        sorter: true,
        render: text => <WrapperTableColumn text={text} width={130} />,
      }, {
        title: '修改者',
        dataIndex: 'table_model$updater',
        key: 'table_model$updater',
        width: 80,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '修改时间',
        dataIndex: 'table_model$updateTime',
        key: 'table_model$updateTime',
        width: 120,
        defaultSortOrder: 'descend',
        // sorter: (a, b) => DateChangeForIE(a.table_model$createTime,b.table_model$createTime),
        sorter: true,
        render: text => <WrapperTableColumn text={text} width={130} />,
      }];

      if (this.isShowColumn() ) {
        columns.push({
          title: '操作',
          key: 'action',
          width: 100,
          render: (text, record, index) => (
            <span className="table_iconpd">
              <Tooltip placement="bottomLeft" key={'edit'} title={'编辑'}>
                <a className="ant-dropdown-link" onClick={this.editModel.bind(this, record)}><i className="icon iconfont icon-edit" /></a>
              </Tooltip>
              <Popconfirm overlayClassName="bi" title="确认要删除该表格模型吗?" onConfirm={() => this.onDelete(index, record)}>
                <Tooltip placement="bottomLeft" key={'delete'} title={'删除'}>
                  <a href="#"> <i className="icon iconfont icon-delete_o" /></a>
                </Tooltip>
              </Popconfirm>
              <Tooltip placement="bottomLeft" key={'saveAs'} title={'复制'}>
                <a className="ant-dropdown-link" onClick={this.copyModel.bind(this, record)}><i className="icon iconfont icon-bicopy1" /></a>
              </Tooltip>
            </span>
          ),
        })
      }

    } else if (this.props.directType == 'excel') {
      columns = [{
        title: '模型名称',
        dataIndex: 'table_model$name',
        key: 'table_model$name',
        width: 120,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '所属分类',
        dataIndex: 'category$name',
        key: 'category$name',
        width: 100,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '创建者',
        dataIndex: 'table_model$creator',
        key: 'table_model$creator',
        width: 80,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '创建时间',
        dataIndex: 'table_model$createTime',
        key: 'table_model$createTime',
        width: 120,
        defaultSortOrder: 'descend',
        // sorter: (a, b) => DateChangeForIE(a.table_model$createTime,b.table_model$createTime),
        sorter: true,
        render: text => <WrapperTableColumn text={text} width={130} />,
      }, {
        title: '修改者',
        dataIndex: 'table_model$updater',
        key: 'table_model$updater',
        width: 80,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '修改时间',
        dataIndex: 'table_model$updateTime',
        key: 'table_model$updateTime',
        width: 120,
        defaultSortOrder: 'descend',
        // sorter: (a, b) => DateChangeForIE(a.table_model$createTime,b.table_model$createTime),
        sorter: true,
        render: text => <WrapperTableColumn text={text} width={130} />,
      }, {
        title: '操作',
        key: 'action',
        width: 100,
        render: (text, record, index) => (
          <span className="table_iconpd">
            <Tooltip placement="bottomLeft" key={'edit'} title={'编辑'}>
              <a className="ant-dropdown-link" onClick={this.editModel.bind(this, record)}><i className="icon iconfont icon-edit" /></a>
            </Tooltip>
            <Popconfirm overlayClassName="bi" title="确认要删除该自由表格模型吗?" onConfirm={() => this.onDelete(index, record)}>
              <Tooltip placement="bottomLeft" key={'delete'} title={'删除'}>
                <a href="#"> <i className="icon iconfont icon-delete_o" /> </a>
              </Tooltip>
            </Popconfirm>
          </span>
        ),
      }];

    } else if (this.props.directType === 'dashboard') {
      columns = [{
        title: '模型名称',
        dataIndex: 'dashboard_model$name',
        key: 'dashboard_model$name',
        width: 120,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '所属分类',
        dataIndex: 'category$name',
        key: 'category$name',
        width: 100,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '创建者',
        dataIndex: 'dashboard_model$creator',
        key: 'dashboard_model$creator',
        width: 70,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '创建时间',
        dataIndex: 'dashboard_model$createTime',
        key: 'dashboard_model$createTime',
        width: 120,
        defaultSortOrder: 'descend',
        // sorter: (a, b) =>DateChangeForIE(a.dashboard_model$createTime,b.dashboard_model$createTime),
        sorter: true,
        render: text => <WrapperTableColumn text={text} width={130} />,
      }, {
        title: '修改者',
        dataIndex: 'dashboard_model$updater',
        key: 'dashboard_model$updater',
        width: 70,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '修改时间',
        dataIndex: 'dashboard_model$updateTime',
        key: 'dashboard_model$updateTime',
        width: 120,
        defaultSortOrder: 'descend',
        // sorter: (a, b) =>DateChangeForIE(a.dashboard_model$createTime,b.dashboard_model$createTime),
        sorter: true,
        render: text => <WrapperTableColumn text={text} width={130} />,
      }];
      if (this.isShowColumn()) {
        columns.push({
          title: '操作',
          key: 'action',
          width: 120,
          render: (text, record, index) => (
            <span className="table_iconpd" >
              <Tooltip placement="bottomLeft" key={'edit'} title={'编辑'}>
                <a className="ant-dropdown-link" onClick={this.editModel.bind(this, record)}><i className="icon iconfont icon-edit" /></a>
              </Tooltip>
              <Popconfirm overlayClassName="bi" title="确认要删除该仪表板吗?" onConfirm={() => this.onDelete(index, record)}>
                <Tooltip placement="bottomLeft" key={'delete'} title={'删除'}>
                  <a href="#"> <i className="icon iconfont icon-delete_o pdr14" /></a>
                </Tooltip>
              </Popconfirm>
              <Tooltip placement="bottomLeft" key={'saveAs'} title={'复制'}>
                <a className="ant-dropdown-link" onClick={this.copyModel.bind(this, record)}><i className="icon iconfont icon-bicopy1" /></a>
              </Tooltip>
              <Tooltip placement="bottomLeft" key={'publishMenu'} title={'发布菜单'}>
                <a>
                  <i className="icon iconfont icon-xiangxixinxi" onClick={this.setModalVisible.bind(this, true, record)} />
                </a>
              </Tooltip>
              <Tooltip placement="bottomLeft" key={'publishHistory'} title={'发布历史'}>
                <a>
                  <i className="icon iconfont icon-ele_issue" onClick={this.setModalVisible.bind(this, true, record, "publishHistory")}></i>
                </a>
              </Tooltip>
            </span>
          ),
        })
      }


    }else if (this.props.directType === 'newdashboard') {
      columns = [{
        title: '大屏模型名称',
        dataIndex: 'newdashboard_model$name',
        key: 'newdashboard_model$name',
        width: 120,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '所属分类',
        dataIndex: 'category$name',
        key: 'category$name',
        width: 100,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '创建者',
        dataIndex: 'newdashboard_model$creator',
        key: 'newdashboard_model$creator',
        width: 70,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '创建时间',
        dataIndex: 'newdashboard_model$createTime',
        key: 'newdashboard_model$createTime',
        width: 120,
        defaultSortOrder: 'descend',
        // sorter: (a, b) =>DateChangeForIE(a.dashboard_model$createTime,b.dashboard_model$createTime),
        sorter: true,
        render: text => <WrapperTableColumn text={text} width={130} />,
      }, {
        title: '修改者',
        dataIndex: 'newdashboard_model$updater',
        key: 'newdashboard_model$updater',
        width: 70,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '修改时间',
        dataIndex: 'newdashboard_model$updateTime',
        key: 'newdashboard_model$updateTime',
        width: 120,
        defaultSortOrder: 'descend',
        // sorter: (a, b) =>DateChangeForIE(a.dashboard_model$createTime,b.dashboard_model$createTime),
        sorter: true,
        render: text => <WrapperTableColumn text={text} width={130} />,
      }];
      if (this.isShowColumn()) {
        columns.push({
          title: '操作',
          key: 'action',
          width: 120,
          render: (text, record, index) => (
            <span className="table_iconpd" >
              <Tooltip placement="bottomLeft" key={'edit'} title={'编辑'}>
                <a className="ant-dropdown-link" onClick={this.editModel.bind(this, record)}><i className="icon iconfont icon-edit" /></a>
              </Tooltip>
              <Popconfirm overlayClassName="bi" title="确认要删除该仪表板吗?" onConfirm={() => this.onDelete(index, record)}>
                <Tooltip placement="bottomLeft" key={'delete'} title={'删除'}>
                  <a href="#"> <i className="icon iconfont icon-delete_o pdr14" /></a>
                </Tooltip>
              </Popconfirm>
              <Tooltip placement="bottomLeft" key={'saveAs'} title={'复制'}>
                <a className="ant-dropdown-link" onClick={this.copyModel.bind(this, record)}><i className="icon iconfont icon-bicopy1" /></a>
              </Tooltip>
              <Tooltip placement="bottomLeft" key={'publishMenu'} title={'发布菜单'}>
                <a>
                  <i className="icon iconfont icon-xiangxixinxi" onClick={this.setModalVisible.bind(this, true, record)} />
                </a>
              </Tooltip>
              <Tooltip placement="bottomLeft" key={'publishHistory'} title={'发布历史'}>
                <a>
                  <i className="icon iconfont icon-ele_issue" onClick={this.setModalVisible.bind(this, true, record, "publishHistory")}></i>
                </a>
              </Tooltip>
            </span>
          ),
        })
      }


    } else if (this.props.directType == 'tabs') {
      columns = [{
        title: '模型名称',
        dataIndex: 'tabs$name',
        key: 'tabs$name',
        width: 120,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '所属分类',
        dataIndex: 'category$name',
        key: 'category$name',
        width: 100,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '创建者',
        dataIndex: 'tabs$creator',
        key: 'tabs$creator',
        width: 80,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '创建时间',
        dataIndex: 'tabs$createTime',
        key: 'tabs$createTime',
        width: 100,
        defaultSortOrder: 'descend',
        // sorter: (a, b) =>DateChangeForIE(a.tabs$createTime,b.tabs$createTime),
        sorter: true,
        render: text => <WrapperTableColumn text={text} width={130} />,
      }, {
        title: '修改者',
        dataIndex: 'tabs$updater',
        key: 'tabs$updater',
        width: 80,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '修改时间',
        dataIndex: 'tabs$updateTime',
        key: 'tabs$updateTime',
        width: 100,
        defaultSortOrder: 'descend',
        // sorter: (a, b) =>DateChangeForIE(a.tabs$createTime,b.tabs$createTime),
        sorter: true,
        render: text => <WrapperTableColumn text={text} width={130} />,
      }, {
        title: '操作',
        key: 'action',
        width: 140,
        render: (text, record, index) => (
          <span className="table_iconpd" style={{ width: '80px' }}>
            <Tooltip placement="bottomLeft" key={'edit'} title={'编辑'}>
              <a className="ant-dropdown-link" onClick={this.editModel.bind(this, record)}><i className="icon iconfont icon-edit" /></a>
            </Tooltip>
            <Popconfirm overlayClassName="bi" title="确认要删除该多页签模型吗?" onConfirm={() => this.onDelete(index, record)}>
              <Tooltip placement="bottomLeft" key={'delete'} title={'删除'}>
                <a href="#"> <i className="icon iconfont icon-delete_o pdr14" /></a>
              </Tooltip>
            </Popconfirm>
          </span>
        ),
      }];
    } else if (this.props.directType == 'storyboard') {
      columns = [{
        title: '模型名称',
        dataIndex: 'storyboard_model$name',
        key: 'storyboard_model$name',
        width: 120,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '所属分类',
        dataIndex: 'category$name',
        key: 'category$name',
        width: 100,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '创建者',
        dataIndex: 'storyboard_model$creator',
        key: 'storyboard_model$creator',
        width: 80,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '创建时间',
        dataIndex: 'storyboard_model$createTime',
        key: 'storyboard_model$createTime',
        width: 100,
        defaultSortOrder: 'descend',
        sorter: true,
        render: text => <WrapperTableColumn text={text} width={130} />,
      }, {
        title: '修改者',
        dataIndex: 'storyboard_model$updater',
        key: 'storyboard_model$updater',
        width: 80,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '修改时间',
        dataIndex: 'storyboard_model$updateTime',
        key: 'storyboard_model$updateTime',
        width: 100,
        defaultSortOrder: 'descend',
        sorter: true,
        render: text => <WrapperTableColumn text={text} width={130} />,
      }, {
        title: '操作',
        key: 'action',
        width: 140,
        render: (text, record, index) => (
          <span className="table_iconpd">
            <Tooltip placement="bottomLeft" key={'edit'} title={'编辑'}>
              <a className="ant-dropdown-link" onClick={this.editModel.bind(this, record)}><i className="icon iconfont icon-edit" /></a>
            </Tooltip>
            <Popconfirm overlayClassName="bi" title="确认要删除该故事版吗?" onConfirm={() => this.onDelete(index, record)}>
              <Tooltip placement="bottomLeft" key={'delete'} title={'删除'}>
                <a href="#"> <i className="icon iconfont icon-delete_o pdr14" /></a>
              </Tooltip>
            </Popconfirm>
            <Tooltip placement="bottomLeft" key={'publishMenu'} title={'发布菜单'}>
              <a>
                <i className="icon iconfont icon-xiangxixinxi" onClick={this.setModalVisible.bind(this, true, record)} />
              </a>
            </Tooltip>
            <Tooltip placement="bottomLeft" key={'publishHistory'} title={'发布历史'}>
              <a>
                <i className="icon iconfont icon-ele_issue" onClick={this.setModalVisible.bind(this, true, record,"publishHistory")}></i>
              </a>
            </Tooltip>
          </span>
        ),
      }];
    } else if (this.props.directType == 'htmlcontainer') {
      columns = [{
        title: '模型名称',
        dataIndex: 'htmlcontainer$name',
        key: 'htmlcontainer$name',
        width: 120,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '所属分类',
        dataIndex: 'category$name',
        key: 'category$name',
        width: 100,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '创建者',
        dataIndex: 'htmlcontainer$creator',
        key: 'htmlcontainer$creator',
        width: 80,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '创建时间',
        dataIndex: 'htmlcontainer$createTime',
        key: 'htmlcontainer$createTime',
        width: 100,
        defaultSortOrder: 'descend',
        sorter: true,
        render: text => <WrapperTableColumn text={text} width={130} />,
      }, {
        title: '修改者',
        dataIndex: 'htmlcontainer$updater',
        key: 'htmlcontainer$updater',
        width: 80,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '修改时间',
        dataIndex: 'htmlcontainer$updateTime',
        key: 'htmlcontainer$updateTime',
        width: 100,
        defaultSortOrder: 'descend',
        sorter: true,
        render: text => <WrapperTableColumn text={text} width={130} />,
      }, {
        title: '操作',
        key: 'action',
        width: 120,
        render: (text, record, index) => (
          <span className="table_iconpd" style={{ width: '80px' }}>
            <Tooltip placement="bottomLeft" key={'edit'} title={'编辑'}>
              <a className="ant-dropdown-link" onClick={this.editModel.bind(this, record)}><i className="icon iconfont icon-edit" /></a>
            </Tooltip>
            <Popconfirm overlayClassName="bi" title="确认要删除该标签模型吗?" onConfirm={() => this.onDelete(index, record)}>
              <Tooltip placement="bottomLeft" key={'delete'} title={'删除'}>
                <a href="#"> <i className="icon iconfont icon-delete_o pdr14" /></a>
              </Tooltip>
            </Popconfirm>
            <Tooltip placement="bottomLeft" key={'saveAs'} title={'复制'}>
              <a className="ant-dropdown-link" onClick={this.copyModel.bind(this, record)}><i className="icon iconfont icon-bicopy1" /></a>
            </Tooltip>
            {
              // <Tooltip placement="bottomLeft" key={'publishMenu'} title={'发布菜单'}>
              //   <a>
              //     <i className="icon iconfont icon-xiangxixinxi" onClick={this.setModalVisible.bind(this, true, record)}></i>
              //   </a>
              // </Tooltip>
            }
          </span>
        ),
      }];
    } else if (this.props.directType == 'analysismodel') {
      columns = [{
        title: '分析模型名称',
        dataIndex: 'analysis_model$name',
        key: 'analysis_model$name',
        width: 150,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '所属分类',
        dataIndex: 'analysis_model$category_id',
        key: 'analysis_model$category_id',
        width: 100,
        align:"left",
        render: (text, record, index) =>{
          return text && text !="" && text !==" " ? record.category$name:  "all"
        },
      },{
        title: '相关数据源',
        dataIndex: 'datasource$name',
        key: 'datasource$name',
        width: 100,
        render: text => <WrapperTableColumnTooltip text={text} />,
      },  {
        title: '创建者',
        dataIndex: 'analysis_model$creator',
        key: 'analysis_model$creator',
        width: 80,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '创建时间',
        dataIndex: 'analysis_model$createTime',
        key: 'analysis_model$createTime',
        width: 120,
        defaultSortOrder: 'descend',
        // sorter: (a, b) => DateChangeForIE(a.analysis_model$createTime,b.analysis_model$createTime),
        sorter: true,
        render: text => <WrapperTableColumn text={text} width={130} />,
      },  {
        title: '修改者',
        dataIndex: 'analysis_model$updater',
        key: 'analysis_model$updater',
        width: 80,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '修改时间',
        dataIndex: 'analysis_model$updateTime',
        key: 'analysis_model$updateTime',
        width: 120,
        defaultSortOrder: 'descend',
        // sorter: (a, b) => DateChangeForIE(a.analysis_model$createTime,b.analysis_model$createTime),
        sorter: true,
        render: text => <WrapperTableColumn text={text} width={130} />,
      }, {
        title: '操作',
        key: 'action',
        width: 100,
        render: (text, record, index) => (
          <span className="table_iconpd">
            <Tooltip placement="bottomLeft" key={'edit'} title={'编辑'}>
              <a className="ant-dropdown-link" onClick={this.editModel.bind(this, record)}><i className="icon iconfont icon-edit" /></a>
            </Tooltip>
            <Popconfirm overlayClassName="bi" title="确认要删除该分析模型吗?" onConfirm={() => this.onDelete(index, record)}>
              <Tooltip placement="bottomLeft" key={'delete'} title={'删除'}>
                <a href="#"> <i className="icon iconfont icon-delete_o" /> </a>
              </Tooltip>
            </Popconfirm>
          </span>
        ),
      }];
    } else if (this.props.directType == 'parameterSetting') {
      columns = [{
        title: 'key',
        dataIndex: 'name',
        width: 150,
      }, /*{
        title: '类别',
        dataIndex: 'code',
        width: 150,
      },*/ {
        title: '值',
        dataIndex: 'value',
        width: 150,
      }, {
        title: '描述',
        dataIndex: 'description',
        width: 200,
      }, /*{
        title: '创建者',
        dataIndex: 'creater',
        width: 100,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '创建时间',
        dataIndex: 'create_time',
        width: 140,
        sorter: (a, b) => parseInt(a.create_time) - parseInt(b.create_time),
        render: text => moment(parseInt(text)).format('YYYY-MM-DD HH:mm:ss'),
      },{
        title: '状态',
        dataIndex: 'is_unable',
        width: 150,
        render: (text) => {
          return text=='1' ? '是' : '否';
        },
      },*/  {
        title: '操作',
        dataIndex: 'operation',
        width: 150,
        render: (text, record, index) => (
          <span className="table_iconpd">
            <Tooltip placement="bottomLeft" key={'edit'} title={'编辑'}>
              <a className="ant-dropdown-link" onClick={this.props.editParameter.bind(this, record)}><i className="icon iconfont icon-edit" /></a>
            </Tooltip>
            <Popconfirm overlayClassName="bi" title="确认要删除该系统参数吗?" onConfirm={() => { this.props.handleDelete(record.id); }}>
              <Tooltip placement="bottomLeft" key={'delete'} title={'删除'}>
                <a href="#"> <i className="icon iconfont icon-delete_o" /> </a>
              </Tooltip>
            </Popconfirm>
          </span>
        ),
      }];
    } else if (this.props.directType == 'Intelligentreportmanager') {
      columns = [{
        title: '模型名称',
        dataIndex: 'IntelligentReport$name',
        key: 'IntelligentReport$name',
        width: 120,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '创建者',
        dataIndex: 'IntelligentReport$creator',
        key: 'IntelligentReport$creator',
        width: 100,
        render: text => <WrapperTableColumnTooltip text={text} />,
      }, {
        title: '创建时间',
        dataIndex: 'IntelligentReport$createTime',
        key: 'IntelligentReport$createTime',
        width: 140,
        defaultSortOrder: 'descend',
        // sorter: (a, b) =>DateChangeForIE(a.dashboard_model$createTime,b.dashboard_model$createTime),
        sorter: true,
        render: text => <WrapperTableColumn text={text} width={130} />,
      }, {
        title: '操作',
        key: 'action',
        width: 120,
        render: (text, record, index) => (
          <span className="table_iconpd" >
            <Tooltip placement="bottomLeft" key={'edit'} title={'编辑'}>
              <a className="ant-dropdown-link" onClick={this.editModel.bind(this, record)}><i className="icon iconfont icon-edit" /></a>
            </Tooltip>
            <Popconfirm overlayClassName="bi" title="确认要删除该智能报告吗?" onConfirm={() => this.onDelete(index, record)}>
              <Tooltip placement="bottomLeft" key={'delete'} title={'删除'}>
                <a href="#"> <i className="icon iconfont icon-delete_o pdr14" /></a>
              </Tooltip>
            </Popconfirm>
          </span>
        ),
      }];
    }



    return columns;
  }
  getRowKeys(r) {
    const { directType } = this.props;
    let v = undefined;
    const modelInfo=ModelListInfos[directType];
    if(modelInfo) v=r[modelInfo.id];
    return v;
  }
  analysismodelForApiOnOk() {
    this.addPublic('/addApi/');
  }
  addModel() {
    if (this.props.editParameter) {
      this.props.editParameter();
    } else {
      this.addPublic();
    }
  }
  addPublic(path = '/add/') {
    if (!this.props.selectedKeys) {
      Message.warning('请先创建分类主题！');
      return;
    }
    if (this.props.selectedKeys && this.props.selectedKeys.length > 0) {
      const parameters = this.props.selectedKeys[0];
      if (this.props.directType == 'Intelligentreportmanager') {
        this.setState({ addIRModalVisible: true })
      } else {
        this.routerGo(path, parameters);
      }
    } else {
      Message.warning('请先选中一个主题!');
    }
  }
  saveIRCancel() {
    this.setState({ addIRModalVisible: false })
  }
  saveIROK(formData) {
    const that = this;
    saveIntelligentReport(formData).then(function (value) {
      if (value.status === 200) {
        if (value.saveResult.code === 200) {
          Message.success("保存成功");
          that.saveIRCancel()
          // that.props.dispatch(routerRedux.push(isRoutePublic + "intelligentReportManager/intelligentReportManager"));
        } else {
          Message.error("保存失败")
        }
      } else if (value.status === 500) {
        Message.error("保存失败");
      }
    }, function (error) {
      Message.error("保存失败");
    })
  }

  onDelete = (index, record) => {
    this.props.dispatch(DeleteModel(this.getParams(record).Id, this.props.directType));
    this.props.reloadDataAfterDeleteRecord();
  }
  getModelName(model){
    let name="";
    const modelInfo=ModelListInfos[model.type];
    if(modelInfo) name=model[modelInfo.name];
    return name;
  }
  copyModel(record) {
    let newRecord = record;
    const { directType } = this.props;
    newRecord.name=this.getModelName(record);
    this.setState({ currentRecord: newRecord, saveModalVisible: true });
    // this.setState({ currentRecord: record, saveModalVisible: true });
  }
  saveClick(data) {
    let modelId = this.getParams(this.state.currentRecord).Id;

    let name = data.name;
    let currentName = this.getParams(this.state.currentRecord).name;
    if (name == currentName) {
      name += '-副本';
    }
    let remark = this.getParams(this.state.currentRecord).remark;
    let param = {
      id: modelId,
      type: this.props.directType,
      name,
      remark
    };
    let self = this;
    //复制模型
    NetUtil.post('/helper/copyCtrlInfo', param, function (data) {
      console.log('success', data);
      if (data.code == 200) {
        self.getAllData();
      } else {
        Message.error('复制失败！');
        console.log('复制失败', data.msg);
      }
    }, function (data) {
      console.log(data);
    });
  }
  saveCancel() {
    this.setState({ saveModalVisible: false });
  }
  editModel(r) {
    const categoryId = (this.getParams().routerType === 'TableModel') ? `/${this.props.selectedKeys[0]}` : '';
    const parameters = this.getParams(r).Id + categoryId;
    this.routerGo('/edit/', parameters);
  }
  routerGo(path, parameters) {
    this.props.dispatch(routerRedux.push(`${isRoutePublic + this.getParams().path}/${this.getParams().routerType}${path}${parameters}`));
  }
  //给外部调用modelList的组件用
  getSelectedModel() {
    return {
      selectedRows: this.state.selectedRows,
      selectedRowKeys: this.state.selectedRowKeys
    }

  }
  getInnerRowSelection(props) {
    let innerRowSelection = {
      type: props.rowSelection && props.rowSelection.type ? props.rowSelection.type : 'checkbox',
      onChange: (selectedRowKeys, selectedRows) => {
        this.setState(() => {
          return {
            selectedRowKeys,
            selectedRows
          }
        }, () => {

        })
      },
      selectedRowKeys: this.state.selectedRowKeys,
      selectedRows: this.state.selectedRows
    };
    return innerRowSelection;
  }

  // getParams
  getParams(record) {
    const routerType = null;
    const path = null;
    const Id = null;
    let obj = {};
    const drType = this.props.directType;
    const allModel = {
      dashboard: {
        routerType: 'DashboardModel',
        path: 'dashboardManager',
        Id: 'dashboard_model$id',
        name: 'dashboard_model$name',
        remark: 'dashboard_model$remark'
      },
      newdashboard: {
        routerType: 'DashboardModelNew',
        path: 'dashboardManager',
        Id: 'newdashboard_model$id',
        name: 'newdashboard_model$name',
        remark: 'newdashboard_model$remark'
      },
      storyboard: {
        routerType: 'StoryboardDesignerModel',
        path: 'dashboardManager',
        Id: 'storyboard_model$id',
        name: 'storyboard_model$name',
        remark: 'storyboard_model$remark'
      },
      analysismodel: {
        routerType: 'AnalysisModelNew',
        path: 'dataModel',
        Id: 'analysis_model$id',
        name: 'analysis_model$name',
        remark: 'analysis_model$remark'
      },
      charts: {
        routerType: 'ChartDesigner',
        path: 'visualizationModel',
        Id: 'chart_model$id',
        name: 'chart_model$name',
        remark: 'chart_model$remark'
      },
      tables: {
        routerType: 'TableModel',
        path: 'visualizationModel',
        Id: 'table_model$id',
        name: 'table_model$name',
        remark: 'table_model$remark'
      },
      excel: {
        routerType: 'SpreadsheetModel',
        path: 'visualizationModel',
        Id: 'table_model$id',
        name: 'table_model$name',
        remark: 'table_model$remark'
      },
      tabs: {
        routerType: 'TabsDesignerModel',
        path: 'visualizationModel',
        Id: 'tabs$id',
        name: 'tabs$name',
        remark: 'tabs$remark'
      },
      htmlcontainer: {
        routerType: 'HtmlcontainerDesignerModel',
        path: 'visualizationModel',
        Id: 'htmlcontainer$id',
        name: 'htmlcontainer$name',
        remark: 'htmlcontainer$remark'
      },
      DataAuthority: {
        routerType: 'DataAuthority',
        path: 'admin',
        Id: 'DataAuthority$id',
      },
      richtext: {
        routerType: 'kpiDesigner',
        path: 'visualizationModel',
      },
      Intelligentreportmanager: {
        routerType: 'IntelligentReportModel',
        path: 'intelligentReportManager',
        Id: 'IntelligentReport$id',
      },

    };
    const modeltype = allModel[drType];

    if (record == undefined) {
      obj.path = modeltype.path;
      obj.routerType = modeltype.routerType;
    } else {
      // 合成portal需要path，路由类似：visualizationModel/ChartDesigner/add/26256352087113728
      obj = Object.assign({}, modeltype);
      if (obj.Id) {
        obj.Id = record[obj.Id];
      }
      obj.name = record[obj.name] ? record[obj.name] : '';
      obj.remark = record[obj.remark] ? record[obj.remark] : '';
    }
    return obj;
  }
  // //页码改变的回调，参数是改变后的页码及每页条数
  // onChange(page,pageSize){
  //   this.setState({pagination:{current:page}});
  //   this.props.dispatch(LoadModelList({ selectedKey: this.props.selectedKeys, value: this.searchValue, urlType: this.props.directType, pageIndex: page, pageSize:this.props.pageSize}));
  // }
  // //pageSize 变化的回调
  // onShowSizeChange(current,size){
  //   let self = this;
  //   self.props.dispatch(LoadModelList({ selectedKey: this.props.selectedKeys, value: this.searchValue, urlType: this.props.directType, pageIndex: current, pageSize:size}));
  // }
  // 搜索模型
  changeHandle(value) {
    this.searchValue = value;
    // 不合法
    if (illegalSymbolCheck(value)) {
      Message.error('非法英文字符(~#^$@%&*?\/<>)请更换');
      return;
    }
    let param = { selectedKey: this.props.selectedKeys, value: this.searchValue, urlType: this.props.directType } ;
    if(this.props.rowSelection && this.props.outsideLoadModelList){//portal首页的页面设计器调用
      this.props.outsideLoadModelList(param) ;
    }else{
      this.props.dispatch(LoadModelList(param));
      this.setState({ pagination: { current: 1 } });
    }
  }
  getAllData() {
    this.emptySelectedInputValue(); // 清空搜索框
    this.changeHandle('');
  }
  // －－－－－添加的选择框搜索值清空方法，左侧treeview也要调用此方法用来联动清除搜索框－－－－－
  emptySelectedInputValue() {
    this.refs.searchCButton.emitEmpty();// 清空搜索框
  }
  // 服务端排序——正序
  handleTableChange(pagination, filters, sorter) {
    let sortField = (sorter.field && sorter.field.indexOf("updateTime")>=0 && "updateTime") || "createTime"
    if(this.props.rowSelection && this.props.outsideLoadModelList){//portal首页的页面设计器调用
      let param = { selectedKey: this.props.selectedKeys, value: this.searchValue, urlType: this.props.directType, pageIndex: pagination.current, pageSize: pagination.pageSize, sortOrder: sorter.order, sortField } ;
      this.props.outsideLoadModelList(param) ;
    }else{
      this.setState(() => {
        return { pagination: { current: pagination.current } };
      }, () => {
        // console.log(this.state);
        this.props.dispatch(LoadModelList({ selectedKey: this.props.selectedKeys, value: this.searchValue, urlType: this.props.directType, pageIndex: this.state.pagination.current, pageSize: this.props.pageSize, sortOrder: sorter.order, sortField }));
      });
    }
  }
  getModelId() {
    if (this.props.directType == 'storyboard') {
      return this.state.record.storyboard_model$id;
    } else if (this.props.directType == 'newdashboard') {
      return this.state.record.newdashboard_model$id;
      // 发布仪表板
    } else {
      return this.state.record.dashboard_model$id;
    }
  }
  renderDashboardModal() {
    if (this.state.modalVisible) {
      if (window.BI_APP_CONFIG && window.BI_APP_CONFIG.oesConfig && window.BI_APP_CONFIG.oesConfig.isOes) {
        return <DashboardModalOES
          modalVisible={this.state.modalVisible}
          setModalVisible={this.setModalVisible.bind(this)}
          modelId={this.getModelId.apply(this)}
          // modelId={this.state.record.dashboard_model$id}
          data={this.state.record}
          dispatch={this.props.dispatch}
          directType={this.props.directType}
        />
      }
      else if (window.BI_APP_CONFIG && window.BI_APP_CONFIG.DRGConfig && window.BI_APP_CONFIG.DRGConfig.isDRG) {
        return <DashboardModalDRG
          modalVisible={this.state.modalVisible}
          setModalVisible={this.setModalVisible.bind(this)}
          modelId={this.getModelId.apply(this)}
          data={this.state.record}
          dispatch={this.props.dispatch}
          directType={this.props.directType}
        />
      }
      else if (window.BI_APP_CONFIG && window.BI_APP_CONFIG.VADPConfig && window.BI_APP_CONFIG.VADPConfig.isVADP) {
        return <DashboardModalVADP
          modalVisible={this.state.modalVisible}
          setModalVisible={this.setModalVisible.bind(this)}
          modelId={this.getModelId.apply(this)}
          data={this.state.record}
          dispatch={this.props.dispatch}
          directType={this.props.directType}
          tag={this.state.tag && this.state.tag == "publishHistory" ? "publishHistory" : ""}
        />
      }
      else {
        return <DashboardModal
          modalVisible={this.state.modalVisible}
          setModalVisible={this.setModalVisible.bind(this)}
          modelId={this.getModelId.apply(this)}
          data={this.state.record}
          dispatch={this.props.dispatch}
          directType={this.props.directType}
        />
      }


    } else {
      return null;
    }
  }
  getRandom(){
    let ran = Math.random()+"";
    ran = ran.substring(2) ;
    return ran ;
  }
  getNewName(oldName,categoryId,modelType,callback){
        let newName=oldName+"_副本"+this.getRandom();
        return newName;
      //   let url = `${modelType}/name_exist`;
      //   let para = {name:newName,category_id:categoryId};
      //  NetUtil.get(url, para,  (data)=> {
      //     //data.data为true表示名称未被占用，可以注册;false表示已经存在
      //     if (data.data == false) {
      //          this.getNewName(newName,categoryId,modelType,callback);
      //     } else {
      //        callback(newName);
      //     }
      //   }, function (data) {
      //        callback(newName);
      //   }) 
  }
  manyCopy(param){
      NetUtil.post('/helper/copyBatchCtrlInfo',param, (data)=> {
        console.log('success', data);
        if (data.code == 200) {
            this.getAllData();
            this.setState({
              selectedRowKeys:[],
              copyIndexsData:null
            })
        }else{
            Message.error('复制失败！');
            console.log('复制失败',data.msg);
        }
      }, function (data) {
        console.log(data);
      });
  }
  indexClassTreeModalSubmit = (categoryId) => {
    const self=this;
    const {directType}=this.props;
    const modelInfo=ModelListInfos[directType];
    if (categoryId) {
          const dataSource=self.props.dataSource;
          const param = this.state.selectedRowKeys.map((id,index) => {
              let result={
                id: id,
                type:directType,
                categoryId: categoryId
              };
              if(modelInfo){
                  for(let d of dataSource){
                            if(d[modelInfo.id] == id){
                                result.name=this.getNewName(d[modelInfo.name],categoryId,directType); 
                            }
                  }
              }
              return result;
          }); 
          this.manyCopy(param);
    }
    else {
      //Message.warning('请选择需要复制的指标！');
    }
    this.setState({ indexClassTreeModal: false })
  }
  deleteIndexs(){
      if (this.state.selectedRowKeys.length) {
          this.props.dispatch(DeleteModels(this.state.selectedRowKeys, this.props.directType));
          this.props.reloadDataAfterDeleteRecord();
          this.setState({selectedRowKeys:[]})
      }
      else {
        Message.warning('请选择需要删除的列表！');
      }
  }
  copyIndexs() {
    if (this.state.selectedRowKeys.length) {
      this.setState({ indexClassTreeModal: true })
    }
    else {
      Message.warning('请选择需要复制的列表！');
    }
    // const self=this;
    // if (this.state.selectedRowKeys.length) {
    //   
    // }
    // else{
    //   Message.warning('请选择需要复制的列表！');
    // }
  }
  selectedRowKeysOnChange(selectedRowKeys, selectedRows) {
    const { urlType } = this.props;
    this.setState({ selectedRowKeys });
    let getDatas = {
      indexValue: "",
      indexName: "",
      categoryName: ""
    }
    if (urlType == "charts") {
      getDatas = {
        indexValue: selectedRows[0].chart_model$id,
        indexName: selectedRows[0].chart_model$name,
        categoryName: selectedRows[0].category$name
      }
    } else if (urlType == "tables") {
      getDatas = {
        indexValue: selectedRows[0].table_model$id,
        indexName: selectedRows[0].table_model$name,
        categoryName: selectedRows[0].category$name
      }
    }
    this.props.getMarkValue({ ...getDatas });
  }
  copyIndexsRowSelectionOnChange(selectedRowKeys) {
    const { urlType } = this.props;
    this.setState({ selectedRowKeys })
  }
  getDataSource(dataSource, urlType) {
    if (dataSource && dataSource.length) {
      let modelKey = null;
      if (urlType == "charts") {
        modelKey = "chart_model$id";
      } else if (urlType == "tables") {
        modelKey = "table_model$id";
      } else if (urlType == "htmlcontainer") {
        modelKey = "htmlcontainer$id";
      } else if (urlType == "dashboard") {
        modelKey = "dashboard_model$id";
      }else if (urlType == "newdashboard") {
        modelKey = "newdashboard_model$id";
      }
      return dataSource.map((item) => {
        item.key = item[modelKey];
        return item;
      })
    } else {
      return null;
    }
  }
  isShowCopys(urlType) {
    if(this.props.readOnly){//只读：例如智能报告
      return false
    }else if (urlType == "charts" || urlType == "tables" || urlType == "htmlcontainer"  || urlType == "dashboard"|| urlType == "newdashboard") {
      return true;
    } else {
      return false;
    }
  }

  /**
   * 是否显示新建按钮
   */
  isShowAdd(){
    if(this.props.readOnly){//只读：例如智能报告
      return false
    }else if(this.props.rowSelection){//oes首页选择一个要插入的组件
      return false ;
    }else{
      return true ;
    }
  }

  /**
   * 是否显示获取全部按钮
   */
  isShowGetAll(){
    if(this.props.readOnly){//只读：例如智能报告
      return false
    }else if(this.props.rowSelection){//oes首页选择一个要插入的组件
      return false ;
    }else{
      return true ;
    }
  }

  /**
   * 是否显示操作列
   */
  isShowColumn(){
    if(this.props.readOnly){//只读：例如智能报告
      return false
    }else if(this.props.rowSelection){//oes首页选择一个要插入的组件
      return false ;
    }else{
      return true ;
    }
  }

  render() {     
    /* 模型数据增加后要刷新分页条，分页条写在constructor里只会执行一次，所以要在render的时候改变total*/
    const pagination = this.state.pagination;
    pagination.total = this.props.total;
    const { istest, analysismodel, currentRecord } = this.state;
    const { urlType, deleteAll,selectedKeys,directType} = this.props;
    // const rowSelection = {
    //   onChange: (selectedRowKeys, selectedRows) => {
    //     console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
    //     this.setState({
    //       selectedRowKeys,
    //     });
    //   },
    //   getCheckboxProps: record => ({
    //     disabled: record.name === 'Disabled User', // Column configuration not to be checked
    //     name: record.name,
    //   }),
    //   selectedRowKeys: this.state.selectedRowKeys,
    // };
    const rowSelection = {
      selectedRowKeys: this.state.selectedRowKeys,
      onChange: this.selectedRowKeysOnChange.bind(this),
      type: "radio",
    };
    const copyIndexsRowSelection = {
      selectedRowKeys: this.state.selectedRowKeys,
      onChange: this.copyIndexsRowSelectionOnChange.bind(this)
    }
    console.log('currentRecord:', this.state.currentRecord, 'urlType:', urlType, 'this.props.directType:', this.props.directType)
    let name = '', remark = '';
    if (currentRecord) {
      name = this.getParams(currentRecord).name;
      remark = this.getParams(currentRecord).remark;
    }
    let saveModelData = {
      name: name || '',
      remark: remark || '',
    };
    return (
      <div>
        {/* {this.showChartModelInfo()} */}
        <div className="pic_header">
          <div className="datasource bi-border-bottom">
            {directType && directType=="parameterSetting" ?"系统参数列表" :"模型列表"}
          </div>
        </div>
        {this.isShowCopys(urlType) ?
          <TreeModal type={urlType} title="请选择分类" show={this.state.indexClassTreeModal} submit={this.indexClassTreeModalSubmit} />
          : null
        }
        <div className="model-list">
          <div id="abc" style={{ height: '33px' }}>
            {this.props.selectAll == undefined ?
              <div style={{ width: '20%', display: 'inline-block' }}>
                <SearchC changeHandle={this.changeHandle.bind(this)} ref="searchCButton"  value={this.props.searchName}/>
              </div> : null
            }
            {
              this.isShowAdd() ?  <Button
                type="primary"
                className="flr"
                onClick={this.addModel.bind(this)}
              >
                {directType == 'Intelligentreportmanager' ? "新增报告" : directType=="parameterSetting" ? "新增系统参数": "新增模型"}
              </Button>
              :null
            }
            {
              this.isShowCopys(urlType) ? <Button type="white"
                className="flr"
                style={{ marginRight: '8px' }}
                onClick={this.copyIndexs.bind(this)}>
                批量复制
            </Button>
                : null
            }
          {  //可批量复制就可批量删除
              this.isShowCopys(urlType) ? <Popconfirm overlayClassName="bi" title="确认要批量删除吗?" onConfirm={this.deleteIndexs.bind(this)} >
                <Button type="white"
                      className="flr"
                      style={{ marginRight: '8px' }}
                      >
                      批量删除
                  </Button>
              </Popconfirm>
                : null
            }
            {
              urlType == 'analysismodel' && istest ?
                <Button
                  type="primary"
                  className="flr mgr8"
                  onClick={() => this.analysismodelModalVisible(true)}
                >
                  导入外部API
            </Button> : null
            }
            {this.props.selectAll == undefined ?
              (
                this.isShowGetAll() ? 
                  <Button
                    type="white"
                    className="flr"
                    style={{ marginRight: '8px' }}
                    onClick={this.getAllData.bind(this)}
                  >
                    获取全部
                </Button>
                :null
              )
              : null}
            {this.props.deleteAll === false ?
              <Button
                type="white"
                className="flr"
                style={{ marginRight: '8px' }}
                onClick={this.props.handleDelete.bind(this, this.state.selectedRowKeys)}
              >
                批量删除
              </Button> : null}
          </div>

          {
            //新增智能报告
            true ? <Modal
            /> : null
          }

          <Table
            id="tableFixed"
            rowSelection={(this.props.rowSelection ? this.getInnerRowSelection(this.props) : (this.props.readOnly ? rowSelection : (this.isShowCopys(urlType) ? copyIndexsRowSelection : null)))}
            className="modeltable"
            bordered
            scroll={{ x: 720, y: this.state.height }}
            columns={this.getColumns()}
            rowKey={this.getRowKeys.bind(this)}
            dataSource={this.getDataSource(this.props.dataSource, urlType)}
            pagination={this.state.pagination}
            onChange={this.handleTableChange.bind(this)}
          // rowSelection={l}

          />
          {
            this.renderDashboardModal()
          }

          {
            //新建只能报告
            this.state.addIRModalVisible ?
              <IRModal
                data={{}}
                category_id={this.props.selectedKeys && this.props.selectedKeys[0]}
                visible={this.state.addIRModalVisible}
                onCancel={visible => this.saveIRCancel(visible)}
                onOk={saveData => this.saveIROK(saveData)}
              />
              : null
          }

          {
            this.state.dataUrlmodalVisible ?
              <DataUrlModal
                modalVisible={this.state.dataUrlmodalVisible}
                setModalVisible={this.setDataUrlModalVisible.bind(this)}
                modelId={this.state.record.dashboard_model$id}
                data={this.state.record}
                dispatch={this.props.dispatch}
              /> : null
          }



          
          {
            this.state.saveModalVisible ? (<SaveModal
              data={saveModelData}
              visible={this.state.saveModalVisible}
              onCancel={visible => this.saveCancel(visible)}
              onOk={this.saveClick.bind(this)}
              modelType={urlType}
              category_id={ selectedKeys && selectedKeys.length ?selectedKeys[0]:null }
              isCopy={true}
            />) : null
          }
        </div>
      </div>
    );
  }
}
// // －－－－－IE10/IE9上时间2010-12-12这种格式new date不识别，会变成无效日期－－－－－－
// const DateChangeForIE=(a,b)=>{
//   let dateA = new Date(moment(a).format('YYYY/MM/DD')).getTime()
//   dateA = Number(dateA);
//   let dateB = new Date(moment(b).format('YYYY/MM/DD')).getTime()
//   dateB = Number(dateB);

//   return dateA - dateB
// }

export default ModelList;
