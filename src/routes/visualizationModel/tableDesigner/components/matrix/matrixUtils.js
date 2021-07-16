import Common from '/src/components/Print/Common';
import Report from '/src/model/ReportModel/Report';
import TableUtil, { defaultCellHeight } from '../table/TableUtils';
import Message from '/src/components/public/Message';
const comm = new Common();

const MatrixUtil = {
  getMatrixFeilds(model) {
    return model.rowGroup.map((r) => {
      return { fieldName: r.fieldName };
    }).concat(model.columnGroup.map((r) => {
      return { fieldName: r.fieldName };
    })).concat(model.seriesGroup.map((r) => {
      return { fieldName: r.fieldName };
    }));
  },

  tableBodyFromJson({ rowGroup, columnGroup, seriesGroup }) {
    const tableArray = [];
    const seriesHeaderDisplay = seriesGroup.length > 1;
    const cornerRowSpan = columnGroup.length + (seriesHeaderDisplay ? 1 : 0);

    let row = [];
    for (let i = 0; i < rowGroup.length; i++) {
      const parm = {
        type: 'corner',
        width: rowGroup[i].body.width,
        height: columnGroup[0].height,
        text: rowGroup[i].header.text,
        colspan: 1,
        rowspan: cornerRowSpan,
        display: 1,
      };
      const cell = this.generateCell(parm);
      this.setTextBoxStyle(cell.textBox, rowGroup[i].header.style);
      cell.textBox.formatObject = rowGroup[i].header.formatObject || {};
      cell.textBox.contentSourceStyle = rowGroup[i].header.contentSourceStyle;
      cell.textBox.action = rowGroup[i].header.action || {};
      row.push(cell);
    }
    tableArray.push(row);
    for (let i = 1, len = (seriesHeaderDisplay ? cornerRowSpan - 1 : cornerRowSpan); i < len; i++) {
      row = [];
      for (let j = 0; j < rowGroup.length; j++) {
        const parm = {
          type: 'corner',
          display: 0,
          width: rowGroup[j].body.width,
          height: columnGroup[i].height,
          rowspan: 1,
          colspan: 1,
        };
        const cell = this.generateCell(parm);
        row.push(cell);
      }
      tableArray.push(row);
    }
    if (seriesHeaderDisplay) {
      row = [];
      for (let i = 0; i < rowGroup.length; i++) {
        const parm = {
          type: 'corner',
          display: 0,
          rowspan: 1,
          colspan: 1,
          width: rowGroup[i].body.width,
          height: seriesGroup[0].header.height,
        };
        const cell = this.generateCell(parm);
        row.push(cell);
      }
      tableArray.push(row);
    }

    row = [];
    // 行组
    for (let i = 0; i < rowGroup.length; i++) {
      const parm = {
        type: 'row',
        display: 1,
        rowspan: 1,
        colspan: 1,
        width: rowGroup[i].body.width,
        height: seriesGroup[0].body.height,
        text: rowGroup[i].body.text,
        model: {
          fieldName: rowGroup[i].fieldName,
        },
      };
      const cell = this.generateCell(parm);
      this.setTextBoxStyle(cell.textBox, rowGroup[i].body.style);
      cell.textBox.formatObject = rowGroup[i].body.formatObject || {};
      cell.textBox.contentSourceStyle = rowGroup[i].body.contentSourceStyle;
      cell.textBox.action = rowGroup[i].body.action || {};
      cell.textBox.orderName = rowGroup[i].groupOrder ? rowGroup[i].groupOrder.orderName : null;
      cell.textBox.orderType = rowGroup[i].groupOrder ? rowGroup[i].groupOrder.orderType : null;
      row.push(cell);
    }
    tableArray.push(row);

    // 列组
    for (let i = 0; i < columnGroup.length; i++) {
      let parm = {
        type: 'column',
        display: 1,
        rowspan: 1,
        colspan: seriesGroup.length,
        width: seriesGroup[0].header.width,
        height: columnGroup[i].height,
        text: columnGroup[i].text,
        model: {
          fieldName: columnGroup[i].fieldName,
        },
      };
      let cell = this.generateCell(parm);
      this.setTextBoxStyle(cell.textBox, columnGroup[i].style);
      cell.textBox.formatObject = columnGroup[i].formatObject || {};
      cell.textBox.contentSourceStyle = columnGroup[i].contentSourceStyle;
      cell.textBox.action = columnGroup[i].action || {};
       cell.textBox.orderName = columnGroup[i].groupOrder ? columnGroup[i].groupOrder.orderName : null;
      cell.textBox.orderType = columnGroup[i].groupOrder ? columnGroup[i].groupOrder.orderType : null;
      tableArray[i].push(cell);
      for (let j = 1; j < seriesGroup.length; j++) {
        parm = {
          type: 'column',
          display: 0,
          rowspan: 1,
          colspan: 1,
          height: columnGroup[i].height,
          width: seriesGroup[j].header.width,
        };
        cell = this.generateCell(parm);
        tableArray[i].push(cell);
      }
    }

    if (seriesHeaderDisplay) {
      row = tableArray[cornerRowSpan - 1];
      // 数据组头
      for (let i = 0; i < seriesGroup.length; i++) {
        const parm = {
          type: 'corner',
          display: seriesHeaderDisplay ? 1 : 0,
          rowspan: 1,
          colspan: 1,
          width: seriesGroup[i].header.width,
          height: seriesGroup[i].header.height,
          text: seriesGroup[i].header.text,
        };
        const cell = this.generateCell(parm);
        this.setTextBoxStyle(cell.textBox, seriesGroup[i].header.style);
        cell.textBox.formatObject = seriesGroup[i].header.formatObject || {};
        cell.textBox.contentSourceStyle = seriesGroup[i].header.contentSourceStyle;
        cell.textBox.action = seriesGroup[i].header.action || {};
        row.push(cell);
      }
    }

    row = tableArray[cornerRowSpan];
    // 数据组
    for (let i = 0; i < seriesGroup.length; i++) {
      const parm = {
        type: 'body',
        display: 1,
        rowspan: 1,
        colspan: 1,
        width: seriesGroup[i].header.width,
        height: seriesGroup[i].body.height,
        text: seriesGroup[i].body.text,
        model: {
          fieldName: seriesGroup[i].fieldName,
          text: seriesGroup[i].header.text,
        },
      };
      const cell = this.generateCell(parm);
      this.setTextBoxStyle(cell.textBox, seriesGroup[i].body.style);
      cell.textBox.formatObject = seriesGroup[i].body.formatObject || {};
      cell.textBox.contentSourceStyle = seriesGroup[i].body.contentSourceStyle;
      cell.textBox.action = seriesGroup[i].body.action || {};
      cell.textBox.isSum = seriesGroup[i].body.isSum;
      row.push(cell);
    }

    for (let i = 0; i < rowGroup.length; i++) {
      if (rowGroup[i].hasSum) {
        this.addSumRow(tableArray,
          columnGroup.length + (seriesHeaderDisplay ? 1 : 0),
          i,
          rowGroup[i].sumHeaderText);
      }
    }
    for (let i = 0; i < columnGroup.length; i++) {
      if (columnGroup[i].hasSum) {
        this.addSumColumn(tableArray, i, rowGroup.length, columnGroup[i].sumHeaderText);
      }
    }
    return tableArray;
  },

  buildTableBody(json) {
    if (json) {
      return this.tableBodyFromJson(json);
    } else {
      const tableArray = [
        [this.generateCell({ type: 'corner' }), this.generateCell({ type: 'column', placeHolder: '列' })],
        [this.generateCell({ type: 'row', placeHolder: '行' }), this.generateCell({ type: 'body', placeHolder: '数据' })],
      ];
      tableArray[1][1].textBox.horizontalAlignment = 'Right';
      return tableArray;
    }
  },

  createMatrixControl(defaultTableProperty) {
    const objTableBody = this.buildTableBody();
    const control = {
      areaName: 'Body',
      table: {
        type: 'matrix',
        id: comm.genId('t'),
        position: { x: 0, y: 0 },
        tableRows: objTableBody,
        tableSelect: [],
        attributes: {},
        tableProperty: defaultTableProperty,
      },
    };
    return control;
  },

  JsonToTable(matrix) {
    const newMatrix = {
      type: 'matrix',
      id: comm.genId('t'),
      analysisModelID: matrix.analysisModelID,
      position: matrix.position,
      tableSelect: [],
      tableRows: this.buildTableBody(matrix.model),
      tableProperty: matrix.tableProperty,
      conditions: matrix.conditions,
    };
    return newMatrix;
  },
  tableToJson(matrix, analysisModuleId, conditionsModalData,objTablesHead,objTablesFoot) {
    const tableJson = {
      Report: new Report(),
    };
    tableJson.Report.ReportHeader.Items.TextBoxs = objTablesHead.textBoxes;
    tableJson.Report.ReportHeader.height = objTablesHead.height;
    tableJson.Report.ReportHeader.isShow = objTablesHead.isShow;

    tableJson.Report.ReportFooter.Items.TextBoxs = objTablesFoot.textBoxes;
    tableJson.Report.ReportFooter.height = objTablesFoot.height;
    tableJson.Report.ReportFooter.isShow = objTablesFoot.isShow;
    const tableArray = matrix.tableRows;
    if (!tableArray || tableArray.length < 2) {
      return null;
    }
    let tableWidth = 0;
    tableArray[0].forEach((item)=>{
      tableWidth += item.width;
    })
    const rowCount = this.getRowGroupCount(tableArray);
    const firstRow = tableArray[0];
    let rowGroupIndex = 0;
    for (let i = 0; i < tableArray.length; i++) {
      if (tableArray[i][0].textBox.type === 'row') {
        rowGroupIndex = i;
        break;
      }
    }
    const rowGroup = [];
    const columnGroup = [];
    const seriesGroup = [];
    // 行组
    for (let i = 0; i < rowCount; i++) {
      const headerCell = firstRow[i];
      const valueCell = tableArray[rowGroupIndex][i];
      if (valueCell.model) {
        const sumCoordinate = this.getSumCoordinate(tableArray, rowGroupIndex, i);
        const row = {
          fieldName: valueCell.model.fieldName,
          hasSum: !!sumCoordinate,
          sumHeaderText: sumCoordinate ? tableArray[sumCoordinate.row][sumCoordinate.col].textBox.value : "",
          groupOrder:{
            orderName:valueCell.textBox.orderName||null,
            orderType:valueCell.textBox.orderType||null
          },
          header: {
            text: headerCell.textBox.value,
            style: this.getStyleFromTextBox(headerCell.textBox),
            formatObject: headerCell.textBox.formatObject || {},
            contentSourceStyle: headerCell.textBox.contentSourceStyle,
            action: headerCell.textBox.action || {},
          },
          body: {
            text: valueCell.textBox.value,
            width: firstRow[i].width,
            style: this.getStyleFromTextBox(valueCell.textBox),
            formatObject: valueCell.textBox.formatObject || {},
            contentSourceStyle: valueCell.textBox.contentSourceStyle,
            action: valueCell.textBox.action || {},
          },
        };
        rowGroup.push(row);
      }
    }
    // 列组
    for (let i = 0; i < tableArray.length; i++) {
      const cell = tableArray[i][rowCount];
      if (cell.textBox.type === 'column' && cell.model) {
        const sumCoordinate = this.getSumCoordinate(tableArray, i, rowCount);

        const column = {
          height: cell.height,
          hasSum: !!sumCoordinate,
          sumHeaderText: sumCoordinate ? tableArray[sumCoordinate.row][sumCoordinate.col].textBox.value : "",
          fieldName: cell.model.fieldName,
          text: cell.textBox.value,
          style: this.getStyleFromTextBox(cell.textBox),
          formatObject: cell.textBox.formatObject || {},
          contentSourceStyle: cell.textBox.contentSourceStyle,
          action: cell.textBox.action || {},
          groupOrder:{
            orderName:cell.textBox.orderName||null,
            orderType:cell.textBox.orderType||null
          },
        };
        columnGroup.push(column);
      } else {
        break;
      }
    }
    // 数据
    for (let i = rowCount; i < firstRow.length; i++) {
      let header = tableArray[rowGroupIndex - 1][i];
      if (header.textBox.type !== 'corner') {
        header = null;
      }
      const body = tableArray[rowGroupIndex][i];
      if (body.model && body.textBox.type === 'body') {
        const series = {
          header: {
            formatObject: header ? header.textBox.formatObject : {},
            contentSourceStyle: header ? header.textBox.contentSourceStyle : null,
            action: header ? header.textBox.action : {},
            text: header ? header.textBox.value : body.model.text,
            height: header ? header.height : defaultCellHeight,
            width: body.width,
            style: header ? this.getStyleFromTextBox(header.textBox) : {}
          },
          body: {
            formatObject: body.textBox.formatObject || {},
            contentSourceStyle: body.textBox.contentSourceStyle,
            action: body.textBox.action || {},
            text: body.textBox.value,
            height: body.height,
            isSum: body.textBox.isSum,
            style: this.getStyleFromTextBox(body.textBox),
            warningPictures: body.textBox.warningPictures,
            warningPicturesLocation:body.textBox.warningPicturesLocation
          },
          fieldName: body.model.fieldName,
        };
        seriesGroup.push(series);
      }
    }
    
    if(rowGroup.length === 0 && columnGroup.length === 0 && seriesGroup.length === 0){
      Message.error('表格设计的不完整，请完善表格');
      return;
    }

    tableJson.Report.ReportBody.Items.Tables.push({
      type: 'matrix',
      conditions: conditionsModalData,
      model: {
        rowGroup,
        columnGroup,
        seriesGroup,
        tableWidth
      },
      analysisModelID: analysisModuleId,
      position: matrix.position,
      tableProperty: matrix.tableProperty,
    });
 
    return tableJson;
  },

  getRowGroupCount(tableArray) {
    for (let i = 0; i < tableArray[0].length; i++) {
      if (tableArray[0][i].textBox.type !== 'corner') {
        return i;
      }
    }
  },

  getSeriesGroupCount(tableArray, rowGroupCount) {
    let seriesCount = 0;
    let rowIndex = 0;
    for (let i = 0; i < tableArray.length; i++) {
      if (tableArray[i][0].textBox.type === 'row') {
        rowIndex = i;
        break;
      }
    }
    for (let i = rowGroupCount; i < tableArray[rowIndex].length; i++) {
      if (tableArray[rowIndex][i].textBox.type === 'body') {
        seriesCount++;
      } else {
        break;
      }
    }
    return seriesCount;
  },

  getSumCoordinate(tableArray, row, col) {
    const type = tableArray[row][col].textBox.type;
    let co = null;
    if (type === 'row') {
      const sumTarget = row + tableArray[row][col].rowspan;
      if (sumTarget < tableArray.length && tableArray[sumTarget][col].sumTag === true) {
        co = { row: sumTarget, col };
      }
    } else if (type === 'column') {
      const sumTarget = col + tableArray[row][col].colspan;
      if (sumTarget < tableArray[row].length && tableArray[row][sumTarget].sumTag === true) {
        co = { row, col: sumTarget };
      }
    }
    return co;
  },

  hasSum(tableArray, row, col) {
    const co = this.getSumCoordinate(tableArray, row, col);
    return !!co;
  },

  addSumColumn(tableArray, rowIndex, columnIndex, sumHeaderText = '总计') {
    let columnCount = 0;
    for (let i = rowIndex + 1; i < tableArray.length; i++) {
      if (tableArray[i][columnIndex].textBox.type !== 'column') {
        columnCount = i;
        break;
      }
    }

    let seriesCount = 0;
    for (seriesCount = columnIndex + 1; seriesCount < tableArray[0].length; seriesCount++) {
      if (tableArray[0][seriesCount].textBox.type !== 'column') {
        break;
      }
    }
    seriesCount -= columnIndex;

    const targetColumnIndex = columnIndex + tableArray[rowIndex][columnIndex].colspan;

    for (let r = 0; r < tableArray.length; r++) {
      for (let c = 0; c < seriesCount; c++) {
        const parm = {
          type: 'sum',
          height: tableArray[r][columnIndex + c].height,
          width: tableArray[r][columnIndex + c].width,
          rowspan: 1,
          colspan: 1,
        };
        if (r < rowIndex) {
          parm.rowspan = 1;
          parm.colspan = 1;
          parm.display = 0;
          tableArray[r][columnIndex].colspan += 1;
        } else if (tableArray[r][columnIndex].textBox.type === 'column') {
          if (c === 0 && r === rowIndex) {
            parm.rowspan = columnCount - r;
            parm.colspan = seriesCount;
            parm.display = 1;
            parm.sumTag = true;
            parm.text = sumHeaderText;
          } else {
            parm.rowspan = 1;
            parm.colspan = 1;
            parm.display = 0;
          }
        } else if (tableArray[r][columnIndex].textBox.type === 'corner') {
          parm.display = tableArray[r][columnIndex].display;
          parm.text = tableArray[r][columnIndex + c].textBox.value;
        } else if (tableArray[r][columnIndex].textBox.type === 'body') {
          parm.display = 1;
          parm.text = tableArray[r][columnIndex + c].textBox.value;
          parm.model = tableArray[r][columnIndex + c].model;
        } else if (tableArray[r][columnIndex].textBox.type === 'sum') {
          parm.display = 1;
          parm.text = tableArray[r][columnIndex + c].textBox.value;
          parm.model = tableArray[r][columnIndex + c].model;
        }

        tableArray[r].splice(targetColumnIndex + c, 0, this.generateCell(parm));
        tableArray[r][targetColumnIndex + c].textBox.horizontalAlignment = tableArray[r][targetColumnIndex + c].textBox.value === sumHeaderText ? 'Left' : 'Right';
      }
    }
  },

  addSumRow(tableArray, rowIndex, columnIndex, sumHeaderText = '总计') {

    const rowGroupCount = this.getRowGroupCount(tableArray);

    let targetRowIndex = rowIndex + 1;
    for (let i = rowGroupCount - 1; i > columnIndex; i--) {
      if (this.hasSum(tableArray, rowIndex, i)) {
        targetRowIndex += 1;
      }
    }
    const newRow = [];
    const seriesRow = tableArray[rowIndex];
    for (let i = 0; i < seriesRow.length; i++) {
      const parm = {
        type: 'sum',
        width: seriesRow[i].width,
        rowspan: 1,
        colspan: 1,
      };
      if (seriesRow[i].textBox.type === 'row') {
        if (i < columnIndex) {
          seriesRow[i].rowspan += 1;
          parm.display = 0;
        } else {
          parm.display = 1;
          if (i === columnIndex) {
            parm.text = sumHeaderText;
            parm.sumTag = true;
          }
        }
      } else if (seriesRow[i].model) {
        parm.text = tableArray[rowIndex][i].textBox.value;
        parm.model = {
          fieldName: seriesRow[i].model.fieldName,
        };
      }
      newRow.push(this.generateCell(parm));
      newRow.forEach((t) => {
        t.textBox.horizontalAlignment = t.textBox.value === sumHeaderText ? 'Left' : 'Right';
      });
    }
    tableArray.splice(targetRowIndex, 0, newRow);
  },

  addColumnGroup(tableArray, rowIndex, fieldName, text) {
    const rowGroupCount = this.getRowGroupCount(tableArray);
    let columnGroupCount = 0;
    for (; columnGroupCount < tableArray.length; columnGroupCount++) {
      if (tableArray[columnGroupCount][rowGroupCount].textBox.type !== 'column') {
        break;
      }
    }

    const baseRow = tableArray[rowIndex - 1];
    const newRow = [];
    for (let i = 0; i < baseRow.length; i++) {
      const parm = {
        width: baseRow[i].width,
        rowspan: 1,
        colspan: 1,
      };
      if (baseRow[i].textBox.type === 'corner') {
        tableArray[0][i].rowspan += 1;
        parm.type = 'corner';
        parm.display = 0;
      } else if (baseRow[i].textBox.type === 'column') {
        parm.type = 'column';
        parm.colspan = baseRow[i].colspan;
        parm.display = baseRow[i].display;
        parm.text = `=Fields.${fieldName}`;
        parm.model = {
          fieldName,
        };
      } else if (baseRow[i].textBox.type === 'sum') {
        parm.type = 'sum';
        parm.display = 0;
        parm.rowspan = 0;
        parm.colspan = 0;
        for (let k = rowIndex - 1; k >= 0; k--) {
          if (tableArray[k][i].sumTag === true) {
            tableArray[k][i].rowspan += 1;
            break;
          }
        }
      }

      newRow.push(this.generateCell(parm));
    }
    tableArray.splice(rowIndex, 0, newRow);
  },

  addRowGroup(tableArray, colIndex, fieldName, text) {
    for (let i = 0; i < tableArray.length; i++) {
      const parm = {
        type: tableArray[i][colIndex - 1].textBox.type,
        height: tableArray[i][colIndex - 1].height,
        rowspan: tableArray[i][colIndex - 1].rowspan,
        colspan: 1,
        display: tableArray[i][colIndex - 1].display,
      };
      if (parm.type === 'corner') {
        if (parm.display === 1) {
          parm.text = text;
        }
      } else if (parm.type === 'row') {
        parm.text = `=Fields.${fieldName}`;
        parm.model = { fieldName };
      }
      tableArray[i].splice(colIndex, 0, this.generateCell(parm));
    }
  },

  addSeriesGroup(tableArray, colIndex, fieldName, text, dataType) {
    // 行组个数
    const rowGroupCount = this.getRowGroupCount(tableArray);
    let seriesIndex = 0;
    for (let i = 0; i < tableArray.length; i++) {
      if (tableArray[i][0].textBox.type === 'row') {
        seriesIndex = i;
        break;
      }
    }
    if (tableArray[seriesIndex - 1][rowGroupCount].textBox.type !== 'corner') {
      const firstRow = tableArray[0];
      const newRow = [];
      for (let i = 0; i < rowGroupCount; i++) {
        newRow.push(this.generateCell({ type: 'corner', display: 0 }));
        firstRow[i].rowspan++;
      }
      for (let i = rowGroupCount; i < firstRow.length; i++) {
        newRow.push(this.generateCell({ type: 'corner', display: 1, width: firstRow[i].width, text: tableArray[seriesIndex][i].model.text }));
      }
      newRow.forEach((t) => {
        t.textBox.horizontalAlignment = 'Right';
      });
      tableArray.splice(seriesIndex, 0, newRow);
      seriesIndex++;
    }
    // 列组个数
    const columnGroupCount = seriesIndex - 1;
    // 添加明细系列
    for (let i = 0; i < tableArray.length; i++) {
      const parm = {
        height: tableArray[i][0].height,
        rowspan: 1,
        colspan: 1,
      };
      if (tableArray[i][colIndex - 1].textBox.type === 'column') {
        for (let c = colIndex - 1; c > 0; c--) {
          if (tableArray[i][c].textBox.type === 'corner') {
            break;
          } else if (tableArray[i][c].display === 1) {
            tableArray[i][c].colspan += 1;
          }
        }
        parm.display = 0;
        parm.type = 'column';
      } else if (tableArray[i][colIndex - 1].textBox.type === 'corner') {
        parm.display = 1;
        parm.text = text;
        parm.type = 'corner';
      } else if (tableArray[i][colIndex - 1].textBox.type === 'body') {
        parm.type = 'body';
        parm.text = `=sum(Fields.${fieldName})`;
        parm.display = 1;
        parm.model = {
          fieldName,
        };
      } else if (tableArray[i][colIndex - 1].textBox.type === 'sum') {
        parm.type = 'sum';
        parm.text = `=sum(Fields.${fieldName})`;
        parm.display = 1;
        parm.model = {
          fieldName,
        };
      }
      const cell = this.generateCell(parm);
      if (dataType === 'float') {
        cell.textBox.formatObject = { num: 2, thousandth: false, type: "Number", value: "1230.00" };
        cell.textBox.contentSourceStyle = 'Number';
      }
      tableArray[i].splice(colIndex, 0, cell);
      tableArray[i][colIndex].textBox.horizontalAlignment = 'Right';
    }
    // 添加合计系列
    for (let s = 0; s < columnGroupCount; s += 1) {
      if (this.hasSum(tableArray, s, rowGroupCount) === true) {
        // 列头colspan+1
        for (let c = s - 1; c >= 0; c -= 1) {
          tableArray[c][rowGroupCount].colspan += 1;
        }
        let colspan = tableArray[s][rowGroupCount].colspan;
        let targetColIndex = colIndex + colspan;
        // 合计colspan+1
        tableArray[s][rowGroupCount + colspan].colspan += 1;

        for (let i = 0; i < tableArray.length; i++) {
          const parm = {
            height: tableArray[i][0].height,
            rowspan: 1,
            colspan: 1,
            type: 'sum',
            display: 1,
          };
          const type = tableArray[i][colIndex - 1].textBox.type;
          if (type === 'column') {
            parm.display = 0;
          } else if (type === 'corner') {
            parm.text = text;
          } else if (type === 'body') {
            parm.text = `=sum(Fields.${fieldName})`;
            parm.model = {
              fieldName,
              sumType: 'sum',
            };
          } else if (type === 'sum') {
            parm.text = `=sum(Fields.${fieldName})`;
            parm.model = {
              fieldName,
              sumType: 'sum',
            };
          }
          tableArray[i].splice(targetColIndex, 0, this.generateCell(parm));
          tableArray[i][targetColIndex].textBox.horizontalAlignment = 'Right';
        }
      }
    }
  },
  existsField(tableArray, fieldName, groupName) {
    const rowGroupCount = this.getRowGroupCount(tableArray);
    let seriesIndex;
    let cell;
    for (let i = 0; i < tableArray.length; i += 1) {
      if (tableArray[i][rowGroupCount].textBox.type === 'body') {
        seriesIndex = i;
        break;
      }
    }
    if (groupName === 'series') {
      const row = tableArray[seriesIndex];
      for (let i = rowGroupCount; i < row.length; i += 1) {
        cell = row[i];
        if (cell.model && cell.model.fieldName === fieldName) {
          return true;
        }
      }
    } else if (groupName === 'row') {
      const row = tableArray[seriesIndex];
      for (let i = 0; i < rowGroupCount; i += 1) {
        cell = row[i];
        if (cell.model && cell.model.fieldName === fieldName) {
          return true;
        }
      }
    } else if (groupName === 'column') {
      for (let i = 0; i < seriesIndex; i += 1) {
        cell = tableArray[i][rowGroupCount];
        if (cell.model && cell.model.fieldName === fieldName) {
          return true;
        }
      }
    }
    return false;
  },
};

Object.assign(MatrixUtil, TableUtil);

//－－－改兼容IE10－－－;
// Reflect.setPrototypeOf(MatrixUtil, TableUtil);

export default MatrixUtil;
