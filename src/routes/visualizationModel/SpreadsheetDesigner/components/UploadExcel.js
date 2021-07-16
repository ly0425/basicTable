import React, { Component } from 'react';
import { Upload, Button, Row, Col, Input, Icon,Tooltip } from 'antd';
const { Dragger } = Upload;
class UploadExcel extends Component {
    state = {
        fileList: [],
    };
    getFileList() {
        return {
            file: this.state.fileList[0],
            startRow: this.start.input.value || null,
            endRow: this.end.input.value || null,
            dimensionCol: this.dimension.input.value || null,
        }
    }
    render() {
        const { fileList } = this.state;
        const props = {
            onRemove: file => {
                this.setState(state => {
                    const index = state.fileList.indexOf(file);
                    const newFileList = state.fileList.slice();
                    newFileList.splice(index, 1);
                    return {
                        fileList: newFileList,
                    };
                });
            },
            beforeUpload: file => {
                this.setState({
                    fileList: [file],
                });
                return false;
            },
            accept: '.xls,.xlsx',
            fileList,
        };
        return (<div>
            <Row style={{ marginTop: '8px' }}>
                <Col style={{ textAlign: 'center' }} span={6}>
                    <p style={{ lineHeight: '151px' }}> 选择文件：</p>
                </Col>
                <Col span={18}>
                    <Dragger {...props}>
                        <p className="ant-upload-drag-icon">
                            <Icon type="inbox" />
                        </p>
                        <p className="ant-upload-text">点击或拖入上传excel文件</p>
                    </Dragger>,
                </Col>
            </Row>
            <Row style={{ marginTop: '8px' }}>
                <Col style={{ textAlign: 'center' }} span={6}>
                    维度列：
                </Col>
                <Col span={18}>
                    <Tooltip title="请输入数字">
                        <Input placeholder='维度成员所在列' ref={ref => this.dimension = ref} />
                    </Tooltip>
                </Col>
            </Row>
            <Row style={{ marginTop: '8px' }}>
                <Col style={{ textAlign: 'center' }} span={6}>
                    起始行：
                </Col>
                <Col span={18}>
                    <Tooltip title="请输入数字">
                        <Input placeholder='请输入起始行' ref={ref => this.start = ref} />
                    </Tooltip>
                </Col>
            </Row>
            <Row style={{ marginTop: '8px' }}>
                <Col style={{ textAlign: 'center' }} span={6}>
                    结束行：
                </Col>
                <Col span={18}>
                    <Tooltip title="请输入数字">
                        <Input placeholder='请输入结束行' ref={ref => this.end = ref} />
                    </Tooltip>
                </Col>
            </Row>
        </div>
        )
    }
}

export default UploadExcel;
