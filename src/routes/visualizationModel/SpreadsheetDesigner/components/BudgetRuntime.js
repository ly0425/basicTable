import React, { Component } from 'react';
import { connect } from 'react-redux';
import { SheetBase, ToolbarItem } from "./SpreadsheetControl";
import { getSelectedCell, getSheet } from '../SpreadsheetSelectors';
import TextBox from '../../components/TextBox';
import { defaultTextBox } from '@/model/ReportModel/Spreadsheet';
import { Spin, Modal, Icon, Form, Input, Select, Col, Row } from '@vadp/ui';
import { getExcelPrintSolution, saveExcelPrintSolution } from '../SpreadsheetApi';
import * as SpreadsheetUtil from './SpreadsheetUtils';
import ToolBar from 'public/ToolBar';
import Message from '~/components/Public/Message';
import { isHttpPublic } from 'constants/IntegratedEnvironment';
import { ContextMenu, MenuItem, ContextMenuTrigger, connectMenu } from 'react-contextmenu';
import { Button, Popconfirm, message } from 'antd';
// import { bindTableActions, createRuntimeSheet } from '../BudgetRuntimeDvaModel'; //ly注释
import PropTypes, { string } from 'prop-types';
// import PrintModal from '../../../dashboard/dashboardDesigner/components/PrintModal'; //ly注释
import Dialog from '../../../../components/Public/Dialog';
import AuditResult from './AuditResult';
import produce from 'immer';
import _ from 'lodash';
import BatchCopyModal from './BatchCopyModal';
import addressConverter from 'xlsx-populate/lib/addressConverter';
import lodash from 'lodash';
// import { fetchFloatDimensionValuesByKeyword, printExcel } from '../BudgetApi'; // ly注释

const FormItem = Form.Item;
const maxListLength = 100;
let searchTimer = null;

