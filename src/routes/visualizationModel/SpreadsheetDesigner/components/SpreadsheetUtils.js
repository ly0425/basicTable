import Common from 'components/Print/Common';
import addressConverter from 'xlsx-populate/lib/addressConverter';
import { getDefaultColor } from 'components/Print/color';
import Report from 'model/ReportModel/Report.js';
import { createCellModel, cellProto, createSpreadsheet } from 'model/ReportModel/Spreadsheet';
import produce from 'immer';
import antlr4 from 'antlr4';
import { FormulaLexer } from '../formulaCalc/FormulaLexer';
import { FormulaParser } from '../formulaCalc/FormulaParser';
import ThrowingErrorListener from "../formulaCalc/ThrowingErrorListener";
import Message from '~/components/Public/Message';
const comm = new Common();

export const defaultCellWidth = 80;
export const defaultCellHeight = 24;

export const parsePoint = (p) => {
  let arr = p.split(',');
  return { row: parseInt(arr[0], 10), col: parseInt(arr[1], 10) }
}
export const getStartPointFromSet = (set) => {
  let v;
  for (let p of set) {
    let e = parsePoint(p);
    if (!v || v.col > e.col || v.row > e.row) {
      v = { ...e };
    }
  }
  return v;
}
export const getEndPointFromSet = (set) => {
  let v;
  for (let p of set) {
    let e = parsePoint(p);
    if (!v || v.col < e.col || v.row < e.row) {
      v = { ...e };
    }
  }
  return v;
}

const generateCell = ({ text, model, colspan, rowspan, display } = {}, style) => {
  let cell = createCellModel({ text, model, colspan, rowspan, display });
  if (!style) {
    return cell;
  }
  return produce(cell, draft => {
    setCssStyle(draft.textBox, style);
  });
};

export function getCssStyle(textBox) {
  textBox = { ...textBox, fontInfo: textBox.fontInfo || {} };
  let style = {
    color: textBox.fontColor
    , backgroundColor: textBox.backGroundColor
    , textAlign: textBox.horizontalAlignment
    , verticalAlign: textBox.verticalAlignment
    , fontWeight: textBox.fontInfo.fontWeight
    , fontFamily: textBox.fontInfo.family
    , fontSize: textBox.fontInfo.size
    , fontStyle: textBox.fontInfo.fontType
  };

  if (textBox.fontInfo.fontDecoration === 'Strikeout') {
    style.textDecoration = 'line-through';
  } else if (textBox.fontInfo.fontDecoration === 'UnderLine') {
    style.textDecoration = 'underline';
  }
  return style;
}

function setCssStyle(textBox, style) {
  textBox.fontColor = style.color;
  textBox.backGroundColor = style.backgroundColor;
  if (style.textAlign)
    textBox.horizontalAlignment = style.textAlign;
  if (style.verticalAlign)
    textBox.verticalAlignment = style.verticalAlign;
  if (!textBox.fontInfo) {
    textBox.fontInfo = {};
  }
  if (style.fontWeight)
    textBox.fontInfo.fontWeight = style.fontWeight;
  if (style.fontFamily) {
    textBox.fontInfo.family = style.fontFamily;
  }
  if (style.fontSize) {
    textBox.fontInfo.size = style.fontSize;
  }
  if (style.fontStyle) {
    textBox.fontInfo.fontType = style.fontStyle;
  }
  if (style.textDecoration) {
    if (style.textDecoration === 'line-through') {
      textBox.fontInfo.fontDecoration = 'Strikeout';
    } else if (style.textDecoration === 'underline') {
      textBox.fontInfo.fontDecoration = 'UnderLine';
    }
  }
}

const tableToJsonOld = (tables, version) => {
  let table = tables[0].present.tableRows;
  let rows = [];
  for (let i = 0; i < table.length; i++) {
    let row = [];
    for (let j = 0; j < table[i].length; j++) {
      if (table[i][j].display === 1) {
        let tmp = table[i][j];
        let cell;
        // ?????????????????????????????????????????????????????? {} ?????????
        cell = (tmp === cellProto) ? {} : {
          ...tmp,
          address: addressConverter.columnNumberToName(j + 1) + (i + 1),
        };
        // rowspan, colspan ??? 1 ????????????????????????
        if (cell.rowspan === 1) delete cell.rowspan;
        if (cell.colspan === 1) delete cell.colspan;
        // // ???????????????????????? id???????????????????????? id
        // if (cell.isUserIndex === 'y') {
        //   if (!cell.id) {
        //     cell.id = comm.genId();
        //   }
        // } else {
        //   if (cell.id) {
        //     delete cell.id;
        //   }
        // }
        row.push(cell);
      } else {
        // ?????????????????????????????????????????????????????????
        row.push({
          address: addressConverter.columnNumberToName(j + 1) + (i + 1),
          display: 0,
        });
      }
    }
    rows.push(row);
  }
  return { tableRows: rows };
};

