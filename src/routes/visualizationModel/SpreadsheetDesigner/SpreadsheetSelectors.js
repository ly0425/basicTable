import { UPDATE_TABLE } from './SpreadsheetTypes';
import { createSpreadsheet, defaultTextBox, navSelectionInside } from '@model/ReportModel/Spreadsheet';
import { mergeObject } from "./components/SpreadsheetUtils";

const spreadsheet = createSpreadsheet();
const keys = Object.keys(spreadsheet);
const tableActionKeys = keys.filter(key => typeof spreadsheet[key] === 'function');

export function bindTableActions(dispatch) {
  const actions = {};
  tableActionKeys.forEach(key => actions[key] = function () {
    dispatch({ type: UPDATE_TABLE + key, args: [...arguments] });
  });
  return actions;
}

export function getSelectedCell(state, namespace = 'Spreadsheet') {
  const sheets = state[namespace].ReportBody.sheets;
  if (sheets.length < 1) {
    return null;
  }
  const model = sheets[0].present;
  let point = null;
  let selection = model.getCurrentSelection();
  if (selection) {
    if (selection.primary) {
      point = { row: selection.primary.top, col: selection.primary.left };
    } else {
      point = { row: selection.top, col: selection.left };
    }
  }
  if (!point) {
    return null;
  }
  let p = point;
  let tableArray = model.tableRows;
  if (p.row >= tableArray.length) {
    p.row = tableArray.length - 1;
  }
  if (p.col >= tableArray[p.row].length) {
    p.col = tableArray[p.row].length - 1;
  }
  return tableArray[p.row][p.col];
}

export function getSelectedCellTextBox(state) {
  const cell = getSelectedCell(state);
  if (!cell) {
    return null;
  }
  return mergeObject(cell.textBox, defaultTextBox);
}

export function getSelectedCellFontInfo(state) {
  let textBox = getSelectedCellTextBox(state);
  if (textBox) {
    return mergeObject(textBox.fontInfo, defaultTextBox);
  }
  return { fontWeight: 'Normal', fontDecoration: 'Normal', fontType: 'Normal' };
}

export function getSelectedRow(state) {
  const sheets = state.Spreadsheet.ReportBody.sheets;
  if (sheets.length < 1) {
    return null;
  }
  const model = sheets[0].present;
  let selection = model.getCurrentSelection();
  if (selection && selection.type === 'row') {
    return model.rowProps[selection.top] || {};
  }
  return null;
}

export function getSelectedCol(state) {
  const sheets = state.Spreadsheet.ReportBody.sheets;
  if (sheets.length < 1) {
    return null;
  }
  const model = sheets[0].present;
  let selection = model.getCurrentSelection();
  if (selection && selection.type === 'col') {
    return model.colProps[selection.left] || {};
  }
  return null;
}

export function getCurrentSelection(state) {
  const sheets = state.Spreadsheet.ReportBody.sheets;
  if (sheets.length < 1) {
    return null;
  }
  const model = sheets[0].present;
  let selection = model.getCurrentSelection();
  return selection;
}

export function getTableRows(state) {
  const sheets = state.Spreadsheet.ReportBody.sheets;
  if (sheets.length < 1) {
    return null;
  }
  return sheets[0].present.tableRows;
}

export function getSheet(state) {
  const sheets = state.Spreadsheet.ReportBody.sheets;
  if (sheets.length < 1) {
    return null;
  }
  return sheets[0].present;
}

//-----边框 begin

export const borderStyles = [
  { name: 'dotted', cssWidth: 1, cssStyle: 'dotted' },
  { name: 'dashed', cssWidth: 1, cssStyle: 'dashed' },
  { name: 'thin', cssWidth: 1, cssStyle: 'solid' },
  { name: 'mediumDashed', cssWidth: 2, cssStyle: 'dashed' },
  { name: 'medium', cssWidth: 2, cssStyle: 'solid' },
  { name: 'thick', cssWidth: 3, cssStyle: 'solid' },
  { name: 'double', cssWidth: 3, cssStyle: 'double' },
];

export function borderCssStyle(cell, side) {
  if (cell.border && cell.border[side] && cell.border[side].style && cell.border[side].style !== 'none') {
    const item = borderStyles.find(s => s.name === cell.border[side].style);
    if (!item) {
      // 不支持的 style
      return '';
    }
    return { width: item.cssWidth, style: item.cssStyle };
  }
  return '';
}

function getBorder(cell, side) {
  if (cell.border && cell.border[side]) {
    return { ...cell.border[side], style: cell.border[side].style || 'none' };
  }
  return { style: 'none' };
}

const borderKeys = ['style', 'color'];
function toOneBorder(...borders) {
  const first = borders[0];
  if (!first) {
    return null;
  }
  const one = {};
  for (const key of borderKeys) {
    if (borders.findIndex((border, index) => (index > 0 && !(border && border[key] === first[key]))) < 0) {
      // 全相同
      one[key] = first[key];
    }
  }
  return one;
}

export function getLeftBorder(selection, tableRows) {
  const { left, right, top, bottom } = selection;
  const cell = tableRows[top][left];
  return getBorder(cell, 'left');
}

export function getRightBorder(selection, tableRows) {
  const { left, right, top, bottom } = selection;
  const rightSide = navSelectionInside(tableRows, selection, 'right');
  const cell = rightSide.next().value;
  return getBorder(cell, 'right');
}

export function getTopBorder(selection, tableRows) {
  const { left, right, top, bottom } = selection;
  const cell = tableRows[top][left];
  return getBorder(cell, 'top');
}

export function getBottomBorder(selection, tableRows) {
  const { left, right, top, bottom } = selection;
  const bottomSide = navSelectionInside(tableRows, selection, 'bottom');
  const cell = bottomSide.next().value;
  return getBorder(cell, 'bottom');
}

export function getAllBorder(selection, tableRows) {
  return toOneBorder(
    getOuterBorder(selection, tableRows),
    getInnerBorder(selection, tableRows)
  );
}

export function getOuterBorder(selection, tableRows) {
  return toOneBorder(
    getLeftBorder(selection, tableRows),
    getRightBorder(selection, tableRows),
    getTopBorder(selection, tableRows),
    getBottomBorder(selection, tableRows)
  );
}

export function getInnerBorder(selection, tableRows) {
  const { left, right, top, bottom } = selection;
  const cell = tableRows[top][left];
  if (top + cell.rowspan - 1 < bottom) {
    if (cell.border && cell.border.bottom) {
      return {
        ...cell.border.bottom,
        style: cell.border.bottom.style || 'none'
      };
    } else {
      return { style: 'none' };
    }
  } else if (left + cell.colspan - 1 < right) {
    if (cell.border && cell.border.right) {
      return {
        ...cell.border.right,
        style: cell.border.right.style || 'none'
      };
    } else {
      return { style: 'none' };
    }
  }
  return '';
}

//-----边框 end