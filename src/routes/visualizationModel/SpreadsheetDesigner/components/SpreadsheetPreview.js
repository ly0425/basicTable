import React, { Component } from 'react';
import { Spin } from '@vadp/ui';
import addressConverter from 'xlsx-populate/lib/addressConverter';
import CellCache from './Expression/CellCache';
import { defaultTextBox } from 'model/ReportModel/Spreadsheet';
import EditGrid, { getRenderRange, isRangeEqual } from '../../components/EditGrid';
import TextBox from '../../components/TextBox';
import PropertyUtils from '../../tableDesigner/components/PropertyUtils';
import produce from 'immer';
import RuntimeProcess from '../RuntimeProcess';
import Common from '~/components/Print/Common';
const comm = new Common();
import { getExpandData, getExpandDataByGroupInfo, CommonServerError } from '../SpreadsheetApi';
import * as SpreadsheetUtils from './SpreadsheetUtils';
import { getEditingFields } from './SpreadsheetParamModal';
import Message from '~/components/Public/Message';

/**
 * 格式化预览的值
 * @param {*} cell 单元格对象
 * @param {*} table 表格对象
 */
const formatPreviewValue = (cell, table) => {
  if (cell.measureTitle && table && table.spreadsheetType === 'specialCost') {
    return cell.measureTitle;
  }
  let value;
  if (cell.isFormula) {
    if (!cell.loading) {
      value = cell.result;
    }
  } else {
    value = cell.textBox.value;
  }
  if (typeof value === 'boolean') {
    return value.toString().toUpperCase();
  } else {
    const formatObject = cell.textBox && cell.textBox.formatObject;
    const { value: formula } = cell.textBox;
    const result = formatObject ? PropertyUtils.conversionFormat(value, formatObject) : value;
    if (typeof result === 'undefined') {
      return '';
    } else if (typeof result === 'object' && !result) {
      return '';
    } else if (formatObject && cell.textBox.formatObject.type === 'Number' && value === '') {
      return '0.00';
    } else {
      return `${result}`;
    }
  }
};
export class PreviewCell extends Component {

  formatValue() {
    const { cell, table } = this.props;
    return formatPreviewValue(cell, table);
  }

  render() {
    const { cell } = this.props;
    if (cell.loading) {
      return (<div style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Spin size="small" />
      </div>);
    }
    const { rowIndex, columnIndex, width, height, editingCell } = this.props;
    const value = this.formatValue();
    const textBox = { ...cell.textBox, value };

    // let style = SpreadsheetUtils.getCssStyle(cell.textBox);
    // delete style.color;
    // TODO 现在使用皮肤中的默认颜色。增加前景色设置的功能后，此行要去掉
    // delete textBox.fontColor;

    return (
      <TextBox
        onBeginEdit={this.props.dbClick}
        textBox={textBox}
        defaultTextBox={defaultTextBox}
        {...{ rowIndex, columnIndex, width, height }}
        fontSizeUnit='pt'
      />
    );
  }
}

/** 生成成本特殊报表的维度成员信息 */
function get_list_groupinfo(table) {
  if (table.spreadsheetType === 'specialCost') {
    const list_groupinfo = [];
    const { tableRows } = table;
    for (let i = 0; i < tableRows.length; i++) {
      const row = tableRows[i];
      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        // 找到单元格上的维度成员信息，添加到 list_groupinfo 上
        if (cell.dimMember) {
          const item = list_groupinfo.find(x => x.aliasName === cell.dimMember.aliasName
            && x.tableName === cell.dimMember.tableName);
          if (item) {
            item.selectedGroupFieldsValue.push(cell.dimMember.dimensionSpecificVal);
          } else {
            list_groupinfo.push({
              aliasName: cell.dimMember.aliasName,
              tableName: cell.dimMember.tableName,
              selectedGroupFieldsValue: [cell.dimMember.dimensionSpecificVal],
            });
          }
        }
      }
    }
    console.log('list_groupinfo', list_groupinfo);
    if (list_groupinfo.length > 0) {
      return list_groupinfo;
    }
  }
}

class SpreadsheetPreview extends Component {
  static fetchDashboardParams(table) {
    return getEditingFields(table);
  }

  cellCache = new CellCache();
  subscription;

  constructor(props) {
    super(props);
    this.state = {
      renderRange: null,
      table: props.table,
    };
  }

  /** 获取打印的表格 */
  getPrintTable = () => {
    const result = produce(this.state.table, draft => {
      const { tableRows } = draft;
      for (const row of tableRows) {
        for (const cell of row) {
          // 预览时公式的值存在 result 属性中，给打印用时需要放在 textBox.value 属性中
          if (cell.isFormula) {
            cell.textBox.value = cell.result;
          }
          // 格式化一下
          cell.textBox.value = formatPreviewValue(cell, draft);
        }
      }
    });
    return result;
  }

