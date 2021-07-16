import React, { Component, PureComponent } from 'react';
import { getSelectedRows } from 'model/ReportModel/EditGridModel';
import { Icon } from '@vadp/ui';

let rowLine = { drag: false };
let header = { drag: false };

export default class extends PureComponent {
    componentDidMount() {
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mouseup', this.handleMouseUp);
    }
    componentWillUnmount() {
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('mouseup', this.handleMouseUp);
    }

    rowLineMouseDown = (e) => {
        if (!e.target) {
            return;
        }
        rowLine.drag = true;
        rowLine.positionY = e.pageY;
        rowLine.coordinateX = e.target.parentNode.getAttribute('data-index');
        rowLine.role = e.target.parentNode.getAttribute('data-role');
        rowLine.height = this.props.heights[rowLine.coordinateX];
    };

    handleMouseMove = (e) => {
        if (rowLine.drag) {
            let newPositionY = e.pageY;
            let distanceY = newPositionY - rowLine.positionY;
            let coordinateX = parseInt(rowLine.coordinateX, 10);
            this.props.onRowResizing(coordinateX, rowLine.height + distanceY);
        } else if (header.drag) {
            let { heights } = this.props;
            // 相对于容器的位置
            let offsetY = e.clientY - header.rootTop;
            let target = 0;
            let sum = heights[0];
            while (sum < offsetY && target < heights.length - 1) {
                target++;
                sum += heights[target];
            }
            if (target !== header.target) {
                header.target = target;

                this.props.selectRowRange(header.start, target);
            }
        }
    };
    handleMouseUp = (e) => {
        if (rowLine.drag) {
            rowLine.drag = false;
            this.props.onRowResized();
        }
        header.drag = false;
    };

    cellSelectByRows = (index, ev) => {
        console.log(ev.target.nodeName)
        if (ev.target.nodeName === 'SPAN') {
            return;
        }
        if (ev.button === 2) {
            // 选中行点右键不重新选择
            if (!getSelectedRows(this.props.selectedRanges).has(index)) {
                this.props.selectRow(index);
            }
            return;
        }
        this.props.selectRow(index, ev.ctrlKey);
        header.drag = true;
        header.start = index;
        header.target = index;
        header.rootTop = this.refs.root.getBoundingClientRect().top;
    };

    render() {
        const { heights, width, renderContent, selectedRanges, rowProps } = this.props;
        const renderRange = this.props.renderRange || { top: 0, bottom: heights.length - 1 };
        const selectedHeaders = getSelectedRows(selectedRanges);
        let upHeight = 0; // 可见区域上边的高度
        let downHeight = 0;
        const elements = [];
        for (let index = 0; index < heights.length; index++) {
            const height = heights[index];
            if (index < renderRange.top) {
                upHeight += height;
            } else if (index > renderRange.bottom) {
                downHeight += height;
            } else {
                let style = {
                    height: height + 'px',
                    lineHeight: height + 'px',
                    cursor: 'pointer'
                };
                if (height === 0) {
                    style.display = 'none';
                }
                let className = "row-margin";
                selectedHeaders.has(index) && (className += ' selected-table-header');
                let attachmentDescription = '';
                const attachmentInfo = rowProps && rowProps[index] && rowProps[index].attachmentInfo;
                if (attachmentInfo !== undefined) {
                    if (attachmentInfo.hasOwnProperty('List'))
                        attachmentDescription = '附件：' + attachmentInfo.List.length;
                }

                elements.push(
                    <div className={className} title={attachmentDescription}
                         key={index}
                         data-index={index}
                         onMouseDown={this.cellSelectByRows.bind(this, index)}
                         style={style}>
                        {/* {attachmentDescription != "" ? icon : null} */}
                        {renderContent ? renderContent(index) : index + 1}
                        <span
                            onMouseDown={this.rowLineMouseDown}
                            className="row-line"></span></div>
                );
            }
        }
        return (
            <div
                id="table-rows"
                style={{
                    width: `${width || 30}px`,
                    paddingTop: upHeight,
                    paddingBottom: downHeight,
                }}
                className="row-block"
                ref='root'>
                {elements}
            </div>
        );
    }
}