export function getSelectList(extendProp, value) {
  let values;
  let nameField = 'name';
  if (extendProp.userDic) {
    values = extendProp.userDic.values.map(v => ({ id: v.key, name: v.name }));;
  } else if (extendProp.dictionary && extendProp.dictionary.values) {
    values = extendProp.dictionary.values.concat();
    nameField = extendProp.dictionary.nameField;
  }
  if (values && values.length > maxListLength) {
    if (value) {
      const selectedList = values.find(item => item.id.toString() === value);
      if (selectedList) {
        const selectedIndex = values.findIndex(item => item.id.toString() === value);
        values.splice(selectedIndex, 1);
        values.unshift(selectedList);
      }
    }
    values.splice(maxListLength, values.length - maxListLength, { [nameField]: "...", id: null, disabled: true });
  }
  return { values, nameField };
}
class BudgetRuntime extends SheetBase {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    super.componentDidMount();
    const { colProps } = this.props.sheet.present;
    const colPropsCopy = _.cloneDeep(colProps);
    this.setState({ colProps, colPropsCopy });
  }

  insertRowDisabled = () => {
    const { selectedRanges } = this.model;
    if (!selectedRanges || selectedRanges.length != 1) {
      return true;
    }
    const selection = selectedRanges[0];
    const { top, bottom, type } = selection;
    if (type !== 'row' || top !== bottom) {
      return true;
    }
    const { rowProps } = this.model;
    const rowProp = rowProps[top];
    if (rowProp.rowType !== 'float' && rowProp.rowType !== 'expand') {
      return true;
    }
  }
  removeRowDisabled = () => {
    const { selectedRanges } = this.model;
    if (!selectedRanges || selectedRanges.length != 1) {
      return true;
    }
    const selection = selectedRanges[0];
    const { top, bottom, type } = selection;
    // if (type !== 'row') {
    //   return true;
    // }
    const { rowProps } = this.model;
    const topRowProp = rowProps[top];
    if (topRowProp.rowType !== 'float' && topRowProp.rowType !== 'expand') {
      return true;
    }
    const bottomRowProp = rowProps[bottom];
    if (bottomRowProp.rowType !== 'float' && bottomRowProp.rowType !== 'expand') {
      return true;
    }
    if (topRowProp.rowType === 'float' && bottomRowProp.rowType === 'float') {
      const up = rowProps[top - 1];
      const down = rowProps[bottom + 1];
      if ((!up || up.rowType !== 'float') && (!down || down.rowType !== 'float')) {
        return true;
      }
    }
  }
  handleOpenExcel = (e) => {
    const files = e.target.files;
    if (files.length === 0) {
      return;
    }
    const file = files[0];
    console.log('打开数据文件', file);
    this.props.dispatch({ type: 'BudgetRuntime/loadExcelDataAsync', file, sheetSelectDialog: this.refs.sheetSelectDialog });
    e.target.value = '';
  }
  showPrintModal = () => {
    const { templateId, mainId, deptId } = this.props.pageParams;
    getExcelPrintSolution(templateId, mainId || deptId).then(solution => {
      let printSettings;
      if (solution) {
        printSettings = JSON.parse(solution);
      } else {
        printSettings = {
          type: "print",
          pageKind: "A4",
          printDirection: "0",
          marginTop: 100,
          marginBottom: 100,
          marginLeft: 100,
          marginRight: 100,
          width: 2100,
          height: 2970,
        };
      }
      this.setState({
        printSettings,
        printModalVisible: true,
      });
    });
  }
  formatValueToString(value, formatObject) {
    if (typeof value === 'object') return '';
    value = this.formatCellValue({ value, formatObject });
    if (value === null || value === undefined) return '';
    if (typeof value !== 'string') return `${value}`;
    return value;
  }
  getPrintJson = () => {
    const printSheet = produce(this.props.sheet.present, draft => {
      const { tableRows, rowProps, colProps } = draft;
      for (let i = 0; i < rowProps.length; i++) {
        const rowProp = rowProps[i];
        if (rowProp.isReportFooter) {
          rowProp.isHidden = false;
          draft.heights[i] = 24;
        }
      }

      for (let i = 0; i < tableRows.length; i++) {
        const row = tableRows[i];
        for (let j = 0; j < row.length; j++) {
          const cell = row[j];
          cell.textBox.expression = undefined;
          const value = this.model.getTextBoxValue(i, j);
          const formattedValue = this.formatValueToString(value, cell.textBox.formatObject);
          cell.textBox.value = formattedValue;
          cell.id = undefined;
          cell.isUserIndex = undefined;
          if (rowProps && rowProps[i] && (rowProps[i].dimensionData || rowProps[i].rowType === 'float')
            && colProps && colProps[j] && colProps[j].extendProp) {
            const { extendProp } = colProps[j];
            let selectInfo = getSelectList(extendProp);
            let values = selectInfo.values;
            let nameField = selectInfo.nameField;
            if (formattedValue && values && values.length) {
              let current = values.find(item => item.id == formattedValue);
              if (current) {
                cell.textBox.value = current[nameField];
              }
            }
          }
        }
      }
    });


    return SpreadsheetUtil.tableToJson([{ present: printSheet }], null, this.props.pageParams, true);
  }
  printPreview = (e) => {
    console.log(e);
    const data = {};
    let PageKind = e.pageKind;
    if (PageKind === 'custom') PageKind = 'UserDefine';
    const config = {
      "PrintScheme": {
        "PageSet": {
          "PageKind": PageKind,
          "PageHeight": e.height,
          "PageWidth": e.width,
          "Landscape": e.printDirection === '1',
          "PageMargin": {
            "Left": e.marginLeft,
            "Right": e.marginRight,
            "Top": e.marginTop,
            "Bottom": e.marginBottom,
          }
        },
        "Order": 1,
        "HorizionalToOne": e.zoom == 3 ? true : false,
        "VerticalToOne": false,
        "HavePage": false
      }
    };
    let tableJson = this.getPrintJson();
    const { mainId, deptId } = this.props.pageParams;
    const param = { excel: tableJson, config: JSON.stringify(config), mainId: mainId || deptId };
    console.log('Print,', param);
    printExcel(param).then(data => {
      // Message.success('调用打印接口成功');
      this.setState({ printPdfUrl: `${isHttpPublic}excelBudg/previewPDF?filePath=` + encodeURIComponent(data) });
    }).catch(err => {
      console.log(err);
      Message.error('调用打印接口失败');
    });
  }
  printHandleCancel = (e) => {
    this.setState({
      printModalVisible: false,
    });
  }
  savePlan = (e) => {
    const solution = JSON.stringify(e);
    const { templateId, mainId, deptId } = this.props.pageParams;
    saveExcelPrintSolution(templateId, mainId || deptId, solution).then(() => {
      Message.success('保存成功');
    }).catch(err => {
      Message.error('保存失败');
    });
  }
  renderExtraElement() {
    return (
      this.state.printModalVisible ? <PrintModal
        visible={this.state.printModalVisible}
        printPdfUrl={this.state.printPdfUrl}
        preview={(e) => this.printPreview(e)}
        onCancel={(e) => this.printHandleCancel(e)}
        savePlan={(e) => this.savePlan(e)}
        data={this.state.printSettings}
      >
      </PrintModal> : null
    );
  }
  renderOther() {
    return (
      <React.Fragment>
        <Dialog ref="batchCopyDialog" component={BatchCopyModal} />
      </React.Fragment>
    );
  }
  renderToolbar() {
    const { pageParams } = this.props;
    const { optType, state, queryType } = pageParams;
    if (optType === 'adjust') {
      // 新增调整单页面，当前页面没有添加浮动行、公式审核功能，请隐藏
      return;
    }
    let expression = '';
    let formulaDescription = '';
    const cell = this.props.selectedCell;
    if (cell && cell.textBox && cell.textBox.expression) {
      expression = cell.textBox.expression;
    }
    if (cell && cell.textBox && cell.textBox.formulaDescription) {
      formulaDescription = cell.textBox.formulaDescription;
    }
    let formulaText = `公式：${formulaDescription ? formulaDescription : expression}`
    const hideBtn = (
      (optType === '1' && (state === '5' || state === '6' || state === '3'))
      || (optType === '2')
      || (optType === '3')
    );
    return (
      <React.Fragment>
        <div className="toolbar" style={pageParams.BudgEditModel === 'Simple' ? { padding: 0, left: '0px', top: '0px' } : null}>
          {!hideBtn && <React.Fragment>
            {
              pageParams.BudgEditModel !== 'Simple' ?
                <React.Fragment>
                  <ToolbarItem onClick={this.showDimension} isHeader title="检查维度" iconName='icon-xiangxixinxi' />
                  <ToolbarItem onClick={this.setupBudgetParameter} title="参数设置" iconName='icon-setrule' />
                </React.Fragment>
                :
                null
            }
            <ToolbarItem disabled={pageParams.BudgEditModel === 'Simple' ? false : this.insertRowDisabled()} onClick={this.insertRowUp} title="向上插入行" iconName='icon-xiangshangcharuhang' />
            <ToolbarItem disabled={pageParams.BudgEditModel === 'Simple' ? false : this.insertRowDisabled()} onClick={this.insertRowDown} title="向下插入行" iconName='icon-xiangxiacharuhang' />
            <ToolbarItem disabled={this.removeRowDisabled()} onClick={this.removeRows} title="删除行" iconName='icon-shanchuhang' />
            <ToolbarItem onClick={this.handleDownloadFloatData} title="取浮动行分析模型数据" iconName='anticon anticon-cloud-download' />
          </React.Fragment>}
          <ToolbarItem style={{ display: 'none' }} onClick={this.exportExcel} title="导出" iconName='icon-BI_daochu' />
          <React.Fragment>
            <ToolbarItem style={{ display: pageParams.queryType === 'edit' ? 'inline-block' : 'none' }} onClick={this.importExcel} isHeader title="导入数据" iconName='icon-BI_daoru' />
            <input ref='excelInput' type='file' accept='.xlsx' style={{ display: 'none' }} onChange={this.handleOpenExcel} />
          </React.Fragment>
          {<Button style={{ marginLeft: 10, display: 'none' }} onClick={this.showPrintModal}>打印</Button>}
          {optType === '4' && <Button style={{ marginLeft: 10 }} onClick={this.showGatherExpressionModal}>查看汇总公式</Button>}

          <Button style={{ marginLeft: 10, display: 'none' }} onClick={() => { this.setState({ beginAuditsVisible: true }) }}>公式审核</Button>
          <Button style={{ marginLeft: 10, display: 'none' }} onClick={() => {
            this.props.dispatch({ type: 'BudgetRuntime/saveAndCompute', dispatch: this.props.dispatch });
          }}>公式运算</Button>
          {queryType === 'edit' && <ToolbarItem onClick={() => {
            this.props.dispatch({ type: 'BudgetRuntime/compute', dispatch: this.props.dispatch, isForceCompute: true });
            message.success('计算完成');
          }} title="计算" iconName='icon-apportion' />}
          {queryType === 'edit' && <ToolbarItem onClick={() => {
            this.props.dispatch({
              type: 'BudgetRuntime/checkData', cb: (result) => {
                if (!result.length) {
                  message.success('数据校验成功！');
                  return;
                }
                Modal.info({
                  title: '数据校验结果',
                  content: (
                    <div style={{ maxHeight: 200, overflow: 'auto' }}>
                      {
                        result.map(item => <p>{item}</p>)
                      }
                    </div>
                  ),
                  okText: '确定'
                });
              }
            })
          }} title="数据校验" iconName='icon-check' />}
        </div>
        <div style={{
          marginLeft: 15,
          marginBottom: -5,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          lineHeight: '20px',
          height: 20
        }}>
          <span title={formulaText}>{formulaText}</span>
        </div>
      </React.Fragment>

    );
  }
  setupBudgetParameter = () => {
    this.setState({ setupBudgetParameterModal: true });
  }
  showDimension = () => {
    const { sheet } = this.props;
    const { selectedRanges, rowProps, colProps, tableRows } = sheet.present;
    if (selectedRanges && selectedRanges.length > 0) {
      const { top, left, right, bottom } = selectedRanges[0];
      const array = [];
      for (let row = top; row <= bottom; row++) {
        // 浮动行绑定维度，并没有维度成员，展示维度成员信息时排除掉
        if (!(rowProps[row].rowType && rowProps[row].rowType === 'float')) {
          for (let column = left; column <= right; column++) {
            const cellValue = tableRows[row][column].textBox.value;
            if (tableRows[row][column] && tableRows[row][column].dimensionData) {
              const name = tableRows[row][column].dimensionData.dimension.dimDisplay;
              const direction = tableRows[row][column].direction;
              let value;
              let code;
              if (tableRows[row][column].dimensionData.value) {
                value = tableRows[row][column].dimensionData.value.display;
                code = tableRows[row][column].dimensionData.value.code;
              }
              array.push(`第${row + 1}行第${column + 1}列内容为：${cellValue}，绑定${direction === 'row' ? '行' : '列'}维度为：${name}，绑定成员为：${value}（${code}）`);
            } else if (tableRows[row][column] && tableRows[row][column].measure) {
              const name = tableRows[row][column].measure.expandDisplay;
              array.push(`第${row + 1}行第${column + 1}列内容为：${cellValue}，绑定度量为：${name}`);
            }
          }
        }
      }
      Modal.info({
        title: '绑定维度信息',
        width: '800',
        content: <section style={{ maxHeight: '300px', overflow: 'auto' }}>
          {array.length === 0 && <p>暂无绑定维度信息</p>}
          {array.map(item => {
            return <p>{item}</p>
          })}
        </section>,
        okText: '确认',
      });
    } else {
      message.warn('请选中查看信息区域！')
    }
  }
  handleDownloadFloatData = () => {
    Modal.confirm({
      title: '提示',
      content: '此举将覆盖浮动行上的原有数据，是否确认？',
      okText: '确定',
      cancelText: '取消',
      autoFocusButton: 'cancel',
      onOk: () => {
        this.props.dispatch({ type: 'BudgetRuntime/downloadFloatData', dispatch: this.props.dispatch });
      }
    });
  }
  beginAudits = () => {
    const { beginAuditsVisible } = this.state;
    return beginAuditsVisible ? (
      <AuditResult
        visible={beginAuditsVisible}
        formulaList={this.props.sheet.present.auditFormulaList}
        templateId={this.props.sheet.present.pageParams.templateId}
        pageParams={this.props.sheet.present.pageParams}
        rowProps={this.props.sheet.present.rowProps}
        tableRows={this.props.sheet.present.tableRows}
        handleOk={() => {
          this.setState({ beginAuditsVisible: false });
        }}
        handleCancel={() => {
          this.setState({ beginAuditsVisible: false })
        }}
      />
    ) : null;
    console.log(this.props.sheet)
  }
  adjustModal = (title) => {
    let { adjustModal } = _.cloneDeep(this.state);
    const { sheet: { present: { colProps, selectedRanges } } } = this.props;
    const columns = [];
    for (let i = 0, j = colProps.length; i < j; i++) {
      columns.push(addressConverter.columnNumberToName(i + 1))
    }
    adjustModal.title = title;
    adjustModal.visible = true;
    adjustModal.columns = columns;
    this.setState({ adjustModal });
  }
  decomposeModal = (selectedCell) => {
    let { decomposeModal } = _.cloneDeep(this.state);
    decomposeModal.visible = true;
    decomposeModal.value = selectedCell.textBox.value;
    decomposeModal.format = selectedCell.textBox.formatObject;
    decomposeModal.decompose = selectedCell.textBox.decompose;
    this.setState({ decomposeModal });
  }
  clearDecompose = () => {
    this.props.dispatch({ type: 'BudgetRuntime/clearDecompose' });
  }
  copyColum = () => {
    const { colProps, rowProps, selectedRanges, tableRows } = this.props.sheet.present;
    let { copyModal } = _.cloneDeep(this.state);
    const { data, copyData } = copyModal;
    for (let i = 0, j = colProps.length; i < j; i++) {
      if (colProps[i].measure && (i !== selectedRanges[0].left) && !colProps[i].isHidden) {
        data.push({ text: colProps[i].measure.expandDisplay, value: i })
      }
    }
    for (let a = 0, b = selectedRanges.length; a < b; a++) {
      const { top, bottom } = selectedRanges[a];
      for (let i = top; i <= bottom; i++) {
        if (rowProps[i].dimensionData) {
          copyData.push({ x: i, y: selectedRanges[0].left });
        }
      }
    }
    copyModal.visible = true;
    this.setState({ copyModal });
  }
  handleSelectSearch = (columnIndex, keyWord) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      let { colPropsCopy } = _.cloneDeep(this.state);
      if (keyWord !== '' && keyWord !== undefined) {
        const { extendProp: { userDic, dictionary } } = colPropsCopy[columnIndex];
        if (userDic && userDic.values) {
          userDic.values = userDic.values.filter(item => item.name.indexOf(keyWord) > -1)
        } else if (dictionary && dictionary.values) {
          const { nameField } = dictionary;
          dictionary.values = dictionary.values.filter(item => item[nameField].indexOf(keyWord) > -1);
        }
        this.setState({ colProps: colPropsCopy });
      }
      else {
        const { colProps } = _.cloneDeep(this.props.sheet.present);
        const { extendProp: { userDic, dictionary } } = colProps[columnIndex];
        if (userDic && userDic.values) {
          userDic.values.length = maxListLength;
          userDic.values.push({ name: "...", id: null, disabled: true })
        } else if (dictionary && dictionary.values) {
          const { nameField } = dictionary;
          dictionary.values.length = maxListLength;
          dictionary.values.push({ [nameField]: "...", id: null, disabled: true });
        }
        this.setState({ colProps: colPropsCopy });
      }
    }, 200);
  }
  renderCellMenu() {
    const { sheet, selectedCell } = this.props;
    const { pageParams, selectedRanges, colProps } = sheet.present;
    if (pageParams.queryType === "balanceQuery") {
      return null;
    }
    let canDecompose = false;
    if (selectedRanges && selectedRanges.length === 1) {
      const { left } = selectedRanges[0];
      if (colProps[left].measure && colProps[left].measure.id === 'BUDG_VALUE' && selectedCell.textBox.detail_key && selectedCell.textBox.value) canDecompose = true;
    }
    const Menu = connectMenu(this.menu_editgrid)((props) => (
      <ContextMenu id={props.id}>
        {
          canDecompose ?
            <MenuItem onClick={this.decomposeModal.bind(this, selectedCell)}>
              预算分解
            </MenuItem>
            :
            null
        }
        {
          selectedCell && selectedCell.textBox.decompose && pageParams.queryType === 'edit' ?
            <MenuItem onClick={this.clearDecompose.bind(this, selectedCell)}>
              取消预算分解
          </MenuItem>
            :
            null
        }
        {/* <MenuItem onClick={this.adjustModal.bind(this, '调增')}>
          调增
        </MenuItem>
        <MenuItem onClick={this.adjustModal.bind(this, '调减')}>
          调减
        </MenuItem> */}
        <MenuItem onClick={this.copyColum}>
          复制
        </MenuItem>
        <MenuItem onClick={this.clearSelectedCellContent}>
          清除内容
        </MenuItem>
      </ContextMenu>
    ));
    return <Menu />;
  }
  renderTableMenu() {
    return null;
  }
  renderRowMenu() {
    const Menu = connectMenu(this.menu_row)((props) => (
      <ContextMenu id={props.id}>
        <MenuItem onClick={() => this.setState({ attachmentModalVisible: true })}>
          附件
        </MenuItem>
        <MenuItem onClick={this.setFrozenRow}>
          冻结到此行
        </MenuItem>
        <MenuItem onClick={this.clearFrozenRow}>
          取消冻结行
        </MenuItem>
      </ContextMenu>
    ));
    return <Menu />;
  }
  handleBatchCopyClick = () => {
    const dialog = this.refs['batchCopyDialog'];
    dialog.openDialog({ rowsCount: this.model.tableRows.length }).then(result => {
      if (result) {
        const { sourceRow, targetRowFrom, targetRowTo } = result;
        this.actions.batchCopyCellValue({ sourceRow, targetRowFrom, targetRowTo });
      }
    });
  }
  renderColMenu() {
    const Menu = connectMenu(this.menu_column)((props) => (
      <ContextMenu id={props.id}>
        <MenuItem onClick={this.handleBatchCopyClick}>
          批量复制数据
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

  renderCellExtra(args) {
    // const { rowIndex, columnIndex, cell } = args;
    // const { colProps } = this.model;
    // const colProp = colProps[columnIndex];
    // // 被驳回的非公式显示可编辑图标
    // if (cell.textBox.data && cell.textBox.data.detail_state < 0
    //   && !cell.textBox.expression && colProp.measure) {
    //   return (
    //     <div className='spreadsheet-little-icon' style={{
    //       position: "absolute",
    //       right: 0, top: 0,
    //       padding: '2px',
    //       fontSize: 10,
    //       fontFamily: 'SimSun',
    //       color: '#999',
    //       pointerEvents: 'none',
    //     }}><Icon type="edit" /></div>
    //   );
    // }
  }

  renderCellContent({ rowIndex, columnIndex, cell, width, height, editingCell }) {
    const { sheet, selectSingleLeafNode } = this.props;
    const { selectedRanges, rowProps, tableRows, pageParams, colProps } = sheet.present;
    const { optType, state, queryType, mainState } = pageParams;
    let showJianJian = false;
    // 扩展属性值
    if (rowProps && rowProps[rowIndex] && (rowProps[rowIndex].dimensionData || rowProps[rowIndex].rowType === 'float')
      && colProps && colProps[columnIndex] && colProps[columnIndex].extendProp) {
      if (queryType === 'sumManaAudit') {
        // 扩展属性汇总审核显示 --
        showJianJian = true;
      } else {
        const { extendProp } = this.state.colProps[columnIndex];
        let selectInfo = getSelectList(extendProp, cell.textBox.value);
        let values = selectInfo.values;
        let nameField = selectInfo.nameField;

        if (values) {
          return (
            <Select
              disabled={(mainState !== '1' && mainState !== '2') || (mainState === '2' && cell.textBox.data && cell.textBox.data.detail_state !== -1) ? 'disabled' : ''}
              size='small'
              showSearch
              onSearch={this.handleSelectSearch.bind(this, columnIndex)}
              filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
              style={{ width: '100%' }}
              value={cell.textBox.value === '' ? undefined : cell.textBox.value}
              placeholder="请选择"
              notFoundContent="未找到"
              onChange={v => {
                this.handleCommitEdit({ rowIndex, columnIndex }, v);
              }}
              onFocus={this.handleSelectSearch.bind(this, columnIndex)}
              optionFilterProp="children"
            >
              <Select.Option value=''>(无)</Select.Option>
              {values.map((item) => {
                return <Select.Option disabled={item.disabled} value={item.id ? item.id.toString() : item.id}>{item[nameField]}</Select.Option>
              })}
            </Select>
          );
        }
      }
    }
    if (showJianJian) {
      cell = { ...cell, textBox: { ...cell.textBox, value: '--' } };
    }
    const rowProp = rowProps[rowIndex];
    const colProp = colProps[columnIndex];
    const rules = this.props.ctrlRules;
    if (rowProp.dimensionData && colProp.measure && colProp.measure.id === 'BUDG_RULE') {
      const copyCell = lodash.cloneDeep(cell);
      let value = copyCell.textBox.value;
      if (value) {
        const result = value.split(',').map(item => {
          const rule = rules.find(r => r.ruleCode === item);
          return rule ? rule.ruleName : item;
        }).join(',');
        copyCell.textBox.value = result;
        return (
          super.renderCellContent({ rowIndex, columnIndex, cell: copyCell, width, height, editingCell })
        )
      }

    }
    if (rowProps && rowProps[rowIndex] && rowProps[rowIndex].rowType === 'float') {
      const isCurrentEditing = editingCell && editingCell.row === rowIndex && editingCell.col === columnIndex;
      if (isCurrentEditing) {
        // 输入框不由 TextBox 来渲染
        return;
      }
      let textBox = cell.textBox;
      let title = '';
      if (!this.model.showFormula
        && cell.id
        && !isCurrentEditing) {
        const { indexMap } = this.model;
        if (indexMap && indexMap[cell.id]) {
          const { code, name } = indexMap[cell.id];
          textBox = { ...textBox, value: `[${name}]` };
        }
      }
      const hiden = (
        (optType === '1' && (state === '5' || state === '6' || state === '3'))
        || (optType === '2')
        || (optType === '3')
      );
      if (cell.textBox.data && cell.textBox.data.detail_state < 0) {
        const rejectRecord = cell.textBox.rejectRecord;
        if (rejectRecord && rejectRecord.length) {
          const rejectInfo = [];
          for (let i = 0, j = rejectRecord.length; i < j; i++) {
            let rejectText = ''
            if (rejectRecord[i].budgValue) {
              rejectText = `提交值：${rejectRecord[i].budgValue ? rejectRecord[i].budgValue : '无'}，审核值：${rejectRecord[i + 1].requestValue ? rejectRecord[i + 1].requestValue : '无'}，审核意见：${rejectRecord[i + 1].opinion ? rejectRecord[i + 1].opinion : '无'}`;
              i++;
            }
            else {
              rejectText = `提交值：无，审核值：${rejectRecord[i].requestValue ? rejectRecord[i].requestValue : '无'}，审核意见：${rejectRecord[i].opinion ? rejectRecord[i].opinion : '无'}`;
            }
            rejectInfo.push(rejectText);
          }
          title = rejectInfo.reverse().join('\n');
        }
        textBox = produce(textBox, draft => {
          draft.backGroundColor = 'yellow';
        });
      }
      return (
        <React.Fragment>
          <TextBox
            title={title}
            textBox={textBox}
            defaultTextBox={defaultTextBox}
            format={this.formatCellValue}
            {...{ rowIndex, columnIndex, width, height }}
            onDrop={this.handleTextBoxDrop}
            onBeginEdit={this.handleBeginEdit}
            onCommitEdit={this.handleCommitEdit}
            // renderDimension={this.renderDimension}
            // isEditing={isCurrentEditing}
            fontSizeUnit='pt'
            className={(cell.disabled || colProps[columnIndex].disabled) ? 'cell-disabled' : undefined}
          />
          {/* {(!cell.disabled) && textBox.bindDimension && (!hiden) && <div style={{ position: 'absolute', left: 0, top: 0, width: '100%' }}>
            <AutoComplete
              dataSource={this.state.dimDataList}
              style={{ width: '100%', height: '100%' }}
              onFocus={() => {
                this.actions.clearSelectCell();
                this.setState({ dimDataList: [] });
              }}
              onChange={(value) => { console.log(value) }}
              onBlur={() => { }}
              // backfill={true}
              onSearch={(value) => {
                clearTimeout(searchTimer);
                searchTimer = setTimeout(() => {
                  this.getDimensionValuesByKeyword(rowIndex, columnIndex, value)
                }, 250)
              }}
              // onSelect={}
              placeholder="维度填写"
              size="small"
            /></div>} */}
          {(!cell.disabled) && textBox.bindDimension && (!hiden) && <span
            style={{
              position: 'absolute',
              display: 'inline-block',
              width: '24px',
              height: '100%',
              backgroundColor: '#fff',
              top: '0px',
              right: '0px',
            }}
            onClick={() => this.renderDimension(rowIndex, columnIndex)}
          >
            <i className="icon iconfont icon-search"></i>
          </span>}
        </React.Fragment>
      );
    } else {
      let title = '';
      if (cell.textBox.data && cell.textBox.data.detail_state < 0) {
        if (queryType === 'sumManaAudit') {
          // 驳回的显示信息
          let finance_reply_value = cell.textBox.data.finance_reply_value || '';
          let opinion = cell.textBox.data.opinion || '';
          title = `审核值：${finance_reply_value}，审核意见：${opinion}`;
        }
        else {
          const rejectRecord = cell.textBox.rejectRecord;
          if (rejectRecord && rejectRecord.length) {
            const rejectInfo = [];
            for (let i = 0, j = rejectRecord.length; i < j; i++) {
              let rejectText = ''
              if (rejectRecord[i].budgValue) {
                rejectText = `提交值：${rejectRecord[i].budgValue ? rejectRecord[i].budgValue : '无'}，审核值：${rejectRecord[i + 1].requestValue ? rejectRecord[i + 1].requestValue : '无'}，审核意见：${rejectRecord[i + 1].opinion ? rejectRecord[i + 1].opinion : '无'}`;
                i++;
              }
              else {
                rejectText = `提交值：无，审核值：${rejectRecord[i].requestValue ? rejectRecord[i].requestValue : '无'}，审核意见：${rejectRecord[i].opinion ? rejectRecord[i].opinion : '无'}`;
              }
              rejectInfo.push(rejectText);
            }
            title = rejectInfo.reverse().join('\n');
          }
        }
        cell = produce(cell, draft => {
          draft.textBox.backGroundColor = 'yellow';
        });
        // 17.归口科室汇总驳回后，编制样表展示时审核金额和预算金额不一致，BI单元格有颜色提示；
        // const { BUDG_VALUE, MANA_REPLY_VALUE } = cell.textBox.data;
        // if (BUDG_VALUE !== MANA_REPLY_VALUE) {
        //   cell = produce(cell, draft => {
        //     draft.textBox.backGroundColor = 'yellow';
        //   });
        // }
      } else if (cell.textBox.data) {
        // title = `预算值：${cell.textBox.data.BUDG_VALUE || ''}`;
        title = cell.textBox.value;
      }
      const rowProp = rowProps[rowIndex];
      const colProp = colProps[columnIndex];
      let isShow = queryType != 'edit' && ((cell.textBox.value && cell.textBox.value.includes && cell.textBox.value.includes('FX.取参考数')) || (cell.textBox.expression && cell.textBox.expression.includes && cell.textBox.expression.includes('FX.取参考数')))

      if (rowProp.dimensionData && colProp.measure && colProp.measure.id === 'METHOD') {
        // 编制方法
        cell = produce(cell, draft => {
          const val = draft.textBox.value;
          if (val === 1) {
            draft.textBox.value = '零基'
          } else if (val === 2) {
            draft.textBox.value = '弹性'
          } else if (val === 3) {
            draft.textBox.value = '增量'
          }
        });

      }
      return (
        <React.Fragment>
          {
            isShow && (
              <Icon type="setting"
                onClick={this.updateFXReferenceExp.bind(this, rowIndex, columnIndex, cell.textBox.expression)}
                style={{
                  position: 'absolute',
                  top: '0px',
                  left: '0px',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              />
            )
            // (<i className={'icon iconfont icon-menufold'}
            //   onClick={this.updateFXReferenceExp.bind(this, rowIndex, columnIndex, cell.textBox.expression)}
            //   style={{
            //     position: 'absolute',
            //     top: '0px',
            //     left: '0px',
            //   }} />)
          }

          {super.renderCellContent({ rowIndex, columnIndex, cell, width, height, editingCell, title })}
        </React.Fragment>
      )
    }
  }
  updateFXReferenceExp = (rowIndex, columnIndex, exp) => {
    this.setState({
      budgetReferenceVisible: true
    })
    let index = exp.indexOf('FX.取参考数');
    let value = exp.slice(index);
    let end = value.indexOf(')');
    value = value.slice(0, end);
    let array = value.split(',')
    let length = array.length;
    console.log(value)
    this.budgetReferenceMap = {
      takeType: array[length - 3],
      yearNum: array[length - 2],
      aggregationType: array[length - 1],
      rowIndex, columnIndex,
    }
  }
  getDimensionValuesByKeyword = async (rowIndex, columnIndex, keyword) => {
    this.actions.clearSelectCell();
    const { rowProps, tableRows, colProps } = this.model;
    const { pageParams } = this.props;
    if (rowProps && rowProps[rowIndex] && rowProps[rowIndex].rowType === 'float') {
      const currentRow = tableRows[rowIndex];
      const dataKey = currentRow[columnIndex].dimensionData.dimension.id;
      const dimDisplay = currentRow[columnIndex].dimensionData.dimension.dimDisplay;
      const floatRowDimensionCondition = currentRow[columnIndex].floatRowDimensionCondition;
      const existedDimValueIdSet = new Set();
      const dimsMap = new Map(); // 除当前列以外的维度组合，以列索引为键
      for (let i = 0; i < currentRow.length; i++) {
        const cell = currentRow[i];
        if (i !== columnIndex && cell.dimensionData && cell.dimensionData.dimension) {
          dimsMap.set(i, cell.dimensionData);
        }
      }
      for (let i = 0; i < tableRows.length; i++) {
        const tableRow = tableRows[i];
        // 判断除当前列以外，维度组合是否和当前行相同。
        let dimsMatch = [...dimsMap.keys()].findIndex(col => {
          const dim = dimsMap.get(col);
          const currentDim = tableRow[col].dimensionData;
          const notSame = !currentDim
            || !currentDim.dimension
            || currentDim.dimension.id !== dim.dimension.id
            || !!currentDim.value !== !!dim.value
            || (currentDim.value && dim.value && currentDim.value.id !== dim.value.id);
          // console.log('notSame', notSame, i, col, dim, currentDim);
          return notSame;
        }) < 0;
        // console.log('dimsMatch', dimsMatch, i);
        const cell = tableRow[columnIndex];
        if (dimsMatch && cell.dimensionData && cell.dimensionData.dimension && cell.dimensionData.dimension.id === dataKey) {
          if (cell.dimensionData.value) {
            const dimValueId = cell.dimensionData.value.id;
            existedDimValueIdSet.add(dimValueId);
          }
        }
      }
      // this.setState({
      //   showDimension: true,
      //   selectRowIndex: rowIndex,
      //   selectColumnIndex: columnIndex,
      //   bindDimensionDataKey: dataKey,
      //   bindDimDisplay: dimDisplay,
      //   floatRowDimensionCondition,
      //   floatRowIndex: rowIndex,
      //   existedDimValueIdSet,
      // })
      // console.log(123, { rowIndex, columnIndex, dataKey, dimDisplay, floatRowDimensionCondition, rowIndex, existedDimValueIdSet })
      // return;
      const bindDimensionDataKey = dataKey;
      const dimProps = colProps.filter(p => p && p.dimProp && p.dimProp.dimID === dataKey).map(p => p.dimProp);
      if (bindDimensionDataKey && pageParams) {
        const params = {
          dimId: bindDimensionDataKey,
          mainId: pageParams.mainId,
          compCode: pageParams.compCode,
          copyCode: pageParams.copyCode,
          acctYear: pageParams.acctYear,
          deptId: pageParams.deptId,
          conditions: (floatRowDimensionCondition ? floatRowDimensionCondition.map(item => {
            let { fieldDescribe, value, ...arg } = item;
            let result;
            while ((result = /([a-zA-Z]+)([$]+)/g.exec(value), result !== null)) {
              let exp = result[0];
              let col = addressConverter.columnNameToNumber(result[1]) - 1;
              let cell = tableRows[floatRowIndex][col];
              if (cell) {
                value = value.replace(exp, cell.textBox.value || '');
              } else {
                value = value.replace(exp, '');
              }
            }
            return { ...arg, value };
          }).filter(item => item.value) : [])
        }

        try {
          let itemStoreId;
          // 如果当前为事项明细，需要把事项传过去做为过滤条件。
          if (bindDimensionDataKey === 'ITEM_STORE_DETAIL_ID') {
            let itemStoreCell = tableRows[floatRowIndex][0];
            if (itemStoreCell.dimensionData
              && itemStoreCell.dimensionData.dimension
              && itemStoreCell.dimensionData.dimension.id === 'ITEM_STORE_ID'
              && itemStoreCell.dimensionData.value) {
              itemStoreId = itemStoreCell.dimensionData.value.id;
            }
          }
          let list = await fetchFloatDimensionValuesByKeyword(bindDimensionDataKey, params, dimProps.map(item => item.fieldName), itemStoreId, keyword);
          if (list.length > 100) list.length = 100;
          list = list.map(i => {
            return `${i.code} ${i.display}`;
          });
          this.setState({
            dimDataList: list,
          })
        } catch (e) {
          console.log(e)
        }
      }

    }
  }
  renderDimension = async (rowIndex, columnIndex) => {
    const { rowProps, tableRows } = this.model;
    if (rowProps && rowProps[rowIndex] && rowProps[rowIndex].rowType === 'float') {
      const currentRow = tableRows[rowIndex];
      const dataKey = currentRow[columnIndex].dimensionData.dimension.id;
      const dimDisplay = currentRow[columnIndex].dimensionData.dimension.dimDisplay;
      const floatRowDimensionCondition = currentRow[columnIndex].floatRowDimensionCondition;
      const existedDimValueIdSet = new Set();
      const dimsMap = new Map(); // 除当前列以外的维度组合，以列索引为键
      for (let i = 0; i < currentRow.length; i++) {
        const cell = currentRow[i];
        if (i !== columnIndex && cell.dimensionData && cell.dimensionData.dimension) {
          dimsMap.set(i, cell.dimensionData);
        }
      }
      for (let i = 0; i < tableRows.length; i++) {
        const tableRow = tableRows[i];
        // 判断除当前列以外，维度组合是否和当前行相同。
        let dimsMatch = [...dimsMap.keys()].findIndex(col => {
          const dim = dimsMap.get(col);
          const currentDim = tableRow[col].dimensionData;
          const notSame = !currentDim
            || !currentDim.dimension
            || currentDim.dimension.id !== dim.dimension.id
            || !!currentDim.value !== !!dim.value
            || (currentDim.value && dim.value && currentDim.value.id !== dim.value.id);
          // console.log('notSame', notSame, i, col, dim, currentDim);
          return notSame;
        }) < 0;
        // console.log('dimsMatch', dimsMatch, i);
        const cell = tableRow[columnIndex];
        if (dimsMatch && cell.dimensionData && cell.dimensionData.dimension && cell.dimensionData.dimension.id === dataKey) {
          if (cell.dimensionData.value) {
            const dimValueId = cell.dimensionData.value.id;
            existedDimValueIdSet.add(dimValueId);
          }
        }
      }
      this.setState({
        showDimension: true,
        selectRowIndex: rowIndex,
        selectColumnIndex: columnIndex,
        bindDimensionDataKey: dataKey,
        bindDimDisplay: dimDisplay,
        floatRowDimensionCondition,
        floatRowIndex: rowIndex,
        existedDimValueIdSet,
      })
    }
  }

  showGatherExpressionModal = () => {
    const { sheet } = this.props;
    const { selectedRanges, rowProps, tableRows } = sheet.present;
    if (!selectedRanges || (selectedRanges && selectedRanges.length === 0)) {
      message.warn('请选中需查看信息的单元格!');
      return false;
    }
    const { top, left, right, bottom } = selectedRanges[0];
    const array = [];
    for (let row = top; row <= bottom; row++) {
      if (!(rowProps[row].rowType && rowProps[row].rowType === 'float')) {
        for (let column = left; column <= right; column++) {
          if (tableRows[row][column] && tableRows[row][column].textBox.gatherExpression) {
            const expression = tableRows[row][column].textBox.gatherExpression;
            array.push(`第${row + 1}行第${column + 1}列汇总公式为：${expression}`);
          }
        }
      }
    }
    Modal.info({
      title: '绑定维度信息',
      width: '800',
      content: <section style={{ maxHeight: '300px', overflow: 'auto' }}>
        {array.length === 0 && <p>暂无汇总公式信息</p>}
        {array.map(item => {
          return <p>{item}</p>
        })}
      </section>,
      okText: '确认',
    });
  }
}

class BudgetRuntimeContainer extends Component {
  static contextTypes = {
    // 是否在弹窗中
    isInModal: PropTypes.bool
  }

  search;
  pageParams = {};
  constructor(props) {
    super(props);
    // 查询字符串
    this.search = this.props.location.search;
    // 页面参数
    if (this.search.indexOf('?') === 0) {
      let array = this.search.slice(1).split('&');
      for (const str of array) {
        const pair = str.split('=');
        if (pair.length === 2) {
          const value = decodeURIComponent(pair[1]);
          if (value !== 'undefined') {
            this.pageParams[pair[0]] = value;
          }
        }
      }
      console.log('URL', 'bi/visualizationModel/Budget/runtime', this.search);
      console.log('pageParams', this.pageParams);
    }
  }
  handleMessage = (ev) => {
    const { data } = ev;
    // console.log('handleMessage', data);
    if (data.type === 'reject') {
      this.props.dispatch({ type: 'BudgetRuntime/onReject' });
    } else if (data.type === 'saveData') {
      this.handleSave(null, success => {
        console.log('保存回调', success);
        ev.source.postMessage({ type: 'saveDataDone', success }, '*')
      });
    }
  }
  componentDidMount() {
    this.init();
    // 接收消息
    window.addEventListener('message', this.handleMessage, false);
  }
  componentWillUnmount() {
    window.removeEventListener('message', this.handleMessage, false);
    console.log('BudgetRuntime--componentWillUnmount');
  }
  init = (conditions) => {
    const { queryType } = this.pageParams;
    // queryType:base/edit/audit/manaAudit/reply(后两种需要汇总科室)
    if (queryType === 'manaAudit' || queryType === 'reply') {
      // 明细审核走这里
      this.props.dispatch({ type: 'BudgetRuntime/initGather2', dispatch: this.props.dispatch, pageParams: this.pageParams });
    }
    // optType === 4的时候，只加载对应模版数据+汇总公式值
    else if (this.pageParams.optType == 4) {
      this.props.dispatch({ type: 'BudgetRuntime/initGather', dispatch: this.props.dispatch, pageParams: this.pageParams });
    } else {
      // 编制、汇总审核走这里
      this.props.dispatch({
        type: 'BudgetRuntime/initAsync', dispatch: this.props.dispatch, pageParams: this.pageParams, conditions, cb: () => {
          if (!this.refs.bi || !ReactDOM.findDOMNode(this.refs.bi).closest) return;
          let target = ReactDOM.findDOMNode(this.refs.bi).closest('.react-grid-item');
          if (!target) return;
          var style = target.getAttribute('style');
          if (style.indexOf('transform') > -1) {
            style = style.replace('transform: translate(16px, 16px);', '') + 'margin:16px 0 0 16px; z-index:0;';
          }
          target.setAttribute('style', style);
        }
      });
    }
  }
  needSave() {
    return false;
  }
  handleSave = (ev, cb) => {
    this.props.dispatch({ type: 'BudgetRuntime/saveData', cb });
  }
  toolBarData() {
    const { state, optType, auditWay } = this.pageParams;
    const showSaveBtn = !(optType === '1' && (state === '5' || state === '6'));
    const hideBtn = (
      // 按表样审核不能保存
      (optType === '2' && auditWay === '02') ||
      // 按科室审核时，当所有返回数据中有detail_state=10或11时才显示保存按钮
      (optType === '2' && auditWay === '01' && !this.props.has10or11) ||
      (optType === '1' && (state === '5' || state === '6' || state === '3')) ||
      // 财务审核不能保存
      (optType === '4')
    );
    if (hideBtn) {
      return [];
    }
    return [
      {
        title: '保存',
        type: 'save',
        component: <div style={{ color: 'black' }}>
          <i onClick={this.handleSave} className={'icon iconfont icon-save'} />
          <span onClick={this.handleSave} style={{ verticalAlign: '1px', paddingLeft: '2px' }}>保存</span>
        </div>,
        className: 'icon iconfont icon-save',
        handler: this.handleSave,
      },
    ];
  }

  getPageDimensionDisplay(item) {
    const { pageParams } = this;
    if (item.dimension.id === 'DEPT_ID') {
      return pageParams.disDeptName || pageParams.deptName; //  职能审批界面，显示的科室名称为选中的科室名称
    } else if (item.dimension.id === 'BUDG_VERSION') {
      return pageParams.versionName;
    } else if (item.dimension.id === 'ACCT_YEAR') {
      return pageParams.acctYear;
    }
  }
  renderHeader() {
    const { pageDimensions } = this.props.sheet.present;
    if (!pageDimensions) return;

    const children = [];
    for (let i = 0; i < pageDimensions.length; i++) {
      const item = pageDimensions[i];
      children.push(
        <Col span={8} key={i}>
          <FormItem
            labelCol={{ span: 7 }}
            wrapperCol={{ span: 17 }}
            label={item.dimension.dimDisplay}
          >
            {/* <Select style={{ width: '100%' }}>
              {item.dimensionValues.map(v => (
                <Select.Option key={v.id}>{v.display}</Select.Option>
              ))}
            </Select> */}
            <Input size='small' readOnly value={this.getPageDimensionDisplay(item)}></Input>
          </FormItem>
        </Col>
      );
    }
    return <Row gutter={24}>{children}</Row>;
  }
  render() {
    if (!this.props.sheet) {
      return null;
    }
    const title = '预算编制';
    let className = 'spreadsheet-model spreadsheet-runtime budget-runtime';
    if (this.context && this.context.isInModal) {
      className += ' spreadsheet-model-in-modal';
    }
    return (
      <div ref="bi" className='bi' style={{ height: '100%' }}>
        <div className={className} style={{
          overflow: 'hidden',
          height: '100%',
        }}>
          <ToolBar data={this.toolBarData()} title={title} />
          <div style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* <div style={{ marginLeft: 10, marginRight: 10 }}>
              {this.renderHeader()}
            </div> */}
            <BudgetRuntime
              areaName='printBodyArea'
              {...this.props}
              setupConditions={this.init}
              pageParams={this.pageParams}
              hideToolbar={false}
              readOnly={false}
              isCellHidden={true}
              reportName={this.pageParams.budgetName || '预算报表'}
            />
            {this.props.loading && <Spin size="large" />}
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  sheet: state.BudgetRuntime.ReportBody.sheets[0],
  plan: state.BudgetRuntime.plan,
  has10or11: state.BudgetRuntime.has10or11,
  loading: state.BudgetRuntime.loading,
  selectedCell: getSelectedCell(state, 'BudgetRuntime'),
  spreadSheet: getSheet(state),
  ctrlRules: state.BudgetRuntime.ctrlRules
});

const mapDispatchToProps = (dispatch) => ({
  actions: bindTableActions(dispatch),
  dispatch,
});

export default connect(mapStateToProps, mapDispatchToProps)(BudgetRuntimeContainer);