  // 有没有参数
  hasParams = () => {
    const isEmpty = (value) => {
      return value === undefined || value === null || value === '';
    };
    const { params, conditions } = this.props;
    return (params && params.length > 0 && params.find(p => !isEmpty(p.values)))
      || (conditions && conditions.length > 0 && conditions.find(p => !isEmpty(p.values)));
  }

  // 是否需要参数
  needParams = () => {
    const noNeedParams = this.props.table.noNeedParams;
    // 默认情况下，展开的表有参数值才查，没参数值不查
    if (!noNeedParams || noNeedParams === 'default') {
      return this.hasExpandRows();
    }
    return noNeedParams !== 'y';
  }

  hasExpandRows = () => {
    const { table: { rowProps } } = this.props;
    return !!rowProps.find(prop => prop.rowType === 'expand');
  }

  setStateAsync = (state) => {
    return new Promise((resolve, reject) => {
      this.setState(state, () => resolve());
    });
  }

  async loadRuntimeTemplate() {
    try {
      this.setState({ loading: true });
      const { table } = this.props;
      const sheet = produce(table, draft => {
        const { rowProps } = draft;
        // 补充行 id
        for (const rowProp of rowProps) {
          if (!rowProp.id && rowProp.rowType !== 'float') {
            rowProp.id = comm.genId('R');
          }
        }
      });

      await this.setStateAsync({ table: { ...sheet, template: sheet } });

      const excel = SpreadsheetUtils.tableToJson([{ present: this.state.table }]);
      let biParams = [];
      // 合并两个参数数组用于过滤,conditions优先  by hzs
      const { conditions = [], params = [] } = this.props;
      const filterArray = [...conditions, ...params];
      const filterKeys = {};
      for (const param of filterArray) {
        const { fieldName } = param;
        // 如果没有添加该fileName的数据
        if (!filterKeys[fieldName]) {
          biParams.push(param);
          // 已经添加过的fileName设置为true
          filterKeys[fieldName] = true;
        }
      }
      // if (this.props.params) biParams = biParams.concat(this.props.params);
      // if (this.props.conditions) biParams = biParams.concat(this.props.conditions);
      let expandData;
      if (this.state.table.spreadsheetType === 'specialCost') {
        expandData = await getExpandDataByGroupInfo({ excel: excel, biParams, list_groupinfo: get_list_groupinfo(this.state.table) });
      } else {
        expandData = await getExpandData({ excel: excel, biParams, });
      }
      await this.loadRuntimeData(expandData);
    } catch (err) {
      if (err instanceof CommonServerError) {
        Message.error(err.message);
      } else {
        Message.error('展开并计算失败');
      }
    } finally {
      this.setState({ loading: false });
    }
  }
  async loadRuntimeData(expandData) {
    await this.setState(state => {
      const table = produce(state.table, sheet => {
        const fixedMap = null;
        const floatAreaMap = null;
        const dataId = undefined;
        sheet.dataId = dataId;
        sheet.fixedMap = fixedMap || {};

        sheet.floatIds = {};
        sheet.floatAreaMap = {};
        sheet.expandData = RuntimeProcess.correctExpandData(expandData);
        // sheet.expandData = expandData;
        if (sheet.spreadsheetType === 'specialCost') {
          // 成本特殊表格，不展开，按维度成员把对应度量值填入
          this.loadMeasureByDimMember(sheet, expandData);
        } else {
          // 普通表格，展开
          RuntimeProcess.expandRows(sheet, floatAreaMap, expandData);
        }
      });
      return { table };
    }, () => {
      const sheet = this.state.table;
      this.cellCache.setContext({
        get sheet() {
          return sheet;
        },
        get tableRows() {
          return sheet.tableRows;
        },
        get params() {
          return this.props.params;
        },
      });
      this.beginLoad();
    });
  }
  /** 加载维度成员对应的度量值 */
  loadMeasureByDimMember(sheet, expandData) {
    const { tableRows, rowProps, colProps } = sheet;
    for (let i = 0; i < rowProps.length; i++) {
      const rowProp = rowProps[i];
      if (rowProp.analysisModelId) {
        const ids = Object.keys(expandData);
        const id = ids.find(x => x === rowProp.id);
        if (id) {
          const expandMap = expandData[id].expandMap;
          const expandRow = tableRows[i];
          for (let j = 0; j < expandRow.length; j++) {
            const cell = expandRow[j];
            const dataArray = expandMap[cell.textBox.value];
            if (dataArray) {
              console.log('展开的值：', cell.textBox.value, dataArray);
              for (let m = 0; m < tableRows.length; m++) {
                const row = tableRows[m];
                for (let n = 0; n < row.length; n++) {
                  const cell = row[n];
                  if (cell.dimMember) {
                    // 返回的数据里，包含了度量数据和维度成员数据，并且索引是对应的。
                    // 先在维度成员数组里找到维度成员的索引，再按索引找到度量数据。
                    const { aliasName } = cell.dimMember;
                    const dimFieldKey = `=Fields.${aliasName}`;
                    const dimDataArray = expandMap[dimFieldKey];
                    if (dimDataArray) {
                      const dataIndex = dimDataArray.findIndex(x => x === cell.dimMember.dimensionSpecificVal);
                      if (dataIndex >= 0 && dataIndex < dataArray.length) {
                        row[j].textBox.value = dataArray[dataIndex];
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // 初始化预览表格，单元格中带有公式计算结果的信息
  beginLoad() {
    const that = this;
    const { table } = this.state;
    const array = [];
    const loadingTable = produce(table, function (draft) {
      const { tableRows } = draft;
      for (let i = 0; i < tableRows.length; i++) {
        const row = tableRows[i];
        for (let j = 0; j < row.length; j++) {
          const cell = row[j];
          const { value, formula } = cell.textBox;
          if (typeof value === 'string' && value.trim().indexOf('=') === 0) {
            cell.isFormula = true;
            cell.loading = true;
            const address = addressConverter.columnNumberToName(j + 1) + (i + 1);
            const observable = that.cellCache.getCellValue({ address, formula: value });
            const observer = {
              next: (result) => {
                that.onFormulaComputed(i, j, result);
              },
              error: (ex) => {
                that.onFormulaComputed(i, j, ex.message);
              },
            };
            array.push({ observable, observer });
            //
          } else if (typeof formula === 'string' && formula.trim().indexOf('=') === 0 && formula.trim().indexOf('Fields') === -1 && !value) {
            cell.isFormula = true;
            cell.loading = true;
            const address = addressConverter.columnNumberToName(j + 1) + (i + 1);
            const observable = that.cellCache.getCellValue({ address, formula });
            const observer = {
              next: (result) => {
                that.onFormulaComputed(i, j, result);
              },
              error: (ex) => {
                that.onFormulaComputed(i, j, ex.message);
              },
            };
            array.push({ observable, observer });
          }
        }
      }
    });
    this.setState({ table: loadingTable }, () => {
      for (const item of array) {
        const sub = item.observable.subscribe(item.observer);
        if (this.subscription) {
          this.subscription.add(sub);
        } else {
          this.subscription = sub;
        }
      }
      // 统一发送请求，计算所有指标
      setTimeout(() => that.cellCache.indexServ.flush(this.props.params), 0);
    });
  }
  // 单元格公式计算结束，更新状态
  onFormulaComputed(row, col, result) {
    this.setState((state) => {
      const { table } = state;
      const newTable = produce(table, function (draft) {
        const { tableRows } = draft;
        const cell = tableRows[row][col];
        cell.loading = false;
        cell.result = result;
      });
      return {
        table: newTable,
      }
    });
  }
  resizeTid;
  componentDidMount() {
    // 监听尺寸变化
    const elementResizeDetectorMaker = require("element-resize-detector");
    const erd = elementResizeDetectorMaker();
    const that = this;
    erd.listenTo(this.refs.canvas, function (element) {
      clearTimeout(that.resizeTid);
      that.resizeTid = setTimeout(function () {
        that.lazyLoad();
      }, 200);
    });

    erd.listenTo(this.grid, function () {
      that.lazyLoad();
    });

    if (!this.needParams() || this.hasParams()) {
      // 开始计算
      this.loadRuntimeTemplate();
    }
  }
  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.cellCache.clearAll();
  }
  handleGridLoad = (grid) => {
    this.grid = grid;
    this.lazyLoad();
  };
  lazyLoad = () => {
    this.setState(state => {
      const { table } = state;
      if (!table) return;
      const renderRange = getRenderRange(this.grid, this.refs.canvas, table.widths, table.heights);
      if (!renderRange) {
        return;
      }
      if (!isRangeEqual(state.renderRange, renderRange)) {
        // 'console'.log(renderRange);
        return { renderRange };
      }
    });
  };
  renderCellContent = (cellProps) => {
    return (
      <PreviewCell {...cellProps} table={this.state.table} />
    );
  };
  render() {
    const gridStyle = {};
    const noParamsStyle = { visibility: 'collapse' };
    if (this.needParams() && !this.hasParams()) {
      gridStyle.visibility = 'collapse';
      noParamsStyle.visibility = undefined;
    }
    if (this.state.loading) {
      gridStyle.visibility = 'collapse';
    }
    const { table } = this.state;
    return (
      <div
        className='spreadsheet-preview'
        style={{ maxHeight: '100%', height: '100%', overflow: 'auto' }}
        onScroll={this.lazyLoad}
        ref='canvas'>
        <EditGrid
          style={gridStyle}
          left={0}
          onLoad={this.handleGridLoad}
          tableRows={table.tableRows}
          widths={table.widths}
          heights={table.heights}
          renderCellContent={this.renderCellContent}
          lazy={true}
          renderRange={this.state.renderRange}
        />
        {this.state.loading && <Spin />}
        <div style={noParamsStyle}>请设置参数</div>
      </div>
    );
  }
}

export default SpreadsheetPreview;
