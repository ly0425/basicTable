import React, { Component } from 'react';
import { connect } from 'react-redux';
import { createTableHead } from '~/model/ReportModel/TabularMessageHead';
import { Input, Modal } from '@vadp/ui';
import produce from 'immer';
import Message from '/src/components/public/Message';
import { updateTableMessageHead, setMessageHeadorFoot, updateTableMessageFoot } from '../DynamicTableActions';
import { shortcutToolbarSignal } from '/src/components/public/ShortcutToolbar/signal';
import { ContextMenuTrigger } from 'react-contextmenu';
import { setTextAreaRight } from './MessageHeadContextMenu';
import { updateReportGroupsExp } from '../DynamicTableActions';

function collect(props) {
  return props;
}
const { TextArea } = Input;
const confirm = Modal.confirm;
let headArea = { drag: false };
let headerTextboxes = { drag: false };
let TextboxesCol = { drag: false };
let TextboxesRow = { drag: false };
let textAreaAll = { drag: false };
const headerStyle = {
  overflow: 'hidden',
  position: 'relative',
}
const textBoxStyle = {
  // cursor:'move',
  position: 'absolute',
  float: 'left',
}
const buttonStyle = {
  width: '16px',
  height: '15px',
  background: 'transparent',
  margin: 0,
  padding: 0,
  position: 'absolute',
  cursor: 'move',
  zIndex: 8,
}
const iconStyle = {
  fontSize: '12px',
  position: 'absolute',
  top: '0px',
  right: '-3px',
  zIndex: '9',
  cursor: 'pointer',
}
const colSpan = {
  position: 'absolute',
  right: '0px',
  top: '0px',
  background: 'transparent',
  width: '10px',
  zIndex: '8',
  cursor: 'col-resize',
}
const rowSpan = {
  position: 'absolute',
  right: '0px',
  bottom: '0px',
  width: `100%`,
  background: 'transparent',
  height: '4px',
  zIndex: '8',
  cursor: 'row-resize',
}
const setHead = {
  position: 'absolute',
  border: '2px #ddd dashed',
  zIndex: '1',
  width: '100%',
  cursor: 's-resize',
}
class TableHeaderOrFooter extends Component {
  constructor(props) {
    super(props);
    this.freeze(this.props.headerOrFooter);
    this.textAreaSignal = this.props.type === 'Header' ? shortcutToolbarSignal.getByControlID('textAreaHeadPropByTable') : shortcutToolbarSignal.getByControlID('textAreaFootPropByTable');
    this.messageHeadSignal = this.props.type === 'Header' ? shortcutToolbarSignal.getByControlID('messagePropByHead') : shortcutToolbarSignal.getByControlID('messagePropByFoot');
    this.textAreaContent = [];
    this.headArea = { drag: false };
    this.Text_Area = 'head-text-area';
    this.toobarEvents = shortcutToolbarSignal.getByControlID('toobarEvent');
  }
  componentDidMount() {
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('keydown', this.handlekeydown);
    window.addEventListener('keyup', this.handlekeyup.bind(this));

    this.textAreaSignal.action.add(this.replaceTextarea);
    this.messageHeadSignal.action.add(this.replaceMessageHead);
    this.props.type === 'Footer' ? this.Text_Area = 'foot-text-area' : this.Text_Area = 'head-text-area';
    const TextAreaContextMenu = setTextAreaRight(this.Text_Area);
    this.TextAreaContextMenu = <TextAreaContextMenu />
    this.toobarEvents.action.add(this.replaceToobar);
  }
  componentWillUnmount() {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('keydown', this.handlekeydown);
    window.removeEventListener('keyup', this.handlekeyup);

    this.textAreaSignal.action.remove(this.replaceTextarea);
    this.messageHeadSignal.action.remove(this.replaceMessageHead);
    this.toobarEvents.action.remove(this.replaceToobar);
  }
  componentWillReceiveProps(nextprops) {
    this.freeze(nextprops.headerOrFooter);
  }
  freeze(haeder) {
    this.model = createTableHead(haeder);
    Object.getOwnPropertyNames(this.model).forEach((name) => {
      const prop = this.model[name];
      if (typeof prop === 'function') {
        this.bind(prop, 'actions', name);
      }
    });
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
          producer.apply(draft, [...args]);
        });
      } catch (ex) {
        Message.warning(ex.message);
        return;
      }

      if (producer.skipUndo) {
        if (!this.stateBefore) this.stateBefore = this.model;
      } else if (producer.canUndo) {
        const stateBefore = this.stateBefore || this.model;
        if (model === stateBefore) {
          return;
        }
        let description = producer.description;
        if (typeof description === 'function') {
          description = description(this.model, model, this.props.type == 'Header' ? '报表头' : '报表尾', ...args);
        }
        let type = this.toobarActionType || this.props.type;
        let toobarActionMap = {
          distributeType: 'replaceToobar',
          wholeModel: {
            stateBefore: {
              [type]: stateBefore
            },
            stateAfter: {
              [type]: model
            },
            description
          },
        }
        if ((name == 'cut' || name == 'copy') && model.currentToobarMap) {
          toobarActionMap.commonTextBox = {
            type: type,
            textBox: model.currentToobarMap || {},
          }
        }

        this.toobarEvents.action.dispatch(toobarActionMap);
        // this.undoStack.push({ stateBefore, stateAfter: model, description });
        this.stateBefore = null;
        // this.redoStack = [];
      }
      // update
      console.log(model, 'dsd', name)
      this.model = model;
      this.expectUpdate();
    };
  }

  getTableHeadToDispatch() {
    // model 转成 store 中的格式
    const tableheaderOrFooter = {
      isShow: this.model.isShow,
      height: this.model.height,
      textBoxes: this.model.textBoxes,
    };
    return { ...this.props.headerOrFooter, ...tableheaderOrFooter };
  }
  expectUpdate() {
    // TODO 保存时再同步到 redux store
    const tableHeadOrFoot = this.getTableHeadToDispatch();
    if (this.toobarActionType) {
      this.props.dispatch(
        this.toobarActionType === 'Header' ? updateTableMessageHead({ HeadOrFoot: tableHeadOrFoot }) : updateTableMessageFoot({ HeadOrFoot: tableHeadOrFoot })
      );
    } else {
      this.props.dispatch(
        this.props.type === 'Header' ? updateTableMessageHead({ HeadOrFoot: tableHeadOrFoot }) : updateTableMessageFoot({ HeadOrFoot: tableHeadOrFoot })
      );
    }

  }
  updateHeadOrFoot = (model,toobarActionType) => {
    this.toobarActionType = toobarActionType;
    this.actions.updateModel(model)
  }
  replaceTextarea = ({ sub, newTextBoxes } = {}) => {
    this.actions.replaceTextarea(sub, newTextBoxes)
  }
  replaceToobar = ({ distributeType, eventType, commonTextBox, toobarActionType } = {}) => {

    this.toobarActionType = toobarActionType;
    console.log(this.toobarActionType)

    if (distributeType === 'targetEvent' && (toobarActionType == 'Header' || toobarActionType == 'Footer')) {
      switch (eventType) {
        case 'cut':
          this.actions.cut(this.currentI);
          break;
        case 'copy':
          this.actions.cut(this.currentI);
          break;
        case 'paste':
          this.actions.paste(this.currentI, commonTextBox);
          break;
        case 'emptyCell':
          this.actions.emptyCell(this.currentI);
          break;
        case 'setCellBold':
          this.updateCellStyle('setCellBold');
          break;
        case 'setCellItalic':
          this.updateCellStyle('setCellItalic');
          break;
        default:
          break;
      }
    }
  }
  updateCellStyle = (type) => {
    let textBox = this.model.textBoxes[this.currentI];
    let style = textBox.style ? { ...textBox.style } : {};
    if (type === 'setCellBold') {
      style.fontWeight = style.fontWeight && style.fontWeight.toLowerCase() == 'bold' ? 'Normal' : 'Bold';
    } else if (type === 'setCellItalic') {
      style.fontStyle = style.fontStyle && style.fontStyle.toLowerCase() == 'Italic' ? 'Normal' : 'Italic';
    }
    this.actions.updateCellStyle(this.currentI, style)
  }
  replaceMessageHead = ({ val, type } = {}) => {
    this.actions.replaceMessageHead(val, type)
  }
  textAreaChange = (i, e) => {
    this.actions.updateVal(i, e.target.value)
  }
  textMouseDown = (i, e) => {
    // e.preventDefault();
    try {
      if (e.button !== 0) {
        return;
      }
      if (e.target.nodeName === 'SPAN') {
        return;
      }
    } catch (err) {
      console.log(err)
    }
    headerTextboxes.drag = true;
    headerTextboxes.diffX = e.pageX - this.props.headerOrFooter.textBoxes[i].position.x;
    headerTextboxes.diffY = e.pageY - this.props.headerOrFooter.textBoxes[i].position.y;
    headerTextboxes.sub = i;
  }
  textMouseUp = (e) => {
    try {
      e = e || window.event;
      e.preventDefault();
    } catch (err) {
      console.log(err)
    }
    // if (!e.ctrlKey) {
    //   this.textAreaContent = [];
    // }
    headerTextboxes.drag = false;
    TextboxesCol.drag = false;
    TextboxesRow.drag = false;
    textAreaAll.drag = false;
  }
  headMouseMove = (e) => {
    e.preventDefault();
    if (textAreaAll.drag) {
      const offX = e.pageX - textAreaAll.diffX;
      const offY = e.pageY - textAreaAll.diffY;
      const position = { offX, offY };
      this.actions.updateTextAllPosition({ textAreaContent: this.textAreaContent, position });
      return;
    }
    if (TextboxesCol.drag) {
      let newPositionX = e.pageX;
      let distanceX = newPositionX - TextboxesCol.positionX;
      let sub = parseInt(TextboxesCol.sub);
      let width = (TextboxesCol.width + distanceX) < 50 ? 50 : (TextboxesCol.width + distanceX);
      this.actions.setElArea({ sub, width })
      return;
    }
    if (TextboxesRow.drag) {
      let newPositionY = e.pageY;
      let distanceY = newPositionY - TextboxesRow.positionY;
      let sub = parseInt(TextboxesRow.sub);
      let height = (TextboxesRow.height + distanceY) < 34 ? 34 : (TextboxesRow.height + distanceY);
      this.actions.setElArea({ sub, height })
      return;
    }
    if (headerTextboxes.drag) {
      const table = this.props.table;
      const headPositionX = e.pageX - headerTextboxes.diffX < 0 ? 0 : e.pageX - headerTextboxes.diffX;
      const haadPositionY = e.pageY - headerTextboxes.diffY < 0 ? 0 : e.pageY - headerTextboxes.diffY;
      const position = { x: headPositionX, y: haadPositionY };
      this.actions.updateTextPosition({ sub: headerTextboxes.sub, position });
      return;
    }
  }
  textCelMouseDown = (i, e) => {
    if (!e.target) {
      return;
    }
    TextboxesCol.drag = true;
    TextboxesCol.positionX = e.pageX;
    TextboxesCol.sub = i;
    TextboxesCol.width = this.props.headerOrFooter.textBoxes[i].width;
  }
  textRowMouseDown = (i, e) => {
    if (!e.target) {
      return;
    }
    TextboxesRow.drag = true;
    TextboxesRow.positionY = e.pageY;
    TextboxesRow.sub = i;
    TextboxesRow.height = this.props.headerOrFooter.textBoxes[i].height;
  }
  textAreaAllMouseDown = (e) => {
    try {
      if (e.ctrlKey) {
        textAreaAll.drag = true;
        textAreaAll.diffY = e.pageY;
        textAreaAll.diffX = e.pageX;
      }
    } catch (err) {
      console.log(err)
    }
  }
  setHeadArea = (e) => {
    if (!e.target) {
      return;
    }
    this.headArea.drag = true;
    this.headArea.positionY = e.pageY;
    this.headArea.height = this.props.headerOrFooter.height;
  }
  handleMouseMove = (e) => {
    if (this.headArea.drag) {
      let newPositionY = e.pageY;
      let distanceY = newPositionY - this.headArea.positionY;
      let height = 0;
      if (this.props.type === 'Header') {
        height = (this.headArea.height + distanceY) < 20 ? 20 : (this.headArea.height + distanceY);
      } else {
        height = (this.headArea.height - distanceY) < 20 ? 20 : (this.headArea.height - distanceY);
      }
      this.actions.setHeadArea(height);
      return;
    }
  }
  handleMouseUp = () => {
    this.headArea.drag = false;
  }
  handlekeydown = (e) => {
    if (e.ctrlKey) {
      if (e.keyCode === 37 || e.keyCode === 38 || e.keyCode === 39 || e.keyCode === 40) {
        this.actions.roll && this.actions.roll({ textAreaContent: this.textAreaContent, keyCode: e.keyCode });
      }
    }
  }
  handlekeyup = (e) => {
    if (this.textAreaContent.length > 0 && e.ctrlKey && e.keyCode == 46) {
      this.textAreaContent = [];
      this.actions.clearSelected();
      textAreaAll.drag = false;
    }
  }
  // textBoxDrop = (i, e) => {
  //   let text = e.dataTransfer.getData('text');
  //   text = text ? JSON.parse(text) : text;
  //   const fieldName = `=Fields.${text.fieldName}` || '';
  //   this.actions.textBoxDrop(i, fieldName)
  // }
  TextAreaClick = (i, e) => {
    this.currentI = i;
    try {
      e = e || window.event;
      // e.stopPropagation();
      if (e.ctrlKey) {
        if (this.textAreaContent.filter((item) => { return item.i === i ? true : false; }).length === 0) {
          this.textAreaContent.push({ i, position: this.model.textBoxes[i].position });
          this.actions.setSelected(this.textAreaContent);
        }

      }
    } catch (err) {
      console.log(err);
    }

    const controlInfo = {
      type: 'TextAreaProprrty',
      areaName: 'textArea',
      subScript: i,
      headOrFootType: this.props.type

    };
    this.props.dispatch(setMessageHeadorFoot(controlInfo))
  }
  setLayout = (i, type) => {
    const textBoxes = this.props.headerOrFooter.textBoxes[i];
    let x = textBoxes.position.x;
    const width = textBoxes.width;
    let newWidth = window.$('#messageHeadDiv').width();
    let table = this.props.table;
    if (table && (table.type === 'table' || table.type === 'matrix2')) {
      let widths = table.widths;
      newWidth = 0;
      for (let i = 0; i < widths.length; i++) {
        newWidth += widths[i];
      }
      newWidth += 31;
    }
    switch (type) {
      case 'left':
        x = 5;
        break;
      case 'right':
        x = newWidth - width - 5;
        break;
      case 'center':
        x = newWidth / 2 - width / 2;
        break;
    }
    const position = {
      x,
      y: textBoxes.position.y
    }
    this.actions.updateTextPosition({ sub: i, position, containerLocation: type })

  }
  handleContextMenu = (e, data) => {
    e.preventDefault();
    switch (data.data.menuId) {
      case 'delete':
        this.actions.deleteTextBox(data.index);
        break;
      case 'left':
        this.setLayout(data.index, data.data.menuId);
        break;
      case 'right':
        this.setLayout(data.index, data.data.menuId);
        break;
      case 'center':
        this.setLayout(data.index, data.data.menuId);
        break;
        case 'setgroupPrintHead':
          this.setgroupPrintHead(data.index);
          break;
      default:
        break;
    }
  }
  setgroupPrintHead=(i)=>{
    const Data = this.props.headerOrFooter;
    const textBox = Data.textBoxes[i];
    console.log(textBox)
    this.props.dispatch(updateReportGroupsExp({ reportGroupsExp: { ...this.props.reportGroupsExp,textboxId: textBox.id } }))
    this.actions.setgroupPrintHead(i);
  }
  render() {
    const Data = this.props.headerOrFooter;
    const table = this.props.table;
    let widths = (table && table.widths) || (table && table.tableRows[0]) || [];
    let width = 0;
    for (let i = 0; i < widths.length; i++) {
      if (isNaN(widths[i])) {
        width += widths[i].width;
      } else {
        width += widths[i];
      }
    }
    console.log(Data.textBoxes)

    width += 30;
    return (
      <div>
        {Data.isShow && <div style={{ ...headerStyle, width: width, height: `${this.props.headerOrFooter.height}px`, borderBottom: this.props.type === 'Footer' ? '1px solid #ddd' : 'none' }} id='allmessageHead'>
          {this.props.type === 'Footer' && <div id="setHeadHeight" style={{ ...setHead, top: '0px' }} onMouseDown={this.setHeadArea}></div>}
          <div id="messageHeadDiv"
            style={{ width: '100%', height: `${this.props.headerOrFooter.height - 4}px`, ...headerStyle, overflow: 'visible' }}
            onMouseUp={this.textMouseUp}
            onMouseMove={this.headMouseMove.bind(this)}
            onMouseLeave={this.textMouseUp}
            onMouseDown={this.textAreaAllMouseDown}>
            {
              Data.textBoxes.map((item, i) => {
                const disabledObj={}
               
                return (
                  <ContextMenuTrigger
                    id={this.Text_Area}
                    onItemClick={this.handleContextMenu}
                    holdToDisplay={1000}
                    index={i}
                    collect={collect}>
                    <div ref={`textBoxesResizes${i}`} onClick={(e) => this.TextAreaClick(i, e)} key={i}
                      style={{ left: item.position.x, top: item.position.y, width: `${item.width}px`, height: `${item.height}px`, ...textBoxStyle }}
                    >
                      <div style={buttonStyle} onMouseDown={(e) => { this.textMouseDown(i, e) }}></div>
                      <TextArea 
                      disabled={item.disabled&&this.props.reportGroupsExp.value}
                      key={i} style={{ resize: 'none', height: '100%', ...item.style, lineHeight: '30px', padding: '0px' }} onChange={(e) => { this.textAreaChange(i, e) }} value={item.value} />
                      <span style={{ height: `${item.height - 1}px`, ...colSpan }} onMouseDown={(e) => this.textCelMouseDown(i, e)}></span>
                      <span style={rowSpan} onMouseDown={(e) => this.textRowMouseDown(i, e)}></span>
                    </div>
                  </ContextMenuTrigger>
                )
              })
            }

          </div>


          {this.props.type === 'Header' && <div id="setHeadHeight" style={{ ...setHead, bottom: '0px' }} onMouseDown={this.setHeadArea}></div>}
          {this.TextAreaContextMenu}
        </div>}
      </div>
    )
  }
}
const mapStateToProps = (state, ownProps) => {
  return {
    headerOrFooter: ownProps.type === 'Header' ? state.DynamicTableReducer.Header : state.DynamicTableReducer.Footer,
    table: state.DynamicTableReducer.Body.tables[0],
    reportGroupsExp: state.DynamicTableReducer.reportGroupsExp,
  }
}
export default connect(mapStateToProps, null, null, { withRef: true })(TableHeaderOrFooter);
