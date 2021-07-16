import React, { Component } from 'react';
import { Input, Tree, Modal, Button, Tooltip, Checkbox, Radio, Icon, message } from '@vadp/ui';
import lodash from 'lodash';
import axios from 'axios';
import { isHttpPublic } from 'constants/IntegratedEnvironment';
import EditGrid, { getRenderRange, isRangeEqual } from '~/routes/visualizationModel/components/EditGrid';
import { PreviewCell } from '~/routes/visualizationModel/SpreadsheetDesigner/components/SpreadsheetPreview';
import Message from 'public/Message';
import produce from 'immer';
import addressConverter from 'xlsx-populate/lib/addressConverter';
import ColumnHeader from '~/routes/visualizationModel/components/ColumnHeader';
import RowHeader from '~/routes/visualizationModel/components/RowHeader';
import { fetchTemplate } from '../SpreadsheetApi';
import * as SpreadsheetUtil from './SpreadsheetUtils';
import { connect } from 'react-redux';
import { validateWithLexerAndParser } from 'components/Public/ExpressionEditor';
import { FormulaLexer } from '../formulaCalc/FormulaLexer';
import { FormulaParser } from '../formulaCalc/FormulaParser';


const { TreeNode } = Tree;
const { TextArea } = Input;
const { confirm } = Modal;
const commonItems = [
    { text: '(', value: '(', title: '左括号' },
    { text: ')', value: ')', title: '右括号' },
    { text: ',', value: ',', title: '逗号' },
    { text: '+', value: '+', title: '加' },
    { text: '-', value: '-', title: '减' },
    { text: '×', value: '*', title: '乘' },
    { text: '÷', value: '/', title: '除' },
    { text: '&', value: '&', title: '字符串连接' },
    { text: '=', value: '=', title: '等于' },
    { text: '<', value: '<', title: '小于' },
    { text: '<=', value: '<=', title: '小于等于' },
    { text: '>', value: '>', title: '大于' },
    { text: '>=', value: '>=', title: '大于等于' },
    { text: '"', value: '"', title: '双引号' }
];
class FormulaEditor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            reports: [],
            formulaType: [],
            formulaId: this.props.formula.id,
            formula: this.props.formula.formula || '',
            formulaRemark: this.props.formula.formulaRemark || '',
            formulaExplain: this.props.formula.formulaExplain || '',
            checkFormulaType: this.props.formula.formulaType,
            table: null
        }

    }
    componentDidMount() {
        console.log(22, this.props)
        axios.get(`${isHttpPublic}excel/getCrossModels?compCode=${this.props.pageParams.compCode}&copyCode=${this.props.pageParams.copyCode}&acctYear=${this.props.pageParams.acctYear}`).then(response => {
            if (response.status === 200) {
                const reports = response.data.data.sort((item1, item2) => item1.reportCode - item2.reportCode).map(item => {
                    return {
                        id: item.reportId,
                        name: item.reportName,
                        code: item.reportCode,
                        group: JSON.parse(item.remark).reportGroup,
                        type: JSON.parse(item.remark).periodType
                    }
                })
                this.setState({ reports: reports.filter(item => item.group === this.props.pageParams.reportGroup && item.type === this.props.pageParams.periodType) }, () => {
                    const table = reports.find(item => item.code === this.props.pageParams.reportCode);
                    this.setState({ tableName: table.name, tableCode: table.code }, () => {
                        this.getTable([table.id]);
                    });
                });
            }
        });

    }
    checkFormulaTypeChange = (e) => {
        this.setState({ checkFormulaType: e.target.value });
    }
    treeSelect = (selectedKeys, e) => {
        if (selectedKeys.length) {
            this.setState({ tableName: e.selectedNodes[0].props.tableName, tableCode: e.selectedNodes[0].props.tableCode });
            this.getTable(selectedKeys[0]);
        }
    }
    async getTable(id) {
        const data = await fetchTemplate(id);
        const json = JSON.parse(data.content);
        let table = SpreadsheetUtil.jsonToTable(json, data.analysis_module_id);
        if (table && data.indexes) {
            table.present.indexMap = {};
            data.indexes.forEach(({ indexId, indexName, indexCode }) => {
                table.present.indexMap[indexId] = { code: indexCode || '', name: indexName || '' };
            });
        }
        for (let i = 0, j = table.present.tableRows.length; i < j; i++) {
            let row = table.present.tableRows[i];
            for (let m = 0, n = row.length; m < n; m++) {
                if (row[m].id && table.present.indexMap[row[m].id]) {
                    row[m].textBox.value = `[${table.present.indexMap[row[m].id].name}]`;
                    row[m].textBox.indexes = table.present.indexMap[row[m].id].name;
                }
            }
        }
        this.setState({ table: table.present }, () => {
            Object.getOwnPropertyNames(this.state.table).forEach((name) => {
                const prop = this.state.table[name];
                if (typeof prop === 'function') {
                    this.bind(prop, 'actions', name);
                }
            });
        })
    }
    getRowHeaderWidth() {
        const { table } = this.state;
        if (!table) return;
        let rowHeaderWidth = 30;
        const numLength = table.heights.length.toString().length;
        if (numLength > 3) {
            rowHeaderWidth += (numLength - 3) * 7;
        }
        return rowHeaderWidth;
    }
    renderRowHeader(index) {
        const { rowProps } = this.state.table;
        let extra;
        // 浮动行标志
        if (rowProps && rowProps[index]) {
            let type;
            if (rowProps[index].rowType === 'float') {
                type = 'edit';
            } else if (rowProps[index].rowType === 'expand') {
                type = 'bars';
            }
            else if (rowProps[index].hasOwnProperty('attachmentInfo')) {
                if (rowProps[index].attachmentInfo.List.length > 0) {
                    type = 'paper-clip';
                }
            }
            if (type) {
                extra = (
                    <div className='spreadsheet-little-icon' style={{
                        position: "absolute",
                        right: 0, top: 0,
                        fontSize: 10,
                        fontFamily: 'SimSun',
                        color: 'gray',
                        lineHeight: '12px',
                        padding: '0 0',
                    }}><Icon type={type} /></div>
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
    lazyLoad = () => {
        this.setState(state => {
            const { table } = this.state;
            if (!table) return;
            const renderRange = getRenderRange(this.grid, this.refs.newCanvas, table.widths, table.heights);
            if (!renderRange) {
                return;
            }
            if (!isRangeEqual(state.renderRange, renderRange)) {
                return { renderRange };
            }
        });
    }
    handleGridLoad = (grid) => {
        const elementResizeDetectorMaker = require('element-resize-detector');
        const erd = elementResizeDetectorMaker();
        const that = this;
        erd.listenTo(grid, (element) => {
            that.lazyLoad();
        });
        this.grid = grid;
    }
    renderCellContent = (cellProps) => {
        return (
            <PreviewCell dbClick={this.doubleClick} {...cellProps} table={this.state.table} />
        );
    }
    handleMouseSelectStart = (row, col, e) => {
        this.numbers = addressConverter.columnNumberToName(col + 1) + (row + 1);
        this.actions.selectCell(row, col, e.ctrlKey);
    }
    bind = (producer, category, name) => {
        if (!this[category]) {
            this[category] = {};
        }
        this[category][name] = (...args) => {
            let table;
            try {
                table = produce(this.state.table, (draft) => {
                    producer.apply(draft, args);

                });
            } catch (ex) {
                Message.warning(ex.message);
                return;
            }
            this.setState({ table }, () => {
                if (name == 'selectCell') {
                    this.setParentSelectTextBox();
                }
            });
        };
    }
    setParentSelectTextBox = () => {
        const selection = this.state.table.getCurrentSelection();
        const textBox = this.state.table.tableRows[selection.top][selection.left];
        this.setState({ selectedCell: textBox });
    }
    doubleClick = () => {
        let { selectedCell, tableName, tableCode } = this.state;
        const { reportCode } = this.props.pageParams;
        if (selectedCell.id) {
            const value = `[${tableName}.${selectedCell.textBox.indexes}]`;
            this.insertString(value, tableCode === reportCode ? this.numbers : `getDataFromOtherSheet("${tableName}","${selectedCell.textBox.indexes}","0")`);
        }
        else {
            message.warning('此单元格未设置指标！');
        }
    }
    inputChange = (name, e) => {
        this.setState({ [name]: e.target.value });
    }
    insertString = (str1, str2) => {
        const inputFocus = this.state.inputFocus;
        if (inputFocus) {
            let input = this.refs[inputFocus].textAreaRef;
            let text = this.state[inputFocus];
            let { selectionStart, selectionEnd } = input;
            input.focus();
            if (inputFocus === 'formula') {
                text = text.substring(0, selectionStart) + (str2 ? str2 : str1) + text.substring(selectionEnd, text.length);
                let formulaRemark = this.state.formulaRemark;
                selectionStart += (str2 ? str2 : str1).length;
                formulaRemark += str1;
                this.setState({ formula: text, formulaRemark }, () => { input.setSelectionRange(selectionStart, selectionStart); });
            }
            else {
                text = text.substring(0, selectionStart) + str1 + text.substring(selectionEnd, text.length);
                selectionStart += str1.length;
                this.setState({ [inputFocus]: text }, () => { input.setSelectionRange(selectionStart, selectionStart); });
            }
        }
    }
    inputFocus = (name) => {
        this.setState({ inputFocus: name });
    }

    saveFormula = () => {
        const { formula, formulaRemark, formulaExplain, checkFormulaType } = this.state;
        let id = this.props.formula.id;
        if (!formula) {
            message.warning('公式编辑不能为空！');
            return;
        }
        if (!formulaRemark) {
            message.warning('公式含义不能为空！');
            return;
        }
        let formulas = lodash.cloneDeep(this.props.formulas);
        if (id) {
            const formulaIndex = formulas.findIndex(item => item.id === id);
            formulas.splice(formulaIndex, 1, { formula, remark: formulaRemark, explain: formulaExplain, type: checkFormulaType });
        }
        else {
            formulas.push({ formula, remark: formulaRemark, explain: formulaExplain, type: checkFormulaType });
            id = formulas.length;
        }
        formulas = formulas.map(item => { delete item.id; return item });
        this.setState({ formulaId: id }, () => {
            this.props.saveFormula(formulas);
            message.success('保存成功！');
        })
    }
    checkFormula = () => {
        const result = validateWithLexerAndParser(FormulaLexer, FormulaParser, 'exprNoEqual')(this.state.formula)
        if (result.success) {
            message.success('公式校验通过！');
        }
        else {
            Modal.error({
                title: '公式校验未通过，请检查！',
                content: result.msg,
            });
        }
    }
    confirm = (index) => {
        let { formulaId, formula, formulaRemark, formulaExplain, checkFormulaType } = this.state;
        let initialFormula = {}
        if (formulaId) {
            initialFormula = this.props.formulas.find(item => item.id === formulaId);
            if (formula !== initialFormula.formula || formulaRemark !== initialFormula.remark || formulaExplain !== initialFormula.explain || checkFormulaType !== initialFormula.type) {
                this.renderConfirm(index);
            }
            else {
                this.changeFormula(index);
            }
        }
        else {
            if (formula !== '' || formulaRemark !== '' || formulaExplain !== '') {
                this.renderConfirm(index);
            }
            else {
                this.changeFormula(index);
            }
        }
    }
    changeFormula = (index) => {
        const { formulaType } = this.props;
        const { formulaId } = this.state;
        let formula = {};
        if (formulaType === undefined || formulaType === '审核公式') {
            formula = this.props.formulas.find(item => item.id === formulaId + index);
        }
        else {
            formula = this.props.formulas.filter(item => item.type === formulaType).find(item => item.id === formulaId + index);
        }
        if (formula) {
            this.setState({
                formulaId: formula.id,
                formula: formula.formula,
                formulaRemark: formula.remark,
                formulaExplain: formula.explain,
                checkFormulaType: formula.type,
            })
        }
        else {
            message.warning(`当前是${index > 0 ? '最后' : '第'}一个公式！`);
        }
    }
    renderConfirm = (index) => {
        const _this = this;
        confirm({
            title: '公式已修改，是否保存？',
            onOk() {
                _this.saveFormula();
                _this.changeFormula(index);
            },
            onCancel() {
                _this.changeFormula(index);
            },
        });
    }
    render() {
        const formulaType = [
            { label: '取数公式', value: '取数公式', disabled: true },
            { label: '计算公式', value: '计算公式', disabled: true },
            { label: '审核公式', value: '审核公式' },
        ];
        const { table, renderRange } = this.state;
        const rowHeaderWidth = this.getRowHeaderWidth();
        const width = table && table.widths.reduce((sum, item) => {
            return item + sum;
        }, 1);
        return (
            <Modal
                visible={true}
                title='公式编辑器'
                wrapClassName="bi"
                maskClosable={false}
                footer={null}
                width="100%"
                style={{ height: '100%' }}
                onCancel={this.props.handleCancel}
            >
                <div style={{ paddingBottom: 8, height: 'calc(100vh - 56px)' }}>
                    <div style={{ paddingRight: 98, position: 'relative' }}>
                        <p style={{ paddingBottom: 8 }}>
                            <span style={{ verticalAlign: 'top' }}>公式编辑：</span>
                            <TextArea allowClear ref="formula" onChange={this.inputChange.bind(this, 'formula')} onFocus={this.inputFocus.bind(this, 'formula')} value={this.state.formula} style={{ width: 'calc(100% - 70px)' }} rows={2} />
                        </p>
                        <p style={{ paddingBottom: 8 }}>
                            <span style={{ verticalAlign: 'top' }}>公式含义：</span>
                            <TextArea ref="formulaRemark" onChange={this.inputChange.bind(this, 'formulaRemark')} onFocus={this.inputFocus.bind(this, 'formulaRemark')} value={this.state.formulaRemark} style={{ width: 'calc(100% - 70px)' }} rows={2} />
                        </p>
                        <p style={{ paddingBottom: 8 }}>
                            <span style={{ verticalAlign: 'top' }}>公式说明：</span>
                            <TextArea ref="formulaExplain" onChange={this.inputChange.bind(this, 'formulaExplain')} onFocus={this.inputFocus.bind(this, 'formulaExplain')} value={this.state.formulaExplain} style={{ width: 'calc(100% - 70px)' }} rows={2} />
                        </p>
                        <div style={{ position: 'absolute', right: 0, top: 0, textAlign: 'center', width: 90 }}>
                            <Button onClick={this.saveFormula} style={{ width: 90, marginBottom: 15 }}>保存</Button>
                            <Button onClick={this.checkFormula} style={{ width: 90, marginBottom: 15 }}>校验</Button>
                            <Button onClick={this.confirm.bind(this, -1)} style={{ width: 90, marginBottom: 15 }}>上一公式</Button>
                            <Button onClick={this.confirm.bind(this, 1)} style={{ width: 90 }}>下一公式</Button>

                        </div>
                    </div>
                    <div style={{ paddingBottom: 8 }}>
                        <span style={{ verticalAlign: 'top' }}>公式类型：</span>
                        <Checkbox.Group options={formulaType} defaultValue={['审核公式']} />
                        <span style={{ verticalAlign: 'top', paddingLeft: 120 }}>审核公式类型：</span>
                        <Radio.Group onChange={this.checkFormulaTypeChange} value={this.state.checkFormulaType}>
                            <Radio value="基本平衡公式">基本平衡公式</Radio>
                            <Radio value="逻辑性公式">逻辑性公式</Radio>
                            <Radio value="核实性公式">核实性公式</Radio>
                        </Radio.Group>
                    </div>
                    <div style={{ paddingBottom: 8 }}>
                        <span style={{ verticalAlign: 'top' }}>运算符及符号：</span>
                        {commonItems.map(item => (
                            <Tooltip key={item.value} title={item.title} placement="bottom">
                                <Button onClick={e => {
                                    this.insertString(item.value);
                                }} size="small" style={{ width: 34, marginRight: 4 }}>{item.text}</Button>
                            </Tooltip>
                        ))}
                    </div>
                    <div style={{ overflow: 'hidden', paddingBottom: 8, height: 'calc(100% - 233px)' }}>
                        <div style={{ width: 240, height: '100%', padding: 8, float: 'left', border: '1px solid #ddd' }}>
                            <span>报表及指标：</span>
                            <div style={{ height: 'calc(100% - 24px)', overflow: 'auto' }}>
                                <Tree
                                    showLine
                                    onSelect={this.treeSelect}
                                    defaultExpandAll={true}
                                >
                                    <TreeNode title="报表分组名" key="1" selectable={false}>
                                        {
                                            this.state.reports.map(item => <TreeNode tableName={item.name} tableCode={item.code} title={<Tooltip placement="topLeft" title={`${item.code}_${item.name}`}><p style={{ width: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{`${item.code}_${item.name}`}</p></Tooltip>} key={item.id}></TreeNode>)
                                        }
                                    </TreeNode>
                                </Tree>
                            </div>
                        </div>
                        {
                            table ?
                                <div style={{ width: 'calc(100% - 248px)', height: '100%', padding: '8px 12px', float: 'right', border: '1px solid #ddd' }}>
                                    <div ref='newCanvas' style={{ maxHeight: '100%', height: '100%', overflow: 'auto', position: 'relative', width: '100%' }} onScroll={this.lazyLoad}>
                                        <div className="table-content" style={{
                                            borderWidth: 0,
                                            left: `${table.position.x}px`,
                                            top: `${table.position.y}px`,
                                            width: width + 51
                                        }}>
                                            <EditGrid

                                                tableRows={table.tableRows}
                                                widths={table.widths}
                                                heights={table.heights}
                                                onLoad={this.handleGridLoad}
                                                editingCell={table.editingCell}
                                                renderCellContent={this.renderCellContent}
                                                renderRange={this.state.renderRange}
                                                onMouseSelectStart={this.handleMouseSelectStart}
                                                selectedRanges={table.selectedRanges}
                                                left={rowHeaderWidth}
                                                mark={table.mark}
                                            />
                                            <div
                                                id="table-handle"
                                                style={{ width: `${rowHeaderWidth}px` }}
                                                className="table-block"
                                            />
                                            <ColumnHeader
                                                left={rowHeaderWidth}
                                                widths={table.widths}
                                                selectedRanges={table.selectedRanges}
                                                renderContent={index => addressConverter.columnNumberToName(index + 1)}
                                                renderRange={renderRange}
                                                selectColumn={() => false}
                                                onColumnResizing={() => false}
                                            />
                                            <RowHeader
                                                width={rowHeaderWidth}
                                                heights={table.heights}
                                                selectedRanges={table.selectedRanges}
                                                rowProps={table.rowProps}
                                                renderContent={this.renderRowHeader.bind(this)}
                                                renderRange={renderRange}
                                                selectRow={() => false}
                                                onRowResizing={() => false}
                                            />
                                        </div></div>
                                </div>
                                :
                                null
                        }
                    </div>
                </div>
            </Modal>
        );
    }
}

export default connect()(FormulaEditor);