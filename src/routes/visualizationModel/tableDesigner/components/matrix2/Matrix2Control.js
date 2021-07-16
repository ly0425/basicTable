import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Form, Modal, Icon } from '@vadp/ui';
import produce from 'immer';
import { ContextMenuTrigger } from 'react-contextmenu';
import Message from 'public/Message';
import { shortcutToolbarSignal } from 'public/ShortcutToolbar/signal';
import EditGrid from '@/components/EditGrid';
import TextBox from '../../../components/TextBox';
// import { createMatrix2Table } from '../../../../../model/ReportModel/Matrix2Table';
import { createMatrix2Table } from '@/model/ReportModel/Matrix2Table';
import Matri2xUtil from './matrix2Utils';
import ColumnHeader from '../../../components/ColumnHeader';
import RowHeader from '../../../components/RowHeader';
import GroupInfoModalMatrix2 from './GroupInfoModalMatrix2';
import GroupListModal2 from './GroupListModal2';
import {
  TableControlContextMenu,
  TableCellContextMenu,
  RowHeaderContextMenu,
  ColumnHeaderContextMenu,
} from './Matrix2TableContextMenu';
import {
  updateTable,
  removeTable,
  selectedTextBox,
} from '../../DynamicTableActions';
import Matrix2AddGroupModal from './Matrix2AddGroupModal';


let isResizing = false;
const confirm = Modal.confirm;
const defaultTextBox = Matri2xUtil.generateTextBox();
const TextBoxControl = connect(state => ({ theme: state.global.theme }))(TextBox);
function collect(props) {
  return props;
}
const tableBlock = { drag: false };
class Matrix2Control extends Component {
  constructor(props) {
    super(props);
    this.textBoxPropertySignal = shortcutToolbarSignal.getByControlID('textBoxPropByTable');
    this.tableThProperty = shortcutToolbarSignal.getByControlID('tableThProperty');
    this.tableTrProperty = shortcutToolbarSignal.getByControlID('tableTrProperty');
    this.state = {
      addGroupState: {
        visible: false,
      },
      editGroupState: {
        visible: false,
      },
      selectGroupState: {
        visible: false,
      },
      groupInfoState: {
        visible: false,
      },
      modifyColumnNameState: {
        visible: false,
      },
      groupListState: {
        visible: false,
      },
    };
    const table = this.props.table;
    this.model = createMatrix2Table(table);
    this.borderClassName = 'table-content-active';
    Object.getOwnPropertyNames(this.model).forEach((name) => {
      const prop = this.model[name];
      if (typeof prop === 'function') {
        this.bind(prop, 'actions', name);
      }
    });
  }
  componentDidMount() {
    this.textBoxPropertySignal.action.add(this.replaceTextBox);
    this.tableThProperty.action.add(this.replaceTableTh);
    this.tableTrProperty.action.add(this.replaceTableTr);
    this.activeTable();
  }
  componentWillUnmount() {
    this.textBoxPropertySignal.action.remove(this.replaceTextBox);
    this.tableThProperty.action.remove(this.replaceTableTh);
    this.tableTrProperty.action.remove(this.replaceTableTr);
  }
  bind = (producer, category, name) => {
    if (!this[category]) {
      this[category] = {};
    }
    this[category][name] = (...args) => {
      // produce
      let model;
      try {
        model = produce(this.model, (draft) => {
          producer.apply(draft, args);
        });
      } catch (ex) {
        Message.warning(ex.message);
        return;
      }
      // update
      this.model = model;
      this.expectUpdate();
    };
  }
  getTableToDispatch() {
    // model 转成 store 中的格式
    const table = {
      tableRows: this.model.tableRows,
      widths: this.model.widths,
      heights: this.model.heights,
      rowGroups: this.model.rowGroups,
      columnGroups: this.model.columnGroups,
      cornerSize: this.model.cornerSize,
      columns: this.model.columns,
      colsId: this.model.colsId,
      rowsId: this.model.rowsId,
    };
    return { ...this.props.table, ...table };
  }
  expectUpdate() {
    // TODO 保存时再同步到 redux store
    const table = this.getTableToDispatch();
    this.props.dispatch(updateTable({
      table, areaName: this.props.areaName,
    }));
  }
  replaceTableTh = ({ columnSubscript, thData } = {}) => {
    this.actions.replaceTableTh(columnSubscript, thData);
  }
  replaceTableTr = ({ rowSubscript, trData } = {}) => {
    this.actions.replaceTableTr(rowSubscript, trData);
  }
  replaceTextBox = ({ rowID, colID, textBox } = {}) => {
    this.actions.replaceTextBox(rowID, colID, textBox);
  }
  activeTable() {
    const table = this.tableDiv;
    this.borderClassName = 'table-content-active';
    const tableID = this.props.table.id;
    const controlInfo = {
      tableID,
      areaName: 'Body',
      controlCategory: 'table',
      tableType: 'matrix2',
    };
    this.actions.clearSelection();
    this.props.dispatch(selectedTextBox({ controlInfo }));
  }
  activeTextBox = (row, col) => {
    const controlInfo = {
      tableID: this.props.table.id,
      areaName: 'Body',
      controlCategory: 'textBoxByTable',
      rowID: row,
      colID: col,
      tableType: 'matrix2',
    };
    this.props.dispatch(selectedTextBox({ controlInfo }));
  }
  tableMouseMove = (e) => {
    if (e.target.nodeName === 'INPUT') {
      return;
    }
    e.preventDefault();
    if (tableBlock.drag === true) {
      const tablePositionX = e.pageX - tableBlock.diffX < 0 ? 0 : e.pageX - tableBlock.diffX;
      const tablePositionY = e.pageY - tableBlock.diffY < 0 ? 0 : e.pageY - tableBlock.diffY;
      const tableID = this.props.table.id;
      const newState = { table: { id: tableID }, areaName: this.props.areaName };
      newState.table.position = { x: tablePositionX, y: tablePositionY };
      this.props.dispatch(updateTable(newState));
    }
  }

