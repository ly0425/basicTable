import React from 'react';
import NetUitl from 'containers/HttpUtil';
import { getDefaultColor } from 'components/Print/color';
import Table from 'components/ViewTable/Table';
import convert from './MatrixConvertServer';
import TableManagerBase from '../TableManagerBase';
import PropertyUtils from '../PropertyUtils';
import { conversBgColor } from '../table/tableConversionFn';
class MatrixManager extends TableManagerBase {
  getTableWidth = () => {
    return this.config.tableWidth || 0;
  }
  getActualTableWidths = () => {
    const id = this.view.props.liId;
    const cb = (total, currentValue) => {
      return total + currentValue;
    };
    let tableWidth = this.getTableWidth();
    let allWidths = this.config.tableWidthList || [];
    if (tableWidth < $(`#${id} `).width()) {
      const multiple = parseFloat((($(`#${id} `).width() - 33) / tableWidth).toFixed(2));
      let ColumnsCol = [];
      for (let i = 0; i < allWidths.length; i++) {
        ColumnsCol.push(
          parseInt(allWidths[i] * multiple)
        )
      }
      const newTableWidth = ColumnsCol.reduce((total, currentValue, currentIndex) => {
        return (currentIndex !== ColumnsCol.length - 1) ? total + currentValue : total + 0;
      }, 0)
      ColumnsCol[ColumnsCol.length - 1] = $(`#${id} `).width() - 34 - newTableWidth - 8;
      tableWidth = ColumnsCol.reduce(cb, 0);
      allWidths = ColumnsCol;
    }
    return {
      tableWidthList: allWidths,
      tableWidth
    }
  }
  getTable = () => {
    const that = this.view;
    const model = that.props.model;
    const conditions = that.props.conditions;
    if (model.columnGroup.length === 0
      || model.rowGroup.length === 0
      || model.seriesGroup.length === 0) {
      return '模型不完整，不能预览。';
    }
    if (that.props.containerType === 'dashboard'){
      if (!that.printTemplateList.length) {
        that.setPrintTemplateList([],0);
      }
    }
    const { rowGroup, columnGroup, seriesGroup, tableWidth } = model;
    const handleCellClick = (record, ev, column) => {
      if (that.props.clickHandler) {
        let columnName;
        const rc = {};
        let action = {};
        if (column.valueField) {
          columnName = column.valueField;
          const series = seriesGroup.filter(s => s.fieldName === columnName);
          if (series.length > 0) {
            action = series[0].body.action;
          }
          rowGroup.forEach((r, i) => {
            const v = record[`${r.fieldName}$${i}`];
            if (v !== rowGroup[i].sumHeaderText) {
              rc[r.fieldName] = v;
            }
          });
          rc[columnName] = record[column.dataIndex];
          const colValues = column.dataIndex.split('$area$');
          for (let i = 0; i < colValues.length - 2; i += 1) {
            rc[columnGroup[i].fieldName] = colValues[i];
          }
        } else {

          columnName = column.dataIndex.substr(0, column.dataIndex.indexOf('$'));
          const colIndex = Number(column.dataIndex.substr(column.dataIndex.indexOf('$') + 1));
          action = rowGroup[colIndex].body.action;
          for (let i = 0; i <= colIndex; i += 1) {
            const r = rowGroup[i];
            rc[r.fieldName] = record[`${r.fieldName}$${i}`];
          }
        }
        if (!that.props.tableProperty.summaryAction) {
          if (record.$$aggregation$$ === 1) {
            return;
          }
          if (columnGroup.length === 1) {
            if (column.key.split('$area$').length !== 3) {
              return;
            }
          } else if (columnGroup.length > 1) {
            if (column.key.split('$area$').length !== 4) {
              return;
            }
          }
        }

        that.props.clickHandler(rc, columnName, action, conditions);
      }
    };


    this.config = convert(rowGroup, columnGroup, seriesGroup, that.state.data, handleCellClick, that.props, this);

    const rowSpanMap = new Map();
    for (let i = 0; i < rowGroup.length; i += 1) {
      rowSpanMap.set(i, []);
    }

    const mapData = (source) => {
      const lastValues = new Map();
      rowGroup.forEach((item, i) => {
        lastValues.set(i, null);
      });
      source.forEach((row, index) => {
        for (let i = 0; i < rowGroup.length; i += 1) {
          const item = rowGroup[i];
          const lv = lastValues.get(i);
          const v = row[`${item.fieldName}$${i}`];
          if (lv !== v) {
            for (let j = i; j < rowGroup.length; j += 1) {
              const spanMapItem = rowSpanMap.get(j);
              spanMapItem.push({ row: index, span: 1 });
            }
            lastValues.set(i, v);
            for (let j = i + 1; j < rowGroup.length; j += 1) {
              lastValues.set(j, row[`${rowGroup[j].fieldName}$${j}`]);
            }
            break;
          } else {
            const spanMapItem = rowSpanMap.get(i);
            const tmp = spanMapItem[spanMapItem.length - 1];
            if (tmp) {
              tmp.span += 1;
            }
          }
        }
      });
    };

    const columns = this.config.columns;
    
    const data = this.config.data;
    mapData(this.config.data, 0);
    const tableProperty = that.props.tableProperty
    const renderCallback = (i,r,index) => {
      return (value, row, index) => {
        let action = rowGroup[i].body.action;
        const style = { ...rowGroup[i].body.style, whiteSpace: 'pre-wrap', wordBreak: 'break-all', cursor: (action && action.targetObject && action.targetObject.length > 0) ? 'pointer' : '' };
        // if (!style.color) {
        //   style.color = getDefaultColor();
        // }
        // style.color = 'red'
        if (tableProperty.isBorder !== undefined) {
          if ((tableProperty.isBorder === 'no') || (tableProperty.isBorder === 'contentNo')) {
            style.border = 'none';
          }
        }
        const bg = {}
        if (!tableProperty.isReport&&((index % 2) === 0) && (tableProperty.tableStyle == 'default' || tableProperty.tableStyle == 'crosswise')) {
        
          bg.backgroundColor = conversBgColor(tableProperty.tableStyleColor)
        }
        if (!tableProperty.isReport&&tableProperty.tableStyleColor) {
          bg.borderColor = conversBgColor(tableProperty.tableStyleColor, 0.5);
          if (tableProperty.tableStyle == 'crosswise') {
              bg.borderColor = 'transparent';
          }
          if (tableProperty.tableStyle == 'level') {
              bg.borderRightColor = 'transparent';
          }
        }
        if (!style.textAlign) {
          style.textAlign = isNaN(value) ? 'left' : 'right';
        }
        
        const obj = {
          children: PropertyUtils.conversionFormat(value, rowGroup[i].body.formatObject),
        };
        const prop = { style:{...style,...bg} };
        if (rowSpanMap.has(i)) {
          const arr = rowSpanMap.get(i);
          const item = arr.find(n => n.row === index);
          if (item) {
            prop.rowSpan = item.span;
          } else {
            prop.rowSpan = 0;
          }
        }
        obj.props = prop;
        return obj;
      };
    };

    for (let i = 0; i < rowGroup.length; i += 1) {
      columns[i].render = renderCallback(i);
    }

    // const scrollConfig = { x: config.tableWidth };

    let h = columnGroup.reduce((current, next) => {
      return current + next.height;
    }, 0);

    if (seriesGroup.length > 1) {
      h += seriesGroup[0].header.height;
    }
    const scrollConfig = {};
    const pageHeight = !tableProperty.isPaging ? 0 : 40;
    const headHeight = (that.HeadData.isShow ? that.HeadData.height : 0);
    const footHeight = (that.footData.isShow ? that.footData.height : 0);
    let isDashboard = this.view.props.liId ? 32 : 0;
    scrollConfig.y = that.props.view.offsetHeight - pageHeight - h - 10 - headHeight - footHeight - 23;//减去边距 分页高 表未高 表头高 标题高 最外层高185

    const fixedColumn = that.props.tableProperty ? that.props.tableProperty.fixedColumn : null;

    const paginationConditions = {
      current: that.state.current,
      size: 'small',
      simple: true,
      pageSize: that.dataSet.pageSize,
      total: that.state.total,
    };

    return (
      <Table
        key={`m.${that.state.current}`}
        className={'tablePad'}
        fixed={that.props.fixed}
        tableWidth={this.config.tableWidth}
        columns={columns}
        pagination={(tableProperty.isPaging !== false) ? paginationConditions : false}
        onChange={that.handleTableChange}
        // scroll={scrollConfig}
        scroll={fixedColumn ? scrollConfig : {}}
        dataSource={data}
        headOrFoot={{ height: headHeight + footHeight }}
        bordered
        tableProperty={tableProperty}
        dashboard={{ containerType: that.props.containerType, rowsHeight: 0, tableHeadheight: h }}
        liId={this.view.props.liId}
        tableType={'matrix'}
        rowGroupLength={rowGroup.length}
        view={this.view.props.view}
        scrollLeft={that.state.scrollLeft}
      />);
  }

