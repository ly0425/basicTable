import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Modal } from '@vadp/ui';
import produce from 'immer';
import Message from '/src/components/public/Message';
import { ContextMenuTrigger } from 'react-contextmenu';
import { shortcutToolbarSignal } from 'public/ShortcutToolbar/signal';
import { createDynamicTable } from 'model/ReportModel/DynamicTable';
import { createTextBoxModel } from 'model/ReportModel/Spreadsheet';
import AddGroupModal from './AddGroupModal';
import EditGroupModal from './EditGroupModal';
import SelectGroupModal from './SelectGroupModal';
import GroupInfoModal from './GroupInfoModal';
import ModifyColumnNameModal from './ModifyColumnNameModal';
import EditGrid from '../../components/EditGrid';
import TextBox from '../../components/TextBox';
import ColumnHeader from '../../components/ColumnHeader';
import RowHeader from '../../components/RowHeader';
import { updateTable, removeTable, selectedTextBox } from '../DynamicTableActions';
import {
  TableControlContextMenu,
  ColumnHeaderContextMenu,
  RowHeaderContextMenu,
  TableCellContextMenu,
} from './DynamicTableContextMenu';
import DynamicTableUtils from './DynamicTableUtils';
import { analysisModel } from 'components/Public/analysisModel';
// import BatchSelect from './BatchSelect';


const TextBoxControl = connect((state) => ({ theme: state.global.theme }))(TextBox);

const confirm = Modal.confirm;
const dynamicUtil = DynamicTableUtils;
const defaultTextBox = dynamicUtil.generateTextBox();
let isResizing = false;
function collect(props) {
  return props;
}
const tableBlock = { drag: false };

