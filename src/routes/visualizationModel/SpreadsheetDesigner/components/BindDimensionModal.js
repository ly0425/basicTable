/**
 * 浮动行绑定维度
 */
import React from 'react';
import { Modal, Table, Input, message, Button, Tabs, Upload, Row, Col, Select } from '@vadp/ui';
import { fetchFloatDimensionValues, fetchDimensionValues } from '../BudgetApi';
import UploadExcel from './UploadExcel';
import XlsxPopulate from 'xlsx-populate';
import addressConverter from 'xlsx-populate/lib/addressConverter';
import FunctionsContext, * as Functions from '~/routes/visualizationModel/SpreadsheetDesigner/formulaCalc/Functions.js';

const { TabPane } = Tabs;
const { Search } = Input;
const { Option } = Select;
class BindDimensionModal extends React.PureComponent {

  constructor(props) {
    super();
    this.columns = [
      // {
      //   title: 'id',
      //   dataIndex: 'id',
      //   width: props.dimProps.length === 0 ? '30%' : '15%'
      // },
      {
        title: '编号',
        dataIndex: 'code',
        width: props.dimProps.length === 0 ? '35%' : '15%'
      },
      {
        title: '名称',
        dataIndex: 'display',
        width: props.dimProps.length === 0 ? '60%' : '20%'
      },
    ];
    this.dimIndexs = []
    for (let i = 0, j = props.dimProps.length; i < j; i++) {
      let title = props.dimProps[i].displayName;
      const dataIndex = props.dimProps[i].fieldName
      if (title === dataIndex) {
        const { colProps, tableRows } = props;
        for (let i = 0, j = colProps.length; i < j; i++) {
          if (colProps[i].dimProp && colProps[i].dimProp.fieldName === dataIndex) {
            this.dimIndexs.push(i);
          }
        }
        for (let i = 0, j = this.dimIndexs.length; i < j; i++) {
          for (let m = 0, n = tableRows.length; m < n; m++) {
            if (tableRows[m][this.dimIndexs[i]].dimProp && tableRows[m][this.dimIndexs[i]].dimProp.fieldName === dataIndex) {
              title = tableRows[m][this.dimIndexs[i]].textBox.value;
            }
          }
        }
      }
      this.columns.push({
        title,
        dataIndex,
        width: `${50 / props.dimProps.length}%`
      });
    }
    this.state = {
      TabLists: [
        {
          id: '0-1',
          title: '正常绑定'
        },
        {
          id: '0-2',
          title: 'excel导入'
        },
      ],
      selectedTab: '0-1',
      data: [],
      selectedKeys: [],
      selectedRows: [],
      dataLoading: false,
      selectedRowKeys: [],
      searchDim: 'code'
    }
  }

  componentDidMount() {
    this.loadData(this.props)
  }

  // componentWillReceiveProps(newProps) {
  //   if (newProps.bindDimensionDataKey && newProps.bindDimensionDataKey !== this.props.bindDimensionDataKey) {
  //     this.loadData(newProps)
  //   }
  // }

  // 加载当前浮动行上单元格上绑定的维度成员信息
  loadData = async (props) => {
    const { bindDimensionDataKey, pageParams, floatRowDimensionCondition, currentTableRows, floatRowIndex } = props;
    const { data } = this.state;

    if (data.length === 0) {
      this.setState({
        dataLoading: true
      })
      if (bindDimensionDataKey && pageParams) {
        const params = {
          dimId: bindDimensionDataKey,
          mainId: pageParams.mainId,
          compCode: pageParams.compCode,
          copyCode: pageParams.copyCode,
          acctYear: pageParams.acctYear,
          deptId: pageParams.deptId,
          conditions: (floatRowDimensionCondition ? floatRowDimensionCondition.map(item => {
            let { fieldDescribe, value, ...arg } = item;
            let result;
            while ((result = /([a-zA-Z]+)([$]+)/g.exec(value), result !== null)) {
              let exp = result[0];
              let col = addressConverter.columnNameToNumber(result[1]) - 1;
              let cell = currentTableRows[floatRowIndex][col];
              if (cell) {
                value = value.replace(exp, cell.textBox.value || '');
              } else {
                value = value.replace(exp, '');
              }
            }
            if (/\(\)$/g.test(value)) {
              value = value.replace(/\(\)$/g, '');
              if (Functions[value] !== undefined) {
                value = Functions[value]();
              }
            }
            return { ...arg, value };
          }).filter(item => item.value) : [])
        }

        try {
          let itemStoreId;
          // 如果当前为事项明细，需要把事项传过去做为过滤条件。
          if (bindDimensionDataKey === 'ITEM_STORE_DETAIL_ID') {
            let itemStoreCell = currentTableRows[floatRowIndex][0];
            if (itemStoreCell.dimensionData
              && itemStoreCell.dimensionData.dimension
              && itemStoreCell.dimensionData.dimension.id === 'ITEM_STORE_ID'
              && itemStoreCell.dimensionData.value) {
              itemStoreId = itemStoreCell.dimensionData.value.id;
            }
          }
          let list = await fetchFloatDimensionValues(bindDimensionDataKey, params, props.dimProps.map(item => item.fieldName), itemStoreId);
          list = list.map(i => {
            return {
              display: i.name,
              ...i,
              key: i.id
            }
          });
          this.setState({
            data: list,
            dataLoading: false
          })
        } catch (e) {
          this.setState({
            dataLoading: false
          })
        }
      }
    }
  }

  // 记录表格中选中的维度成员
  selectedKeys = (selectedRowKeys, selectedRows) => {
    this.setState({
      selectedRowKeys,
      selectedRows
    })
  }

