import React, { Component, PureComponent } from 'react';
import { Tooltip } from 'antd';
import { borderCssStyle } from "../SpreadsheetDesigner/SpreadsheetSelectors";
import addressConverter from 'xlsx-populate/lib/addressConverter';

let selectionDrag = { dragging: false, rootRect: null, startCell: null };

export default class extends PureComponent {
  columnSelect = { drag: false };
  clicked = false;
  focused = false;
  state = { selectionDragTarget: null };

  componentDidMount() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keypress', this.onKeyPress);
    window.addEventListener('mousedown', this.onWindowMouseDown);
    window.addEventListener('mousemove', this.handleWindowMouseMove);
    window.addEventListener('mouseup', this.handleWindowMouseUp);
    const { onLoad } = this.props;
    onLoad && onLoad(this.tableDiv);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keypress', this.onKeyPress);
    window.removeEventListener('mousedown', this.onWindowMouseDown);
    window.removeEventListener('mousemove', this.handleWindowMouseMove);
    window.removeEventListener('mouseup', this.handleWindowMouseUp);
  }

  onKeyDown = (ev) => {
    const { onKeyDown } = this.props;
    onKeyDown && this.focused && onKeyDown(ev);
  }

  onKeyPress = (ev) => {
    const { onKeyPress } = this.props;
    onKeyPress && this.focused && onKeyPress(ev);
  }
  onWindowMouseDown = (ev) => {
    if (this.clicked) {
      this.focused = true;
      this.clicked = false;
    } else {
      this.focused = false;
    }
  }
  onMouseDown = (ev) => {
    this.clicked = true;
  }

  handleWindowMouseMove = (ev) => {
    if (!selectionDrag || !selectionDrag.dragging) {
      return;
    }
    const { rootRect, startCell } = selectionDrag;
    const { pageX, pageY } = ev;
    // 鼠标光标所在行列
    const row = this.getCursorRow(pageY, rootRect);
    const col = this.getCursorCol(pageX, rootRect);
    const selection = this.props.selectedRanges[0];
    // 拖动目标范围
    const { widths, heights } = this.props;
    let left = Math.max(0, selection.left + col - startCell.col);
    left = Math.min(widths.length - 1 + selection.left - selection.right, left);
    let top = Math.max(0, selection.top + row - startCell.row);
    top = Math.min(heights.length - 1 + selection.top - selection.bottom, top);
    let right = selection.right + left - selection.left;
    let bottom = selection.bottom + top - selection.top;
    // 更新状态
    const { selectionDragTarget } = this.state;
    if (!selectionDragTarget
        || selectionDragTarget.left !== left
        || selectionDragTarget.right !== right
        || selectionDragTarget.top !== top
        || selectionDragTarget.bottom !== bottom) {
      this.setState({ selectionDragTarget: { left, right, top, bottom } });
    }
  }

  handleWindowMouseUp = (ev) => {
    selectionDrag = null;
    const { onSelectionDragDrop } = this.props;
    onSelectionDragDrop && this.state.selectionDragTarget && onSelectionDragDrop(this.state.selectionDragTarget);
    this.setState({ selectionDragTarget: null });
  }

  // 选择框边框拖动
  handleSelectionBorderMouseDown = (ev, type) => {
    const rootRect = this.tableDiv.getBoundingClientRect();
    selectionDrag = {
      dragging: true,
      rootRect,
    };
    const { pageX, pageY } = ev;
    const x = pageX - rootRect.x;
    const y = pageY - rootRect.y;
    const { selectedRanges } = this.props;
    const selection = selectedRanges[0];
    if (type === 'left' || type === 'right') {
      selectionDrag.startCell = {
        row: this.getCursorRow(pageY, rootRect),
        col: selection[type],
      };
    } else {
      selectionDrag.startCell = {
        row: selection[type],
        col: this.getCursorCol(pageX, rootRect),
      };
    }
    console.log('drag start', selectionDrag.startCell);
    this.setState({ selectionDragTarget: { ...selection } });
  }
  // 获取鼠标光标所在行
  getCursorRow(pageY, rootRect) {
    const y = pageY - rootRect.y;
    const { heights } = this.props;
    let row = -1;
    let totalHeight = 0;
    for (let i = 0; i < heights.length; i++) {
      totalHeight += heights[i];
      if (totalHeight > y) {
        row = i;
        break;
      }
    }
    if (row < 0) {
      row = heights.length - 1;
    }
    return row;
  }
  // 获取鼠标光标所在列
  getCursorCol(pageX, rootRect) {
    const x = pageX - rootRect.x;
    const { widths } = this.props;
    let col = -1;
    let totalWidth = 0;
    for (let i = 0; i < widths.length; i++) {
      totalWidth += widths[i];
      if (totalWidth > x) {
        col = i;
        break;
      }
    }
    if (col < 0) {
      col = widths.length - 1;
    }
    return col;
  }
  // handleKeyDown() { }
  // handleKeyPress() { }

  // 单元格鼠标左键按下的处理
  handleCellMouseDown = (props, e) => {
    const { rowIndex, columnIndex, cell } = props;
    const { rowspan, colspan } = cell;
    if (e.button === 2) {
      // 选中单元格点右键不重新选择
      let { selectedRanges } = this.props;
      if (!selectedRanges || !selectedRanges.find(({ left, top, right, bottom }) => (
          rowIndex >= top && rowIndex <= bottom && columnIndex >= left && columnIndex <= right
      ))) {
        this.props.onMouseSelectStart && this.props.onMouseSelectStart(rowIndex, columnIndex, e);
      }
      return;
    }
    let columnSelect = this.columnSelect;
    columnSelect.drag = true;
    columnSelect.start = { top: rowIndex, left: columnIndex };
    columnSelect.current = columnSelect.start;
    this.props.onMouseSelectStart && this.props.onMouseSelectStart(rowIndex, columnIndex, e);
  };

  // 单元格鼠标进入的处理
  handleCellMouseEnter = (props) => {
    let columnSelect = this.columnSelect;
    if (!columnSelect.drag) {
      return;
    }
    const { rowIndex, columnIndex, cell } = props;
    let start = columnSelect.start;
    let target = { top: rowIndex, left: columnIndex };
    if (columnSelect.current && columnSelect.current.top === target.top
        && columnSelect.current.left === target.left) {
      return;
    }
    else {
      columnSelect.current = target;
    }
    this.props.onMouseSelectChange && this.props.onMouseSelectChange(start, target);
  };

  handleMouseUp = () => {
    if (this.columnSelect.drag) {
      this.columnSelect.drag = false;
      this.props.onMouseSelectEnd && this.props.onMouseSelectEnd();
    }
  };

  getRangeCalculator(array) {
    // 缓存
    const sumArray = [];
    let sum = 0;
    for (let i = 0; i < array.length; i++) {
      sum += array[i];
      sumArray.push(sum);
    }
    // 计算范围内元素之和
    const calcRange = (index, span) => {
      if (!span) {
        return 0;
      }
      if (span === 1) {
        return array[index];
      }
      const start = index > 0 ? sumArray[index - 1] : 0;
      const end = sumArray[index + span - 1];
      return end - start;
    };
    return calcRange;
  }
  refTable = (table) => {
    this.tableDiv = table;
  }

  renderSelection() {
    const { selectedRanges, animateSelection, tableRows } = this.props;
    if (!selectedRanges || selectedRanges.length === 0) {
      return null;
    }
    return selectedRanges.map((selection, index) => {
      let result = [];
      const { left, top, right, bottom } = selection;
      const duration = '0.15s';
      let borderClassName = 'edit-grid-selection-border';
      // 背景
      if (index === selectedRanges.length - 1 && selection.primary) {
        let { left: primaryLeft, top: primaryTop } = selection.primary;
        const primaryCell = tableRows[primaryTop][primaryLeft];
        const { rowspan, colspan } = primaryCell;
        const primaryRight = primaryLeft + colspan - 1;
        const primaryBottom = primaryTop + rowspan - 1;
        result = [
          // 主单元格上方
          this.renderSelectionBackground(left, top, right, primaryTop - 1, index + 'up', duration),
          // 主单元格下方
          this.renderSelectionBackground(left, primaryBottom + 1, right, bottom, index + 'down', duration),
          // 主单元格左侧
          this.renderSelectionBackground(left, primaryTop, primaryLeft - 1, primaryBottom, index + 'left', duration),
          // 主单元格右侧
          this.renderSelectionBackground(primaryRight + 1, primaryTop, right, primaryBottom, index + 'right', duration),
        ];
      } else {
        // 不包含主单元格的直接填充整个背景
        borderClassName += ' edit-grid-selection-highlight';
      }
      // 边框
      const borderWidth = 2;
      const border = (
          <div key={index + 'border'} className={borderClassName} style={{
            left: this.calcWidth(0, left) - borderWidth,
            top: this.calcHeight(0, top) - borderWidth,
            width: this.calcWidth(left, right - left + 1) + borderWidth * 2 - 1,
            height: this.calcHeight(top, bottom - top + 1) + borderWidth * 2 - 1,
            position: 'absolute',
            background: 'Transparent',
            border: `${borderWidth}px solid transparent`,
            pointerEvents: 'none',
            transition: animateSelection ? '' : `left ${duration}, top ${duration}, width ${duration}, height ${duration}`,
          }} >
            {this.renderSelectionBorderDragHandle({ width: 3, height: '100%', top: 0, left: -2, }, 'left')}
            {this.renderSelectionBorderDragHandle({ width: 3, height: '100%', top: 0, right: -2, }, 'right')}
            {this.renderSelectionBorderDragHandle({ width: '100%', height: 3, left: 0, top: -2, }, 'top')}
            {this.renderSelectionBorderDragHandle({ width: '100%', height: 3, left: 0, bottom: -2, }, 'bottom')}
          </div>
      );
      result.push(border);
      return result;
    });
  }
  renderSelectionBorderDragHandle(style, type) {
    if (!this.props.selectionAllowDrag) {
      return;
    }
    if (this.props.selectedRanges.length > 1) {
      // 多个区域不能拖动
      return;
    }
    return (
        <div style={{
          position: 'absolute',
          backgroundColor: 'Transparant',
          pointerEvents: 'auto',
          cursor: 'move',
          ...style
        }}
             onMouseDown={ev => this.handleSelectionBorderMouseDown(ev, type)} />
    );
  }
  renderSelectionDragTarget() {
    const { selectionDragTarget } = this.state;
    if (!selectionDragTarget) {
      return;
    }
    const { left, right, top, bottom } = selectionDragTarget;
    const duration = '0.15s';
    const borderWidth = 2;
    return (
        <div key='selectinDragTarget' id='selectinDragTarget' style={{
          left: this.calcWidth(0, left) - borderWidth,
          top: this.calcHeight(0, top) - borderWidth,
          width: this.calcWidth(left, right - left + 1) + borderWidth * 2 - 1,
          height: this.calcHeight(top, bottom - top + 1) + borderWidth * 2 - 1,
          position: 'absolute',
          background: 'Transparent',
          border: `${borderWidth}px solid Green`,
          pointerEvents: 'none',
          transition: `left ${duration}, top ${duration}, width ${duration}, height ${duration}`,
        }} >
          <Tooltip
              placement="topLeft"
              title="交换位置"
              visible={true}
              getPopupContainer={() => document.getElementById('selectinDragTarget')}>
            <span></span>
          </Tooltip>
        </div>
    );
  }
  renderSelectionBackground(left, top, right, bottom, key, duration) {
    const { animateSelection } = this.props;
    return (
        <div key={key} className='edit-grid-selection-highlight' style={{
          left: this.calcWidth(0, left),
          top: this.calcHeight(0, top),
          width: this.calcWidth(left, right - left + 1),
          height: this.calcHeight(top, bottom - top + 1),
          position: 'absolute',
          borderWidth: 0,
          pointerEvents: 'none',
          transition: animateSelection ? '' : `left ${duration}, top ${duration}, width ${duration}, height ${duration}`,
        }} />
    );
  }

  renderMark() {
    const { mark } = this.props;
    if (!mark) {
      return null;
    }
    const { left, top, right, bottom } = mark;
    const borderWidth = 2;
    const background = mark.type === 'cut' ? '#FFFFFF99' : null;
    return (
        <div style={{
          left: this.calcWidth(0, left) - borderWidth + 1,
          top: this.calcHeight(0, top) - borderWidth + 1,
          width: this.calcWidth(left, right - left + 1) + borderWidth * 2 - 3,
          height: this.calcHeight(top, bottom - top + 1) + borderWidth * 2 - 3,
          position: 'absolute',
          background: background,
          border: `${borderWidth}px dashed #0D70FF`,
          pointerEvents: 'none',
        }} />
    );
  }
  findBigCell(tableRows, row, col) {
    let x = col, y = row;
    while (x >= 0 && y >= 0) {
      const cell = tableRows[y][x];
      // 包含
      if (cell.display && x + cell.colspan > col && y + cell.rowspan > row) {
        return { row: y, col: x, cell };
      }
      if (cell.display || y === 0) {
        x -= 1;
        y = row;
      } else {
        y -= 1;
      }
    }
  }
  findBigCellUp(tableRows, row, col) {
    for (let y = row; y >= 0; y--) {
      let cell = tableRows[y][col];
      if (cell.display) {
        return { row: y, col, cell };
      }
    }
  }
  findBigCellLeft(tableRows, row, col) {
    for (let x = col; x >= 0; x--) {
      let cell = tableRows[row][x];
      if (cell.display) {
        return { row, col: x, cell };
      }
    }
  }
  /**查找超出可视区域的单元格（合并的大单元格） */
  findOverflowCells(tableRows, top, left, right, bottom) {
    // 上方合并单元格
    let upMap = new Map();
    // 左侧合并单元格
    let leftMap = new Map();
    if (left > right || top > bottom) {
      return { upMap, leftMap };
    }
    // 左上角单元格
    let topLeftCell = { row: top, col: left, cell: tableRows[top][left] };
    if (!topLeftCell.cell.display) {
      let bigCell = this.findBigCell(tableRows, top, left);
      topLeftCell = bigCell;
      if (bigCell.row < top) {
        upMap.set(bigCell.row, new Set([bigCell.col]));
      }
      else {
        leftMap.set(bigCell.row, new Set([bigCell.col]));
      }
    }

    // 查找上方
    let x = topLeftCell.col + topLeftCell.cell.colspan;
    while (x <= right) {
      let temp = tableRows[top][x];
      if (temp.display) {
        x += temp.colspan;
      }
      else {
        let bigCell = this.findBigCellUp(tableRows, top, x);
        if (!bigCell) {
          throw new Error(`${addressConverter.columnNumberToName(x + 1)}${top + 1} 单元格附近数据结构有错误，请检查`);
        }
        if (!upMap.has(bigCell.row)) {
          upMap.set(bigCell.row, new Set());
        }
        upMap.get(bigCell.row).add(bigCell.col);
        x += bigCell.cell.colspan;
      }
    }
    // 查找左侧
    let y = topLeftCell.row + topLeftCell.cell.rowspan;
    while (y <= bottom) {
      let temp = tableRows[y][left];
      if (temp.display) {
        y += temp.rowspan;
      }
      else {
        let bigCell = this.findBigCellLeft(tableRows, y, left);
        if (!bigCell) {
          throw new Error(`${addressConverter.columnNumberToName(left + 1)}${y + 1} 单元格附近数据结构有错误，请检查`);
        }
        if (!leftMap.has(bigCell.row)) {
          leftMap.set(bigCell.row, new Set());
        }
        leftMap.get(bigCell.row).add(bigCell.col);
        y += bigCell.cell.rowspan;
      }
    }
    return { upMap, leftMap };
  }
  renderRows(calcWidth, calcHeight) {
    let { tableRows, lazy, renderRange } = this.props;
    // console.log('renderRows:', renderRange, tableRows);
    if (!lazy) {
      renderRange = { left: 0, top: 0, right: this.props.widths.length - 1, bottom: tableRows.length - 1 };
    } else if (!renderRange) {
      return null;
    }

    // 行元素集合
    let rows = [];

    let { left, top, right, bottom } = renderRange;
    right = Math.min(right, this.props.widths.length - 1);
    bottom = Math.min(bottom, tableRows.length - 1);
    if (left > right) {
      return;
    }

    const frozenRowCount = this.props.frozenRowCount || 0;
    const frozenColCount = this.props.frozenColCount || 0;
    const { upMap, leftMap } = this.findOverflowCells(tableRows, top, left, right, bottom);
    // 冻结列可视区域上方合并单元格
    const frozenRowOverflowCells = this.findOverflowCells(tableRows, top, 0, frozenColCount - 1, bottom);
    // 合并冻结列和非冻结列的可视区域上方的单元格 map
    for (const [rowIndex, colIndexSet] of frozenRowOverflowCells.upMap) {
      if (upMap.has(rowIndex)) {
        for (const colIndex of colIndexSet) {
          upMap.get(rowIndex).add(colIndex);
        }
      } else {
        upMap.set(rowIndex, colIndexSet);
      }
    }
    // 渲染上方单元格
    upMap.forEach((set, rowIndex) => {
      let cells = [];
      // 渲染非冻结列的单元格
      set.forEach(columnIndex => {
        if (columnIndex >= frozenColCount) {
          cells.push(this.renderCell(rowIndex, columnIndex, calcWidth, calcHeight));
        }
      });
      // 渲染冻结列的单元格
      set.forEach(columnIndex => {
        if (columnIndex < frozenColCount) {
          cells.push(this.renderCell(rowIndex, columnIndex, calcWidth, calcHeight, true, this.props.scrollLeft));
        }
      });
      rows.push(this.renderRow(rowIndex, cells, calcHeight));
    });
    // 渲染可视范围的行
    for (let rowIndex = top; rowIndex <= bottom; rowIndex++) {
      let cells = [];
      // 渲染左侧单元格
      if (leftMap.has(rowIndex)) {
        leftMap.get(rowIndex).forEach(col => {
          cells.push(this.renderCell(rowIndex, col, calcWidth, calcHeight));
        });
      }
      if (rowIndex >= frozenRowCount) {
        // 渲染范围内单元格
        for (let columnIndex = left; columnIndex <= right; columnIndex++) {
          if (columnIndex >= frozenColCount) {
            cells.push(this.renderCell(rowIndex, columnIndex, calcWidth, calcHeight));
          }
        }
        for (let i = 0; i < frozenColCount; i++) {
          cells.push(this.renderCell(rowIndex, i, calcWidth, calcHeight, true, this.props.scrollLeft));
        }
        rows.push(this.renderRow(rowIndex, cells, calcHeight));
      }
    }

    // 渲染冻结行
    for (let i = 0; i < frozenRowCount; i++) {
      let cells = [];
      for (let columnIndex = 0; columnIndex <= right; columnIndex++) {
        if (columnIndex >= frozenColCount) {
          cells.push(this.renderCell(i, columnIndex, calcWidth, calcHeight, true));
        }
      }
      for (let m = 0; m < frozenColCount; m++) {
        cells.push(this.renderCell(i, m, calcWidth, calcHeight, true, this.props.scrollLeft));
      }
      const colHeaderHeight = this.props.isTaskView ? 30 : 0;
      rows.push(this.renderRow(i, cells, calcHeight, this.props.scrollTop ? this.props.scrollTop - colHeaderHeight : 0));
    }
    return rows;
  }

  renderRow(rowIndex, cells, calcHeight, offsetTop = 0) {
    let top = calcHeight(0, rowIndex) + (offsetTop < 0 ? 0 : offsetTop);
    let backgroundColor;
    if (offsetTop > 0) backgroundColor = 'white';
    const rowKey = this.props.getRowKey ? this.props.getRowKey(rowIndex) : rowIndex;
    return (<div key={rowKey} data-index={rowIndex} className='spreadsheet-tr'
                 style={{ position: 'absolute', left: 0, top, backgroundColor }}>
      {cells}
    </div>);
  }
  renderCell(rowIndex, columnIndex, calcWidth, calcHeight, isWhite = false, offsetLeft = 0) {
    let { tableRows, renderCellContent, renderCellExtra, editingCell, rowProps, colProps } = this.props;
    let cell = tableRows[rowIndex][columnIndex];
    if (!cell) return;
    let { rowspan, colspan } = cell;
    let width = calcWidth(columnIndex, colspan);
    let height = calcHeight(rowIndex, rowspan);
    let left = calcWidth(0, columnIndex) + offsetLeft;
    let zIndex = offsetLeft ? 1 : 0;
    if (this.props.isCellHidden) {
      if (!width || !height) {
        cell = { ...cell, display: false };
      }
    }
    return (<Cell key={columnIndex}
                  {...{ rowIndex, columnIndex, cell, width, height, left, renderCellContent, renderCellExtra, editingCell, zIndex }}
        // isSelect={this.cellSelect(rowIndex + ',' + columnIndex, 'tableHeader')}
                  onMouseDown={this.handleCellMouseDown}
                  onMouseEnter={this.handleCellMouseEnter}
                  renderedBorders={this.renderedBorders}
                  isWhite={isWhite}
    />);
  }
  renderInput() {
    const renderInput = this.props.renderInput;
    if (!renderInput) {
      return null;
    }
    const { calcHeight, calcWidth } = this;
    return renderInput({ calcHeight, calcWidth });
  }
  renderedBorders; // 为了相邻单元格渲染的时候边框不重复，记录一下
  render() {
    this.renderedBorders = new Map();
    const {
      tableRows,
      left,
      widths,
      heights,
      style,
      className,
    } = this.props;
    const calcWidth = this.getRangeCalculator(widths);
    const calcHeight = this.getRangeCalculator(heights);
    this.calcWidth = calcWidth;
    this.calcHeight = calcHeight;
    const finalStyle = {
      position: 'absolute',
      left: `${isNaN(left) ? 30 : left}px`,
      borderWidth: '1px 0 0 1px',
      height: calcHeight(0, tableRows.length) + 1,
      width: calcWidth(0, widths.length) + 1,
    };
    style && (Object.assign(finalStyle, style));
    let finalClassName = 'table-box th-box';
    className && (finalClassName += ' ' + className);
    return (
        <div
            style={finalStyle}
            className={finalClassName}
            onMouseUp={this.handleMouseUp}
            onMouseDown={this.onMouseDown}
            ref={this.refTable}
        >
          {this.renderRows(calcWidth, calcHeight)}
          {/* 标记框 */}
          {this.renderMark()}
          {/* 选择框 */}
          {this.renderSelection()}
          {this.renderSelectionDragTarget()}
          {this.renderInput()}
          {this.props.renderCustom && this.props.renderCustom(calcWidth, calcHeight)}
        </div>
    );
  }
}

