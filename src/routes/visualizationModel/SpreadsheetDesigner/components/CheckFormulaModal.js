import React, { Component } from 'react';
import { Input, Tree, Modal, Button, Tooltip, Table, Popconfirm, Select } from '@vadp/ui';
import lodash from 'lodash';
import FormulaEditor from './FormulaEditor';
import { message } from 'antd';


const { TreeNode } = Tree;
const InputGroup = Input.Group;

class CheckFormulaModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            columns: [
                {
                    title: '序号',
                    dataIndex: 'sn',
                    key: 'sn',
                    width: 57,
                    align: 'center',
                    render: (text) => <Tooltip placement="topLeft" title={text}><p style={{ width: 40, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</p></Tooltip>
                },
                {
                    title: '公式',
                    dataIndex: 'formula',
                    key: 'formula',
                    width: 217,
                    render: (text, record) => <Tooltip placement="topLeft" title={text}><p style={{ width: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><span style={{ textDecoration: 'underline', cursor: 'pointer' }} isLink="1" onClick={this.editFormula.bind(this, true, record)}>{text}</span></p></Tooltip>
                },
                {
                    title: '公式含义',
                    dataIndex: 'remark',
                    key: 'remark',
                    width: 217,
                    render: (text) => <Tooltip placement="topLeft" title={text}><p style={{ width: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</p></Tooltip>
                },
                {
                    title: '公式说明',
                    dataIndex: 'explain',
                    key: 'explain'
                },
                {
                    title: '是否取数公式',
                    dataIndex: 'isFetchFormula',
                    key: 'isFetchFormula',
                    align: 'center',
                    width: 60,
                    render: (text) => text ? text : '否'
                },
                {
                    title: '是否计算公式',
                    dataIndex: 'isComputeFormula',
                    key: 'isComputeFormula',
                    align: 'center',
                    width: 60,
                    render: (text) => text ? text : '否'
                },
                {
                    title: '是否审核公式',
                    dataIndex: 'isCheckFormula',
                    key: 'isCheckFormula',
                    align: 'center',
                    width: 60,
                    render: (text) => text ? text : '是'
                },
                {
                    title: '审核公式类型',
                    dataIndex: 'type',
                    key: 'type',
                    width: 157,
                    align: 'center',
                    render: (text) => <Tooltip placement="topLeft" title={text}><p style={{ width: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text ? text : '基本平衡公式'}</p></Tooltip>
                },
            ],
            tableData: [],
            pagination: {
                current: 1,
                pageSize: 50,
                showSizeChanger: true,
                pageSizeOptions: ['50', '100', '200', '500'],
                // showTotal: this.showTotal.bind(this),
            },
            selectedRowKeys: [],
            selectedRows: [],
            treeSelectKeys: [],
            formulas: [],
            formula: undefined,
            formulaRemark: undefined,
            formulaExplain: undefined,
            formulaType: undefined,
            formulaEditor: {
                visible: false,
                formula: undefined,
                formulaRemark: undefined,
                formulaExplain: undefined,
                formulaType: undefined
            },
            searchType: 'formula',
            searchValue: ''
        }
    }
    componentDidMount() {
        console.log(this.props)
        this.init(this.props);
    }
    componentWillReceiveProps(nextProps) {
        this.init(nextProps);
    }
    init = (props) => {
        const tableData = props.checkFormulas.map((item, index) => { return { sn: index + 1, id: index + 1, ...item } });
        const formulas = props.checkFormulas.map((item, index) => { return { id: index + 1, ...item } });
        this.setState({ tableData, formulas, formula: undefined, formulaRemark: undefined, formulaExplain: undefined, formulaType: undefined }, () => {
            const treeSelectKeys = this.state.treeSelectKeys
            if (treeSelectKeys.length) {
                this.treeSelect(treeSelectKeys);
            }
        });
    }
    addFormula = () => {
        const { formulaEditor } = lodash.cloneDeep(this.state);
        formulaEditor.visible = true;
        formulaEditor.id = formulaEditor.formula = formulaEditor.formulaRemark = formulaEditor.formulaExplain = undefined;
        formulaEditor.formulaType = (this.state.treeSelectKeys.length === 0 || this.state.treeSelectKeys[0] === '审核公式') ? '基本平衡公式' : this.state.treeSelectKeys[0];
        this.setState({ formulaEditor });
    }
    editFormula = (fromLink, record) => {
        const state = lodash.cloneDeep(this.state);
        if (fromLink === true) {
            state.formulaEditor.visible = true;
            state.formulaEditor.id = record.id;
            state.formulaEditor.formula = state.formula = record.formula;
            state.formulaEditor.formulaRemark = state.formulaRemark = record.remark;
            state.formulaEditor.formulaExplain = state.formulaExplain = record.explain;
            state.formulaEditor.formulaType = state.formulaType = record.type;
        }
        else {
            if (this.state.selectedRowKeys.length === 0) {
                message.warning('请选择需要编辑的公式！');
                return;
            }
            if (this.state.selectedRowKeys.length > 1) {
                message.warning('请选择一个公式！');
                return;
            }
            state.formulaEditor.visible = true;
            state.formulaEditor.formula = this.state.selectedRows[0].formula;
            state.formulaEditor.formulaRemark = this.state.selectedRows[0].remark;
            state.formulaEditor.formulaExplain = this.state.selectedRows[0].explain;
            state.formulaEditor.formulaType = this.state.selectedRows[0].type;
        }
        this.setState(state);
    }
    delFormula = () => {
        if (this.state.selectedRowKeys.length === 0) {
            message.warning('请选择需要删除的公式！');
            return;
        }
        let { formulas } = lodash.cloneDeep(this.state);
        formulas = formulas.filter(item1 => !this.state.selectedRows.some(item2 => (item2.formula === item1.formula && item2.remark === item1.remark)));
        this.setState({ formulas, selectedRowKeys: [], selectedRows: [] }, () => {
            this.treeSelect(this.state.treeSelectKeys);
            message.success('删除公式成功！')
        });
    }
    formulaEditorCancel = () => {
        const state = lodash.cloneDeep(this.state);
        state.formulaEditor.visible = false;
        this.setState(state);
    }
    treeSelect = (selectedKeys) => {
        const { searchType, searchValue, formulas } = this.state;
        let tableData = formulas.filter(item => (item.type === selectedKeys[0] && item[searchType].indexOf(searchValue ? searchValue : '') > -1)).map((item, index) => { return { sn: index + 1, ...item } });
        if (selectedKeys[0] === '审核公式' || selectedKeys.length === 0) {
            tableData = formulas.filter(item => item[searchType].indexOf(searchValue ? searchValue : '') > -1).map((item, index) => { return { sn: index + 1, ...item } });
        }
        this.setState({ tableData, selectedRowKeys: [], selectedRows: [], treeSelectKeys: selectedKeys, formula: undefined, formulaRemark: undefined, formulaExplain: undefined, formulaType: undefined });
    }
    tableChange = (pagination) => {
        this.setState({ pagination })
    }
    searchTypeChange = (value) => {
        this.setState({ searchType: value });
    }
    searchValueChange = (e) => {
        this.setState({ searchValue: e.target.value });
    }
    searchTable = () => {
        let { searchType, searchValue, treeSelectKeys, formulas, tableData } = lodash.cloneDeep(this.state);
        if (treeSelectKeys[0] === '审核公式' || treeSelectKeys.length === 0) {
            tableData = formulas.filter(item => item[searchType].indexOf(searchValue) > -1).map((item, index) => { return { sn: index + 1, ...item } });
        }
        else {
            tableData = formulas.filter(item => (item.type === treeSelectKeys[0] && item[searchType].indexOf(searchValue) > -1)).map((item, index) => { return { sn: index + 1, ...item } });
        }
        this.setState({ tableData, formula: undefined, formulaRemark: undefined, formulaExplain: undefined, formulaType: undefined });
    }
    render() {
        const rowSelection = {
            selectedRowKeys: this.state.selectedRowKeys,
            onChange: (selectedRowKeys, selectedRows) => {
                this.setState({ selectedRowKeys, selectedRows });
                console.log(selectedRowKeys, selectedRows)
            },
            type: "checkbox",
        }
        return (
            <Modal
                visible={true}
                title='公式批量管理'
                wrapClassName="oes-function-modal bi"
                maskClosable={false}
                footer={null}
                width={1280}
                onCancel={this.props.onCancel.bind(this, this.state.formulas)}
            >
                <div style={{ textAlign: 'right' }}>
                    <Button onClick={this.addFormula} type="primary" size="small">新增</Button>
                    <Popconfirm
                        title="确定删除选中公式？"
                        onConfirm={this.delFormula}
                        okText="是"
                        cancelText="否"
                    ><Button style={{ marginLeft: 8 }} type="primary" size="small">删除</Button></Popconfirm>
                    <Button onClick={this.editFormula} style={{ marginLeft: 8 }} type="primary" size="small">修改</Button>
                    {/* <Button style={{ marginLeft: 8 }} type="primary" size="small">关闭</Button> */}
                </div>
                <div style={{ overflow: 'hidden', marginTop: 8, paddingBottom: 16 }}>
                    <div style={{ width: 200, height: 508, float: 'left', border: '1px solid #ddd', padding: '8px 12px' }}>
                        <Tree
                            showLine
                            onSelect={this.treeSelect}
                            defaultExpandAll={true}
                        >
                            <TreeNode title="全部公式" key="全部公式" selectable={false}>
                                <TreeNode title="审核公式" key="审核公式">
                                    <TreeNode title="基本平衡公式" key="基本平衡公式"></TreeNode>
                                    <TreeNode title="逻辑性公式" key="逻辑性公式"></TreeNode>
                                    <TreeNode title="核实性公式" key="核实性公式"></TreeNode>
                                </TreeNode>
                            </TreeNode>
                        </Tree>
                    </div>
                    <div style={{ width: 'calc(100% - 208px)', height: 508, float: 'right', border: '1px solid #ddd', padding: 8 }}>
                        <div style={{ padding: 8, marginBottom: 8, border: '1px solid #ddd' }}>
                            <p style={{ marginBottom: 8 }}><span style={{ width: 70, display: 'inline-block' }}>公式：</span><Input size="small" style={{ width: 'calc(100% - 70px)' }} value={this.state.formula} /></p>
                            <p style={{ marginBottom: 8 }}><span style={{ width: 70, display: 'inline-block' }}>公式含义：</span><Input size="small" style={{ width: 'calc(100% - 70px)' }} value={this.state.formulaRemark} /></p>
                            <p style={{ marginBottom: 8 }}><span style={{ width: 70, display: 'inline-block' }}>公式说明：</span><Input size="small" style={{ width: 'calc(100% - 70px)' }} value={this.state.formulaExplain} /></p>
                            <p style={{ overflow: 'hidden', lineHeight: '24px' }}>
                                <span style={{ width: 70, display: 'inline-block' }}>公式类型：</span>{this.state.formulaType ? this.state.formulaType : ''}
                                <Button onClick={this.searchTable} style={{ float: 'right' }} size="small">搜索</Button>
                                <div style={{ float: 'right', marginRight: 8 }}>
                                    <InputGroup compact>
                                        <Select onChange={this.searchTypeChange} value={this.state.searchType} style={{ width: 100 }} size="small">
                                            <Option value="formula">公式</Option>
                                            <Option value="remark">公式含义</Option>
                                            <Option value="explain">公式说明</Option>
                                        </Select>
                                        <Input onChange={this.searchValueChange} value={this.state.searchValue} placeholder="请输入搜索关键字" size="small" style={{ width: 160 }} />
                                    </InputGroup>

                                </div>
                            </p>
                        </div>
                        <Table
                            rowSelection={rowSelection}
                            columns={this.state.columns}
                            bordered
                            dataSource={this.state.tableData}
                            pagination={this.state.pagination}
                            onRow={row => {
                                return {
                                    onClick: event => {
                                        if (event.target.getAttribute('isLink')) {
                                            return;
                                        }
                                        const state = lodash.cloneDeep(this.state);
                                        state.formula = row.formula;
                                        state.formulaRemark = row.remark;
                                        state.formulaExplain = row.explain;
                                        state.formulaType = row.type;
                                        this.setState(state);
                                    }
                                }
                            }}
                            onChange={this.tableChange}
                            scroll={{ y: 240 }}
                        />
                    </div>
                </div>
                {this.state.formulaEditor.visible ? <FormulaEditor saveFormula={this.props.onOk} formulas={this.state.formulas} formulaType={this.state.treeSelectKeys[0]} formula={this.state.formulaEditor} handleCancel={this.formulaEditorCancel} pageParams={this.props.pageParams} /> : ''}
            </Modal>
        );
    }
}


export default CheckFormulaModal;