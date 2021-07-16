import React, { Component } from 'react';
import { Collapse, Select, Input, Tooltip, InputNumber, Radio, Checkbox, Row, Col, TreeSelect, Button } from '@vadp/ui';
import { connect } from 'react-redux';
import { fetchDimensionList, fetchDimensionValues } from '../BudgetApi';
const Panel = Collapse.Panel;
import PropertyUtils from '../../tableDesigner/components/PropertyUtils';
import FormatType from '../../tableDesigner/components/table/FormatType';
import addressConverter from 'xlsx-populate/lib/addressConverter';
import { getAnalysisFields } from '../SpreadsheetApi';
import _ from 'lodash';

import {
  getSelectedCell,
  getSelectedRow,
  getSelectedCol,
  getSelectedCellTextBox,
  getSelectedCellFontInfo,
  getCurrentSelection,
  getTableRows,
  getSheet,
  getAllBorder,
  getOuterBorder,
  getInnerBorder,
  getTopBorder,
  getLeftBorder,
  getRightBorder,
  getBottomBorder,
  borderStyles,
} from "../SpreadsheetSelectors";
import Message from 'public/Message';
import ColorPicker from 'components/Print/ColorPicker';
import Common from 'components/Print/Common';
import * as SpreadsheetUtils from './SpreadsheetUtils';
import FormulaEditorModal from './FormulaEditorModal';
import { createFormulaCategaries } from './Expression/formulaDefinition';
import { validateWithLexerAndParser } from 'components/Public/ExpressionEditor';
import { FormulaLexer } from '../formulaCalc/FormulaLexer';
import { FormulaParser } from '../formulaCalc/FormulaParser';
import { isHttpPublic } from 'constants/IntegratedEnvironment';
import DimensionConditionModal from './DimensionConditionModal';
import AnalysisSortModal from './AnalysisSortModal';
import axios from 'axios';

const common = new Common();
const Option = Select.Option;
const TreeNode = TreeSelect.TreeNode;

const spanCss = {
  marginTop: 5,
};
const selectStyle = {
  width: '100%',
  marginRight: '16px',
};

const PropertyItem = props => (
  <div className="divCss">
    <span className=" w76 fll" style={spanCss}>{props.title}</span>
    <div style={{ display: 'inline-block', width: '68%', marginLeft: '10px' }} >
      {props.children}
    </div>
  </div>
);

const PropertyGroupItem = props => {
  let titleSpan = 5;
  return (
    <Row style={{ margin: '3px 0' }}>
      <Col span={titleSpan}><div style={{ marginTop: 5 }}>{props.title}</div></Col>
      <Col span={24 - titleSpan}>
        {props.children}
      </Col>
    </Row>
  );
};

class EditInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editing: false,
    };
  }
  commitEdit() {
    const value = this.refs.input.input.value;
    const { onCommit } = this.props;
    onCommit && onCommit(value);
  }
  handleChange = (e) => {
    this.setState({ value: e.target.value });
  }
  handleFocus = (e) => {
    this.setState({ editing: true, value: this.props.value });
  }
  handleBlur = (e) => {
    this.setState({ editing: false });
    this.commitEdit();
  }
  handlePressEnter = (e) => {
    // document.getElementById('property_expand').focus();
  }
  handleKeyDown = (e) => {
    if (e.keyCode === 13) {
      this.setState({ editing: false });
      this.commitEdit();
    } else if (e.keyCode === 27) {
      this.setState({ editing: false, value: '' });
    }
  }
  render() {
    const value = this.state.editing ? this.state.value : this.props.value;
    const { type, placeholder } = this.props;
    const props = { type, placeholder, value };
    if (this.state.editing) {
      return (
        <Input key='input' {...props} ref='input'
          autoFocus
          onChange={this.handleChange}
          onBlur={this.handleBlur}
          onPressEnter={this.handlePressEnter}
          onKeyDown={this.handleKeyDown}
        />
      );
    } else {
      return (
        <Input key='show' {...props} readOnly
          onFocus={this.handleFocus}
        />
      );
    }
  }
}

