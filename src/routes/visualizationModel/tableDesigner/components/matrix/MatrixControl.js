import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Form, Modal, Select, Radio } from '@vadp/ui';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';
import Common from 'components/Print/Common';
import Message from 'public/Message';
import { shortcutToolbarSignal } from 'public/ShortcutToolbar/signal';
import TableCell from '../TableCell';
import TextBox from '../TextBoxControl';
import { analysisModel } from 'public/analysisModel';
import {
  selectedTextBox,
  updateTable,
  removeTable,
  updateTextBox,
} from '../../DynamicTableActions';
import MatrixUtil from './matrixUtils';

const matrixUtil = MatrixUtil;
const defaultTextBox = matrixUtil.generateTextBox();

const defaultCellMinWidth = 80;
const defaultCellMinHeight = 24;

const columnLine = { drag: false };
const rowLine = { drag: false };
const tableBlock = { drag: false };
const RadioGroup = Radio.Group;

class MatrixControl extends Component {
  constructor(props) {
    super(props);
    this.textBoxPropertySignal = shortcutToolbarSignal.getByControlID('textBoxPropByTable');
    this.state = props.table;
    // this.toobarEvents = shortcutToolbarSignal.getByControlID('toobarEvent');
  }
  componentDidMount() {
    this.handleClickDiv()
    this.textBoxPropertySignal.action.add(this.replaceTextBox);
    // this.toobarEvents.action.add(this.replaceToobar);
  }
  componentWillUnmount() {
    this.textBoxPropertySignal.action.remove(this.replaceTextBox);
    // this.toobarEvents.action.remove(this.replaceToobar);
  }
  replaceTextBox = ({ rowID, colID, textBox } = {}) => {
    this.state.tableRows[rowID][colID].textBox = textBox;
    const table = {
      id: this.state.id,
      tableRows: this.state.tableRows,
    };
    this.props.dispatch(updateTable({ table, areaName: this.props.areaName }));
  }
  columnLineMouseDown = (e) => {
    columnLine.drag = true;
    columnLine.positionX = e.pageX;
    columnLine.coordinateY = e.target.parentNode.getAttribute('data-index');
  };

  rowLineMouseDown = (e) => {
    rowLine.drag = true;
    rowLine.positionY = e.pageY;
    rowLine.coordinateX = e.target.parentNode.getAttribute('data-index');
    rowLine.role = e.target.parentNode.getAttribute('data-role');
  };

  // 是表格可以拖动
  tableBlockMouseDown = (e) => {
    tableBlock.drag = true;
    tableBlock.diffX = e.pageX - this.state.position.x;
    tableBlock.diffY = e.pageY - this.state.position.y;
  };

  // 监控鼠标移动
  tableMouseMove = (e) => {
    if (e.target.tagName === 'TEXTAREA') {
      return;
    }

    e.preventDefault();
    if (tableBlock.drag) {
      let tablePositionX = e.pageX - tableBlock.diffX < 0 ? 0 : e.pageX - tableBlock.diffX;
      let tablePositionY = e.pageY - tableBlock.diffY < 0 ? 0 : e.pageY - tableBlock.diffY;
      this.setState({ position: { x: tablePositionX, y: tablePositionY } });
    }
    if (columnLine.drag) {
      let tableArray = this.state.tableRows;
      let newPositionX = e.pageX;
      let distanceX = newPositionX - columnLine.positionX;
      let coordinateY = parseInt(columnLine.coordinateY, 10);
      for (let i = 0, j = tableArray.length; i < j; i++) {
        let rowData = tableArray[i];
        let width = rowData[coordinateY].width + distanceX;
        rowData[coordinateY].width = (width <= defaultCellMinWidth) ? defaultCellMinWidth : width;
      }
      columnLine.positionX = newPositionX;
      this.setState({ tableRows: tableArray })
    }

    if (rowLine.drag) {
      let newPositionY = e.pageY;
      let distanceY = newPositionY - rowLine.positionY;
      let coordinateX = parseInt(rowLine.coordinateX, 10);
      let role = rowLine.role;
      let tableArray = this.state.tableRows;
      for (let i = 0, j = tableArray[coordinateX].length; i < j; i++) {
        let height = tableArray[coordinateX][i].height + distanceY;
        tableArray[coordinateX][i].height = (height <= defaultCellMinHeight) ? defaultCellMinHeight : height;
      }
      rowLine.positionY = newPositionY;
      let newState = { [role]: tableArray };
      this.setState(newState);
    }

  };

