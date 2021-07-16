import React, { Component } from 'react';
import { budgetPost } from "~/routes/visualizationModel/SpreadsheetDesigner/BudgetApi";
import { Input, Select, Modal, Tooltip, message, Icon } from '@vadp/ui';
import { getAnalysisFields } from '../SpreadsheetApi';
import { async } from 'rxjs/internal/scheduler/async';
const { Option } = Select;
const operatorList = [
    { key: '=', val: '等于' },
    { key: '!=', val: '不等于' },
    { key: '>', val: '大于' },
    { key: '<', val: '小于' },
    { key: 'IN', val: '	在集合中' },
    { key: 'NOT IN', val: '不在集合中' },
    { key: 'IS NULL', val: '空值' },
    { key: 'IS NOT NULL', val: '非空值' },
    { key: 'll', val: '左匹配' },
    { key: 'rl', val: '右匹配' },
    { key: 'LIKE', val: '匹配' }
]
class DimensionConditionModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableData: [],
            floatRowDimensionCondition: JSON.parse(JSON.stringify(props.floatRowDimensionCondition || []))
        };
    }
    componentDidMount() {
        this.init();
    }
    init = async () => {
        const { type, combId } = this.props;

        if (type === 'isAnalysisModel') {
            let res = await getAnalysisFields(combId);
            console.log(res)
            if (res && res.length) {
                res = res.map(item => {
                    const { aliasName, comments, fieldName, dataType } = item;
                    return { column_name: aliasName || fieldName, column_description: comments, dataType };
                })
                this.setState({ tableData: res })
            }
            return;
        }

        budgetPost(
            'getDimOrDictColumn',
            {
                combId: combId || '',
            },
            'POST'
        ).then((res) => {
            const tableData = res.datas;
            this.setState({
                tableData,
            });
        }).catch((err) => {
            message.warning('网络连接错误！')
        })
    }
    tablefieldChange = (tablefield) => {
        this.setState({
            tablefield
        })
    }
    addCondition = () => {
        const { tablefield, floatRowDimensionCondition, tableData } = this.state;

        if (!tablefield) {
            return;
        }
        let currentField = tableData.find(item => item.column_name == tablefield);
        floatRowDimensionCondition.push({
            field: tablefield,
            operator: '=',
            value: '',
            fieldDescribe: currentField.column_description,
            disabled: false,
            dataType: currentField.dataType
        })
        this.setState({
            floatRowDimensionCondition
        })
    }
    conditionChange = (i, type, e) => {
        let value = e.target ? e.target.value : e;
        value = value.replace(/,|，/g, ',')
        const { floatRowDimensionCondition } = this.state;
        floatRowDimensionCondition[i].disabled = false;
        floatRowDimensionCondition[i][type] = value;
        if (value === 'IS NULL' || value === 'IS NOT NULL') {
            floatRowDimensionCondition[i].disabled = true;
            floatRowDimensionCondition[i].value = '';
        }
        this.setState({ floatRowDimensionCondition });
    }
    renderCondition = () => {
        return this.state.floatRowDimensionCondition.map((item, i) => {
            return (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center' }}>
                    <Input value={item.fieldDescribe} style={{ marginRight: '10px', width: '160px' }} disabled={true} />
                    <Select style={{ width: 180, }} loading value={item.operator}
                        onChange={this.conditionChange.bind(this, i, 'operator')}>
                        {
                            operatorList.map(c =>
                                (
                                    <Option value={c.key}>
                                        <Tooltip title={c.val}>
                                            {c.val}
                                        </Tooltip>
                                    </Option>
                                )
                            )
                        }
                    </Select>
                    <span style={{ margin: '0px 10px' }}>值：</span>
                    <Input disabled={item.disabled} value={item.value} style={{ width: '190px' }}
                        onChange={this.conditionChange.bind(this, i, 'value')}></Input>
                    <Icon type="minus-circle" style={{ marginLeft: 'auto', cursor: 'pointer' }} onClick={this.deleteCurrent.bind(this, i)} />
                </div>
            )
        })
    }
    deleteCurrent = (i) => {
        const { floatRowDimensionCondition } = this.state;
        console.log(32323, floatRowDimensionCondition)
        floatRowDimensionCondition.splice(i, 1);
        this.setState({ floatRowDimensionCondition })
    }
    handleOk = () => {
        const { floatRowDimensionCondition } = this.state;

        this.props.handleOk(floatRowDimensionCondition)
    }
    render() {
        // const { visible } = this.props;

        return (
            <Modal
                visible={true}
                title={'绑定维度条件'}
                onOk={this.handleOk}
                onCancel={this.props.handleCancel}
                width={700}
                wrapClassName="oes-function-modal bi"
            >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '15px' }} >表字段:</span>
                    <Select style={{ width: 250, }} loading value={this.state.tablefield} onChange={this.tablefieldChange}>
                        <Option value="">请选择</Option>
                        {
                            this.state.tableData.map(item => (<Option value={item.column_name}>{item.column_description}</Option>))
                        }
                    </Select>
                    <Icon type="plus-circle" style={{ marginLeft: 'auto', cursor: 'pointer' }} onClick={this.addCondition} />
                </div>
                <div style={{
                    maxHeight: 'calc(100vh - 250px)',
                    overflowY: 'auto',
                    marginBottom: 16
                }}>
                    {
                        this.renderCondition()
                    }
                </div>
            </Modal>
        );
    }
}



export default DimensionConditionModal;