export const tableToJson = (tables, analysisModelID, pageParams, doNotChangeHidden = false) => {
  const version = '2.0'; // json ??????
  let tableJson = {
    version,
    Report: new Report()
  };
  if (tables.length === 0) {
    return tableJson;
  }
  const table = tables[0].present;
  const { colProps, widths } = table
  let newColProps = colProps;
  let newWidths = widths;

  // ??????optType??????????????????????????????????????????????????????????????????????????????????????????????????????
  if (!doNotChangeHidden && pageParams && pageParams.optType) {
    newColProps = newColProps.map(x => ({ ...x }));
    newWidths = newWidths.slice();
    const first = findIndexArray(newColProps, col => col.measure && col.measure.id === 'BUDG_VALUE');
    const second = findIndexArray(newColProps, col => col.measure && col.measure.id === 'MANA_REPLY_VALUE');
    const third = findIndexArray(newColProps, col => col.measure && col.measure.id === 'REQUEST_VALUE');
    if (pageParams.optType === '1') {
      if (second.length > 0) {
        second.forEach(i => {
          newColProps[i].isHidden = false;
          newWidths[i] = 80;
        });
      }
      if (third.length > 0) {
        third.forEach(i => {
          newColProps[i].isHidden = false;
          newWidths[i] = 80;
        });
      }
    } else if (pageParams.optType === '2') {
      if (third > -1) {
        third.forEach(i => {
          newColProps[i].isHidden = false;
          newWidths[i] = 80;
        });
      }
    }
  }
  // end

  // ???????????????????????????????????? id ?????????
  const rowProps = table.rowProps.map(p => p.id ? p : { ...p, id: comm.genId('R') });
  tableJson.Report.ReportBody.Items.Sheets = {
    analysisModelID: table.analysisModelID,
    position: table.position,
    tableHeader: tableToJsonOld(tables, version),
    widthArr: newWidths,
    heightArr: {
      header: table.heights
    },
    rowProps: rowProps,
    colProps: newColProps,
    checkFormulas: table.checkFormulas,
    digit: table.digit,
    noNeedParams: table.noNeedParams,
    categoryID: table.categoryID,
    zeroAs: table.zeroAs,
    serialAddress: table.serialAddress,
    pageDimensions: table.pageDimensions,
    uploadParameters: table.uploadParameters,
    spreadsheetType: table.spreadsheetType,
    auditFormulaList: table.auditFormulaList || [],
    doNotSum: table.doNotSum,
    frozenRowCount: table.frozenRowCount,
    frozenColCount: table.frozenColCount,
    budgetTreeFieldFlatList: table.budgetTreeFieldFlatList || [],//????????????????????????????????????
  };
  return tableJson;
}