  tableMouseUp = (e) => {
    const tableID = this.state.id;
    const newState = { table: { id: tableID }, areaName: this.props.areaName };
    let toUpdate = false;
    if (tableBlock.drag === true) {
      tableBlock.drag = false;
      if (e.pageX !== tableBlock.diffX ||
        e.pageY !== tableBlock.diffY) {
        toUpdate = true;
        newState.table.position = { ...this.state.position };
      }
    }
    if (columnLine.drag) {
      toUpdate = true;
      columnLine.drag = false;
    }
    if (rowLine.drag) {
      toUpdate = true;
      rowLine.drag = false;
    }
    if (toUpdate === true) {
      this.props.dispatch(updateTable(newState));
    }
  };

  isCellSelect = (coordinate) => {
    const tableSelect = this.state.tableSelect;
    if (tableSelect.length === 0) {
      return;
    }

    for (let i = 0, j = tableSelect.length; i < j; i++) {
      if (tableSelect[i] === coordinate) {
        return true;
      }
    }
  };

  deleteGroup = () => {
    const select = this.state.tableSelect;
    if (!select) {
      return;
    }
    let position = select[0].split(',');
    let row = parseInt(position[0]);
    let col = parseInt(position[1]);
    let tableArray = this.state.tableRows;
    let type = tableArray[row][col].textBox.type;
    let text = '';
    if (type === 'corner') {
      if (tableArray[row + 1][col].textBox.type === 'body') {
        row = row + 1;
      } else {
        for (let index = 0; index < tableArray.length; index++) {
          if (tableArray[index][col].textBox.type === 'row') {
            row = index;
            break;
          }
        }
      }
    }
    if (!tableArray[row][col].model) {
      return;
    }
    this.showModal('delCell', { row, col });
  }

  addSumRow = (rowIndex, columnIndex) => {
    const tableArray = this.state.tableRows;
    matrixUtil.addSumRow(tableArray, rowIndex, columnIndex);
  }
  delSumRow = (rowIndex, columnIndex) => {
    const tableArray = this.state.tableRows;
    for (let i = rowIndex + 1; i < tableArray.length; i++) {
      if (tableArray[i][columnIndex].sumTag === true && tableArray[i][columnIndex].textBox.type === 'sum') {
        const row = tableArray[i];
        for (let j = 0; j < row.length; j++) {
          if (row[j].display === 0) {
            tableArray[rowIndex][j].rowspan -= 1;
          } else {
            break;
          }
        }
        tableArray.splice(i, 1);
        break;
      }
    }
  }

  addSumColumn = (rowIndex, columnIndex) => {
    const tableArray = this.state.tableRows;
    matrixUtil.addSumColumn(tableArray, rowIndex, columnIndex);
  }
  delSumColumn = (rowIndex, columnIndex) => {
    const tableArray = this.state.tableRows;
    let count = 0;
    let start = 0;
    for (let i = columnIndex; i < tableArray[0].length; i++) {
      const cell = tableArray[rowIndex][i];
      if (!cell.sumTag && cell.textBox.type === 'column') {
        count++;
      } else if (cell.sumTag === true && cell.textBox.type === 'sum') {
        start = i;
        break;
      }
    }
    if (start > 0) {
      for (let i = 0; i < tableArray.length; i++) {
        if (i < rowIndex) {
          tableArray[i][columnIndex].colspan -= count;
        }
        tableArray[i].splice(start, count);
      }
    }
  }

  operateSum = (cell) => {
    const { rowIndex, columnIndex, hasSum } = cell;
    const tableArray = this.state.tableRows;
    const type = tableArray[rowIndex][columnIndex].textBox.type;

    if (type === 'row') {
      if (hasSum) {
        this.delSumRow(rowIndex, columnIndex);
      } else {
        this.addSumRow(rowIndex, columnIndex);
      }
    } else if (type === 'column') {
      if (hasSum) {
        this.delSumColumn(rowIndex, columnIndex);
      } else {
        this.addSumColumn(rowIndex, columnIndex);
      }
    }

    const currentObject = { ...this.state.position };
    const tableID = this.state.id;
    this.props.dispatch(updateTable({
      table: { id: tableID, position: currentObject, tableRows: tableArray },
      areaName: this.props.areaName,
    }));
  }

