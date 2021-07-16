import React, { Component } from 'react';
import { Spin } from '@vadp/ui';
import MatrixManager from '../matrix/MatrixManager';
import Matrix2Manager from '../matrix2/Matrix2Manager';
import TableManager from './TableManager';
import Message from '/src/components/public/Message';
import TableHeadOrFootUtils from '/src/components/public/TableHeadOrFootUtils';
import Matri2xUtil from '../matrix2/matrix2Utils';
import _ from 'lodash';
const MATRIX2 = 'matrix2';
class VHTable extends Component {
  constructor(props) {
    super(props);

    if (this.props.tableType === 'table') {
      this.tableManager = new TableManager(this);
    } else if (this.props.tableType === MATRIX2) {
      this.tableManager = new Matrix2Manager(this);
    } else {
      this.tableManager = new MatrixManager(this);
    }
    const data = props.data;
    this.HeadData = TableHeadOrFootUtils.setDataStructure(props.headerModel, 'vhtable');
    this.footData = TableHeadOrFootUtils.setDataStructure(props.footerModel, 'vhtable');

    // this.state = data ? this.tableManager.getState(data,props.pageIndex|| 1) : {
    this.state = data ? this.tableManager.getState(data, 1) : {
      data: null,
    };
    this.printTemplateList = [];
    this.dataSet = props.dataSet;
  }
  getPageSize () {
    const { model } = this.props;
    const pageProps = this.tableManager.getScrollConfigAndRowHeight(model);
    const pageSize = pageProps.scroolHeight / pageProps.rowHeight;
    return Math.floor(pageSize)
  }
  componentDidMount () {
    const { dataSet, data, model, conditions, userCase } = this.props;
    if (this.props.tableType === 'table') {
      if (dataSet.analysisModelId === '' || (dataSet.fields.length === 0 && Object.keys(dataSet.totalFieldsExpressions).length === 0 && dataSet.groupFields.length === 0)) {
        //加入没有模型id，没有字段，没有聚合就只展示表单内容
        this.setState({ data: [] });
      }
    }

    // this.HeadData = TableHeadOrFootUtils.setDataStructure(this.props.headerModel);
    // this.footData = TableHeadOrFootUtils.setDataStructure(this.props.footerModel);
    this.dataSet = dataSet;
    if (!data) {

      // dataSet.pageSize = this.getPageSize();
      this.tableManager.refreshTable(dataSet, model, conditions, 1, dataSet.sortExpressions, userCase);
    } else {
      this.tableProperty = model.tableProperty || {};
    }
    this.tableManager.getTableColsWidth();
  }