  // 基于当前加载出来的维度成员进行关键字匹配过滤搜索
  search = (value) => {
    if (value && value.trim()) {
      const { data, searchDim } = this.state;
      const matchResult = [];
      data.forEach(i => {
        // if (i.display.indexOf(value) > -1 || i.code.indexOf(value) > -1) {
        //   matchResult.push(i)
        // }
        if (i[searchDim].indexOf(value) > -1) {
          matchResult.push(i);
        }
      });
      this.setState({
        searchResult: matchResult
      });
    }
    else {
      this.setState({
        searchResult: undefined
      });
    }
  }

  bindDimension = async () => {
    const { selectedRowKeys, data, selectedTab } = this.state;
    const { bindDimDisplay } = this.props;
    if (selectedTab == '0-1') {
      if (selectedRowKeys.length === 0) {
        message.warn('请选择成员！')
        return false;
      }
      const list = []
      data.forEach(i => {
        const match = selectedRowKeys.find(key => key === i.id);
        if (match) {
          list.push(i)
        }
      });
      this.props.bindDimension(list);
    } else {
      const excelInfo = this.uploadExcel.getFileList();

      if (excelInfo.startRow == null || excelInfo.endRow == null || !excelInfo.file || excelInfo.dimensionCol == null) {
        message.warn('请上传excel文件并填写维度行及起始行和结束行！')
        return false;
      }
      if (isNaN(excelInfo.startRow) || isNaN(excelInfo.endRow) || isNaN(excelInfo.dimensionCol)) {
        message.warn('维度行及起始行和结束行必须为数字！')
        return false;
      }
      try {
        await XlsxPopulate.fromDataAsync(excelInfo.file)
          .then(workbook => {
            const sheets = workbook.sheets();
            if (sheets[0]) {
              const { startRow, endRow, dimensionCol, } = excelInfo;
              let dimensions = this.state.data;
              const { _rows } = sheets[0];
              const col = dimensionCol;
              let newRows = _rows.slice(startRow, parseInt(endRow) + 1);
              let bindList = [];
              let errList = [];
              let list = [];
              newRows.forEach(item => {
                bindList.push(item._cells[col]._value || '')
              })
              // console.log(bindList, newRows)
              bindList.forEach((item, i) => {
                let current = dimensions.find(c => c.display === item);
                if (current) {
                  list.push(current);
                } else {
                  errList.push(`第${i + parseInt(startRow)}行第${col}列的值:${item}不是维度：${bindDimDisplay}的成员`)
                }
              })
              if (errList.length) {
                message.warn(errList.join(','))
                return false;
              }
              this.props.bindDimension(list);
            } else {
              throw new Error("excel中sheets不存在");
            }
          });
      }
      catch (err) {
        console.warn('错误', err);
        message.error('文件解析失败，请检查输入得维度行,起始行,结束行');
        return;
      }

    }

    this.afterClose();
  }

  afterClose = () => {
    this.setState({
      selectedKeys: [],
      selectedRows: [],
      searchResult: undefined,
      selectedRowKeys: []
    })
  }
  tabChange = (selectedTab) => {
    this.setState({ selectedTab })
  }
  searchDimChange = (value) => {
    this.setState({ searchDim: value });
  }
  render() {
    const { visible, onCancel, cancelBind, existedDimValueIdSet } = this.props;
    const { dataLoading, searchResult, data, selectedRowKeys, selectedRows, selectedTab, TabLists } = this.state;
    const rowSelection = {
      onChange: this.selectedKeys,
      selectedRowKeys,
      getCheckboxProps: record => ({
        disabled: existedDimValueIdSet.has(record.id),
      }),
    };
    let template = null;
    if (selectedTab == '0-1') {
      template = (
        <React.Fragment>
          <div style={{ marginBottom: '12px' }}>
            <Select value={this.state.searchDim} onChange={this.searchDimChange} style={{ width: 160, marginRight: 12 }} >
              {
                this.columns.map(dim => <Option key={dim.dataIndex} value={dim.dataIndex}>{dim.title}</Option>)
              }
            </Select>
            <Search
              placeholder="搜索维度成员"
              onSearch={this.search}
              style={{ width: 400 }}
            />
          </div>
          <div style={{ height: '240px' }}>
            <Table
              rowSelection={rowSelection}
              columns={this.columns}
              dataSource={searchResult || data}
              loading={dataLoading}
              locale={{ emptyText: '暂无数据' }}
              scroll={{ y: 149 }}
              pagination={{ defaultCurrent: 1, pageSize: 50, total: searchResult ? searchResult.length : data.length }}
            />
          </div>
          <Button
            onClick={cancelBind}
            style={{
              position: 'absolute',
              bottom: '10px'
            }}
          >
            删除维度信息
        </Button>
        </React.Fragment>
      )

    } else {
      template = (<React.Fragment>
        <UploadExcel ref={ref => this.uploadExcel = ref} />
      </React.Fragment>)
    }
    return (<Modal
      title='绑定维度'
      visible={visible}
      onOk={this.bindDimension}
      onCancel={() => { this.afterClose(); onCancel(); }}
      maskClosable={false}
      width={1000}
      afterClose={this.afterClose}

    >
      <section style={{ height: '350px', }}>
        <Tabs activeKey={selectedTab} onChange={this.tabChange}>
          {
            TabLists.map(item => (<TabPane tab={item.title} key={item.id}>
              {template}
            </TabPane>))
          }
        </Tabs>

      </section>
    </Modal>)
  }
}

export default BindDimensionModal;
