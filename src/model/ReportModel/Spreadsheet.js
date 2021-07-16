import { createEditGridModel, isCross, isRectEqual, isRangesCross } from './EditGridModel';
import produce, { setAutoFreeze, enableES5 } from 'immer';
import Message from 'public/Message';
import XlsxPopulate from 'xlsx-populate';
import * as SpreadsheetUtils from '@/routes/visualizationModel/SpreadsheetDesigner/components/SpreadsheetUtils';
import { getSelectRect } from './RectLogic';
import Common from '@/components/Print/Common';
import { tableToSheet, sheetToTable } from '../XlsxUtils';
const comm = new Common();
enableES5();

const defaultTextBoxWidth = 80;
const defaultTextBoxHeight = 24;
const defaultTextBoxFamily = '宋体';
const defaultTextBoxSize = 12;
const defaultTextBoxHorizontal = 'Center';
const defaultTextBoxVertical = 'Middle';
const defaultTextBoxBorderColor = 'Transparent';
const defaultTextBoxBorderWidth = 1;
const defaultTextBoxFontStyle = 'hidden';
const defaultTextBoxBackGroundColor = undefined;
const defaultTextBoxPadding = 0;

function deepFreeze(obj) {
  var propNames = Object.getOwnPropertyNames(obj);
  propNames.forEach(function (name) {
    var prop = obj[name];
    if (typeof prop == 'object' && prop !== null) {
      deepFreeze(prop);
    }
  });
  return Object.freeze(obj);
}

function inDevelopment() {
  return false;
  return (typeof process !== "undefined" && process.env.NODE_ENV === "development");
}

if (inDevelopment()) setAutoFreeze(true);
else setAutoFreeze(false);

// 提供默认样式用的。单元格里只存设置过的样式，其他的从这里取
export const defaultTextBox = {
  id: '',
  name: '',
  edit: '',
  location: { left: 0, top: 0 },
  size: { width: defaultTextBoxWidth, height: defaultTextBoxHeight },
  backGroundColor: defaultTextBoxBackGroundColor,
  // fontColor: getDefaultColor(),
  horizontalAlignment: defaultTextBoxHorizontal,
  verticalAlignment: defaultTextBoxVertical,
  wrap: 'wrap',
  // bindDimension: '',
  fontInfo: {
    family: defaultTextBoxFamily,
    size: defaultTextBoxSize,
    fontType: 'Normal',
    fontWeight: 'Normal',
    fontDecoration: 'Normal',
  },
  value: '',
  formatString: '',
  frameBorder: {
    borderWidths: {
      top: defaultTextBoxBorderWidth,
      bottom: defaultTextBoxBorderWidth,
      left: defaultTextBoxBorderWidth,
      right: defaultTextBoxBorderWidth,
    },
    borderLineStyles: {
      left: defaultTextBoxFontStyle,
      right: defaultTextBoxFontStyle,
      top: defaultTextBoxFontStyle,
      bottom: defaultTextBoxFontStyle,
    },
    borderColors: {
      top: defaultTextBoxBorderColor,
      bottom: defaultTextBoxBorderColor,
      left: defaultTextBoxBorderColor,
      right: defaultTextBoxBorderColor,
    },
    borderShowStyle: {
      top: defaultTextBoxFontStyle,
      bottom: defaultTextBoxFontStyle,
      left: defaultTextBoxFontStyle,
      right: defaultTextBoxFontStyle,
    },
    padding: {
      top: '',
      bottom: '',
      left: '',
      right: ''
    }
  },
  borderColor: defaultTextBoxBorderColor,
  borderWidth: defaultTextBoxBorderWidth,
  borderStyle: defaultTextBoxFontStyle,
  borderPadding: defaultTextBoxPadding,
};

function createNewTextBox() {
  // 默认样式不在这里存
  let textBox = {
    // 更新样式
    updateStyle(style) {
      Object.keys(style).forEach(key => {
        let value = style[key];
        if (this[key] && typeof value === 'object') {
          Object.assign(this[key], value);
        } else {
          this[key] = value;
        }
      });
    },

    // 更新字体
    updateFont(fontInfo) {
      if (this.fontInfo) {
        Object.assign(this.fontInfo, fontInfo);
      } else {
        this.fontInfo = { ...fontInfo };
      }
    },

    // 设置对齐方式
    setAlign(align) {
      this.horizontalAlignment = align;
    },

    // 设置数据格式
    setFormatStyle(value) {
      this.contentSourceStyle = value;
      this.formatObject = { type: value, pattern: 'General' };
    },
    setFormatObject(formatObject) {
      this.formatObject = formatObject && { ...formatObject };
    },
  };

  return textBox;
}

export const textBoxProto = createNewTextBox();

