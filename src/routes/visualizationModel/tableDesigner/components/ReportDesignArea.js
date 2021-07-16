import React, { Component } from 'react';
import { connect } from 'react-redux';
import { addTable, removeTable, addTableMessageHead, addTableMessageFoot } from '../DynamicTableActions';
import ModelDragTip from '/src/components/Public/ModelDragTip.js';
import UrlUtil from '/src/components/Public/UrlUtil';
import Message from '/src/components/Public/Message';
import TableItemSetting from './TableItemSetting';
import DynamicTableControl from './DynamicTableControl';
import MatrixControl from './matrix/MatrixControl';
import Matrix2Control from './matrix2/Matrix2Control';
import DynamicTableUtil from './DynamicTableUtils';
import MatrixUtils from './matrix/matrixUtils';
import TableHeaderOrFooter from './TableHeaderOrFooter';
import TableHeadOrFootUtils from './TableHeadOrFootUtils';
import Matrix2Utils from './matrix2/matrix2Utils';
import { RenderToolbars } from '~/components/Public/excelCommon';
import { shortcutToolbarSignal } from '/src/components/public/ShortcutToolbar/signal';
const matrixUtil = MatrixUtils;
const dynamicTableUtil = DynamicTableUtil;
const tableHeadOrFootUtils = TableHeadOrFootUtils;
const matrix2Util = Matrix2Utils;
const defaultAreaWidth = '100%';
const defaultTableProperty = {
  title: '',
  isDisplay: true,
  unitName: '',
  isUnitDisplay: false,
  pageSize: 100,
  fixedColumn: true,
  isPaging: false,
  collapse: true,
  groupLevelField: '',
  isBorder: 'yes',
  // tableSort: '',
  // liftingSequence: 'ascend',
  yearTotalParameter: '',
  summaryAction: true,
  adaptive: true,
  sortExpressions: [

  ],
  isFolding: false,
  topN: null,
  numberDisplay: false,
  numberName: 'No.',
  tableFootMerge: false,
  tableStyle:'default',
  tableStyleColor:'rgb(137,195,235)',
  sumCondition:[],
  isReport:false,
  isReportUseaCaseSum:true,
  isGroupSum:true,
  isShowPreNextPage:false
};
const vadpSetCssTransforms = () => {
  if (window.$ && $('.bi')) {
    $('.bi').parents('.cssTransforms').addClass('removerCssTransforms');
  }
}
function getIsCurrentPlace(el) {
  let pEl = el.parentElement;
  if (pEl) {
    if (pEl.id == 'Header' || pEl.id == 'Body' || pEl.id == 'Footer') {
      return pEl.id;
    } else if (pEl.tagName == 'BODY' || pEl.id == 'root') {
      return false;
    } else {
      return getIsCurrentPlace(pEl);
    }
  }
}
class ReportDesignArea extends Component {
  constructor(props) {
    super(props);
    this.state = {
      headerData: [],
      footerData: [],
      currentDraggingItem: null,
    };
    this.headOrFootData = {};
    window.setDynamicFormHide = false; //防止第一次点击表格不出现
    vadpSetCssTransforms();
    this.toobarEvents = shortcutToolbarSignal.getByControlID('toobarEvent');
    this.toobarEvents.action.add(this.replaceToobar);
    this.undoStack = [];
    this.redoStack = [];
    this.commonTextBox = {};
  }
  componentDidMount() {
    document.getElementById('designer').addEventListener('click', this.toobarTypeClick, false)
  }
  componentWillReceiveProps(nextProps) {
    if (window.setDynamicFormHide) {  //防止第一次点击表格不出现
      if (this.props.analysisModuleId !== nextProps.analysisModuleId && this.props.analysisModuleId) {

        if (this.props.Body.tables.length > 0) {
          // const tableID = this.props.Body.tables[0].id;
          // this.props.dispatch(removeTable({ tableID, areaName: 'Body' }));
          this.toobarEvents.action.dispatch({
            distributeType: 'targetEvent',
            eventType: 'clearTableData',
            toobarActionType: 'Body',
          });
        }
      }
    }
    vadpSetCssTransforms();
  }
  componentWillUnmount() {
    this.toobarEvents.action.remove(this.replaceToobar);
    document.getElementById('designer').removeEventListener('click', this.toobarTypeClick);
  }
  toobarTypeClick = (e) => {
    this.toobarActionType = getIsCurrentPlace(e.target);
  }
  replaceToobar = ({ distributeType, commonTextBox, wholeModel }) => {
    if (distributeType === 'replaceToobar') {
      if (commonTextBox && commonTextBox.textBox) {
        this.commonTextBox = commonTextBox;
      }
      this.undoStack.push(wholeModel);
      this.redoStack = [];
    }
  }
  // 拖拽控件生成控件
  onDrop = (type, event) => {
    event.preventDefault();
    if (this.state.currentDraggingItem === null) {
      let text = event.dataTransfer.getData('text');
      text = text ? JSON.parse(text) : text;
      const controlName = text.controlName || ''
      const controlType = text.controlType || ''
      const control = text.control || ''
      // const controlName = event.dataTransfer.getData('controlName');
      // const controlType = event.dataTransfer.getData('controlType');
      // const control = event.dataTransfer.getData('control');
      if (type === 'Body') {
        this.dropToReportBody(controlName, controlType, control);
      } else {

        this.headOrFootData.offsetTop = window.$(`#${type}`).offset().top;
        this.headOrFootData.offsetLeft = window.$(`#${type}`).offset().left;
        this.headOrFootData.pageX = event.pageX;
        this.headOrFootData.pageY = event.pageY;
        this.dropToHeaderOrFooter(controlName, type);
      }
      this.setState({ currentDraggingItem: null });
    }
  };