  mergeCell = () => {
    this.actions.mergeCell();
  };

  splitCell = (type) => {
    if (type === 'row' || type === 'col') {
      this.actions.groupSplitCell(type);
      return;
    }
    this.actions.splitCell();
  };

  deleteSelectedCell = () => {
    if (this.model.selectedRanges) {
      this.actions.emptyCell();
      this.setState({ visible: false });
    }
  }
  refTable = (table) => {
    this.tableDiv = table;
  }
  handleMouseSelectStart = (row, col, e) => {
    this.actions.selectCell(row, col, e.ctrlKey);
    const table = this.tableDiv;
    this.borderClassName = '';
    this.activeTextBox(row, col);
  }
  handleMouseSelectChange = (start, target) => this.actions.selectRect(start, target);
  handleMouseSelectEnd = () => {
    // 框选结束后刷格式
    if (this.model.mark && this.model.mark.type === 'brush') {
      this.actions.pasteStyle();
    }
  }
  selectCell = (cellInfo, direct, edit) => {
    const { rowID, colID } = cellInfo;
    let newRow = rowID;
    let newCol = colID;
    const tableArray = this.model.tableRows;
    const colCount = tableArray[0].length;
    let isFocus = true;
    while (isFocus) {
      if (direct === 0) {
        if (newCol > 0) {
          newCol -= 1;
        } else if (newRow === 0) {
          isFocus = false;
        } else {
          newRow -= 1;
          newCol = colCount - 1;
        }
      } else if (direct === 1) {
        if (newRow === 0) {
          isFocus = false;
        } else {
          newRow -= 1;
        }
      } else if (direct === 2) {
        if (newCol < colCount - 1) {
          newCol += 1;
        } else if (newRow < tableArray.length - 1) {
          newRow += 1;
          newCol = 0;
        } else {
          isFocus = false;
        }
      } else if (direct === 3) {
        if (newRow === tableArray.length - 1) {
          isFocus = false;
        } else {
          newRow += 1;
        }
      }
      if (tableArray[newRow][newCol].display === 1) {
        break;
      }
    }
    if (isFocus === false) {
      this.tableDiv.focus();
      return;
    }
    this.actions.selectCell(newRow, newCol);
    // let newCell = tableArray[newRow][newCol];
    // newCell.textBox.beginEdit();
  }
  onKeyDown = (ev) => {
    const key = ev.key.toLowerCase();
    const keyCode = ev.keyCode || ev.which;
    if (ev.target.nodeName !== 'INPUT') {
      if (keyCode === 9 || keyCode === 13 || (keyCode >= 37 && keyCode <= 40)) {
        let direct;
        if (keyCode === 9) {
          ev.preventDefault();
          direct = ev.shiftKey === true ? 0 : 2;
        } else if (keyCode === 13) {
          ev.preventDefault();
          direct = 3;
        } else if (keyCode === 37 || keyCode === 38 || keyCode === 39 || keyCode === 40) {
          direct = keyCode - 37;
        }
        const selection = this.model.getCurrentSelection();
        if (selection) {
          const cellInfo = { rowID: selection.top, colID: selection.left };
          this.selectCell(cellInfo, direct, false);
        }
      } else if (keyCode === 8 || keyCode === 46) {
        this.confirmDelete('cell');
      } else if (keyCode === 27) {
        this.actions.clearMark();
      } else if (ev.ctrlKey === true) {
        if (keyCode === 88) {
          this.cutSelectedCell();
        } else if (keyCode === 67) {
          this.copySelectedCell();
        } else if (keyCode === 86) {
          this.pasteSelectedCell();
        } else if (key === 'z') {
          this.undo();
        } else if (key === 'y') {
          this.redo();
        }
      }
    } else if (ev.target.nodeName === 'INPUT') {
      const indexData = ev.target.parentElement.parentElement.getAttribute('data-index');
      const p = dynamicUtil.parsePoint(indexData);
      if (keyCode === 9 || keyCode === 13) {
        ev.preventDefault();
        const value = ev.target.value;
        this.actions.commitEdit(p.row, p.col, value);

        let direct = 3;
        if (keyCode === 9) {
          direct = ev.shiftKey ? 0 : 2;
        }
        const cellInfo = { rowID: p.row, colID: p.col };
        this.selectCell(cellInfo, direct, true);
      } else if (keyCode === 27) {
        // Esc
        this.actions.cancelEdit(p.row, p.col);

        const that = this;
        setTimeout(() => {
          that.tableDiv.focus();
        }, 0);
      }
    }
  }
  onKeyPress = (ev) => {
    if (ev.target.nodeName !== 'INPUT') {
      const selection = this.model.getCurrentSelection();
      if (selection) {
        this.actions.beginEdit(selection.top, selection.left);
      }
    }
  }
  cutSelectedCell = () => {
    this.actions.cut();
  }
  copySelectedCell = () => {
    this.actions.copy();
  }
  pasteSelectedCell = () => {
    this.actions.paste();
  }
  renderCellContent = ({ rowIndex, columnIndex, cell, width, height, editingCell }) => {
    return (
      <TextBoxControl
        theme={this.props.theme}
        textBox={cell.textBox}
        defaultTextBox={defaultTextBox}
        default={{}}
        {...{ rowIndex, columnIndex, width, height }}
        onDrop={this.handleTextBoxDrop}
        onBeginEdit={this.handleBeginEdit}
        onCommitEdit={this.handleCommitEdit}
        isEditing={editingCell && editingCell.row === rowIndex && editingCell.col === columnIndex}
      />
    );
  };
  renderGridCustom = (calcWidth, calcHeight) => {
    const cornerSize = this.model.cornerSize;
    const tableRows = this.model.tableRows;
    const left = calcWidth(0, cornerSize.columns);
    const top = calcHeight(0, cornerSize.rows);
    const rowGroups = this.model.rowGroups;
    const columnGroups = this.model.columnGroups;
    const heights = this.model.heights;
    const widths = this.model.widths;
    const row = this.getRowOrColGroups(rowGroups, calcWidth, calcHeight, 'row');
    const col = this.getRowOrColGroups(columnGroups, calcWidth, calcHeight, 'col');
    const rowLength = tableRows.length - cornerSize.rows;
    const colLength = tableRows[0].length - cornerSize.columns;
    const isRowPlaceHolder = cornerSize.columns === 1 && rowLength === 1 && !tableRows[cornerSize.rows][0].textBox.value;
    const isColPlaceHolder = cornerSize.rows === 1 && colLength === 1 && !tableRows[0][cornerSize.columns].textBox.value;
    const isData = rowLength === 1 && colLength === 1 && !tableRows[cornerSize.rows][cornerSize.columns].textBox.value;

    return (<div style={{ pointerEvents: 'none' }}>
      {
        cornerSize.rows > 0 && (<div
          style={{
            position: 'absolute',
            top: top - 2,
            width: '100%',
            height: '3px',
            pointerEvents: 'none',
            border: 'dashed 1px #9c9c9c',
          }}
        />)
      }
      {
        cornerSize.columns > 0 && (<div
          style={{
            position: 'absolute',
            left: left - 2,
            width: '3px',
            height: '100%',
            pointerEvents: 'none',
            border: 'dashed 1px #9c9c9c',
          }}
        />)
      }
      {
        row.map((item) => {
          return item;
        })
      }
      {
        col.map((item) => {
          return item;
        })
      }
      {
        isRowPlaceHolder && (<div
          style={{
            position: 'absolute',
            bottom: 0,
            width: widths[0],
            height: heights[cornerSize.rows],
            lineHeight: `${heights[cornerSize.rows]}px`,
            pointerEvents: 'none',
            color: '#ccc',
            textAlign: 'center',
          }}
        >行</div>)
      }
      {
        isColPlaceHolder && (<div
          style={{
            position: 'absolute',
            right: 0,
            width: widths[cornerSize.columns],
            height: heights[0],
            lineHeight: `${heights[0]}px`,
            pointerEvents: 'none',
            color: '#ccc',
            textAlign: 'center',
          }}
        >列</div>)
      }
      {
        isData && (<div
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: widths[cornerSize.columns],
            height: heights[cornerSize.rows],
            lineHeight: `${heights[cornerSize.rows]}px`,
            pointerEvents: 'none',
            color: '#ccc',
            textAlign: 'center',
          }}
        >数据</div>)
      }
    </div>);
  }
  getRowOrColGroups = (group, calcWidth, calcHeight, type) => {
    const groupHtmlList = [];
    const cornerSize = this.model.cornerSize;
    const selection = this.model.getCurrentSelection() || {};
    const selectGroup = this.model.getGroupRelatedInfo(type, true);
    group.forEach((value, key, map) => {
      value.forEach((v, k, m) => {
        const group = v[0] || {};
        const span = group.span;
        let left;
        let top;
        let height;
        let width;
        let color = '#9c9c9c';
        let rowstart;
        let colstart;

        const style = {
          pointerEvents: 'none',
          position: 'absolute',
        };

        const groupHtml = null;
        if (type === 'row') {
          rowstart = this.model.getGroupStart('row', k);
          colstart = this.model.getGroupStart('col', key);
          left = calcWidth(0, colstart);
          top = calcHeight(0, rowstart);
          height = calcHeight(0, rowstart + span) - top;
          width = '5px';
          if (colstart === selectGroup.groupLeft && rowstart === selectGroup.selectedGroupStart && span === selectGroup.currentSelectedGroup[0].span) {
            color = '#ffba1f';
          }
          style.borderLeft = `solid 3px ${color}`;
          style.borderTop = `solid 3px ${color}`;
          style.borderBottom = `solid 3px ${color}`;
        } else if (type === 'col') {
          colstart = this.model.getGroupStart('col', k);
          rowstart = this.model.getGroupStart('row', key);
          left = calcWidth(0, colstart);
          top = calcHeight(0, rowstart);
          height = '4px';
          width = calcWidth(0, colstart + span) - left;
          if (rowstart === selectGroup.groupLeft && colstart === selectGroup.selectedGroupStart && span === selectGroup.currentSelectedGroup[0].span) {
            color = '#ffba1f';
          }
          style.borderLeft = `solid 3px ${color}`;
          style.borderTop = `solid 3px ${color}`;
          style.borderRight = `solid 3px ${color}`;
        }
        style.left = left;
        style.top = top;
        style.height = height;
        style.width = width;
        groupHtmlList.push((<div
          style={style}
        >{groupHtml}</div>));
      });
    });
    return groupHtmlList;
  }
  handleTextBoxDrop = (cell, ev) => {
    ev.preventDefault();
    let textGetData = ev.dataTransfer.getData('text');
    textGetData = JSON.parse(textGetData);
    const type = textGetData.type;
    const text = textGetData.text;
    const fieldName = textGetData.fieldName;
    const dataType = textGetData.dataType.split('(')[0];
    if (!fieldName) {
      return;
    }
    const field = { type, fieldName, text, dataType };
    this.actions.dropField(cell, field);
  }
  handleCommitEdit = ({ rowIndex, columnIndex }, value) => {
    this.actions.commitEdit(rowIndex, columnIndex, value);
  }
  handleBeginEdit = ({ rowIndex, columnIndex }) => {
    this.actions.beginEdit(rowIndex, columnIndex);
  }
  tableBlockMouseDown = (e) => {
    if (e.button !== 0) {
      return;
    }
    tableBlock.drag = true;
    tableBlock.diffX = e.pageX - this.props.table.position.x;
    tableBlock.diffY = e.pageY - this.props.table.position.y;
    this.activeTable();
  }
  tableMouseUp = () => {
    tableBlock.drag = false;
  }
  handleSelectColumn = (index, isAppend) => {
    this.actions.selectColumn(index, isAppend);
    const table = this.tableDiv;
    // table.style.borderColor = 'transparent';
    this.borderClassName = '';
    const controlInfo = {
      tableID: this.props.table.id,
      areaName: 'Body',
      controlCategory: 'TableTh',
      columnSubscript: index,
      tableType: 'matrix2',
    };
    this.props.dispatch(selectedTextBox({ controlInfo }));
  }
  handleSelectColumnRange = (start, target) => {
    this.actions.selectColumnRange(start, target);
    const table = this.tableDiv;
    this.borderClassName = '';
  }
  handleColumnResizing = (...args) => {
    isResizing = true;
    this.actions.columnResizing(...args);
  };
  handleColumnResized = () => {
    isResizing = false;
    this.actions.columnResized();
  };
  handleSelectRow = (index, isAppend) => {
    this.actions.selectRow(index, isAppend);
    const table = this.tableDiv;
    this.borderClassName = '';
    const controlInfo = {
      tableID: this.props.table.id,
      areaName: 'Body',
      controlCategory: 'TableTr',
      rowSubscript: index,
      tableType: 'matrix2',
    };
    this.props.dispatch(selectedTextBox({ controlInfo }));
  }
  handleSelectRowRange = (start, target) => {
    this.actions.selectRowRange(start, target);
    const table = this.tableDiv;
    this.borderClassName = '';
  }
  handleRowResizing = (...args) => {
    isResizing = true;
    this.actions.rowResizing(...args);
  };
  handleRowResized = () => {
    isResizing = false;
    this.actions.rowResized();
  };
  confirmDelete = (command, data) => {
    let config = null;
    const that = this;
    switch (command.toLowerCase()) {
      case 'table':
        config = {
          title: '删除',
          content: '确定要删除表格？',
          okText: '确认',
          cancelText: '取消',
          onOk() {
            that.handleRemoveTable();
          },
        };
        break;
      case 'cell': that.deleteSelectedCell();
        break;
      case 'group':
        config = {
          title: '删除',
          content: `确定要删除${data.currentSelectedGroup[0].name}分组？`,
          okText: '确认',
          cancelText: '取消',
          onOk() {
            that.actions.deleteGroup(data, 0);
          },
        };
        break;
      default:
        break;
    }
    if (config) {
      confirm(config);
    }
  }
  handleRemoveTable = () => {
    const tableID = this.props.table.id;
    this.props.dispatch(removeTable({ tableID, areaName: this.props.areaName }));
  }
  showAddGroupDialog = (groupType, positionType) => {
    let childBool = false;
    if (positionType === 'child') {
      const groups = this.getSelectRowAndColGroup();
      console.log(groups)
      const { type, group, colActualKey, rowActualKey, selectedGroupStart, currentSelectedGroup } = groups;
      const col = this.model.getGroupStart('col', colActualKey),
        row = this.model.getGroupStart('row', rowActualKey),
        isRow = type === 'row',
        location = isRow ? col : row,
        currentGroup = isRow ? this.model.rowGroups : this.model.columnGroups;
      if (group) {
        const keyList = isRow ? this.model.colsId : this.model.rowsId;
        keyList.forEach((v, i) => {
          if (i > location && currentGroup.get(v)) {
            currentGroup.get(v).forEach((val, key) => {
              const start = isRow ? this.model.getGroupStart('row', key) : this.model.getGroupStart('col', key);
              const end = start + val[0].span;
              if (start >= selectedGroupStart && end <= (selectedGroupStart + currentSelectedGroup[0].span)) {
                childBool = true;
              }
            })
          }
        })
      }
    }
    const addGroupState = {
      visible: true,
      groupType,
      canRow: positionType === 'parent' || childBool,
      addParent: positionType,
    };
    this.setState({ addGroupState });
  }
  handleAddGroup = (group) => {
    this.handleHideAddGroupDialog();
    const type = this.state.addGroupState.groupType; // row column
    const isParent = this.state.addGroupState.addParent;
    this.actions.modalAddGroup(isParent, type, group);
  }
  handleHideAddGroupDialog = () => {
    const addGroupState = { visible: false };
    this.setState({ addGroupState });
  }
  getSelectRowAndColGroup = (type) => {
    const selection = this.model.getCurrentSelection();
    const cornerSize = this.model.cornerSize;
    if (!type) {
      if (selection.left <= cornerSize.columns && selection.top >= cornerSize.rows) {
        type = 'row';
      } else if (selection.left >= cornerSize.columns && selection.top <= cornerSize.rows) {
        type = 'col';
      }
    }
    const obj = this.model.getGroupRelatedInfo(type, true)
    return { ...obj, type };
  }
  groupInfo = (type) => {
    const groupRelatedInfo = this.getSelectRowAndColGroup(type);
    if (groupRelatedInfo.currentSelectedGroup.length === 1) {
      const groupInfoState = {
        visible: true,
        group: groupRelatedInfo.currentSelectedGroup[0],
        selectedGroupStart: groupRelatedInfo.selectedGroupStart,
        groupLeft: groupRelatedInfo.groupLeft,
        type: groupRelatedInfo.type,
        index: 0
      }
      this.setState({ groupInfoState });
      return;
    }
    const groupListState = {
      visible: true,
      groupRelatedInfo,
      type: groupRelatedInfo.type,
      onOk: this.groupInfoMoadl,
    };
    this.setState({ groupListState });
  }
  groupInfoMoadl = (group, index) => {
    this.handleHideGroupListDialog();
    const groupInfoState = {
      visible: true,
      group,
      type: this.state.groupListState.type,
      selectedGroupStart: this.state.groupListState.groupRelatedInfo.selectedGroupStart,
      groupLeft: this.state.groupListState.groupRelatedInfo.groupLeft,
      index,
    };
    this.setState({ groupInfoState });
  }
  handleHideGroupListDialog = () => {
    this.setState({
      groupListState: {
        visible: false,
      },
    });
  }
  handleEditGroup = (groupInfo) => {
    this.handleHideGroupInfoDialog();
    this.actions.editGroup({ ...groupInfo, type: this.state.groupInfoState.type, index: this.state.groupInfoState.index });
  }
  handleHideGroupInfoDialog = () => {
    const groupInfoState = { visible: false };
    this.setState({ groupInfoState });
  }

  removeRows = () => {
    const selection = this.model.getCurrentSelection();
    const { cornerSize, heights } = this.model;

    if (selection.type === 'row') {
      if (selection.top <= cornerSize.rows && selection.bottom === heights.length - 1) {
        Message.info('不能没有数据区域');
        return;
      }
    } else {
      return;
    }
    this.actions.removeRows();
  }
  removeColumns = () => {
    const selection = this.model.getCurrentSelection();
    const { cornerSize, widths } = this.model;

    if (selection.type === 'col') {
      if (selection.left <= cornerSize.columns && selection.right === widths.length - 1) {
        Message.info('不能没有数据区域');
        return;
      }
    } else {
      return;
    }
    this.actions.removeColumns();
  }
  deleteGroups = (type) => {
    const groupRelatedInfo = this.getSelectRowAndColGroup(type);
    if (groupRelatedInfo.currentSelectedGroup.length === 1) {
      this.confirmDelete('group', groupRelatedInfo);
      return;
    }
    const groupListState = {
      visible: true,
      groupRelatedInfo,
      type: groupRelatedInfo.type,
      onOk: (group, index) => {
        this.setState({ groupListState: { visible: false } });
        this.actions.deleteGroup(this.state.groupListState.groupRelatedInfo, index, () => {
          Message.info('删除成功');
        })
      },
    }
    this.setState({ groupListState });
  }
  addTotal = (type) => {
    this.actions.addTotal(type);
  }
  handleContextMenu = (e, data) => {
    console.log(data);
    e.preventDefault();
    switch (data.menuId) {
      case 'mergerCell':
        this.mergeCell();
        break;
      case 'splitCell':
        this.splitCell(data.type);
        break;
      case 'clearCell':
        this.confirmDelete('cell');
        break;
      case 'deleteTable':
        this.confirmDelete('table');
        break;
      case 'insertParentRowGroup':
        this.showAddGroupDialog('row', 'parent');
        break;
      case 'insertChildRowGroup':
        this.showAddGroupDialog('row', 'child');
        break;
      case 'insertParentColGroup':
        this.showAddGroupDialog('col', 'parent');
        break;
      case 'insertChildColGroup':
        this.showAddGroupDialog('col', 'child');
        break;
      case 'insertTopAdjacentGroup':
        this.showAddGroupDialog('row', 'topAdjacent');
        break;
      case 'insertBottomAdjacentGroup':
        this.showAddGroupDialog('row', 'bottomAdjacent');
        break;
      case 'insertLeftAdjacentGroup':
        this.showAddGroupDialog('col', 'leftAdjacent');
        break;
      case 'insertRightAdjacentGroup':
        this.showAddGroupDialog('col', 'rightAdjacent');
        break;
      case 'insertRowUp':
        this.actions.insertRows('up');
        break;
      case 'insertRowDown':
        this.actions.insertRows('down');
        break;
      case 'deleteRow':
        this.removeRows();
        break;
      case 'insertColmunLeft':
        this.actions.insertColumns('left');
        break;
      case 'insertColmunRight':
        this.actions.insertColumns('right');
        break;
      case 'deleteColumn':
        this.removeColumns();
        break;
      case 'groupInfo':
        this.groupInfo(data.type);
        break;
      case 'deleteGroup':
        this.deleteGroups(data.type);
        break;
      case 'addTotal':
        this.addTotal(data.type);
        break;
      default:
        break;
    }
  }
  render() {
    const table = this.props.table;
    const width = table.widths.reduce((sum, item) => {
      return item + sum;
    }, 0);
    const height = table.heights.reduce((sum, item) => {
      return item + sum;
    }, 0) + 33;
    console.log(table);
    return (
      <div
        className="table-wrap"
        onMouseMove={this.tableMouseMove}
      >
        <div className="spreadsheet-design" style={{ height: '100%', maxHeight: '100%', top: '0px', left: '0px', width: '100%', maxWidth: '100%' }}>
          <div
            ref={this.refTable}
            style={{ left: `${this.props.table.position.x}px`, top: `${this.props.table.position.y}px`, width: `${width + 33}px`, height: `${height}px` }}
            className={'table-content' + ' ' + this.borderClassName}
          >
            <ContextMenuTrigger
              id={'table-cells'}
              onItemClick={this.handleContextMenu}
              holdToDisplay={-1}
              selection={this.model.getCurrentSelection()}
              cornerSize={this.model.cornerSize}
              tableRows={this.model.tableRows}
              collect={collect}
              rowGroups={this.model.rowGroups}
              columnGroups={this.model.columnGroups}
              rowsId={this.model.rowsId}
              colsId={this.model.colsId}
              getGroupRelatedInfo={this.model.getGroupRelatedInfo.bind(this.model)}
              getGroupStart={this.model.getGroupStart.bind(this.model)}
            >
              <EditGrid
                tableRows={table.tableRows}
                widths={table.widths}
                editingCell={this.model.editingCell}
                heights={table.heights}
                selectedRanges={this.model.selectedRanges}
                mark={table.mark}
                onMouseSelectStart={this.handleMouseSelectStart}
                onMouseSelectChange={this.handleMouseSelectChange}
                onMouseSelectEnd={this.handleMouseSelectEnd}
                onKeyDown={this.onKeyDown}
                onKeyPress={this.onKeyPress}
                renderCellContent={this.renderCellContent}
                animateSelection={isResizing}
                renderCustom={this.renderGridCustom}
              />
            </ContextMenuTrigger>

            <ContextMenuTrigger
              id={'table-handle'}
              onItemClick={this.handleContextMenu}
              holdToDisplay={-1}
              collect={collect}
            >
              <div
                id="table-handle"
                className="table-block"
                onMouseDown={this.tableBlockMouseDown}
                onMouseUp={this.tableMouseUp}
              />
            </ContextMenuTrigger>

            <ContextMenuTrigger
              id="table-columns"
              holdToDisplay={-1}
              onItemClick={this.handleContextMenu}
              selection={this.model.getCurrentSelection()}
              collect={collect}
            >
              <ColumnHeader
                widths={table.widths}
                selectedRanges={this.model.selectedRanges}
                selectColumn={this.handleSelectColumn}
                selectColumnRange={this.handleSelectColumnRange}
                onColumnResizing={this.handleColumnResizing}
                onColumnResized={this.handleColumnResized}
              />
            </ContextMenuTrigger>

            <ContextMenuTrigger
              id="table-rows"
              holdToDisplay={-1}
              onItemClick={this.handleContextMenu}
              selection={this.model.getCurrentSelection()}
              collect={collect}
            >
              <RowHeader
                heights={table.heights}
                id="table-rows"
                selectedRanges={this.model.selectedRanges}
                selectRow={this.handleSelectRow}
                selectRowRange={this.handleSelectRowRange}
                onRowResizing={this.handleRowResizing}
                onRowResized={this.handleRowResized}
                renderContent={() => { }}
              />
            </ContextMenuTrigger>


          </div>
        </div>
        {
          this.state.addGroupState.visible &&
          <Matrix2AddGroupModal
            visible={this.state.addGroupState.visible}
            onOk={this.handleAddGroup}
            dataSource={this.props.dataSource}
            canRow={this.state.addGroupState.canRow}
            groupType={this.state.addGroupState.groupType}
            positionType={this.state.addGroupState.positionType}
            onCancel={this.handleHideAddGroupDialog}
          />
        }
        {
          this.state.groupInfoState.visible &&
          (<GroupInfoModalMatrix2
            visible={this.state.groupInfoState.visible}
            dataSource={this.props.dataSource}
            onOk={this.handleEditGroup}
            onCancel={this.handleHideGroupInfoDialog}
            group={this.state.groupInfoState.group}
            repeatGroupName={this.model.repeatGroupName}
            rowGroups={this.model.rowGroups}
            columnGroups={this.model.columnGroups}
            selectedGroupStart={this.state.groupInfoState.selectedGroupStart}
            groupLeft={this.state.groupInfoState.groupLeft}
          />)
        }
        {
          this.state.groupListState.visible &&
          (<GroupListModal2
            visible={this.state.groupListState.visible}
            groupRelatedInfo={this.state.groupListState.groupRelatedInfo}
            onCancel={this.handleHideGroupListDialog}
            onOk={this.state.groupListState.onOk}
          />)
        }
        <TableControlContextMenu />
        <TableCellContextMenu />
        <RowHeaderContextMenu />
        <ColumnHeaderContextMenu />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return (Object.assign({}, {
    table: state.DynamicTableReducer.Body.tables[ownProps.index],
    dataSource: state.chartDataSource.datasource,
    theme: state.global.theme,
  }));
};

export default connect(mapStateToProps, null, null, { withRef: true })(Matrix2Control);