class DynamicTableControl extends Component {
  constructor(props) {
    super(props);
    this.textBoxPropertySignal = shortcutToolbarSignal.getByControlID('textBoxPropByTable');
    this.tableThProperty = shortcutToolbarSignal.getByControlID('tableThProperty');
    this.tableTrProperty = shortcutToolbarSignal.getByControlID('tableTrProperty');
    this.GruopLevelField = shortcutToolbarSignal.getByControlID('setGruopLevelField');
    this.toobarEvents = shortcutToolbarSignal.getByControlID('toobarEvent');
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
      }
    };
    this.getdimensionOrmeasure(this.props.dataSource)
    const table = this.props.table;
    this.undoStack = [];
    this.redoStack = [];
    this.model = createDynamicTable(table);
    Object.getOwnPropertyNames(this.model).forEach((name) => {
      const prop = this.model[name];
      if (typeof prop === 'function') {
        this.bind(prop, 'actions', name);
      }
    });
    const txt = createTextBoxModel({});
    Object.getOwnPropertyNames(txt).forEach((name) => {
      const prop = txt[name];
      if (typeof prop === 'function') {
        const producer = function (row, col, ...args) {
          const cell = this.tableRows[row][col];
          prop.apply(cell.textBox, args);
        };
        producer.canUndo = prop.canUndo;
        producer.skipUndo = prop.skipUndo;
        producer.description = prop.description;
        this.bind(producer, 'txtActions', name);
      }
    });

  }
  componentDidMount() {
    this.textBoxPropertySignal.action.add(this.replaceTextBox);
    this.tableThProperty.action.add(this.replaceTableTh);
    this.tableTrProperty.action.add(this.replaceTableTr);
    this.GruopLevelField.action.add(this.setGruopLevelField);
    this.toobarEvents.action.add(this.replaceToobar);
    this.activeTable();
  }
  componentWillUnmount() {
    this.textBoxPropertySignal.action.remove(this.replaceTextBox);
    this.tableThProperty.action.remove(this.replaceTableTh);
    this.tableTrProperty.action.remove(this.replaceTableTr);
    this.GruopLevelField.action.remove(this.setGruopLevelField);
    this.toobarEvents.action.remove(this.replaceToobar);
  }
  componentWillReceiveProps(nextProps) {
    this.getdimensionOrmeasure(nextProps.dataSource)
  }
  getdimensionOrmeasure(dataSource) {
    this.dimension = analysisModel.getFields(dataSource, 'dimension', 'dimension');
    this.measure = analysisModel.getFields(dataSource, 'measure', 'measure');
  }
  replaceToobar = ({ distributeType, eventType, commonTextBox, toobarActionType }) => {
    console.log(toobarActionType)
    if (distributeType === 'targetEvent') {
      if (toobarActionType == 'Body') {
        switch (eventType) {
          case 'cut':
            this.actions.cut();
            break;
          case 'copy':
            this.actions.copy();
            break;
          case 'paste':
            this.actions.paste(commonTextBox);
            break;
          case 'emptyCell':
            this.actions.emptyCell();
            break;
          case 'mergeCell':
            this.actions.mergeCell();
            break;
          case 'splitCell':
            this.actions.splitCell();
            break;
          case 'setCellBold':
            this.setCellBold();
            break;
          case 'setCellItalic':
            this.setCellItalic();
            break;
          case 'setCellUnderline':
            this.setCellUnderline();
            break;
          case 'setAlignLeft':
            this.setAlignLeft();
            break;
          case 'setAlignCenter':
            this.setAlignCenter();
            break;
          case 'setAlignRight':
            this.setAlignRight();
            break;
          case 'clearTableData':
            this.actions.clearTableData();
            break;
          default:
            break;
        }
      }
    }
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
      // put
      console.log(model)

      if (producer.skipUndo) {
        if (!this.stateBefore) this.stateBefore = this.model;
      } else if (producer.canUndo) {
        const stateBefore = this.stateBefore || this.model;
        if (model === stateBefore) {
          return;
        }
        let description = producer.description;
        if (typeof description === 'function') {
          description = description(this.model, model, ...args);
        }
        let toobarActionMap = {
          distributeType: 'replaceToobar',
          wholeModel: {
            stateBefore: {
              table: stateBefore
            },
            stateAfter: {
              table: model
            },
            description
          },
        }
        if (name == 'cut' || name == 'copy') {
          let selectedRanges = this.model.selectedRanges;
          let selectedRange = selectedRanges[0];

          if (selectedRange) {
            toobarActionMap.commonTextBox = {
              type: 'table',
              textBox: this.model.tableRows[selectedRange.top][selectedRange.left] || {},
            }
          }
        }

        this.toobarEvents.action.dispatch(toobarActionMap);
        // this.undoStack.push({ stateBefore, stateAfter: model, description });
        this.stateBefore = null;
        // this.redoStack = [];
      }
      // update

      this.model = model;
      this.expectUpdate();
    };
  }
  undo = (count) => {
    if (this.undoStack.length === 0 || count === 0) {
      return;
    }
    if (typeof count !== 'number') {
      count = 1;
    }
    let record;
    for (let i = 0; i < count; i += 1) {
      record = this.undoStack.pop();
      this.redoStack.push(record);
    }
    this.model = record.stateBefore;
    this.expectUpdate();
  }
  redo = (count) => {
    if (this.redoStack.length === 0 || count === 0) {
      return;
    }
    if (typeof count !== 'number') {
      count = 1;
    }
    let record;
    for (let i = 0; i < count; i += 1) {
      record = this.redoStack.pop();
      this.undoStack.push(record);
    }
    this.model = record.stateAfter;
    this.expectUpdate();
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
    };
    return { ...this.props.table, ...table };
  }
  expectUpdate() {
    // TODO 保存时再同步到 redux store
    const table = this.getTableToDispatch();


    this.props.dispatch(updateTable({
      table, areaName: this.props.areaName,
    }));
    // this.setState({ someState: {} });
  }
  // 是表格可以拖动
  updateTable = (table) => {
    this.actions.updateTableModel(table);
  }
  tableBlockMouseDown = (e) => {
    if (e.button !== 0) {
      return;
    }
    tableBlock.drag = true;
    tableBlock.diffX = e.pageX - this.props.table.position.x;
    tableBlock.diffY = e.pageY - this.props.table.position.y;
    this.activeTable();
  };

  activeTable = () => {
    const table = this.tableDiv;
    // table.style.borderColor = '#0D70FF';
    this.borderClassName = 'table-content-active'
    const tableID = this.props.table.id;
    const controlInfo = {
      tableID,
      areaName: 'Body',
      controlCategory: 'table',
      tableType: 'table'
    };
    this.actions.clearSelection();
    this.props.dispatch(selectedTextBox({ controlInfo }));
  }

  replaceTextBox = ({ rowID, colID, textBox } = {}) => {
    this.actions.replaceTextBox(rowID, colID, textBox);
  }
  replaceTableTh = ({ columnSubscript, thData } = {}) => {
    this.actions.replaceTableTh(columnSubscript, thData);
  }
  replaceTableTr = ({ rowSubscript, trData } = {}) => {
    this.actions.replaceTableTr(rowSubscript, trData);
  }
  setGruopLevelField = ({ value }) => {
    this.actions.setGruopLevelField(this.dimension, this.measure, value)
  }
  activeTextBox = (row, col) => {
    const controlInfo = {
      tableID: this.props.table.id,
      areaName: 'Body',
      controlCategory: 'textBoxByTable',
      rowID: row,
      colID: col,
      tableType: 'table'
    };
    this.props.dispatch(selectedTextBox({ controlInfo }));
  }

  // 监控鼠标移动
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
  };

  tableMouseUp = () => {
    tableBlock.drag = false;
  };

  cellSelect = (coordinate) => {
    let has = false;
    const selection = this.model.getCurrentSelection();
    if (selection) {
      const { left, top, right, bottom } = selection;
      const p = dynamicUtil.parsePoint(coordinate);
      const cell = this.model.tableRows[p.row][p.col];
      has = cell.display && p.row >= top && p.row <= bottom && p.col >= left && p.col <= right;
    }
    return has;
  };
  selectAllCell = () => {
    this.actions.selectAll();
  }

  mergeCell = () => {
    this.actions.mergeCell();
  };

  splitCell = () => {
    this.actions.splitCell();
  };

  insertRowUp = () => {
    this.actions.insertRows('up');
  };

  insertRowDown = () => {
    this.actions.insertRows('down');
  };

  insertRow = (index, rowCount) => {
    this.actions.insertRow(index, rowCount);
  }

  insertTableHeader = () => {
    const groups = this.model.rowGroups;
    const groupStart = groups[0].startRow;
    this.actions.insertRowByRoleAndPosition('corner', groupStart, 1);
  }

  insertTableFooter = () => {
    this.actions.insertRowByRoleAndPosition('body', this.model.tableRows.length, 1);
  }

  insertGroupHeader = () => {
    const selectGroupState = {
      visible: true,
      type: 'header',
      callBack: (index) => {
        this.actions.addGroupHeader(index);
        this.setState({ selectGroupState: { visible: false } });
      },
      onCancel: () => {
        this.setState({ selectGroupState: { visible: false } });
      },
    };
    this.setState({ selectGroupState });
  }

  insertGroupFooter = () => {
    const selectGroupState = {
      visible: true,
      type: 'footer',
      callBack: (index) => {
        this.actions.addGroupFooter(index);
        this.setState({ selectGroupState: { visible: false } });
      },
      onCancel: () => {
        this.setState({ selectGroupState: { visible: false } });
      },
    };
    this.setState({ selectGroupState });
  }

  insertColumnLeft = () => {
    this.actions.insertColumns('left');
  };

  insertColumnRight = () => {
    this.actions.insertColumns('right');
  };
  insertGroupColumn = () => {
    // const that = this;
    const selectGroupState = {
      visible: true,
      type: 'col',
      callBack: (index) => {
        const group = this.model.rowGroups[index];
        const exp = group.expressions.length > 0 ? group.expressions[0] : '';
        const groupExpression = exp.startsWith('=Fields.') ? exp.slice('=Fields.'.length) : exp;
        this.actions.addGroupColumn(index, exp, group.name, groupExpression);
        this.setState({ selectGroupState: { visible: false } });
      },
      onCancel: () => {
        this.setState({ selectGroupState: { visible: false } });
      },
    };
    this.setState({ selectGroupState });
  };
  deleteGroup = () => {
    if (this.model.rowGroups.length === 1) {
      Message.warning('至少要有一个分组');
      return;
    }
    const that = this;
    const group = this.model.rowGroups[this.getCurrentGroupIndex()];
    console.log(this.getCurrentGroupIndex())
    confirm({
      title: '删除分组',
      content: `确定要删除分组项：${group.name} ？`,
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk() {
        that.actions.deleteGroup(that.getCurrentGroupIndex());
      },
    })
  };
  deleteAllGroups = () => {
    const that = this;
    confirm({
      title: '删除所有分组',
      content: `确定要删除所有分组？`,
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk() {
        that.actions.deleteAllGroups();
      },
    })
  };
  groupInfo = () => {
    const groupInfoState = {
      visible: true,
      index: this.getCurrentGroupIndex(),
    }
    this.setState({ groupInfoState });
  };
  removeRows = () => {
    const model = this.model;
    const rowGroups = this.model.rowGroups[0];
    if (!model.selectedRanges || model.selectedRanges.length === 0) {
      return;
    }
    const selection = model.getCurrentSelection();
    if (selection.type !== 'row') {
      Message.info('只能对整行选中区域执行删除行');
      return
    }
    const { top, bottom } = selection;
    if (top <= model.cornerSize.rows && bottom === model.tableRows.length - 1) {
      Message.info('不能没有数据区域');
      return
    }
    if (model.cornerSize.rows === 1 && top < rowGroups.startRow) {
      Message.info('不能没有表头行');
      return
    }
    if (top < rowGroups.startRow && bottom < rowGroups.startRow) {
      if (bottom - top + 1 === model.cornerSize.rows) {
        Message.info('不能没有表头行');
        return
      }
    }
    if (top < rowGroups.startRow && bottom >= rowGroups.startRow) {
      Message.info('不能跨区域删除');
      return
    }
    if (top === this.props.table.rowGroups[0].startRow && bottom === this.props.table.rowGroups[0].endRow) {
      Message.info('不能没有数据区域');
      return
    }

    const rowGroup = this.props.table.rowGroups[0];
    const groups = model.rowGroups;
    let containsGroup = false;
    groups.forEach((g) => {
      if (g.startRow >= top && g.endRow <= bottom) {
        containsGroup = true;
      }
    });

    if (containsGroup) {
      const that = this;
      confirm({
        title: '删除行',
        content: '是否删除行和关联组？',
        okText: '确认',
        cancelText: '取消',
        onOk() {
          that.actions.removeRows({ delCondition: true });
        },
      });
    } else {
      this.actions.removeRows({ delCondition: true });
    }
  }

  removeColumns = () => {
    this.actions.removeColumns();
  }
  modifyColumnName = () => {
    const modifyColumnNameState = {
      visible: true,
      type: 'info',
      callBack: (currentLineName, currentIndex) => {
        this.setState({ modifyColumnNameState: { visible: false } })
        if (currentLineName !== undefined) {
          this.actions.ModifyColumnName(currentLineName, currentIndex, () => Message.info('修改列名成功'))
        }
      },
      onCancel: () => {
        this.setState({ modifyColumnNameState: { visible: false } });
      },
    };
    this.setState({ modifyColumnNameState });

  }
  columnNumberToName = (number) => {
    let dividend = number + 1;
    let name = '';
    let modulo = 0;

    while (dividend > 0) {
      modulo = (dividend - 1) % 26;
      name = String.fromCharCode('A'.charCodeAt(0) + modulo) + name;
      dividend = Math.floor((dividend - modulo) / 26);
    }
    return name;
  }

  handleRemoveTable = () => {
    const tableID = this.props.table.id;
    this.props.dispatch(removeTable({ tableID, areaName: this.props.areaName }));
  };

  getSelectedCellTextBox = () => {
    let point = null;
    const selection = this.model.getCurrentSelection();
    if (selection) {
      point = { row: selection.top, col: selection.left };
    }
    if (!point) {
      return null;
    }
    const p = point;
    const tableArray = this.model.tableRows;
    if (p.row >= tableArray.length) {
      p.row = tableArray.length - 1;
    }
    if (p.col >= tableArray[p.row].length) {
      p.col = tableArray[p.row].length - 1;
    }
    return tableArray[p.row][p.col].textBox;
  };
  getSelectedCellFontInfo = () => {
    const textBox = this.getSelectedCellTextBox();
    const fontInfo = { fontWeight: 'Normal', fontDecoration: 'Normal', fontType: 'Normal' };
    if (textBox && textBox.fontInfo) {
      return { ...fontInfo, ...textBox.fontInfo };
    }
    return fontInfo;
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

  setCellBold = () => {
    const fontInfo = this.getSelectedCellFontInfo();
    const isBold = fontInfo.fontWeight.toLowerCase() === 'bold';
    this.updateCellStyle({ fontInfo: { ...fontInfo, fontWeight: isBold ? 'Normal' : 'Bold' } });
  }
  updateCellStyle = (style) => {
    this.actions.updateCellStyle(style);
  }
  setCellItalic = () => {
    const fontInfo = this.getSelectedCellFontInfo();
    const isItalic = fontInfo.fontType.toLowerCase() === 'italic';
    this.updateCellStyle({ fontInfo: { ...fontInfo, fontType: isItalic ? 'Normal' : 'Italic' } });
  }
  setCellUnderline = () => {
    const fontInfo = this.getSelectedCellFontInfo();
    const isUnderline = fontInfo.fontDecoration.toLowerCase() === 'underline';
    this.updateCellStyle({ fontInfo: { ...fontInfo, fontDecoration: isUnderline ? 'Normal' : 'UnderLine' } });
  }
  onFormatBrushClick = () => {
    const selection = this.model.getCurrentSelection();
    if (!selection) {
      Message.warning('请选择单元格');
      return;
    }
    this.actions.brush();
  }
  deleteSelectedCell = () => {
    if (this.model.selectedRanges) {
      this.actions.emptyCell();
      this.setState({ visible: false });
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
  onKeyPress = (ev) => {
    if (ev.target.nodeName !== 'INPUT') {
      const selection = this.model.getCurrentSelection();
      if (selection) {
        this.actions.beginEdit(selection.top, selection.left);
      }
    }
  };
  onKeyDown = (ev) => {
    // console.log(ev.key, ev.keyCode, typeof ev.key);
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

  sumRange = (array, start, end) => {
    return array.slice(start, end).reduce((sum, item) => (sum + item), 0);
  }

  setAlignLeft = () => {
    this.setAlign('Left');
  };
  setAlignCenter = () => {
    this.setAlign('Center');
  };
  setAlignRight = () => {
    this.setAlign('Right');
  };
  setAlign = (align) => {
    this.actions.updateCellAlign(align);
  };
  getUndoTip = () => {
    const length = this.undoStack.length;
    if (length > 0) {
      return `撤销 ${this.undoStack[length - 1].description}`;
    }
  };
  getRedoTip = () => {
    const length = this.redoStack.length;
    if (length > 0) {
      return `恢复 ${this.redoStack[length - 1].description}`;
    }
  };
  getCurrentGroupIndex = () => {
    const groups = this.model.rowGroups;
    const selection = this.model.getCurrentSelection();
    if (selection) {
      for (let i = groups.length - 1; i >= 0; i -= 1) {
        const g = groups[i];
        if (g.colPosition <= selection.left &&
            g.startRow <= selection.top &&
            g.endRow >= selection.top) {
          return i;
        }
      }
    }
    return -1;
  };
  handleRemoveTable = () => {
    const tableID = this.props.table.id;
    this.props.dispatch(removeTable({ tableID, areaName: this.props.areaName }));
    if (this.props.clearconditionsModal) {
      this.props.clearconditionsModal();
    }
  };
  handleMouseSelectStart = (row, col, e) => {
    this.actions.selectCell(row, col, e.ctrlKey);
    const table = this.tableDiv;
    // table.style.borderColor = 'transparent';
    this.borderClassName = '';
    this.activeTextBox(row, col);
  }
  getCurrentTextBox = () => {
    const selection = this.model.getCurrentSelection();
    if (selection) {
      let textBox = this.model.tableRows[selection.top][selection.left].textBox;
      let fontInfo = textBox.fontInfo || {};
      return {
        ...textBox,
        fontStyle: {
          fontWeight: fontInfo.fontWeight,
          fontType: fontInfo.fontType,
          fontDecoration: fontInfo.fontDecoration
        }
      }
    }

  }
  handleMouseSelectChange = (start, target) => this.actions.selectRect(start, target);
  handleMouseSelectEnd = () => {
    // 框选结束后刷格式
    if (this.model.mark && this.model.mark.type === 'brush') {
      this.actions.pasteStyle();
    }
  };
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
      tableType: 'table'
    };
    this.props.dispatch(selectedTextBox({ controlInfo }));
  }
  handleSelectColumnRange = (start, target) => {

    this.actions.selectColumnRange(start, target);
    const table = this.tableDiv;
    // table.style.borderColor = 'transparent';
    this.borderClassName = '';
  }

  handleSelectRow = (index, isAppend) => {
    this.actions.selectRow(index, isAppend);
    const table = this.tableDiv;
    // table.style.borderColor = 'transparent';
    this.borderClassName = '';
    const controlInfo = {
      tableID: this.props.table.id,
      areaName: 'Body',
      controlCategory: 'TableTr',
      rowSubscript: index,
      tableType: 'table'
    };
    this.props.dispatch(selectedTextBox({ controlInfo }));
  }
  handleSelectRowRange = (start, target) => {
    this.actions.selectRowRange(start, target);
    const table = this.tableDiv;
    // table.style.borderColor = 'transparent';
    this.borderClassName = '';
  }


  handleBeginEdit = ({ rowIndex, columnIndex }) => {
    this.actions.beginEdit(rowIndex, columnIndex);
  };
  handleCommitEdit = ({ rowIndex, columnIndex }, value) => {
    this.actions.commitEdit(rowIndex, columnIndex, value);
  };
  handleTextBoxDrop = (cell, ev) => {
    ev.preventDefault();
    let textGetData = ev.dataTransfer.getData('text')
    textGetData = JSON.parse(textGetData)
    const type = textGetData.type
    //ev.dataTransfer.getData('type');
    const text = textGetData.text;
    //ev.dataTransfer.getData('text');
    const fieldName = textGetData.fieldName
    //ev.dataTransfer.getData('fieldName');
    const dataType = textGetData.dataType.split('(')[0]
    //ev.dataTransfer.getData('dataType').split('(')[0];
    if (!fieldName) {
      return;
    }
    const field = { type, fieldName, text, dataType };
    this.actions.dropField(cell, field);
  };
  handleColumnResizing = (...args) => {
    isResizing = true;
    this.actions.columnResizing(...args);
  };
  handleColumnResized = () => {
    isResizing = false;
    this.actions.columnResized();
  };
  handleRowResizing = (...args) => {
    isResizing = true;
    this.actions.rowResizing(...args);
  };
  handleRowResized = () => {
    isResizing = false;
    this.actions.rowResized();
  };
  handleContextMenu = (e, data) => {
    e.preventDefault();

    switch (data.menuId) {
      case 'deleteTable':
        this.confirmDelete('table');
        break;
      case 'insertRowUp':
        this.insertRowUp();
        break;
      case 'insertRowDown':
        this.insertRowDown();
        break;
      case 'insertTableHeader':
        this.insertTableHeader();
        break;
      case 'insertTableFooter':
        this.insertTableFooter();
        break;
      case 'insertGroupHeader':
        this.insertGroupHeader();
        break;
      case 'insertGroupFooter':
        this.insertGroupFooter();
        break;
      case 'insertParentRowGroup':
        this.showAddGroupDialog('row', 'parent');
        break;
      case 'insertChildRowGroup':
        this.showAddGroupDialog('row', 'child');
        break;
      case 'editGroup':
        this.showEditGroupDialog();
        break;
      case 'deleteGroup':
        this.deleteGroup();
        break;
      case 'groupInfo':
        this.groupInfo();
        break;
      case 'deleteRow':
        this.removeRows();
        break;
      case 'insertColmunLeft':
        this.insertColumnLeft();
        break;
      case 'insertColmunRight':
        this.insertColumnRight();
        break;
      case 'insertGroupColumn':
        this.insertGroupColumn();
        break;
      case 'modifyColumnName':
        this.modifyColumnName();
        break;
      case 'deleteColumn':
        this.removeColumns();
        break;
      case 'mergerCell':
        this.mergeCell();
        break;
      case 'splitCell':
        this.splitCell();
        break;
      case 'clearCell':
        this.confirmDelete('cell');
        break;
      case 'deleteAllGroups':
        this.deleteAllGroups()
      default:
        break;
    }
  };

  showAddGroupDialog = (groupType, positionType) => {
    const rowGroups = this.props.table.rowGroups;
    const idx = this.getCurrentGroupIndex();
    const noDetail = positionType === 'parent' ||
        idx !== rowGroups.length - 1 ||
        rowGroups[rowGroups.length - 1].expressions.length === 0;
    const canRow = positionType === 'parent' || idx !== rowGroups.length - 1;
    const addGroupState = {
      visible: true,
      groupType,
      noDetail,
      canRow,
      addParent: positionType === 'parent',
    };
    this.setState({ addGroupState });
  }
  handleHideAddGroupDialog = () => {
    const addGroupState = { visible: false };
    this.setState({ addGroupState });
  }
  handleAddGroup = (group) => {
    this.handleHideAddGroupDialog();
    // const type = this.state.addGroupState.groupType; // row column
    const isParent = this.state.addGroupState.addParent;  // true false
    const index = this.getCurrentGroupIndex();
    if (index >= 0) {
      this.actions.addGroup(isParent, index, group);
    }
  }

  showEditGroupDialog = () => {
    const editGroupState = { visible: true };
    this.setState({ editGroupState });
  }
  handleHideEditGroupDialog = () => {
    const editGroupState = { visible: false };
    this.setState({ editGroupState });
  }
  handleEditGroup = (groupInfo) => {
    // this.actions.clearSelection();
    this.handleHideGroupInfoDialog();
    this.actions.editGroup(groupInfo);
  }
  handleHideGroupInfoDialog = () => {
    const groupInfoState = { visible: false };
    this.setState({ groupInfoState });
  }
  confirmDelete = (command) => {
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
      default:
        break;
    }
    if (config) {
      confirm(config);
    }
  };
  refTable = (table) => {
    this.tableDiv = table;
  };
  renderGridCustom = (calcWidth, calcHeight) => {
    const cornerSize = this.model.cornerSize;
    const left = calcWidth(0, cornerSize.columns);
    const top = calcHeight(0, cornerSize.rows);
    const groups = this.model.rowGroups;
    const groupIndex = this.getCurrentGroupIndex();

    return (<div>
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
        groups.map((g, idx) => {
          const span = g.endRow - g.startRow + 1;
          const color = idx === groupIndex ? '#ffba1f' : '#9c9c9c';
          const border = `solid 3px ${color}`;
          return (<div
              style={{
                position: 'absolute',
                left: calcWidth(0, g.colPosition),
                top: calcHeight(0, g.startRow),
                height: calcHeight(g.startRow, span),
                width: '5px',
                borderLeft: border,
                borderTop: border,
                borderBottom: border,
                pointerEvents: 'none',
              }}
          />);
        })
      }
    </div>);
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

  render() {
    const table = this.props.table;
    console.log(table)
    const width = table.widths.reduce((sum, item) => {
      return item + sum;
    }, 1);
    const height = table.heights.reduce((sum, item) => {
      return item + sum;
    }, 1) + 33;
    return (

        <div
            className="table-wrap"
            onMouseMove={this.tableMouseMove}
        >
          {/* <div className="toolbar">
          <div onClick={this.cutSelectedCell} className="toolitem toolitem-header" title="剪切"><i className="icon iconfont icon-cut"></i></div>
          <div onClick={this.copySelectedCell} className="toolitem" title="复制"><i className="icon iconfont icon-copy"></i></div>
          <div onClick={this.pasteSelectedCell} className="toolitem" title="粘贴"><i className="icon iconfont icon-past"></i></div>
          <div onClick={this.showDeleteModal.bind(this, 'deleteCell')} className="toolitem" title="删除"><i className="icon iconfont icon-delete"></i></div>
          <div onClick={this.mergeCell} className="toolitem toolitem-header" title="合并单元格"><i className="icon iconfont icon-mergecell"></i></div>
          <div onClick={this.splitCell} className="toolitem" title="拆分单元格"><i className="icon iconfont icon-splitcell"></i></div>
          <div onClick={this.importExcel} className="toolitem toolitem-header" title="导入"><i className="icon iconfont icon-add"></i></div>
          <div onClick={this.exportExcel} className="toolitem toolitem" title="导出"><i className="icon iconfont icon-save-as"></i></div>
          <div onClick={this.setCellBold} className={"toolitem toolitem-header" + (fontStyle && fontStyle.fontWeight.toLowerCase() === 'bold' ? ' toolitem-checked' : '')} style={{ fontWeight: 'bolder' }} title="加粗"><i className="icon iconfont">B</i></div>
          <div onClick={this.setCellItalic} className={"toolitem" + (fontStyle && fontStyle.fontType.toLowerCase() === 'italic' ? ' toolitem-checked' : '')} style={{ fontStyle: 'italic' }} title="倾斜"><i className="icon iconfont">I</i></div>
          <div onClick={this.setCellUnderline} className={"toolitem" + (fontStyle && fontStyle.fontDecoration.toLowerCase() === 'underline' ? ' toolitem-checked' : '')} style={{ textDecoration: 'underline' }} title="下划线"><i className="icon iconfont">U</i></div>
          <div onClick={this.onFormatBrushClick} className={"toolitem toolitem-header" + (this.model.mark && this.model.mark.type === 'brush' && ' toolitem-checked')} title="格式刷"><i className="icon iconfont icon-brush"></i></div>
          <div onClick={this.setAlignLeft} className={"toolitem toolitem-header"}
            title="左对齐">
            <i className={textBox && textBox.horizontalAlignment === 'Left'
              ? "icon iconfont icon-alignleft fontStyle-ul-icon-current" : "icon iconfont icon-alignleft"}></i>
          </div>
          <div onClick={this.setAlignCenter} className={"toolitem"}
            title="居中">
            <i className={textBox && textBox.horizontalAlignment === 'Center'
              ? "icon iconfont icon-aligncenter fontStyle-ul-icon-current" : "icon iconfont icon-aligncenter"}></i>
          </div>
          <div onClick={this.setAlignRight} className={"toolitem"}
            title="右对齐">
            <i className={textBox && textBox.horizontalAlignment === 'Right'
              ? "icon iconfont icon-alignright fontStyle-ul-icon-current" : "icon iconfont icon-alignright"}></i>
          </div>
          <BatchSelect dataSource={this.undoStack} onButtonClick={this.undo} onSelect={this.undo}
            buttonTip={this.getUndoTip()} listTip={count => `撤销 ${count} 步操作`}>
            <Icon type="rollback" />
          </BatchSelect >
          <BatchSelect dataSource={this.redoStack} onButtonClick={this.redo} onSelect={this.redo}
            buttonTip={this.getRedoTip()} listTip={count => `恢复 ${count} 步操作`}>
            <Icon type="rollback" style={{ transform: 'scaleX(-1)' }} />
          </BatchSelect >
        </div> */}

          <div className="spreadsheet-design" style={{ height: '100%', maxHeight: '100%', top: '0px', left: '0px', width: '100%', maxWidth: '100%', overflow: 'visible' }}>
            <div ref={this.refTable} style={{ left: `${this.props.table.position.x}px`, top: `${this.props.table.position.y}px`, width: `${width + 33}px`, height: `${height}px`, }} className={"table-content" + " " + this.borderClassName}>
              <ContextMenuTrigger
                  id="table-cells"
                  holdToDisplay={-1}
                  onItemClick={this.handleContextMenu}
                  selection={this.model.getCurrentSelection()}
                  groupIndex={this.getCurrentGroupIndex()}
                  cornerSize={this.model.cornerSize}
                  rowGroups={this.model.rowGroups}
                  tableRows={this.model.tableRows}
                  collect={collect}
                  disable={!!this.model.editingCell}
              >
                <EditGrid
                    tableRows={table.tableRows}
                    widths={table.widths}
                    editingCell={this.model.editingCell}
                    heights={table.heights}
                    selectedRanges={this.model.selectedRanges}
                    mark={this.model.mark}
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
                  id="table-handle"
                  holdToDisplay={-1}
                  onItemClick={this.handleContextMenu}
                  selection={this.model.getCurrentSelection()}
                  cornerSize={this.model.cornerSize}
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
                  cornerSize={this.model.cornerSize}
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
                  rowGroups={this.model.rowGroups}
                  collect={collect}
              >
                <RowHeader
                    heights={table.heights}
                    selectedRanges={this.model.selectedRanges}
                    selectRow={this.handleSelectRow}
                    selectRowRange={this.handleSelectRowRange}
                    onRowResizing={this.handleRowResizing}
                    onRowResized={this.handleRowResized}
                    renderContent={() => { }}
                    rowProps={[]}
                />
              </ContextMenuTrigger>
            </div>
          </div>
          {
            this.state.addGroupState.visible &&
            (<AddGroupModal
                visible={this.state.addGroupState.visible}
                onOk={this.handleAddGroup}
                dataSource={this.props.dataSource}
                noDetail={this.state.addGroupState.noDetail}
                canRow={this.state.addGroupState.canRow}
                onCancel={this.handleHideAddGroupDialog}
            />)
          }
          {
            this.state.editGroupState.visible &&
            (<EditGroupModal
                visible={this.state.editGroupState.visible}
                // onOk={this.handleEditGroup}
                dataSource={this.props.dataSource}
                control={this}
                onCancel={this.handleHideEditGroupDialog}
            />)
          }
          {
            this.state.selectGroupState.visible &&
            (<SelectGroupModal
                visible={this.state.selectGroupState.visible}
                groups={this.model.rowGroups}
                type={this.state.selectGroupState.type}
                cornerSize={this.model.cornerSize}
                callBack={this.state.selectGroupState.callBack}
                onCancel={this.state.selectGroupState.onCancel}
            />)
          }
          {
            this.state.groupInfoState.visible &&
            (<GroupInfoModal
                visible={this.state.groupInfoState.visible}
                groups={this.model.rowGroups}
                index={this.state.groupInfoState.index}
                dataSource={this.props.dataSource}
                onOk={this.handleEditGroup}
                onCancel={this.handleHideGroupInfoDialog}
                selection={this.model.getCurrentSelection()}
                columns={this.props.table.columns}
            />)
          }
          {
            this.state.modifyColumnNameState.visible &&
            (<ModifyColumnNameModal
                visible={this.state.modifyColumnNameState.visible}
                callBack={this.state.modifyColumnNameState.callBack}
                onCancel={this.state.modifyColumnNameState.onCancel}
                model={this.model}
            />)
          }
          <TableControlContextMenu />
          <ColumnHeaderContextMenu />
          <RowHeaderContextMenu />
          <TableCellContextMenu />
        </div >
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return (Object.assign({}, {
    table: state.DynamicTableReducer.Body.tables[ownProps.index],
    dataSource: state.chartDataSource.datasource,
    theme: state.global.theme,
    currentObject: state.DynamicTableReducer.currentObject
  }));
};

export default connect(mapStateToProps, null, null, { withRef: true })(DynamicTableControl);