  dropToReportBody(controlName, controlType, control) {
    // console.log(controlType,control,controlName)

    if (controlName === 'table' || controlName === 'matrix' || controlName === 'matrix2') {
      const { Body } = this.props;
      if (Body.tables.length > 0) {
        return;
      }

      let objTablePara;
      if (controlName === 'table') {
        // 生成表格模型
        objTablePara = dynamicTableUtil.createDynamicTableControl(defaultTableProperty);
      } else if (controlName === 'matrix') {
        objTablePara = matrixUtil.createMatrixControl(defaultTableProperty);
      } else if (controlName === 'matrix2') {
        objTablePara = matrix2Util.createMatrixControl(defaultTableProperty)
      }
      this.props.dispatch(addTable(objTablePara));
    } else if (control !== '') {
      Message.warning('该控件不可放置在此位置');
    } else {
      this.state.controlName = controlName;
      this.state.tableName = controlType;
    }
  }
  // 除表头外的其他位置
  dropToHeaderOrFooter(controlName, type) {
    if (controlName === 'table') {
      Message.warning('该控件不可放置在此位置');
    } else if (type === 'Header' && controlName === 'textarea') {
      const headerData = tableHeadOrFootUtils.createTableHeadControl(this.headOrFootData);
      this.props.dispatch(addTableMessageHead(headerData))
      this.state.headerData.push(controlName);
    } else if (type === 'Footer' && controlName === 'textarea') {
      const footData = tableHeadOrFootUtils.createTableHeadControl(this.headOrFootData);
      this.props.dispatch(addTableMessageFoot(footData))
      this.state.footerData.push(controlName);
    }
  }
  // 通过模型 生成控件
  generateTable = () => {
    return this.props.Body.tables.map((item, idx) => {
      if (item.type === 'table') {
        return (
          <DynamicTableControl ref={e => this.Body = e} key={item.id} type={item.type} index={idx} areaName="Body"
            clearconditionsModal={this.props.clearconditionsModal} />
        );
      } else if (item.type === 'matrix2') {
        return (
          <Matrix2Control key={item.id} type={item.type} index={idx} areaName="Body" ref={e => this.Body = e} />
        );
      } else {
        return (
          <MatrixControl key={item.id} type={item.type} index={idx} areaName="Body" ref={e => this.Body = e} />
        );
      }
    });
  };