  doDeleteGroup = (position) => {
    const { row, col } = position;
    const tableArray = this.state.tableRows;
    const cell = tableArray[row][col];
    const type = cell.textBox.type;
    if (type === 'row') {
      this.delSumRow(row, col);
      if (col > 0 || (tableArray[row][col + 1].textBox.type === 'row')) {
        for (let i = 0; i < tableArray.length; i++) {
          tableArray[i].splice(col, 1);
        }
      } else {
        for (let i = 0; i < tableArray.length; i++) {
          const newType = tableArray[i][col].textBox.type !== 'row' ? 'corner' : 'row';
          const tmpCell = matrixUtil.generateCell({ type: newType });
          tableArray[i][col].textBox = tmpCell.textBox;
          if (newType === 'row') {
            tableArray[i][col].textBox.placeHolder = '行';
          }
          delete tableArray[i][col].model;
        }
      }
    } else if (type === 'column') {
      this.delSumColumn(row, col);
      if (row > 0 || tableArray[1][col].textBox.type === 'column') {
        for (let i = 0; i < tableArray[0].length; i++) {
          if (tableArray[0][i].textBox.type === 'corner') {
            tableArray[0][i].rowspan -= 1;
            if (row === 0) {
              tableArray[1][i] = tableArray[0][i];
            }
          } else {
            break;
          }
        }
        for (let i = col + tableArray[row][col].colspan; i < tableArray[0].length; i++) {
          for (let k = row - 1; k >= 0; k--) {
            if (tableArray[k][i].display === 1) {
              tableArray[k][i].rowspan -= 1;
              break;
            }
          }
        }
        tableArray.splice(row, 1);
      } else {
        const tmpCell = matrixUtil.generateCell({ type: 'column', placeHolder: '列' });
        tableArray[row][col].textBox = tmpCell.textBox;
        delete tableArray[row][col].model;
      }
    } else if (type === 'body') {
      this.delSeriesGroup(position);
    }// end
  }
  delSeriesGroup = (position) => {
    const { row, col } = position;
    const tableArray = this.state.tableRows;
    if ((col < tableArray[row].length - 1 && tableArray[row][col + 1].textBox.type === 'body') || tableArray[row][col - 1].textBox.type === 'body') {
      let rowGroupCount = matrixUtil.getRowGroupCount(tableArray);
      let columnGroupCount = row - 1;
      let seriesGroupCount = matrixUtil.getSeriesGroupCount(tableArray, rowGroupCount);

      for (let i = 0; i < columnGroupCount; i++) {
        let hasSum = matrixUtil.hasSum(tableArray, i, rowGroupCount);
        if (hasSum) {
          let colspan = tableArray[i][rowGroupCount].colspan;
          let targetCol = col + colspan;
          tableArray[i][rowGroupCount + colspan].colspan -= 1;
          for (let j = i - 1; j >= 0; j--) {
            tableArray[j][rowGroupCount].colspan -= 1;
          }
          if (col === rowGroupCount) {
            for (let j = 0; j < columnGroupCount; j++) {
              tableArray[j][targetCol + 1] = tableArray[j][targetCol];
            }
          }
          for (let j = 0; j < tableArray.length; j++) {
            tableArray[j].splice(targetCol, 1);
          }
        }
      }
      if (col === rowGroupCount) {
        for (let i = 0; i < columnGroupCount; i++) {
          tableArray[i][col + 1] = tableArray[i][col];
        }
      }

      for (let i = 0; i < tableArray.length; i++) {
        if (tableArray[i][rowGroupCount].textBox.type === 'column') {
          tableArray[i][rowGroupCount].colspan -= 1;
        }
        tableArray[i].splice(col, 1);
      }

      let tmpCol = col;
      let baseRow = tableArray[row];
      if (tmpCol === baseRow.length) {
        tmpCol--;
      }
      if (tmpCol === tableArray[row].length - 1 && tableArray[row][tmpCol - 1].textBox.type !== 'body') {
        let firstRow = tableArray[0];
        for (let i = 0; i < rowGroupCount; i++) {
          firstRow[i].rowspan--;
        }
        for (let i = rowGroupCount, len = tableArray[row].length; i < len; i++) {
          tableArray[row][i].model.text = tableArray[row - 1][i].textBox.value;
        }
        tableArray.splice(row - 1, 1);
      }
    } else {
      for (let i = row; i < tableArray.length; i++) {
        let theRow = tableArray[i];
        for (let j = col; j < theRow.length; j++) {
          let tmpCell = matrixUtil.generateCell({ type: 'sum' });
          tmpCell.textBox.horizontalAlignment = 'Right';
          theRow[j].textBox = tmpCell.textBox;
          delete theRow[j].model;
        }
      }
      tableArray[row][col].textBox.type = 'body';
      tableArray[row][col].textBox.placeHolder = '数据';
    }
  }
  handleClickDiv = () => {
    const table = this.matrixDiv;
    table.style.borderColor = '#0D70FF';
    const tableID = this.state.id;
    const controlInfo = {
      tableID,
      areaName: 'Body',
      controlCategory: 'table',
    };
    this.props.dispatch(selectedTextBox({ controlInfo }));
  };
  removeTable = () => {
    // 修改文字
    const tableID = this.state.id;
    this.props.dispatch(removeTable({ tableID, areaName: this.props.areaName }));
    this.hideModal();
  };