// ????????? json ???????????????
const rowsJsonToRowsArray_version0 = (modelRows) => {
  let rows = [];
  let hideMap = new Map();
  for (let i = 0; i < modelRows.length; i++) {
    let row = [];
    let rowMap = hideMap.has(i) ? hideMap.get(i) : new Map();
    while (rowMap.has(row.length)) {
      let obj = generateCell({ display: 0 }, rowMap.get(row.length));
      row.push(obj);
    }
    for (let j = 0; j < modelRows[i].length; j++) {
      let cell = modelRows[i][j] || cellProto;
      let parm = {
        text: cell.text,
        model: cell.model,
        rowspan: cell.rowspan,
        colspan: cell.colspan,
        display: 1
      };
      let obj = generateCell(parm, cell.style);
      row.push(obj);
      if (obj.colspan > 1) {
        for (let k = 1; k < cell.colspan; k++) {
          obj = generateCell({ display: 0 }, cell.style);
          row.push(obj);
        }
      }
      if (cell.rowspan > 1) {
        for (let k = 0; k < cell.rowspan; k++) {
          let rIndex = i + k;
          let mp;
          if (hideMap.has(rIndex)) {
            mp = hideMap.get(rIndex);
          } else {
            mp = new Map();
            hideMap.set(rIndex, mp);
          }
          let cIndex = row.length;
          for (let m = 0; m < cell.colspan; m++) {
            mp.set(cIndex - m - 1, cell.style);
          }
        }
      }
      while (rowMap.has(row.length)) {
        let obj = generateCell({ display: 0 }, rowMap.get(row.length));
        row.push(obj);
      }
    }
    rows.push(row);
  }
  return rows;
};
const rowsJsonToRowsArray_version1 = (modelRows) => {
  let rows = [];
  let hideMap = new Map();
  for (let i = 0; i < modelRows.length; i++) {
    let row = [];
    let rowMap = hideMap.has(i) ? hideMap.get(i) : new Map();
    while (rowMap.has(row.length)) {
      let obj = { ...cellProto, display: 0 };
      row.push(obj);
    }
    for (let j = 0; j < modelRows[i].length; j++) {
      let cell = modelRows[i][j];
      let obj;
      if (cell) {
        // ??? textBox ?????????????????????????????????????????????
        obj = { ...cell, textBox: { ...cellProto.textBox, ...cell.textBox } };
        delete obj.address;
      } else {
        obj = cellProto;
      }
      row.push(obj);
      if (obj.colspan > 1) {
        for (let k = 1; k < cell.colspan; k++) {
          obj = { ...cellProto, display: 0 };
          row.push(obj);
        }
      }
      if (cell.rowspan > 1) {
        for (let k = 0; k < cell.rowspan; k++) {
          let rIndex = i + k;
          let mp;
          if (hideMap.has(rIndex)) {
            mp = hideMap.get(rIndex);
          } else {
            mp = new Map();
            hideMap.set(rIndex, mp);
          }
          let cIndex = row.length;
          for (let m = 0; m < cell.colspan; m++) {
            mp.set(cIndex - m - 1, cell.style);
          }
        }
      }
      while (rowMap.has(row.length)) {
        let obj = { ...cellProto, display: 0 };
        row.push(obj);
      }
    }
    rows.push(row);
  }
  return rows;
};

const rowsJsonToRowsArray_version2 = (modelRows) => {
  return modelRows.map((row, i) => row.map((cell, j) => {
    let obj;
    if (cell) {
      if (Object.keys(cell).length === 0) {
        // ?????? {}??????????????????
        obj = cellProto;
      } else if (cell.display) {
        // ??? textBox ?????????????????????????????????????????????
        obj = { ...cell, textBox: { ...cellProto.textBox, ...cell.textBox } };
        delete obj.address;
        // ??????????????? rowspan, colspan
        if (!obj.rowspan) obj.rowspan = 1;
        if (!obj.colspan) obj.colspan = 1;
      } else {
        obj = { ...cellProto, display: 0 };
      }
    } else {
      obj = cellProto;
    }
    return obj;
  }));
};

/**???????????????????????????????????????????????? */
const findIndexArray = function (array, predicate) {
  const indexArray = [];
  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    if (predicate(item, i)) {
      indexArray.push(i);
    }
  }
  return indexArray;
}

// ????????????json?????????????????????????????????????????????
export const jsonToTable = (json, analysisModelID, createSheet = createSpreadsheet, pageParams) => {
  const sheets = json.Report.ReportBody.Items.Sheets;
  if (sheets) {
    const { version } = json;
    let rows;
    if (version === '2.0') {
      rows = rowsJsonToRowsArray_version2(sheets.tableHeader.tableRows);
    } else if (version === '1.0') {
      rows = rowsJsonToRowsArray_version1(sheets.tableHeader.tableRows);
    } else {
      rows = rowsJsonToRowsArray_version0(sheets.tableHeader.tableRows);
    }
    let rowProps = sheets.rowProps || [];
    // ?????? rowProps ??????
    if (rowProps.length < sheets.heightArr.header.length) {
      rowProps = rowProps.concat(new Array(sheets.heightArr.header.length - rowProps.length).fill({}));
    }
    let colProps = sheets.colProps || [];
    if (colProps.length < sheets.widthArr.length) {
      colProps = colProps.concat(new Array(sheets.widthArr.length - colProps.length).fill({}));
    }

    // ?????????optType??? ??????optType?????????1/2/3??????????????????????????????
    const widthArray = sheets.widthArr;
    if (pageParams && pageParams.optType) {
      const first = findIndexArray(colProps, col => col.measure && col.measure.id === 'BUDG_VALUE');
      const second = findIndexArray(colProps, col => col.workflow === 'reply' || (col.measure && col.measure.id === 'MANA_REPLY_VALUE'));
      const third = findIndexArray(colProps, col => col.workflow === 'request' || (col.measure && col.measure.id === 'REQUEST_VALUE'));
      if (pageParams.optType === '1' && pageParams.mainState) {
        if (second.length > 0) {
          second.forEach(i => {
            colProps[i].isHidden = true;
            widthArray[i] = 0;
          });
        }
        // ??? mainState ????????????6?????????????????????
        if (!(pageParams.mainState >= '8') && third.length > 0) {
          third.forEach(i => {
            colProps[i].isHidden = true;
            widthArray[i] = 0;
          });
        }
      } else
        if (pageParams.optType === '2') {
          if (!(pageParams.mainState >= '8') && third.length > 0) {
            third.forEach(i => {
              colProps[i].isHidden = true;
              widthArray[i] = 0;
            });
          }
        }
    }
    return {
      present: {
        ...createSheet(),
        id: comm.genId('t'),
        analysisModelID: sheets.analysisModelID,
        position: sheets.position,
        tableRows: rows,
        // widths: sheets.widthArr,
        widths: widthArray,
        heights: sheets.heightArr.header,
        rowProps,
        colProps,
        checkFormulas: sheets.checkFormulas || [],
        digit: sheets.digit,
        noNeedParams: sheets.noNeedParams,
        categoryID: sheets.categoryID,
        zeroAs: sheets.zeroAs,
        serialAddress: sheets.serialAddress,
        pageDimensions: sheets.pageDimensions,
        uploadParameters: sheets.uploadParameters,
        spreadsheetType: sheets.spreadsheetType,
        auditFormulaList: sheets.auditFormulaList || [],
        doNotSum: sheets.doNotSum,
        frozenRowCount: sheets.frozenRowCount,
        frozenColCount: sheets.frozenColCount,
        budgetTreeFieldFlatList: sheets.budgetTreeFieldFlatList || [],
        detailKeys: []
      },
    };
  }
  return null;
}