  componentWillReceiveProps (nextProps) {

    if (nextProps.model === this.props.model
      && nextProps.conditions === this.props.conditions
      && nextProps.data === this.props.data
      && nextProps.userCase === this.props.userCase
    ) {
      return;
    }
    // this.HeadData = TableHeadOrFootUtils.setDataStructure(this.props.headerModel);
    // this.footData = TableHeadOrFootUtils.setDataStructure(this.props.footerModel);
    if (nextProps.tableType === 'table') {
      this.tableManager = new TableManager(this);
    } else if (nextProps.tableType === MATRIX2) {
      this.tableManager = new Matrix2Manager(this);
    } else {
      this.tableManager = new MatrixManager(this);
    }


    this.state.data = null;
    const { dataSet, model, conditions, data, userCase } = nextProps;
    this.dataSet = dataSet;

    if (data) {

      this.setState(this.tableManager.getState(data, 1));
    } else {
      // dataSet.pageSize = this.getPageSize();
      this.tableManager.refreshTable(dataSet, model, conditions, userCase);
    }
  }
  handleTableChange = (pagination, filters, sorter) => {
    const { dataSet, model, conditions, userCase } = this.props;
    let sortExpressions = [];
    let newDataset = JSON.parse(JSON.stringify(this.dataSet));

    if (dataSet.sortConditions) {//老
      sortExpressions = [dataSet.sortConditions];
    } else if (dataSet.sortExpressions && dataSet.sortExpressions.length) {//新
      sortExpressions = dataSet.sortExpressions;
    }
    if (sorter && sorter.order) {
      this.sorter = sorter;
    }
    if (this.sorter && this.sorter.order) {
      if (!this.sorter.column.sortfieldName) {
        Message.error('排序字段为空');
        return;
      }
      if (!this.sorter.column.sortGroupName) {
        sortExpressions = [{ order: this.sorter.order, sortfieldName: this.sorter.column.sortfieldName }];
      } else {
        let sortGroupName = sorter.column.sortGroupName.split('.')[1];
        let index = newDataset.groupFields.findIndex(g => g.groupExpression == sortGroupName);
        if (index != -1) {
          newDataset.groupFields[index].sortExpressions = [
            {
              sortfieldName: sorter.column.sortfieldName,
              order: sorter.order,
            }
          ]
        }
      }
    }

    // if (userCase && Object.keys(userCase).length) {

    this.setState({
      current: pagination.current,
      data: null//改变分页
    });

    //   this.props.booksReport.refreshByModalId(this.props.booksReport.params, pagination.current);

    // } else {
    // debugger

    if (newDataset.pageSize != pagination.pageSize) {
      newDataset.pageSize = pagination.pageSize;
      this.dataSet = newDataset;
    }
    this.tableManager.refreshTable(newDataset, model, conditions, pagination.current, sortExpressions, userCase);
    // }
  }
  setPrintTemplateList (widths, tableWidth) {
    if (!this.printTemplateList.length) {
      this.printTemplateList.push({
        isDefault: true,
        widths,
        tableWidth,
      })
    }
  }
  getPrintTemplate () {
    const index = this.printTemplateList.findIndex(g => g.isDefault);
    return this.printTemplateList[index];
  }
  setTableWidthsTag (i, distanceX) {
    if (this.props.tableType === MATRIX2) {
      const { dataSet, model, conditions, userCase } = this.props;
      this.matri2Model = this.matri2Model || Matri2xUtil.JsonToTable(_.cloneDeep(model))
      const { tableRows, widths } = this.matri2Model;
     
      for (let index = 0; index < tableRows.length; index++) {
        let row = tableRows[index];
        let c = row.findIndex(item => item.textBox.id == i)
        if (c != -1) {
          widths[c] += distanceX
          break;
        }
      }

      this.tableManager.refreshTable(dataSet, {...model,widths}, conditions, 1, [], userCase);
      return;
    }
    this.setState({
      printInfo: {
        i, distanceX
      }
    })
  }
  setVhTableScroll = (scrollLeft) => {
    this.setState({
      scrollLeft
    })
  }
  render () {
    console.log(this.props.userCase, 'usercase')
    let content;
    const model = this.props.model;
    if (!model) {
      content = '表格模型不正确。';
    } else if (!this.state.data && this.state.errorMessage) {
      content = `数据查询失败，错误原因(${this.state.errorMessage}),详情请查看日志。`;
    } else if (!this.state.data) {
      content = <Spin style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        marginTop: '-52px',
        marginLeft: '-60px'
      }
      } />;
    } else if (this.state.data === 'error') {
      content = `数据查询失败，错误原因(${this.state.errorMessage || ''}),详情请查看日志`;
    } else if (this.state.errorMessage) {
      content = this.state.errorMessage;
    } else {

      const tableType = this.props.tableType;
      const tableTemplate = this.tableManager.getTable(this.props.conditions);

      content = (
        <div style={{ width: '100%', position: 'relative', height: '100%',  }}>
          {
            this.HeadData.isShow && this.tableManager.getMessageHeadOrFoot({ ...this.HeadData, tableType, width: this.tableManager.getTableWidth() })
          }
          {
            tableTemplate
          }
          {
            this.footData.isShow && this.tableManager.getMessageHeadOrFoot({ ...this.footData, tableType, width: this.tableManager.getTableWidth() })
          }
        </div>
      )




    }
    return content;
  }
}
export default VHTable;