export function createTextBoxModel(text) {
  let result = createNewTextBox();
  if (text) {
    result.value = text;
  }
  return result;
}

function createNewCell() {
  return {
    rowspan: 1,
    colspan: 1,
    display: 1,
    textBox: createNewTextBox()
  };
}

export const cellProto = createNewCell();

export function createCellModel(props) {
  if (!props) {
    return createNewCell();
  }
  let { text, colspan, rowspan, display } = props;
  let cell = {
    rowspan: rowspan || 1,
    colspan: colspan || 1,
    display: display === undefined ? 1 : display,
    textBox: createTextBoxModel(text)
  };
  return cell;
}

function ensureCellBorder(cell, [...borderNames]) {
  if (!cell.border) {
    cell.border = {};
  }
  for (const name of borderNames) {
    if (!cell.border[name]) {
      cell.border[name] = {};
    }
  }
}

const dimensionMap = [
  { cellSpanKey: 'rowspan' },
  { cellSpanKey: 'colspan' },
];

const sideMap = {
  // 四边定义，d: 维度；sign：1起始，-1末尾；startKey, endKey：交叉方向的起始末尾
  top: { D: 0, sign: 1, startKey: 'left', endKey: 'right' },
  bottom: { D: 0, sign: -1, startKey: 'left', endKey: 'right' },
  left: { D: 1, sign: 1, startKey: 'top', endKey: 'bottom' },
  right: { D: 1, sign: -1, startKey: 'top', endKey: 'bottom' },
};

function getCell(tableRows, [index1, index2], index1_D) {
  let cell = (index1_D === 0) ? tableRows[index1][index2] : tableRows[index2][index1];
  return cell;
}

export function* navSelectionInside(tableRows, selection, sideKey) {
  const side = sideMap[sideKey];
  const { [sideKey]: sideIndex, [side.startKey]: startIndex, [side.endKey]: endIndex } = selection;
  let index1 = startIndex;
  while (index1 <= endIndex) {
    let cell = getCell(tableRows, [sideIndex, index1], side.D);
    let index2 = sideIndex;
    while (!cell.display) {
      index2 -= 1;
      cell = getCell(tableRows, [index2, index1], side.D);
    }
    yield cell;
    index1 += cell[dimensionMap[1 - side.D].cellSpanKey];
  }
}

function* navSelectionOutside(tableRows, selection, sideKey) {
  const side = sideMap[sideKey];
  const { [sideKey]: sideIndex, [side.startKey]: startIndex, [side.endKey]: endIndex } = selection;
  if (sideIndex === 0) {
    return;
  }
  const outsideIndex = sideIndex - 1;
  let index1 = startIndex;
  while (index1 <= endIndex) {
    let position = side.D === 0 ? { top: outsideIndex, left: index1 } : { top: index1, left: outsideIndex };
    const cellRange = getSelectRect(tableRows, position, position);
    const cell = getCell(tableRows, [cellRange[sideKey], cellRange[side.startKey]], side.D);
    if (cellRange[side.startKey] >= startIndex && cellRange[side.endKey] <= endIndex) {
      yield cell;
    }
    index1 = cellRange[side.endKey] + 1;
  }
}

