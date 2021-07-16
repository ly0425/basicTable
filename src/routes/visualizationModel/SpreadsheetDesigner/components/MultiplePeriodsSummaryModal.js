import React, { Component } from 'react';
import { Modal, Button } from '@vadp/ui';
import axios from 'axios';
import { isHttpPublic } from 'constants/IntegratedEnvironment';
import EditGrid, { getRenderRange, isRangeEqual } from '~/routes/visualizationModel/components/EditGrid';
import { PreviewCell } from '~/routes/visualizationModel/SpreadsheetDesigner/components/SpreadsheetPreview';
import Message from 'public/Message';
import produce from 'immer';
import addressConverter from 'xlsx-populate/lib/addressConverter';
import ColumnHeader from '~/routes/visualizationModel/components/ColumnHeader';
import RowHeader from '~/routes/visualizationModel/components/RowHeader';
import * as SpreadsheetUtil from './SpreadsheetUtils';
import { connect } from 'react-redux';
import { directlyPrintExcel } from '../SpreadsheetApi';

let isResizing = false;

class MultiplePeriodsSummaryModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            table: null
        }

    }
    componentDidMount() {
        this.getTable(this.props.reportId)
    }

    async getTable(id) {
        const postData = {
            reportId: id,
            pageParam: this.props.pageParams,
            periodList: this.props.periodList.sort((a, b) => a - b)
        };

        axios.post(`${isHttpPublic}excel/getAggQueryData`, postData).then((response) => {
            const data = response.data.data;
            const json = JSON.parse(data.content);
            const { fixedMap, fixedMapOrigin } = JSON.parse(data.data).fixedMapOrigin;
            let table = SpreadsheetUtil.jsonToTable(json, data.analysis_module_id);
            for (let i = 0, j = table.present.tableRows.length; i < j; i++) {
                let row = table.present.tableRows[i];
                for (let m = 0, n = row.length; m < n; m++) {
                    if (row[m].id) {
                        row[m].textBox.value = fixedMap[row[m].id];
                    }
                }
            }

            const { rowProps } = table.present;
            const heights = [...table.present.heights];
            for (let i = 0; i < rowProps.length; i++) {
                const rowProp = rowProps[i];
                if (rowProp.isHidden) heights[i] = 0;
            }
            table.present.heights = heights;

            const { colProps } = table.present;
            const widths = [...table.present.widths];
            for (let i = 0; i < colProps.length; i++) {
                const colProp = colProps[i];
                if (colProp.isHidden) widths[i] = 0;
            }
            table.present.widths = widths;
            const { periodListData, pageParams: { periodType }, periodList } = this.props;
            const periods = periodListData[periodType].filter(item => (periodList.some(period => period === item.value)));
            const detail = `【${periods.map(item => item.text).join('、')}】`;

            this.setState({ table: table.present, fixedMapOrigin, periods, detail, exportExcelData: data.data }, () => {
                Object.getOwnPropertyNames(this.state.table).forEach((name) => {
                    const prop = this.state.table[name];
                    if (typeof prop === 'function') {
                        this.bind(prop, 'actions', name);
                    }
                });
            })
        })

    }
    getRowHeaderWidth() {
        const { table } = this.state;
        if (!table) return;
        let rowHeaderWidth = 30;
        const numLength = table.heights.length.toString().length;
        if (numLength > 3) {
            rowHeaderWidth += (numLength - 3) * 7;
        }
        return rowHeaderWidth;
    }
    renderRowHeader(index) {
        const { rowProps } = this.state.table;
        let extra;
        // 浮动行标志
        if (rowProps && rowProps[index]) {
            let type;
            if (rowProps[index].rowType === 'float') {
                type = 'edit';
            } else if (rowProps[index].rowType === 'expand') {
                type = 'bars';
            }
            else if (rowProps[index].hasOwnProperty('attachmentInfo')) {
                if (rowProps[index].attachmentInfo.List.length > 0) {
                    type = 'paper-clip';
                }
            }
            if (type) {
                extra = (
                    <div className='spreadsheet-little-icon' style={{
                        position: "absolute",
                        right: 0, top: 0,
                        fontSize: 10,
                        fontFamily: 'SimSun',
                        color: 'gray',
                        lineHeight: '12px',
                        padding: '0 0',
                    }}><Icon type={type} /></div>
                );
            }
        }
        return (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                {index + 1}
                {extra}
            </div>
        );
    }
    lazyLoad = () => {
        this.setState(state => {
            const { table } = this.state;
            if (!table) return;
            const renderRange = getRenderRange(this.grid, this.refs.newCanvas, table.widths, table.heights);
            if (!renderRange) {
                return;
            }
            if (!isRangeEqual(state.renderRange, renderRange)) {
                return { renderRange };
            }
        });
    }
    handleGridLoad = (grid) => {
        const elementResizeDetectorMaker = require('element-resize-detector');
        const erd = elementResizeDetectorMaker();
        const that = this;
        erd.listenTo(grid, (element) => {
            that.lazyLoad();
        });
        this.grid = grid;
    }
    renderCellContent = (cellProps) => {
        return (
            <PreviewCell dbClick={this.doubleClick} {...cellProps} table={this.state.table} />
        );
    }
    handleMouseSelectStart = (row, col, e) => {
        this.numbers = addressConverter.columnNumberToName(col + 1) + (row + 1);
        this.actions.selectCell(row, col, e.ctrlKey);
    }
    bind = (producer, category, name) => {
        if (!this[category]) {
            this[category] = {};
        }
        this[category][name] = (...args) => {
            let table;
            try {
                table = produce(this.state.table, (draft) => {
                    producer.apply(draft, args);

                });
            } catch (ex) {
                Message.warning(ex.message);
                return;
            }
            this.setState({ table }, () => {
                if (name == 'selectCell') {
                    this.setParentSelectTextBox();
                }
            });
        };
    }
    formatString = (num) => {
        return (num + '').replace(/(\d{1,3})(?=(\d{3})+(?:$|\.))/g, '$1,');
    }
    setParentSelectTextBox = () => {
        const selection = this.state.table.getCurrentSelection();
        const textBox = this.state.table.tableRows[selection.top][selection.left];
        const indexId = textBox.id;
        const { periods } = this.state;
        const detail = indexId ? periods.map((item, index) => { return `${item.text}:【${this.formatString(this.state.fixedMapOrigin[indexId][index] || 0)}】` }).join('、') : `【${periods.map(item => item.text).join('、')}】`;
        this.setState({ detail });
    }
    getPrintJson = () => {
        const printSheet = produce(this.state.table, draft => {
            const { tableRows } = draft;
            for (let i = 0; i < tableRows.length; i++) {
                const row = tableRows[i];
                for (let j = 0; j < row.length; j++) {
                    const cell = row[j];
                    cell.textBox.expression = undefined;
                    cell.id = undefined;
                    cell.isUserIndex = undefined;
                }
            }
        });
        return SpreadsheetUtil.tableToJson([{ present: printSheet }]);
    }
    print = () => {
        const config = {
            "PrintScheme": {
                "PageSet": {
                    "PageKind": 'A4',
                    "PageHeight": 2970,
                    "PageWidth": 2100,
                    "Landscape": true,
                    "PageMargin": {
                        "Left": 100,
                        "Right": 100,
                        "Top": 100,
                        "Bottom": 100,
                    }
                },
                "Order": 1,
                HorizionalToOne: false,
                VerticalToOne: false,
                "HavePage": false
            }
        };
        const param = { excel: this.getPrintJson(), data: undefined, config: JSON.stringify(config), reportId: this.props.reportId };
        directlyPrintExcel(param).then(data => {
            var iframe = document.getElementById('spreadsheetPrintIframe');
            if (!iframe) {
                iframe = document.createElement('iframe');
                iframe.id = 'spreadsheetPrintIframe';
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
            }
            iframe.src = `${isHttpPublic}excel/previewPDF?filePath=` + encodeURIComponent(data);
            iframe.onload = function () {
                setTimeout(function () {
                    iframe.focus();
                    iframe.contentWindow.print();
                }, 5);
            };

        }).catch(err => {
            console.log(err);
            Message.error('调用打印接口失败');
        });
    }
    handleColumnResizing = (...args) => {
        isResizing = true;
        this.actions.columnResizing(...args);
    };
    handleColumnResized = () => {
        isResizing = false;
        this.actions.columnResized();
    }
    handleRowResizing = (...args) => {
        isResizing = true;
        this.actions.rowResizing(...args);
    };
    handleRowResized = () => {
        isResizing = false;
        this.actions.rowResized();
    };
    exportExcel = async () => {
        const postData = {
            reportId: this.props.reportId,
            data: this.state.exportExcelData
        };
        axios.post(`${isHttpPublic}excel/exportAggQueryData`, postData, { responseType: 'blob' }).then((response) => {
            let blob = new Blob([response.data])
            if ('download' in document.createElement('a')) { // 不是IE浏览器
                let url = window.URL.createObjectURL(blob);
                let link = document.createElement('a');
                link.style.display = 'none';
                link.href = url;
                link.setAttribute('download', `${this.props.reportName}多期汇总查询.xlsx`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else { // IE 10+
                window.navigator.msSaveBlob(blob, `${this.props.reportName}多期汇总查询.xlsx`);
            }
        });
    }
    render() {
        const { table, renderRange } = this.state;
        const { acctYear, period } = this.props.pageParams;
        const rowHeaderWidth = this.getRowHeaderWidth();
        const width = table && table.widths.reduce((sum, item) => {
            return item + sum;
        }, 1);
        return (
            <Modal
                visible={true}
                title={`${this.props.reportName}（汇总查询）`}
                wrapClassName="bi"
                maskClosable={false}
                footer={null}
                width="100%"
                style={{ height: '100%' }}
                onCancel={this.props.cancel}
            >
                <div style={{ paddingBottom: 16, height: 'calc(100vh - 56px)' }}>
                    <Button onClick={this.print} style={{ marginLeft: 8 }}>打印</Button>
                    <Button onClick={this.exportExcel} style={{ marginLeft: 8 }}>导出</Button>
                    <p style={{ paddingTop: 8 }}>汇总数据来源：{this.state.detail}</p>
                    <div style={{ paddingTop: 8, height: 'calc(100% - 61px)' }}>
                        {
                            table ?
                                <div style={{ height: '100%' }}>
                                    <div ref='newCanvas' style={{ maxHeight: '100%', height: '100%', overflow: 'auto', position: 'relative', width: '100%' }} onScroll={this.lazyLoad}>
                                        <div className="table-content" style={{
                                            borderWidth: 0,
                                            left: `${table.position.x}px`,
                                            top: `${table.position.y}px`,
                                            width: width + 51
                                        }}>
                                            <EditGrid

                                                tableRows={table.tableRows}
                                                widths={table.widths}
                                                heights={table.heights}
                                                onLoad={this.handleGridLoad}
                                                editingCell={table.editingCell}
                                                renderCellContent={this.renderCellContent}
                                                renderRange={this.state.renderRange}
                                                onMouseSelectStart={this.handleMouseSelectStart}
                                                selectedRanges={table.selectedRanges}
                                                left={rowHeaderWidth}
                                                mark={table.mark}
                                                animateSelection={isResizing}
                                            />
                                            <div
                                                id="table-handle"
                                                style={{ width: `${rowHeaderWidth}px` }}
                                                className="table-block"
                                            />
                                            <ColumnHeader
                                                left={rowHeaderWidth}
                                                widths={table.widths}
                                                selectedRanges={table.selectedRanges}
                                                renderContent={index => addressConverter.columnNumberToName(index + 1)}
                                                renderRange={renderRange}
                                                selectColumn={() => false}
                                                onColumnResizing={this.handleColumnResizing}
                                                onColumnResized={this.handleColumnResized}
                                            />
                                            <RowHeader
                                                width={rowHeaderWidth}
                                                heights={table.heights}
                                                selectedRanges={table.selectedRanges}
                                                rowProps={table.rowProps}
                                                renderContent={this.renderRowHeader.bind(this)}
                                                renderRange={renderRange}
                                                selectRow={() => false}
                                                onRowResizing={this.handleRowResizing}
                                                onRowResized={this.handleRowResized}
                                            />
                                        </div></div>
                                </div>
                                :
                                null
                        }
                    </div>
                </div>
            </Modal>
        );
    }
}

export default connect()(MultiplePeriodsSummaryModal);