import React from 'react';
import Table from 'components/ViewTable/Table';
import NetUitl from 'containers/HttpUtil';
import TableManagerBase from '../TableManagerBase';
import Matri2xUtil from '../matrix2/matrix2Utils';
import PropertyUtils from '../PropertyUtils';
import { conversBgColor } from '../table/tableConversionFn';
import Message from 'public/Message';
let mId;
let copyArr = []
class Matrix2Manager extends TableManagerBase {
  getTableWidth () {
    return '100%';
  }
  getActualTableWidths () {
    const id = this.view.props.liId;
    let tableWidth;
    if (this.tableWidth < $(`#${id} `).width()) {
      tableWidth = $(`#${id} `).width();

    } else {
      tableWidth = this.tableWidth;
    }
    return { tableWidth };
  }
  setRenderAndGetWidth (headers, data, pageStartRowIndex, tableProperty, textbox = [], pics = [], size = []) {
    const that = this.view;
    let width = 0;
    for (var ix = 0; ix < headers.length; ix++) {
      let header = headers[ix];
      const style = {};
      if (!tableProperty.isReport && tableProperty.tableStyleColor) {
        style.backgroundColor = tableProperty.tableStyleColor;
        style.borderColor = conversBgColor(tableProperty.tableStyleColor, 0.5);
        if (tableProperty.tableStyle === 'simpleV' || tableProperty.tableStyle === 'default') {
          style.borderColor = 'rgba(0,0,0,.2)';
        }

      }
      let headerTextBox = textbox[header.i[2]] || {};
      header.currentTextBox = headerTextBox;
      if (headerTextBox.Id) {
        mId = headerTextBox.Id

      }



      style.height = size[header.i[0]] + 'px'
      header.style = { ...Matri2xUtil.getStyleFromTextBox(headerTextBox || {}), ...header.style, cursor: header.action ? 'pointer' : 'auto', ...style };

      header.onHeaderCell = (r, c) => {
        return {
          onClick: (e) => {
            header.action && that.props.clickHandler(
              header.action.record,
              '',
              { ...header.action.action });
          }
        }
      }
      if (header.children) {
        width += this.setRenderAndGetWidth(header.children, data, pageStartRowIndex, tableProperty, textbox, pics, size);
      } else {

        let textBoxWidth = size[header.i[1]] || 110
        console.log(headerTextBox)
        if (that.state.printInfo) {

          if (mId === that.state.printInfo.i) {
            textBoxWidth += that.state.printInfo.distanceX
            // size[header.i[1]] = textBoxWidth
            // &&(copyArr[header.i[1]] == size[header.i[1]])
          }

        }

        width += textBoxWidth;
        header.width = textBoxWidth;


        header.render = (text, record, index) => {
          const row = record.r;
          const ci = header.dataIndex;
          let vCell = row[ci];
          if (!vCell) {
            return {
              props: {
                colSpan: 0,
              },
            };
          }
          vCell = { ...vCell, sr: vCell.sr || pageStartRowIndex + index };
          let vCellTextBox = textbox[vCell.i[2]];
          vCell.textBox = vCellTextBox

          if (vCell.sr !== pageStartRowIndex + index) {
            if (index !== 0) {
              return {
                props: {
                  colSpan: 0,
                },
              };
            }
          }
          let rowSpan = vCell.rowSpan || 1;
          if (vCell.sr < pageStartRowIndex) {
            rowSpan = rowSpan - pageStartRowIndex + vCell.sr;
            if (rowSpan > data.length) {
              rowSpan = data.length;
            }
          } else if (rowSpan + vCell.sr > data.length + pageStartRowIndex) {
            rowSpan = data.length + pageStartRowIndex - vCell.sr;
          }

          const fmt = vCell.textBox && vCell.textBox.formatObject;
          const v = fmt ? PropertyUtils.conversionFormat(vCell.v, fmt) : vCell.v;
          const newstyle = { ...Matri2xUtil.getStyleFromTextBox(vCell.textBox || {}), ...vCell.style || {} }
          newstyle.height = size[vCell.i[0]] + 'px';
          if (!newstyle.textAlign) {
            newstyle.textAlign = isNaN(vCell.v) ? 'left' : 'right';
          }
          if (!tableProperty.isReport && (tableProperty.tableStyle == 'default' || tableProperty.tableStyle == 'crosswise') && (index % 2 === 0) && rowSpan == 1) {
            if (!newstyle.backgroundColor || newstyle.backgroundColor == 'transparent') {
              newstyle.backgroundColor = conversBgColor(tableProperty.tableStyleColor)

            }

          }
          if (!tableProperty.isReport && tableProperty.tableStyleColor) {
            newstyle.borderColor = conversBgColor(tableProperty.tableStyleColor, 0.5);
            if (tableProperty.tableStyle == 'crosswise') {
              if (ix != headers.length - 1) {
                newstyle.borderColor = 'transparent';
              } else {
                newstyle.borderBottomColor = 'transparent';
              }
            }
            if (tableProperty.tableStyle == 'level') {
              if (ix != headers.length - 1) {
                newstyle.borderRightColor = 'transparent';
              }
            }
          }


          const pi = vCell.i[3];
          const warningPictures = pics[pi] && (<img
            src={pics[pi]}
            style={{
              float: pics[pi] || 'left',
              width: '20px',
              height: '20px',
              marginLeft: (vCell.v === '' ? 'calc(50% - 10px)' : '0px'),
            }}
            alt={'警告图片'}
          />);
          return {
            props: {
              style: newstyle,
              colSpan: vCell.colSpan,
              rowSpan,

            },

            children: (<div
              onClick={() => {
                vCell.action && that.props.clickHandler(
                  vCell.action.record,
                  '',
                  { ...vCell.action.action });
              }} style={vCell.action ? {
                cursor: 'pointer', overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              } : {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
            >
              {warningPictures}
              {v}
            </div>),
          };
        };
      }
    }
    return width;
  }
  getTable () {
    const that = this.view;
    const model = that.props.model;
    const { current } = that.state;
    const tableProperty = model.tableProperty || { adaptive: model.adaptive };
    const conditions = that.props.conditions;
    let params = {};
    if (conditions instanceof Array) {
      conditions.forEach((item) => {
        let conditionValue = item.values || '';
        if (item.operation == "range_all" && typeof conditionValue == 'string') {
          conditionValue = conditionValue.replace(',', '至')
        }
        params[item.aliasName || item.fieldName] = conditionValue;
        if (item.selectedName) {
          params[(item.aliasName || item.fieldName) + '_displayName'] = item.selectedName
        }
      })
    }
    this.params = params;


    const pagination = model.isPaging === false ? false : {
      size: 'small',
      current,
      simple: true,
      pageSize: that.dataSet.pageSize || model.pageSize,
      total: that.state.total,
    };
    const columns = that.state.data.header;

    const pageStartRowIndex = (current - 1) * model.pageSize;
    let newstyleColor = {}
    if (!model.isReport) {
      newstyleColor = {
        tableStyle: model.tableStyle,
        tableStyleColor: model.tableStyleColor,
        isReport: model.isReport
      }
    }
    copyArr = that.state.data.size.slice()
    const tableWidth = this.setRenderAndGetWidth(columns, that.state.data.rows, pageStartRowIndex, newstyleColor, that.state.data.textbox, that.state.data.pics, that.state.data.size);
    this.tableWidth = tableWidth;
    if (that.props.containerType === 'dashboard') {
      if (!that.printTemplateList.length) {
        that.setPrintTemplateList([], 0);
      }
    }
    const scrollConfig = {};
    let h = model.heights.slice(0, model.corner.length).reduce((current, next) => {
      return current + parseInt(next);
    }, 0);
    const pageHeight = !model.isPaging ? 0 : 40;
    const headHeight = (that.HeadData.isShow ? that.HeadData.height : 0);
    const footHeight = (that.footData.isShow ? that.footData.height : 0);
    let padding = 0;
    if (that.props.view.style && that.props.view.style.padding) {
      padding = parseInt(that.props.view.style.padding) * 2
    }
    let linkageH = this.view.props.linkage ? 48 : 0
    scrollConfig.y = that.props.view.offsetHeight - padding - pageHeight - h - 10 - headHeight - footHeight - linkageH;
    console.log(that.props.view.offsetHeight, pageHeight, h, headHeight, footHeight)
    return (<Table
      key={`m2.${current}`}
      className={'tablePad'}
      fixed={that.props.fixed}
      tableWidth={tableWidth}
      columns={columns}
      pagination={pagination}
      onChange={that.handleTableChange}
      tableProperty={tableProperty || {}}
      scroll={scrollConfig}
      // scroll={model.fixedColumn ? scrollConfig : {}}
      dataSource={that.state.data.rows.map((row, idx) => ({ r: row, key: idx }))}
      headOrFoot={{ height: 0 }}
      bordered
      // tableProperty={tableProperty}
      // dashboard={{ containerType: that.props.containerType, rowsHeight: null }}
      tableType={'matrix1'}
      scrollLeft={that.state.scrollLeft}
      liId={this.view.props.liId}
      view={this.view.props.view}
      linkage={this.view.props.linkage}
      setTableWidthsTag={that.setTableWidthsTag.bind(that)}
    />);
  }
  getState (data, pageIndex) {
    // let num = data.header.length * data.rows.length;
    // let sumNum = 35000;
    // if (num > sumNum) {
    //   Message.warning('二维表数据过大,未完全展示,请设置查询条件', 100, 12)
    //   let col = parseInt(sumNum / data.rows.length);
    //   data.header = data.header.slice(0, col);
    // }
    return {
      data,
      total: data.totalCount,
      current: pageIndex,
    };
  }
  refreshTable (dataSet, model, conditions, pageIndex = 1, sortExpressions = [], userCase) {
    const that = this.view;

    const url = 'tables/getDataByMatrix2Json';
    const par = {
      tableJSON: JSON.stringify({ ...model, conditions }),
      pageIndex,
      userCase
    };
    NetUitl.post(url, par, (d) => {
      if (d.code === 200) {
        that.setState(this.getState(d.data, pageIndex));
      } else {
        that.setState({ data: 'error', errorMessage: d.msg });
      }
    }, (d) => {
      that.setState({ data: 'error', errorMessage: d });
    });
  }
}

export default Matrix2Manager;
