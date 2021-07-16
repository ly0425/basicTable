// import XlsxPopulate from 'xlsx-populate';
import addressConverter from 'xlsx-populate/lib/addressConverter';
import Color from 'color';
import produce from 'immer';
import PropertyUtils from '@/routes/visualizationModel/tableDesigner/components/PropertyUtils';
import { getSelectList } from '@/routes/visualizationModel/SpreadsheetDesigner/components/BudgetRuntime';

function pointToAddress(row, col) {
  return addressConverter.columnNumberToName(col + 1) + (row + 1);
}

export function tableToSheet(table, sheet, getCompleteTableCell) {
  // 去隐藏行
  table = produce(table, draft => {
    const { rowProps } = draft;
    for (let i = rowProps.length - 1; i >= 0; i--) {
      const rowProp = rowProps[i];
      // 表尾导出
      if (rowProp.isReportFooter) {
        rowProp.isHidden = false;
        draft.heights[i] = 24;
      }
      if (rowProp.isHidden) {
        // draft.rowProps.splice(i, 1);
        // draft.tableRows.splice(i, 1);
        // draft.heights.splice(i, 1);
        const findBigCellUp = (rowIndex, colIndex) => {
          for (let row = rowIndex; row >= 0; row--) {
            let tempCell = this.tableRows[row][colIndex];
            if (tempCell.display) {
              return tempCell;
            }
          }
        }
        let col = 0;
        while (col < draft.widths.length) {
          let cell = draft.tableRows[i][col];
          if (cell.display) {
            if (cell.rowspan > 1) {
              // 删除合并单元格的首格时，下方单元格成为首格
              let downCell = draft.tableRows[i + 1][col];
              downCell.display = 1;
              downCell.rowspan = cell.rowspan - 1;
              downCell.colspan = cell.colspan;
              // 原单元格内容显示在下方单元格中
              downCell.textBox.value = cell.textBox.value;
            }
            col += cell.colspan;
          } else {
            // 找到穿越的单元格
            let bigCell = findBigCellUp(i, col);
            // rowspan 减一
            bigCell.rowspan -= 1;
            col += bigCell.colspan;
          }
        }
        draft.tableRows.splice(i, 1);
        draft.heights.splice(i, 1);
        draft.rowProps.splice(i, 1);
        // draft.removeHiddenRow(i);
      }
    }
  });
  const tableArray = table.tableRows;
  const { rowProps, colProps, frozenColCount, frozenRowCount } = table;
  typeof sheet.freezePanes == 'function' && sheet.freezePanes(frozenColCount ? frozenColCount : 0, frozenRowCount ? frozenRowCount : 0);
  for (let r = 0; r < tableArray.length; r++) {
    for (let c = 0; c < tableArray[r].length; c++) {
      let tmp = tableArray[r][c];
      if (tmp.display === 1) {
        tmp = getCompleteTableCell(tmp);
        const cell = sheet.cell(pointToAddress(r, c));
        let value = tmp.textBox.value;
        if (!(typeof value === 'string' && value.trim().indexOf('=') === 0)) {
          value = PropertyUtils.conversionFormat(value, tmp.textBox.formatObject);
        }
        if (rowProps && rowProps[r] && (rowProps[r].dimensionData || rowProps[r].rowType === 'float')
          && colProps && colProps[c] && colProps[c].extendProp) {
          const { extendProp } = colProps[c];
          let selectInfo = getSelectList(extendProp, value);
          let values = selectInfo.values;
          let nameField = selectInfo.nameField;
          if (values && values.length) {
            let current = values.find(item => item.id == value);
            if (current) {
              value = current[nameField];
            }
          }
        }
        cell.value(value);
        const textBox = tmp.textBox;
        const fontInfo = tmp.textBox.fontInfo;
        if (fontInfo.fontWeight.toLowerCase() === 'bold') {
          cell.style('bold', true);
        }
        if (fontInfo.fontType.toLowerCase() === 'italic') {
          cell.style('italic', true);
        }
        if (fontInfo.fontDecoration.toLowerCase() === 'underline') {
          cell.style('underline', true);
        }
        if (fontInfo.family) {
          cell.style('fontFamily', fontInfo.family);
        }
        if (fontInfo.size) {
          cell.style('fontSize', fontInfo.size);
        }
        if (textBox.horizontalAlignment) {
          cell.style('horizontalAlignment', textBox.horizontalAlignment.toLowerCase());
        }
        if (textBox.verticalAlignment === 'Top') {
          cell.style('verticalAlignment', 'top');
        } else if (textBox.verticalAlignment === 'Middle') {
          cell.style('verticalAlignment', 'center');
        } else if (textBox.verticalAlignment === 'Bottom') {
          cell.style('verticalAlignment', 'bottom');
        }
        const fontColor = toXlsxColor(textBox.fontColor);
        if (fontColor) {
          cell.style('fontColor', fontColor);
        }
        const backGroundColor = toXlsxColor(textBox.backGroundColor);
        if (backGroundColor) {
          cell.style('fill', { type: 'solid', color: backGroundColor });
        }
        const border = toXlsxBorders(tmp.border);
        if (border) {
          // cell.style('border', border);
          // Excel 的边框线是分散在各个被合并单元格上的
          for (let i = 0; i < tmp.rowspan; i++) {
            const leftCell = sheet.cell(pointToAddress(r + i, c));
            if (border.left) leftCell.style('border', { ...leftCell.style('border'), left: border.left });
            const rightCell = sheet.cell(pointToAddress(r + i, c + tmp.colspan - 1));
            if (border.right) rightCell.style('border', { ...rightCell.style('border'), right: border.right });
          }
          for (let j = 0; j < tmp.colspan; j++) {
            const topCell = sheet.cell(pointToAddress(r, c + j));
            if (border.top) topCell.style('border', { ...topCell.style('border'), top: border.top });
            const bottomCell = sheet.cell(pointToAddress(r + tmp.rowspan - 1, c + j));
            if (border.bottom) bottomCell.style('border', { ...bottomCell.style('border'), bottom: border.bottom });
          }
        }
        if (textBox.wrap === 'wrap') {
          cell.style('wrapText', true);
        }

        if (tmp.rowspan > 1 || tmp.colspan > 1) {
          cell.rangeTo(pointToAddress(r + tmp.rowspan - 1, c + tmp.colspan - 1)).merged(true);
        }
      }
    }
  }
  const { widths, heights } = table;
  for (let i = 0; i < heights.length; i++) {
    sheet.row(i + 1).height(pxToPt(heights[i]));
  }
  for (let j = 0; j < widths.length; j++) {
    sheet.column(j + 1).width(pxToXlsxWidth(widths[j]));
  }
};

