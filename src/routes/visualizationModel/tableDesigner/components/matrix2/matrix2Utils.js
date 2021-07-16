import Report from 'model/ReportModel/Report';
import Common from '../../../../../components/Print/Common';
import TableUtil, { defaultCellWidth, defaultCellHeight } from '../table/TableUtils';

const comm = new Common();
const tableToJson = {
  convert(table, analysisModuleId, objTablesHead, objTablesFoot) {

    const report = new Report();
    report.ReportHeader.Items.TextBoxs = objTablesHead.textBoxes;
    report.ReportHeader.height = objTablesHead.height;
    report.ReportHeader.isShow = objTablesHead.isShow;

    report.ReportFooter.Items.TextBoxs = objTablesFoot.textBoxes;
    report.ReportFooter.height = objTablesFoot.height;
    report.ReportFooter.isShow = objTablesFoot.isShow;
    report.ReportBody.Items.Tables = [];
    const tableItem = {
      type: 'matrix2',
      adaptive:table.tableProperty.adaptive,
      analysisModelId: analysisModuleId,
      conditions: table.conditions || [],
      columns: table.columns,
      isPaging: table.tableProperty.isPaging,
      isFolding: table.tableProperty.isFolding,
      pageSize: table.tableProperty.pageSize,
      isReport: table.tableProperty.isReport,
      isReportUseaCaseSum:table.tableProperty.isReportUseaCaseSum,
      tableStyle: table.tableProperty.tableStyle || 'default',
      tableStyleColor: table.tableProperty.tableStyleColor || 'rgb(137,195,235)',
      sumCondition: table.tableProperty.sumCondition,
      position: table.position,
      heights: table.heights,
      widths: table.widths,
      corner: this.getCorner(table),
      body: this.getBody(table),
      columnHierarchy: this.getColumnHierarchy(table),
      rowHierarchy: this.getRowHierarchy(table),
    };
    report.ReportBody.Items.Tables.push(tableItem);
    return { Report: report };
  },
  getCorner(table) {
    const { cornerSize, tableRows } = table;
    const corner = tableRows.slice(0, cornerSize.rows).map((row) => {
      return row.slice(0, cornerSize.columns).map((cell) => {
        if (cell.display === 1) {
          return cell;
        } else {
          return null;
        }
      });
    });
    return corner;
  },
  getBody(table) {
    const { cornerSize, tableRows } = table;
    const corner = tableRows.slice(cornerSize.rows).map((row) => {
      return row.slice(cornerSize.columns).map((cell) => {
        if (cell.display === 1) {
          return cell;
        } else {
          return null;
        }
      });
    });
    return corner;
  },
  getColumnHierarchy(table) {
    const columnHierarchy = [];
    this.getNode(false, table.cornerSize.columns, table.widths.length, 0, 0, columnHierarchy, table);
    return columnHierarchy;
  },
  getRowHierarchy(table) {
    const rowHierarchy = [];
    this.getNode(true, table.cornerSize.rows, table.heights.length, 0, 0, rowHierarchy, table);
    return rowHierarchy;
  },
  getNode(isRow, startX, endX, yIndex, arrIndex, hierarchy, table) {
    const { cornerSize, tableRows, rowGroups, columnGroups, rowsId, colsId } = table;
    let groups;
    let xProp;
    let yProp;
    let idArray1;
    let idArray2;
    let level;
    if (isRow) {
      xProp = 'rowspan';
      yProp = 'colspan';
      groups = rowGroups;
      idArray1 = colsId;
      idArray2 = rowsId;
      level = cornerSize.columns;
    } else {
      xProp = 'colspan';
      yProp = 'rowspan';
      groups = columnGroups;
      idArray1 = rowsId;
      idArray2 = colsId;
      level = cornerSize.rows;
    }
    let xIndex = startX;
    let ai = arrIndex;
    const groupMap = groups.get(idArray1[yIndex]);
    while (xIndex < endX) {
      const groupItem = {};
      let groupSize = 0;
      let added = false;
      if (groupMap) {
        const groupArr = groupMap.get(idArray2[xIndex]);
        if (groupArr && groupArr.length > ai) {
          const group = groupArr[ai];
          groupSize = group.span;
          const groupStart = xIndex;
          const groupEnd = xIndex + group.span;
          groupItem.groups = {
            name: group.name,
            groupExpressions: group.expressions,
            totalSpan: group.totalSpan,
          };
          groupItem.sortExpressions = group.sort.map(s => ({
            expression: s.expression,
            desc: s.direction === 'desc',
          }));
          if (ai < groupArr.length - 1) {
            added = true;
            hierarchy.push(groupItem);
            groupItem.children = [];
            this.getNode(isRow, groupStart, groupEnd, yIndex, ai + 1, groupItem.children, table);
          }
        }
      }
      if (added === false) {
        if (yIndex < level) {
          const cell = isRow ? tableRows[xIndex][yIndex] : tableRows[yIndex][xIndex];
          let step = 0;
          if ((groupSize > 0 && groupSize === cell[xProp]) || groupSize === 0) {
            if (groupSize === 0) {
              groupSize = cell[xProp];
            }
            groupItem.content = {
              textBox: cell.textBox,
            };
            if (isRow) {
              groupItem.content.colSpan = cell[yProp];
            } else {
              groupItem.content.rowSpan = cell[yProp];
            }
            step = cell[yProp];
          }
          hierarchy.push(groupItem);
          if (yIndex + step < level || (groupSize > 1 || groups.get(idArray1[yIndex + step]))) {
            groupItem.children = [];
            this.getNode(isRow,
              xIndex,
              xIndex + groupSize,
              yIndex + step,
              ai + (step > 0 ? 0 : 1),
              groupItem.children,
              table);
          }
        } else if (groupItem.groups) {
          hierarchy.push(groupItem);
          if (groupSize > 1) {
            groupItem.children = [];
            for (let i = 0; i < groupSize; i += 1) {
              groupItem.children.push({});
            }
          }
        } else {
          groupSize = endX - startX;
          for (let i = startX; i < endX; i += 1) {
            hierarchy.push({});
          }
        }
      }
      xIndex += groupSize;
      ai = 0;
    }
  },
};
const JsonToTable = {
  generateCell(props) {
    return Matri2xUtil.generateCell(props);
  },
  convert(table) {
    const newMatrix = {
      type: 'matrix2',
      id: comm.genId('t'),
      heights: table.heights,
      widths: table.widths,
      analysisModelID: table.analysisModelId,
      position: table.position,
      selection: [],
      columns: table.columns || [],
      tableProperty: {
        isPaging: table.isPaging,
        pageSize: table.pageSize,
        isFolding: table.isFolding,
        tableStyle: table.tableStyle,
        tableStyleColor: table.tableStyleColor,
        isReport: table.isReport,
        sumCondition: table.sumCondition,
        isReportUseaCaseSum:table.isReportUseaCaseSum,
        adaptive:table.adaptive,
        // isBorder:
      },
      conditions: table.conditions,
      ...this.buildTableBody(table),
    };
    return newMatrix;
  },
  buildTableBody(table) {
    const corner = table.corner;
    const body = table.body;
    const cornerSize = {
      rows: table.heights.length - body.length,
      columns: table.widths.length - body[0].length,
    };
    const colsId = table.widths.map(() => comm.genId());
    const rowsId = table.heights.map(() => comm.genId());
    const cornerCells = this.convertCorner(corner, colsId.length - cornerSize.columns);
    const bodyCells = this.convertBody(body, cornerSize.columns);
    const tableRows = cornerCells.concat(bodyCells);
    const columnGroups = this.convertColumnGroups(table.columnHierarchy, tableRows, colsId, rowsId, cornerSize);
    const rowGroups = this.convertRowGroups(table.rowHierarchy, tableRows, colsId, rowsId, cornerSize);
    return {
      colsId,
      columnGroups,
      cornerSize,
      rowGroups,
      rowsId,
      tableRows,
    };
  },
  convertCorner(corner, bodyWidth) {
    return corner.map((row) => {
      return row.map((cell) => {
        if (cell) {
          return cell;
        } else {
          return this.generateCell({ display: 0 });
        }
      }).concat(new Array(bodyWidth).fill(this.generateCell({ display: 0 })));
    });
  },
  convertBody(body, cornerWidth) {
    return body.map((row) => {
      const arr = new Array(cornerWidth).fill(this.generateCell({ display: 0 }));
      return arr.concat(row.map((cell) => {
        if (cell) {
          return cell;
        } else {
          return this.generateCell({ display: 0 });
        }
      }));
    });
  },
  convertColumnGroups(columnHierarchy, tableRows, colsId, rowsId, cornerSize) {
    const columnGroups = new Map();
    this.convertColumnNode(columnHierarchy,
      cornerSize.columns,
      0,
      colsId,
      rowsId,
      columnGroups,
      tableRows);
    return columnGroups;
  },
  convertColumnNode(columnHierarchy, startCol, rowIndex, colsId, rowsId, columnGroups, tableRows) {
    let colIndex = startCol;
    for (const groupNode of columnHierarchy) {
      let group = null;
      let colspan = 1;
      let rowspan = 0;
      if (groupNode.groups) {
        group = {
          name: groupNode.groups.name,
          expressions: groupNode.groups.groupExpressions,
          sort: groupNode.sortExpressions.map(s => ({
            expression: s.expression,
            direction: s.desc ? 'desc' : 'asc',
          })),
          totalSpan: groupNode.groups.totalSpan
        };
      }
      let cell = null;
      if (groupNode.content) {
        rowspan = groupNode.content.rowSpan || 1;
        cell = {
          display: 1,
          textBox: groupNode.content.textBox,
        };
      }
      if (groupNode.children && groupNode.children.length > 0) {
        colspan = this.convertColumnNode(groupNode.children,
          colIndex,
          rowIndex + rowspan,
          colsId,
          rowsId,
          columnGroups,
          tableRows);
      } else {
        colspan = 1;
      }
      if (group) {
        group.span = colspan;
        let groupMap = columnGroups.get(rowsId[rowIndex]);
        if (!groupMap) {
          groupMap = new Map();
          columnGroups.set(rowsId[rowIndex], groupMap);
        }
        let arr = groupMap.get(colsId[colIndex]);
        if (!arr) {
          arr = [];
          groupMap.set(colsId[colIndex], arr);
        }
        arr.splice(0, 0, group);
      }
      if (cell) {
        cell.colspan = colspan;
        cell.rowspan = rowspan;
        tableRows[rowIndex][colIndex] = cell;
      }
      colIndex += colspan;
    }
    return colIndex - startCol;
  },
  convertRowGroups(rowHierarchy, tableRows, colsId, rowsId, cornerSize) {
    const rowGroups = new Map();
    this.convertRowNode(rowHierarchy,
      cornerSize.rows,
      0,
      colsId,
      rowsId,
      rowGroups,
      tableRows);
    return rowGroups;
  },
  convertRowNode(rowHierarchy, startRow, colIndex, colsId, rowsId, rowGroups, tableRows) {
    let rowIndex = startRow;
    for (const groupNode of rowHierarchy) {
      let group = null;
      let colspan = 0;
      let rowspan = 1;
      if (groupNode.groups) {
        group = {
          name: groupNode.groups.name,
          expressions: groupNode.groups.groupExpressions,
          sort: groupNode.sortExpressions.map(s => ({
            expression: s.expression,
            direction: s.desc ? 'desc' : 'asc',
          })),
          totalSpan: groupNode.groups.totalSpan,
        };
      }
      let cell = null;
      if (groupNode.content) {
        colspan = groupNode.content.colSpan || 1;
        cell = {
          display: 1,
          textBox: groupNode.content.textBox,
        };
      }
      if (groupNode.children && groupNode.children.length > 0) {
        rowspan = this.convertRowNode(groupNode.children,
          rowIndex,
          colIndex + colspan,
          colsId,
          rowsId,
          rowGroups,
          tableRows);
      } else {
        rowspan = 1;
      }
      if (group) {
        group.span = rowspan;
        let groupMap = rowGroups.get(colsId[colIndex]);
        if (!groupMap) {
          groupMap = new Map();
          rowGroups.set(colsId[colIndex], groupMap);
        }
        let arr = groupMap.get(rowsId[rowIndex]);
        if (!arr) {
          arr = [];
          groupMap.set(rowsId[rowIndex], arr);
        }
        arr.splice(0, 0, group);
      }
      if (cell) {
        cell.colspan = colspan;
        cell.rowspan = rowspan;
        tableRows[rowIndex][colIndex] = cell;
      }
      rowIndex += rowspan;
    }
    return rowIndex - startRow;
  },
};
const Matri2xUtil = {
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
  createMatrixControl(tableProperty, rowCount, columnCount) {
    const row = comm.isCheckEmpty(rowCount) === '' ? 2 : rowCount;
    const col = comm.isCheckEmpty(columnCount) === '' ? 2 : columnCount;
    const objTableRows = [];
    const rowsId = [];
    const colsId = [];
    let cellArray = [];
    let tmpCellObject;
    for (let i = 0; i < row; i += 1) {
      for (let j = 0; j < col; j += 1) {
        tmpCellObject = this.generateCell();
        if (colsId.length < col) {
          colsId.push(comm.genId());
        }
        cellArray.push(tmpCellObject);
      }
      rowsId.push(comm.genId());
      objTableRows.push(cellArray);
      cellArray = [];
    }
    const columns = []; // 生成别名
    for (let i = 0; i < 2; i += 1) {
      columns.push({
        fieldName: `column&@Name${i}`,
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
        type: 'matrix2',
        tableRows: objTableRows,
        cornerSize: { rows: 1, columns: 1 }, // 交叉部分左上角，角标区得大小区域x,y
        heights: new Array(row).fill(defaultCellHeight), // 行高数组
        widths: new Array(col).fill(defaultCellWidth),
        selection: [],
        rowGroups: new Map(),
        columnGroups: new Map(),
        rowsId,
        colsId,
      },
    };
    return control;
  },
  tableToJson(table, analysisModuleId, objTablesHead, objTablesFoot) {
    return tableToJson.convert(table, analysisModuleId, objTablesHead, objTablesFoot);
  },
  JsonToTable(table) {
    return JsonToTable.convert(table);
  },
};

Object.assign(Matri2xUtil, TableUtil);
export default Matri2xUtil;
