import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Form, Icon, Modal } from '@vadp/ui';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';
import {
  selectedTextBox,
  updateTable,
  updateTextBox,
} from 'routes/visualizationModel/tableDesigner/DynamicTableActions';
import AddGroupModal from '../AddGroupModal';
import BISignal from 'components/Public/BISignals';
import Common from '../../../../../components/Print/Common';
import TableCell from '../TableCell';
import TextBox from '../TextBoxControl';
import DynamicTableUtil from '../DynamicTableUtils';
import TableControlAction from '../TableControlAction';

const comm = new Common();
const confirm = Modal.confirm;
const dynamicTableUtil = DynamicTableUtil;
const defaultCellMinWidth = 80;
const defaultCellMinHeight = 24;
const columnLine = { drag: false };
const rowLine = { drag: false };
const columnSelect = { drag: false };
const tableBlock = { drag: false };
const roleArray = ['tableHeader', 'tableBody', 'tableFooter'];

class TableControl extends Component {
  constructor(props) {
    super(props);
    this.state = props.table;
    this.state.groupModel = {
      visible: false,
    };
    this.tableControlAction = new TableControlAction(this);
  }
  componentDidMount() {
    BISignal.tableShortcutSignal.add(this.toolBarClick);
  }
  componentWillUnmount() {
    BISignal.tableShortcutSignal.remove(this.toolBarClick);
  }
  // 批处理
  toolBarClick = (type) => {
    if (type === 'Bold') {
      this.setTableCellStyle('fontWeight', type);
    }
    if (type === 'Italic') {
      this.setTableCellStyle('fontType', type);
    }
  }
  // 批处理
  setTableCellStyle(styleKey, styleValue) {
    let { tableHeader, tableBody, tableFooter } = { ...this.state.tableSelect };
    if (tableHeader.length > 0) {
      this.setTextBoxStyle(tableHeader, 'tableHeader', styleKey, styleValue);
    } else if (tableBody.length > 0) {
      this.setTextBoxStyle(tableBody, 'tableBody', styleKey, styleValue);
    } else if (tableFooter.length > 0) {
      this.setTextBoxStyle(tableFooter, 'tableFooter', styleKey, styleValue);
    }
  }
  // 批处理
  setTextBoxStyle = (tableRegion, regionKey, styleKey, styleValue) => {
    let tableRow = this.state[regionKey];
    tableRegion.map((item, i) => {
      let rowID = item[0];
      let colID = item[2];
      tableRow[rowID][colID].textBox.fontInfo[styleKey] = styleValue;
    });
    this.props.dispatch(updateTable({ table: tableRow, areaName: this.props.areaName }));
  };