  showModal = (type, position) => {
    if (type === 'delTable') {
      this.setState({
        modalTitle: '删除表格',
        modalData: (<p>确定要删除这个表格吗</p>),
        modalOK: this.removeTable,
      });
    } else if (type === 'delCell') {
      let tableArray = this.state.tableRows;
      let { row, col } = position;
      let text = tableArray[row][col].textBox.value;
      const makeOK = (postion) => {
        return () => {
          this.doDeleteGroup(position);
          this.setState({ visible: false, modalData: '' });
          let currentObject = { ...this.state.position };
          let tableID = this.state.id;
          this.props.dispatch(updateTable({ table: { id: tableID, position: currentObject, tableRows: this.state.tableRows }, areaName: this.props.areaName }));
        };
      }
      this.setState({
        modalTitle: '删除关联组',
        modalData: (<p>确定要删除关联组{text}吗?</p>),
        modalOK: makeOK({ row, col }),
      });
    } else if (type === 'groupAttr') {
      const orderName = this.state.tableRows[position.rowIndex][position.columnIndex].textBox.orderName || '';
      const orderType = this.state.tableRows[position.rowIndex][position.columnIndex].textBox.orderType || 'asc';
      this.setState({
        modalTitle: '分组属性',
        modalData: (<div>
          <div style={{ marginBottom: '10px' }}>
            <span style={{ textAlien: 'right', marginRight: '8px' }}>分组排序字段:</span>
            <Select onSelect={this.onOrderName.bind(this, position)} style={{ width: '300px' }} defaultValue={orderName}>
              <Select.Option key="_" value="">----</Select.Option>
              {
                this.props.datasource && analysisModel.getFields(this.props.datasource, null).map((f) => {
                  return (<Select.Option key={f.aliasName} value={f.aliasName}>
                    {f.comments}
                  </Select.Option>);
                })
              }
            </Select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <span style={{ textAlien: 'right', marginRight: '8px' }}>升降序:</span>
            <RadioGroup options={[{ label: '升序', value: 'asc' }, { label: '降序', value: 'desc' }]} onChange={this.onGroupSort.bind(this, position)} defaultValue={orderType} />
          </div>


        </div>),
        modalOK: this.setGroupAttr,
      });
    }
    this.setState({ visible: true });
  };

  hideModal = () => {
    this.setState({ visible: false, modalData: '' });
  };

