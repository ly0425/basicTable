import React, { Component } from 'react';
import { Input, Select, Modal, message, Icon } from '@vadp/ui';
import { getAnalysisFields } from '../SpreadsheetApi';
import lodash from 'lodash';
const { Option } = Select;

class analysisSortModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tablefield: undefined,
            tableData: [],
            tableDataSelected: [],
            sortExpressions: this.props.sortExpressions || []
        };
    }
    componentDidMount() {
        this.init();
    }
    init = async () => {
        const { combId, sortExpressions } = this.props;
        let { tableData, tableDataSelected } = lodash.cloneDeep(this.state);
        let res = await getAnalysisFields(combId);
        if (res && res.length) {
            res = res.map(item => {
                const { aliasName, comments, fieldName, dataType } = item;
                return { column_name: aliasName || fieldName, column_description: comments, dataType };
            });
            for (let m = 0, n = res.length; m < n; m++) {
                if (sortExpressions.findIndex(item => item.sortfieldName === res[m].column_name) === -1) {
                    tableData.push(res[m]);
                }
                else {
                    tableDataSelected.push(res[m]);
                }
            }
            this.setState({ tableData, tableDataSelected });
        }
    }
    tablefieldChange = (tablefield) => {
        this.setState({
            tablefield
        });
    }
    addCondition = () => {
        let { tablefield, sortExpressions, tableData, tableDataSelected } = lodash.cloneDeep(this.state);;
        if (!tablefield) {
            message.warning('请选择表字段！');
            return;
        }
        sortExpressions.push({
            order: 'ascend',
            sortfieldName: tablefield
        });
        tableDataSelected.push(tableData.find(item => item.column_name === tablefield))
        tableData = tableData.filter(item => item.column_name !== tablefield);
        this.setState({
            tablefield: undefined,
            tableData,
            tableDataSelected,
            sortExpressions
        });
    }
    conditionChange = (i, value) => {
        const { sortExpressions } = lodash.cloneDeep(this.state);
        sortExpressions[i].order = value;
        this.setState({ sortExpressions });
    }
    renderCondition = () => {
        return this.state.sortExpressions.map((item, i) => {
            return (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center' }}>
                    <Input value={item.sortfieldName} style={{ marginRight: 10, width: 300 }} disabled={true} />
                    <Select style={{ width: 90, }} loading value={item.order}
                        onChange={this.conditionChange.bind(this, i)}>
                        <Option value="ascend">升序</Option>
                        <Option value="descend">降序</Option>
                    </Select>
                    <Icon type="minus-circle" style={{ marginLeft: 'auto', cursor: 'pointer' }} onClick={this.deleteCurrent.bind(this, i)} />
                </div>
            );
        });
    }
    deleteCurrent = (i) => {
        let { sortExpressions, tableDataSelected, tableData } = lodash.cloneDeep(this.state);
        const deleteSortExpression = sortExpressions.splice(i, 1);
        tableData.push(tableDataSelected.find(item => item.column_name === deleteSortExpression[0].sortfieldName));
        tableDataSelected = tableDataSelected.filter(item => item.column_name !== deleteSortExpression[0].sortfieldName);
        this.setState({ tableDataSelected, tableData, sortExpressions });
    }
    handleOk = () => {
        const { sortExpressions } = this.state;
        this.props.handleOk(sortExpressions)
    }
    render() {
        return (
            <Modal
                visible={true}
                title={'分析模型排序'}
                onOk={this.handleOk}
                onCancel={this.props.handleCancel}
                width={480}
                wrapClassName="oes-function-modal bi"
            >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '15px' }} >表字段:</span>
                    <Select placeholder="请选择" style={{ width: 340, }} loading value={this.state.tablefield} onChange={this.tablefieldChange}>
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
export default analysisSortModal;