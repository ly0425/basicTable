import React, { Component } from 'react';
import { Modal, Select, message, Input, Button } from '@vadp/ui';
import { budgetPost } from "~/routes/visualizationModel/SpreadsheetDesigner/BudgetApi";
import lodash from 'lodash';
import * as SpreadsheetApi from "../SpreadsheetApi";

const { Option } = Select;

export default class BudgetParameterModal extends Component {
    constructor(props) {
        super(props)
        this.state = {
            parameterData: [],
            parameterSelectValue: undefined,
            conditions: []
        }
    }
    componentDidMount() {
        this.getFields();
    }
    async getFields() {
        const map = new Map();
        const alreadyGot = [];
        for (const rowProp of this.props.sheet.rowProps) {
            const { analysisModelId } = rowProp;
            if (analysisModelId) {
                if (alreadyGot.findIndex(item => item === analysisModelId) === -1) {
                    alreadyGot.push(analysisModelId);
                    const fields = await SpreadsheetApi.getAnalysisFields(rowProp.analysisModelId);
                    for (const field of fields) {
                        map.set(field.fieldName, field);
                    }
                }
            }
        }
        this.setState({ parameterData: [...map.values()] });
    }
    parameterChange = (value, props) => {
        this.setState({ parameterSelectValue: value, parameterSelectProps: props.props });
    }
    addCondition = () => {
        const { conditions, parameterSelectProps } = lodash.cloneDeep(this.state);
        const value = this.state.parameterSelectValue;
        if (!value) {
            message.warning('请选择分析模型字段！');
            return;
        }
        const condition = {
            ...parameterSelectProps,
            operation: '=',
            values: ''
        }
        delete condition.value;
        conditions.push(condition);
        this.setState({ conditions });
    }
    operatorChange = (index, value) => {
        const { conditions } = lodash.cloneDeep(this.state);
        conditions[index].operation = value;
        this.setState({ conditions });
    }
    valueChange = (index, e) => {
        const { conditions } = lodash.cloneDeep(this.state);
        conditions[index].values = e.target.value;
        this.setState({ conditions });
    }
    delCondition = (index) => {
        const { conditions } = lodash.cloneDeep(this.state);
        conditions.splice(index, 1);
        this.setState({ conditions });
    }
    handleSave = () => {
        let { conditions } = this.state;
        this.props.handle(conditions.length ? conditions : null);
    }
    handleCancel = () => {
        this.props.handle(null);
    }
    render() {
        return (
            <Modal
                visible={true}
                title="参数设置"
                onOk={this.handleSave}
                onCancel={this.handleCancel}
                width={500}
                wrapClassName="bi"
                destroyOnClose={true}
            >
                <div style={{ marginBottom: 16 }}>
                    <Select
                        showSearch
                        onChange={this.parameterChange}
                        value={this.state.parameterSelectValue}
                        placeholder="请选择分析模型字段"
                        style={{ width: 366, verticalAlign: 'middle' }}
                        filterOption={(input, option) =>
                            option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                    >
                        {this.state.parameterData.map(item => <Option {...item} key={item.fieldName} value={item.fieldName}>{item.comments}</Option>)}
                    </Select>
                    <Button onClick={this.addCondition} style={{ verticalAlign: 'middle', marginLeft: 10 }}>增加</Button>
                </div>
                <div style={{ marginBottom: 16 }}>
                    {
                        this.state.conditions.map((item, index) => {
                            return (
                                <p style={{ marginBottom: 10 }}>
                                    <span style={{ width: 164, display: 'inline-block', verticalAlign: 'middle', textAlign: 'center' }}>{item.comments}</span>
                                    <Select onChange={this.operatorChange.bind(this, index)} style={{ width: 90, marginLeft: 10, verticalAlign: 'middle' }} value={item.operation} placeholder="请选择操作符">
                                        <Option value="=">等于</Option>
                                        <Option value="!=">不等于</Option>
                                        <Option value=">">大于</Option>
                                        <Option value="<">小于</Option>
                                        <Option value="in">在...之中</Option>
                                        <Option value="not in">不在...之中</Option>
                                        <Option value="like">匹配</Option>
                                    </Select>
                                    <Input placeholder="请输入值" onChange={this.valueChange.bind(this, index)} value={item.values === '' ? undefined : item.values} style={{ width: 140, marginLeft: 10, verticalAlign: 'middle' }} />
                                    <i onClick={this.delCondition.bind(this, index)} style={{ marginLeft: 10, verticalAlign: 'middle' }} class="icon iconfont icon-fork"></i>
                                </p>
                            )
                        })
                    }
                </div>
            </Modal>
        )
    }
}