export function createSpreadsheet() {
  /**
   * 电子表格原型
   */
  const spreadsheetProto = {
    ...createEditGridModel(), ...{

      defaultCellMinHeight: 5,
      defaultCellHeight: 24,
      defaultCellMinWidth: 5,
      position: { x: 0, y: 0 },
      createCell: createCellModel,
      indexMap: {},
      showFormula: false,
      isSelectTable: false,

      copyCell(cell) {
        const newCell = { ...cell };
        delete newCell.id;
        delete newCell.isUserIndex;
        return newCell;
      },
      updateBudgetTreeFieldFlatList(type) {//修改预算插入行tree结构
        if (!this.budgetTreeFieldFlatList || !this.budgetTreeFieldFlatList.length) {
          return;
        }
        if (!this.selectedRanges || this.selectedRanges.length === 0) {
          return;
        }
        if (this.selectedRanges.find(selection => selection.type !== 'row')) {
          throw { error: '只能对整行选中区域执行插入行' };
        }
        if (isRangesCross(this.selectedRanges)) {
          throw { error: '无法对重叠区域执行插入行' };
        }
        const selection = this.getCurrentSelection();
        let { top, bottom } = selection;
        const status = type == 'up';
        let compare;
        if (status) {
          top += 1;
          compare = top;
        } else {
          bottom += 2;
          compare = bottom;
        }
        for (let item of this.budgetTreeFieldFlatList) {
          if (item.rowIndex >= compare) {
            item.rowIndex += 1;
          }
        }

      },
      getTextBoxValue(row, col) {
        const cell = this.tableRows[row][col];
        return cell.textBox.value;
      },

      tableMoving(x, y) {
        this.position = { x, y };
      },

      tableMoved() { },

      setRowProps(setRowProp) {
        if (!this.selectedRanges) {
          return;
        }
        for (const selection of this.selectedRanges) {
          const { type, top, bottom } = selection;
          if (type === 'row') {
            for (let i = top; i <= bottom; i++) {
              if (!this.rowProps[i]) {
                this.rowProps[i] = {};
              }
              setRowProp(this.rowProps[i]);
            }
          }
        }
      },

      setColProps(setColProp) {
        if (!this.selectedRanges) {
          return;
        }
        for (const selection of this.selectedRanges) {
          const { type, left, right } = selection;
          if (type === 'col') {
            for (let i = left; i <= right; i++) {
              if (!this.colProps[i]) {
                this.colProps[i] = {};
              }
              setColProp(this.colProps[i]);
            }
          }
        }
      },

      updateRowType(value) {
        if (value === 'expand') {
          Message.warning('展开行只能通过拖拽字段来设置。');
          return;
        }
        this.setRowProps(row => {
          row.rowType = value;
          if (value !== 'expand') {
            row.analysisModelId = undefined;
          }
        });
      },

      setRowIsHidden(value) {
        this.setRowProps(row => {
          row.isHidden = value;
        });
      },

      setRowIsRepeatPrint(value) {
        this.setRowProps(row => {
          row.isRepeatPrint = value;
        });
      },

      setRowFilterFormula(value) {
        this.setRowProps(row => {
          row.filterFormula = value;
        });
      },

      setRowComputFilterFormula(value) {
        this.setRowProps(row => {
          row.computFilterFormula = value;
        });
      },

      updateRowExpression(value, text) {
        this.setRowProps(row => {
          row.groupFields = value;
          row.mergeText = `{${text}}`;
          row.isAmount = true;
        });
      },
      updateMergeNumber(value) {
        this.setRowProps(row => {
          row.mergeNumber = value;
        });
      },
      updateRowText(value) {
        this.setRowProps(row => {
          row.mergeText = value;
        });
      },

      // 绑定维度
      setBindDimension(value) {
        const { top, left } = this.selectedRanges[0];
        this.tableRows[top][left].textBox.bindDimension = value.id;
        const dimensionData = {
          dimension: value
        }
        this.tableRows[top][left].dimensionData = dimensionData
        // for (let i = top; i <= bottom; i++) {
        //   for (let j = 0; j < this.tableRows[i].length; j++) {
        //     if (this.tableRows[i][j].textBox) {
        //       this.tableRows[i][j].textBox.bindDimension = value.id;
        //       const dimensionData = {
        //         dimension: value
        //       }
        //       this.tableRows[i][j].dimensionData = dimensionData
        //     }
        //   }
        // }
      },
      setIDField(value) {
        this.updateSelectedCells(cell => {
          cell.textBox.idField = value;
        });
      },
      setHistoryDim(value) {
        this.updateSelectedCells(cell => {
          if (!value) {
            delete cell.historyDim;
          }
          else {
            cell.historyDim = value;
          }
        });
      },

      setHistoryDimYears(value) {
        this.updateSelectedCells(cell => {
          cell.historyDimYears = value;
        });
      },
      setHistoryDimConditions(value) {
        this.updateSelectedCells(cell => {
          cell.historyDimConditions = value;
        });
      },
      setAnalysisModelConditions(value) {
        this.setRowProps(row => {
          row.analysisModelConditions = value;
        });
      },
      setAnalysisSortExpressions(value) {
        this.setRowProps(row => {
          row.sortExpressions = value;
        });
      },
      setCurrentCellDisabled(row, col, value) {
        //暂时取消输入等号后自动禁用编辑功能
        // if (value) {
        //   if (value[0] == '=') {
        //     this.tableRows[row][col].disabled = true;
        //   }
        // }
      },
      setCellDisabled(value) {
        this.updateSelectedCells(cell => {
          cell.disabled = value;
        });
      },
      setCellRequired(value) {
        this.updateSelectedCells(cell => {
          cell.required = value;
        });
      },
      setFloatRowDimensionCondition(selectedRow, selectedCol, floatRowDimensionCondition) {
        this.updateSelectedCells(cell => {
          cell.floatRowDimensionCondition = floatRowDimensionCondition;
        });

      },
      setColDisabled(value) {
        this.setColProps(col => {
          col.disabled = value;
        });
      },
      setColWorkflow(value) {
        this.setColProps(col => {
          col.workflow = value;
        });
      },
      setColIsSum(value) {
        this.setColProps(col => {
          col.isSum = value;
        });
      },

      setColIsHidden(value) {
        this.setColProps(col => {
          col.isHidden = value;
        });
      },
      setColIsCheck(value) {
        this.setColProps(col => {
          col.isCheck = value;
        });
      },
      setColCanEdit(value) {
        this.setColProps(col => {
          col.canEdit = value;
        });
      },
      setColIsCheckOperator(value) {
        this.setColProps(col => {
          col.checkOperator = value;
        });
      },
      setColCompareVal(value) {
        this.setColProps(col => {
          col.compareVal = value;
        });
      },
      setAllBorderStyle(value) {
        if (!this.selectedRanges) {
          return;
        }
        this.setOuterBorderStyle(value);
        this.setInnerBorderStyle(value);
      },
      setAllBorderColor(value) {
        if (!this.selectedRanges) {
          return;
        }
        this.setOuterBorderColor(value);
        this.setInnerBorderColor(value);
      },
      setOuterBorderStyle(value) {
        this.setLeftBorderStyle(value);
        this.setTopBorderStyle(value);
        this.setRightBorderStyle(value);
        this.setBottomBorderStyle(value);
      },
      setOuterBorderColor(value) {
        this.setLeftBorderColor(value);
        this.setTopBorderColor(value);
        this.setRightBorderColor(value);
        this.setBottomBorderColor(value);
      },
      setInnerBorder(action) {
        if (!this.selectedRanges) {
          return;
        }
        for (const selection of this.selectedRanges) {
          let { left, top, right, bottom } = selection;
          for (let rowIndex = top; rowIndex <= bottom; rowIndex++) {
            for (let columnIndex = left; columnIndex <= right; columnIndex++) {
              let cell = this.tableRows[rowIndex][columnIndex];
              if (cell.display) {
                if (rowIndex > top) {
                  ensureCellBorder(cell, ['top']);
                  action(cell.border.top);
                }
                if (columnIndex > left) {
                  ensureCellBorder(cell, ['left']);
                  action(cell.border.left);
                }
                if (columnIndex + cell.colspan - 1 < right) {
                  ensureCellBorder(cell, ['right']);
                  action(cell.border.right);
                }
                if (rowIndex + cell.rowspan - 1 < bottom) {
                  ensureCellBorder(cell, ['bottom']);
                  action(cell.border.bottom);
                }
              }
            }
          }
        }
      },
      setInnerBorderStyle(value) {
        (value === 'none') && (value = '');
        this.setInnerBorder(border => border.style = value);
      },
      setInnerBorderColor(value) {
        this.setInnerBorder(border => border.color = value);
      },
      setLeftBorder(action) {
        if (!this.selectedRanges) {
          return;
        }
        for (const selection of this.selectedRanges) {
          let { left, top, bottom } = selection;
          if (left > 0) {
            for (const cell of navSelectionOutside(this.tableRows, selection, 'left')) {
              if (cell.border && cell.border.right) {
                delete cell.border.right;
              }
            }
          }
          for (let rowIndex = top; rowIndex <= bottom; rowIndex++) {
            let cell = this.tableRows[rowIndex][left];
            if (cell.display) {
              ensureCellBorder(cell, ['left']);
              action(cell.border.left);
            }
          }
        }
      },
      setLeftBorderStyle(value) {
        (value === 'none') && (value = '');
        this.setLeftBorder(border => border.style = value);
      },
      setLeftBorderColor(value) {
        this.setLeftBorder(border => border.color = value);
      },
      setTopBorder(action) {
        if (!this.selectedRanges) {
          return;
        }
        for (const selection of this.selectedRanges) {
          let { left, top, right } = selection;
          if (top > 0) {
            for (const cell of navSelectionOutside(this.tableRows, selection, 'top')) {
              if (cell.border && cell.border.bottom) {
                delete cell.border.bottom;
              }
            }
          }
          for (let columnIndex = left; columnIndex <= right; columnIndex++) {
            let cell = this.tableRows[top][columnIndex];
            if (cell.display) {
              ensureCellBorder(cell, ['top']);
              action(cell.border.top);
            }
          }
        }
      },
      setTopBorderStyle(value) {
        (value === 'none') && (value = '');
        this.setTopBorder(border => border.style = value);
      },
      setTopBorderColor(value) {
        this.setTopBorder(border => border.color = value);
      },
      setRightBorder(action) {
        if (!this.selectedRanges) {
          return;
        }
        for (const selection of this.selectedRanges) {
          for (const cell of navSelectionInside(this.tableRows, selection, 'right')) {
            ensureCellBorder(cell, ['right']);
            action(cell.border.right);
          }
          const { top, bottom, right } = selection;
          if (right + 1 < this.widths.length) {
            for (let rowIndex = top; rowIndex <= bottom; rowIndex++) {
              let cell = this.tableRows[rowIndex][right + 1];
              if (cell.display) {
                if (cell.border && cell.border.left) {
                  delete cell.border.left;
                }
              }
            }
          }
        }
      },
      setRightBorderStyle(value) {
        (value === 'none') && (value = '');
        this.setRightBorder(border => border.style = value);
      },
      setRightBorderColor(value) {
        this.setRightBorder(border => border.color = value);
      },
      setBottomBorder(action) {
        if (!this.selectedRanges) {
          return;
        }
        for (const selection of this.selectedRanges) {
          for (const cell of navSelectionInside(this.tableRows, selection, 'bottom')) {
            ensureCellBorder(cell, ['bottom']);
            action(cell.border.bottom);
          }
          const { left, right, bottom } = selection;
          if (bottom + 1 < this.heights.length) {
            for (let columnIndex = left; columnIndex <= right; columnIndex++) {
              let cell = this.tableRows[bottom + 1][columnIndex];
              if (cell.display) {
                if (cell.border && cell.border.top) {
                  delete cell.border.top;
                }
              }
            }
          }
        }
      },
      setBottomBorderStyle(value) {
        (value === 'none') && (value = '');
        this.setBottomBorder(border => border.style = value);
      },
      setBottomBorderColor(value) {
        this.setBottomBorder(border => border.color = value);
      },
      updateCellIsUserIndex(value) {
        this.updateSelectedCells(cell => {
          cell.isUserIndex = value;
        });
      },
      updateCellIndexName(value) {
        console.log('updateSelectedCells', value)
        this.updateSelectedCells(cell => {
          cell.indexName = value;
        });
      },
      // 区域交换
      exchangeSelection(target) {
        const selection = this.selectedRanges[0];
        const result = getSelectRect(this.tableRows,
          { left: target.left, top: target.top }, { left: target.right, top: target.bottom });
        if (result.right - result.left !== selection.right - selection.left
          || result.bottom - result.top !== selection.bottom - selection.top) {
          Message.warning('无法交换');
          return;
        }
        if (isRectEqual(selection, result)) {
          return;
        }
        if (isCross(selection, result)) {
          Message.warning('目标区域不能和原选中区域相交');
          return;
        }
        for (let i = 0; i <= selection.right - selection.left; i++) {
          for (let j = 0; j <= selection.bottom - selection.top; j++) {
            let tmp = this.tableRows[result.top + j][result.left + i];
            this.tableRows[result.top + j][result.left + i] = this.tableRows[selection.top + j][selection.left + i];
            this.tableRows[selection.top + j][selection.left + i] = tmp;
          }
        }
        if (selection.primary) {
          selection.primary.left += result.left - selection.left;
          selection.primary.top += result.top - selection.top;
        }
        selection.left = result.left;
        selection.right = result.right;
        selection.top = result.top;
        selection.bottom = result.bottom;
      },
      // 拖指标
      fillIndex(row, col, index) {
        let cell = this.tableRows[row][col];
        const { id, code, name } = index;
        cell.textBox.value = '';
        cell.id = id;
        this.indexMap[id] = { code, name };
        cell.isUserIndex = 'y';
      },
      batchFillIndex(indexes) {
        const { tableRows, widths, heights } = this;
        for (const { row, col, index: { id, code, name } } of indexes) {
          const cell = tableRows[row][col];
          cell.id = id;
          this.indexMap[id] = { code, name };
          cell.isUserIndex = 'y';
        }
      },
      setCheckFormulas(checkFormulas) {
        this.checkFormulas = checkFormulas;
      },
      toggleCodeNameFormula() {
        this.showFormula = !this.showFormula;
      },
      replaceAll(search, replacement, range) {
        let isComplate = false;
        for (const row of this.tableRows) {
          for (const cell of row) {
            let value = cell.textBox.value;
            if (typeof value === 'string' && (range !== 'formula' || value.trim().indexOf('=') === 0)) {
              cell.textBox.value = value.split(search).join(replacement || '');
              isComplate = value.split(search).length > 1 ? true : false;
            }
          }
        }
        if (isComplate) {
          Message.success('替换完成！');
        }
        else {
          Message.warning('找不到正在搜索的数据！');
        }
      },
      // 增加删除行列时，更新单元格引用
      beforeInsertRow(index, addRowCount) {
        SpreadsheetUtils.updateSheetCellRefs(this, (row, col) => {
          if (row >= index) {
            return { row: row + addRowCount, col };
          }
          return { row, col };
        });
      },
      beforeInsertColumn(index, addColumnCount) {
        SpreadsheetUtils.updateSheetCellRefs(this, (row, col) => {
          if (col >= index) {
            return { row, col: col + addColumnCount };
          }
          return { row, col };
        });
      },
      beforeRemoveRow(index, removeCount) {
        SpreadsheetUtils.updateSheetCellRefs(this, (row, col) => {
          if (row >= index + removeCount) {
            return { row: row - removeCount, col };
          }
          return { row, col };
        });
      },
      beforeRemoveColumn(index, removeCount) {
        SpreadsheetUtils.updateSheetCellRefs(this, (row, col) => {
          if (col >= index + removeCount) {
            return { row, col: col - removeCount };
          }
          return { row, col };
        });
      },
      onFieldDrop(row, col, field) {
        const rowProp = this.rowProps[row];
        /* start 单行支持多个分析模型绑定 edit by liuran */
        if (rowProp.analysisModelId && field.analysisModelId !== rowProp.analysisModelId) {
          Message.warning('该行已绑定了其他分析模型');
          return;
        }
        rowProp.analysisModelId = field.analysisModelId;
        // let analysisModelId = rowProp.analysisModelId;
        // if (analysisModelId) {
        //   if (analysisModelId.indexOf(field.analysisModelId) === -1) {
        //     analysisModelId += ',' + field.analysisModelId;
        //   }
        // }
        // else {
        //   analysisModelId = field.analysisModelId;
        // }
        // rowProp.analysisModelId = analysisModelId;
        /* end */
        if (rowProp.rowType !== 'float') {
          rowProp.rowType = 'expand';
        }
        const text = `=Fields.${field.aliasName}`;
        let cell = this.tableRows[row][col];
        cell.textBox.value = text;

        /* start 单行支持多个分析模型绑定 edit by liuran */
        cell.textBox.analysisModelId = field.analysisModelId;
        /* end */

        // 保存度量的标题
        cell.measureTitle = field.comments;
      },
      onDimensionDrop(row, col, field) {
        const text = field.dimensionSpecificVal;
        let cell = this.tableRows[row][col];
        cell.textBox.value = text;
        cell.dimMember = field;
      },
      /**
       * 创建浮动行求和公式
       */
      createFloatSumFomula() {
        const selection = this.getCurrentSelection();
        if (!selection) {
          return;
        }
        const { top, left } = selection.primary || selection;
        const { tableRows, rowProps } = this;
        let floatRowIndex = top - 1;
        let floatCell;
        while (floatRowIndex >= 0) {
          const rowProp = rowProps[floatRowIndex];
          const cell = tableRows[floatRowIndex][left];
          if (rowProp.rowType === 'float' && cell.id) {
            floatCell = cell;
            break;
          }
          floatRowIndex -= 1;
        }
        if (floatCell) {
          const cell = tableRows[top][left];
          cell.textBox.value = `=SUM({${this.indexMap[floatCell.id].name}})`;
        } else {
          Message.warning('未找到浮动行指标');
        }
      },

      setAutoMerge(autoMerge) {
        this.updateSelectedCells(cell => cell.autoMerge = autoMerge);
      },

      pasteExcelData(data) {
        const selection = this.getCurrentSelection();
        if (!selection) return;
        const { top, left } = selection;
        const { tableRows, widths, heights } = this;
        for (let i = 0; i < data.length; i++) {
          const dataRow = data[i];
          for (let j = 0; j < dataRow.length; j++) {
            const dataCell = dataRow[j];
            const row = top + i;
            const col = left + j;
            if (row < heights.length && col < widths.length) {
              tableRows[row][col].textBox.value = dataCell;
            }
          }
        }
      },

      selectTable() {
        this.isSelectTable = true;
        this.selectedRanges = undefined;
      },

      setDigit(number) {
        this.digit = number;
      },

      setNoNeedParams(value) {
        this.noNeedParams = value;
      },
      setSpreadsheetType(value) {
        this.spreadsheetType = value;
      },
      setZeroAs(value) {
        this.zeroAs = value;
      },
      setSerialAddress(value) {
        this.serialAddress = value;
      },
      setUploadParameters(obj) {
        this.uploadParameters = obj;
      },
      setCategoryID(value) {
        this.categoryID = value;
      },
      setAnalysisModelID(value) {
        this.analysisModelID = value;
      },
      onPageDimensionDrop(dragData) {
        if (!this.pageDimensions) {
          this.pageDimensions = [];
        }
        console.log(dragData);
        const { direction, dimension, dimensionValues } = dragData;
        if (direction !== 'page') return;
        if (dimension && dimensionValues) {
          this.pageDimensions.push({ dimension, dimensionValues });
        }
      },
      addAuditFormula(auditFormulaList) {
        this.auditFormulaList = auditFormulaList;
      },
      removePageDimension(index) {
        if (this.pageDimensions) {
          this.pageDimensions.splice(index, 1);
        }
      },
      setPageDimensions(pageDimensions) {
        this.pageDimensions = pageDimensions;
        console.log('setPageDimensions', pageDimensions);
      },
      replaceText(rowID, colID, text, description) {
        let TextBoxList = [];
        let tableArray = this.tableRows;
        let cellSelect = this.tableSelect().tableHeader;
        for (let coordinate of cellSelect) {
          let p = SpreadsheetUtils.parsePoint(coordinate);
          let coordinateX = p.row;
          let coordinateY = p.col;
          let cell = tableArray[coordinateX][coordinateY];
          let rowspan = cell.rowspan;
          let colspan = cell.colspan;
          if (rowspan > 1 || colspan > 1) {
            for (let i = coordinateX; i < coordinateX + rowspan; i++) {
              for (let j = coordinateY; j < coordinateY + colspan; j++) {
                // const { textBox } = tableArray[i][j];
                tableArray[i][j].display && TextBoxList.push(tableArray[i][j]);
              }
            }
          } else {
            // const { textBox } = tableArray[coordinateX][coordinateY];
            tableArray[coordinateX][coordinateY].display && TextBoxList.push(tableArray[coordinateX][coordinateY]);
          }
        }
        if (TextBoxList.length > 1) {
          for (let i = 0; i < TextBoxList.length; i++) {
            TextBoxList[i].textBox.value = text;
            if (text && text[0] == '=') {
              TextBoxList[i].disabled = true;
              TextBoxList[i].textBox.formulaDescription = description || '';
            } else {
              TextBoxList[i].disabled = false;
            }

          }
        } else {
          this.tableRows[rowID][colID].textBox.value = text;
          if (text && text[0] == '=') {
            this.tableRows[rowID][colID].disabled = true;
            this.tableRows[rowID][colID].textBox.formulaDescription = description || '';
          } else {
            this.tableRows[rowID][colID].disabled = false;
          }

        }
      },
      // 导出 excel
      exportExcel(callback) {
        XlsxPopulate.fromBlankAsync()
          .then(workbook => {
            const sheet = workbook.sheet('Sheet1');
            tableToSheet(this, sheet, (cell) => {
              return { ...cell, textBox: SpreadsheetUtils.mergeObject(cell.textBox, defaultTextBox) };
            });
            // Write.
            workbook.outputAsync()
              .then(callback);
          });
      },

      // 导入 workbook
      loadWorkbook(workbook, sheetIndex) {
        this.position = { x: 0, y: 0 };
        this.selectedRanges = null;
        this.mark = null;
        this.editingCell = null;
        const sheet = workbook.sheet(sheetIndex);
        sheetToTable(sheet, this, createCellModel);
      },

      updateCellExpandDirection(direction) {
        this.updateSelectedCells(cell => {
          !cell.expand && (cell.expand = {});
          if (direction === 'none') {
            delete cell.expand.direction;
          } else {
            cell.expand.direction = direction;
          }
        });
      },
      updateCellDepend(depend) {
        this.updateSelectedCells(cell => {
          !cell.expand && (cell.expand = {});
          cell.expand.depend = depend;
        });
      },
      updateCellPrintAutoSize(printAutoSize) {
        this.updateSelectedCells(cell => {
          cell.textBox.printAutoSize = printAutoSize;
        });
      },
      updateCellLoanProp(loanProp) {
        this.updateSelectedCells(cell => {
          cell.textBox.loanProp = loanProp;
        });
      },
      setDoNotSum(doNotSum) {
        this.doNotSum = doNotSum;
      },
      setFrozenRow() {
        if (!this.selectedRanges || this.selectedRanges.length === 0) {
          return;
        }
        const selection = this.selectedRanges[0];
        if (selection.type === 'row') {
          const { top } = selection;
          this.frozenRowCount = top + 1;
        }
      },
      clearFrozenRow() {
        this.frozenRowCount = 0;
      },
      setFrozenCol() {
        if (!this.selectedRanges || this.selectedRanges.length === 0) {
          return;
        }
        const selection = this.selectedRanges[0];
        if (selection.type === 'col') {
          const { left } = selection;
          this.frozenColCount = left + 1;
        }
      },
      clearFrozenCol() {
        this.frozenColCount = 0;
      },
      updateDimProp(dimProp) {
        this.updateSelectedCells(cell => {
          cell.dimProp = dimProp;
          delete cell.extendProp;
          if (!cell.textBox.value) {
            cell.textBox.value = dimProp.displayName;
          }
        });
      },
      updateExtendProp(extendProp) {
        this.updateSelectedCells(cell => {
          const { title } = extendProp;
          delete cell.dimProp;
          cell.extendProp = Object.assign(extendProp, {});
          if (!cell.textBox.value) {
            if (extendProp.type === 'dictionary') {
              cell.textBox.value = extendProp.dictionary.displayName;
            }
            else {
              cell.textBox.value = title;
            }
          }
        });
      },
      delDimPropOrExtendProp() {
        this.updateSelectedCells(cell => {
          delete cell.dimProp;
          delete cell.extendProp;
        });
      },
      setTableHeader() {
        this.setRowProps(row => {
          if (row.isReportFooter) {
            Message.warning('此行已被设为表尾！');
            return;
          }
          row.isReportHeader = true;
        });
      },
      setTableFooter() {
        this.setRowProps(row => {
          if (row.isReportHeader) {
            Message.warning('此行已被设为表头！');
            return;
          }
          row.isReportFooter = true;
        });
      },
      cancelTableHeaderOrFooter() {
        this.setRowProps(row => {
          delete row.isReportHeader;
          delete row.isReportFooter;
        });
      },
      setAction(action) {
        this.updateSelectedCells(cell => {
          cell.action = action;
        });
      },
      treeClick(rowIndex, columnIndex) {

        const { tableRows, heights } = this;
        const currentCell = tableRows[rowIndex][columnIndex];
        this.selectedRanges = null;
        let isAn = currentCell.treeInfo.class_name == 'minus-square';
        if (isAn) {
          currentCell.treeInfo.class_name = 'plus-square';

        } else {
          currentCell.treeInfo.class_name = 'minus-square';
        }
        for (let i = rowIndex + 1; i < tableRows.length; i++) {
          let cell = tableRows[i][columnIndex];
          if (!cell.level || (cell.level <= currentCell.level)) {
            break;
          }
          const height = isAn ? 0 : 33;
          heights[i] = height;
        }
      }
      // spreadsheet end
    },
  };

  [
    [spreadsheetProto.tableMoved, '移动表格位置'],
    [spreadsheetProto.loadWorkbook, '导入 Excel'],
    [spreadsheetProto.setAllBorderStyle, '设置边框线'],
    [spreadsheetProto.setOuterBorderStyle, '设置边框线'],
    [spreadsheetProto.setInnerBorderStyle, '设置边框线'],
    [spreadsheetProto.setLeftBorderStyle, '设置边框线'],
    [spreadsheetProto.setRightBorderStyle, '设置边框线'],
    [spreadsheetProto.setTopBorderStyle, '设置边框线'],
    [spreadsheetProto.setBottomBorderStyle, '设置边框线'],
    [spreadsheetProto.setAllBorderColor, '设置边框颜色'],
    [spreadsheetProto.setOuterBorderColor, '设置边框颜色'],
    [spreadsheetProto.setInnerBorderColor, '设置边框颜色'],
    [spreadsheetProto.setLeftBorderColor, '设置边框颜色'],
    [spreadsheetProto.setTopBorderColor, '设置边框颜色'],
    [spreadsheetProto.setRightBorderColor, '设置边框颜色'],
    [spreadsheetProto.setBottomBorderColor, '设置边框颜色'],
    [spreadsheetProto.updateCellExpandDirection, '设置扩展方向'],
    [spreadsheetProto.updateCellDepend, '设置依赖'],
    [spreadsheetProto.updateCellIsUserIndex, '设置是否用户指标'],
    [spreadsheetProto.exchangeSelection, '交换位置'],
    [spreadsheetProto.fillIndex, '绑指标'],
    [spreadsheetProto.onFieldDrop, '拖字段'],
    [spreadsheetProto.updateCellIndexName, (stateBefore, stateAfter, value) =>
      `指标名称设为 "${value}"`],
    [spreadsheetProto.replaceAll, (stateBefore, stateAfter, search, replacement) =>
      `"${search}" 批量替换为 "${replacement}"`],
  ].forEach(a => {
    const f = a[0];
    f.canUndo = true;
    f.description = a[1];
  });

  spreadsheetProto.tableMoving.skipUndo = true;

  return spreadsheetProto;
}

// 开发阶段冻结不可变对象，防止误操作。生产版本不冻结以提升性能。
if (inDevelopment()) {
  deepFreeze(textBoxProto);
  deepFreeze(cellProto);
  deepFreeze(defaultTextBox);
}


const columnGroups = [
  {
    groupby: 'date',
    orderby: 'date asc',
    left: 3,
    right: 5,
  }, {
    groupby: 'money',
  },
];

const dataset = {
  data: { a: 1, b: 2, c: 3 },
  groups: [
    {
      groupby: 'date',
      orderby: 'date asc',
      columns: ['a', 'b'],
      rows: [
        { group: '2017', data: [1, 2] },
        { group: '2018', data: [3, 4] }
      ],
      groups: [],
    }, {
      groupby: 'money',
    },
  ],
};
