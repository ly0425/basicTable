import addressConverter from 'xlsx-populate/lib/addressConverter';
import Common from 'components/Print/Common';
import Message from 'public/Message';
import { getSelectRect } from './RectLogic';
const common = new Common();
const defaultCellMinWidth = 80;
const defaultCellMinHeight = 33;
const defaultCellWidth = 80;
const defaultCellHeight = 33;

// 判断两个矩形是否相交
export function isCross(rect1, rect2) {
  // 求相交区域
  let left = Math.max(rect1.left, rect2.left);
  let top = Math.max(rect1.top, rect2.top);
  let right = Math.min(rect1.right, rect2.right);
  let bottom = Math.min(rect1.bottom, rect2.bottom);
  return left <= right && top <= bottom;
}

// 判断多个矩形是否相交
export function isRangesCross(ranges) {
  if (!ranges || ranges.length < 2) {
    return false;
  }
  for (let i = 0; i < ranges.length - 1; i++) {
    const rect1 = ranges[i];
    for (let j = i + 1; j < ranges.length; j++) {
      const rect2 = ranges[j];
      if (isCross(rect1, rect2)) {
        return true;
      }
    }
  }
  return false;
}

/** 判断两个矩形是否重合 */
export function isRectEqual(rect1, rect2) {
  let result = !['left', 'right', 'top', 'bottom'].find(prop => rect1[prop] !== rect2[prop]);
  return result;
}

// 区域是否包含完整单元格（即没有把某个单元格截断）
function isSelectionFit(selection, tableRows) {
  const rowCount = tableRows.length;
  if (rowCount === 0) {
    return false;
  }
  const colCount = tableRows[0].length;
  const { left, right, top, bottom } = selection;
  if (right > colCount - 1 || bottom > rowCount - 1) {
    return false;
  }

  let rect = getSelectRect(tableRows, { left, top }, { left: right, top: bottom });
  return isRectEqual(rect, selection);
}

/**
 * 获取选中的行
 * @param {*} selectedRanges 造中的所有区域
 */
export function getSelectedRows(selectedRanges) {
  let result = new Set();
  selectedRanges && selectedRanges.forEach(selection => {
    if (selection.type === 'row') {
      for (let i = selection.top; i <= selection.bottom; i++) {
        result.add(i);
      }
    }
  });
  return result;
}

/**
 * 获取选中的列
 * @param {*} selectedRanges 选中的所有区域
 */
export function getSelectedColumns(selectedRanges) {
  let result = new Set();
  selectedRanges && selectedRanges.forEach(selection => {
    if (selection.type === 'col') {
      for (let i = selection.left; i <= selection.right; i++) {
        result.add(i);
      }
    }
  });
  return result;
}