class Cell extends PureComponent {
  handleMouseDown = e => {
    if (e.target.nodeName === 'INPUT') {
      return;
    }
    const { onMouseDown } = this.props;
    onMouseDown && onMouseDown({ ...this.props }, e);
  };
  handleMouseOver = e => {
    if (this.isMouseOver) {
      return;
    }
    this.isMouseOver = true;
    const { onMouseEnter } = this.props;
    onMouseEnter && onMouseEnter({ ...this.props }, e);
  };
  handleMouseOut = e => {
    this.isMouseOver = false;
  };
  renderExpandMark() {
    const { cell } = this.props;
    if (cell.expand && cell.expand.direction) {
      const direction = cell.expand.direction;
      let mark;
      if (direction === 'v') {
        mark = '↓';
      } else if (direction === 'h') {
        mark = '→';
      }
      return <div style={{ position: "absolute", left: 2, top: 2, fontSize: 10, color: 'gray' }}>{mark}</div>;
    }
  }
  render() {
    const { rowIndex, columnIndex, cell, isSelect, width, height, left, renderCellContent, renderCellExtra, renderedBorders, zIndex } = this.props;
    const cellKey = `${rowIndex},${columnIndex}`;
    const icon = cell.extendProp || cell.dimProp ? <i className="icon iconfont icon-setup" /> : undefined;
    let noLeft = false; // 不需要左边框了
    if (columnIndex > 0 && cell.rowspan === 1) {
      const leftCellKey = `${rowIndex},${columnIndex - 1}`;
      if (renderedBorders.has(leftCellKey)) {
        const leftCellBorder = renderedBorders.get(leftCellKey);
        if (leftCellBorder.right) {
          noLeft = true;
        }
      }
    }

    let noTop = false; // 不需要上边框了
    if (rowIndex > 0 && cell.colspan === 1) {
      const upCellKey = `${rowIndex - 1},${columnIndex}`;
      if (renderedBorders.has(upCellKey)) {
        const upCellBorder = renderedBorders.get(upCellKey);
        if (upCellBorder.bottom) {
          noTop = true;
        }
      }
    }

    let leftStyle = noLeft ? '' : borderCssStyle(cell, 'left');
    let topStyle = noTop ? '' : borderCssStyle(cell, 'top');
    const rightStyle = borderCssStyle(cell, 'right');
    const bottomStyle = borderCssStyle(cell, 'bottom');

    // 把右边框记下来
    if (rightStyle) {
      for (let i = 0; i < cell.rowspan; i++) {
        const key = `${rowIndex + i},${columnIndex + cell.colspan - 1}`;
        let obj = renderedBorders.get(key);
        if (!obj) {
          obj = {};
          renderedBorders.set(key, obj);
        }
        obj.right = rightStyle;
      }
    }

    // 把底边框记下来
    if (bottomStyle) {
      for (let i = 0; i < cell.colspan; i++) {
        const key = `${rowIndex + cell.rowspan - 1},${columnIndex + i}`;
        let obj = renderedBorders.get(key);
        if (!obj) {
          obj = {};
          renderedBorders.set(key, obj);
        }
        obj.bottom = rightStyle;
      }
    }

    let borderLeftColor, borderRightColor, borderTopColor, borderBottomColor;
    if (cell.border) {
      borderLeftColor = leftStyle && (cell.border.left.color || 'black');
      borderRightColor = rightStyle && (cell.border.right.color || 'black');
      borderTopColor = topStyle && (cell.border.top.color || 'black');
      borderBottomColor = bottomStyle && (cell.border.bottom.color || 'black');
    }
    let borderLeftWidth = leftStyle ? leftStyle.width : 0;
    let borderRightWidth = rightStyle ? rightStyle.width : 1;
    let borderTopWidth = topStyle ? topStyle.width : 0;
    let borderBottomWidth = bottomStyle ? bottomStyle.width : 1;
    // 边距保证下边框和下方单元格的上边框对齐，右边框和右方单元格的左边框对齐。
    // let marginRight = borderRightWidth < 3 ? 0 : -1;
    // let marginLeft = 0 - (borderRightWidth + marginRight);
    // let marginBottom = borderBottomWidth < 3 ? 0 : -1;
    // let marginTop = 0 - (borderBottomWidth + marginBottom);
    let marginRight = 0;
    let marginLeft = 0 - borderLeftWidth;
    let marginBottom = 0;
    let marginTop = 0 - borderTopWidth;
    const cellWidth = width - marginLeft - marginRight;
    const cellHeight = height - marginTop - marginBottom;
    return (
        <div
            data-index={rowIndex + ',' + columnIndex}
            className={isSelect ? 'select th-box' : 'th-box'}
            style={{
              backgroundColor: this.props.isWhite ? 'white' : (cell.isErrorCell ? 'yellow' : undefined),
              position: 'absolute',
              zIndex,
              // borderWidth: '0 1px 1px 0',
              // left
              borderLeftWidth,
              borderLeftStyle: leftStyle && leftStyle.style,
              borderLeftColor,
              // right
              borderRightWidth,
              borderRightStyle: rightStyle && rightStyle.style,
              borderRightColor,
              // top
              borderTopWidth,
              borderTopStyle: topStyle && topStyle.style,
              borderTopColor,
              // bottom
              borderBottomWidth,
              borderBottomStyle: bottomStyle && bottomStyle.style,
              borderBottomColor,
              top: marginTop,
              left: left + marginLeft,
              overflow: 'hidden',
              width: cellWidth,
              height: cellHeight,
              display: cell.display ? 'table-cell' : 'none'
            }}
            onMouseDown={this.handleMouseDown}
            onMouseOver={this.handleMouseOver}
            onMouseOut={this.handleMouseOut}>
          {renderCellContent({
            ...this.props,
            width: cellWidth - borderLeftWidth - borderRightWidth,
            height: cellHeight - borderTopWidth - borderBottomWidth,
          })}
          {this.renderExpandMark()}
          {renderCellExtra && renderCellExtra(this.props, icon)}
        </div>
    );
  }
}