class SpreadsheetProperty extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fieldList: [],
      analysisModels: [],
      bindFieldList: { "default": [] },
      dimensionConditionVisible: false,
      historyDimensionConditionVisible: false,
      analysisModelConditionVisible: false,
      analysisSortModelVisible: false
    };
    this.loadDimension(props);
  }
  componentDidMount() {
    this.getFieldList(this.props);
    if (this.props.sheet) {
      this.categorySelectChange(true, this.props.sheet.categoryID);
    }
  }
  componentWillReceiveProps(nextProps) {
    const state = _.cloneDeep(this.state);
    const analysisModelId = nextProps.selectedCell ? nextProps.selectedCell.textBox.analysisModelId : undefined;
    if (analysisModelId) {
      if (!state.bindFieldList[analysisModelId]) {
        getAnalysisFields(analysisModelId).then(fields => {
          state.bindFieldList[analysisModelId] = fields;
          this.setState(state);
        }).catch(data => {
          console.log(data);
        });
      }
    }
    this.getFieldList(nextProps);

  }
  getFieldList = (props) => {
    const { selectedRow } = props;
    if (!selectedRow) {
      return [];
    }
    const { analysisModelId } = selectedRow;
    if (!analysisModelId) {
      return [];
    }
    getAnalysisFields(analysisModelId).then(fields => {
      this.setState({ fieldList: fields });
    }).catch(data => {
      console.log(data);
    });
  }
  loadDimension = async (props) => {
    try {
      let dimensionList = await fetchDimensionList(props.spreadsheet.pageParams.modelId);
      dimensionList = dimensionList.filter(x => x.id !== 'ACCT_YEAR' && x.id !== 'BUDG_VERSION');
      this.setState({
        dimensionList
      })
    } catch (e) {

    }
  }

  handleFormatTypeChange = (value) => {
    this.props.actions.updateCellFormatStyle(value);
  };
  handleChangeBackgroundColor = (color) => {
    this.props.actions.updateCellBackgroundColor(color);
  }
  handleChangeFontColor = (color) => {
    this.props.actions.updateCellFontColor(color);
  }
  handleFontFamilyChange = (value) => {
    this.props.actions.updateCellFontFamily(value);
  }
  handleFontSizeChange = (value) => {
    this.props.actions.updateCellFontSize(value);
  }

  // -----边框线
  handleAllBorderStyleChange = (value) => {
    this.props.actions.setAllBorderStyle(value);
  }
  handleOuterBorderStyleChange = (value) => {
    this.props.actions.setOuterBorderStyle(value);
  }
  handleInnerBorderStyleChange = (value) => {
    this.props.actions.setInnerBorderStyle(value);
  }
  handleLeftBorderStyleChange = (value) => {
    this.props.actions.setLeftBorderStyle(value);
  }
  handleTopBorderStyleChange = (value) => {
    this.props.actions.setTopBorderStyle(value);
  }
  handleRightBorderStyleChange = (value) => {
    this.props.actions.setRightBorderStyle(value);
  }
  handleBottomBorderStyleChange = (value) => {
    this.props.actions.setBottomBorderStyle(value);
  }

  // -----边框颜色
  handleAllBorderColorChange = (value) => {
    this.props.actions.setAllBorderColor(value);
  }
  handleOuterBorderColorChange = (value) => {
    this.props.actions.setOuterBorderColor(value);
  }
  handleInnerBorderColorChange = (value) => {
    this.props.actions.setInnerBorderColor(value);
  }
  handleLeftBorderColorChange = (value) => {
    this.props.actions.setLeftBorderColor(value);
  }
  handleTopBorderColorChange = (value) => {
    this.props.actions.setTopBorderColor(value);
  }
  handleRightBorderColorChange = (value) => {
    this.props.actions.setRightBorderColor(value);
  }
  handleBottomBorderColorChange = (value) => {
    this.props.actions.setBottomBorderColor(value);
  }
  handleWrapChange = e => {
    this.props.actions.setWrap(e.target.checked ? 'wrap' : 'nowrap');
  }
  handleAutoMergeChange = e => {
    this.props.actions.setAutoMerge(e.target.checked);
  }
  handleRowTypeChange = (value) => {
    this.props.actions.updateRowType(value);
  }
  handleRowIsHiddenChange = (e) => {
    this.props.actions.setRowIsHidden(e.target.checked);
  }
  handleRowIsRepeatPrintChange = (e) => {
    this.props.actions.setRowIsRepeatPrint(e.target.checked);
  }
  handleRowFilterFormulaChange = (text) => {
    this.props.actions.setRowFilterFormula(text);
  }
  handleRowComputFilterFormulaChange = (text) => {
    this.props.actions.setRowComputFilterFormula(text);
  }
  handleColIsHiddenChange = (e) => {
    this.props.actions.setColIsHidden(e.target.checked);
  }
  handleColIsCheckChange = (e) => {
    this.props.actions.setColIsCheck(e.target.checked);
  }
  handleColCanEditChange = (e) => {
    this.props.actions.setColCanEdit(e.target.checked);
  }
  handleColCompareValChange = (e) => {
    this.props.actions.setColCompareVal(e.target.value);
  }
  handleColIsCheckOperatorChange = (v) => {
    this.props.actions.setColIsCheckOperator(v);
  }
  handleColDisabledChange = (e) => {
    this.props.actions.setColDisabled(e.target.checked);
  }
  handleColWorkflowChange = (value) => {
    this.props.actions.setColWorkflow(value);
  }
  handleIsSumChange = (value) => {
    this.props.actions.setColIsSum(value);
  }
  handleCellDisabledChange = (e) => {
    this.props.actions.setCellDisabled(e.target.checked);
  }
  handleCellRequiredChange = (e) => {
    this.props.actions.setCellRequired(e.target.checked);
  }
  setFloatRowDimensionCondition = (selectedRow, selectedCol, floatRowDimensionCondition) => {

    this.props.actions.setFloatRowDimensionCondition && this.props.actions.setFloatRowDimensionCondition(selectedRow, selectedCol, floatRowDimensionCondition);
  }
  handleBindDimension = (e) => {
    const { dimensionList } = this.state;
    const value = dimensionList && dimensionList.find(i => i.id === e);
    if (value) {
      this.props.actions.setBindDimension(value);
    }
  }
  handleBindIDField = (value) => {
    this.props.actions.setIDField(value);
  }
  handleHistoryDimChange = (e) => {
    const { dimensionList } = this.state;
    const value = dimensionList && dimensionList.find(i => i.id === e);
    this.props.actions.setHistoryDim(value);
  }
  handleHistoryDimYearsChange = (value) => {
    this.props.actions.setHistoryDimYears(value);
  }
  handleHistoryDimConditionChange = (value) => {
    this.props.actions.setHistoryDimConditions(value)
  }
  setAnalysisModelConditions = (value) => {
    this.props.actions.setAnalysisModelConditions(value)
  }
  setAnalysisSortExpressions = (value) => {
    this.props.actions.setAnalysisSortExpressions(value)
  }
  handlePrintAutoSizeChange = (value) => {
    this.props.actions.updateCellPrintAutoSize(value);
  };
  handleRowExpressionChange = (value, e) => {
    this.props.actions.updateRowExpression([value], e.props.children);
  }
  handleMergeNumberChange = (value) => {
    this.props.actions.updateMergeNumber(value);
  }
  handleMergeTextChange = (e) => {
    this.props.actions.updateRowText(e.target.value);
  }
  handleDoNotSumChange = e => {
    this.props.actions.setDoNotSum(e.target.checked);
  }
  hadnleLoanProp = (value) => {
    this.props.actions.updateCellLoanProp(value);
  }
  renderBorderSelect = (border, onStyleChange, onColorChange) => {
    const style = border && border.style;
    const color = border && border.color;
    return (
      <div>
        {this.renderBorderStyleSelect(style, onStyleChange)}
        {this.renderBorderColorSelect(color, onColorChange)}
      </div>
    );
  }
  renderBorderStyleSelect = (value, onChange) => {
    return (
      <Select
        // labelInValue
        style={{ display: 'inline-block', width: '60%' }}
        value={value}
        onSelect={onChange}
      >
        <Option key='none'>无</Option>
        {borderStyles.map(s => (
          <Option key={s.name}>
            <div style={{
              borderWidth: `${s.cssWidth}px 0 0 0`,
              borderStyle: s.cssStyle,
              borderColor: 'black',
              margin: '12px 0 10px 5px',
              width: 50,
            }}></div>
          </Option>
        ))}
      </Select>
    );
  }
  renderBorderColorSelect = (value, onChange) => {
    return (
      <ColorPicker
        onChangeComplete={onChange}
        color={value || 'black'}
      />
    );
  }
  renderBorderStyle = (cell) => {
    const { selection, tableRows } = this.props;
    return (
      <PropertyItem title='边框样式' style={{ height: 'initial' }}>
        <div className='border-settings'>
          <PropertyGroupItem title='全部'>
            {this.renderBorderSelect(getAllBorder(selection, tableRows),
              this.handleAllBorderStyleChange, this.handleAllBorderColorChange)}
          </PropertyGroupItem>
          <PropertyGroupItem title='外框'>
            {this.renderBorderSelect(getOuterBorder(selection, tableRows),
              this.handleOuterBorderStyleChange, this.handleOuterBorderColorChange)}
          </PropertyGroupItem>
          <PropertyGroupItem title='内部'>
            {this.renderBorderSelect(getInnerBorder(selection, tableRows),
              this.handleInnerBorderStyleChange, this.handleInnerBorderColorChange)}
          </PropertyGroupItem>
          <PropertyGroupItem title='上'>
            {this.renderBorderSelect(getTopBorder(selection, tableRows),
              this.handleTopBorderStyleChange, this.handleTopBorderColorChange)}
          </PropertyGroupItem>
          <PropertyGroupItem title='右'>
            {this.renderBorderSelect(getRightBorder(selection, tableRows),
              this.handleRightBorderStyleChange, this.handleRightBorderColorChange)}
          </PropertyGroupItem>
          <PropertyGroupItem title='下'>
            {this.renderBorderSelect(getBottomBorder(selection, tableRows),
              this.handleBottomBorderStyleChange, this.handleBottomBorderColorChange)}
          </PropertyGroupItem>
          <PropertyGroupItem title='左'>
            {this.renderBorderSelect(getLeftBorder(selection, tableRows),
              this.handleLeftBorderStyleChange, this.handleLeftBorderColorChange)}
          </PropertyGroupItem>
        </div>
      </PropertyItem>
    );
  }
  getFont() {
    return common.getFont().filter(name => {
      const first = name[0];
      if ((first >= 'a' && first <= 'z') || (first >= 'A' && first <= 'Z')) {
        return false;
      }
      return true;
    });
  }
  renderBaseGroup(textBox, fontInfo) {
    const { sheet: { rowProps }, selection } = this.props;
    const { isBudget } = this.props.spreadsheet;
    const primary = selection.primary || { top: selection.top, left: selection.left };
    const rowProp = rowProps[primary.top];
    const { formatObject, contentSourceStyle } = textBox;
    const cell = this.props.selectedCell;
    const formatValue = contentSourceStyle === 'Date' ?
      '2017-07-07 07:07:07' : (contentSourceStyle === 'Number' ? 12345 : 'abc');
    const example = PropertyUtils.conversionFormat(formatValue, formatObject);
    let fieldList = [];
    if (cell) {
      fieldList = cell.textBox.analysisModelId ? (this.state.bindFieldList[cell.textBox.analysisModelId] ? this.state.bindFieldList[cell.textBox.analysisModelId] : []) : this.state.bindFieldList.default;
    }
    return (
      <Panel header="基本属性" key="1" className="customPanelStyle">
        <div style={{ width: '270px' }}>
          <PropertyItem title='数据类型'>
            <Select
              style={selectStyle}
              value={contentSourceStyle || '请选择'}
              onChange={this.handleFormatTypeChange}
            >
              <Option value="Text">文本</Option>
              <Option value="Date">日期</Option>
              <Option value="Number">数字</Option>
            </Select>
          </PropertyItem>
          <PropertyItem title='格式样式'>
            <Input
              disabled
              type="text"
              value={example}
              addonAfter={
                <Tooltip placement="bottom" title="格式">
                  <span
                    title="格式"
                    onClick={e => {
                      if (contentSourceStyle === 'Text') {
                        Message.warning('文本格式,不需要设置格式。');
                      } else if (!contentSourceStyle) {
                        Message.warning('请先选择数据类型');
                      } else {
                        this.setState({ formatTypeModalVisible: true });
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >...</span>
                </Tooltip>
              }
            />
          </PropertyItem>
          <div className="divCss" >
            <span className=" w76 fll" style={spanCss}>背景色</span>
            <ColorPicker
              onChangeComplete={this.handleChangeBackgroundColor}
              color={textBox.backGroundColor || 'white'}
            />
          </div>
          <div className="divCss" >
            <span className=" w76 fll" style={spanCss}>前景色</span>
            <ColorPicker
              onChangeComplete={this.handleChangeFontColor}
              color={textBox.fontColor || 'black'}
            />
          </div>
          <PropertyItem title='字体'>
            <div style={{ width: '172px' }}>
              <Select value={fontInfo.family} style={{ width: '62%', height: 29 }}
                onChange={this.handleFontFamilyChange} >
                {
                  this.getFont().map((item) => {
                    return (
                      <Option key={item} value={item} title={item}>{item}</Option>
                    );
                  })
                }
              </Select>
              <InputNumber style={{ marginLeft: 3, width: '36%', height: 28, verticalAlign: 'top' }} min={6} max={36} type="text"
                value={fontInfo.size}
                onChange={this.handleFontSizeChange} />
            </div>
          </PropertyItem>
          {this.renderBorderStyle(cell)}
          <PropertyItem title='自动换行'>
            <Checkbox checked={textBox.wrap === 'wrap'} onChange={this.handleWrapChange} style={{ marginTop: 5 }}></Checkbox>
          </PropertyItem>
          {!isBudget && <PropertyItem title='展开合并'>
            <Checkbox checked={!!cell.autoMerge} onChange={this.handleAutoMergeChange} style={{ marginTop: 5 }}></Checkbox>
          </PropertyItem>}
          {
            cell.id && <PropertyItem title='借贷属性'>
              <Select
                style={selectStyle}
                value={textBox.loanProp}
                onChange={this.hadnleLoanProp}
                placeholder="请选择借贷属性"
              >
                <Option value="debit">借方</Option>
                <Option value="credit">贷方</Option>
              </Select>
            </PropertyItem>
          }
          {/* <PropertyItem title='用户指标'>
            <Radio.Group
              value={cell.isUserIndex || 'n'}
              onChange={e => {
                this.props.actions.updateCellIsUserIndex(e.target.value);
              }}>
              <Radio.Button value="y">是</Radio.Button>
              <Radio.Button value="n">否</Radio.Button>
            </Radio.Group>
          </PropertyItem>
          <PropertyItem title='指标名称'>
            <EditInput
              type="text"
              value={cell.indexName}
              onCommit={value => {
                this.props.actions.updateCellIndexName(value);
              }}
            />
          </PropertyItem> */}
          {rowProp.rowType === 'float' && !this.props.selectedRow && (
            <React.Fragment>
              <PropertyItem title='绑定维度'>
                <Select
                  style={selectStyle}
                  value={textBox.bindDimension || '请选择'}
                  onChange={this.handleBindDimension}
                >
                  {
                    this.state.dimensionList && this.state.dimensionList.map(item => {
                      return <Option value={item.id}>{item.dimDisplay}</Option>
                    })
                  }
                </Select>
              </PropertyItem>
              <PropertyItem title='绑定维度条件'>
                <Button type="primary" onClick={() => {
                  this.setState({
                    dimensionConditionVisible: true,
                  })
                }}>维度条件</Button>
              </PropertyItem>
              <PropertyItem title='绑定ID字段'>
                <Select
                  showSearch
                  style={selectStyle}
                  placeholder="请选择ID字段"
                  value={textBox.idField}
                  onChange={this.handleBindIDField}
                  filterOption={(input, option) =>
                    option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {
                    fieldList.map((item, index) => <Option key={index} value={item.fieldName}>{item.fieldName}</Option>)
                  }
                </Select>
              </PropertyItem>
            </React.Fragment>
          )}
          <PropertyItem title='禁用编辑'>
            <Checkbox checked={cell.disabled} onChange={this.handleCellDisabledChange} style={{ marginTop: 5 }}></Checkbox>
          </PropertyItem>
          <PropertyItem title='历史维度'>
            <div className='border-settings'>
              <Select
                style={selectStyle}
                value={(cell.historyDim && cell.historyDim.id) || '请选择'}
                onChange={this.handleHistoryDimChange}
              >
                <Option value={undefined}>(无)</Option>
                {
                  this.state.dimensionList && this.state.dimensionList.map(item => {
                    return <Option value={item.id}>{item.dimDisplay}</Option>
                  })
                }
              </Select>
              {cell.historyDim && cell.historyDim.id &&
                (<React.Fragment>
                  <PropertyGroupItem title='年数'>
                    <InputNumber
                      style={{ width: '100%' }}
                      value={cell.historyDimYears}
                      onChange={this.handleHistoryDimYearsChange}
                    />
                  </PropertyGroupItem>

                  <PropertyGroupItem title='条件'>
                    <Button type="primary" onClick={() => {
                      if (cell.historyDim && cell.historyDim.id) {
                        this.setState({
                          historyDimensionConditionVisible: true,
                        })
                      }
                    }}>维度条件</Button>
                  </PropertyGroupItem>
                </React.Fragment>)
              }
            </div>
          </PropertyItem>
          <PropertyItem title='必填'>
            <Checkbox checked={cell.required} onChange={this.handleCellRequiredChange} style={{ marginTop: 5 }}></Checkbox>
          </PropertyItem>
          {this.state.formatTypeModalVisible && <FormatType
            onCancel={e => this.setState({ formatTypeModalVisible: false })}
            onOk={(data) => {
              this.props.actions.updateCellFormatObject(data);
              this.setState({ formatTypeModalVisible: false });
            }}
            visible
            contentSourceStyle={contentSourceStyle}
            formatObject={formatObject}
            pageParams={this.props.pageParams}
          />}
          {
            this.state.dimensionConditionVisible && textBox.bindDimension && (
              <DimensionConditionModal
                visible={this.state.dimensionConditionVisible}
                combId={textBox.bindDimension}
                floatRowDimensionCondition={cell.floatRowDimensionCondition}
                handleOk={(floatRowDimensionCondition) => {
                  const { selectedRow, selectedCol } = this.props;
                  this.setState({
                    dimensionConditionVisible: false,
                  }, () => {
                    this.setFloatRowDimensionCondition(selectedRow, selectedCol, floatRowDimensionCondition);
                  })
                }}
                handleCancel={() => {
                  this.setState({
                    dimensionConditionVisible: false,
                  })
                }}
              />
            )
          }


          {
            this.state.historyDimensionConditionVisible && (
              <DimensionConditionModal
                visible={this.state.historyDimensionConditionVisible}
                combId={cell.historyDim && cell.historyDim.id}
                floatRowDimensionCondition={cell.historyDimConditions || []}
                handleOk={(floatRowDimensionCondition) => {
                  this.setState({
                    historyDimensionConditionVisible: false,
                  }, () => {
                    this.handleHistoryDimConditionChange(floatRowDimensionCondition);
                  })
                }}
                handleCancel={() => {
                  this.setState({
                    historyDimensionConditionVisible: false,
                  })
                }}
              />
            )
          }
        </div>
      </Panel>
    );
  }

  renderPrintGroup(textBox, fontInfo) {
    return (
      <Panel header="打印属性" key="5" className="customPanelStyle">
        <div style={{ width: '270px' }}>
          <PropertyItem title='字体自适应'>
            <Select
              style={selectStyle}
              value={textBox.printAutoSize || 'None'}
              onChange={this.handlePrintAutoSizeChange}
            >
              <Option value="None">无</Option>
              <Option value="MutiLinesAndFontAutoSize">多行内字体自适应</Option>
              <Option value="SingleLineAndFontAutoSize">单行内字体自适应</Option>
            </Select>
          </PropertyItem>
        </div>
      </Panel>
    );
  }

  renderExpandGroup(textBox) {
    const { selectedCell: cell } = this.props;
    if (!cell) {
      return null;
    }
    const expand = cell.expand || {};
    const direction = expand.direction || 'none';
    const depend = expand.depend;
    return (
      <Panel header="扩展属性" key="2" className="customPanelStyle">
        <div style={{ width: '270px' }} id='property_expand'>
          <PropertyItem title='扩展方向'>
            <Radio.Group
              value={direction}
              onChange={e => {
                this.props.actions.updateCellExpandDirection(e.target.value);
              }}>
              <Radio.Button value="none">无</Radio.Button>
              <Radio.Button value="h">横向</Radio.Button>
              <Radio.Button value="v">纵向</Radio.Button>
            </Radio.Group>
          </PropertyItem>
          {/* <PropertyItem title='依赖'>
            <EditInput
              type="text"
              value={depend}
              onCommit={value => {
                this.props.actions.updateCellDepend(value);
              }}
            />
          </PropertyItem> */}
        </div>
      </Panel>
    );
  }

  renderRowGroup() {
    let row = this.props.selectedRow;
    if (!row) {
      return;
    }
    const isBI = SpreadsheetUtils.isBI();
    const { isBudget } = this.props.spreadsheet;
    const { isFinance } = this.props.spreadsheet;
    const { analysisModelId, analysisModelConditions, sortExpressions } = row;
    return (
      <Panel header="行属性" key="3" className="customPanelStyle">
        <div style={{ width: '270px' }}>
          <PropertyItem title='行类型'>
            <Select
              style={selectStyle}
              value={row.rowType || 'fixed'}
              onChange={this.handleRowTypeChange}>
              <Select.Option value="fixed">固定行</Select.Option>
              {!isBI && <Select.Option value="float">浮动行</Select.Option>}
              {!isBudget && <Select.Option value="expand">展开行</Select.Option>}
            </Select>
          </PropertyItem>
          <PropertyItem title='隐藏行'>
            <Checkbox checked={row.isHidden} onChange={this.handleRowIsHiddenChange} style={{ marginTop: 5 }}></Checkbox>
          </PropertyItem>
          {
            analysisModelId && (<PropertyGroupItem title='条件'>
              <Button type="primary" onClick={() => {
                this.setState({
                  analysisModelConditionVisible: true,
                })
              }}>分析模型条件</Button>
            </PropertyGroupItem>)
          }
          {
            analysisModelId && (<PropertyGroupItem title='排序'>
              <Button type="primary" onClick={() => {
                this.setState({
                  analysisSortModelVisible: true,
                })
              }}>分析模型排序</Button>
            </PropertyGroupItem>)
          }
          {!isBudget && <PropertyItem title='每页打印'>
            <Checkbox checked={row.isRepeatPrint} onChange={this.handleRowIsRepeatPrintChange} style={{ marginTop: 5 }}></Checkbox>
          </PropertyItem>}
          {!isBudget && <PropertyItem title='过滤公式'>
            <Input
              disabled
              type="text"
              value={row.filterFormula}
              addonAfter={
                <Tooltip placement="bottom" title="公式">
                  <span
                    title="公式"
                    onClick={e => {
                      this.filterFormulaType = 'filterFormula';
                      this.setState({ filterFormulaModalVisible: true });
                    }}
                    style={{ cursor: 'pointer', width: '25px', display: 'inline-block' }}
                  >...</span>
                </Tooltip>
              }
            />
          </PropertyItem>}
          {!isBudget && <PropertyItem title='计算时过滤公式'>
            <Input
              disabled
              type="text"
              value={row.computFilterFormula}
              addonAfter={
                <Tooltip placement="bottom" title="公式">
                  <span
                    title="公式"
                    onClick={e => {
                      this.filterFormulaType = 'computFilterFormula';
                      this.setState({ filterFormulaModalVisible: true });
                    }}
                    style={{ cursor: 'pointer', width: '25px', display: 'inline-block' }}
                  >...</span>
                </Tooltip>
              }
            />
          </PropertyItem>}
          {this.state.filterFormulaModalVisible && <FormulaEditorModal
            title="公式编辑器"
            visible={this.state.filterFormulaModalVisible}
            defaultText={this.filterFormulaType == 'filterFormula' ? row.filterFormula : row.computFilterFormula}
            categaries={createFormulaCategaries()}
            onOk={(text) => {
              this.setState({ filterFormulaModalVisible: false });
              if (this.filterFormulaType == 'filterFormula') {
                this.handleRowFilterFormulaChange(text);
              } else {
                this.handleRowComputFilterFormulaChange(text);
              }

            }} onCancel={() => {
              this.setState({ filterFormulaModalVisible: false });
            }} validate={validateWithLexerAndParser(FormulaLexer, FormulaParser, 'exprRoot')}
          />}

          {
            this.state.analysisModelConditionVisible && analysisModelId && (
              <DimensionConditionModal
                visible={this.state.analysisModelConditionVisible}
                type={'isAnalysisModel'}
                combId={analysisModelId}
                floatRowDimensionCondition={analysisModelConditions || []}
                handleOk={(analysisModelConditions) => {
                  this.setState({
                    analysisModelConditionVisible: false,
                  }, () => {
                    this.setAnalysisModelConditions(analysisModelConditions);
                  })
                }}
                handleCancel={() => {
                  this.setState({
                    analysisModelConditionVisible: false,
                  })
                }}
              />
            )
          }

          {
            this.state.analysisSortModelVisible && analysisModelId && (
              <AnalysisSortModal
                visible={this.state.analysisSortModelVisible}
                combId={analysisModelId}
                sortExpressions={sortExpressions || []}
                handleOk={(analysisSortExpressions) => {
                  this.setState({
                    analysisSortModelVisible: false,
                  }, () => {
                    this.setAnalysisSortExpressions(analysisSortExpressions);
                  })
                }}
                handleCancel={() => {
                  this.setState({
                    analysisSortModelVisible: false,
                  })
                }}
              />
            )
          }
        </div>
      </Panel>
    );
  }

  renderExpandRow() {
    // console.log(12121,this.props)
    const { selectedRow } = this.props;
    if (!selectedRow) {
      return;
    }
    const { analysisModelId } = selectedRow;
    if (!analysisModelId) {
      return;
    }
    return (
      <Panel header="扩展信息" key="4" className="customPanelStyle">
        <PropertyItem title='表达式'>
          <Select value={selectedRow.groupFields ? selectedRow.groupFields[0] : undefined} onChange={this.handleRowExpressionChange} style={selectStyle} placeholder="请选择扩展字段" getPopupContainer={triggerNode => triggerNode.parentNode}>
            {
              this.state.fieldList.map((item, index) => {
                return (
                  <Select.Option key={item.fieldName + index} value={item.fieldName}>{item.comments}</Select.Option>
                )
              })
            }
          </Select>
        </PropertyItem>
        <PropertyItem title='合并列数'>
          <InputNumber value={selectedRow.mergeNumber} onChange={this.handleMergeNumberChange} style={{ width: '100%' }} placeholder="请输入合并列数" min={1} type="text" />
        </PropertyItem>
        <PropertyItem title='显示名称'>
          <Input value={selectedRow.mergeText} onChange={this.handleMergeTextChange} style={{ background: 'transparent' }} placeholder="请输入合并内容" />
        </PropertyItem>
      </Panel>
    )
  }

  renderColGroup() {
    let col = this.props.selectedCol;
    let sheet = this.props.sheet;
    const isShow = this.props.spreadsheet && this.props.spreadsheet.pageParams && this.props.spreadsheet.pageParams.templateId;
    if (!col) {
      return;
    }
    const { isBudget } = this.props.spreadsheet;
    return (
      <Panel header="列属性" key="4" className="customPanelStyle">
        <div style={{ width: '270px' }}>
          {/* <PropertyItem title='禁用编辑'>
            <Checkbox checked={col.disabled} onChange={this.handleColDisabledChange} style={{ marginTop: 5 }}></Checkbox>
          </PropertyItem> */}
          <PropertyItem title='隐藏列'>
            <Checkbox checked={col.isHidden} onChange={this.handleColIsHiddenChange} style={{ marginTop: 5 }}></Checkbox>
          </PropertyItem>
          {
            isShow && (<React.Fragment>
              <PropertyItem title='是否校验'>
                <Checkbox checked={col.isCheck} onChange={this.handleColIsCheckChange} style={{ marginTop: 5 }}></Checkbox>
              </PropertyItem>
              {
                col.isCheck && (<React.Fragment>
                  <PropertyItem title='校验操作符'>
                    <Select style={selectStyle}
                      placeholder="请选择操作符"
                      value={col.checkOperator}
                      onChange={this.handleColIsCheckOperatorChange}>

                      <Select.Option key='==' value='=='>等于</Select.Option>
                      <Select.Option key='>' value='>'>大于</Select.Option>
                      <Select.Option key='<' value='<'>小于</Select.Option>
                    </Select>
                  </PropertyItem>
                  <PropertyItem title='校验对比值'>
                    <Tooltip title="必须为数字">
                      <Input placeholder="请输入值" value={col.compareVal} onChange={this.handleColCompareValChange} />
                    </Tooltip>
                  </PropertyItem>
                </React.Fragment>)
              }

            </React.Fragment>)
          }
          {isBudget && <PropertyItem title='审核阶段允许编辑'>
            <Checkbox checked={col.canEdit} onChange={this.handleColCanEditChange} style={{ marginTop: 5 }}></Checkbox>
          </PropertyItem>}
          {isBudget && <PropertyItem title='显示时机'>
            <Select
              style={selectStyle}
              value={col.workflow || '默认'}
              onChange={this.handleColWorkflowChange}>
              <Select.Option value="default">默认</Select.Option>
              <Select.Option value="reply">审核</Select.Option>
              <Select.Option value="request">批复</Select.Option>
            </Select>
          </PropertyItem>}
          {isBudget && <PropertyItem title='是否合计'>
            <Select
              style={selectStyle}
              value={col.isSum || '默认'}
              onChange={this.handleIsSumChange}>
              <Select.Option value="default">默认</Select.Option>
              <Select.Option value="y">是</Select.Option>
            </Select>
          </PropertyItem>}
        </div>
      </Panel>
    );
  }

  handleDigitChange = (value) => {
    this.props.actions.setDigit(value);
  }

  handleNoNeedParamsChange = (value) => {
    this.props.actions.setNoNeedParams(value);
  }
  handleSpreadsheetTypeChange = (value) => {
    this.props.actions.setSpreadsheetType(value);
  }
  handleZeroAsChange = (value) => {
    this.props.actions.setZeroAs(value);
  }
  handleSerialAddressChange = (value) => {
    this.props.actions.setSerialAddress(value);
  }
  handleUploadParameters = (attrName, objEvent) => {
    let event;
    if (typeof objEvent === 'number') {
      event = objEvent;
    } else {
      event = objEvent || window.event;
    }
    const { uploadParameters } = this.props.sheet;
    let newPara = _.cloneDeep(uploadParameters);
    if (newPara == undefined) {
      newPara = [{
        colIndex: -1,
        punctuation: '>',
        value: 0
      }]
    }
    if (attrName == 'colIndex' || attrName == 'punctuation' || attrName == 'value') {
      if (attrName == 'value' && typeof event === 'object')
        return;
      else
        newPara[0][attrName] = event;
    }
    else
      return;
    this.props.actions.setUploadParameters(newPara);
  }

  renderTreeNodes(nodes) {
    if (!nodes || nodes.length === 0) {
      return;
    }
    return nodes.map(node => (
      <TreeNode value={node.key} node={node} title={node.title} key={node.key}>
        {this.renderTreeNodes(node.children)}
      </TreeNode>
    ));
  }
  filterTreeNode = (inputValue, treeNode) => {
    return treeNode.props.title.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0;
  }
  renderAnalysisModels() {
    return this.state.analysisModels.map(item => <Option value={item.analysis_model$id} key={item.analysis_model$id}>{item.analysis_model$name}</Option>)
  }
  categorySelectChange = (isInit, value) => {
    if (value) {
      const url = `${isHttpPublic}analysismodel/getByCategoryId/${value}`;
      axios.get(url)
        .then((response) => {
          const analysisModels = response.data.data;
          this.setState({ analysisModels });
        });
      this.props.actions.setCategoryID(value);
    }
    if (!isInit || !value) {
      this.props.actions.setAnalysisModelID(undefined);
    }
  }
  modelSelectChange = (value) => {
    this.props.actions.setAnalysisModelID(value);
  }
  renderTableGroup() {
    const { isSelectTable, digit, noNeedParams, zeroAs, colProps, uploadParameters, spreadsheetType, categoryID, analysisModelID, serialAddress } = this.props.sheet;
    if (!isSelectTable) return;
    const objUploadPara = uploadParameters && uploadParameters.length > 0 ? uploadParameters[0] : [];
    const { isBudget } = this.props.spreadsheet;
    return (
      <Panel header="表格属性" key="0" className="customPanelStyle">
        <div style={{ width: '238px' }}>
          {!isBudget && <PropertyItem title='无参查询'>
            <Select
              style={selectStyle}
              value={noNeedParams || 'default'}
              onChange={this.handleNoNeedParamsChange}>
              <Select.Option value="default" title='展开的列表需要参数，不展开的不需要'>默认</Select.Option>
              <Select.Option value="y" title='无需参数'>是</Select.Option>
              <Select.Option value="n" title='需要参数'>否</Select.Option>
            </Select>
          </PropertyItem>}
          {!isBudget && <PropertyItem title='小数位数'>
            <InputNumber style={{ width: '100%', height: 28, verticalAlign: 'top' }}
              min={0} max={36}
              value={typeof digit === 'number' ? digit : 2}
              onChange={this.handleDigitChange}
            />
          </PropertyItem>}

          {
            // !isBudget && <PropertyItem title='表格类型'>
            //   <Select
            //     style={selectStyle}
            //     value={spreadsheetType || 'default'}
            //     onChange={this.handleSpreadsheetTypeChange}>
            //     <Select.Option value="default" title='默认'>默认</Select.Option>
            //     <Select.Option value="specialCost" title='成本特殊表格'>成本特殊表格</Select.Option>
            //     {/* 成本特殊表格，维度具体值，汇总度量 */}
            //   </Select>
            // </PropertyItem>
          }

          {
            // !isBudget && <PropertyItem title='模型分类'>
            //   <TreeSelect
            //     showSearch
            //     style={selectStyle}
            //     value={categoryID}
            //     dropdownStyle={{ maxHeight: 300, overflow: 'auto' }}
            //     placeholder='请选择分类'
            //     treeDefaultExpandAll
            //     onChange={this.categorySelectChange.bind(this, false)}
            //     filterTreeNode={this.filterTreeNode}
            //   >
            //     {this.renderTreeNodes(this.props.spreadsheet.categoryTree.children)}
            //   </TreeSelect>
            // </PropertyItem>
          }
          {
            //   !isBudget && <PropertyItem title='分析模型'>
            //   <Select
            //     style={selectStyle}
            //     value={analysisModelID}
            //     dropdownStyle={{ maxHeight: 300, overflow: 'auto' }}
            //     placeholder='请选择分析模型'
            //     onChange={this.modelSelectChange}
            //   >
            //     {this.renderAnalysisModels()}
            //   </Select>
            // </PropertyItem>
          }
          {!isBudget && <PropertyItem title='零显示为'>
            <Select
              style={selectStyle}
              value={zeroAs || 'default'}
              onChange={this.handleZeroAsChange}>
              <Select.Option value="default" title='显示为 0 并格式化'>默认</Select.Option>
              <Select.Option value="null" title='不显示'>(空)</Select.Option>
              <Select.Option value="--" title='显示为 --'>--</Select.Option>
            </Select>
          </PropertyItem>}
          {
            isBudget && <PropertyItem title='附件参数'>
              <Select style={{ width: 80 }} value={typeof objUploadPara.colIndex === 'number' ? objUploadPara.colIndex : -1}
                onChange={this.handleUploadParameters.bind(this, 'colIndex')}>
                <Select.Option value={-1}>(无)</Select.Option>
                {
                  colProps.map((item, index) => {
                    return <Select.Option value={index}>{addressConverter.columnNumberToName(index + 1)}</Select.Option>
                  })
                }
              </Select>
              <Select style={{ width: 80, marginLeft: '12px' }} value={objUploadPara.punctuation || '>'}
                onChange={this.handleUploadParameters.bind(this, 'punctuation')}>
                <Select.Option value={'>'}>{'大于'}</Select.Option>
                <Select.Option value={'<'}>{'小于'}</Select.Option>
                <Select.Option value={'='}>{'等于'}</Select.Option>
              </Select>
              <InputNumber style={{ marginTop: 11, width: 173, height: 28, verticalAlign: 'top' }} min={0} type="text"
                value={objUploadPara.value || 0}
                onChange={this.handleUploadParameters.bind(this, 'value')} />
            </PropertyItem>
          }

          {
            !isBudget && <PropertyItem title='行号起始'>
              <EditInput
                value={serialAddress}
                placeholder='请输入行号起始单元格'
                onCommit={this.handleSerialAddressChange}
              />
            </PropertyItem>
          }
          {isBudget && <PropertyItem title='不要合计'>
            <Checkbox checked={!!this.props.sheet.doNotSum} onChange={this.handleDoNotSumChange} style={{ marginTop: 5 }}></Checkbox>
          </PropertyItem>}
        </div>
      </Panel>
    );
  }

  renderGroups() {
    const { selectedCellTextBox: textBox, selectedCellFontInfo: fontInfo, sheet, selection } = this.props;
    if (!sheet) return;
    if (sheet.isSelectTable && !selection) {
      return [this.renderTableGroup()];
    }
    if (!textBox) {
      return null;
    }
    return [
      this.renderBaseGroup(textBox, fontInfo),
      this.renderPrintGroup(textBox, fontInfo),
      // this.renderExpandGroup(textBox),
      this.renderRowGroup(),
      this.renderColGroup(),
      this.renderExpandRow()
    ];
  }

  render() {
    // console.log({ props: this.props })
    return (
      <div className="setting-board property-border-left"
        style={{
          height: window.BI_APP_CONFIG.bi_integratedMode ? 'calc(100vh - 47px)' : undefined,
        }}>
        <Collapse bordered={false} defaultActiveKey={['0', '1', '2', '3', '4', '5']} style={{ fontSize: 12 }} >
          {this.renderGroups()}
        </Collapse>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  tableRows: getTableRows(state),
  selectedCell: getSelectedCell(state),
  selectedCellTextBox: getSelectedCellTextBox(state),
  selectedCellFontInfo: getSelectedCellFontInfo(state),
  selectedRow: getSelectedRow(state),
  selectedCol: getSelectedCol(state),
  selection: getCurrentSelection(state),
  sheet: getSheet(state),
  spreadsheet: state.Spreadsheet,
});

export default connect(mapStateToProps)(SpreadsheetProperty);
