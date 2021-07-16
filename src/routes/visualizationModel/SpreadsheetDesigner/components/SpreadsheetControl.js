import React, { Component, PureComponent } from 'react';
import { connect } from 'react-redux';
import addressConverter from 'xlsx-populate/lib/addressConverter';
import EditGrid, { getRenderRange, isRangeEqual } from '../../components/EditGrid';
import TextBox, { getTextBoxFontInfoStyle } from '../../components/TextBox';
import ColumnHeader from '../../components/ColumnHeader';
import RowHeader from '../../components/RowHeader';
import Message from 'public/Message';
import Dialog from 'public/Dialog';
import { Select, Checkbox, notification, Input, InputNumber, Modal, Button, Icon, Tooltip, Spin } from '@vadp/ui';
import { ContextMenu, MenuItem, ContextMenuTrigger, connectMenu } from 'react-contextmenu';
import { removeTable, undo, redo } from '../SpreadsheetAction';
import * as SpreatsheetUtil from './SpreadsheetUtils';
import { defaultTextBox, createSpreadsheet } from 'model/ReportModel/Spreadsheet';
import { createFormulaCategaries } from './Expression/formulaDefinition';
import BatchSelect from './BatchSelect';
import { validateWithLexerAndParser } from 'components/Public/ExpressionEditor';
import FormulaEditorModal from './FormulaEditorModal';
import FunctionModal from './FunctionModal';
import { FormulaLexer } from '../formulaCalc/FormulaLexer';
import { FormulaParser } from '../formulaCalc/FormulaParser';
import PropertyUtils from '../../tableDesigner/components/PropertyUtils';
import { getSelectedCellTextBox, getSelectedCellFontInfo, getSelectedCell } from '../SpreadsheetSelectors';
import { Observable, Subject, BehaviorSubject, ReplaySubject, from, of, range, timer, combineLatest, merge } from 'rxjs';
import { map, catchError, retryWhen } from 'rxjs/operators';
import CheckFormulaModal from './CheckFormulaModal';
import ReplaceModal from './ReplaceModal';
import ImportIndexesDialog from './ImportIndexesDialog';
import XlsxPopulate from 'xlsx-populate';
import { uploadxml } from '../SpreadsheetApi';
import SpreadsheetDvaModel from '../SpreadsheetDvaModel';
import UploadAttachmentModal from './UploadAttachmentModal';
import { bindModel } from '~/models/utils';
import RowHeightDialog from './RowHeightDialog';
import WorksheetSelectDialog from './WorksheetSelectDialog';
import { message } from '@vadp/ui';
import DimensionFormulaModal from './DimensionFormulaModal';
import { fetchDimensionValues } from '../BudgetApi';
import BindDimensionModal from './BindDimensionModal';
import GatherModal from './GatherModal';
import _ from 'lodash';
import BudgetFormulaModal from './BudgetFormulaModal';
import ExpressionModal from './ExpressionModal.js';
import AllModelsModal from './AllModelsModal.js';
import DimensionModal from './DimensionModal.js';
import axios from 'axios';
import { isHttpPublic } from 'constants/IntegratedEnvironment';
import { RenderToolbars } from '~/components/Public/excelCommon';
import { copyToClipboard } from '~/utils/clipboard';
import Common from 'components/Print/Common';
import SpreadsheetBottomInfo from './SpreadsheetBottomInfo';
import BudgetParameterModal from './BudgetParameterModal';
import BudgetReferenceModal from 'components/Public/ExpressionEditor/BudgetReferenceModal';
import DecomposeModal from './DecomposeModal.js';

const Option = Select.Option;
let isResizing = false;
const tableBlock = { drag: false };
const roleArray = ['tableHeader'];