// ??????????????????????????????
export function mergeObject(obj1, obj2) {
  if (!obj1) {
    return obj2;
  }
  if (!obj2) {
    return obj1;
  }
  let obj = { ...obj1 };
  const keys2 = Object.keys(obj2);
  keys2.forEach(k => {
    if (obj.hasOwnProperty(k) && obj[k] !== undefined) {
      const p1 = obj[k];
      const p2 = obj2[k];
      if (typeof p1 === 'object' && typeof p2 === 'object') {
        obj[k] = mergeObject(p1, p2);
      }
    } else {
      obj[k] = obj2[k];
    }
  });
  return obj;
}

const formulaRefsCache = new Map();

// ?????????????????????????????????
export function getFormulaRefs(formula) {
  if (formulaRefsCache.has(formula)) {
    return formulaRefsCache.get(formula);
  }
  try {
    const refs = [];
    // ?????? tokens
    const chars = new antlr4.InputStream(formula);
    const lexer = new FormulaLexer(chars);
    lexer.addErrorListener(new ThrowingErrorListener());
    const tokenStream = new antlr4.CommonTokenStream(lexer);
    // ?????? tokens
    tokenStream.fill();

    // ????????????
    for (let i = 0; i < tokenStream.tokens.length; i++) {
      const token = tokenStream.tokens[i];
      if (token.type === FormulaLexer.CELL) {
        const { rowNumber, columnNumber } = addressConverter.fromAddress(token.text.toUpperCase());
        // ???????????? token FormulaLexer.COLON
        const leftToken = i > 0 && tokenStream.tokens[i - 1];
        const rightToken = i < tokenStream.tokens.length - 1 && tokenStream.tokens[i + 1];
        refs.push({
          row: rowNumber - 1,
          col: columnNumber - 1,
          token: token,
          isRangeLeft: rightToken && rightToken.type === FormulaLexer.COLON,
          isRangeRight: leftToken && leftToken.type === FormulaLexer.COLON,
        });
      } else if (token.type === FormulaLexer.VAGUECELL) {
        const colName = token.text.toUpperCase().slice(0, token.text.length - 1);
        const columnNumber = addressConverter.columnNameToNumber(colName);
        refs.push({
          row: -1,
          col: columnNumber - 1,
          token: token,
          isRangeLeft: false,
          isRangeRight: false,
        });
      }
    }

    formulaRefsCache.set(formula, refs);
    return refs;
  } catch (err) {
    console.warn('????????????????????????????????????', err);
    return [];
  }
}

// ???????????????????????????????????????????????? -1 ??????????????????????????????
export function updateCellRefs(formula, action) {
  const refs = getFormulaRefs(formula);
  if (!refs || refs.length === 0) {
    return formula;
  }
  let result = formula;
  // ??????????????????
  for (let i = refs.length - 1; i >= 0; i--) {
    const { row, col, token, isRangeLeft, isRangeRight } = refs[i];
    let newRef = action(row, col, isRangeLeft, isRangeRight);
    if (newRef.row !== row || newRef.col !== col) {
      const colName = addressConverter.columnNumberToName(newRef.col + 1);
      let newAddress;
      if (newRef.row >= 0) {
        newAddress = colName + (newRef.row + 1);
      } else {
        newAddress = colName + '$';
      }
      result = result.slice(0, token.start) + newAddress + result.slice(token.stop + 1, result.length);
    }
  }
  return result;
}
/**
 * ??????????????????????????????????????????????????????????????? A$
 * @param {*} sheet ???
 * @param {*} action ??????????????????????????????????????????????????? (row, col) => ({row: newRow, col:newCol})???A$??????????????? -1
 */