export function sheetToTable(sheet, table, createTableCell) {
  const that = table;
  // 没有暴露合并单元格的
  const merged = Object.keys(sheet._mergeCells);
  const mergedSet = new Set();
  merged.forEach(addr => {
    const arr = addr.split(':');
    if (arr.length > 1) {
      const refStart = addressConverter.fromAddress(arr[0]);
      const refEnd = addressConverter.fromAddress(arr[1]);
      mergedSet.add({
        rowStart: refStart.rowNumber - 1,
        colStart: refStart.columnNumber - 1,
        rowEnd: refEnd.rowNumber,
        colEnd: refEnd.columnNumber,
      });
    }
  });
  const frozen = typeof sheet.panes == 'function' && sheet.panes();//预算导入报错了
  table.frozenColCount = 0;
  table.frozenRowCount = 0;
  if (frozen) {
    const { xSplit, ySplit } = frozen;
    table.frozenColCount = xSplit;
    table.frozenRowCount = ySplit;
  }
  const endCell = sheet.usedRange().endCell();
  const rowCount = endCell.rowNumber();
  const columnCount = endCell.columnNumber();
  const tableArray = [];
  const pointToAddress = (row, col) => {
    return addressConverter.columnNumberToName(col + 1) + (row + 1);
  };
  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < columnCount; c++) {
      const cell = sheet.cell(pointToAddress(r, c));
      if (tableArray.length <= r) {
        tableArray[r] = [];
      }
      let tmp = createTableCell();
      const value = parseExcelCellValue(cell);
      const fontInfo = { ...tmp.textBox.fontInfo };
      const textBox = { ...tmp.textBox };
      if (cell.style('bold')) {
        fontInfo.fontWeight = 'Bold';
      }
      if (cell.style('italic')) {
        fontInfo.fontType = 'Italic';
      }
      if (cell.style('underline')) {
        fontInfo.fontDecoration = 'UnderLine';
      }
      fontInfo.family = cell.style('fontFamily');
      fontInfo.size = cell.style('fontSize');
      const horizontalAlignment = cell.style('horizontalAlignment');
      if (horizontalAlignment === 'left') {
        textBox.horizontalAlignment = 'Left';
      } else if (horizontalAlignment === 'center') {
        textBox.horizontalAlignment = 'Center';
      } else if (horizontalAlignment === 'right') {
        textBox.horizontalAlignment = 'Right';
      } else {
        // 默认对齐方式，文本左对齐，数值右对齐
        textBox.horizontalAlignment = typeof value === 'number' ? 'Right' : 'Left';
      }
      const verticalAlignment = cell.style('verticalAlignment');
      if (verticalAlignment === 'top') {
        textBox.verticalAlignment = 'Top';
      } else if (verticalAlignment === 'center') {
        textBox.verticalAlignment = 'Middle';
      } else {
        textBox.verticalAlignment = 'Bottom';
      }
      const fontColor = fromXlsxColor(cell.style('fontColor'));
      if (fontColor) {
        textBox.fontColor = fontColor;
      }
      const backGroundColor = fromFill(cell.style('fill'));
      if (backGroundColor) {
        textBox.backGroundColor = backGroundColor;
      }
      const border = fromXlsxBorders(cell.style('border'));
      if (border) {
        tmp = { ...tmp, border };
      }
      textBox.wrap = cell.style('wrapText') ? 'wrap' : 'nowrap';
      tmp = { ...tmp, textBox: { ...textBox, value, fontInfo } };
      tableArray[r][c] = tmp;
    }
  }
  for (const { rowStart, rowEnd, colStart, colEnd } of mergedSet) {
    for (let r = rowStart; r < rowEnd; r++) {
      for (let c = colStart; c < colEnd; c++) {
        tableArray[r][c].display = 0;
      }
    }
    tableArray[rowStart][colStart].display = 1;
    tableArray[rowStart][colStart].rowspan = rowEnd - rowStart;
    tableArray[rowStart][colStart].colspan = colEnd - colStart;
  }
  that.tableRows = tableArray;
  that.heights = Array.from({ length: rowCount }, (v, k) => {
    return Math.max(ptTopx(sheet.row(k + 1).height() || 0), 24);
  });
  that.widths = Array.from({ length: columnCount }, (v, k) => {
    return Math.max(xlsxWidthToPx(sheet.column(k + 1).width() || 0), 100);
  });
  that.rowProps = new Array(rowCount).fill({});
  that.colProps = new Array(columnCount).fill({});
}

