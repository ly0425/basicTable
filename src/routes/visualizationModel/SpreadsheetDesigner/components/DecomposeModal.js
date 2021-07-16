import React, { Component } from 'react';
import { Modal, Radio, message, Input, Popconfirm } from '@vadp/ui';
import lodash from 'lodash';
import PropertyUtils from '../../tableDesigner/components/PropertyUtils';

const TEXT = {
    12: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
    4: ['一季度', '二季度', '三季度', '四季度'],
    2: ['上半年', '下半年']
};
export default class DecomposeModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            type: 1,
            method: 12,
            value: [0],
            disabled: this.props.pageParams.queryType !== 'edit' ? true : false
        }
    }
    componentDidMount() {
        const { decompose, budgetValue } = this.props;
        if (decompose && (parseFloat(budgetValue).toFixed(4) === (decompose.value.reduce((sum, number) => sum + number)).toFixed(4))) {
            const { method, value } = decompose;
            this.setState({
                method,
                value
            });
        }
        else {
            this.setValue(this.state.method);
        }
    }
    setValue = (method) => {
        const value = [];
        const { budgetValue } = this.props;
        const average = Math.floor(budgetValue / method * 10000) / 10000;
        const sum = average * (method - 1);
        const diff = parseFloat((budgetValue - sum).toFixed(4));
        for (let i = 0; i < method - 1; i++) {
            value.push(average);
        }
        value.push(diff);
        this.setState({ value });
    }
    onOk = () => {
        const { method, value } = lodash.cloneDeep(this.state);
        const { budgetValue, ok } = this.props;
        const formatValue = value.map(item => parseFloat(item));
        const sum = formatValue.reduce((sum, number) => sum + number);
        if (parseFloat(budgetValue).toFixed(4) !== sum.toFixed(4)) {
            message.warning('分解和值与预算值不等！');
            return;
        }
        ok({ method, value: formatValue });
    }
    render() {
        const { format, budgetValue } = this.props;
        // const budgetText = PropertyUtils.conversionFormat(budgetValue, format);
        let sumValue = 0;
        let value = [];
        for (let i = 0, j = this.state.value.length; i < j; i++) {
            let temp = this.state.value[i];
            if (temp[temp.length - 1] === '.') {
                temp = temp.substr(0, temp.length - 1);
            }
            if (temp === '-' || temp === '') {
                temp = 0;
            }
            value.push(parseFloat(temp));
        }
        sumValue = value.reduce((sum, number) => sum + number);
        return (
            <Modal
                title="预算分解"
                visible={true}
                onOk={this.onOk}
                onCancel={this.props.cancel}
                maskClosable={false}
                destroyOnClose={true}
            >
                <div style={{ marginBottom: 12 }}>
                    <span style={{ display: 'inline-block', width: '50%' }}>原预算值：{parseFloat(budgetValue).toFixed(4)}</span>
                    <span style={{ display: 'inline-block', width: '50%' }}>分解和值：{sumValue.toFixed(4)}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                    <span>分解类型：</span>
                    <Radio.Group disabled={this.state.disabled} onChange={e => {
                        this.setState({ type: e.target.value })
                    }} value={this.state.type}>
                        <Radio value={1}>平均分配</Radio>
                        <Radio value={2}>取去年参照</Radio>
                    </Radio.Group>
                </div>
                <div style={{ marginBottom: 24 }}>
                    <span>分解方式：</span>
                    <Radio.Group disabled={this.state.disabled} onChange={e => {
                        const method = e.target.value;
                        this.setState({ method }, () => { this.setValue(method) });
                    }} value={this.state.method}>
                        <Radio value={12}>月度</Radio>
                        <Radio value={4}>季度</Radio>
                        <Radio value={2}>半年</Radio>
                    </Radio.Group>
                </div>
                <div style={{ overflow: 'hidden' }}>
                    {
                        TEXT[this.state.method].map((item, index) => {
                            return (
                                <p style={{ width: '47.5%', float: 'left', marginBottom: 6, marginLeft: (index + 1) % 2 === 0 ? '5%' : 0 }}>
                                    <span style={{ display: 'inline-block', width: '30%' }}>{item}：</span>
                                    <span style={{ display: 'inline-block', width: '70%' }}>
                                        <Input disabled={this.state.disabled} onChange={e => {
                                            const { value } = lodash.cloneDeep(this.state);
                                            const newValue = e.target.value;
                                            const reg = /^-?[0-9]*(\.[0-9]*)?$/;
                                            if ((!isNaN(newValue) && reg.test(newValue)) || newValue === '' || newValue === '-') {
                                                value[index] = newValue;
                                                this.setState({ value });
                                            }
                                        }} value={this.state.value[index]} />
                                    </span>
                                </p>
                            );
                        })
                    }
                </div>
            </Modal>);
    }
}