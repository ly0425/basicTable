/**
 * Created by viewhigh on 2017/6/16.
 */
import React from 'react';
import Report from 'src/model/ReportModel/Report';
import Common from '../../../../components/Print/Common';
import TableUtil, { defaultCellWidth, defaultCellHeight } from './table/TableUtils';
import produce from 'immer';
import { specialFieldsparsing } from './table/tableConversionFn';

const comm = new Common();

const DynamicTableUtils = {
  generateCell(props) {
    if (!props) {
      return {
        rowspan: 1,
        colspan: 1,
        display: 1,
        textBox: { id: comm.genId() },
      };
    }
    const { textBox, colspan, rowspan, display } = props;
    const cell = {
      rowspan: rowspan || 1,
      colspan: colspan || 1,
      display: display === undefined ? 1 : display,
      textBox: textBox || { id: comm.genId() },
    };
    return cell;
  },
  createDynamicTableControl(tableProperty, rowCount, columnCount) {
    // 生成表格模型
    // 生成行数据
    const objTableRows = [];

    const row = comm.isCheckEmpty(rowCount) === '' ? 3 : rowCount;
    const col = comm.isCheckEmpty(columnCount) === '' ? 5 : columnCount;

    let cellArray = [];
    let tmpCellObject;
    for (let i = 0; i < row; i += 1) {
      for (let j = 0; j < col; j += 1) {
        tmpCellObject = this.generateCell();
        cellArray.push(tmpCellObject);
      }
      objTableRows.push(cellArray);
      cellArray = [];
    }

    const columns = []; // 生成别名
    for (let i = 0; i < 5; i += 1) {
      columns.push({
        fieldName: `column&@Name${i}`,
        type: 'init',
        width: '',
        style: '',
        isSort: true,
        isShow: true,
      });
    }
    const control = {
      areaName: 'Body',
      table: {
        tableProperty,
        columns,
        id: comm.genId('T'),
        position: { x: 0, y: 0 },
        type: 'table',
        tableRows: objTableRows,
        cornerSize: { rows: 1, columns: 0 },
        heights: new Array(row).fill(defaultCellHeight),
        widths: new Array(col).fill(defaultCellWidth),
        selection: [],
        rowGroups: [{
          name: '详细信息',
          expressions: [],
          sort: [],
          colPosition: 0,
          startRow: 1,
          endRow: 1,
        }],
        columnGroups: [],
        globalVariableList: [],
      },
    };
    control.table.heights[0] = 43;
    return control;
  },
  copyCell(c) {
    return {
      rowspan: c.rowspan,
      colspan: c.colspan,
      display: c.display,
      textBox: c.textBox,
    };
  },
  getCorner(table) {
    const rows = table.tableRows.slice(0, table.cornerSize.rows);
    const corner = rows.map((row) => {
      const cells = row.slice(0, table.cornerSize.columns);
      return cells.map((c) => {
        return this.copyCell(c);
      });
    });
    return corner;
  },
  getBody(table) {

    const bodyTableRows = table.tableRows.slice(table.cornerSize.rows);
    const rows = bodyTableRows.map((row) => {

      const cells = row.slice(table.cornerSize.columns);
      return cells.map((c) => {
        return this.copyCell(c);
      });
    });
    return rows;
  },
  getRangeCalculator(array) {
    // 缓存
    const map = new Map();
    // 计算范围内元素之和
    const calcRange = (index, span) => {
      if (!span) {
        return 0;
      }
      if (span === 1) {
        return array[index];
      }
      const key = `${index},${span}`;
      if (map.has(key)) {
        return map.get(key);
      }
      const result = calcRange(index, span - 1) + array[index + (span - 1)];
      map.set(key, result);
      return result;
    };
    return calcRange;
  },
  getRowHierarchy(table) {
    const calcWidth = this.getRangeCalculator(table.widths);
    const members = new Map();
    const groups = table.rowGroups;
    const hierarchy = [];
    const tableRows = table.tableRows;
    const rowCount = tableRows.length;
    for (let cIndex = 0; cIndex < table.cornerSize.columns; cIndex += 1) {
      for (let rIndex = table.cornerSize.rows; rIndex < rowCount; rIndex += 1) {
        const cell = tableRows[rIndex][cIndex];
        if (cell.display === 1) {
          let newMember = {};
          let hasGroup = false;
          groups.filter(g => g.colPosition === cIndex && g.startRow === rIndex).forEach((g) => {
            hasGroup = true;
            newMember = {
              name: g.name,
              pos: g.colPosition,
              group: g.expressions,
              sort: g.sort,
              start: g.startRow,
              end: g.endRow,
              children: [],
            };
            if (members.has(rIndex)) {
              const parent = members.get(rIndex);
              parent.children.push(newMember);
            } else {
              hierarchy.push(newMember);
            }
            for (let i = g.startRow; i <= g.endRow; i += 1) {
              members.set(i, newMember);
            }
          });
          newMember.content = { textBox: cell.textBox };
          newMember.rowspan = cell.rowspan;
          newMember.colspan = cell.colspan;
          newMember.width = calcWidth(cIndex, cell.colspan);
          if (!newMember.children) {
            newMember.children = [];
          }
          if (!hasGroup) {
            newMember.start = rIndex;
            newMember.pos = cIndex;
            if (members.has(rIndex)) {
              const parent = members.get(rIndex);
              parent.children.push(newMember);
            } else {
              hierarchy.push(newMember);
            }
            for (let i = 0; i < cell.rowspan; i += 1) {
              members.set(rIndex + i, newMember);
            }
          }
        }
      }
    }
    groups.filter(g => g.colPosition === table.cornerSize.columns).forEach((g) => {
      const newMember = {
        name: g.name,
        pos: g.colPosition,
        group: g.expressions,
        sort: g.sort,
        start: g.startRow,
        end: g.endRow,
        children: [],
        rowIsShowExpression: g.rowIsShowExpression,
      };
      if (members.has(g.startRow)) {
        const parent = members.get(g.startRow);
        parent.children.push(newMember);
      } else {
        hierarchy.push(newMember);
      }
      for (let i = g.startRow; i <= g.endRow; i += 1) {
        members.set(i, newMember);
      }
    });
    if (table.cornerSize.columns === 0) {
      let end = hierarchy[0] ? hierarchy[0].end : 0;
      for (let rIndex = table.cornerSize.rows + end; rIndex < rowCount; rIndex += 1) {
        let newMember = {
          children: [],
          start: rIndex,
          end: rIndex,
        };
        newMember.start = rIndex;
        newMember.pos = 0;
        hierarchy.push(newMember);
      }
    }
    return hierarchy;
  },
  getColumnHierarchy(table) {
    const calcHeight = this.getRangeCalculator(table.heights);
    const members = new Map();
    const groups = table.columnGroups;
    const hierarchy = [];
    const tableRows = table.tableRows;
    const columnCount = table.widths.length;
    for (let rIndex = 0; rIndex < table.cornerSize.rows; rIndex += 1) {
      for (let cIndex = table.cornerSize.columns; cIndex < columnCount; cIndex += 1) {
        const cell = tableRows[rIndex][cIndex];
        if (cell.display === 1) {
          let newMember = {};
          let hasGroup = false;
          groups.filter(g => g.rowPosition === rIndex && g.startColumn === cIndex).forEach((g) => {
            hasGroup = true;
            newMember = {
              name: g.name,
              pos: g.rowPosition,
              group: g.expressions,
              sort: g.sort,
              start: g.startColumn,
              end: g.endColumn,
              children: [],
            };
            if (members.has(cIndex)) {
              const parent = members.get(cIndex);
              parent.children.push(newMember);
            } else {
              hierarchy.push(newMember);
            }
            for (let i = g.startColumn; i <= g.endColumn; i += 1) {
              members.set(i, newMember);
            }
          });
          newMember.content = { textBox: cell.textBox };
          newMember.rowspan = cell.rowspan;
          newMember.colspan = cell.colspan;
          newMember.height = calcHeight(rIndex, cell.rowspan);
          if (!newMember.children) {
            newMember.children = [];
          }
          if (!hasGroup) {
            newMember.start = cIndex;
            newMember.pos = rIndex;
            if (members.has(cIndex)) {
              const parent = members.get(cIndex);
              parent.children.push(newMember);
            } else {
              hierarchy.push(newMember);
            }
            for (let i = 0; i < cell.colspan; i += 1) {
              members.set(cIndex + i, newMember);
            }
          }
        }
      }
    }

    groups.filter(g => g.rowPosition === table.cornerSize.rows).forEach((g) => {
      const newMember = {
        name: g.name,
        pos: g.rowPosition,
        group: g.expressions,
        sort: g.sort,
        start: g.startColumn,
        end: g.endColumn,
        children: [],
      };
      if (members.has(g.startColumn)) {
        const parent = members.get(g.startColumn);
        parent.children.push(newMember);
      } else {
        hierarchy.push(newMember);
      }
    });
    return hierarchy;
  },
  getDataSet(table, analysisModuleId, globalVariableList=[]) {

    const { conditions, tableProperty, modelSpecialAttr } = table;
    const dataSetMap = {
      analysisModelId: analysisModuleId || '',
      conditions: conditions || [],
      // YearTotalConditions:YearTotalConditions||null,
      modelSpecialAttr: modelSpecialAttr || null,
      fields: [],
      pageSize: tableProperty.pageSize || 100,
      showDetailRow: table.rowGroups[table.rowGroups.length - 1].expressions.length === 0,
      groupFields: [],
      totalFields: [],
      isPaging: tableProperty.isPaging,
      fixedColumn: tableProperty.fixedColumn,
      groupLevelField: tableProperty.groupLevelField,
      levelField: tableProperty.levelField,
      lastLevelField: tableProperty.lastLevelField,
      collapse: tableProperty.collapse,
      // sortConditions: {
      //   order: tableProperty.liftingSequence || '',
      //   sortfieldName: tableProperty.tableSort || '',
      // },
      yearTotalParameter: tableProperty.yearTotalParameter,
      sortExpressions: tableProperty.sortExpressions,
      topNs: tableProperty.topNs,
      topN: '',
      sumCondition: tableProperty.sumCondition || []
    };
    if (tableProperty.topNs) {
      dataSetMap.pageSize = tableProperty.topNs;
    }
    const firstGroup = table.rowGroups[0];
    const fields = new Set();
    if (dataSetMap.showDetailRow) {
      const tableBodyRows = table.tableRows.slice(firstGroup.startRow, firstGroup.endRow + 1);
      for (const row of tableBodyRows) {
        for (const col of row) {
          if (col.textBox && col.textBox.value !== '') {
            const items = getFieldNamesFromExpressions([col.textBox.value]);
            items.forEach((item) => {
              if (item !== '') {
                fields.add(item);
              }
            });
          }
        }
      }
      dataSetMap.fields = Array.from(fields);
    }
    const groupCount = table.rowGroups.length;
    const fieldSet = new Set();
    for (let i = 0; i < groupCount - 1; i += 1) {
      const group = table.rowGroups[i];
      const fieldNames = getFieldNamesFromExpressions(group.expressions);
      fieldNames.forEach((name) => {
        fieldSet.add(name);
      });

      const headerAggregate = table.rowGroups[i + 1].startRow === group.startRow ?
        null : getAggregateFromCells([table.tableRows[group.startRow]], fieldSet, globalVariableList);
      const footerAggregate = table.rowGroups[i + 1].endRow === group.endRow ?
        null : getAggregateFromCells([table.tableRows[group.endRow]], fieldSet, globalVariableList);

      dataSetMap.groupFields.push({
        name: group.name,
        groupExpressions: fieldNames,
        headerAggregate: headerAggregate && headerAggregate.values,
        footerAggregate: footerAggregate && footerAggregate.values,
        headerExpressions: headerAggregate && headerAggregate.newExpressions,
        footerExpressions: footerAggregate && footerAggregate.newExpressions,
      });
    }

    if (!dataSetMap.showDetailRow) {
      const group = table.rowGroups[table.rowGroups.length - 1];
      const fieldNames = getFieldNamesFromExpressions(group.expressions);
      fieldNames.forEach((name) => {
        fieldSet.add(name);
      });
      const headerAggregate = getAggregateFromCells([table.tableRows[group.startRow]], fieldSet, globalVariableList);

      dataSetMap.groupFields.push({
        name: group.name,
        groupExpressions: fieldNames,
        headerAggregate: headerAggregate && headerAggregate.values,
        headerExpressions: headerAggregate && headerAggregate.newExpressions,
        footerAggregate: null,
      });
    }

    const tableFooterRows = table.tableRows.slice(firstGroup.endRow + 1);
    const footerFields = getAggregateFromCells(tableFooterRows, new Set(), globalVariableList, 'foot');
    dataSetMap.totalFields = footerFields.values;
    dataSetMap.totalFieldsExpressions = footerFields.newExpressions;
    let newGlobalVariableList = globalVariableList.filter(item => item.groupName === '全局');
    newGlobalVariableList.forEach((c) => {
      // let i = dataSetMap.totalFields.findIndex(item => item.expression == c.expression);
      // if (i == -1) {
      dataSetMap.totalFields.push({ fieldName: c.name, expression: c.expression })
      // }
    })
    return dataSetMap;
  },
  tableToJson(table, analysisModuleId, objTablesHead, objTablesFoot, globalVariableList) {
    const tableJson = {
      Report: new Report(),
    };

    tableJson.Report.ReportBody.Items.Tables = [];
    const tableItem = {
      type: 'table',
      fixedHeader: true,
      pageTotalRows: 20,
      fixedColumn: 0,
      position: table.position,
      columns: [],
      heights: table.heights,
      widths: table.widths,
      corner: this.getCorner(table),
      body: this.getBody(table),
      columnHierarchy: this.getColumnHierarchy(table),
      rowHierarchy: this.getRowHierarchy(table),
      tableProperty: {
        unitName: table.tableProperty.unitName,
        isUnitDisplay: table.tableProperty.isUnitDisplay,
        isPaging: table.tableProperty.isPaging,
        fixedColumn: table.tableProperty.fixedColumn,
        groupLevelField: table.tableProperty.groupLevelField,
        isBorder: table.tableProperty.isBorder,
        title: table.tableProperty.title,
        isDisplay: table.tableProperty.isDisplay,
        adaptive: table.tableProperty.adaptive,
        // HeadData: objTablesHead,
        globalVariableList: globalVariableList.map(v => ({ name: v.name, expression: v.expression, isThrough: true, isFoot: v.groupName === '全局' })),
        numberDisplay: table.tableProperty.numberDisplay,
        numberName: table.tableProperty.numberName,
        topNs: table.tableProperty.topNs,
        tableFootMerge: table.tableProperty.tableFootMerge, // 是否合并表尾
        tableStyle: table.tableProperty.tableStyle || 'default',
        tableStyleColor: table.tableProperty.tableStyleColor || 'rgb(137,195,235)',
        isReport: table.tableProperty.isReport,
        isReportUseaCaseSum:table.tableProperty.isReportUseaCaseSum,
        isGroupSum:table.tableProperty.isGroupSum,
        isShowPreNextPage:table.tableProperty.isShowPreNextPage
      },
    };

    tableJson.Report.ReportHeader.Items.TextBoxs = objTablesHead.textBoxes;
    tableJson.Report.ReportHeader.height = objTablesHead.height;
    tableJson.Report.ReportHeader.isShow = objTablesHead.isShow;

    tableJson.Report.ReportFooter.Items.TextBoxs = objTablesFoot.textBoxes;
    tableJson.Report.ReportFooter.height = objTablesFoot.height;
    tableJson.Report.ReportFooter.isShow = objTablesFoot.isShow;

    tableItem.fixedColumn = table.tableProperty.fixedColumn !== '' ? table.tableProperty.fixedColumn : 0;
    tableItem.columns = table.columns;
    const dataset = this.getDataSet(table, analysisModuleId, globalVariableList || []);
    tableJson.Report.dataSets = [dataset];
    tableJson.Report.ReportBody.Items.Tables.push(tableItem);
    return tableJson;
  },
  JsonToTable(tablejson, reportHeader, dataSet) {
    const tableProperty = tablejson.tableProperty || {};
    tableProperty.globalVariableList = tableProperty.globalVariableList ? tableProperty.globalVariableList.map(v => ({ name: v.name, expression: v.expression, isThrough: true, groupName: v.isFoot ? '全局' : '局部' })) : [];
    const ds = dataSet;
    const tableData = {
      columns: tablejson.columns || [],
      widths: tablejson.widths,
      heights: tablejson.heights,
      tableProperty,
      id: comm.genId('T'),
      type: 'table',
      position: tablejson.position,

    };
    if (ds) {
      tableData.analysisModuleId = ds.length > 0 ? ds[0].analysisModelId : '';
      tableData.conditions = [];
      if (ds.length > 0) {//对本年累计处理
        // if(ds[0].YearTotalConditions){
        //    tableData.conditions = ds[0].YearTotalConditions;
        //  } else {
        tableData.conditions = ds[0].conditions;
        // }
      }
      tableData.tableProperty.pageSize = ds[0].pageSize;
      tableData.tableProperty.groupLevelField = ds[0].groupLevelField || '';
      tableData.tableProperty.levelField = ds[0].levelField || '';
      tableData.tableProperty.lastLevelField = ds[0].lastLevelField || '';
      tableData.tableProperty.collapse = ds[0].collapse == undefined ? true : ds[0].collapse;
      tableData.tableProperty.sortExpressions = ds[0].sortExpressions || [];
      tableData.tableProperty.sumCondition = ds[0].sumCondition || [];
      if (ds[0].sortConditions) {
        tableData.tableProperty.sortExpressions = [ds[0].sortConditions]
      }
      tableData.tableProperty.yearTotalParameter = ds[0].yearTotalParameter || '';

    }
    tableData.tableProperty.numberDisplay = tableProperty.numberDisplay || false,
      tableData.tableProperty.fixedColumn = tablejson.fixedColumn;
    tableData.cornerSize = {
      rows: tablejson.corner.length,
      columns: tablejson.corner[0].length,
    };
    tableData.rowGroups = this.getRowGroup(tablejson);
    tableData.columnGroups = this.getColumnGroup(tablejson);
    tableData.tableRows = this.getTableRows(tablejson);
    return tableData;
  },
  getRowGroup(tablejson) {
    let rowGroups = [];
    const groupCache = new Map();
    let stack = [];
    for (const root of tablejson.rowHierarchy) {
      stack.length = 0;
      stack.push(root);
      while (stack.length > 0) {
        const mem = stack.shift();
        if (Reflect.has(mem, 'group')) {
          const pos = mem.pos;
          if (!groupCache.has(pos)) {
            groupCache.set(pos, []);
          }
          groupCache.get(pos).push({
            expressions: mem.group,
            sort: mem.sort,
            colPosition: mem.pos,
            startRow: mem.start,
            endRow: mem.end,
            name: mem.name,
            rowIsShowExpression: mem.rowIsShowExpression
          });
        }
        stack = stack.concat(mem.children);
      }
    }
    const posArray = Array.from(groupCache.keys());
    posArray.sort();
    const sortFn = (a, b) => a.startColumn - b.startColumn;
    posArray.forEach((pos) => {
      rowGroups = rowGroups.concat(groupCache.get(pos).sort(sortFn));
    });
    return rowGroups;
  },
  getColumnGroup(tablejson) {
    let columnGroups = [];
    const groupCache = new Map();
    let stack = [];
    for (const root of tablejson.columnHierarchy) {
      stack.length = 0;
      stack.push(root);
      while (stack.length > 0) {
        const mem = stack.shift();
        if (Reflect.has(mem, 'group')) {
          const pos = mem.pos;
          if (!groupCache.has(pos)) {
            groupCache.set(pos, []);
          }
          groupCache.get(pos).push({
            expressions: mem.group,
            sort: mem.sort,
            rowPosition: mem.pos,
            startColumn: mem.start,
            endColumn: mem.end,
            name: mem.name,
          });
        }
        stack = stack.concat(mem.children);
      }
    }
    const posArray = Array.from(groupCache.keys());
    posArray.sort();
    const sortFn = (a, b) => a.startColumn - b.startColumn;
    posArray.forEach((pos) => {
      columnGroups = columnGroups.concat(groupCache.get(pos).sort(sortFn));
    });
    return columnGroups;
  },
  addRowsPart(tableRows, rowHierarchy) {
    let stack = [];
    for (const root of rowHierarchy) {
      stack.length = 0;
      stack.push(root);
      while (stack.length > 0) {
        const mem = stack.shift();
        if (Reflect.has(mem, 'content')) {
          const pos = mem.pos;
          const start = mem.start;
          while (tableRows.length <= start) {
            tableRows.push([]);
          }
          while (tableRows[start].length < pos) {
            tableRows[start].push(this.generateCell({ display: 0 }));
          }
          tableRows[start].push({
            colspan: mem.colspan,
            rowspan: mem.rowspan,
            display: 1,
            textBox: mem.content.textBox,
          });
        }
        stack = stack.concat(mem.children);
      }
    }
  },
  addColumnPart(tableRows, columnHierarchy) {
    let stack = [];
    for (const root of columnHierarchy) {
      stack.length = 0;
      stack.push(root);
      while (stack.length > 0) {
        const mem = stack.shift();
        if (Reflect.has(mem, 'content')) {
          const pos = mem.pos;
          const start = mem.start;
          while (tableRows[pos].length < start) {
            tableRows[pos].push(this.generateCell({ display: 0 }));
          }
          tableRows[pos].push({
            colspan: mem.colspan,
            rowspan: mem.rowspan,
            display: 1,
            textBox: mem.content.textBox,
          });
        }
        stack = stack.concat(mem.children);
      }
    }
  },
  getTableRows(tablejson) {
    const tableRows = [];
    // corner

    let rowCount = tablejson.corner.length;
    for (let i = 0; i < rowCount; i += 1) {
      const row = tablejson.corner[i];
      if (tableRows.length <= i) {
        tableRows.push([]);
      }
      const colCount = row.length;
      for (let j = 0; j < colCount; j += 1) {
        tableRows[i][j] = row[j];
      }
    }
    // row
    this.addRowsPart(tableRows, tablejson.rowHierarchy);
    let columnCount = tablejson.corner[0].length;
    rowCount = tablejson.heights.length;
    for (let i = tablejson.corner.length; i < rowCount; i += 1) {
      if (tableRows.length <= i) {
        tableRows.push([]);
      }
      while (tableRows[i].length < columnCount) {
        tableRows[i].push(this.generateCell({ display: 0 }));
      }
    }
    // column
    this.addColumnPart(tableRows, tablejson.columnHierarchy);
    rowCount = tablejson.corner.length;
    columnCount = tablejson.widths.length;
    for (let i = 0; i < rowCount; i += 1) {
      while (tableRows[i].length < columnCount) {
        tableRows[i].push(this.generateCell({ display: 0 }));
      }
    }
    // body

    rowCount = tablejson.body.length;
    const cornerRows = tablejson.corner.length;
    const cornerColumns = tablejson.corner[0].length;
    for (let i = 0; i < rowCount; i += 1) {
      const row = tablejson.body[i];
      const colCount = row.length;
      for (let j = 0; j < colCount; j += 1) {


        tableRows[i + cornerRows][j + cornerColumns] = row[j];
      }
    }
    return tableRows;
  },
};

