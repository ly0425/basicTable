import React, { Component, PureComponent } from 'react';
import { getSelectedColumns } from 'model/ReportModel/EditGridModel';

let columnLine = { drag: false };
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
  cellSelectByColumns = (index, ev) => {
    if (ev.target.nodeName !== 'P') {
      return;
    }

    if (columnLine.drag === true) {
      return;
    }
    if (ev.button === 2) {
      // 选中行点右键不重新选择
      if (!getSelectedColumns(this.props.selectedRanges).has(index)) {
        this.props.selectColumn(index);
      }
      return;
    }
    this.props.selectColumn(index, ev.ctrlKey);
    header.drag = true;
    header.start = index;
    header.target = index;
    // 获取元素相对于浏览器可视范围的位置
    header.rootLeft = this.refs.root.getBoundingClientRect().left;
  };
  handleMouseOver = (e) => { };
  columnLineMouseDown = (index, e) => {
    if (!e.target) {
      return;
    }
    columnLine.drag = true;
    columnLine.positionX = e.pageX;
    columnLine.coordinateY = e.target.parentNode.getAttribute('data-index');
    columnLine.width = this.props.widths[columnLine.coordinateY];
  };

  handleMouseMove = e => {

    if (columnLine.drag) {
      let newPositionX = e.pageX;
      let distanceX = newPositionX - columnLine.positionX;
      let coordinateY = parseInt(columnLine.coordinateY, 10);
      this.props.onColumnResizing(coordinateY, columnLine.width + distanceX);
    } else if (header.drag) {
      let { widths } = this.props;
      // 相对于容器的位置
      let offsetX = e.clientX - header.rootLeft;
      let target = 0;
      let sum = widths[0];
      while (sum < offsetX && target < widths.length - 1) {
        target++;
        sum += widths[target];
      }
      if (target !== header.target) {
        header.target = target;
        this.props.selectColumnRange(header.start, target);
      }
    }
  };

  handleMouseUp = (e) => {
    if (columnLine.drag) {
      columnLine.drag = false;
      this.props.onColumnResized();
    }
    header.drag = false;
  };

  render() {
    const { widths, left, renderContent, selectedRanges } = this.props;
    const renderRange = this.props.renderRange || { left: 0, right: widths.length - 1 };
    const selectedHeaders = getSelectedColumns(selectedRanges);
    let leftWidth = 0; // 可见区域左侧的宽度
    let rightWidth = 0;
    const elements = [];
    for (let index = 0; index < widths.length; index++) {
      const width = widths[index];
      if (index < renderRange.left) {
        leftWidth += width;
      } else if (index > renderRange.right) {
        rightWidth += width;
      } else {
        const style = { width: width + 'px', cursor: 'pointer' };
        if (width === 0) {
          style.display = 'none';
        }
        let className = "row-margin";
        selectedHeaders.has(index) && (className += ' selected-table-header');
        elements.push(
          <p className={className}
            key={index}
            data-index={index}
            onMouseDown={this.cellSelectByColumns.bind(this, index)}
            onMouseOver={this.handleMouseOver}
            style={style}>
            {renderContent && renderContent(index)}
            <span
              onMouseDown={this.columnLineMouseDown.bind(this, index)}
              className="column-line"></span></p>
        );
      }
    }
    return (
      <div
        id="table-columns"
        style={{
          left: `${left || 30}px`,
          paddingLeft: leftWidth,
          paddingRight: rightWidth,
        }}
        className="column-block"
        ref='root'>
        {elements}
      </div>
    );
  }
}