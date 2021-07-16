import React, { Component } from 'react';
import { Modal, Button, Divider, Tooltip, Table } from '@vadp/ui';
import BudgetFormulaModal from './BudgetFormulaModal';
import Common from 'components/Print/Common';
import produce from 'immer';
import { budgetGet } from '../BudgetApi';
const comm = new Common();
class AuditFormulaList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            formulaList: [],
            FormulaVisible: false,
            selectedRowKeys: []
        };

    }
    componentDidMount() {
        this.init();
    }
    init = async () => {
        let formulaList = [...(this.props.formulaList || [])]
        const { selectedRowKeys } = this.state;
        for (let item of formulaList) {
            selectedRowKeys.push(item.key)
        }
        try {
            const res = await budgetGet('getAuditRules')
            for (let item of res) {
                if (!formulaList.find(c => c.key == item.id)) {
                    formulaList.push({
                        exp: item.ruleFormula,
                        key: item.id,
                        isAll: true,
                        ruleName: item.ruleName,
                        ruleDesc: item.ruleDesc
                    })
                }

            }
        } catch (error) {
            console.log(error)
        }



        console.log(formulaList)
        this.setState({ formulaList, selectedRowKeys })
    }

    columns = [
        {
            title: '序号',
            key: 'rowNumber',
            align: 'center',
            width: '5%',
            render: (t, c, i) => (i + 1)
        },
        {
            title: '表达式',
            dataIndex: 'exp',
            key: 'exp',
            align: 'center',
            // width:'50%',
            ellipsis: true,
            render: (t) => (<Tooltip title={t}>{t}</Tooltip>)
        },
        {
            title: '来源',
            dataIndex: 'ruleName',
            key: 'ruleName',
            align: 'center',
            width: '10%',
            ellipsis: true,
            // render: (t) => (<Tooltip title={t}>{t}</Tooltip>)
        },
        {
            title: '范围',
            dataIndex: 'deptName',
            key: 'deptName',
            align: 'center',
            width: '10%',
            ellipsis: true,
            // render: (t) => (<Tooltip title={t}>{t}</Tooltip>)
        },
        {
            title: '说明',
            dataIndex: 'ruleDesc',
            key: 'ruleDesc',
            align: 'center',
            width: '18%',
            ellipsis: true,
            // render: (t) => (<Tooltip title={t}>{t}</Tooltip>)
        },
        {
            title: '操作',
            key: 'action',
            align: 'center',
            width: '10%',
            render: (text, record, index) => (
                <span>
                    {
                        record.isAll ? '' : (<span>
                            <a href="javascript:;" onClick={() => {
                                this.Ci = index;
                                this.setState({ FormulaVisible: true });
                            }}>编辑</a>
                            <Divider type="vertical" />
                            <a href="javascript:;" style={{ color: 'red' }} onClick={() => {

                                let formulaList = produce(this.state.formulaList, c => {
                                    c.splice(index, 1);
                                })
                                const { selectedRowKeys } = this.state;
                                const { key } = record;
                                let i = selectedRowKeys.findIndex(item => item == key)
                                if (i != -1) {
                                    selectedRowKeys.splice(i, i)
                                }
                                this.setState({ formulaList, selectedRowKeys })
                            }}>删除</a>
                        </span>)
                    }

                </span>
            ),
        },
    ];
    renderAuditFormula() {
        const { FormulaVisible, formulaList } = this.state;
        if (!FormulaVisible) {
            return;
        }
        return (<BudgetFormulaModal
            visible={FormulaVisible}
            defaultText={formulaList[this.Ci] ? formulaList[this.Ci].exp : ''}
            budgetExpExplain={formulaList[this.Ci] ? formulaList[this.Ci].ruleDesc : ''}
         
            auditScopeDept={formulaList[this.Ci] ? formulaList[this.Ci].deptId : ''}
            auditScopeDeptName={formulaList[this.Ci] ? formulaList[this.Ci].deptName : ''}
            acctYear={this.props.acctYear}
            width={this.props.width}
            height={this.props.height}
            onOk={(map) => {
                let ci = this.Ci;
                let key = comm.genId();
                let b = false;
                const { selectedRowKeys } = this.state;
                let formulaList = produce(this.state.formulaList, c => {
                    if (c[ci]) {
                        c[ci].exp = map.expression;
                        c[ci].ruleDesc = map.ruleDesc;
                        if (map.deptId) {
                            c[ci].deptId = map.deptId;
                            c[ci].deptName = map.deptName;
                        }
                    } else {
                        b = true;
                        let obj = { exp: map.expression, key, ruleDesc: map.ruleDesc };
                        if (map.deptId) {
                            obj.deptId = map.deptId;
                            obj.deptName = map.deptName;
                        }
                        c.push(obj);
                    }
                })
                if (b) {
                    selectedRowKeys.push(key)
                }
                this.setState({ FormulaVisible: false, formulaList, selectedRowKeys });

            }} onCancel={() => {
                this.setState({ FormulaVisible: false });
            }}
        />)
    }
    handleOk = () => {
        const { formulaList, selectedRowKeys } = this.state;
        let list = [];
        for (let item of selectedRowKeys) {
            let current = formulaList.find(c => c.key == item);
            if (current) {
                list.push(current);
            }
        }
        console.log(list)
        this.props.handleOk(list)
    }
    onSelectChange = selectedRowKeys => {
        console.log('selectedRowKeys changed: ', selectedRowKeys);
        this.setState({ selectedRowKeys });
    };
    render() {
        const { visible, handleCancel } = this.props;
        const { formulaList, selectedRowKeys } = this.state;
        const rowSelection = {
            selectedRowKeys,
            onChange: this.onSelectChange,
        };
        return (
            <div>
                <Modal
                    title="审核公式列表"
                    visible={visible}
                    onOk={this.handleOk}
                    onCancel={handleCancel}
                    bodyStyle={{ maxHeight: '375px' }}
                    width={1500}
                    okText='确定'
                    cancelText='取消'
                    maskClosable={false}
                >
                    <div id='auditList'>
                        <p style={{ margin: '10px 0px', textAlign: 'right' }}> <Button size="small" onClick={() => {
                            this.Ci = null;
                            this.setState({ FormulaVisible: true })
                        }}>添加</Button></p>
                        <Table columns={this.columns}
                            locale={{ emptyText: '暂无数据' }} dataSource={formulaList}
                            bordered={true}
                            rowSelection={rowSelection}
                            pagination={false} scroll={{ y: 294 }} />
                    </div>
                </Modal>
                {
                    this.renderAuditFormula()
                }
            </div>
        );
    }
}

export default AuditFormulaList;