import React, { Component } from 'react';
import { Modal, Button, Table } from '@vadp/ui';
import NetUitl from 'src/containers/HttpUtil';
import Message from './Message';

class PrintTemplateModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedRowKeys: [],
            data: []
        }
    }
    componentDidMount() {
        const that = this;
        NetUitl.get(`/tables/listBySourceTable?source_table=${this.props.id}`, null, function (res) {
            if (res.code == 200) {
                that.setState({ data: res.data })
            }
        })
    }

    handleOk = () => {
        const { data, selectedRowKeys } = this.state;
        if (selectedRowKeys.length) {
            const currentTemplate = data[selectedRowKeys[0]];
            this.props.handleOk && this.props.handleOk({ printTemplateId: currentTemplate.id, })
        } else {
            this.props.handleCancel()
        }
    }
    handleCancel = () => {
        this.props.handleCancel()
    }
    onSelectChange = (selectedRowKeys) => {
        this.setState({ selectedRowKeys });
    }
    clearClick = () => {
        this.setState({ selectedRowKeys: [] })
    }
    render() {
        const { visible } = this.props;
        const { selectedRowKeys, data } = this.state;
        console.log(data)
        const rowSelection = {
            selectedRowKeys,
            onChange: this.onSelectChange,
            type: 'radio'
        };
        const columns = [
            {
                title: '名称',
                dataIndex: 'name',
                key: 'name',
            },
        ];
        return (
            <Modal
                title="打印模板列表"
                visible={visible}
                onOk={this.handleOk}
                onCancel={this.handleCancel}
            >
                <Button onClick={this.clearClick} style={{ marginBottom: '10px' }}>清空</Button>
                <Table rowSelection={rowSelection} columns={columns} dataSource={data} />
            </Modal>
        )
    }
}

export default PrintTemplateModal;