  disableContextMenu = (ev) => {
    ev.preventDefault();
    return false;
  };
  calcCellSize = (row, col) => {
    let tableArray = this.state.tableRows;
    let cell = tableArray[row][col];
    let result = { height: 0, width: 0 };
    if (cell.display === 1) {
      for (let r = 0; r < cell.rowspan; r++) {
        result.height += tableArray[row + r][col].height;
      }
      for (let c = 0; c < cell.colspan; c++) {
        result.width += tableArray[row][col + c].width;
      }
    }
    return result;
  }
  handleTextBoxMouseUp = (e, rowID, colID) => {
    this.setState({ tableSelect: [`${rowID},${colID}`] });
  }
  handleTextBoxActive = (e, rowID, colID) => {
    const table = this.matrixDiv;
    table.style.borderColor = 'transparent';
    const tableID = this.state.id;
    const controlInfo = {
      tableID,
      areaName: this.props.areaName,
      controlCategory: 'textBoxByTable',
      rowID,
      colID,
      tableType: 'matrix'
    };
    this.props.dispatch(selectedTextBox({ controlInfo }));
  }
  handleTextBoxDrop = (event, rowID, colID) => {
    event.preventDefault();
    let textGetData = event.dataTransfer.getData("text");
    textGetData = textGetData ? JSON.parse(textGetData) : textGetData;
    const control = textGetData.control || ''
    // const control = event.dataTransfer.getData('control');
    if (control !== '') {
      return;
    }
    const tableArray = this.state.tableRows;

    const currentCell = tableArray[rowID][colID];
    const currentTextBox = currentCell.textBox;

    const cellType = currentTextBox.type;

    if (cellType === 'corner') {
      Message.info('不能拖放在此。');
      return;
    }
    const type = textGetData.type;
    const text = textGetData.text;
    const fieldName = textGetData.fieldName;
    // const type = event.dataTransfer.getData('type');
    // const text = event.dataTransfer.getData('text');
    // const fieldName = event.dataTransfer.getData('fieldname');

    if (type === 'measure' &&
      currentTextBox.type === 'body' &&
      !matrixUtil.existsField(tableArray, fieldName, 'series')) {
      const dataType = textGetData.datatype;
      // const dataType = event.dataTransfer.getData('datatype');

      if (currentCell.model) {
        matrixUtil.addSeriesGroup(tableArray, parseInt(colID, 10) + 1, fieldName, text, dataType); // eslint-disable-line max-len
      } else {
        for (let i = rowID; i < tableArray.length; i += 1) {
          const row = tableArray[i];
          for (let j = colID; j < row.length; j += 1) {
            row[j].model = {
              fieldName, text,
            };
            const textBox = row[j].textBox;
            textBox.type = 'sum';
            textBox.value = `=sum(Fields.${fieldName})`;
            row[j].textBox = { ...textBox };
          }
        }
        currentTextBox.type = 'body';
        if (dataType === 'float') {
          currentTextBox.formatObject = { num: 2, thousandth: false, type: 'Number', value: '1230.00' };
          currentTextBox.contentSourceStyle = 'Number';
        }
        currentCell.textBox = { ...currentTextBox };
      }
    } else if (type === 'dimension' && currentTextBox.type === 'row' && !matrixUtil.existsField(tableArray, fieldName, 'row')) {
      if (currentCell.model) {
        matrixUtil.addRowGroup(tableArray, parseInt(colID, 10) + 1, fieldName, text);
      } else {
        currentCell.model = {
          fieldName,
        };
        currentTextBox.value = `=Fields.${fieldName}`;
        const headerTextBox = tableArray[0][colID].textBox;
        headerTextBox.value = text;
        headerTextBox.type = 'corner';
        headerTextBox.fontInfo = {
          size: 14,
        }

        currentCell.textBox = { ...currentTextBox };

        tableArray[0][colID].textBox = { ...headerTextBox };
      }
    } else if (type === 'dimension' && currentTextBox.type === 'column' && !matrixUtil.existsField(tableArray, fieldName, 'column')) {
      if (currentCell.model) {
        matrixUtil.addColumnGroup(tableArray, parseInt(rowID, 10) + 1, fieldName, text);
      } else {
        currentCell.model = {
          fieldName,
        };
        currentTextBox.value = `=Fields.${fieldName}`;
        currentCell.textBox = { ...currentTextBox, fontInfo: { size: 14, } };
      }
    } else {
      Message.info('不能拖放在此。');
    }
    const position = { ...this.state.position };
    const tableID = this.state.id;
    this.props.dispatch(updateTable({
      table: {
        id: tableID,
        position,
        tableRows: tableArray,
      },
      areaName: this.props.areaName,
    }));
  }
  handleTextBoxValueChange = (value, rowID, colID) => {
    const tableArray = this.state.tableRows;
    const currentCell = tableArray[rowID][colID];
    const currentTextBox = currentCell.textBox;
    currentTextBox.value = value;
    this.props.dispatch(updateTextBox(
      {
        areaName: this.props.areaName,
        textBox: currentTextBox,
        tableID: this.state.id,
        rowID,
        colID,
      }));
  }
  setGroupAttr = () => {
    const position = { ...this.state.position };
    const tableID = this.state.id;
    const tableArray = this.state.tableRows;
    tableArray.forEach((item) => {
      item.forEach((c) => {
        if (!c.textBox.orderType) {
          c.textBox.orderType = 'asc';
        }
      })
    })
    this.props.dispatch(updateTable({
      table: {
        id: tableID,
        position,
        tableRows: tableArray,
      },
      areaName: this.props.areaName,
    }));



    this.setState({ visible: false, modalData: '' });

  }
  onOrderName = (p, v) => {
    const tableArray = JSON.parse(JSON.stringify(this.state.tableRows));
    const currentCell = tableArray[p.rowIndex][p.columnIndex];
    const currentTextBox = currentCell.textBox;
    currentTextBox.orderName = v;
    this.setState({
      tableRows: tableArray
    })
    // this.props.dispatch(updateTextBox(
    //  {
    //    areaName: this.props.areaName,
    //    textBox: currentTextBox,
    //    tableID: this.state.id,
    //    rowID:p.rowIndex,
    //    colID:p.columnIndex,
    //  }));
  }
  onGroupSort = (p, v) => {
    const tableArray = JSON.parse(JSON.stringify(this.state.tableRows));
    const currentCell = tableArray[p.rowIndex][p.columnIndex];
    const currentTextBox = currentCell.textBox;
    currentTextBox.orderType = v.target.value;
    this.setState({
      tableRows: tableArray
    })
  }
  handleContextMenu = (e, data) => {
    switch (data.menuId) {
      case 'delTable':
        this.showModal('delTable');
        break;
      case 'sum':
        this.operateSum(data.cell);
        break;
      case 'delCell':
        this.deleteGroup();
        break;
      case 'groupAttr':
        this.showModal('groupAttr', data.cell);
        break
      default:
        break;
    }
  }
  refMatrix = (element) => {
    this.matrixDiv = element;
  }
  renderCellContextMenu = () => {
    const menuArray = [];
    let currentCell = null;

    const select = this.state.tableSelect;
    if (select && select.length > 0) {
      const position = select[0].split(',');
      let row = parseInt(position[0], 10);
      const col = parseInt(position[1], 10);
      const tableArray = this.state.tableRows;
      if (tableArray.length > row && tableArray[0].length > col) {
        const type = tableArray[row][col].textBox.type;
        if (type === 'corner') {
          if (tableArray[row + 1][col].textBox.type === 'body') {
            row += 1;
          } else {
            for (let index = 0; index < tableArray.length; index++) {
              if (tableArray[index][col].textBox.type === 'row') {
                row = index;
                break;
              }
            }
          }
        }
        currentCell = { col, row, type: tableArray[row][col].textBox.type, tableArray };
      }


      if (currentCell) {
        const { type, col, row, tableArray } = currentCell;
        if (type !== 'sum') {
          menuArray.unshift({
            title: '删除关联组',
            data: { menuId: 'delCell' },
          });
          menuArray.unshift({
            title: '分组属性',
            data: { menuId: 'groupAttr', cell: { rowIndex: row, columnIndex: col, } },
          });
        }
        if (type === 'row' || type === 'column') {
          const hasSum = matrixUtil.hasSum(tableArray, row, col);
          menuArray.unshift({
            title: `${(hasSum ? '删除' : '添加')}总计`,
            data: { menuId: 'sum', cell: { rowIndex: row, columnIndex: col, hasSum } },
          });
        }
      }
    }
    if (menuArray.length === 0) {
      return (<div />)
    }
    return (<ContextMenu id="table-cell" hideOnLeave={false}>
      {
        menuArray.map((item) => {
          return (<MenuItem
            key={item.title}
            data={item.data}
            onClick={this.handleContextMenu}
          >
            {item.title}
          </MenuItem>);
        })
      }
    </ContextMenu>);
  }
  render() {
    const tableArray = this.state.tableRows;
    const width = tableArray[0].reduce((sum, item) => {
      return item.width + sum;
    }, 1);
    return (
      <div
        className="table-wrap"
        onMouseUp={this.tableMouseUp}
        onContextMenu={this.disableContextMenu}
        onMouseMove={this.tableMouseMove.bind(this)}
        style={{ 'overflow': 'auto' }}
      >
        <div
          ref={this.refMatrix}
          style={{ transform: `translate(${this.state.position.x}px,${this.state.position.y}px)`, border: '1px dashed  transparent', float: 'none', display: 'inline-block' }}
          className="table-content"
        >
          <ContextMenuTrigger id="table-cell" >
            <table id={this.state.id} className="table-box" cellPadding="0" cellSpacing="0" style={{ tableLayout: 'fixed', width: width + 'px' }} >
              <colgroup>
                {
                  tableArray[0].map((item, idx) => {
                    return <col key={idx} style={{ width: item.width + 'px', minWidth: item.width + 'px' }} />;
                  })
                }
              </colgroup>
              <tbody className="tbody-box">
                {
                  tableArray.map((row, rowIndex) => {
                    return (
                      <tr key={rowIndex} data-index={rowIndex}>
                        {
                          row.map((cell, columnIndex) => {
                            const size = this.calcCellSize(rowIndex, columnIndex);
                            return (
                              <TableCell
                                key={cell.textBox.id}
                                tableIndex={this.props.index}
                                isSelected={this.isCellSelect(rowIndex + ',' + columnIndex)}
                                width={size.width}
                                height={size.height}
                                rowID={rowIndex}
                                columnID={columnIndex}
                              >
                                <TextBox
                                  onClick={this.handleTextBoxActive}
                                  onDrop={this.handleTextBoxDrop}
                                  onMouseUp={this.handleTextBoxMouseUp}
                                  onChange={this.handleTextBoxValueChange}
                                  width={size.width}
                                  height={size.height}
                                  rowID={rowIndex}
                                  columnID={columnIndex}
                                  textBox={cell.textBox}
                                  defaultTextBox={defaultTextBox}
                                />
                              </TableCell>
                            );
                          })
                        }
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </ContextMenuTrigger>
          <ContextMenuTrigger id="table-handle">
            <div
              className="table-block"
              onMouseDown={this.tableBlockMouseDown}
              onClick={this.handleClickDiv}
            /></ContextMenuTrigger>
          <div id="table-columns" style={{ width }} className="column-block" >
            {
              tableArray[0].map((item, index) => {
                return (
                  <p className="row-margin" key={index} data-index={index} style={{ width: item.width + 'px', cursor: 'pointer' }}>
                    <span onMouseDown={this.columnLineMouseDown.bind(this)} className="column-line" />
                  </p>
                );
              })
            }
          </div>
          <div id="table-rows" className="row-block">
            {
              tableArray.map((item, index) => {
                return (
                  <p className="row-margin" key={index} data-index={index} data-role="tableBody" style={{ height: item[0].height + 'px', lineHeight: item[0].height + 'px', cursor: 'pointer' }}>
                    <span onMouseDown={this.rowLineMouseDown.bind(this)} className="row-line" />
                  </p>
                );
              })
            }
          </div>
        </div>
        <ContextMenu id="table-handle" hideOnLeave={false}>
          <MenuItem
            data={{ menuId: 'delTable' }}
            onClick={this.handleContextMenu}
          >
            删除表格
          </MenuItem>
        </ContextMenu>
        {
          this.renderCellContextMenu()
        }
        <Modal
          title={this.state.modalTitle}
          visible={this.state.visible}
          closable
          onOk={
            this.state.modalOK
          }
          width={450}
          onCancel={this.hideModal.bind(this)}
          okText="是"
          cancelText="否"
          wrapClassName="bi"
        >
          {this.state.modalData}
        </Modal>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  table: state.DynamicTableReducer.Body.tables[ownProps.index],
  theme: state.global.theme,
  datasource: state.chartDataSource.datasource,
});

const matrixControl = Form.create()(MatrixControl);
export default connect(mapStateToProps,null,null, { withRef: true })(matrixControl);