export function updateSheetCellRefs(sheet, action) {
  for (const row of sheet.tableRows) {
    for (const cell of row) {
      const value = cell.textBox.value;
      if (typeof value === 'string' && value.trim().indexOf('=') === 0 && value.indexOf('FX.') === -1) {
        const newValue = updateCellRefs(value, action);
        if (newValue !== value) {
          console.log(`???????????? ${value} ==> ${newValue}`);
          cell.textBox.value = newValue;
        }
      }
      const expression = cell.textBox.expression;
      if (expression && expression.indexOf('FX.') === -1) {
        const newValue = updateCellRefs(expression, action);
        if (newValue !== expression) {
          // console.log(`???????????? ${expression} ==> ${newValue}`);
          cell.textBox.expression = newValue;
        }
      }
    }
  }
  // ??????????????????
  const { checkFormulas } = sheet;
  if (checkFormulas && checkFormulas.length > 0) {
    for (const item of checkFormulas) {
      const formula = item.formula;
      if (typeof formula === 'string') {
        const newFormula = updateCellRefs(formula, action);
        if (newFormula !== formula) {
          item.formula = newFormula;
        }
      }
    }
  }
}

export function isFormula(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed[0] === '=';
}

export function validateTemplate(sheet) {
  // ??????????????????????????????????????????
  const { tableRows, heights, widths, rowProps } = sheet;

  const areas = [];
  let area;
  for (let i = 0; i < rowProps.length; i++) {
    const rowProp = rowProps[i];
    if (!area || rowProp.analysisModelId !== area.analysisModelId) {
      if (area) areas.push(area);
      area = { start: i, end: i, analysisModelId: rowProp.analysisModelId };
    } else {
      area.end = i;
    }
  }
  if (area) areas.push(area);

  const rowAreaArray = [];
  for (const { start, end } of areas) {
    for (let i = start; i <= end; i++) {
      rowAreaArray[i] = { start, end };
    }
  }

  for (let i = 0; i < tableRows.length; i++) {
    const row = tableRows[i];
    for (let j = 0; j < row.length; j++) {
      const cell = row[j];
      const { start, end } = rowAreaArray[i];
      if (i + cell.rowspan - 1 > end) {
        Message.warning('????????????????????????????????????');
        return false;
      }
    }
  }
  return true;
}

/**
 * ?????????????????? BI
 * ????????? BI????????????????????????????????????????????????????????????????????????????????????
 */
export function isBI() {
  const isBI = window.BI_APP_CONFIG && window.BI_APP_CONFIG.BIConfig && window.BI_APP_CONFIG.BIConfig.isBI;
  return false;
}

export function setIsBI(isBI) {
  if (!window.BI_APP_CONFIG) window.BI_APP_CONFIG = {};
  if (!window.BI_APP_CONFIG.BIConfig) window.BI_APP_CONFIG.BIConfig = {};
  window.BI_APP_CONFIG.BIConfig.isBI = isBI;
}

/**
 * ?????????????????????????????????undefinded, null, ???????????????
 * @param {*} value ????????????
 */
export function isValueEmpty(value) {
  if (typeof value === 'undefined') {
    return true;
  }
  if (value === null) {
    return true;
  }
  if (typeof value === 'string' && !value) {
    return true;
  }
  return false;
};

/** ??????????????? */
export function hideRowAndCols(sheet) {
  // ?????????
  const { rowProps } = sheet;
  const heights = [...sheet.heights];
  for (let i = 0; i < rowProps.length; i++) {
    const rowProp = rowProps[i];
    // ????????????????????????
    if (rowProp.isReportFooter) {
      rowProp.isHidden = true;
    }
    if (rowProp.isHidden) heights[i] = 0;
  }
  sheet.heights = heights;
  // ?????????
  const { colProps } = sheet;
  const widths = [...sheet.widths];
  for (let i = 0; i < colProps.length; i++) {
    const colProp = colProps[i];
    if (colProp.isHidden) widths[i] = 0;
    else if (!colProp.isHidden && widths[i] === 0) widths[i] = 100;
  }
  sheet.widths = widths;
}