  onDragStart = (event) => {
    this.setState({ currentDraggingItem: event.target });
  };
  onDragOver = (event) => {
    this.setState({ currentDraggingItem: null });
    event.preventDefault();
  };
  toobarOperation(eventType) {
    this.toobarEvents.action.dispatch({
      distributeType: 'targetEvent',
      eventType,
      toobarActionType: this.toobarActionType,
      commonTextBox: this.commonTextBox
    });
  }
  renderToolbar() {
    let textBox = this[this.toobarActionType] && this[this.toobarActionType].getWrappedInstance().getCurrentTextBox && this[this.toobarActionType].getWrappedInstance().getCurrentTextBox();
    let fontStyle;
    if (textBox && textBox.fontStyle) {
      fontStyle = textBox.fontStyle;
    }
    let list = [
      {
        onClick: this.toobarOperation.bind(this, 'cut'),
        isHeader: true, title: '剪切',
        iconName: 'icon-BI-shear',
        type: 'ToolbarItem'
      },
      {
        onClick: this.toobarOperation.bind(this, 'copy'), title: '复制', iconName: 'icon-bicopy', type: 'ToolbarItem'
      },
      {
        onClick: this.toobarOperation.bind(this, 'paste'), title: '粘贴', iconName: 'icon-BI-paste', type: 'ToolbarItem'
      },
      {
        onClick: this.toobarOperation.bind(this, 'emptyCell'), title: '删除', iconName: 'icon-BI-bidelete', type: 'ToolbarItem'
      },
      {
        onClick: this.toobarOperation.bind(this, 'mergeCell'), title: '合并单元格', iconName: 'icon-merge', isHeader: true, type: 'ToolbarItem'
      },
      {
        onClick: this.toobarOperation.bind(this, 'splitCell'), title: '拆分单元格', iconName: 'icon-split', type: 'ToolbarItem'
      },
      {
        onClick: this.toobarOperation.bind(this, 'setCellBold'),
        title: '加粗',
        iconName: 'icon-bold',
        type: 'ToolbarItem',
        isHeader: true,
        checked: (fontStyle && fontStyle.fontWeight && fontStyle.fontWeight.toLowerCase() === 'bold')
      },
      {
        onClick: this.toobarOperation.bind(this, 'setCellItalic'),
        title: '倾斜',
        iconName: 'icon-tilt',
        type: 'ToolbarItem',
        checked: (fontStyle && fontStyle.fontType && fontStyle.fontType.toLowerCase() === 'italic')
      },
      {
        onClick: this.toobarOperation.bind(this, 'setCellUnderline'),
        title: '下划线',
        iconName: 'icon-BI-Underline',
        type: 'ToolbarItem',
        checked: (fontStyle && fontStyle.fontDecoration && fontStyle.fontDecoration.toLowerCase() === 'underline')
      },
      {
        onClick: this.toobarOperation.bind(this, 'setAlignLeft'),
        title: '左对齐',
        iconName: 'icon-BI-Left',
        type: 'ToolbarRadioItem',
        isHeader: true,
        current: (textBox && textBox.horizontalAlignment === 'Left')
      },
      {
        onClick: this.toobarOperation.bind(this, 'setAlignCenter'),
        title: '居中',
        iconName: 'icon-BI-Verticalcenter',
        type: 'ToolbarRadioItem',
        isHeader: true,
        current: (textBox && textBox.horizontalAlignment === 'Center')
      },
      {
        onClick: this.toobarOperation.bind(this, 'setAlignRight'),
        title: '右对齐',
        iconName: 'icon-BI-right',
        type: 'ToolbarRadioItem',
        isHeader: true,
        current: (textBox && textBox.horizontalAlignment === 'Right')
      },
      {
        onButtonClick: this.undo.bind(this),
        onSelect: this.undo.bind(this),
        dataSource: this.undoStack,
        buttonTip: this.getUndoTip(),
        listTip: count => `撤销 ${count} 步操作`,
        type: 'BatchSelect',
        childClassName: 'chexiao'
      },
      {
        onButtonClick: this.redo.bind(this),
        onSelect: this.redo.bind(this),
        dataSource: this.redoStack,
        buttonTip: this.getRedoTip(),
        listTip: count => `恢复 ${count} 步操作`,
        type: 'BatchSelect',
        childClassName: 'zhongzuo'
      },
    ]
    return (<RenderToolbars datas={list} />)
  }
  undo = (count) => {
    count = count || 1;
    if (!this.undoStack || this.undoStack.length < 1) {
      return;
    }
    let record;
    for (let i = 0; i < count; i++) {
      record = this.undoStack.pop();
      this.redoStack = this.redoStack || [];
      this.redoStack.push(record);
    }
    const { table, Header, Footer } = record.stateBefore;
    if (table) {
      this.Body.getWrappedInstance().updateTable(table);
    } else if (Header) {
      this.Header.getWrappedInstance().updateHeadOrFoot(Header, 'Header');
    } else if (Footer) {
      this.Footer.getWrappedInstance().updateHeadOrFoot(Footer, 'Footer');
    }
  }
  redo = (count) => {
    count = count || 1;
    if (!this.redoStack || this.redoStack.length < 1) {
      return;
    }
    let record;
    for (let i = 0; i < count; i++) {
      record = this.redoStack.pop();
      this.undoStack = this.undoStack || [];
      this.undoStack.push(record);
    }
    const { table, Header, Footer } = record.stateAfter;
    if (table) {
      this.Body.getWrappedInstance().updateTable(table);
    } else if (Header) {
      this.Header.getWrappedInstance().updateHeadOrFoot(Header, 'Header');
    } else if (Footer) {
      this.Footer.getWrappedInstance().updateHeadOrFoot(Footer, 'Footer');
    }
  }
  getRedoTip = () => {
    if (this.redoStack && this.redoStack.length > 0) {
      return `恢复 ${this.redoStack[this.redoStack.length - 1].description}`;
    }
  }
  getUndoTip = () => {

    if (this.undoStack && this.undoStack.length > 0) {
      return `撤销 ${this.undoStack[this.undoStack.length - 1].description}`;
    }
  };
  render() {
    let tableProperty;
    if (this.props.Body.tables.length > 0) {
      tableProperty = this.props.Body.tables[0].tableProperty;
      // if (tableProperty.isPaging === undefined) {
      //   tableProperty.isPaging = true;
      // }

      tableProperty = { ...defaultTableProperty, ...tableProperty }
    } else {
      tableProperty = defaultTableProperty;
    }
   
    const styleRegion = {
      width: defaultAreaWidth,
      position: 'relative',
    };

    let headHeight = this.props.Header && this.props.Header.isShow ? this.props.Header.height : 0;
    let footHeight = this.props.Footer && this.props.Footer.isShow ? this.props.Footer.height : 0;
    // console.log(this.undoStack)
    // －－－－改－添加了postion：relateive，－ <div style={{ width: '100%',position:"absolute",left:0,right:0,top:0 }}>为了兼容IE上表格列变多，无法继承父元素的宽度这个是IE老问题了－－－
    return (
      <div className="table-model-container" style={{ width: `calc(100% - ${this.props.leftBoard1Width}px)`, float: 'left' }}>
        <div style={{ height: '100%', overflow: 'auto', position: "relative", marginRight: this.props.showProperty ? '270px' : '0px' }} className="row margin0">

          <div style={{ width: '100%', position: "absolute", left: 0, right: 0, top: 0, height: '100%' }}>
            <div style={{ width: '100%', height: '96%' }}>
              {
                this.props.Body.tables[0] && this.props.Body.tables[0].type == 'table' && this.renderToolbar()
              }
              <div id="designer" style={{ width: 'calc(100% - 24px)', height: 'calc(100% - 115px)', overflow: 'auto', position: 'relative', marginTop: '35px', marginLeft: '24px' }}>

                <div id="Header"
                  onDragOver={this.onDragOver.bind(this)}
                  onDrop={this.onDrop.bind(this, 'Header')}
                  onDragStart={this.onDragStart.bind(this)}
                >
                  <TableHeaderOrFooter type='Header' ref={(r) => { this.Header = r }} />
                </div>

                <div
                  id="Body"
                  style={{ ...styleRegion, height: `calc(100% - ${headHeight + footHeight}px`, }}
                  onDragOver={this.onDragOver.bind(this)}
                  onDrop={this.onDrop.bind(this, 'Body')}
                  onDragStart={this.onDragStart.bind(this)}
                >

                  {UrlUtil.getUrlParams(this.props.match, 'type') === 'add' ? ModelDragTip.createTipElement('table') : ''}
                  <div id={this.state.areaName + '_control'} style={{ height: '100%', width: '100%' }}>
                    {this.generateTable()}
                  </div>

                </div>

                <div id="Footer"
                  onDragOver={this.onDragOver.bind(this)}
                  onDrop={this.onDrop.bind(this, 'Footer')}
                  onDragStart={this.onDragStart.bind(this)}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'transparent'
                  }}
                >
                  <TableHeaderOrFooter type='Footer' ref={(r) => { this.Footer = r }} />
                </div>
              </div>

            </div>
          </div>
        </div>
        {
          this.props.showProperty && <TableItemSetting variableList={this.props.variableList} 
          sumComtitionFields={this.props.sumComtitionFields}
          conditionsModalData={this.props.conditionsModalData} fixedColumn={this.props.fixedColumn} />
        }
      </div>
    );
  }
}
const mapStateToProps = state => ({
  Body: state.DynamicTableReducer.Body,
  Header: state.DynamicTableReducer.Header,
  Footer: state.DynamicTableReducer.Footer,
  analysisModuleId: state.analysisModel.analysisModelId,
  showProperty: state.DynamicTableReducer.showProperty,
});
export default connect(
  mapStateToProps
)(ReportDesignArea);
