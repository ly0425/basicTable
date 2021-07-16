import React, { Component } from 'react';
import { Button, Tooltip, Tabs, Table, message } from '@vadp/ui';
import _ from 'lodash';
import axios from 'axios';
import { isHttpPublic } from 'constants/IntegratedEnvironment';
import * as SpreadsheetUtil from './SpreadsheetUtils';

const { TabPane } = Tabs;
const initialData = {
    "1": {
        title: '全部审核结果',
        key: "1",
        columns: [{
            title: 'NO.',
            width: 50,
            dataIndex: 'key',
            key: 'key',
            align: 'center',
            render: text => <div style={{ width: 33, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text}>{text}</Tooltip></div>
        }, {
            title: '报表编码',
            width: 100,
            dataIndex: 'reportCode',
            key: 'reportCode',
            render: text => <div style={{ width: 83, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text}>{text}</Tooltip></div>
        }, {
            title: '报表名称',
            width: 100,
            dataIndex: 'reportName',
            key: 'reportName',
            render: text => <div style={{ width: 83, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text}>{text}</Tooltip></div>
        }, {
            title: '期间',
            width: 75,
            dataIndex: 'period',
            key: 'period',
            render: text => <div style={{ width: 58, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text}>{text}</Tooltip></div>
        }, {
            title: '描述',
            width: 100,
            dataIndex: 'isPass',
            key: 'isPass',
            render: text => <div style={{ width: 83, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text === false ? '操作失败' : '操作成功'}>{text === false ? '操作失败' : '操作成功'}</Tooltip></div>
        }, {
            title: '公式类型',
            width: 125,
            dataIndex: 'type',
            key: 'type',
            render: text => <div style={{ width: 108, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text ? text : '基本平衡公式'}>{text ? text : '基本平衡公式'}</Tooltip></div>
        }, {
            title: '公式表达式',
            width: 150,
            dataIndex: 'formula',
            key: 'formula',
            render: text => <div style={{ width: 133, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text}>{text}</Tooltip></div>
        }, {
            title: '公式含义',
            width: 150,
            dataIndex: 'remark',
            key: 'remark',
            render: text => <div style={{ width: 133, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text}>{text}</Tooltip></div>
        }, {
            title: '审核详情',
            dataIndex: 'msg',
            key: 'msg',
            render: text => <div style={{ maxHeight: 21, overflow: 'auto' }}>{text}</div>
        }],
        data: []
    },
    "2": {
        title: '基本平衡公式',
        key: "2",
        columns: [{
            title: 'NO.',
            width: 50,
            dataIndex: 'key',
            key: 'key',
            align: 'center',
            render: text => <div style={{ width: 33, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text}>{text}</Tooltip></div>
        }, {
            title: '报表编码',
            width: 100,
            dataIndex: 'reportCode',
            key: 'reportCode',
            render: text => <div style={{ width: 83, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text}>{text}</Tooltip></div>
        }, {
            title: '报表名称',
            width: 100,
            dataIndex: 'reportName',
            key: 'reportName',
            render: text => <div style={{ width: 83, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text}>{text}</Tooltip></div>
        }, {
            title: '期间',
            width: 75,
            dataIndex: 'period',
            key: 'period',
            render: text => <div style={{ width: 58, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text}>{text}</Tooltip></div>
        }, {
            title: '描述',
            width: 100,
            dataIndex: 'isPass',
            key: 'isPass',
            render: text => <div style={{ width: 83, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text === false ? '操作失败' : '操作成功'}>{text === false ? '操作失败' : '操作成功'}</Tooltip></div>
        }, {
            title: '公式类型',
            width: 125,
            dataIndex: 'type',
            key: 'type',
            render: text => <div style={{ width: 108, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text ? text : '基本平衡公式'}>{text ? text : '基本平衡公式'}</Tooltip></div>
        }, {
            title: '公式表达式',
            width: 150,
            dataIndex: 'formula',
            key: 'formula',
            render: text => <div style={{ width: 133, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text}>{text}</Tooltip></div>
        }, {
            title: '公式含义',
            width: 150,
            dataIndex: 'remark',
            key: 'remark',
            render: text => <div style={{ width: 133, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text}>{text}</Tooltip></div>
        }, {
            title: '审核详情',
            dataIndex: 'msg',
            key: 'msg',
            render: text => <div style={{ maxHeight: 21, overflow: 'auto' }}>{text}</div>
        }],
        data: []
    },
    "3": {
        title: '逻辑性公式',
        key: "3",
        columns: [{
            title: 'NO.',
            width: 50,
            dataIndex: 'key',
            key: 'key',
            align: 'center',
            render: text => <div style={{ width: 33, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text}>{text}</Tooltip></div>
        }, {
            title: '报表编码',
            width: 100,
            dataIndex: 'reportCode',
            key: 'reportCode',
            render: text => <div style={{ width: 83, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text}>{text}</Tooltip></div>
        }, {
            title: '报表名称',
            width: 100,
            dataIndex: 'reportName',
            key: 'reportName',
            render: text => <div style={{ width: 83, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text}>{text}</Tooltip></div>
        }, {
            title: '期间',
            width: 75,
            dataIndex: 'period',
            key: 'period',
            render: text => <div style={{ width: 58, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text}>{text}</Tooltip></div>
        }, {
            title: '描述',
            width: 100,
            dataIndex: 'isPass',
            key: 'isPass',
            render: text => <div style={{ width: 83, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text === false ? '操作失败' : '操作成功'}>{text === false ? '操作失败' : '操作成功'}</Tooltip></div>
        }, {
            title: '公式类型',
            width: 125,
            dataIndex: 'type',
            key: 'type',
            render: text => <div style={{ width: 108, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text ? text : '基本平衡公式'}>{text ? text : '基本平衡公式'}</Tooltip></div>
        }, {
            title: '公式表达式',
            width: 150,
            dataIndex: 'formula',
            key: 'formula',
            render: text => <div style={{ width: 133, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text}>{text}</Tooltip></div>
        }, {
            title: '公式含义',
            width: 150,
            dataIndex: 'remark',
            key: 'remark',
            render: text => <div style={{ width: 133, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text}>{text}</Tooltip></div>
        }, {
            title: '审核详情',
            dataIndex: 'msg',
            key: 'msg',
            render: text => <div style={{ maxHeight: 21, overflow: 'auto' }}>{text}</div>
        }],
        data: []
    },
    "4": {
        title: '核实性公式',
        key: "4",
        columns: [{
            title: 'NO.',
            width: 50,
            dataIndex: 'key',
            key: 'key',
            align: 'center',
            render: text => <div style={{ width: 33, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text}>{text}</Tooltip></div>
        }, {
            title: '报表编码',
            width: 100,
            dataIndex: 'reportCode',
            key: 'reportCode',
            render: text => <div style={{ width: 83, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text}>{text}</Tooltip></div>
        }, {
            title: '报表名称',
            width: 100,
            dataIndex: 'reportName',
            key: 'reportName',
            render: text => <div style={{ width: 83, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text}>{text}</Tooltip></div>
        }, {
            title: '期间',
            width: 75,
            dataIndex: 'period',
            key: 'period',
            render: text => <div style={{ width: 58, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text}>{text}</Tooltip></div>
        }, {
            title: '描述',
            width: 100,
            dataIndex: 'isPass',
            key: 'isPass',
            render: text => <div style={{ width: 83, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text === false ? '操作失败' : '操作成功'}>{text === false ? '操作失败' : '操作成功'}</Tooltip></div>
        }, {
            title: '公式类型',
            width: 125,
            dataIndex: 'type',
            key: 'type',
            render: text => <div style={{ width: 108, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text ? text : '基本平衡公式'}>{text ? text : '基本平衡公式'}</Tooltip></div>
        }, {
            title: '公式表达式',
            width: 150,
            dataIndex: 'formula',
            key: 'formula',
            render: text => <div style={{ width: 133, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text}>{text}</Tooltip></div>
        }, {
            title: '公式含义',
            width: 150,
            dataIndex: 'remark',
            key: 'remark',
            render: text => <div style={{ width: 133, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><Tooltip placement="topLeft" title={text}>{text}</Tooltip></div>
        }, {
            title: '审核详情',
            dataIndex: 'msg',
            key: 'msg',
            render: text => <div style={{ maxHeight: 21, overflow: 'auto' }}>{text}</div>
        }],
        data: []
    }
}
export default class SpreadsheetBottomInfo extends Component {
    constructor(props) {
        super(props)
        this.state = {
            show: true,
            activeKey: "1",
            tabPanes: []
        }
    }
    componentDidMount() {
        const state = _.cloneDeep(this.state);
        const { data, activeKey } = this.props;
        for (let key in data) {
            const tabPaneIndex = state.tabPanes.findIndex(item => item.key === key)
            if (tabPaneIndex === -1) {
                const tabPane = _.cloneDeep(initialData[key]);
                tabPane.data = data[key];
                state.tabPanes.push(tabPane);
            }
            else {
                state.tabPanes[tabPaneIndex].data = data[key];
            }
        }
        state.activeKey = activeKey;
        this.setState(state);
    }
    bottomInfoOnChange = activeKey => {
        const state = _.cloneDeep(this.state)
        state.activeKey = activeKey;
        this.setState(state);
    }
    bottomInfoOnEdit = (targetKey, action) => {
        this[action](targetKey);
    }
    remove = targetKey => {
        const state = _.cloneDeep(this.state);
        let { activeKey, tabPanes } = state;
        let lastIndex;
        tabPanes.forEach((pane, i) => {
            if (pane.key === targetKey) {
                lastIndex = i - 1;
            }
        });
        const panes = tabPanes.filter(pane => pane.key !== targetKey);
        if (panes.length && activeKey === targetKey) {
            if (lastIndex >= 0) {
                activeKey = panes[lastIndex].key;
            } else {
                activeKey = panes[0].key;
            }
        }
        if (panes.length === 0) {
            this.props.handleClose();
        }
        state.activeKey = activeKey;
        state.tabPanes = panes;
        this.setState(state);
    }
    exportCheckResult = () => {
        const postData = {};
        postData.reportCode = this.props.pageParams.reportCode;
        postData.reportName = this.props.reportName;
        postData.period = this.props.pageParams.period;
        postData.formulaList = this.state.tabPanes[parseInt(this.state.activeKey) - 1].data;
        let url = '/bi/excel/exportCheckResult';
        if (window.REACT_APP_CONFIG && window.REACT_APP_CONFIG.domain_api) {
            url = `${window.REACT_APP_CONFIG.domain_api}${url}`;
        }
        axios.post(url, postData, { responseType: 'blob' }).then((response) => {
            let blob = new Blob([response.data])
            if ('download' in document.createElement('a')) { // 不是IE浏览器
                let url = window.URL.createObjectURL(blob);
                let link = document.createElement('a');
                link.style.display = 'none';
                link.href = url;
                link.setAttribute('download', `${postData.reportName}.xls`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else { // IE 10+
                window.navigator.msSaveBlob(blob, `${postData.reportName}.xls`);
            }
        })
    }
    resultConfirm = () => {
        const { pageParams } = _.cloneDeep(this.props);
        if (!this.props.data["4"].length) {
            message.warning('核实性公式审核通过！不需要确认！');
            return;
        }
        if (this.props.data["2"].length.length || this.props.data["3"].length.length) {
            message.warning('存在必须修改的公式，无法确认！审核未通过！');
            return;
        }
        delete pageParams.buttonRight;
        pageParams.checkStatus = 1;
        let pageParamsStr = '';
        for (let key in pageParams) {
            pageParamsStr += `&${key}=${pageParams[key]}`;
        }
        const url = `${isHttpPublic}excel/updateState/?${pageParamsStr.substring(1, pageParamsStr.length)}`;
        axios.get(url)
            .then((response) => {
                if (response.data.status === '0') {
                    message.success('核实性公式已确认，审核通过！');
                    this.props.handleChangeCheckStatus();
                }
                else {
                    message.warning('核实性公式确认失败！');
                }
            });
    }
    render() {
        return (
            <div className="spreadsheet-info-box">
                <Tabs
                    hideAdd={true}
                    onChange={this.bottomInfoOnChange}
                    activeKey={this.state.activeKey}
                    onEdit={this.bottomInfoOnEdit}
                    type="editable-card"
                >
                    {
                        this.state.tabPanes.map(item => {
                            return (
                                <TabPane tab={item.title} key={item.key}>
                                    <div className="spreadsheet-info-panel-box">
                                        {/* <div style={{ position: "absolute", right: -24, top: 0 }}><i title="导出" onClick={this.exportCheckResult} class="icon iconfont icon-BI_daochu"></i></div> */}
                                        <div style={{ position: "absolute", right: -54, top: 0 }}><Button onClick={this.exportCheckResult} size="small">导出</Button></div>
                                        <div style={{ position: "absolute", right: -54, top: 30, display: `${this.state.activeKey === "4" && this.props.pageParams.haveFormulaCanEdit === 'true' ? 'block' : 'none'}` }}><Button onClick={this.resultConfirm} size="small">确认</Button></div>
                                        <Table scroll={{ y: 90 }} onRow={record => {
                                            return {
                                                onClick: () => {
                                                    const { formula } = record;
                                                    const cellAddress = SpreadsheetUtil.getFormulaRefs(formula);
                                                    this.props.handleRowSelect(cellAddress)
                                                }
                                            }
                                        }} bordered dataSource={item.data} columns={item.columns} pagination={false} />
                                    </div>
                                </TabPane>
                            );
                        })
                    }
                </Tabs>
            </div>
        )
    }
}