  getState(data, pageIndex) {
    return {
      current: pageIndex,
      data,
      total: data.total,
    };
  }

  refreshTable = (tableProperty, model, conditions, pageIndex = 1) => {
    const that = this;
    const pageSize = tableProperty && tableProperty.pageSize ?
      Number(tableProperty.pageSize) : 100;
    const isPaging = tableProperty.isPaging !== false;

    if (model.columnGroup.length === 0
      || model.rowGroup.length === 0
      || model.seriesGroup.length === 0) {
      return;
    }
    const url = 'tables/getDataByMatrixJson';
    const par = {
      matrixDesc: {
        rowGroup: model.rowGroup.map(r => ({
          fieldName: r.fieldName,
          header: r.header.text,
          expression: r.body.text,
          hasSum: r.hasSum,
          groupOrder: r.groupOrder,
        })),
        columnGroup: model.columnGroup.map(c => ({
          fieldName: c.fieldName,
          header: c.fieldName,
          expression: c.text,
          hasSum: c.hasSum,
          groupOrder: c.groupOrder,
        })),
        seriesGroup: model.seriesGroup.map(s => ({
          fieldName: s.fieldName,
          header: s.header.text,
          expression: s.body.text,
        })),
        analysisModelId: tableProperty.analysisModelId,
      },
      pageIndex,
      pageSize,
      isPaging,
    };
    if (conditions && conditions.length > 0) {
      par.conditions = conditions;
    }
    NetUitl.post(url, par, (d) => {
      if (d.code === 200) {
        that.view.setState(this.getState(d.data, pageIndex));
      } else {
        that.view.setState({ data: 'error', errorMessage: d.msg });
      }
    }, () => {
      that.view.setState({ data: 'error', errorMessage: d.msg });
    });
  }
}

export default MatrixManager;