// TODO 是否要支持富文本
function parseExcelCellValue(cell) {
  // 如果有公式，导入公式
  let formula = cell.formula();
  if (formula) {
    return '=' + formula;
  }
  const value = cell.value();
  if (typeof value === 'number') {
    return value;
  }
  if (!value) {
    return '';
  }
  if (value.constructor === Array) {
    // 富文本转为纯文本
    return value.map(item => {
      if (!item.children || item.children.length === 0) {
        return '';
      }
      return item.children.find(child => child.name === 't')
        .children.reduce((str, t) => str + t, '');
    }).reduce((str, t) => str + t);
  }
  if (typeof value === 'object') {
    return value._error || '';
  }
  return value;
}

// Excel行高所使用单位为磅，列宽使用单位为0.1英寸。
function ptTopx(pt) {
  return pt / 72 * 96;
}

function pxToPt(px) {
  return px / 96 * 72;
}

function xlsxWidthToPx(width) {
  return width * 0.1 * 72;
}

function pxToXlsxWidth(px) {
  return px / 72 * 10;
}

function fromXlsxColor(color) {
  if (!color) {
    return;
  }
  if (!color.rgb) {
    if (typeof color.theme === 'number') {
      return getThemeColor(color.theme, color.tint);
    } else {
      return;
    }
  }
  try {
    let rgb = color.rgb;
    if (rgb.indexOf('System') === 0) {
      // 系统颜色不处理
      return;
    }
    if (rgb.length === 8) {
      // 这里面 alpha 在前，改到后面
      rgb = rgb.slice(2, 8) + rgb.slice(0, 2);
    }
    const { r, g, b } = Color('#' + rgb).object();
    return `rgba(${r},${g},${b},1)`;
  } catch (er) {
    console.warn('导入颜色错误', er);
    // 转换不了的颜色按默认值
    return;
  }
}