export function createEditGridModel() {

  /**
   * 可编辑 grid 原型
   */
  const editGridProto = {
    // 行数组
    tableRows: [],
    // 列宽数组
    widths: [],
    // 行高数组
    heights: [],
    // 选中部分 [ {left, top, right, bottom, type: 'rect/row/col', primary: {top, left}} ]
    selectedRanges: null,
    // 标示复制、剪切、格式刷的来源范围 {left, top, right, bottom, type: 'copy/cut/brush'}
    mark: null,
    // 当前编辑单元格位置 {row, col}
    editingCell: null,
    rowProps: [],
    colProps: [],
    tableHeader() {
      return this.tableRows;
    },
    // 临时兼容老的写法
    tableSelect() {
      let set = new Set();
      if (!this.selectedRanges) {
        return { tableHeader: set };
      }
      this.selectedRanges.forEach(selection => {
        let { left, top, right, bottom } = selection;
        for (let rowIndex = top; rowIndex <= bottom; rowIndex++) {
          for (let columnIndex = left; columnIndex <= right; columnIndex++) {
            let cell = this.tableRows[rowIndex][columnIndex];
            if (cell.display) {
              set.add(rowIndex + ',' + columnIndex);
            }
          }
        }
      });
      return { tableHeader: set };
    },

    // 选中的单元格
    selectedCells() {
      let cells = [];
      if (!this.selectedRanges) {
        return cells;
      }
      this.selectedRanges.forEach(selection => {
        let { left, top, right, bottom } = selection;
        for (let i = top; i <= bottom; i++) {
          for (let j = left; j <= right; j++) {
            const cell = this.tableRows[i][j];
            if (cell.display) {
              cells.push(cell);
            }
          }
        }
      });
      return cells;
    },

    cellWidthCalculator() {
      const widths = this.widths.toJS();
      let results = {};
      return function (col, colspan) {
        if (!colspan) {
          return 0;
        }
        if (colspan === 1) {
          return widths[col];
        }

        let width = widths.slice(col, col + colspan).reduce((sum, item) => (sum + item), 0);
        return width;
      };
    },

    getCurrentSelection() {
      if (!this.selectedRanges || this.selectedRanges.length === 0) {
        return null;
      } else {
        return this.selectedRanges[this.selectedRanges.length - 1];
      }
    },

    setCurrentSelection(selection) {
      // 如没有选择区域，增加一个区域。如果有，覆盖最后一个区域
      if (!this.selectedRanges || this.selectedRanges.length === 0) {
        this.selectedRanges = [selection];
      } else {
        this.selectedRanges[this.selectedRanges.length - 1] = selection;
      }
    },

    select(selection, isAppend) {
      if (isAppend && this.selectedRanges) {
        this.selectedRanges.push(selection);
      } else {
        this.selectedRanges = [selection];
      }
    },

    /**
     * 选择一个单元格
     * @param {number} row 行索引
     * @param {number} col 列索引
     * @param {bool} isAppend 是否追加
     */
    selectCell(row, col, isAppend) {
      let cell = this.tableRows[row][col];
      const { rowspan, colspan } = cell;
      let selection = {
        left: col, top: row, right: col + colspan - 1, bottom: row + rowspan - 1,
        type: 'rect', primary: { top: row, left: col }
      };
      this.select(selection, isAppend);
    },

    clearSelectCell() {
      this.selectedRanges = null;
    },

    showErrorCells(cells) {
      for (let i = 0, j = this.tableRows.length; i < j; i++) {
        const row = this.tableRows[i];
        for (let m = 0, n = row.length; m < n; m++) {
          delete row[m].isErrorCell;
        }
      }
      for (let i = 0, j = cells.length; i < j; i++) {
        const { row, col } = cells[i];
        this.tableRows[row][col].isErrorCell = true;
      }
    },

    /**
     * 从当前单元格按矩形区域扩选到某单元格
     * @param {number} row 行索引
     * @param {number} col 列索引
     */
    selectRectTo(row, col) {
      const selection = this.getCurrentSelection();
      if (!selection) {
        this.selectCell(row, col);
      } else {
        const start = selection.primary || { top: selection.top, left: selection.left };
        this.selectRect(start, { top: row, left: col });
      }
    },

    // 选择矩形区域
    selectRect(start, target) {
      let selection = getSelectRect(this.tableRows, start, target);
      selection.type = 'rect';
      selection.primary = start;
      this.setCurrentSelection(selection);
    },

    // 全选
    selectAll() {
      if (this.tableRows.length > 0) {
        this.selectedRanges = [{ left: 0, top: 0, right: this.tableRows[0].length - 1, bottom: this.tableRows.length - 1 }];
      }
    },

    clearSelection() {
      this.selectedRanges = [];
    },

    // 选择列
    selectColumn(index, isAppend) {
      let selection = { left: index, top: 0, right: index, bottom: this.tableRows.length - 1, type: 'col' };
      // 设置当前单元格
      let primary;
      for (let i = 0; i < this.tableRows.length; i++) {
        if (primary) break;
        const cell = this.tableRows[i][index];
        if (cell.display && cell.colspan === 1) {
          primary = { top: i, left: index };
        }
      }
      if (primary) selection.primary = primary;
      this.select(selection, isAppend);
    },

    // 选择到某一列（多选）
    selectColumnRange(start, target) {
      let left = Math.min(start, target);
      let right = Math.max(start, target);
      let selection = { left, right, top: 0, bottom: this.tableRows.length - 1, type: 'col' };
      this.setCurrentSelection(selection);
    },

    // 选择行
    selectRow(index, isAppend) {
      let selection = { left: 0, top: index, right: this.widths.length - 1, bottom: index, type: 'row' };
      this.select(selection, isAppend);
    },

    // 选择到某一行
    selectRowRange(start, target) {
      let top = Math.min(start, target);
      let bottom = Math.max(start, target);
      let selection = { top, bottom, left: 0, right: this.widths.length - 1, type: 'row' };
      this.setCurrentSelection(selection);
    },

    // 改变列宽，如有选中区域，同时改变选中区域所在的多列
    changeColumnWidth(coordinateY, width) {
      let columns = getSelectedColumns(this.selectedRanges);
      if (!columns.has(coordinateY)) {
        columns = new Set([coordinateY]);
      }
      width = Math.max(width, this.defaultCellMinWidth || defaultCellMinWidth);
      columns.forEach(col => this.widths[col] = width);
    },

    columnResizing(index, width) {
      this.changeColumnWidth(index, width);
    },

    columnResized() { },

    // 改变行高，按选中区域可同时改变多行
    changeRowHeight(coordinateX, height) {
      let rows = getSelectedRows(this.selectedRanges);
      if (!rows.has(coordinateX)) {
        rows = new Set([coordinateX]);
      }
      height = Math.max(height, this.defaultCellMinHeight || defaultCellMinHeight);
      rows.forEach(row => this.heights[row] = height);
    },

    rowResizing(index, height) {
      this.changeRowHeight(index, height);
    },

    rowResized() { },

    mergeSelection(selection) {
      if (!isSelectionFit(selection, this.tableRows)) {
        throw { error: '此区域包含不完整单元格，请重新选择' };
      }
      const { left, top, right, bottom } = selection;
      let displayCellRef; // 合并后显示第一个有值的单元格中的文本
      for (let i = top; i <= bottom; i++) {
        let row = this.tableRows[i];
        for (let j = left; j <= right; j++) {
          let cell = row[j];
          if (!displayCellRef && cell.display && cell.textBox.value) {
            displayCellRef = { row: i, col: j };
          } else {
            cell.colspan = 1;
            cell.rowspan = 1;
            cell.display = 0;
            cell.textBox.value = null;
          }
        }
      }
      if (displayCellRef && (displayCellRef.row !== top || displayCellRef.col !== left)) {
        // 把要显示的单元格移到左上角去
        this.tableRows[top][left] = this.tableRows[displayCellRef.row][displayCellRef.col];
        this.tableRows[displayCellRef.row][displayCellRef.col] = { ...this.createCell(), display: 0 };
      }
      let topLeftCell = this.tableRows[top][left];
      topLeftCell.colspan = right - left + 1;
      topLeftCell.rowspan = bottom - top + 1;
      topLeftCell.display = 1;
    },

    // 合并所选单元格
    mergeCell() {
      if (!this.selectedRanges || this.selectedRanges.length === 0) {
        return;
      }
      if (isRangesCross(this.selectedRanges)) {
        throw { error: '无法对重叠区域执行合并单元格' };
      }
      this.selectedRanges.forEach(selection => this.mergeSelection(selection));
      this.mark = null;
    },

    // 拆分所选单元格
    splitCell() {
      if (!this.selectedRanges || this.selectedRanges.length === 0) {
        return;
      }
      if (isRangesCross(this.selectedRanges)) {
        throw { error: '无法对重叠区域执行拆分单元格' };
      }
      this.selectedRanges.forEach(selection => {
        const { left, top, right, bottom } = selection;
        for (let i = top; i <= bottom; i++) {
          let row = this.tableRows[i];
          for (let j = left; j <= right; j++) {
            let cell = row[j];
            cell.colspan = 1;
            cell.rowspan = 1;
            cell.display = 1;
          }
        }
      });
      this.mark = null;
    },

    insertRows(direction) {
      if (!this.selectedRanges || this.selectedRanges.length === 0) {
        return;
      }
      if (this.selectedRanges.find(selection => selection.type !== 'row')) {
        throw { error: '只能对整行选中区域执行插入行' };
      }
      if (isRangesCross(this.selectedRanges)) {
        throw { error: '无法对重叠区域执行插入行' };
      }
      let ranges = [...this.selectedRanges];
      // 倒序
      ranges.sort((a, b) => b.top - a.top);
      ranges.forEach(selection => {
        let { top, bottom } = selection;
        let index = direction === 'down' ? bottom + 1 : top;
        this.insertRow(index, bottom - top + 1);
      });
    },

    // 向上插入行
    insertRowUp() {
      this.insertRows('up');
    },

    // 向下插入行
    insertRowDown() {
      this.insertRows('down');
    },

    findBigCellUp(rowIndex, colIndex) {
      for (let row = rowIndex; row >= 0; row--) {
        let tempCell = this.tableRows[row][colIndex];
        if (tempCell.display) {
          return tempCell;
        }
      }
    },

    // 插入行，数量等于选中行数
    insertRow(index, addRowCount, height) {
      if (this.widths.length * (this.tableRows.length + addRowCount) > 100000) {
        Message.info('不能超过100000个单元格。');
        return;
      }
      this.beforeInsertRow && this.beforeInsertRow(index, addRowCount);
      let throughRanges = [];// 穿过的单元格范围
      if (index > 0 && index < this.tableRows.length) {
        let col = 0;
        while (col < this.widths.length) {
          let cell = this.tableRows[index][col];
          if (cell.display) {
            col += cell.colspan;
          } else {
            // 找到穿越的单元格
            let bigCell = this.findBigCellUp(index, col);
            // rowspan 增加
            bigCell.rowspan += addRowCount;
            throughRanges.push({ col: col, colspan: bigCell.colspan });
            col += bigCell.colspan;
          }
        }
      }
      // 增加新行
      for (let c = 0; c < addRowCount; c++) {
        let rowNew = [];
        // 新的行属性
        const rowPropNew = {};
        for (let i = 0; i < this.widths.length; i++) {
          let newCell = this.createCell();
          rowNew.push(newCell);
        }
        throughRanges.forEach(range => {
          for (let i = 0; i < range.colspan; i++) {
            let display = 0;
            rowNew[range.col + i] = { ...rowNew[range.col + i], display };
          }
        });
        this.tableRows.splice(index, 0, rowNew);
        this.heights.splice(index, 0, this.defaultCellHeight || height || defaultCellHeight);
        this.rowProps.splice(index, 0, rowPropNew);
      }
      this.mark = null;
    },

    insertColumns(direction) {
      if (!this.selectedRanges || this.selectedRanges.length === 0) {
        return;
      }
      if (this.selectedRanges.find(selection => selection.type !== 'col')) {
        throw { error: '只能对整列选中区域执行插入列' };
      }
      if (isRangesCross(this.selectedRanges)) {
        throw { error: '无法对重叠区域执行插入列' };
      }
      let ranges = [...this.selectedRanges];
      // 倒序
      ranges.sort((a, b) => b.left - a.left);
      ranges.forEach(selection => {
        let { left, right } = selection;
        let index = direction === 'right' ? right + 1 : left;
        this.insertColumn(index, right - left + 1);
      });
    },

    // 向左插入列
    insertColumnLeft() {
      this.insertColumns('left');
    },

    // 向右插入列
    insertColumnRight() {
      this.insertColumns('right');
    },

    findBigCellLeft(rowIndex, colIndex) {
      for (let col = colIndex; col >= 0; col--) {
        let tempCell = this.tableRows[rowIndex][col];
        if (tempCell.display) {
          return tempCell;
        }
      }
    },

    // 插入列，数量等于选中列数
    insertColumn(index, addColumnCount) {
      if (this.tableRows.length * (this.widths.length + addColumnCount) > 50000) {
        Message.info('不能超过50000个单元格。');
        return;
      }
      this.beforeInsertColumn && this.beforeInsertColumn(index, addColumnCount);
      let throughRanges = [];// 穿过的单元格范围
      if (index > 0 && index < this.widths.length) {
        // 从上往下查找
        let row = 0;
        while (row < this.tableRows.length) {
          let cell = this.tableRows[row][index];
          if (cell.display) {
            row += cell.rowspan;
          } else {
            // 找到穿越的单元格
            let bigCell = this.findBigCellLeft(row, index);
            // colspan 增加
            bigCell.colspan += addColumnCount;
            throughRanges.push({ row: row, rowspan: bigCell.rowspan });
            row += bigCell.rowspan;
          }
        }
      }
      // 增加新列
      for (let c = 0; c < addColumnCount; c++) {
        for (let i = 0; i < this.tableRows.length; i++) {
          let newCell = this.createCell();
          this.tableRows[i].splice(index + c, 0, newCell);
        }
        throughRanges.forEach(range => {
          for (let i = 0; i < range.rowspan; i++) {
            let display = 0;
            let cell = this.tableRows[range.row + i][index + c];
            this.tableRows[range.row + i][index + c] = { ...cell, display };
          }
        });
        this.widths.splice(index, 0, this.defaultCellWidth || defaultCellWidth);
        this.colProps.splice(index, 0, {});
      }
      this.mark = null;
    },
    clearAnalysisModel() {
      let { rowProps, tableRows, selectedRanges } = this;
      const { top, bottom } = selectedRanges[0];
      for (let i = 0, j = rowProps.length; i < j; i++) {
        if (i >= top && i <= bottom && rowProps[i].analysisModelId) {
          delete (rowProps[i].analysisModelId);
          if (rowProps[i].rowType != 'float') {
            delete (rowProps[i].rowType);
          }
          delete (rowProps[i].analysisModelConditions);
        }
      }
      for (let m = 0, n = tableRows.length; m < n; m++) {
        if (m >= top && m <= bottom) {
          let selectRow = tableRows[m];
          for (let p = 0, q = selectRow.length; p < q; p++) {
            // if (selectRow[p].measureTitle) {电子表格的先注释了，以后知道干吗用再解开
            //   delete (selectRow[p].measureTitle);
            //   selectRow[p].textBox = {};
            // }
            if (selectRow[p].textBox.analysisModelId) {
              delete (selectRow[p].textBox.analysisModelId)
              selectRow[p].textBox.value = '';
              delete (selectRow[p].textBox.idField)
            }
          }
        }
      }
      selectedRanges = null;
    },
    removeRows() {
      if (!this.selectedRanges || this.selectedRanges.length === 0) {
        return;
      }
      if (this.selectedRanges.find(selection => selection.type !== 'row')) {
        throw { error: '只能对整行选中区域执行删除行' };
      }
      if (isRangesCross(this.selectedRanges)) {
        throw { error: '无法对重叠区域执行删除行' };
      }
      let ranges = [...this.selectedRanges];
      // 倒序
      ranges.sort((a, b) => b.top - a.top);
      ranges.forEach(selection => {
        let { top, bottom } = selection;
        let removeCount = bottom - top + 1;
        this.beforeRemoveRow && this.beforeRemoveRow(top, removeCount);
        for (let i = 0; i < removeCount; i++) {
          this.removeRow(top);
        }
      });
      this.selectedRanges = null;
      this.mark = null;
    },

    // 删除单行
    removeRow(index) {
      let col = 0;
      while (col < this.widths.length) {
        let cell = this.tableRows[index][col];
        if (cell.display) {
          if (cell.rowspan > 1) {
            // 删除合并单元格的首格时，下方单元格成为首格
            let downCell = this.tableRows[index + 1][col];
            downCell.display = 1;
            downCell.rowspan = cell.rowspan - 1;
            downCell.colspan = cell.colspan;
          }
          col += cell.colspan;
        } else {
          // 找到穿越的单元格
          let bigCell = this.findBigCellUp(index, col);
          // rowspan 减一
          bigCell.rowspan -= 1;
          col += bigCell.colspan;
        }
      }
      this.tableRows.splice(index, 1);
      this.heights.splice(index, 1);
      this.rowProps.splice(index, 1);
    },

    removeColumns() {
      if (!this.selectedRanges || this.selectedRanges.length === 0) {
        return;
      }
      if (this.selectedRanges.find(selection => selection.type !== 'col')) {
        throw { error: '只能对整列选中区域执行删除列' };
      }
      if (isRangesCross(this.selectedRanges)) {
        throw { error: '无法对重叠区域执行删除列' };
      }
      let ranges = [...this.selectedRanges];
      // 倒序
      ranges.sort((a, b) => b.left - a.left);
      ranges.forEach(selection => {
        let { left, right } = selection;
        let removeCount = right - left + 1;
        this.beforeRemoveColumn && this.beforeRemoveColumn(left, removeCount);
        for (let i = 0; i < removeCount; i++) {
          this.removeColumn(left);
        }
      });
      this.selectedRanges = null;
      this.mark = null;
    },

    removeColumn(index) {
      let row = 0;
      while (row < this.tableRows.length) {
        let cell = this.tableRows[row][index];
        if (cell.display) {
          if (cell.colspan > 1) {
            // 删除合并单元格的首格时，右方单元格成为首格
            let rightCell = this.tableRows[row][index + 1];
            rightCell.display = 1;
            rightCell.rowspan = cell.rowspan;
            rightCell.colspan = cell.colspan - 1;
          }
          row += cell.rowspan;
        } else {
          // 找到穿越的单元格
          let bigCell = this.findBigCellLeft(row, index);
          // colspan 减一
          bigCell.colspan -= 1;
          row += bigCell.rowspan;
        }
      }
      this.tableRows.forEach(r => r.splice(index, 1));
      this.widths.splice(index, 1);
      this.colProps.splice(index, 1);
    },

    // 清除标记
    clearMark() {
      this.mark = null;
    },

    // 剪切（仅标记）
    cut() {
      if (!this.selectedRanges || this.selectedRanges.length === 0) {
        return;
      }
      if (this.selectedRanges.length > 1) {
        throw { error: '不能对多个区域执行剪切' };
      }
      this.mark = { ...this.selectedRanges[0], type: 'cut' };
    },

    // 复制（仅标记）
    copy() {
      if (!this.selectedRanges || this.selectedRanges.length === 0) {
        return;
      }
      if (this.selectedRanges.length > 1) {
        throw { error: '不能对多个区域执行复制' };
      }
      this.mark = { ...this.selectedRanges[0], type: 'copy' };
    },

    // 标记格式刷
    brush() {
      if (this.mark && this.mark.type === 'brush') {
        this.mark = null;
        return;
      }
      if (!this.selectedRanges || this.selectedRanges.length === 0) {
        return;
      }
      if (this.selectedRanges.length > 1) {
        throw { error: '不能对多个区域使用格式刷' };
      }
      this.mark = { ...this.selectedRanges[0], type: 'brush' };
    },

    brushCell(sourceCell, targetCell) {
      const textBox = { ...sourceCell.textBox, value: targetCell.textBox.value };
      const { rowspan, colspan, display, border } = sourceCell;
      return {
        ...targetCell, textBox, rowspan, colspan, display, border
      };
    },

    // 格式刷
    pasteStyle() {
      this.paste();
    },

    copyCell(cell) {
      return cell;
    },

    // 粘贴
    paste(commonTextBox) {
      console.log(commonTextBox)
      if (commonTextBox && (commonTextBox.type === 'Header' || commonTextBox.type === 'Footer')) {

        if (!this.selectedRanges || this.selectedRanges.length === 0) {
          return;
        }
        const { textBox: { style, value } } = commonTextBox;
        console.log(style, textBox)
        this.selectedRanges.forEach(item => {
          const { top, left, bottom, right } = item;
          for (let i = top; i <= bottom; i++) {
            for (let o = left; o <= right; o++) {
              console.log(this.tableRows[i][o])
              this.tableRows[i][o].textBox.value = value;
              this.tableRows[i][o].textBox.backGroundColor = style.backgroundColor || '';
              this.tableRows[i][o].textBox.fontColor = style.color || '';
            }
          }
        })
        return;
      }
      if (!this.mark || !this.selectedRanges || this.selectedRanges.length === 0) {
        return;
      }
      if (this.selectedRanges.length > 1) {
        throw { error: '暂不支持粘贴到多个区域' };
      }

      const selection = this.selectedRanges[0];

      const { left, top, right, bottom, type } = this.mark;

      const sourceWidth = right - left + 1;
      const sourceHeight = bottom - top + 1;
      // 要粘贴至的位置
      const { left: targetLeft, top: targetTop } = selection;
      const selectionWidth = selection.right - targetLeft + 1;
      const selectionHeight = selection.bottom - targetTop + 1;
      // 重复次数
      const repeatX = type === 'cut' ? 1 : Math.max(1, Math.floor(selectionWidth / sourceWidth));
      const repeatY = type === 'cut' ? 1 : Math.max(1, Math.floor(selectionHeight / sourceHeight));
      // 粘贴区域和源区域相同，放弃
      if (targetTop === top && targetLeft === left && repeatX === 1 && repeatY === 1) {
        return;
      }
      // // 单个单元格直接粘贴至目标位置
      // if (left === right && top === bottom) {
      //   return this.pasteSingleCell({ left, top, right, bottom, type, targetLeft, targetTop });
      // }
      const targetRight = targetLeft + repeatX * sourceWidth - 1;
      const targetBottom = targetTop + repeatY * sourceHeight - 1;
      // 如果要粘贴至的范围无法完整框选，则不能粘贴
      let targetSelection = { top: targetTop, left: targetLeft, bottom: targetBottom, right: targetRight };
      if (!isSelectionFit(targetSelection, this.tableRows)) {
        throw { error: `此处不包含 ${targetRight - targetLeft + 1} × ${targetBottom - targetTop + 1} 的可用空间，无法操作` };
      }
      this.selectedRanges = [targetSelection];
      // 第一次粘贴
      let signX = Math.sign(left - targetLeft) || 1;
      let signY = Math.sign(top - targetTop) || 1;
      for (let i = 0; i < sourceHeight; i++) {
        for (let j = 0; j < sourceWidth; j++) {
          let row = signY > 0 ? top + i : bottom - i;
          let col = signX > 0 ? left + j : right - j;
          let targetRow = targetTop - top + row;
          let targetCol = targetLeft - left + col;
          let sourceCell = this.tableRows[row][col];
          let targetCell = this.tableRows[targetRow][targetCol];
          console.log(type)
          if (type === 'brush') {
            console.log(this.brushCell(sourceCell, targetCell))
            this.tableRows[targetRow][targetCol] = this.brushCell(sourceCell, targetCell);
          } else {
            this.tableRows[targetRow][targetCol] = this.copyCell(sourceCell);
          }
          if (type === 'cut') {
            this.tableRows[row][col] = this.createCell();
          }
        }
      }
      // 重复粘贴
      if (repeatX > 1 || repeatY > 1) {
        for (let i = 0; i < sourceHeight; i++) {
          for (let j = 0; j < sourceWidth; j++) {
            let row = i + targetTop;
            let col = j + targetLeft;
            let cell = this.tableRows[row][col];
            for (let m = 0; m < repeatX; m++) {
              for (let n = 0; n < repeatY; n++) {
                if (m === 0 && n === 0) continue;
                let targetRow = row + n * sourceHeight;
                let targetCol = col + m * sourceWidth;
                if (type === 'brush') {
                  this.tableRows[targetRow][targetCol] = this.brushCell(cell, this.tableRows[targetRow][targetCol]);
                } else {
                  this.tableRows[targetRow][targetCol] = this.copyCell(cell);
                }
              }
            }
          }
        }
      }
      // 复制粘贴时，如果复制与粘贴区域相交则清空标记，否则不清空。
      if (type !== 'copy' || isCross(this.mark, targetSelection)) {
        // 清空标记
        this.mark = null;
      }
    },

    clone() {
      if (!this.selectedRanges || this.selectedRanges.length === 0)
        return;

      const selection = this.selectedRanges[0];
      const { left: targetLeft, top: targetTop } = selection;
      let cloneValueText = '';
      if (this.tableRows[targetTop][targetLeft].hasOwnProperty('textBox')) {
        cloneValueText = common.isCheckEmpty(this.tableRows[targetTop][targetLeft].textBox.value);
      }

      for (let i = 0; i < this.selectedRanges.length; i++) {
        const ranges = this.selectedRanges[i];
        if (ranges.left == ranges.right && ranges.top == ranges.bottom)
          this.tableRows[ranges.top][ranges.left].textBox.value = cloneValueText;
        else {
          let fromRowNumber = ranges.top;
          let destinationRoNumber = ranges.bottom;
          let fromColumnNumber = ranges.left;
          let destinationColumnNumber = ranges.right;

          for (let j = fromRowNumber; j <= destinationRoNumber; j++) {
            for (let k = fromColumnNumber; k <= destinationColumnNumber; k++) {
              this.tableRows[j][k].textBox.value = cloneValueText;
            }
          }
        }
      }
    },

    updateParameters(newList) {
      if (!this.selectedRanges || this.selectedRanges.length === 0)
        return;

      for (let i = 0; i < this.selectedRanges.length; i++) {
        const ranges = this.selectedRanges[i];
        const newKey = ranges.top + "_" + ranges.left;
        if (ranges.left == ranges.right && ranges.top == ranges.bottom && newList[newKey])
          this.tableRows[ranges.top][ranges.left].textBox.value = newList[newKey].value;
        else {
          let fromRowNumber = ranges.top;
          let destinationRoNumber = ranges.bottom;
          let fromColumnNumber = ranges.left;
          let destinationColumnNumber = ranges.right;

          for (let j = fromRowNumber; j <= destinationRoNumber; j++) {
            for (let k = fromColumnNumber; k <= destinationColumnNumber; k++) {
              const newKey = j + "_" + k;
              this.tableRows[j][k].textBox.value = newList[newKey].value;
            }
          }
        }
      }
    },

    pasteSingleCell({ left, top, right, bottom, type, targetLeft, targetTop }) {
      let sourceCell = this.tableRows[top][left];
      let targetCell = this.tableRows[targetTop][targetLeft];
      if (type === 'cut') {
        this.tableRows[top][left] = this.createCell();
      }
      let { rowspan, colspan } = targetCell;
      this.tableRows[targetTop][targetLeft] = { ...sourceCell, rowspan, colspan };
      this.selection.right = targetLeft + colspan - 1;
      this.selection.bottom = targetTop + rowspan - 1;
      this.mark = null;
    },

    // clearCellContentFlag: true 清空单元格内容；false：删除单元格
    deleteCells(clearCellContentFlag) {
      this.updateSelectedCells((cell, i, j) => {
        if (clearCellContentFlag) {
          if (cell.display) cell.textBox.value = '';
        } else {
          this.tableRows[i][j] = this.createCell();
        }
      }, true);

      this.selection = null;
      this.mark = null;
    },

    setStyle(row, col, style) {
      let cell = this.tableRows[row][col];
      if (style.fontInfo) {
        cell.textBox.updateFont(style.fontInfo);
      }
    },

    updateCellStyle(style) {
      this.updateSelectedCells(cell => {
        if (style.fontInfo && cell.textBox.updateFont) {
          cell.textBox.updateFont(style.fontInfo);
        } else {
          cell.textBox.fontInfo = style.fontInfo;
        }
      });
    },

    updateCellAlign(align) {
      this.updateSelectedCells(cell => {
        //horizontalAlignment
        if (cell.textBox.setAlign) {
          cell.textBox.setAlign(align);
        } else {
          cell.textBox.horizontalAlignment = align;
        }
      });
    },

    updateCellVerticalAlign(align) {
      this.updateSelectedCells(cell => {
        cell.textBox.verticalAlignment = align;
      });
    },

    /**
     * 更新选中单元格
     * @param {function} updateCell 更新函数
     * @param {bool} withHided 是否包含隐藏单元格
     */
    updateSelectedCells(updateCell, withHided) {
      if (!this.selectedRanges) {
        return;
      }
      this.selectedRanges.forEach(selection => {
        let { left, top, right, bottom } = selection;
        for (let i = top; i <= bottom; i++) {
          for (let j = left; j <= right; j++) {
            const cell = this.tableRows[i][j];
            if (withHided || cell.display) {
              updateCell(cell, i, j);
            }
          }
        }
      });
    },

    updateCellFormatStyle(contentSourceStyle) {
      this.updateSelectedCells(cell => {
        cell.textBox.setFormatStyle(contentSourceStyle);
      });
    },

    updateCellFormatObject(formatObject) {
      this.updateSelectedCells(cell => {
        cell.textBox.setFormatObject(formatObject);
      });
    },

    updateCellBackgroundColor(color) {
      this.updateSelectedCells(cell => {
        cell.textBox.backGroundColor = color;
      });
    },

    updateCellFontColor(color) {
      this.updateSelectedCells(cell => {
        cell.textBox.fontColor = color;
      });
    },

    updateCellFontFamily(value) {
      this.updateSelectedCells(cell => {
        if (!cell.textBox.fontInfo) {
          cell.textBox.fontInfo = {};
        }
        cell.textBox.fontInfo.family = value;
      });
    },

    updateCellFontSize(value) {
      this.updateSelectedCells(cell => {
        if (!cell.textBox.fontInfo) {
          cell.textBox.fontInfo = {};
        }
        cell.textBox.fontInfo.size = value;
      });
    },
    setWrap(value) {
      this.updateSelectedCells(cell => {
        cell.textBox.wrap = value;
      });
    },
    setCellText(row, col, text) {
      let cell = this.tableRows[row][col];
      cell.textBox.value = text;
    },

    // 开始编辑
    beginEdit(row, col) {
      this.editingCell = { row, col };
    },

    // 提交编辑
    commitEdit(row, col, newValue) {
      this.editingCell = null;
      let cell = this.tableRows[row][col];
      cell.textBox.value = newValue;
      if (!newValue) {
        cell.textBox.gatherExpression = '';
      }
    },

    // 取消编辑
    cancelEdit() {
      this.editingCell = null;
    },
  };

  [
    [editGridProto.mergeCell, '合并单元格'],
    [editGridProto.splitCell, '拆分单元格'],

    [editGridProto.insertRow, '插入行'],
    [editGridProto.insertRowUp, '插入行'],
    [editGridProto.insertRowDown, '插入行'],
    [editGridProto.insertColumn, '插入列'],
    [editGridProto.insertColumnLeft, '插入列'],
    [editGridProto.insertColumnRight, '插入列'],

    [editGridProto.removeRows, '删除行'],
    [editGridProto.removeRow, '删除行'],
    [editGridProto.removeColumns, '删除列'],
    [editGridProto.removeColumn, '删除列'],

    [editGridProto.paste, '粘贴'],
    [editGridProto.deleteCells, '删除单元格'],

    [editGridProto.pasteStyle, '格式刷'],
    [editGridProto.setStyle, '修改样式'],
    [editGridProto.updateCellStyle, '修改样式'],
    [editGridProto.updateCellAlign, '修改水平对齐方式'],
    [editGridProto.updateCellVerticalAlign, '修改垂直对齐方式'],
    [editGridProto.updateCellFormatStyle, '修改数据类型'],
    [editGridProto.updateCellFormatObject, '修改格式样式'],
    [editGridProto.updateCellBackgroundColor, '修改背景色'],
    [editGridProto.updateCellFontColor, '修改前景色'],
    [editGridProto.updateCellFontFamily, '修改字体'],
    [editGridProto.updateCellFontSize, '修改字号'],
    [editGridProto.setWrap, '设置自动换行'],
    [editGridProto.setCellText, (stateBefore, stateAfter, row, col, text) =>
      `在 ${addressConverter.columnNumberToName(col + 1)}${row + 1} 中填入"${text}"`],
    [editGridProto.columnResized, '调整列宽'],
    [editGridProto.rowResized, '调整行高'],
    [editGridProto.clearAnalysisModel, '清除分析模型'],
    [editGridProto.commitEdit, (stateBefore, stateAfter, row, col, text) =>
      `在 ${addressConverter.columnNumberToName(col + 1)}${row + 1} 中输入 ${text}`],
  ].forEach(a => {
    let f = a[0];
    f.canUndo = true;
    f.description = a[1];
  });

  editGridProto.columnResizing.skipUndo = true;
  editGridProto.rowResizing.skipUndo = true;
  editGridProto.beginEdit.skipUndo = true;
  return editGridProto;
}