  //列宽拖拽事件
  columnLineMouseDown = (e) => {
    columnLine.drag = true;
    columnLine.positionX = e.pageX;
    columnLine.coordinateY = e.target.parentNode.getAttribute('data-index');
  };
  //行高拖拽事件
  rowLineMouseDown = (e) => {
    rowLine.drag = true;
    rowLine.positionY = e.pageY;
    rowLine.coordinateX = e.target.parentNode.getAttribute('data-index');
    rowLine.role = e.target.parentNode.getAttribute('data-role');
  };
  //是表格可以拖动
  tableBlockMouseDown = (e) => {
    tableBlock.drag = true;
    tableBlock.diffX = e.pageX - this.state.position.x;
    tableBlock.diffY = e.pageY - this.state.position.y;
  };
  //监控鼠标移动
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
      let tableData = [this.state.tableHeader, this.state.tableBody, this.state.tableFooter];
      let newPositionX = e.pageX;
      let distanceX = newPositionX - columnLine.positionX;
      let coordinateY = parseInt(columnLine.coordinateY, 10);
      for (let x = 0, y = tableData.length; x < y; x++) {
        for (let i = 0, j = tableData[x].length; i < j; i++) {
          let rowData = tableData[x][i];
          for (let m = 0, n = rowData.length; m < n; m++) {
            if (m === coordinateY) {
              let width = rowData[m].width + distanceX;
              rowData[m].width = (width <= defaultCellMinWidth) ? defaultCellMinWidth : width;
            }
          }
        }
      }
      columnLine.positionX = newPositionX;
      this.setState({ tableHeader: tableData[0], tableBody: tableData[1], tableFooter: tableData[2] })
    }

    if (rowLine.drag) {
      let newPositionY = e.pageY;
      let distanceY = newPositionY - rowLine.positionY;
      let coordinateX = parseInt(rowLine.coordinateX, 10);
      let role = rowLine.role;
      let tableArray = this.state[role];
      for (let i = 0, j = tableArray[coordinateX].length; i < j; i++) {
        let height = tableArray[coordinateX][i].height + distanceY;
        tableArray[coordinateX][i].height = (height <= defaultCellMinHeight) ? defaultCellMinHeight : height;
      }
      rowLine.positionY = newPositionY;
      this.setState({ role: tableArray });
    }

    if (columnSelect.drag) {
      let startRole = columnSelect.role;
      let tableSelect = this.state.tableSelect;
      let ele = e.target;
      while (ele && ele.tagName.toLowerCase() !== 'td') {
        ele = ele.parentElement;
      }
      if (!ele) {
        return;
      }
      let targetRole = dynamicTableUtil.getTableAreaName(ele.parentElement.parentElement.tagName);
      if (startRole === targetRole) {
        let start = columnSelect.start;
        let target = ele.getAttribute('data-index');
        target = { top: target.split(',')[0], left: target.split(',')[1] };
        let result = this.getColumnSelect(start, target, startRole);
        let selectArray = [];
        for (let i = result.top; i <= result.bottom; i++) {
          for (let j = result.left; j <= result.right; j++) {
            selectArray.push('' + i + ',' + j + '');
          }
        }
        tableSelect[startRole] = selectArray;
        this.setState({ tableSelect: tableSelect });
      }
    }
  };
  //移动表格完成事件
  tableMouseUp = (e) => {
    columnSelect.drag = false;
    const tableID = this.state.id;
    const newState = { table: { id: tableID }, areaName: this.props.areaName };
    let toUpdate = false;
    if (tableBlock.drag === true) {
      toUpdate = true;
      tableBlock.drag = false;
      newState.table.position = { ...this.state.position };
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
  getRole() {
    let role = 'tableBody';
    let tableList = this.state;
    for (let r of roleArray) {
      if (tableList[r].length > 0) {
        role = r;
        break;
      }
    }
    return role;
  }
  getColumnSelect = (start, target, role) => {
    let myRect = this.state[role];
    let RectLogic = {
      enumFindDirection: {
        left: 0
        , top: 1
        , right: 2
        , bottom: 3
      }
      , doneMap: [0, 0, 0, 0]
      , checkedMap: {}
      , rect: {
        left: 0
        , top: 0
        , right: 0
        , bottom: 0
      }
      , fitRect: function (start, end) {
        this.doneMap = [0, 0, 0, 0];
        this.rect.left = Math.min(start.left, end.left);
        this.rect.top = Math.min(start.top, end.top);
        this.rect.right = Math.max(start.left, end.left);
        this.rect.bottom = Math.max(start.top, end.top);
        this.refit();
        return this.rect;
      }
      , refit: function () {
        this.findSideline(this.enumFindDirection.top);
        this.findSideline(this.enumFindDirection.left);
        this.findSideline(this.enumFindDirection.right);
        this.findSideline(this.enumFindDirection.bottom);
        if (this.doneMap[0] + this.doneMap[1] + this.doneMap[2] + this.doneMap[3] < 4) {
          this.refit();
        }
      }
      , findSideline: function (direction) {
        let left, top, right, bottom;
        let needRefit = false;
        switch (direction) {
          case 0:
            left = right = this.rect.left;
            top = this.rect.top;
            bottom = this.rect.bottom;
            break;
          case 1:
            top = bottom = this.rect.top;
            left = this.rect.left;
            right = this.rect.right;
            break;
          case 2:
            left = right = this.rect.right;
            top = this.rect.top;
            bottom = this.rect.bottom;
            break;
          case 3:
            top = bottom = this.rect.bottom;
            left = this.rect.left;
            right = this.rect.right;
            break;
        }
        for (let topIndex = top; topIndex <= bottom; topIndex++) {
          for (let leftIndex = left; leftIndex <= right; leftIndex++) {
            let target = myRect[topIndex][leftIndex];
            let newLeft, newTop, newRight, newBottom;
            if (target.display !== 1) {
              let owner = this.findOwner(leftIndex, topIndex);
              if (comm.isCheckEmpty(owner.top) === '')
                owner.top = 0;
              target = myRect[owner.top][owner.left];
              newLeft = owner.left;
              newTop = owner.top;
              newRight = target.colspan + newLeft - 1;
              newBottom = target.rowspan + newTop - 1;
            }
            else {
              newLeft = leftIndex;
              newTop = topIndex;
              newRight = target.colspan + leftIndex - 1;
              newBottom = target.rowspan + topIndex - 1;
            }
            if (newLeft < this.rect.left) {
              needRefit = true;
              this.rect.left = newLeft;
              this.doneMap[this.enumFindDirection.left] = 0;
              this.doneMap[this.enumFindDirection.top] = 0;
              this.doneMap[this.enumFindDirection.bottom] = 0;
            }
            if (newTop < this.rect.top) {
              needRefit = true;
              this.rect.top = newTop;
              this.doneMap[this.enumFindDirection.left] = 0;
              this.doneMap[this.enumFindDirection.top] = 0;
              this.doneMap[this.enumFindDirection.right] = 0;
            }
            if (newRight > this.rect.right) {
              needRefit = true;
              this.rect.right = newRight;
              this.doneMap[this.enumFindDirection.right] = 0;
              this.doneMap[this.enumFindDirection.top] = 0;
              this.doneMap[this.enumFindDirection.bottom] = 0;
            }
            if (newBottom > this.rect.bottom) {
              needRefit = true;
              this.rect.bottom = newBottom;
              this.doneMap[this.enumFindDirection.left] = 0;
              this.doneMap[this.enumFindDirection.right] = 0;
              this.doneMap[this.enumFindDirection.bottom] = 0;
            }
            if (needRefit) {
              break;
            }
          }
          if (needRefit) {
            break;
          }
        }
        if (!needRefit) {
          this.doneMap[direction] = 1;
        }
      },
      findOwner: function (x, y) {
        let owner = null;
        let leftLimit = -1;
        let topLimit = -1;

        for (let topIndex = y; topIndex >= 0; topIndex--) {

          for (let leftIndex = x; leftIndex >= 0; leftIndex--) {
            if (leftLimit !== -1 && leftIndex < leftLimit) {
              break;
            }
            let target = myRect[topIndex][leftIndex];
            if (target.display === 1) {
              leftLimit = leftIndex + target.colspan - 1;
              topLimit = topIndex + target.rowspan - 1;
              if (leftLimit >= x && topLimit >= y) {
                owner = { top: topIndex, left: leftIndex };
              }
            }
          }
        }
        return owner;
      }
    };
    return RectLogic.fitRect(start, target);
  };
  // 生成group的单元格groupCell
  groupDataCells = (i) => {
    return {
      columnID: i,
      rowSpan: 1,
      columnSpan: 1,
      value: '',
      style: {},
    };
  }
  // 插入分组小计行
  insertSubtotals(position, group) {
    const groupField = group.substring(8);
    const columns = this.state.columns;
    const tableArray = this.state.tableBody;
    const columnLength = tableArray[0].length;
    let rowNow = tableArray.findIndex(item => !item.group);
    const index = tableArray.findIndex(row => row.group === group && row.position === position);
    if (index >= 0) {
      return;
    }
    if (position === 'tail') {
      rowNow += 1;
    }
    const rowNew = [];
    for (let i = 0; i < columnLength; i++) {
      rowNew.push(dynamicTableUtil.generateCell({ width: tableArray[0][i].width }));
    }
    rowNew.position = position;
    rowNew.group = group;

    for (let j = 0; j < columns.length; j++) {
      if (columns[j].type) {
        const { fieldName, type } = columns[j];
        if (fieldName && type === 'measure') {
          rowNew[j].textBox.value = `=sum(Fields.${fieldName})`;
          rowNew[j].textBox.horizontalAlignment = 'Right';
        } else if (fieldName === groupField) {
          rowNew[j].textBox.value = `=Fields.${fieldName} + "：小计"`;
          rowNew[j].textBox.horizontalAlignment = 'Left';
        }
      }
    }
    tableArray.splice(rowNow, 0, rowNew);
  }
  // 添加分组
  addGroup(groupInfo) {
    groupInfo.groupPosition.forEach((position) => {
      this.insertSubtotals(position, groupInfo.group);
    });
    if (this.state.groups.findIndex(g => g === groupInfo.group) === -1) {
      this.state.groups.push(groupInfo.group);
    }
    const table = { ...this.state };
    this.props.dispatch(updateTable({ table, areaName: this.props.areaName }));
  }

  // 修改分组
  editGroup = (groupInfo) => {
    const table = this.state;
    const tableBody = table.tableBody;
    const selectIndex = columnSelect.index;
    if (tableBody[selectIndex] && tableBody[selectIndex].group) {
      const oldGroup = tableBody[selectIndex].group;
      if (oldGroup !== groupInfo.group) {
        const oldIndex = table.groups.findIndex(g => g === oldGroup);
        table.groups.splice(oldIndex, 1);
        tableBody.forEach((row, i) => {
          if (row.group && row.group === oldGroup) {
            table.tableBody.splice(i, 1);
          }
        });
      }
    }
    groupInfo.groupPosition.forEach((position) => {
      this.insertSubtotals(position, groupInfo.group);
    });
    if (table.groups.findIndex(g => g === groupInfo.group) === -1) {
      table.groups.push(groupInfo.group);
    }
    this.props.dispatch(updateTable({ table, areaName: this.props.areaName }));
  }
  showModal = (command) => {
    let config = null;
    const that = this;
    switch (command.toLowerCase()) {
      case 'deletetable':
        config = {
          title: '删除',
          content: '确定要删除表格？',
          okText: '确认',
          cancelText: '取消',
          onOk() {
            that.tableControlAction.removeTable();
          },
        };
        break;
      case 'deleterow':
        config = {
          title: '删除',
          content: '确定要删除行？',
          okText: '确认',
          cancelText: '取消',
          onOk() {
            that.tableControlAction.removeRow(columnSelect, comm);
          },
        };
        break;
      case 'deletecolumn':
        config = {
          title: '删除',
          content: '确定要删除列？',
          okText: '确认',
          cancelText: '取消',
          onOk() {
            that.tableControlAction.removeColumn(columnSelect, comm);
          },
        };
        break;
    }
    if (config) {
      confirm(config);
    }
  };

  // 文本框内容变化实时更新
  onChangeTextBox = (value, tableArea, rowID, colID) => {
    const newValue = value;
    const tableID = this.state.id;
    const currentTextBox = this.state[tableArea][rowID][colID].textBox;
    currentTextBox.value = newValue;
    currentTextBox.valueNull = false;
    this.props.dispatch(updateTextBox(
      {
        areaName: this.props.areaName,
        textBox: currentTextBox,
        tableID,
        tableArea,
        rowID,
        colID,
      }));
  };
  onOkGroup = (data) => {
    const index = this.state.groups.findIndex(g => g === data.group);
    if (index >= 0) {
      this.editGroup(data);
    } else {
      this.addGroup(data);
    }
  }
  onCancel = () => {
    const groupModel = {
      visible: false,
    };
    this.setState({
      groupModel,
    });
  }
  onDrop = (event, tableArea, rowID, colID) => {
    event.preventDefault();
    let textGetData = event.dataTransfer.getData("text");
    textGetData = JSON.parse(textGetData);
    const type = textGetData.type
    const text = textGetData.text
    const fieldName = textGetData.fieldName
    const dataType = textGetData.dataType.split('(')[0];
    // const type = event.dataTransfer.getData('type');
    // const text = event.dataTransfer.getData('text');
    // const fieldName = event.dataTransfer.getData('fieldName');
    // const dataType = event.dataTransfer.getData('dataType').split('(')[0];

    if (!fieldName) {
      return;
    }
    const tableID = this.state.id;
    const areaName = this.props.areaName;
    const objTable = this.state;

    const currentTextBox = objTable[tableArea][rowID][colID].textBox;

    if (tableArea === 'tableFooter') {
      if (type === 'measure') { // 维度 左对齐  度量 右对齐
        currentTextBox.value = `=sum(Fields.${fieldName})`;
        currentTextBox.horizontalAlignment = 'Right';
      } else {
        currentTextBox.value = `=count(Fields.${fieldName})`;
        currentTextBox.horizontalAlignment = 'Left';
      }
      this.props.dispatch(updateTextBox(
        {
          areaName,
          textBox: currentTextBox,
          tableID,
          tableArea,
          rowID,
          colID,
        }));
    } else {
      this.fillHeadOrBodyCellOnDropField(fieldName, colID, dataType, text, type);
    }
  }

  // 自动生成文本框内容
  fillHeadOrBodyCellOnDropField(fieldName, colID, dataType, text, type) {
    const areaName = this.props.areaName;
    const tableID = this.state.id;
    const table = this.state;
    const tableHeaderRegion = table.tableHeader;
    const TableBodyRow = table.tableBody;
    const tableHeaderTextBox = tableHeaderRegion[tableHeaderRegion.length - 1][colID].textBox;
    tableHeaderTextBox.value = text;
    tableHeaderTextBox.dataType = 'string';

    for (let i = 0; i < TableBodyRow.length; i++) {
      let Formula = '';
      const columnText = TableBodyRow[i][colID];
      const group = TableBodyRow[i].group;
      if (group) {
        if (type === 'measure') { // 维度字段  小计行   度量字段 sum
          Formula = `=sum(Fields.${fieldName})`;
        } else if (group === `=Fields.${fieldName}`) {
          Formula = `=Fields.${fieldName} + "：小计"`;
        }
      } else {
        Formula = `=Fields.${fieldName}`;
      }
      if (type === 'measure') {
        columnText.textBox.horizontalAlignment = 'Right';
        tableHeaderTextBox.horizontalAlignment = 'Right';
      } else {
        columnText.textBox.horizontalAlignment = 'Left';
      }
      columnText.textBox.value = Formula;
      columnText.textBox.dataType = dataType === 'int' ? dataType : 'string';
      this.props.dispatch(updateTextBox(
        {
          areaName,
          textBox: columnText.textBox,
          tableID,
          tableArea: 'tableBody',
          rowID: i,
          colID,
        }));
    }

    this.props.dispatch(updateTextBox(
      {
        areaName,
        textBox: tableHeaderTextBox,
        tableID,
        tableArea: 'tableHeader',
        rowID: tableHeaderRegion.length - 1,
        colID,
      }));
    const column = table.columns[colID];
    column.fieldName = fieldName;
    column.comments = text;
    column.type = type;
  }

  handleTextBoxMouseDown = (e, rowID, colID) => {
    this.tableControlAction.cellMouseDown(columnSelect, rowID, colID, e);
  }
  // 选中单元格
  handleTextBoxActive = (e, rowID, colID) => {
    const tableID = this.state.id;
    let ele = e.target;
    while (ele.tagName.toLowerCase() !== 'td') {
      ele = ele.parentElement;
    }
    let tableArea = ele.parentElement.parentElement.tagName;
    const areaName = this.props.areaName;
    tableArea = dynamicTableUtil.getTableAreaName(tableArea);
    const tableArray = this.state[tableArea];
    const currentCell = tableArray[rowID][colID];
    const textBoxID = currentCell.textBox.id;
    if (comm.isCheckEmpty(areaName) === '' || comm.isCheckEmpty(tableArea) === '' || comm.isCheckEmpty(tableID) === '' || comm.isCheckEmpty(textBoxID) === '') {
      return;
    }
    const controlInfo = {
      tableID,
      tableArea,
      textBoxID,
      areaName,
      controlCategory: 'textBox',
      rowID,
      colID,
      type: 'table',
    };
    this.props.dispatch(selectedTextBox({ controlInfo }));
  };
  handleContextMenu = (e, data) => {
    e.preventDefault();
    switch (data.menuId) {
      case 'deleteTable':
        this.showModal('deleteTable');
        break;
      case 'insertRowUp':
        this.tableControlAction.addRow(1, columnSelect);
        break;
      case 'insertRowDown':
        this.tableControlAction.addRow(3, columnSelect);
        break;
      case 'insertTableHeader':
        this.tableControlAction.addTableHeaderOrTableFooterRow('tableHeader');
        break;
      case 'insertTableFooter':
        this.tableControlAction.addTableHeaderOrTableFooterRow('tableFooter');
        break;
      case 'insertGroup':
        this.tableControlAction.showGroupModal('add', columnSelect);
        break;
      case 'editGroup':
        this.tableControlAction.showGroupModal('edit', columnSelect);
        break;
      case 'deleteGroup':
        this.tableControlAction.removeGroup(columnSelect);
        break;
      case 'deleteRow':
        this.showModal('deleteRow');
        break;
      case 'insertColmunLeft':
        this.tableControlAction.addColumn(-1, columnSelect);
        break;
      case 'insertColmunRight':
        this.tableControlAction.addColumn(1, columnSelect);
        break;
      case 'deleteColumn':
        this.showModal('deleteColumn');
        break;
      case 'mergerCell':
        this.tableControlAction.mergerCell(columnSelect, roleArray);
        break;
      case 'splitCell':
        this.tableControlAction.splitCell(columnSelect, roleArray);
        break;
      default:
        break;
    }
  }
  // 取消表格选中状态
  onClick = () => {
    const table = this.tableDiv;
    table.style.borderColor = 'transparent';
  };
  // 生成td th
  makeGenerateTd = (rowIndex, tableArea) => {
    return (item, columnIndex) => {
      const size = this.tableControlAction.calcCellSize(tableArea, rowIndex, columnIndex);
      return (
        <TableCell
          key={item.textBox.id}
          tableArea={tableArea}
          tableIndex={this.props.index}
          isSelected={this.tableControlAction.cellSelect(rowIndex + ',' + columnIndex, tableArea)}
          width={size.width}
          height={size.height}
          rowID={rowIndex}
          columnID={columnIndex}
        >
          <TextBox
            onClick={this.handleTextBoxActive}
            onDrop={this.onDrop}
            onChange={this.onChangeTextBox}
            onMouseDown={this.handleTextBoxMouseDown}
            width={size.width}
            height={size.height}
            rowID={rowIndex}
            columnID={columnIndex}
            textBox={item.textBox}
            tableArea={tableArea}
          />
        </TableCell>
      );
    };
  }
  refTable = (table) => {
    this.tableDiv = table;
  }
  renderContextMenu = (menuId, menuItems) => {
    return (<ContextMenu id={menuId} hideOnLeave={false}>
      {
        menuItems.map((item) => {
          return (<MenuItem
            key={item.data.menuId}
            data={item.data}
            onClick={this.handleContextMenu}
          >{item.title}</MenuItem>);
        })
      }
    </ContextMenu>);
  }
  renderTableRowContextMenu = () => {
    const menuItems = [{
      title: '向上插入行',
      data: { menuId: 'insertRowUp' },
    }, {
      title: '向下插入行',
      data: { menuId: 'insertRowDown' },
    }, {
      title: '插入表头',
      data: { menuId: 'insertTableHeader' },
    }, {
      title: '插入表尾',
      data: { menuId: 'insertTableFooter' },
    }, {
      title: '插入分组',
      data: { menuId: 'insertGroup' },
    }, {
      title: '分组管理',
      data: { menuId: 'editGroup' },
    }, {
      title: '删除分组',
      data: { menuId: 'deleteGroup' },
    }, {
      title: '删除行',
      data: { menuId: 'deleteRow' },
    }];
    return this.renderContextMenu('table-rows', menuItems);
  }
  renderTableColumnContextMenu = () => {
    const menuItems = [{
      title: '向左插入列',
      data: { menuId: 'insertColmunLeft' },
    }, {
      title: '向右插入列',
      data: { menuId: 'insertColmunRight' },
    }, {
      title: '删除列',
      data: { menuId: 'deleteColumn' },
    }];
    return this.renderContextMenu('table-columns', menuItems);
  }
  renderTableCellContextMenu = () => {
    const menuItems = [{
      title: '合并单元格',
      data: { menuId: 'mergerCell' },
    }, {
      title: '拆分单元格',
      data: { menuId: 'splitCell' },
    }];
    return this.renderContextMenu('table-cells', menuItems);
  }
  render() {
    const that = this;
    if (!this.props.table) {
      return null;
    }
    const tableWidth = this.tableControlAction.tableWidth();
    let objAider = [];
    this.state.tableProperty = this.props.table.tableProperty;
    if (this.state.tableHeader.length > 0) {
      objAider = [...this.state.tableHeader[0]];
    } else if (this.state.tableBody.length > 0) {
      objAider = [...this.state.tableBody[0]];
    }
    const groupModal = this.state.groupModel.visible ?
      (<AddGroupModal
        visible={this.state.groupModel.visible}
        onOk={this.onOkGroup.bind(this)}
        dataSource={this.props.dataSource}
        data={this.state.groupModel.group}
        groups={this.state.groupModel.groups}
        onCancel={this.onCancel}
      />)
      : null;
    return (
      <div
        className="table-wrap"
        onMouseUp={this.tableMouseUp.bind(this)}
        onMouseMove={this.tableMouseMove.bind(this)}
      >
        <div
          ref={this.refTable}
          style={{ transform: `translate(${this.state.position.x}px,${this.state.position.y}px)`, width: tableWidth, border: '1px dashed  transparent' }}
          className="table-content"
        >
          <ContextMenuTrigger id="table-cells">
            <table
              onClick={this.onClick.bind(this)} id={this.state.id}
              className="table-box" cellPadding="0" cellSpacing="0"
            >
              <thead className="thead-box">
                {
                  this.state.tableHeader.map((tableHeader, rowIndex) => {
                    return (
                      <tr key={rowIndex} data-index={rowIndex}>
                        {
                          tableHeader.map(that.makeGenerateTd(rowIndex, 'tableHeader'))
                        }
                      </tr>
                    );
                  })
                }
              </thead>
              <tbody className="tbody-box">
                {
                  this.state.tableBody.map((tableBody, rowIndex) => {
                    return (
                      <tr key={rowIndex} data-index={rowIndex}>
                        {
                          tableBody.map(that.makeGenerateTd(rowIndex, 'tableBody'))
                        }
                      </tr>
                    );
                  })
                }
              </tbody>
              <tfoot className="tbody-box">
                {
                  this.state.tableFooter.map((tableFooter, rowIndex) => {
                    return (
                      <tr key={rowIndex} data-index={rowIndex}>
                        {
                          tableFooter.map(that.makeGenerateTd(rowIndex, 'tableFooter'))
                        }
                      </tr>
                    );
                  })
                }
              </tfoot>
            </table>
          </ContextMenuTrigger>
          <ContextMenuTrigger id="table-handle">
            <div
              className="table-block"
              onMouseDown={this.tableBlockMouseDown}
              onClick={this.tableControlAction.handleClickDiv.bind(this, comm)}
            /></ContextMenuTrigger>
          <ContextMenuTrigger
            id="table-columns"
            attributes={{
              onClick: this.onClick,
              className: 'column-block',
            }}
          >
            {
              objAider.map((item, index) => {
                return (
                  <p className="row-margin" key={index} data-index={index} onClick={this.tableControlAction.cellSelectByColumns.bind(this, index, columnSelect, comm)} style={{ width: item.width + 'px', cursor: 'pointer' }}><span onMouseDown={this.columnLineMouseDown.bind(this)} className="column-line"></span></p>
                );
              })
            }
          </ContextMenuTrigger>
          <ContextMenuTrigger
            id="table-rows"
            attributes={{
              onClick: this.onClick,
              className: 'row-block',
            }}
          >
            {
              this.state.tableHeader.map((item, index) => {
                return (
                  <p className="row-margin" key={index} data-index={index} onClick={this.tableControlAction.cellSelectByRows.bind(this, index, 'tableHeader', columnSelect, comm)} data-role="tableHeader" style={{ height: item[0].height + 'px', lineHeight: item[0].height + 'px', cursor: 'pointer' }}> <i className="icon iconfont icon-header" /><span onMouseDown={this.rowLineMouseDown.bind(this)} className="row-line"></span></p>
                );
              })
            }
            {
              this.state.tableBody.map((item, index) => {
                if (item.group == null) {
                  return (
                    <p className="row-margin" key={item.group + '_' + index} data-index={index} onClick={this.tableControlAction.cellSelectByRows.bind(this, index, 'tableBody', columnSelect, comm)} data-role="tableBody" style={{ height: item[0].height + 'px', lineHeight: item[0].height + 'px', cursor: 'pointer' }}><Icon type="bars" /><span onMouseDown={this.rowLineMouseDown.bind(this)} className="row-line"></span></p>
                  );
                } else {
                  return (
                    <p className="row-margin" key={index} data-index={index} onClick={this.tableControlAction.cellSelectByRows.bind(this, index, 'tableBody', columnSelect, comm)} data-role="tableBody" style={{ height: item[0].height + 'px', lineHeight: item[0].height + 'px', cursor: 'pointer' }}><i className="icon iconfont icon-group" /><span onMouseDown={this.rowLineMouseDown.bind(this)} className="row-line"></span></p>
                  );
                }
              })
            }
            {
              this.state.tableFooter.map((item, index) => {
                return (
                  <p className="row-margin" key={index} data-index={index} onClick={this.tableControlAction.cellSelectByRows.bind(this, index, 'tableFooter', columnSelect, comm)} data-role="tableFooter" style={{ height: item[0].height + 'px', lineHeight: item[0].height + 'px', cursor: 'pointer' }}> <i className="icon iconfont icon-endoftable" /><span onMouseDown={this.rowLineMouseDown.bind(this)} className="row-line"></span></p>
                );
              })
            }
          </ContextMenuTrigger>
        </div>
        {groupModal}
        <ContextMenu id="table-handle" hideOnLeave={false}>
          <MenuItem
            data={{ menuId: 'deleteTable' }}
            onClick={this.handleContextMenu}
          >删除表格</MenuItem>
        </ContextMenu>
        {
          this.renderTableRowContextMenu()
        }
        {
          this.renderTableColumnContextMenu()
        }
        {
          this.renderTableCellContextMenu()
        }
      </div>
    );
  }
}
const mapStateToProps = (state, ownProps) => {
  return ({
    table: state.DynamicTableReducer.Body.tables[ownProps.index],
    dataSource: state.chartDataSource.datasource,
    theme: state.global.theme,
  });
};
const tableControl = Form.create()(TableControl);
export default connect(mapStateToProps)(tableControl);