function fromFill(fill) {
  // console.log('fill', fill);
  if (fill && fill.type === 'solid') {
    return fromXlsxColor(fill.color);
  }
  return '';
}

function toXlsxColor(color) {
  if (!color) {
    return null;
  }
  try {
    let hex = Color(color).hex();
    if (hex && hex.indexOf('#') === 0) {
      hex = hex.slice(1, hex.length);
    }
    return { rgb: hex };
  } catch (er) {
    console.warn('导出颜色错误', er);
    return;
  }
}

function fromXlsxBorders(borders) {
  if (!borders) return;
  let result;
  ['left', 'right', 'top', 'bottom'].forEach(key => {
    const border = fromXlsxBorder(borders[key]);
    if (border) {
      if (!result) result = {};
      result[key] = border;
    }
  });
  return result;
}

function fromXlsxBorder(border) {
  if (!border) return;
  const result = {};
  if (border.style) {
    result.style = border.style;
  }
  if (border.color) {
    result.color = fromXlsxColor(border.color);
  }
  return result;
}

function toXlsxBorders(borders) {
  if (!borders) return;
  let result;
  ['left', 'right', 'top', 'bottom'].forEach(key => {
    const border = toXlsxBorder(borders[key]);
    if (border) {
      if (!result) result = {};
      result[key] = border;
    }
  });
  return result;
}

function toXlsxBorder(border) {
  if (!border) return;
  const result = {};
  if (border.style) {
    result.style = border.style;
  }
  if (border.color) {
    result.color = toXlsxColor(border.color);
  }
  return result;
}

// 默认 Office 主题颜色
const officeThemeColors = [
  'FFFFFF', // lt1
  '000000', // dk1
  'E7E6E6', // lt2
  '44546A', // dk2
  '4472C4', // accent1
  'ED7D31', // accent2
  'A5A5A5', // accent3
  'FFC000', // accent4
  '5B9BD5', // accent5
  '70AD47', // accent6
];

function getThemeColor(theme, tint) {
  if (theme > 9) {
    return;
  }
  try {
    const rgb = officeThemeColors[theme];
    const baseColor = Color('#' + rgb);
    let resultColor;
    const number = parseFloat(tint);
    if (isNaN(number) || !number) {
      resultColor = baseColor;
    } else if (number > 0) {
      resultColor = baseColor.hsl().lighten(number).rgb();
    } else { //number < 0
      resultColor = baseColor.hsl().darken(0 - number).rgb();
    }
    const { r, g, b } = resultColor.object();
    if (typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number') {
      return;
    }
    return `rgba(${r},${g},${b},1)`;
  } catch (er) {
    // 不识别的主题颜色
    return;
  }
}