const mapExpression = (exp, values, fields) => {
  if (values[exp]) {
    return {
      fieldName: values[exp],
      expression: exp,
    };
  }
  let f;
  const result = /\(Fields\.([\w0-9_\u4E00-\u9FA5]+)\)$/.exec(exp);
  if (result !== null) {
    f = result[1];
  } else {
    f = 'F';
  }
  if (fields.has(f)) {
    let expIndex = 1;
    while (fields.has(`${f}${expIndex}`)) {
      expIndex += 1;
    }
    f = `${f}${expIndex}`;
  }
  fields.add(f);
  return {
    fieldName: f,
    expression: exp,
  };
};
const variableToExp = (text, variableList, isFoot) => {
  if (text === '' || !variableList.length) {
    return text;
  }
  if (!isFoot) {
    variableList = variableList.filter(item => item.isFoot === false || item.groupName === '局部');
  } else {
    variableList = variableList.filter(item => item.isFoot === true || item.groupName === '全局');
  }
  let result;
  let regex = /variables./gi;
  let newExpression = '';
  let lastIndex = 0;
  let operator = ['+', '-', '*', '/', '(', ')', ',', '&'];
  while ((result = regex.exec(text), result !== null)) {
    const startIndex = result.index;
    if (startIndex >= lastIndex) {
      newExpression += text.slice(lastIndex, startIndex);
      let i = startIndex + result[0].length;
      while (i < text.length) {
        let index = operator.findIndex(item => item == text[i]);
        if (index != -1) {
          break;
        }
        i += 1;
      }
      lastIndex = i;
      let exp = text.substring(startIndex, i);
      let currentVariable = variableList.find(item => item.name == exp.replace('Variables.', ''));
      if (currentVariable) {
        exp = currentVariable.expression;
      }
      newExpression += exp;
    }
  }
  if (lastIndex < text.length) {
    newExpression += text.slice(lastIndex)
  }
  if (newExpression === '') {
    newExpression = text;
  }
  return newExpression;
}
const getAggregateFromCells = (rows, fieldSet, globalVariableList, type) => {
  const fields = new Set(Array.from(fieldSet));
  const values = {};
  const newExpressions = {};
  const regex = /(sum|max|min|count|avg|period|getPreviousPeriod|getYearTotal)\(/gi;
  let result;
  rows.forEach((row) => {
    row.forEach((cell) => {
      let newExpression = '';
      let lastIndex = 0;
      let text = cell.textBox.value || '';
      if (type != 'foot') {
        text = variableToExp(text, globalVariableList, false);

      }
      while ((result = regex.exec(text), result !== null)) {

        const startIndex = result.index;
        if (startIndex >= lastIndex) {
          newExpression += text.slice(lastIndex, startIndex);
          let lvl = 1;
          let i = startIndex + result[0].length;
          while (i < text.length && lvl > 0) {
            if (text[i] === '(') {
              lvl += 1;
            } else if (text[i] === ')') {
              lvl -= 1;
            }
            i += 1;
          }
          lastIndex = i;

          const exp = text.substring(startIndex, i);
          const map = mapExpression(exp, values, fields);
          if (!values[map.expression]) {
            values[map.expression] = map.fieldName;
          }
          newExpression += `Fields.${map.fieldName}`;
        }
      }
      if (lastIndex < text.length) {
        newExpression += text.slice(lastIndex)
      }
      if (newExpression) {
        newExpressions[cell.textBox.id] = newExpression;
      }
    });
  });
  return {
    values: Object.keys(values).map(exp => ({ fieldName: values[exp], expression: exp })),
    newExpressions,
  };
};

const getFieldNamesFromExpressions = (expressions) => {
  const values = new Set();
  let result;
  let specialFields = ['curPeriodEndTimeData', 'curPeriodEndTimeWithCompare',
    'accumulatedData', 'accumulatedWithCompare', 'monthOnMonthDataWithCompare'];//项目中加的几个特殊字段，只在明细行中使用，字段特殊处理啊下
  // const calculates = ['+', '-', '*', '/']
  const regex = /Fields\.([\w0-9_\u4E00-\u9FA5]+)/g;
  for (const text of expressions) {
    if (text && specialFields.findIndex(c => text.indexOf(c) != -1) != -1) {
      // if(calculates.findIndex(c => text.indexOf(c) != -1) != -1){
      //   values.add(text.substring(1));
      // }else{
      let specialFields = specialFieldsparsing(text, undefined, true);
      for (let item of specialFields) {
        values.add(item);

      }
      // }
      continue;
    }
    while ((result = regex.exec(text), result !== null)) {
      values.add(result[1]);
    }
  }

  return Array.from(values);
};
Object.assign(DynamicTableUtils, TableUtil);
//－－－改兼容IE10－－－;
// Reflect.setPrototypeOf(DynamicTableUtils, TableUtil);
export {
  variableToExp,
};
export default DynamicTableUtils;