export function getRenderRange(gridElement, canvasElement, widths, heights) {
  if (!gridElement || !canvasElement) {
    return null;
  }
  // 表格矩形
  const gridRect = gridElement.getBoundingClientRect();
  // 面板矩形
  const canvasRect = canvasElement.getBoundingClientRect();
  // 表格和面板相交部分，即可视部分的矩形
  const rect = {
    left: Math.max(gridRect.left, canvasRect.left),
    top: Math.max(gridRect.top, canvasRect.top),
    right: Math.min(gridRect.right, canvasRect.right),
    bottom: Math.min(gridRect.bottom, canvasRect.bottom),
  };
  if (rect.left >= rect.right || rect.top >= rect.bottom) {
    return null;
  }
  // 相对于表格的可视矩形
  const relativeRect = {
    left: rect.left - gridRect.left,
    right: rect.right - gridRect.left,
    top: rect.top - gridRect.top,
    bottom: rect.bottom - gridRect.top
  };

  // 根据可视矩形求出可视的行列范围
  const renderRange = { left: -1, right: -1, top: -1, bottom: -1 };
  let width = 0;
  for (let i = 0; i < widths.length; i++) {
    width += widths[i];
    if (renderRange.left < 0 && width >= relativeRect.left) {
      renderRange.left = i;
    }
    if (width >= relativeRect.right || i === widths.length - 1) {
      renderRange.right = i;
      break;
    }
  }
  let height = 0;
  for (let i = 0; i < heights.length; i++) {
    height += heights[i];
    if (renderRange.top < 0 && height >= relativeRect.top) {
      renderRange.top = i;
    }
    if (height >= relativeRect.bottom || i === heights.length - 1) {
      renderRange.bottom = i;
      break;
    }
  }
  return renderRange;
}

export function isRangeEqual(range1, range2) {
  if (range1 && range2) {
    return range1.left === range2.left
        && range1.right === range2.right
        && range1.top === range2.top
        && range1.bottom === range2.bottom;
  }
  return !!range1 === !!range2;
}