const mergeObject = SpreatsheetUtil.mergeObject;
function pauseEvent(e) {
  if (e.stopPropagation) e.stopPropagation();
  if (e.preventDefault) e.preventDefault();
  e.cancelBubble = true;
  e.returnValue = false;
  return false;
}
function selectText(element) {
  var doc = document;
  if (doc.body.createTextRange) {
    var range = document.body.createTextRange();
    range.moveToElementText(element);
    range.select();
  } else if (window.getSelection) {
    var selection = window.getSelection();
    var range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
export const ToolbarItem = ({ onClick, isHeader, title, iconName, checked, disabled, style }) => {
  let outerClassName = 'toolitem';
  isHeader && (outerClassName += ' toolitem-header');
  checked && (outerClassName += ' toolitem-checked');
  let innerClassName = 'icon iconfont ';
  iconName && (innerClassName += iconName);
  return (
    <div
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={outerClassName}
      title={title}
      style={style}
    >
      <i className={innerClassName} />
    </div>
  )
};

export const ToolbarRadioItem = ({ onClick, isHeader, title, iconName, current }) => {
  let outerClassName = 'toolitem';
  isHeader && (outerClassName += ' toolitem-header');
  let innerClassName = 'icon iconfont ';
  iconName && (innerClassName += iconName);
  current && (innerClassName += ' fontStyle-ul-icon-current');
  return (
    <div
      onClick={onClick} className={outerClassName}
      title={title}
    >
      <i className={innerClassName} />
    </div>
  );
};
const common = new Common();
export class SheetBase extends Component {
  actions = createSpreadsheet(); // 欺骗 Code
  dvaActions = {
    ...SpreadsheetDvaModel.producers,
    ...SpreadsheetDvaModel.effects,
  };
  constructor(props) {
    super(props);
    this.state = {
      showDimensionFormulaModal: false,
      showGatherModal: false,
      budgetFormulaVisible: false,
      expandRowFields: [],//展开那行的所有列相关值
      expressionModal: {
        show: false,
        tables: [],
        cellAnalysisModelId: ''
      },
      allModelsModal: {
        show: false,
        models: []
      },
      adjustModal: {
        title: '调整',
        visible: false,
        value: 0,
        columns: []
      },
      copyModal: {
        visible: false,
        data: [],
        copyData: [],
        value: undefined
      },
      dimensionModal: {
        show: false,
        data: undefined
      },
      bottomInfo: {
        visible: false,
        data: {},
        activeKey: "1"
      },
      decomposeModal: {
        visible: false
      }
    };
    this.menu_row = common.genId();
    this.menu_editgrid = common.genId();
    this.menu_column = common.genId();
    this.model = props.sheet.present;
    this.actions = props.actions;
    this.dvaActions = bindModel(SpreadsheetDvaModel, this.props.dispatch);
    this.getRowKey = this.getRowKey.bind(this);
    this.beginEdit = this.beginEdit.bind(this);

    // var a = Observable.create(function subscribe(observer) {
    //   console.log('a subscribe');
    //   observer.next(1);
    //   observer.next(2);
    //   observer.next(new Error('haha'));
    // });
    // var observable = a.pipe(map(x => {
    //   if (x instanceof Error) {
    //     throw x;
    //   }
    //   return x;
    // }));
    // observable.subscribe(x => console.log('observer next', x),
    //   er => console.log('observer error', er));

    // merge(of(1, 2, 3), of(4, 5, 6)).subscribe(x => console.log('next', x));
  }
  componentWillReceiveProps(nextProps) {
    this.model = nextProps.sheet.present;
    this.actions = nextProps.actions;
  }
  componentDidMount() {

    // 监听尺寸变化
    const elementResizeDetectorMaker = require('element-resize-detector');
    const erd = elementResizeDetectorMaker();
    const that = this;
    erd.listenTo(this.refs.canvas, (element) => {
      clearTimeout(that.resizeTid);
      that.resizeTid = setTimeout(function () {
        that.lazyLoad();
      }, 200);
    });
    this.lazyLoad();
  }

  componentWillUnmount() {
    if (this.grid) this.grid.removeEventListener('paste', this.handlePaste);

  }
  handleCopy = () => {
    const { tableRows, selectedRanges, fixedMap, colProps } = this.props.sheet.present;
    let str = '';
    for (let a = 0, b = selectedRanges.length; a < b; a++) {
      const { left, right, top, bottom } = selectedRanges[a];
      for (let i = top; i <= bottom; i++) {
        const rows = tableRows[i];
        for (let m = left; m <= right; m++) {
          if (colProps[m].isHidden) continue;
          let value = '';
          if (rows[m].isUserIndex === 'y' && rows[m].id) {
            value = fixedMap[rows[m].id];
          }
          else {
            value = rows[m].textBox.value || ' ';
          }
          if (value) {
            str += `${value}	`;
          }
        }
        str += '\n';
      }
    }
    copyToClipboard(str);
  }
  handlePaste = (e) => {
    if (this.model.mark) {
      // 内部粘贴
      this.pasteSelectedCell();
      return;
    }
    var clipboardData = e.clipboardData;

    if (!(clipboardData && clipboardData.items)) {//是否有粘贴内容
      return;
    }
    var copyContent = e.clipboardData.getData('text/plain');
    if (!copyContent) return;
    copyContent = copyContent.split('\r\n').join('\n');
    const lines = copyContent.split('\n');
    if (lines.length === 0) return;
    // 删掉最后空行
    if (!lines[lines.length - 1]) lines.splice(lines.length - 1, 1);
    const copyData = lines.map(x => x.split('\t'));

    /* start 支持粘贴自动扩展行列 edit by liuran */
    const { tableRows, selectedRanges } = this.props.sheet.present;
    const { left, top } = selectedRanges[0];
    if (tableRows[0].length - left < copyData[0].length) {
      this.props.actions.insertColumn(tableRows[0].length, copyData[0].length - (tableRows[0].length - left));
    }
    if (tableRows.length - top < copyData.length) {
      this.props.actions.insertRow(tableRows.length, copyData.length - (tableRows.length - top));
    }
    /* end */

    this.actions.pasteExcelData(copyData);
  }

  undo = (count) => {
    this.props.undo(count);
  }
  redo = (count) => {
    this.props.redo(count);
  }
  getRowKey(rowIndex) {
    return rowIndex;
  }
  // 是表格可以拖动
  tableBlockMouseDown = (e) => {
    // tableBlock.drag = true;
    // tableBlock.diffX = e.pageX - this.model.position.x;
    // tableBlock.diffY = e.pageY - this.model.position.y;
  };

  // 监控鼠标移动
  tableMouseMove = (e) => {
    const nodeName = e.target.nodeName;
    if (nodeName === 'INPUT' || nodeName === 'TEXTAREA' || this.model.editingCell) {
      return;
    }
    e.preventDefault();
    if (tableBlock.drag) {
      const tablePositionX = e.pageX - tableBlock.diffX < 0 ? 0 : e.pageX - tableBlock.diffX;
      const tablePositionY = e.pageY - tableBlock.diffY < 0 ? 0 : e.pageY - tableBlock.diffY;

      this.updateTableHeaderPosition({ x: tablePositionX, y: tablePositionY });

      this.actions.tableMoving(tablePositionX, tablePositionY);
      this.lazyLoad();
    }
  };

  tableMouseUp = (e) => {
    if (tableBlock.drag === true) {
      tableBlock.drag = false;
      this.actions.tableMoved();
    }
  };

  cellSelect = (coordinate, role) => {
    const tableSelect = this.model.tableSelect()[role];
    const has = tableSelect.has(coordinate);
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

    this.updateBudgetTreeFieldFlatList && this.updateBudgetTreeFieldFlatList('up')//向上
    // this.actions.updateBudgetTreeFieldFlatList();
    this.actions.insertRowUp();
  };

  insertRowDown = () => {
    this.updateBudgetTreeFieldFlatList && this.updateBudgetTreeFieldFlatList('down')//向下
    this.actions.insertRowDown();
  };

  insertColumnLeft = () => {
    this.actions.insertColumnLeft();
  };

  insertColumnRight = () => {
    this.actions.insertColumnRight();
  };

  removeRows = () => {
    this.actions.removeRows();
  }

  removeColumns = () => {
    this.actions.removeColumns();
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
    this.props.removeTable();
  };
  showDeleteModal = (type) => {
    if (type === 'delete') {
      this.state.modalTitle = '删除表格';
      this.state.modalData = (<p>确定要删除这个表格吗?</p>);
      this.state.modalOnOK = this.handleRemoveTable;
    } else if (type === 'deleteCell') {
      this.state.modalTitle = '删除';
      this.state.modalData = '确实要删除选中的单元格吗？';
      this.state.modalOnOK = this.deleteSelectedCell;
    }
    this.setState({ visible: true });
  };

  hideModal = () => {
    this.setState({ visible: false });
  };
  // 增加显示所有数据集功能 by liuran
  showAllAnalysisModels = () => {
    // console.log(this.props.sheet.present)
    let allModels = [];
    const { tableRows, rowProps } = this.props.sheet.present;
    const allModelsId = Array.from(new Set(rowProps.filter(item => item.analysisModelId).map(item => item.analysisModelId).join(',').split(',')));
    // console.log(allModelsId)
    // const url = "/finance/bi/analysismodel/getParentCategoryName/" + allModelsId.join(',');
    const url = "http://192.168.16.229:9001/bi/analysismodel/getParentCategoryName/" + allModelsId.join(',');
    axios.get(url)
      .then((response) => {
        console.log(response)
      });
    for (let i = 0, j = tableRows.length; i < j; i++) {
      const row = tableRows[i];
      for (let m = 0, n = row.length; m < n; m++) {
        const analysisModelId = row[m].textBox.analysisModelId;
        if (analysisModelId) {
          const modelIndex = allModels.findIndex(item => item.key === analysisModelId);
          if (modelIndex !== -1) {
            allModels[modelIndex]['children'].push({ key: `(${i},${m})`, title: `${addressConverter.columnNumberToName(m + 1)}${i + 1}: ${row[m].textBox.value}`, children: [] });
          }
          else {
            allModels.push({ key: analysisModelId, title: analysisModelId, children: [{ key: `(${i},${m})`, title: `${addressConverter.columnNumberToName(m + 1)}${i + 1}: ${row[m].textBox.value}`, children: [] }] });
          }
        }
        else {

        }
      }
    }
    this.setState({ allModelsModal: { show: true, models: allModels } })

  }
  //end
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
    const fontInfo = this.props.selectedCellFontInfo;
    const isBold = fontInfo.fontWeight.toLowerCase() == 'bold';
    this.updateCellStyle({ fontInfo: { fontWeight: isBold ? 'Normal' : 'Bold' } });
  }
  updateCellStyle = (style) => {
    this.actions.updateCellStyle(style);
  }
  setCellItalic = () => {
    const fontInfo = this.props.selectedCellFontInfo;
    const isItalic = fontInfo.fontType.toLowerCase() == 'italic';
    this.updateCellStyle({ fontInfo: { fontType: isItalic ? 'Normal' : 'Italic' } });
  }
  setCellUnderline = () => {
    const fontInfo = this.props.selectedCellFontInfo;
    const isUnderline = fontInfo.fontDecoration.toLowerCase() == 'underline';
    this.updateCellStyle({ fontInfo: { fontDecoration: isUnderline ? 'Normal' : 'UnderLine' } });
  }
  onFormatBrushClick = () => {
    const cellSelect = this.model.tableSelect().tableHeader;
    if (cellSelect.size === 0) {
      Message.warning('请选择单元格');
      return;
    }
    this.actions.brush();
  }
  deleteSelectedCell = () => {
    if (this.model.selectedRanges) {
      this.actions.deleteCells();
      this.setState({ visible: false });
    }
  }
  clearSelectedCellContent = () => {
    if (this.model.selectedRanges) {
      this.actions.deleteCells(true);
      this.setState({ visible: false });
    }
  }
  get input() {
    return this._input;
  }
  beginEdit(top, left, clearValue) {
    if (this.model.editingCell) {
      return;
    }
    this.actions.beginEdit(top, left);
    let input = this.input;
    if (input) {
      const text = this.model.getTextBoxValue(top, left) || '';
      if (clearValue) {
        input.innerText = '';
      } else {
        input.innerText = text;
        selectText(input);
      }
      input.focus();
    }
  }
  focusInput = () => {
    if (this.input) {
      this.input.focus();
    } else if (this.gird) {
      this.grid.focus();
    }
  }
  handleInputKeyPress = ({ top, left }) => {
    // console.log('PPP');
    // if (this.model.editingCell) {
    //   return;
    // }
    // this.actions.beginEdit(top, left);
  }
  handleInputBlur = () => {
    if (!this.model.editingCell) {
      return;
    }
    const { row, col } = this.model.editingCell;
    this.actions.setCurrentCellDisabled && this.actions.setCurrentCellDisabled(row, col, this.input.innerText)
    console.log(this.input.innerText)
    this.actions.commitEdit(row, col, this.input.innerText);
    this.input.innerText = '';
  }
  renderInput = ({ calcHeight, calcWidth }) => {
    const { tableRows, selectedRanges, editingCell } = this.model;
    if (!selectedRanges || selectedRanges.length === 0) {
      return null;
    }
    const selection = selectedRanges[selectedRanges.length - 1];
    const { top, left } = selection.primary || { top: selection.top, left: selection.left };
    const cell = tableRows[top][left];
    const width = editingCell ? calcWidth(left, cell.colspan) - 4 : 1;
    const height = editingCell ? undefined : 1;
    const minHeight = editingCell ? calcHeight(top, cell.rowspan) - 4 : undefined;
    const padding = editingCell ? 2 : 0;
    const textBoxFontInfoStyle = getTextBoxFontInfoStyle(cell, defaultTextBox, 'pt');
    const leftPx = editingCell ? calcWidth(0, left) + 2 : calcWidth(0, left);
    const topPx = editingCell ? calcHeight(0, top) + 2 : calcHeight(0, top);
    return (
      <div ref={r => this._input = r}
        className="ewa-gridKeyHandler textbox-for-table"
        contentEditable="true"
        role="textbox"
        spellCheck="false"
        autoComplete="false"
        autoCorrect="off"
        tabIndex="0"
        id="gridKeyboardContentEditable"
        key="gridKeyboardContentEditable"
        style={{
          ...textBoxFontInfoStyle,
          display: '',
          textAlign: 'left',
          position: 'absolute',
          left: leftPx,
          top: topPx,
          width,
          height,
          minHeight,
          padding: 0,
          outline: 'none',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          display: 'inline-block',
          overflow: 'hidden',
        }}
        // onKeyPress={() => this.handleInputKeyPress({ top, left })}
        // onKeyDown={e => console.log('down', e)}
        // onInput={e => console.log('input', e)}
        // onCompositionStartCapture={e => console.log('capture', e)}
        // onCompositionStart={e => console.log('start', e)}
        onBlur={this.handleInputBlur}
      ></div>
    );
  }
  isCellDisplay = (row, col) => {
    const { tableRows, rowProps, colProps } = this.model;
    const rowProp = rowProps[row];
    const colProp = colProps[col];
    if (this.model.isRuntime) {
      return tableRows[row][col].display === 1
        && (!rowProp || !rowProp.isHidden)
        && (!colProp || !colProp.isHidden);
    } else {
      return tableRows[row][col].display === 1;
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
          newCol--;
        } else if (newRow === 0) {
          isFocus = false;
        } else {
          newRow--;
          newCol = colCount - 1;
        }
      } else if (direct === 1) {
        if (newRow === 0) {
          isFocus = false;
        } else {
          newRow--;
        }
      } else if (direct === 2) {
        if (newCol < colCount - 1) {
          newCol++;
        } else if (newRow < tableArray.length - 1) {
          newRow++;
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
      if (this.isCellDisplay(newRow, newCol)) {
        break;
      }
    }
    this.focusInput();
    if (isFocus === true) {
      this.actions.selectCell(newRow, newCol);
      this.forceCurrentCellVisible(rowID, colID, newRow, newCol);
      if (edit) {
        this.beginEdit(newRow, newCol);
      }
    }
  }
  onKeyPress = (ev) => {
    // if (!this.model.editingCell && !ev.ctrlKey && !ev.altKey) {
    //   const { selectedRanges } = this.model;
    //   if (selectedRanges && selectedRanges.length > 0) {
    //     const selection = selectedRanges[selectedRanges.length - 1];
    //     if (selection.primary) {
    //       this.beginEdit(selection.primary.top, selection.primary.left);
    //     } else {
    //       this.beginEdit(selection.top, selection.left);
    //     }
    //   }
    // }
  }
  onKeyDown = (ev, newKeycode) => {
    // console.log({ ev })
    // console.log('onKeyDown', ev.key, ev.keyCode, typeof ev.key);
    const key = ev.key.toLowerCase();
    const keyCode = newKeycode || ev.keyCode || ev.which;

    if (!this.model.editingCell) {
      if (keyCode === 9 || keyCode === 13 || (keyCode >= 37 && keyCode <= 40)) {
        // ev.preventDefault();
        ev.stopPropagation();
        let direct;
        if (keyCode === 9) {
          direct = ev.shiftKey === true ? 0 : 2;
        } else if (keyCode === 13) {
          direct = 3;
        } else if (keyCode === 37 || keyCode === 38 || keyCode === 39 || keyCode === 40) {
          direct = keyCode - 37;
        }
        let p;
        let role;
        for (const r of roleArray) {
          if (this.model.tableSelect()[r].size > 0) {
            p = SpreatsheetUtil.getStartPointFromSet(this.model.tableSelect()[r]);
            role = r;
            break;
          }
        }
        if (!p) return;
        const cellInfo = { role, rowID: p.row, colID: p.col };
        this.selectCell(cellInfo, direct, false);
      } else if (keyCode === 8 || keyCode === 46) {
        this.clearSelectedCellContent();
      } else if (keyCode === 27) {
        this.actions.clearMark();
      } else if (ev.ctrlKey === true) {
        if (keyCode === 88) {
          this.cutSelectedCell();
        } else if (keyCode === 67) {
          this.copySelectedCell();
        } else if (keyCode === 86) {
          // 统一通过 paste 事件来处理
          // this.pasteSelectedCell();
        } else if (key === 'z') {
          this.undo();
        } else if (key === 'y') {
          this.redo();
        }
      } else if (!ev.ctrlKey && !ev.altKey && !ev.metaKey && (keyCode === 113 // F2
        || (keyCode >= 48 && keyCode <= 57) // 主键盘数字键（包含特殊字符）
        || (keyCode >= 96 && keyCode <= 111 && keyCode !== 108) // 小键盘 0 - / 除了 Enter
        || (keyCode >= 65 && keyCode <= 90) // 英文字母
        || (keyCode >= 186 && keyCode <= 192)
        || (keyCode >= 219 && keyCode <= 222)
        || keyCode === 229 // 输入法？?
      )) {
        const { selectedRanges } = this.model;
        if (selectedRanges && selectedRanges.length > 0) {
          const selection = selectedRanges[selectedRanges.length - 1];
          const { top, left } = selection.primary || { top: selection.top, left: selection.left };
          if (this.input) {
            this.input.style.width = '2px';
            this.input.style.height = '2px';
          }
          this.beginEdit(top, left, true);
        }
      }
    } else {
      let p = this.model.editingCell;
      let arrowskeyCode = keyCode == 37 || keyCode == 38 || keyCode == 39 || keyCode == 40;
      if (keyCode === 9 || keyCode === 13) {
        ev.preventDefault();
        const value = this.input.innerText;
        this.actions.setCurrentCellDisabled && this.actions.setCurrentCellDisabled(p.row, p.col, value)


        this.actions.commitEdit(p.row, p.col, value);
        this.input.innerText = '';
        this.focusInput();

        let direct = 3;
        if (keyCode === 9) {
          direct = ev.shiftKey ? 0 : 2;
        }
        const cellInfo = { rowID: p.row, colID: p.col };
        this.selectCell(cellInfo, direct, false);

      } else if (keyCode === 27) {
        // Esc
        this.actions.cancelEdit();
        this.input.innerText = '';
        this.focusInput();
      } else if (arrowskeyCode) {
        // ev.preventDefault();
        // const value = this.input.innerText;
        // this.actions.setCurrentCellDisabled && this.actions.setCurrentCellDisabled(p.row, p.cil, value)

        // this.actions.commitEdit(p.row, p.col, value);
        // this.input.innerText = '';
        // this.focusInput();
        // this.onKeyDown(ev, keyCode);
      }
    }
  }
  exportExcel = () => {
    const that = this;
    function downloadCb(blob) {
      console.log(that.props)
      const fileName = `${that.props.reportName}.xlsx`;
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        // If IE, you must uses a different method.
        window.navigator.msSaveOrOpenBlob(blob, fileName);
      } else {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    }
    const exportExcel = this.model.exportExcel.bind(this.model) || createSpreadsheet().exportExcel.bind(this.model);
    //    this.model.exportExcel(downloadCb);
    exportExcel(downloadCb)
  }
  handleOpenFile = (e) => {
    const files = e.target.files;
    if (files.length === 0) {
      return;
    }
    const file = files[0];
    console.log('打开文件', file);
    if (file.name.indexOf('.xml') > 0) {
      uploadxml(file, this.props.reportName).catch(err => {
        throw new Error('服务器错误：' + err.msg);
      }).then((json) => {
        if (!json) throw new Error('服务器返回数据为空');
        this.dvaActions.loadTableJson({ json });
        Message.success('导入成功');
      }).catch((err) => {
        Message.warning('导入失败，' + err.message);
      });
    } else {
      this.props.loadExcelFile(file, this.refs.sheetSelectDialog, this.refs.importIndexesDialog, this.props.reportName);
    }
    e.target.value = '';
  }
  importExcel = () => {
    this.refs['excelInput'].click();
    // const that = this;
    // const fileElement = document.createElement('input');
    // fileElement.type = 'file';
    // fileElement.accept = '.xlsx';
    // fileElement.addEventListener('change', (e) => {
    //   const file = e.target.files[0];
    //   this.model.importExcel(file, workbook => this.actions.loadWorkbook(workbook));
    // }, false);
    // fileElement.click();
  }

  onClickHandleDiv() {
    console.log('选中表格');
    this.actions.selectTable();
  }
  sumRange(array, start, end) {
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
  setAlignTop = () => {
    this.actions.updateCellVerticalAlign('Top');
  }
  setAlignMiddle = () => {
    this.actions.updateCellVerticalAlign('Middle');
  }
  setAlignBottom = () => {
    this.actions.updateCellVerticalAlign('Bottom');
  }
  setAlign = (align) => {
    this.actions.updateCellAlign(align);
  };
  getUndoTip = () => {
    const { past } = this.props.sheet;
    if (past && past.length > 0) {
      return `撤销 ${past[past.length - 1].description}`;
    }
  };
  getRedoTip = () => {
    const { future } = this.props.sheet;
    if (future && future.length > 0) {
      return `恢复 ${future[future.length - 1].description}`;
    }
  };

  handleMouseSelectStart = (row, col, e) => {
    const { rowProps, colProps } = this.props.sheet.present;
    if (e.shiftKey) {
      this.actions.selectRectTo(row, col);
    } else {
      if (rowProps && rowProps[row] && (rowProps[row].dimensionData || rowProps[row].rowType === 'float')
        && colProps && colProps[col] && colProps[col].extendProp && this.model.isRuntime && colProps[col].extendProp.type !== 'userDefine') {
        const { extendProp } = colProps[col];
        if (extendProp.userDic || extendProp.dictionary) {
          this.actions.clearSelectCell();
          return;
        }
      }
      else {
        this.actions.selectCell(row, col, e.ctrlKey || e.metaKey);
      }
    }
  }
  handleMouseSelectChange = (start, target) => this.actions.selectRect(start, target);
  handleMouseSelectEnd = () => {
    // 框选结束后刷格式
    if (this.model.mark && this.model.mark.type === 'brush') {
      this.actions.pasteStyle();
    }
    if (!this.model.selectedRanges) return;
    const coordinate = this.model.selectedRanges[0].primary;
    const { top, left } = coordinate;
    const selectCell = this.props.sheet.present.tableRows[top][left];
    const { reportName, pageParams } = this.props;
    if (selectCell.id && this.model.indexMap && this.model.indexMap[selectCell.id]) {
      const data = JSON.stringify({
        remark: `${reportName}—>${this.model.indexMap[selectCell.id].name}`,
        reportId: pageParams.reportId,
        indexId: selectCell.id,
      });
      console.log(data);
      window.parent.postMessage(data, '*');
    }
    this.focusInput();
  };

  handleBeginEdit = ({ rowIndex, columnIndex }) => {
    if (!this.model.tableRows[rowIndex][columnIndex].disabled) {
      this.beginEdit(rowIndex, columnIndex);
    }
  };
  handleCommitEdit = ({ rowIndex, columnIndex }, value) => {
    this.actions.setCurrentCellDisabled && this.actions.setCurrentCellDisabled(rowIndex, columnIndex, value)
    this.actions.commitEdit(rowIndex, columnIndex, value);
  };

  handleTextBoxDrop = ({ rowIndex, columnIndex }, ev) => {
    // ev.preventDefault();
    pauseEvent(ev)
    let textGetData = ev.dataTransfer.getData('text');
    if (!textGetData && localStorage.getItem('budgetTreeDragData')) {
      textGetData = localStorage.getItem('budgetTreeDragData')
    }
    const dragData = JSON.parse(textGetData);

    if (dragData.dragType === 'field') {
      // 拖字段
      this.actions.onFieldDrop(rowIndex, columnIndex, dragData);
      return;
    } else if (dragData.dragType === 'dimensionSpecificVal') {
      this.actions.onDimensionDrop(rowIndex, columnIndex, dragData);
      return;
    } else if (dragData.dragType === 'budgetMeasure') {
      // 预算度量
      this.props.dispatch({ type: 'Spreadsheet/onBudgetMeasureDrop', rowIndex, columnIndex, dragData });
      return;
    } if (dragData.dragType === 'budgetDimension') {
      // 预算维度
      this.props.dispatch({ type: 'Spreadsheet/onBudgetDimensionDrop', rowIndex, columnIndex, dragData });
      return;
    }
    if (dragData.dragType === 'budgetDimensionTree') {
      // 预算树维度
      this.props.dispatch({ type: 'Spreadsheet/onBudgetDimensionTreeDrop', rowIndex, columnIndex, dragData });
      return;
    }

    const { indexName: name, type, id, code } = dragData;
    if (!name) {
      return;
    }
    // OES 拖指标
    if (type === '2') {
      this.actions.fillIndex(rowIndex, columnIndex, { id, name, code });
    } else {
      const text = `=Indexes.${name}.Value`;
      this.actions.setCellText(rowIndex, columnIndex, text);
    }
  };
  handleColumnResizing = (...args) => {
    isResizing = true;
    this.actions.columnResizing(...args);
  };
  handleColumnResized = () => {
    isResizing = false;
    this.actions.columnResized();
  }
  handleRowResizing = (...args) => {
    isResizing = true;
    this.actions.rowResizing(...args);
  };
  handleRowResized = () => {
    isResizing = false;
    this.actions.rowResized();
  };
  handleSelectionDragDrop = (target) => {
    this.actions.exchangeSelection(target);
  }
  // 按单元格的数据类型，和格式样式，格式化显示值。
  formatCellValue = (textBox) => {
    // 公式在设计期不需要格式化
    if (typeof textBox.value === 'string' && textBox.value.trim().indexOf('=') === 0) {
      return textBox.value;
    }
    const value = textBox.value;
    if (parseFloat(value) === 0) {
      const { zeroAs } = this.props.sheet.present;
      if (!zeroAs || zeroAs === 'default') {
        // do nothing here
      } else if (zeroAs === 'null') {
        textBox = { ...textBox, value: '' };
      } else {
        textBox = { ...textBox, value: zeroAs };
      }
    }
    try {
      return PropertyUtils.conversionFormat(textBox.value, textBox.formatObject);
    } catch (err) {
      return textBox.value;
    }
  };
  renderCellContent({ rowIndex, columnIndex, cell, width, height, editingCell, title }) {
    const isCurrentEditing = editingCell && editingCell.row === rowIndex && editingCell.col === columnIndex;
    if (isCurrentEditing) {
      // 输入框不由 TextBox 来渲染
      return;
    }
    let textBox = cell.textBox;
    if (!this.model.showFormula
      && cell.id
      && !isCurrentEditing) {
      const { indexMap } = this.model;
      if (indexMap && indexMap[cell.id]) {
        const { code, name } = indexMap[cell.id];
        textBox = { ...textBox, value: `[${name}]` };
      }
    }
    const { sheet } = this.props;
    const { colProps } = sheet.present;
    return (
      <TextBox
        textBox={textBox}
        cell={cell}
        defaultTextBox={defaultTextBox}
        format={this.formatCellValue}
        {...{ rowIndex, columnIndex, width, height }}
        onDrop={this.handleTextBoxDrop}
        onBeginEdit={this.handleBeginEdit}
        onCommitEdit={this.handleCommitEdit}
        // isEditing={isCurrentEditing}
        fontSizeUnit='pt'
        className={(cell.disabled || colProps[columnIndex].disabled) ? 'cell-disabled' : undefined
        }
        title={title}
        treeClick={this.treeClick}
      />
    );
  }
  treeClick = ({ rowIndex, columnIndex }) => {
    this.actions.treeClick ? this.actions.treeClick(rowIndex, columnIndex) : this.props.sheet.treeClick(rowIndex, columnIndex)
  }
  hideDimension = () => {
    this.setState({
      showDimension: false,
      selectRowIndex: undefined,
      selectColumnIndex: undefined,
      bindDimensionDataKey: undefined,
      bindDimDisplay: undefined,
      floatRowDimensionCondition: undefined,
    })
  }

  handleBindDimension = (e) => {
    this.setState({
      bindDimensionValue: e
    })
  }

  bindDimension = (dimensionList, isAddRow) => {
    const { selectRowIndex, selectColumnIndex, bindDimensionValue, dimensionValue } = this.state;
    if (dimensionList) {
      this.actions.bindDimensionValue(selectRowIndex, selectColumnIndex, dimensionList, isAddRow);
      this.props.dispatch({ type: 'BudgetRuntime/bindDimensionFXChange', dispatch: this.props.dispatch, rowIndex: selectRowIndex });
      this.props.dispatch({ type: 'BudgetRuntime/orderSheetTemp', dispatch: this.props.dispatch });
    }
    this.hideDimension();
  }

  cancelBind = () => {
    const { selectRowIndex, selectColumnIndex } = this.state;
    if (selectRowIndex) {
      this.actions.cancelBindDimensionvaule(selectRowIndex, selectColumnIndex);
    }
    this.hideDimension();
  }

  renderCellExtra({ rowIndex, columnIndex, cell, editingCell }, icon) {
    // if (cell.isUserIndex !== 'y') {
    //   return;
    // }
    if (editingCell && editingCell.row === rowIndex && editingCell.col === columnIndex) {
      return;
    }
    if (!icon) {
      return;
    }
    return (
      <div className='spreadsheet-little-icon' style={{
        position: "absolute",
        right: -2, top: -5,
        // padding: '2px',
        fontSize: 10,
        fontFamily: 'SimSun',
        color: '#999',
        pointerEvents: 'none',
        transform: 'scale(0.7)'
      }}>{icon}</div>
    );
  }
  handleGridLoad = (grid) => {
    // 监听尺寸变化
    const elementResizeDetectorMaker = require('element-resize-detector');
    const erd = elementResizeDetectorMaker();
    const that = this;
    erd.listenTo(grid, (element) => {
      that.lazyLoad();
    });

    this.grid = grid;
    // this.lazyLoad();

    //覆盖浏览器粘贴事件
    this.grid.addEventListener('paste', this.handlePaste);
    this.grid.addEventListener('copy', this.handleCopy);
  };
  onScroll = (ev) => {
    if (ev.target !== this.refs['canvas']) return;
    this.updateTableHeaderPosition(this.model.position, window.$(ev.target));
    const e = ev || window.event;
    const scrollLeft = this.refs.canvas.scrollLeft;
    const scrollTop = this.refs.canvas.scrollTop;
    this.setState({ scrollLeft, scrollTop });
    this.lazyLoad(e);
  }
  updateTableHeaderPosition = (position, parent) => {
    const columnHeader = parent.find('#table-columns');
    const tableHandle = parent.find('#table-handle');
    const colDist = this.refs.canvas.scrollTop - position.y;
    if (colDist > 0) {
      columnHeader.css('top', `${colDist}px`);
      tableHandle.css('top', `${colDist}px`);
      tableHandle.css('z-index', '10');
    } else {
      columnHeader.css('top', '');
      tableHandle.css('top', '')
    }
    const rowHeader = parent.find('#table-rows');
    const rowDist = this.refs.canvas.scrollLeft - position.x;
    if (rowDist > 0) {
      rowHeader.css('left', `${rowDist}px`);
      tableHandle.css('left', `${rowDist}px`);
      tableHandle.css('z-index', '10');
    } else {
      rowHeader.css('left', '');
      tableHandle.css('left', '');
    }
  }
  lazyLoad = (ev) => {
    this.setState(state => {
      const { widths, heights } = this.model;
      const renderRange = getRenderRange(this.grid, this.refs.canvas, widths, heights);
      if (!renderRange) {
        return;
      }
      if (!isRangeEqual(state.renderRange, renderRange)) {
        return { renderRange };
      }
    });
  };

  getRowHeaderWidth() {
    let rowHeaderWidth = 30;
    const numLength = this.model.heights.length.toString().length;
    if (numLength > 3) {
      rowHeaderWidth += (numLength - 3) * 7;
    }
    return rowHeaderWidth;
  }

  forceCurrentCellVisible = (rowID, colID, newRow, newCol) => {
    const canvasScrollLeft = this.refs.canvas.scrollLeft;
    const canvasScrollTop = this.refs.canvas.scrollTop;
    const rowHeaderWidth = this.getRowHeaderWidth();

    let scrollLeft = newCol === colID ? -1 : canvasScrollLeft;
    let scrollTop = newRow === rowID ? -1 : canvasScrollTop;

    const cellLeftBound = this.model.widths.slice(0, newCol).reduce((sum, item) => {
      return sum + item;
    }, this.model.position.x + rowHeaderWidth);
    const cellRightBound = cellLeftBound + this.model.widths[newCol];

    if (cellLeftBound - rowHeaderWidth < canvasScrollLeft) {
      scrollLeft = cellLeftBound - rowHeaderWidth;
    } else if (cellRightBound > canvasScrollLeft + this.refs.canvas.clientWidth) {
      scrollLeft = cellRightBound - this.refs.canvas.clientWidth;
    }

    const cellTopBound = this.model.heights.slice(0, newRow).reduce((sum, item) => {
      return sum + item;
    }, this.model.position.y + 31);
    const cellBottomBound = cellTopBound + this.model.heights[newRow];

    if (cellTopBound - 31 < canvasScrollTop) {
      scrollTop = cellTopBound - 31;
    } else if (cellBottomBound > canvasScrollTop + this.refs.canvas.clientHeight) {
      scrollTop = cellBottomBound - this.refs.canvas.clientHeight;
    }

    if (scrollLeft >= 0 || scrollTop >= 0) {
      this.forceUpdate(() => {
        if (newRow !== rowID) {
          this.refs.canvas.scrollTop = scrollTop;
        }
        if (newCol !== colID) {
          this.refs.canvas.scrollLeft = scrollLeft;
        }
      });
    }
  }
  handleReplaceAll = ({ search, replacement, range }) => {
    this.actions.replaceAll(search, replacement, range);
  }
  handleUpload = (rowIndex, attachmentInfo) => {
    if (rowIndex >= 0) {
      this.actions.uploadAttachment(rowIndex, attachmentInfo);
      this.props.dispatch({ type: 'BudgetRuntime/saveData' });
    }
  }
  showFormulaModal = (type) => {
    const { selectedRanges } = this.model;
    if (selectedRanges && selectedRanges.length === 1) {
      const { left, top } = selectedRanges[0];
      this.setState({ [type]: true, currentCell: { left, top } });
    }
  };
  /* liuran edit start*/
  showExpressionModal = () => {
    const { selectedRanges, rowProps, tableRows } = this.model;
    if (selectedRanges && selectedRanges.length === 1) {
      const { left, top } = selectedRanges[0];
      let { analysisModelId } = rowProps[top] || [];
      const cellAnalysisModelId = tableRows[top][left].textBox.analysisModelId;
      const formula = tableRows[top][left].textBox.formula;
      if (analysisModelId) {
        const url = `${isHttpPublic}analysismodel/getMultiAssociateInfo/${analysisModelId}`;
        axios.get(url)
          .then((response) => {
            const tables = response.data.data;
            this.setState({ expressionModal: { show: true, cellAnalysisModelId, tables, formula }, currentCell: { left, top } });
          });
      }
      else {
        if (this.model.analysisModelID) {
          const url = `${isHttpPublic}analysismodel/getMultiAssociateInfo/${this.model.analysisModelID}`;
          axios.get(url)
            .then((response) => {
              const tables = response.data.data;
              this.setState({ expressionModal: { show: true, cellAnalysisModelId, tables, formula }, currentCell: { left, top } });
            });
        }
        else {
          message.warning('请选择分析模型！')
        }
      }
    }
  }
  expressionModalHandle = (value) => {
    const { expressionModal } = JSON.parse(JSON.stringify(this.state));
    if (value) {
      this.props.dispatch({
        type: 'Spreadsheet/addFormulaExpression',
        value
      })
    }
    expressionModal.show = false;
    this.setState({ expressionModal });
  }
  /* liuran edit end*/

  /* liuran edit start*/
  //增加维度属性选择弹出框
  showDimensionModal = () => {
    const { dimensionModal } = JSON.parse(JSON.stringify(this.state));
    dimensionModal.show = true;
    dimensionModal.data = this.props.selectedCell.extendProp || this.props.selectedCell.dimProp;
    this.setState({ dimensionModal });
  }
  dimensionModalHandle = (data) => {
    const { dimensionModal } = JSON.parse(JSON.stringify(this.state));
    if (data) {
      if (data.dimID) {
        this.actions.updateDimProp(data);
      }
      else {
        this.actions.updateExtendProp(data);
      }
    }
    dimensionModal.show = false;
    this.setState({ dimensionModal });
  }
  /* liuran edit end*/

  /* liuran edit start*/
  //清除单元格维度属性/字典
  delDimensionOrDict = () => {
    this.actions.delDimPropOrExtendProp();
  }
  /* liuran edit end*/
  setupBudgetParameterHandle = (conditions) => {
    if (conditions && conditions.length) {
      this.props.setupConditions(conditions);
    }
    this.setState({ setupBudgetParameterModal: false });
  }
  // 获取浮动行和展开行上的OES指标
  getFloatAndExpandOesIndexes() {
    const { indexMap, tableRows, rowProps } = this.model;
    if (!indexMap) {
      return new Map();
    }
    const map = new Map();
    for (let i = 0; i < rowProps.length; i++) {
      const prop = rowProps[i];
      if (prop.rowType === 'float' || prop.rowType === 'expand') {
        const row = tableRows[i];
        for (const cell of row) {
          if (cell.id) {
            map.set(cell.id, indexMap[cell.id]);
          }
        }
      }
    }
    const array = [];
    for (const [key, item] of map) {
      if (item) {
        array.push({ value: `{${item.name}}`, text: `${item.name}` });
      }
    }
    return array;
  }
  renderFormulaModal() {
    const { formulaModalVisible, currentCell } = this.state;
    if (!formulaModalVisible) {
      return;
    }
    const indexes = this.getFloatAndExpandOesIndexes();
    const categaries = createFormulaCategaries();
    const sum = categaries.find(x => x.title === '函数').children.find(x => x.title === '数学').items.find(x => x.title === 'SUM');

    sum.params.forEach(p => p.datasource = indexes);
    return (<FormulaEditorModal
      title="公式编辑器"
      visible={formulaModalVisible}
      defaultText={this.model.tableRows[currentCell.top][currentCell.left].textBox.value}
      categaries={categaries}
      onOk={(text) => {
        this.setState({ formulaModalVisible: false });
        this.actions.setCurrentCellDisabled && this.actions.setCurrentCellDisabled(currentCell.top, currentCell.left, text)
        this.actions.setCellText(currentCell.top, currentCell.left, text);
      }} onCancel={() => {
        this.setState({ formulaModalVisible: false });
      }} validate={validateWithLexerAndParser(FormulaLexer, FormulaParser, 'exprRoot')}
    />);
  }
  showFunctionModal = () => {
    const { selectedRanges, rowProps, tableRows } = this.model;
    if (selectedRanges && selectedRanges.length === 1) {
      const { left, top } = selectedRanges[0];
      const currentRowProp = rowProps[top];
      let expandRowFields = [];
      if (currentRowProp.rowType == 'expand') {
        tableRows[top].forEach(item => {

          if (item.textBox.value && item.textBox.value.substring && item.textBox.value.substring(0, 8) == '=Fields.') {
            expandRowFields.push(item.textBox.value.substring(1))
          }
        })
      }
      this.setState({ functionModalVisible: true, currentCell: { left, top }, expandRowFields });
    }
  };
  createIndexes = () => {
    this.props.createIndexes(this.refs.importIndexesDialog, this.props.reportName);
  }
  createFloatSumFomula = () => {
    this.actions.createFloatSumFomula();
  }
  renderFunctionModal() {
    const { functionModalVisible, currentCell, expandRowFields } = this.state;
    if (!functionModalVisible) {
      return;
    }

    return (<FunctionModal
      title="导入函数"
      visible={functionModalVisible}
      defaultText={this.model.tableRows[currentCell.top][currentCell.left].textBox.value}
      onOk={(text) => {
        this.setState({ functionModalVisible: false });
        this.actions.setCurrentCellDisabled && this.actions.setCurrentCellDisabled(currentCell.top, currentCell.left, text)
        this.actions.setCellText(currentCell.top, currentCell.left, text);
      }} onCancel={() => {
        this.setState({ functionModalVisible: false });
      }}
      pageParams={this.props.pageParams}
      expandRowFields={expandRowFields}
      validate={validateWithLexerAndParser(FormulaLexer, FormulaParser, 'exprRoot')}
    />);
  }
  renderBudgetSpecialExp() {
    const { budgetFormulaVisible, currentCell } = this.state;
    if (!budgetFormulaVisible) {
      return;
    }
    return (<BudgetFormulaModal
      visible={budgetFormulaVisible}
      acctYear={this.props.pageParams.acctYear}
      width={this.props.pageParams.width}
      height={this.props.pageParams.height}
      defaultText={this.model.tableRows[currentCell.top][currentCell.left].textBox.value}
      budgetExpExplain={this.model.tableRows[currentCell.top][currentCell.left].textBox.formulaDescription}
      onOk={(map) => {
        this.setState({ budgetFormulaVisible: false });
        this.actions.replaceText(currentCell.top, currentCell.left, map.expression, map.ruleDesc);
      }} onCancel={() => {
        this.setState({ budgetFormulaVisible: false });
      }}
    />)
  }
  renderAuditFormulaList() {
    return null;
  }
  renderMenuItemIcon(iconName) {
    return <i className={"icon iconfont " + iconName} style={{ marginRight: 10, fontSize: 14 }} />;
  }
  renderImportButton() {
    return <ToolbarItem onClick={this.importExcel} isHeader title="导入" iconName='icon-BI_daoru' />;
  }
  renderExportButton() {
    return <ToolbarItem onClick={this.exportExcel} title="导出" iconName='icon-BI_daochu' />;
  }
  renderToolbar() {
    const textBox = this.props.selectedCellTextBox;
    const fontStyle = this.props.selectedCellFontInfo;

    let list = [
      {
        onClick: this.cutSelectedCell.bind(this), isHeader: true, title: '剪切', iconName: 'icon-BI-shear', type: 'ToolbarItem'
      },
      {
        onClick: this.copySelectedCell.bind(this), title: '复制', iconName: 'icon-bicopy', type: 'ToolbarItem'
      },
      {
        onClick: this.pasteSelectedCell.bind(this), title: '粘贴', iconName: 'icon-BI-paste', type: 'ToolbarItem'
      },
      {
        onClick: this.deleteSelectedCell.bind(this), title: '删除', iconName: 'icon-BI-bidelete', type: 'ToolbarItem'
      },
      {
        onClick: this.mergeCell.bind(this), title: '合并单元格', iconName: 'icon-merge', isHeader: true, type: 'ToolbarItem'
      },
      {
        onClick: this.splitCell.bind(this), title: '拆分单元格', iconName: 'icon-split', type: 'ToolbarItem'
      },
      {
        type: 'function', cb: this.renderImportButton.bind(this), el: <input ref='excelInput' type='file' accept='.xlsx,.xml' style={{ display: 'none' }} onChange={this.handleOpenFile.bind(this)} />
      },
      {
        type: 'function', cb: this.renderExportButton.bind(this)
      },
      {
        onClick: this.setCellBold.bind(this),
        title: '加粗',
        iconName: 'icon-bold',
        type: 'ToolbarItem',
        isHeader: true,
        checked: (fontStyle && fontStyle.fontWeight.toLowerCase() === 'bold')
      },
      {
        onClick: this.setCellItalic.bind(this),
        title: '倾斜',
        iconName: 'icon-tilt',
        type: 'ToolbarItem',
        checked: (fontStyle && fontStyle.fontType.toLowerCase() === 'italic')
      },
      {
        onClick: this.setCellUnderline.bind(this),
        title: '下划线',
        iconName: 'icon-BI-Underline',
        type: 'ToolbarItem',
        checked: (fontStyle && fontStyle.fontDecoration.toLowerCase() === 'underline')
      },
      {
        onClick: this.onFormatBrushClick.bind(this),
        title: '格式刷',
        iconName: 'icon-BI-brush',
        type: 'ToolbarItem',
        isHeader: true,
        checked: (this.model.mark && this.model.mark.type === 'brush')
      },
      {
        onClick: this.setAlignLeft.bind(this),
        title: '左对齐',
        iconName: 'icon-BI-Left',
        type: 'ToolbarRadioItem',
        isHeader: true,
        current: (textBox && textBox.horizontalAlignment === 'Left')
      },
      {
        onClick: this.setAlignCenter.bind(this),
        title: '居中',
        iconName: 'icon-BI-Verticalcenter',
        type: 'ToolbarRadioItem',
        isHeader: true,
        current: (textBox && textBox.horizontalAlignment === 'Center')
      },
      {
        onClick: this.setAlignRight.bind(this),
        title: '右对齐',
        iconName: 'icon-BI-right',
        type: 'ToolbarRadioItem',
        isHeader: true,
        current: (textBox && textBox.horizontalAlignment === 'Right')
      },
      {
        onClick: this.setAlignTop.bind(this),
        title: '上对齐',
        iconName: 'icon-BI-Aligntopedge',
        type: 'ToolbarRadioItem',
        isHeader: true,
        current: (textBox && textBox.verticalAlignment === 'Top')
      },
      {
        onClick: this.setAlignMiddle.bind(this),
        title: '垂直居中',
        iconName: 'icon-BI-transverse',
        type: 'ToolbarRadioItem',
        current: (textBox && textBox.verticalAlignment === 'Middle')
      },
      {
        onClick: this.setAlignBottom.bind(this),
        title: '下对齐',
        iconName: 'icon-BI-bottomjustify',
        type: 'ToolbarRadioItem',
        current: (textBox && textBox.verticalAlignment === 'Bottom')
      },
      {
        onButtonClick: this.undo.bind(this),
        onSelect: this.undo.bind(this),
        dataSource: this.props.sheet.past,
        buttonTip: this.getUndoTip(),
        listTip: count => `撤销 ${count} 步操作`,
        type: 'BatchSelect',
        childClassName: 'chexiao'
      },
      {
        onButtonClick: this.redo.bind(this),
        onSelect: this.redo.bind(this),
        dataSource: this.props.sheet.future,
        buttonTip: this.getRedoTip(),
        listTip: count => `恢复 ${count} 步操作`,
        type: 'BatchSelect',
        childClassName: 'zhongzuo'
      },
      {
        type: 'function', cb: this.renderExtraToolbarItems.bind(this)
      },
      {
        type: 'function', cb: this.renderAuditFormulaBtn && this.renderAuditFormulaBtn.bind(this)
      },
      {
        type: 'function', cb: this.renderBudgettree && this.renderBudgettree.bind(this)
      }
    ];
    return (<RenderToolbars datas={list} />)
    return (
      <div className="toolbar">


        <BatchSelect
          dataSource={this.props.sheet.past} onButtonClick={this.undo} onSelect={this.undo}
          buttonTip={this.getUndoTip()} listTip={count => `撤销 ${count} 步操作`}
        >
          <i className='icon iconfont icon-BI_chexiao' />
        </BatchSelect>
        <BatchSelect
          dataSource={this.props.sheet.future} onButtonClick={this.redo} onSelect={this.redo}
          buttonTip={this.getRedoTip()} listTip={count => `恢复 ${count} 步操作`}
        >
          <i className='icon iconfont icon-BI_zhongzuo' />
        </BatchSelect>

        {this.renderExtraToolbarItems()}
        {this.renderAuditFormulaBtn && this.renderAuditFormulaBtn()}
      </div>
    );
  }
  renderExtraToolbarItems() {

  }



  renderCellMenu() {
    const isBI = SpreatsheetUtil.isBI();
    const Menu = connectMenu(this.menu_editgrid)((props) => (
      <ContextMenu id={props.id}>
        <MenuItem onClick={this.cutSelectedCell}>
          剪切
        </MenuItem>
        <MenuItem onClick={this.copySelectedCell}>
          复制
        </MenuItem>
        <MenuItem onClick={this.pasteSelectedCell}>
          粘贴
        </MenuItem>
        <MenuItem onClick={this.showFormulaModal.bind(this, 'formulaModalVisible')}>
          公式
        </MenuItem>
        {/* <MenuItem onClick={this.showFormulaModal.bind(this, 'budgetFormulaVisible')}>
          预算样表公式
        </MenuItem> */}
        {/* <MenuItem onClick={this.showExpressionModal}>
          编辑表达式
        </MenuItem> */}
        <MenuItem onClick={this.deleteSelectedCell}>
          删除单元格
        </MenuItem>
        <MenuItem onClick={this.clearSelectedCellContent}>
          清除内容
        </MenuItem>
        {/* {!isBI && <MenuItem onClick={this.showFunctionModal}>
          函数
        </MenuItem>} */}
        {/* <MenuItem>
            动作
          </MenuItem> */}
        <MenuItem onClick={() => this.setState({ replaceModalVisible: true })}>
          替换
        </MenuItem>
        {/* {!isBI && <MenuItem onClick={this.createIndexes}>
          创建指标
        </MenuItem>}
        {!isBI && <MenuItem onClick={this.createFloatSumFomula}>
          浮动行小计
        </MenuItem>} */}
      </ContextMenu>
    ));
    return <Menu />;
  }
  renderTableMenu() {
    const Menu = connectMenu('menu_table')((props) => (
      <ContextMenu id={props.id}>
        <MenuItem onClick={this.selectAllCell}>
          <svg className="icon" aria-hidden="true"
            style={{ width: "16.6px", height: "16.6px", marginRight: 10, verticalAlign: 'middle' }}>
            <use xlinkHref="#icon-all1"></use>
          </svg>
          全选
        </MenuItem>
        <MenuItem onClick={this.showDeleteModal.bind(this, 'delete')}>
          {this.renderMenuItemIcon('icon-shanchubiaoge')}
          删除表格
        </MenuItem>
      </ContextMenu>
    ));
    return <Menu />;
  }
  async showRowHeightDialog() {
    const selection = this.model.selectedRanges.find(selection => selection.type === 'row');
    if (!selection) return;
    const index = selection.top;
    const result = await this.refs['rowHeightDialog'].openDialog({ number: this.model.heights[index], title: '行高' });
    if (!result) return;
    this.actions.rowResizing(index, result);
    this.actions.rowResized();
  }
  async showColWidthDialog() {
    const selection = this.model.selectedRanges.find(selection => selection.type === 'col');
    if (!selection) return;
    const index = selection.left;
    const result = await this.refs['rowHeightDialog'].openDialog({ number: this.model.widths[index], title: '列宽' });
    if (!result) return;
    this.actions.columnResizing(index, result);
    this.actions.columnResized();
  }
  clearAnalysisModel = () => {
    this.actions.clearAnalysisModel();
  }
  setFrozenRow = () => {
    this.actions.setFrozenRow();
  }
  clearFrozenRow = () => {
    this.actions.clearFrozenRow();
  }
  setFrozenCol = () => {
    this.actions.setFrozenCol();
  }
  clearFrozenCol = () => {
    this.actions.clearFrozenCol();
  }
  setTableHeader = () => {
    this.actions.setTableHeader();
  }
  setTableFooter = () => {
    this.actions.setTableFooter();
  }
  cancelTableHeaderOrFooter = () => {
    this.actions.cancelTableHeaderOrFooter();
  }
  renderRowMenu() {
    const Menu = connectMenu(this.menu_row)((props) => (
      <ContextMenu id={props.id}>
        <MenuItem onClick={this.insertRowUp}>
          {this.renderMenuItemIcon('icon-xiangshangcharuhang')}
          向上插入行
        </MenuItem>
        <MenuItem onClick={this.insertRowDown}>
          {this.renderMenuItemIcon('icon-xiangxiacharuhang')}
          向下插入行
        </MenuItem>
        <MenuItem onClick={this.removeRows}>
          {this.renderMenuItemIcon('icon-shanchuhang')}
          删除行
        </MenuItem>
        <MenuItem onClick={this.setFrozenRow}>
          冻结到此行
        </MenuItem>
        <MenuItem onClick={this.clearFrozenRow}>
          取消冻结行
        </MenuItem>
        <MenuItem onClick={this.showRowHeightDialog.bind(this)}>
          行高
        </MenuItem>
        <MenuItem onClick={this.clearAnalysisModel}>
          清除分析模型
        </MenuItem>
        {/* <MenuItem onClick={() => this.setState({ attachmentModalVisible: true })}>
          附件
        </MenuItem> */}
      </ContextMenu>
    ));
    return <Menu />;
  }
  renderColMenu() {
    const Menu = connectMenu(this.menu_column)((props) => (
      <ContextMenu id={props.id}>
        <MenuItem onClick={this.insertColumnLeft}>
          {this.renderMenuItemIcon('icon-xiangzuocharulie')}
          向左插入列
          </MenuItem>
        <MenuItem onClick={this.insertColumnRight}>
          {this.renderMenuItemIcon('icon-xiangyoucharulie')}
          向右插入列
          </MenuItem>
        <MenuItem onClick={this.removeColumns}>
          {this.renderMenuItemIcon('icon-shanchulie')}
          删除列
        </MenuItem>
        <MenuItem onClick={this.showColWidthDialog.bind(this)}>
          列宽
        </MenuItem>
        <MenuItem onClick={this.setFrozenCol}>
          冻结到此列
        </MenuItem>
        <MenuItem onClick={this.clearFrozenCol}>
          取消冻结列
        </MenuItem>
      </ContextMenu>
    ));
    return <Menu />;
  }



  renderRowHeader(index) {
    const { rowProps } = this.model;
    let extra;
    // 浮动行标志
    if (rowProps && rowProps[index]) {
      let type, fileType;
      if (rowProps[index].rowType === 'float') {
        type = 'edit';
      } else if (rowProps[index].rowType === 'expand') {
        type = 'bars';
      } else if (rowProps[index].isReportHeader) {
        type = 'icon-header';
      } else if (rowProps[index].isReportFooter) {
        type = 'icon-endoftable';
      }
      if (rowProps[index].attachmentInfo) {
        if (rowProps[index].attachmentInfo.List.length > 0) {
          fileType = 'paper-clip';
        }
      }
      if (type || fileType) {
        extra = (
          <div className='spreadsheet-little-icon' style={{
            position: "absolute",
            right: 0, top: 0,
            fontSize: 10,
            fontFamily: 'SimSun',
            color: 'gray',
            lineHeight: '12px',
            padding: '0 0',
          }}>
            {
              type && (type === 'icon-header' || type === 'icon-endoftable' ? <i style={{ fontSize: 12 }} className={`icon iconfont ${type}`} /> : <Icon type={type} />)
            }
            {
              fileType && (<Icon type={fileType} />)
            }
          </div>
        );
      }
    }
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        {index + 1}
        {extra}
      </div>
    );
  }
  renderExtraElement() {
  }
  renderPageHeader() {
  }


  showDimensionFormulaModal = () => {
    this.setState({
      showDimensionFormulaModal: true
    })
  }

  hideDimensionFormulaModal = () => {
    this.setState({
      showDimensionFormulaModal: false
    })
  }

  comfirm = (value) => {
    const { selectedRanges } = this.props.sheet.present;
    if (!selectedRanges || (selectedRanges && selectedRanges.length > 1)) {
      return;
    }
    this.props.dispatch({
      type: 'Spreadsheet/updateTextBoxDimesionFormula',
      textValue: value
    });
    this.hideDimensionFormulaModal();
  }

  showGatherModal = () => {
    this.setState({
      showGatherModal: true
    })
  }

  hideGatherModal = () => {
    this.setState({
      showGatherModal: false
    })
  }

  confirmGatherExpression = (name, value) => {
    this.props.dispatch({
      type: 'Spreadsheet/addGatherExpression',
      name,
      value
    })
    this.hideGatherModal();
  }
  adjustChange = (value) => {
    let adjustModal = _.cloneDeep(this.state.adjustModal);
    adjustModal.value = value;
    this.setState({ adjustModal });
  }
  adjustModalColumnChange = (value) => {
    let adjustModal = _.cloneDeep(this.state.adjustModal);
    adjustModal.column = value;
    this.setState({ adjustModal });
  }
  handleAdjustModal = (type) => {
    let adjustModal = _.cloneDeep(this.state.adjustModal);
    let adjustValue = 1;
    const { column } = adjustModal;
    if (type) {
      adjustValue = adjustModal.title === '调增' ? (1 + adjustModal.value / 100) : (1 - adjustModal.value / 100);
    }
    adjustModal.visible = false;
    adjustModal.value = 0;
    this.setState({ adjustModal });
    this.props.dispatch({ type: 'BudgetRuntime/adjustData', adjustValue, column: addressConverter.columnNameToNumber(column) });
  }
  copyChange = (value) => {
    let copyModal = _.cloneDeep(this.state.copyModal);
    copyModal.value = value;
    this.setState({ copyModal });
  }
  handleCopyModal = (type) => {
    let copyModal = _.cloneDeep(this.state.copyModal);
    const { copyData, value } = copyModal;
    copyModal.visible = false;
    copyModal.value = undefined;
    copyModal.data = [];
    copyModal.copyData = [];
    this.setState({ copyModal });
    this.props.dispatch({ type: 'BudgetRuntime/copyData', copyData, value });
  }
  closeBottomInfo = () => {
    const state = _.cloneDeep(this.state);
    state.bottomInfo.visible = false;
    this.setState(state);
  }
  changeCheckStatus = () => {
    const state = _.cloneDeep(this.state);
    state.checkStatus = 1;
    this.setState(state);
  }
  showCheckError = (cells) => {
    this.actions.showErrorCells(cells)
    // this.actions.clearSelectCell()
    // for (let i = 0, j = cells.length; i < j; i++) {
    //   this.actions.selectCell(cells[i].row, cells[i].col, true)
    // }
  }
  renderOther() { }
  render() {
    const width = this.model.widths.reduce((sum, item) => {
      return item + sum;
    }, 1);
    const rowHeaderWidth = this.getRowHeaderWidth();
    let dimensionFormulaValue
    if (this.model && this.model.tableRows && this.model.selectedRanges && this.model.selectedRanges[0]) {
      dimensionFormulaValue = this.model.tableRows[this.model.selectedRanges[0].top][this.model.selectedRanges[0].left].textBox.value;
    }
    let height;
    if (this.model.pageDimensions && this.model.pageDimensions.length > 0) {
      height = `calc(100% - ${95 + 30 * (Math.ceil(this.model.pageDimensions.length / 3))}px)`;
    }
    let scrollLeft, scrollTop;
    if (this.refs.canvas) {
      scrollLeft = this.state.scrollLeft;
      scrollTop = this.state.scrollTop;
    }
    return (
      <div
        className="table-wrap"
        onMouseUp={this.tableMouseUp.bind(this)}
        onMouseMove={this.tableMouseMove.bind(this)}
      >
        {/* <Spin spinning={this.props.loading} /> */}
        {this.renderToolbar()}
        {this.renderPageHeader()}
        <div className={`spreadsheet-design${this.state.bottomInfo.visible ? ' spreadsheet-design-fold' : ''}`} style={{ height }} onScroll={this.onScroll} ref="canvas">
          <div className="table-content" style={
            // this.props.pageParams && this.props.pageParams.BudgEditModel === 'Simple' ?
            // {
            //   borderWidth: 0,
            //   left: `${this.model.position.x}px`,
            //   top: `${this.model.position.y}px`,
            //   width: width + 51,
            //   padding: 0,
            //   left: '-30px'
            // }
            // :
            {
              borderWidth: 0,
              left: `${this.model.position.x}px`,
              top: `${this.model.position.y}px`,
              width: width + 51
            }
          }>
            <ContextMenuTrigger
              id={this.menu_editgrid}
              holdToDisplay={-1}
              disable={!!this.model.editingCell}
            >
              <EditGrid
                isTaskView={this.props.isTaskView}
                excel
                onLoad={this.handleGridLoad}
                tableRows={this.model.tableRows}
                editingCell={this.model.editingCell}
                left={rowHeaderWidth}
                widths={this.model.widths}
                heights={this.model.heights}
                selectedRanges={this.model.selectedRanges}
                mark={this.model.mark}
                onMouseSelectStart={this.handleMouseSelectStart}
                onMouseSelectChange={this.handleMouseSelectChange}
                onMouseSelectEnd={this.handleMouseSelectEnd}
                onKeyDown={this.onKeyDown}
                onKeyPress={this.onKeyPress}
                renderCellContent={this.renderCellContent.bind(this)}
                renderCellExtra={this.renderCellExtra.bind(this)}
                animateSelection={isResizing}
                lazy
                renderRange={this.state.renderRange}
                selectionAllowDrag={this.props.selectionAllowDrag}
                onSelectionDragDrop={this.handleSelectionDragDrop}
                renderInput={this.renderInput}
                getRowKey={this.getRowKey}
                rowProps={this.model.rowProps}
                colProps={this.model.colProps}
                isCellHidden={this.props.isCellHidden}
                scrollLeft={scrollLeft}
                scrollTop={scrollTop}
                frozenRowCount={this.model.frozenRowCount}
                frozenColCount={this.model.frozenColCount}
                isTipOnCell={this.model.isTipOnCell}
              />
            </ContextMenuTrigger>
            {
              // this.props.pageParams && this.props.pageParams.BudgEditModel !== 'Simple' ?
              <React.Fragment>
                <ContextMenuTrigger
                  id="menu_table"
                  holdToDisplay={-1}
                >
                  <div
                    id="table-handle"
                    style={{ width: `${rowHeaderWidth}px` }}
                    className="table-block"
                    onMouseDown={this.tableBlockMouseDown.bind(this)}
                    onClick={this.onClickHandleDiv.bind(this)}
                  />
                </ContextMenuTrigger>
                <ContextMenuTrigger
                  id={this.menu_column}
                  holdToDisplay={-1}
                >
                  <ColumnHeader
                    left={rowHeaderWidth}
                    widths={this.model.widths}
                    selectedRanges={this.model.selectedRanges}
                    selectColumn={(index, isAppend) => this.actions.selectColumn(index, isAppend)}
                    selectColumnRange={(start, target) => this.actions.selectColumnRange(start, target)}
                    onColumnResizing={this.handleColumnResizing}
                    onColumnResized={this.handleColumnResized}
                    renderContent={index => addressConverter.columnNumberToName(index + 1)}
                    renderRange={this.state.renderRange}
                    scrollLeft={scrollLeft || 0}
                    frozenColCount={this.props.sheet.present.frozenColCount || 0}
                  />
                </ContextMenuTrigger>
                <ContextMenuTrigger
                  id={this.menu_row}
                  holdToDisplay={-1}
                >
                  <RowHeader
                    width={rowHeaderWidth}
                    heights={this.model.heights}
                    selectedRanges={this.model.selectedRanges}
                    rowProps={this.model.rowProps}
                    selectRow={(index, isAppend) => this.actions.selectRow(index, isAppend)}
                    selectRowRange={(start, target) => this.actions.selectRowRange(start, target)}
                    onRowResizing={this.handleRowResizing}
                    onRowResized={this.handleRowResized}
                    renderContent={this.renderRowHeader.bind(this)}
                    renderRange={this.state.renderRange}
                    scrollTop={scrollTop || 0}
                    frozenRowCount={this.props.sheet.present.frozenRowCount || 0}
                  />
                </ContextMenuTrigger>
              </React.Fragment>
              // :
              // null
            }
          </div>
        </div>
        {this.state.showGatherModal && <GatherModal
          visible={this.state.showGatherModal}
          dispatch={this.props.dispatch}
          hideGatherModal={this.hideGatherModal}
          confirmInfo={this.confirmGatherExpression}
          pageParams={this.props.pageParams}
        />}

        {
          <DimensionFormulaModal
            sheet={this.props.sheet}
            visible={this.state.showDimensionFormulaModal}
            onConfirm={this.comfirm}
            onCancel={this.hideDimensionFormulaModal}
            defaultText={dimensionFormulaValue}
            pageParams={this.props.pageParams}
            selectedRanges={this.model.selectedRanges}
            rowProps={this.model.rowProps}
            colProps={this.model.colProps}
            tableRows={this.model.tableRows}
          />
        }

        {this.state.showDimension && <BindDimensionModal
          colProps={this.model.colProps}
          tableRows={this.model.template.tableRows}
          currentTableRows={this.model.tableRows}
          visible={this.state.showDimension}
          onCancel={this.hideDimension}
          bindDimension={this.bindDimension}
          pageParams={this.props.pageParams}
          bindDimensionDataKey={this.state.bindDimensionDataKey}
          cancelBind={this.cancelBind}
          bindDimDisplay={this.state.bindDimDisplay}
          floatRowDimensionCondition={this.state.floatRowDimensionCondition}
          floatRowIndex={this.state.floatRowIndex}
          dimProps={this.model.colProps.filter(p => p && p.dimProp && p.dimProp.dimID === this.state.bindDimensionDataKey)
            .map(p => p.dimProp)
          }
          existedDimValueIdSet={this.state.existedDimValueIdSet}
        />}
        {/* <Modal 
          title='xxxx'
          visible={this.state.showDimension}
          onCancel={this.hideDimension}
          onOk={this.bindDimension}
        >
          <Select
            value={this.state.bindDimensionValue || '请选择'}
            onChange={this.handleBindDimension}
          >
            {this.state.dimensionValue && this.state.dimensionValue.map(i=> {
              return <Option value={i.id}>{i.display}</Option>
            })}
          </Select>
        </Modal> */}
        <Modal
          title={this.state.modalTitle}
          visible={this.state.visible}
          closable
          onOk={
            this.state.modalOnOK
          }
          width="450px"
          onCancel={this.hideModal}
          okText="确定"
          cancelText="取消"
          wrapClassName="bi"
        >
          {this.state.modalData}
        </Modal>
        {
          this.state.decomposeModal.visible && <DecomposeModal pageParams={this.props.pageParams} budgetValue={this.state.decomposeModal.value} format={this.state.decomposeModal.format} decompose={this.state.decomposeModal.decompose} ok={(data) => {
            console.log('decomposeData', data);
            const { decomposeModal } = _.cloneDeep(this.state);
            decomposeModal.visible = false;
            this.setState({ decomposeModal }, () => {
              this.props.dispatch({ type: 'BudgetRuntime/decomposeValue', data });
            });
          }} cancel={() => {
            const { decomposeModal } = _.cloneDeep(this.state);
            decomposeModal.visible = false;
            this.setState({ decomposeModal });
          }} />
        }
        <AllModelsModal show={this.state.allModelsModal.show} models={this.state.allModelsModal.models} />
        <ExpressionModal handle={this.expressionModalHandle} show={this.state.expressionModal.show} cellAnalysisModelId={this.state.expressionModal.cellAnalysisModelId} expressions={this.state.expressionModal.formula} tables={this.state.expressionModal.tables}></ExpressionModal>
        {this.state.dimensionModal.show ? <DimensionModal data={this.state.dimensionModal.data} show={this.state.dimensionModal.show} handle={this.dimensionModalHandle} templateId={this.props.pageParams ? this.props.pageParams.templateId : ''} /> : ''}
        {this.state.setupBudgetParameterModal ? <BudgetParameterModal sheet={this.props.sheet.present} handle={this.setupBudgetParameterHandle} /> : ''}
        {this.renderFormulaModal()}
        {this.renderFunctionModal()}
        {this.renderBudgetSpecialExp()}
        {this.renderAuditFormulaList()}
        {this.beginAudits && this.beginAudits()}
        {this.renderCellMenu()}
        {this.renderTableMenu()}
        {this.renderRowMenu()}
        {this.renderColMenu()}
        {this.state.checkFormulaModalData && this.state.checkFormulaModalData.visible &&
          <CheckFormulaModal checkFormulas={this.model.checkFormulas} pageParams={this.props.pageParams}
            onOk={(checkFormulas) => {
              this.actions.setCheckFormulas(checkFormulas);
            }}
            onCancel={(checkFormulas) => {
              this.actions.setCheckFormulas(checkFormulas);
              this.setState({ checkFormulaModalData: { visible: false } });
            }} />}
        {this.state.replaceModalVisible && <ReplaceModal visible={true} onReplaceAll={this.handleReplaceAll}
          onCancel={() => {
            this.setState({ replaceModalVisible: false });
          }} />}

        {
          this.state.attachmentModalVisible && <UploadAttachmentModal
            visible={this.state.attachmentModalVisible}
            rowProps={this.model.rowProps}
            selectedRanges={this.model.selectedRanges}
            onUpload={this.handleUpload}
            pageParams={this.props.pageParams}
            onCancel={() => {
              this.setState({ attachmentModalVisible: false });
            }} />
        }
        <Dialog ref='importIndexesDialog' component={ImportIndexesDialog} />
        <Dialog ref="rowHeightDialog" component={RowHeightDialog} />
        <Dialog ref="sheetSelectDialog" component={WorksheetSelectDialog} />
        {this.renderExtraElement()}
        {this.state.adjustModal.visible && <Modal
          width="400"
          title={this.state.adjustModal.title}
          visible={true}
          onOk={this.handleAdjustModal.bind(this, 1)}
          onCancel={this.handleAdjustModal.bind(this, 0)}
        >
          参考列：
          <Select onChange={this.adjustModalColumnChange} style={{ width: 150, marginRight: 16 }} placeholder="请选择参考列">
            {
              this.state.adjustModal.columns.map(item => <Option key={item} value={item}>{item}</Option>)
            }
          </Select>
          比例：<InputNumber min={0} max={9999} value={this.state.adjustModal.value} onChange={this.adjustChange} />
        </Modal>}
        <Modal
          title="复制"
          visible={this.state.copyModal.visible}
          onOk={this.handleCopyModal.bind(this, 1)}
          onCancel={this.handleCopyModal.bind(this, 0)}
        >
          复制到：<Select placeholder="请选择要复制到的目标列" style={{ width: 300 }} value={this.state.copyModal.value} onChange={this.copyChange}>
            {
              this.state.copyModal.data.map(item => <Option key={item.value} value={item.value}>{item.text}</Option>)
            }
          </Select>
        </Modal>
        {this.renderOther()}
        {this.state.bottomInfo.visible ? <SpreadsheetBottomInfo handleRowSelect={this.showCheckError} handleClose={this.closeBottomInfo} handleChangeCheckStatus={this.changeCheckStatus} pageParams={this.props.pageParams} reportName={this.props.reportName} periodType={this.props.pageParams.periodType} activeKey={this.state.bottomInfo.activeKey} data={this.state.bottomInfo.data} /> : ''}
        {
          this.state.budgetReferenceVisible && <BudgetReferenceModal
            visible={this.state.budgetReferenceVisible}
            handleCancel={() => { this.setState({ budgetReferenceVisible: false }) }}
            FXReferenceMap={this.budgetReferenceMap || {}}
            onOk={(FXReferenceMap) => {
              this.setState({ budgetReferenceVisible: false })
              // this.FXReferenceMap = FXReferenceMap;
              this.actions.updataFXReference(FXReferenceMap)
              this.props.dispatch({ type: 'BudgetRuntime/bindDimensionFXChange', dispatch: this.props.dispatch, rowIndex: FXReferenceMap.rowIndex });
            }}

          />
        }

      </div>
    );
  }
}

export const mapStateToProps = (state, ownProps) => ({
  plan: state.Spreadsheet.plan,
  pageParams: ownProps.pageParams || state.Spreadsheet.pageParams,
  sheet: state.Spreadsheet.ReportBody.sheets[ownProps.index],
  selectedDimension: state.Spreadsheet.selectedDimension,
  selectSingleLeafNode: state.Spreadsheet.selectSingleLeafNode,
  selectedCell: getSelectedCell(state),
  selectedCellTextBox: getSelectedCellTextBox(state),
  selectedCellFontInfo: getSelectedCellFontInfo(state),
  // spreadsheet: state.Spreadsheet
});
export const mapDispatchToProps = (dispatch, ownProps) => ({
  dispatch,
  undo: (count) => dispatch(undo(count)),
  redo: (count) => dispatch(redo(count)),
  removeTable: () => {
    const tableID = ownProps.id;
    dispatch(removeTable({ tableID, areaName: ownProps.areaName }));
  },
  loadExcelFile: (file, sheetSelectDialog, importIndexesDialog, reportName) => {
    dispatch({ type: 'Spreadsheet/loadExcelFile', file, sheetSelectDialog, importIndexesDialog, reportName });
  },
  createIndexes: (importIndexesDialog, reportName) => {
    dispatch({ type: 'Spreadsheet/createIndexes', importIndexesDialog, reportName });
  },
});
export default connect(mapStateToProps, mapDispatchToProps)(SheetBase);
