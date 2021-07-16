
import React, { Component } from 'react';
import { Modal, Input, Icon } from '@vadp/ui';
import produce from 'immer';

class Enumeration extends Component {
    constructor(props) {
        super(props);
        this.state = {
            defaultValue: [],
        };
    }
    componentDidMount() {
        const { defaultValue } = this.props;
        if (defaultValue) {
            this.setState({
                defaultValue: this.props.defaultValue
            });
        }
    }
    renderParameters() {
        const { defaultValue } = this.state;
        return defaultValue.map((item, i) => {
            return (
                <div style={{ display: 'flex', marginTop: '6px' }}>
                    key: <Input style={{ margin: '0px 15px' }} value={item.key} disabled={true} />
                    value: <Input style={{ margin: '0px 15px' }} value={item.val} onChange={this.parameChange.bind(this, i)} />
                    <Icon type="minus-circle" onClick={this.removeParame.bind(this, i)} style={{ fontSize: 16, float: 'right', cursor: 'pointer', marginTop: '3px', color: 'red' }} />
                </div>
            )
        })
    }
    removeParame(i) {
        let defaultValue = produce(this.state.defaultValue, (d) => {
            d.splice(i, 1)
        });
        this.setState({ defaultValue })
    }
    parameChange(i, e) {
        let defaultValue = produce(this.state.defaultValue, (d) => {
            d[i].val = e.target.value;
        });
        this.setState({ defaultValue })
    }
    addParameter = () => {

        if (!this.currentParamKey.input.value || !this.currentParamval.input.value) {
            return;
        }
        let defaultValue = produce(this.state.defaultValue, (d) => {
            let index = d.findIndex((item) => item.key == this.currentParamKey.input.value);
            if (index != -1) {
                d[index].val = this.currentParamval.input.value;
            } else {
                d.push({
                    key: this.currentParamKey.input.value,
                    val: this.currentParamval.input.value
                })
            }
        })
        this.currentParamKey.input.value = '';
        this.currentParamval.input.value = '';
        this.setState({ defaultValue })
    }

    getCurrentState() {
        const {  defaultValue } = this.state;
        return {  defaultValue };
    }
    render() {
        return (<React.Fragment>
            <h2 style={{ marginBottom: '15px' }}>添加默认值：</h2>
            <div style={{ display: 'flex' }}>
                key: <Input style={{ margin: '0px 15px' }} ref={(e) => { this.currentParamKey = e }} />
                value: <Input style={{ margin: '0px 15px' }} ref={(e) => { this.currentParamval = e }} />
                <Icon type="plus-circle" onClick={this.addParameter} style={{ fontSize: 16, float: 'right', cursor: 'pointer', marginTop: '3px' }} />
            </div>
            <h2 style={{ margin: '15px 0px' }}>默认值列表：</h2>
            <div style={{ height: '100px', overflow: 'auto' }}>
                {
                    this.renderParameters()
                }
            </div>
        </React.Fragment>)
    }
}
class ReferenceModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    onOk = () => {
        const { onOk } = this.props;
        onOk(this.tab.getCurrentState().defaultValue);
    }
    render() {
        const { defaultValue } = this.props;
        return (
            <Modal
                title={'默认值设置'}
                visible={this.props.visible}
                okText="确认"
                bodyStyle={{ height: '307px' }}
                onOk={this.onOk}
                cancelText="取消"
                onCancel={this.props.onCancel}
                wrapClassName="bi"
            >
                <div>
                    <Enumeration ref={(e) => { this.tab = e }} defaultValue={defaultValue || []}/>
                </div>
            </Modal>
        )
    }
}


export default ReferenceModal;
