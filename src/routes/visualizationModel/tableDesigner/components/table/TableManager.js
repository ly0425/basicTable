import React from 'react';
import { Tooltip } from '@vadp/ui';
import { getDefaultColor } from 'components/Print/color';
import Table from 'components/ViewTable/Table';
import NetUtil from 'containers/HttpUtil';
import TableManagerBase from '../TableManagerBase';
import PropertyUtils from '../PropertyUtils';
import DynamicTableUtils from '../DynamicTableUtils';
import produce from 'immer';
import Common from '../../../../../components/Print/Common';
import { targetSetStyle, parAggregationExp, variableToExps, specialFieldsparsing, conversFormatObject, clearAggregation, conversBgColor } from './tableConversionFn';


const groupNameTag = '__group$Name__';
const positionTag = '__position__';
const bgActive = 'bg_active';
const comm = new Common();

class TableManager extends TableManagerBase {
  generateAntdColumns (objTable, groupFields, mergeMap, footerData) {
    const that = this.view;
    const conditions = that.props.conditions;
    if (!objTable) {
      return;
    }
    let colIndex = 0;
    let params = {};
    let cornerSizeCol = objTable.cornerSize.columns;

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
    const tableColumns = [];
    let childCols = [];
    const fixedColumn = objTable.fixedColumn;
    const headerRow = objTable.tableRows[0];
    const detailGroup = objTable.rowGroups.find(g => g.expressions.length === 0);
    const tableProperty = that.props.model.tableProperty || {};

    const pageSize = parseInt(that.props.dataSet.pageSize);
    const total = that.state.current === 1 ? 0 : pageSize * (that.state.current - 1);
    const fixedIndex = objTable.columns.findIndex(item => item.fixed == 'left');
    const isRowNumberDrag = objTable.widths.length > objTable.columns.length ? 1 : 0;
    headerRow.forEach((cell, idx) => {
      if (idx < colIndex) {
        childCols[idx] = childCols[idx - 1];
      } else {
        const itemHeader = cell;
        colIndex += itemHeader.colspan;
        const headTitle = this.getExpressionValue(variableToExps(itemHeader.textBox.value, tableProperty.globalVariableList, footerData, this.view.props.dataSet.totalFields) || '', {}, params);


        const col = {
          title: headTitle.success ? PropertyUtils.conversionFormat(headTitle.value, conversFormatObject(itemHeader.textBox.formatObject)) : (<Tooltip title={'计算参数错误'}>
            <span style={{ color: 'red' }}>--</span>
          </Tooltip>),
          style: DynamicTableUtils.getStyleFromTextBox(itemHeader.textBox),
          width: objTable.widths[idx + isRowNumberDrag],
          rowSpan: itemHeader.rowspan,
          key: idx,
          id: comm.genId(),
          onHeaderCell: (record) => {
            return {
              onClick: (e) => {
                if (e.target.tagName === 'I') {
                  return false;
                }
                if (itemHeader.textBox.action && ((itemHeader.textBox.action.targetObject && itemHeader.textBox.action.targetObject.length > 0) || itemHeader.textBox.action.openUrl)) {
                  that.props.clickHandler.call(that, {}, '', itemHeader.textBox.action, conditions, headTitle.value)
                }
              }
            }
          }
        };
        // if (!col.style.color) {
        //   col.style.color = getDefaultColor();
        // }
        let headTextBoxFont = itemHeader.textBox.fontInfo || {};
        if (!headTextBoxFont.size) {
          delete col.style.fontSize;
        }


        col.style.height = `${objTable.heights[0]}px`;
        // col.style.lineHeight = `${objTable.heights[0]}px`;
        if (!tableProperty.isReport && tableProperty.tableStyleColor) {
          col.style.backgroundColor = tableProperty.tableStyleColor;
          col.style.borderColor = conversBgColor(tableProperty.tableStyleColor, 0.5);
          if (tableProperty.tableStyle === 'simpleV' || tableProperty.tableStyle === 'default') {
            col.style.borderColor = 'rgba(0,0,0,.2)';
          }
        }
        if (idx < fixedColumn) {
          col.fixed = 'left';
        }
        if (col.colSpan === 1) {
          delete col.colspan;
        }
        tableColumns.push(col);
        childCols[idx] = { col, rowIndex: 0 };
      }
    });
    let currentLevelCols = childCols;

    const tr = objTable.tableRows.slice(0, objTable.rowGroups[0].startRow);
    for (let r = 1; r < tr.length; r += 1) {
      colIndex = 0;
      childCols = [];
      const row = tr[r];
      row.forEach((item, idx) => { // eslint-disable-line no-loop-func
        if (idx < colIndex) {
          childCols[idx] = childCols[idx - 1];
        } else if (r < currentLevelCols[idx].rowIndex + currentLevelCols[idx].col.rowSpan) {
          childCols[idx] = currentLevelCols[idx];
          colIndex += 1;
        } else {
          colIndex += item.colspan;
          const titleMap = this.getExpressionValue(variableToExps(item.textBox.value, tableProperty.globalVariableList, footerData, this.view.props.dataSet.totalFields) || '', {}, params);
          const col = {
            title: titleMap.success ? PropertyUtils.conversionFormat(titleMap.value, conversFormatObject(item.textBox.formatObject)) : (<Tooltip title={'计算参数错误'}>
              <span style={{ color: 'red' }}>--</span>
            </Tooltip>),
            width: objTable.widths[idx + isRowNumberDrag],
            style: DynamicTableUtils.getStyleFromTextBox(item.textBox),
            rowSpan: item.rowspan,
            key: idx,
            id: comm.genId(),
            colShow: objTable.columns[idx].isShow,
            onHeaderCell: (record) => {
              return {
                onMouseEnter: (event) => {
                  const eventTarget = $(event.target);
                  if (eventTarget.hasClass('_active')) {
                    eventTarget.parents('table').find('thead tr th').eq(event.target.cellIndex).addClass(bgActive);
                    eventTarget.parents('table').find('tbody tr').each((n, item) => {
                      $(item).find('td').eq(event.target.cellIndex).addClass(bgActive);
                    })
                  }
                },
                onMouseLeave: (e) => {
                  $(e.target).parents('table').find(`.${bgActive}`).removeClass(bgActive);
                },
                onClick: (e) => {
                  if (e.target.tagName === 'I') {
                    return false;
                  }
                  if (item.textBox.action && ((item.textBox.action.targetObject && item.textBox.action.targetObject.length > 0) || item.textBox.action.openUrl)) {
                    that.props.clickHandler.call(that, {}, '', item.textBox.action, conditions, item.textBox.value)
                  }
                }
              }
            }
          };
          // if (!col.style.color) {
          //   col.style.color = getDefaultColor();
          // }
          let headTextBoxFont = item.textBox.fontInfo || {};
          if (!headTextBoxFont.size) {
            delete col.style.fontSize;
          }
          if (!tableProperty.isReport && tableProperty.tableStyleColor) {
            col.style.backgroundColor = tableProperty.tableStyleColor;
            col.style.borderColor = conversBgColor(tableProperty.tableStyleColor, 0.5);
            if (tableProperty.tableStyle === 'simpleV' || tableProperty.tableStyle === 'default') {
              col.style.borderColor = 'rgba(0,0,0,.2)';
            }

          }
          // if (fixedIndex != -1) {
          //   if (idx == rows.length - 1) {
          //     delete col.width;
          //   }
          // }
          // col.style.whiteSpace = 'pre-wrap';
          col.style.height = `${objTable.heights[r]}px`;
          // col.style.lineHeight = `${objTable.heights[r]}px`;
          if (col.colSpan === 1) {
            delete col.colSpan;
          }

          if (currentLevelCols[idx].col.children) {
            currentLevelCols[idx].col.children.push(col);
          } else {
            currentLevelCols[idx].col.children = [col];

          }
          if (currentLevelCols[idx].col.children.filter((current) => { return (!current.colShow && current.colShow != undefined) ? true : false }).length === currentLevelCols[idx].col.children.length) {
            currentLevelCols[idx].col.colShow = false;
          }
          if (currentLevelCols[idx].col.children.filter((current) => { return (current.fixed === 'left') ? true : false }).length === currentLevelCols[idx].col.children.length) {
            currentLevelCols[idx].col.fixed = 'left';
          }
          childCols[idx] = { col, rowIndex: r };
        }
      });
      currentLevelCols = childCols;
    }
    const columns = objTable.columns;

    for (let i = 0; i < columns.length; i += 1) {
      const c = currentLevelCols[i].col;
      // console.log(c)
      if (!c.children) {
        c.children = [];
      }
      let TableManagerThis = this;
      c.colShow = columns[i].isShow;
      if (columns[i].fixed) {
        c.fixed = columns[i].fixed;
      }
      c.style.cursor = 'Default';
      if (tableProperty.isBorder !== undefined && (tableProperty.isBorder === 'no')) {
        c.style.border = 'none';
      }
      TableManagerThis.setActionEvent(that.props.linkages, columns[i].fieldName, c, true);

      if (columns[i].isSort && (tableProperty.groupLevelField === '' || tableProperty.groupLevelField === undefined)) {

        let sortfieldName = '';
        if (columns[i].sortfieldName) {
          sortfieldName = columns[i].sortfieldName;
        } else {
          const index = objTable.rowGroups.length - 1;
          const groupInfo = objTable.rowGroups[index];
          const groupField = groupFields.find(g => g.name === groupInfo.name) || {};
          const expSet = groupField.headerExpressions || {};
          let cellTextbox;
          if (groupInfo.name == '详细信息') {
            sortfieldName = columns[i].sortfieldName;
          } else {
            if (objTable.tableRows[groupInfo.endRow][index].display) {
              cellTextbox = objTable.tableRows[groupInfo.endRow][i].textBox;
              sortfieldName = expSet[cellTextbox.id] || cellTextbox.value;
            } else {
              cellTextbox = objTable.tableRows[groupInfo.startRow][i].textBox;
              sortfieldName = expSet[cellTextboxid] || cellTextbox.value;
            }
          }
        }
        c.sortfieldName = sortfieldName;


        // c.filterMultiple=false;
        c.sorter = (e) => {
          return ''
        }
      }
      let childrenObj = {
        dataIndex: `${columns[i].fieldName}$$${i}`,
        width: objTable.widths[i + isRowNumberDrag],
        colSpan: 0,
        id: comm.genId(),
        onCell: (record) => {
          return {
            onMouseEnter: (e) => {
              const eventTarget = $(e.target);
              if (eventTarget.hasClass('line_active') || eventTarget.hasClass('All_active')) {
                eventTarget.parents('tr').addClass(bgActive);
                if (eventTarget.hasClass('All_active')) {
                  targetSetStyle(eventTarget, e.target);
                }
              } else if (eventTarget.hasClass('_active')) {
                targetSetStyle(eventTarget, e.target);
              }
            },
            onMouseLeave: (e) => {
              const eventTarget = $(e.target);
              if (eventTarget.hasClass('line_active') || eventTarget.hasClass('All_active') || eventTarget.hasClass('_active')) {
                eventTarget.parents('table').find('tr').removeClass(bgActive);
                eventTarget.parents('table').find('thead tr th').removeClass(bgActive);
                eventTarget.parents('table').find('tbody tr td').removeClass(bgActive);
              }
            }
          }
        },
        render: (text, record, index) => { // eslint-disable-line no-loop-func
          let value;
          const coIndex = i;
          let itemRow = null;
          let style;
          let colSpan = 0;
          const groupName = record[groupNameTag];
          let treeItemMap = {};

          if (groupName) {
            const groupInfo = objTable.rowGroups.find(r => r.name === groupName);
            if (groupInfo) {
              const rowIndex = record[positionTag] === 'p' ? groupInfo.startRow : groupInfo.endRow;
              if (index === 0 && coIndex < cornerSizeCol) {
                for (let k = rowIndex; k >= 0; k -= 1) {
                  if (objTable.tableRows[k][i].display === 1) {
                    itemRow = objTable.tableRows[k][i];
                    treeItemMap.itemRow = objTable.tableRows[k];
                    break;
                  }
                }
              } else {
                const groupRow = objTable.tableRows[rowIndex];
                itemRow = groupRow[coIndex];
              }
              colSpan = itemRow.display === 1 ? itemRow.colspan : 0;
              style = DynamicTableUtils.getStyleFromTextBox(itemRow.textBox);
              style.height = `${objTable.heights[rowIndex]}px`;
            }
            if (colSpan !== 0) {
              const groupField = groupFields.find(g => g.name === groupName);

              const cellId = itemRow.textBox.id;
              const expSet = record[positionTag] === 'p' ? groupField.headerExpressions : groupField.footerExpressions;


              treeItemMap.expSet = expSet;
              let expression;
              if (expSet[cellId]) {
                expression = expSet[cellId];
              } else {
                //给账簿报表做个处理
                expression = clearAggregation(itemRow.textBox.value || '');

              }
              if (expression && expression.indexOf('RowNumber()') != -1) {

                expression = expression.replace('RowNumber()', `RowNumber(${index + 1 + total})`);
              }
              expression = variableToExps(expression, tableProperty.globalVariableList, footerData, this.view.props.dataSet.totalFields);
              value = this.getExpressionValue(expression, record, params);

              if (!style.textAlign) {
                style.textAlign = isNaN(value.value) ? 'left' : 'right';
              }
            } else {
              style = {};
              value = '';
            }
          } else if (detailGroup) {

            let itemBody;
            if (index === 0 && i < objTable.cornerSize.columns) {
              for (let k = detailGroup.startRow; k >= 0; k -= 1) {
                if (objTable.tableRows[k][i].display === 1) {
                  itemBody = objTable.tableRows[k][i];
                  break;
                }
              }

            } else {
              itemBody = objTable.tableRows[detailGroup.startRow][i];
              let detailGroupExp = variableToExps(detailGroup.rowIsShowExpression, tableProperty.globalVariableList, footerData, this.view.props.dataSet.totalFields);
              const rowIsShow = this.getExpressionValue(detailGroupExp, record);
              if (rowIsShow.success && (rowIsShow.value == 'No' || rowIsShow.value == 'true')) {
                return { props: { colSpan: 0 } }
              }
            }
            itemRow = itemBody;
            if (!itemRow) {
              return { props: { rowSpan: 0 } }
            }

            let textBoxValue = itemBody.textBox.value;
            textBoxValue = specialFieldsparsing(textBoxValue, record)
            if (textBoxValue && textBoxValue.indexOf('RowNumber()') != -1) {
              // const total = that.state.current === 1 ? 0 : pageSize * (that.state.current - 1);
              textBoxValue = textBoxValue.replace('RowNumber()', `RowNumber(${index + 1 + total})`);
            }
            textBoxValue = variableToExps(textBoxValue, tableProperty.globalVariableList, footerData, this.view.props.dataSet.totalFields);
            value = this.getExpressionValue(textBoxValue || '', record, params);
            style = DynamicTableUtils.getStyleFromTextBox(itemBody.textBox);
            if (!style.textAlign) {
              style.textAlign = isNaN(value.value) ? 'left' : 'right';
            }
            style.height = `${objTable.heights[detailGroup.startRow]}px`;
            // style.lineHeight = `${objTable.heights[detailGroup.startRow] - 6}px`;
            colSpan = itemBody.display === 1 ? itemBody.colspan : 0;
          } else {
            style = {};
          }

          // if (!style.color) {
          //   style.color = getDefaultColor();
          // }
          // style.whiteSpace = 'pre-wrap';
          if (tableProperty.isBorder !== undefined) {
            if ((tableProperty.isBorder === 'no') || (tableProperty.isBorder === 'contentNo')) {
              style.border = 'none';
            }
          }

          if (itemRow) {
            let warningPictures = '';

            let rowSpan = 1;
            if (itemRow.display === 1 && mergeMap.has(i)) {
              const arr = mergeMap.get(i);
              const tmp = arr.find(n => n.row === index);
              if (tmp) {
                rowSpan = tmp.span;
              } else {
                rowSpan = 0;
              }
            }
            if (!tableProperty.isReport && (tableProperty.tableStyle == 'default' || tableProperty.tableStyle == 'crosswise') && (index % 2 === 0) && rowSpan == 1) {
              style.backgroundColor = conversBgColor(tableProperty.tableStyleColor)

            }
            if (!tableProperty.isReport && tableProperty.tableStyleColor) {
              style.borderColor = conversBgColor(tableProperty.tableStyleColor, 0.5);
              if (tableProperty.tableStyle == 'crosswise') {
                if (coIndex != columns.length - 1) {
                  style.borderColor = 'transparent';
                } else {
                  style.borderBottomColor = 'transparent';
                }
              }
              if (tableProperty.tableStyle == 'level') {
                if (coIndex != columns.length - 1) {
                  style.borderRightColor = 'transparent';
                }
              }
            }
            const obj = {
              props: { style, colSpan, rowSpan },
            };

            if (value === '' || value.success === true) {

              let formatObject = conversFormatObject(itemRow.textBox.formatObject);

              value = PropertyUtils.conversionFormat(value.value, formatObject);
            } else {
              value = (<Tooltip title={'计算参数错误'}>
                <span style={{ color: 'red' }}>--</span>
              </Tooltip>);
            }
            if (itemRow.textBox.warningPictures) {//预警图片
              let warningPicturesUrl = itemRow.textBox.warningPictures;
              let picturesResults = '';
              if (itemRow.textBox.warningPictures.substring(1, 4) === 'IIf') {
                warningPicturesUrl = parAggregationExp(itemRow.textBox, treeItemMap.expSet, warningPicturesUrl);
                picturesResults = this.getExpressionValue(warningPicturesUrl, record);
                if (picturesResults.value !== "" && picturesResults.success) {
                  warningPicturesUrl = picturesResults.value;
                }
              }
              let warningImgStyle = {
                float: (itemRow.textBox.warningPicturesLocation === 'right') ? 'right' : 'left',
                width: '20px', height: '20px', marginLeft: (value === '' ? 'calc(50% - 10px)' : '0px')
              }
              warningPictures = (picturesResults.success != undefined && !picturesResults.success) ? (<Tooltip title={'聚合函数与对应文本框不一致'}><img src={warningPicturesUrl} style={warningImgStyle} alt={'警告图片'} /></Tooltip>)
                : (<img src={warningPicturesUrl} style={warningImgStyle} alt={'警告图片'} />);
            }

            if (itemRow.textBox.warningTextColor) {//预警文字颜色
              let warningTextColorExp = itemRow.textBox.warningTextColor;
              warningTextColorExp = parAggregationExp(itemRow.textBox, treeItemMap.expSet, warningTextColorExp);
              let warningTextRes = this.getExpressionValue(warningTextColorExp, record);
              if (warningTextRes.value !== "" && warningTextRes.success) {
                obj.props.style.color = warningTextRes.value;
              }
            }

            if (((!itemRow.textBox.action) || !itemRow.textBox.action.targetObject || !itemRow.textBox.action.targetObject.length) && (!itemRow.textBox.action || !itemRow.textBox.action.openUrl)) {
              obj.children = (<span>{warningPictures}{value}</span>);
              obj.props.style.cursor = 'text';
              TableManagerThis.setActionEvent(that.props.linkages, columns[coIndex].fieldName, obj.props)
              return obj;
            } else {
              let newRecord = record;
              const itemRowAction = itemRow.textBox.action || {};
              const dimensionList = itemRowAction.dimension || [];
              const measuresList = itemRowAction.measures || [];
              if (dimensionList[0] && measuresList[0]) {
                const measures = measuresList[0];
                newRecord = produce(record, (draft) => {
                  const index = columns.findIndex(g => g.fieldName == measures);
                  if (index != -1 && treeItemMap.itemRow && treeItemMap.expSet) {
                    const textBoxMap = treeItemMap.itemRow[index].textBox;
                    const treeExp = treeItemMap.expSet[textBoxMap.id] || textBoxMap.value || '';
                    draft.children && draft.children.forEach((item) => {
                      const expValue = this.getExpressionValue(treeExp, item);
                      if (expValue.success) {
                        item[measures] = expValue.value;
                      }
                    })
                  }
                })
              }
              obj.children = (<span
                style={{ textDecoration: style.textDecoration, cursor: 'pointer' }}
                onClick={
                  that.props.clickHandler.bind(this,
                    newRecord,
                    columns[i].fieldName,
                    itemRow.textBox.action,
                    conditions,
                    null)
                }
              >
                {warningPictures}
                {value}
              </span>);
            }

            TableManagerThis.setActionEvent(that.props.linkages, columns[coIndex].fieldName, obj.props)

            return obj;

          } else {
            return value;
          }
        },
        onCellClick: (record) => {
          this.onCellClick(record, columns[i].fieldName, null, conditions);
        },
      };
      if (fixedIndex != -1) {
        if (i == columns.length - 1) {
          delete childrenObj.width;
        }
      }
      c.children.push(childrenObj);
    }
    if (tableProperty.numberDisplay) { // 处理序号
      const style = {};
      style.textAlign = 'center';
      style.backgroundColor = 'transparent';
      if (tableProperty.isBorder !== undefined) {
        if ((tableProperty.isBorder === 'no')) {
          style.border = 'none';
        }
      }
      if (!tableProperty.isReport && tableProperty.tableStyleColor) {
        style.backgroundColor = tableProperty.tableStyleColor;
        style.borderColor = conversBgColor(tableProperty.tableStyleColor, 0.5);
      }

      let rowNumberObj = {
        colShow: true,
        key: tableColumns.length + 1,
        rowSpan: tableColumns[0].rowSpan,
        width: isRowNumberDrag ? objTable.widths[0] : 55,
        title: tableProperty.numberName,
        style,
        id: comm.genId(),
        children: [{
          colSpan: 0,
          width: isRowNumberDrag ? objTable.widths[0] : 55,
          style,
          render: (text, record, index) => {
            let v = this.getExpressionValue(`=RowNumber(${index + 1 + total})`, {}, {});
            let newstyle = { ...style }
            delete newstyle.backgroundColor;
            if (tableProperty.isBorder !== undefined) {
              if ((tableProperty.isBorder === 'no') || (tableProperty.isBorder === 'contentNo')) {
                newstyle.border = 'none';
              }
            }
            if (!tableProperty.isReport && (tableProperty.tableStyle == 'default' || tableProperty.tableStyle == 'crosswise') && (index % 2 === 0)) {
              newstyle.backgroundColor = conversBgColor(tableProperty.tableStyleColor)

            }
            if (!tableProperty.isReport && tableProperty.tableStyleColor) {
              newstyle.borderColor = conversBgColor(tableProperty.tableStyleColor, 0.5);
              if (tableProperty.tableStyle == 'crosswise') {

                newstyle.borderColor = 'transparent';

              }
              if (tableProperty.tableStyle == 'level') {

                newstyle.borderRightColor = 'transparent';

              }
            }
            return {
              children: v.value,
              props: {
                style: newstyle
              }

            }
          }
        }]
      }
      tableColumns.unshift(rowNumberObj);
    }
    // console.log(tableColumns)
    return tableColumns;
  }
  getMergeMap (objTable) {
    const mergeMap = new Map();
    const data = this.view.state.data;
    const rowGroupColumnLength = objTable.cornerSize.columns;
    if (rowGroupColumnLength === 0) {
      return mergeMap;
    }
    const rowGroups = objTable.rowGroups;
    const lastValues = new Map();
    const groupFieldMap = new Map();
    const groupColIndexMap = new Map();
    for (let i = rowGroupColumnLength - 1; i >= 0; i -= 1) {
      for (let j = rowGroups.length - 1; j >= 0; j -= 1) {
        if (rowGroups[j].colPosition === i && rowGroups[j].expressions.length > 0) {
          const fn = rowGroups[j].expressions.map(e => e.slice('=Fields.'.length));
          groupColIndexMap.set(i, {
            fieldNames: fn,
            startRow: rowGroups[j].startRow,
            endRow: rowGroups[j].endRow,
          });
          break;
        }
      }
    }

    for (let i = 0; i < rowGroupColumnLength; i += 1) {
      lastValues.set(i, null);
      mergeMap.set(i, []);
    }
    let lastGroupInfo = null;
    const arrayItemsEqual = (arr1, arr2) => {
      if (arr1 === null || arr2 === null) {
        return false;
      }
      if (arr1.length !== arr2.length) {
        return false;
      }
      const len = arr1.length;
      for (let i = 0; i < len; i++) {
        if (arr1[i] !== arr2[i]) {
          return false;
        }
      }
      return true;
    };

    data.forEach((row, rowIndex) => {
      const groupName = row[groupNameTag];
      let groupInfo;
      if (groupFieldMap.has(groupName)) {
        groupInfo = groupFieldMap.get(groupName);
      } else {
        groupInfo = groupName ? rowGroups.find(g =>
          g.name === groupName) : rowGroups.find(g => g.expressions.length === 0);
        groupFieldMap.set(groupName, groupInfo);
      }
      for (let colIndex = 0; colIndex < rowGroupColumnLength; colIndex += 1) {
        const lvs = lastValues.get(colIndex);
        const vs = groupColIndexMap.has(colIndex) ?
          groupColIndexMap.get(colIndex).fieldNames.map(fn => row[fn]) : null;
        if (!arrayItemsEqual(lvs, vs) ||
          // (groupInfo !== lastGroupInfo && colIndex >= groupInfo.colPosition) ||
          (groupInfo && groupInfo.colPosition < colIndex)) {
          for (let j = colIndex; j < rowGroupColumnLength; j += 1) {
            const spanMapItem = mergeMap.get(j);
            spanMapItem.push({ row: rowIndex, span: 1 });
          }
          lastValues.set(colIndex, vs);
          for (let j = colIndex + 1; j < rowGroupColumnLength; j += 1) {
            const gf = groupColIndexMap.get(j);
            if (gf) {
              lastValues.set(j, gf.fieldNames.map(fn => row[fn]));
            }
          }
          break;
        } else if (groupInfo && groupInfo.colPosition === colIndex && row[positionTag] === 'p') {
          const spanMapItem = mergeMap.get(colIndex);
          spanMapItem.push({ row: rowIndex, span: 1 });
        } else {
          const spanMapItem = mergeMap.get(colIndex);
          const tmp = spanMapItem[spanMapItem.length - 1];
          tmp.span += 1;
        }
      }
      lastGroupInfo = groupInfo;
    });
    return mergeMap;
  }
  onCellClick (record, columnName, action, conditions) {
    if (this.view.props.clickHandler) {
      this.view.props.clickHandler(record, columnName, action, conditions);
    }
  }




  getState (data, pageIndex) {

    return {
      current: pageIndex,
      data: data.list,
      total: data.total,
      footerData: data.footerData,

    };
  }
  refreshTable (dataSet, model, conditions, pageIndex = 1, sortExpressions = [], userCase) {
    const that = this.view;
    if (!dataSet.isPaging && !dataSet.topNs) {
      dataSet.pageSize = 100000;
    }
    if (dataSet.topNs) {
      dataSet.pageSize = dataSet.topNs;
    }
    const par = {
      tableJSON: JSON.stringify({ ...dataSet, conditions, sortExpressions }),
      pageIndex,
      userCase,
    };
    NetUtil.post('tables/getDataByTableJson/', par, (d) => {
      if (d.code !== 200) {
        that.setState({
          errorMessage: d.msg,
          data: 'error',
          footerData: null,
        });
      }
      if (d.data != null) {
        that.setState(this.getState(d.data, pageIndex));
      }
    }, (d) => {
      that.setState({
        errorMessage: d,
        data: 'error',
        footerData: null,
      });
    });
  }

  setRowKeyForChildren (rows) {
    const childrenRows = [];
    rows.forEach((row) => {
      const key = row.key;
      row.children.forEach((c, idx) => {
        if (!Object.prototype.hasOwnProperty.call(c, 'key')) {
          c.key = `${key} -${idx} `;
        }
        if (Object.prototype.hasOwnProperty.call(c, 'children')) {
          childrenRows.push(c);
        }
      });
    });
    if (childrenRows.length > 0) {
      this.setRowKeyForChildren(childrenRows);
    }
  }
  getTableWidth (callback, columns) {
    let allWidths = [];
    const that = this.view;
    const table = that.props.model;
    let PrintTemplate = that.getPrintTemplate() || {};
    let tableCols = table.columns;
    let widths = PrintTemplate.widths || [];
    const isRowNumberDrag = widths.length > tableCols.length ? 1 : 0;

    tableCols.forEach((item, i) => {
      // if(isAdaptive){
      if (item.isShow === undefined || item.isShow) {
        allWidths.push(widths[i + isRowNumberDrag] || that.props.model.widths[i + isRowNumberDrag])
        if (typeof callback === 'function') {
          callback(i);
        }
      }
    })
    if (isRowNumberDrag) {
      allWidths.unshift(widths[0])
    } else {
      const tableProperty = table.tableProperty || {};
      if (tableProperty.numberDisplay) {
        allWidths.unshift(55)
      }
    }
    const width = allWidths.reduce((sum, item) => {
      return sum + item;
    }, 0);

    return { width, allWidths };
  }
  getScrollConfigAndRowHeight (model) {//获取ScrollConfig高度和单行高度
    const that = this.view;
    const table = model || that.props.model;
    const objTable = DynamicTableUtils.JsonToTable(JSON.parse(JSON.stringify(table)));
    const tableProperty = that.props.model.tableProperty || {};
    const pageHeight = (tableProperty.isPaging && !tableProperty.topNs) ? 40 : 0;
    const headHeight = (that.HeadData.isShow ? that.HeadData.height : 0);
    const footHeight = (that.footData.isShow ? that.footData.height : 0);
    let rows = [];
    let rowsHeight = 0;
    let tableHeadheight = 0;
    if (objTable.heights.length - 1 > objTable.rowGroups[0].endRow) {
      rows = objTable.tableRows.slice(objTable.rowGroups[0].endRow + 1);
      rowsHeight = objTable.heights.slice(-rows.length).reduce((sum, item) => { return sum + item }, 0)
    }
    objTable.heights.forEach((item, i) => {
      if (i <= objTable.cornerSize.rows - 1) {
        tableHeadheight += item;
      }
    })
    let linkageH = this.view.props.linkage ? 48 : 0
    // const ph = that.HeadData.isShow ? 0 : 12;
    const ph = 0;
    const startRow = objTable.rowGroups[objTable.rowGroups.length - 1].startRow;
    let padding = 0;
    if (that.props.view.style && that.props.view.style.padding) {
      padding = parseInt(that.props.view.style.padding) * 2
    }
    return {
      scroolHeight: (that.props.view.offsetHeight - padding - pageHeight - (rowsHeight) - tableHeadheight - headHeight - footHeight - ph - 10 - linkageH),
      rowHeight: objTable.heights[startRow]

    };
  }
  getTable () {
    const that = this.view;
    const table = that.props.model;
    if (!table || !table.body || table.body.length === 0) {
      return null;
    }
    if (!this.hiddenList) {
      this.hiddenList = [];
    }
    const objTable = DynamicTableUtils.JsonToTable(JSON.parse(JSON.stringify(table)));
    const tableProperty = that.props.model.tableProperty || {};

    let width = this.getTableWidth().width;
    let isDashboardAdaptive = false;
    if (that.props.containerType === 'dashboard' && tableProperty.adaptive != undefined && !tableProperty.adaptive) {
      let PrintTemplate = {};
      let newWidths = objTable.widths;
      if (!this.hiddenList.length) {
        objTable.columns.forEach((item, i) => {
          if (!item.isShow) {
            this.hiddenList.push(i)
          }
        })
      }
      let newWidth = width;
      if (tableProperty.numberDisplay) {//序号宽度
        newWidths = [55, ...newWidths];
        newWidth += 55;

      }
      if (!that.printTemplateList.length) {

        that.setPrintTemplateList(newWidths, newWidth)
      } else {
        PrintTemplate = that.getPrintTemplate();
        if (PrintTemplate.widths && !PrintTemplate.widths.length) {
          PrintTemplate.widths = newWidths;
          PrintTemplate.tableWidth = newWidth;
        }
      }
      if (that.state.printInfo) {//仪表板拖动,在获取columns之前
        let i = that.state.printInfo.i;
        let count = 0;
        this.hiddenList.forEach(index => {
          if (i == index || i > index) {
            i++
          }
        })
        i += count;
        let relevantWidth = PrintTemplate.widths[i];
        PrintTemplate.widths[i] = relevantWidth + that.state.printInfo.distanceX;
        PrintTemplate.tableWidth += that.state.printInfo.distanceX;
        that.state.printInfo = null;
      }
      if (PrintTemplate.widths) {
        objTable.widths = PrintTemplate.widths;
        width = PrintTemplate.tableWidth;
        isDashboardAdaptive = true;
      }

    }
    if (!isDashboardAdaptive && tableProperty.numberDisplay) {//序号宽度
      width += 55;
    }
    const groupFields = that.props.dataSet.groupFields;
    const defaultExpandAllRows = that.props.dataSet.collapse === false;
    const data = this.view.state.data;
    const parentRows = [];
    data.forEach((row, idx) => {
      if (!Object.prototype.hasOwnProperty.call(row, 'key')) {
        row.key = idx.toString();
      }
      if (Object.prototype.hasOwnProperty.call(row, 'children')) {
        parentRows.push(row);
      }
    });
    this.setRowKeyForChildren(parentRows);
    const defaultExpandedRowKeys = [];
    if (parentRows.length > 0) {
      defaultExpandedRowKeys.push(parentRows[0].key);
    }
    const mergeMap = parentRows.length > 0 ? new Map() : this.getMergeMap(objTable);

    let columns = this.generateAntdColumns(objTable, groupFields, mergeMap, that.state.footerData).filter((item, i) => {
      if (item.colShow === undefined || item.colShow) {
        return true;
      } else {
        return false;
      }
    })

    let columnsFixedIndex = columns.findIndex(item => item.fixed == 'left');

    const scrollConfig = {};


    if (columnsFixedIndex != -1) {
      columns[0].fixed = 'left';
      if (!this.view.props.liId) {
        if (width > $('#tableDiv').width()) {
          delete columns[columns.length - 1].width;
          scrollConfig.x = width;
          width = $('#tableDiv').width() - 20;
        }
      } else {
        if (width > $('#' + this.view.props.liId).width()) {
          delete columns[columns.length - 1].width;
          scrollConfig.x = width;
          width = $('#' + this.view.props.liId).width() - 45;
        }
        tableProperty.isFixedColumn = true;
      }

    }

    scrollConfig.y = this.getScrollConfigAndRowHeight().scroolHeight;//减去边距 分页高 表未高 表头高 标题高 最外层高185
    const totalFields = that.props.dataSet.totalFields;
    const totalExpressions = that.props.dataSet.totalFieldsExpressions;
    const footer = this.addFooter(objTable, that.state.footerData, totalFields, totalExpressions, tableProperty, table.columns, this.view.props.liId);
    const paginationConditions = { current: that.state.current, size: 'small', simple: true, total: that.state.total, pageSize: that.dataSet.pageSize };
    console.log(scrollConfig, that.state.data, 'sssssssssss')

    return (
      <Table
        // key={`t${that.state.current}`}
        defaultExpandAllRows={defaultExpandAllRows}
        defaultExpandedRowKeys={defaultExpandedRowKeys}
        className={'tablePad'}
        titleHeight={tableProperty.title}
        footer={footer}
        onChange={that.handleTableChange}
        scroll={tableProperty.fixedColumn ? scrollConfig : {}}
        fixed={that.props.fixed}
        tableWidth={width}
        pagination={((tableProperty.isPaging === undefined || tableProperty.isPaging) && !tableProperty.topNs) ? paginationConditions : false}
        bordered={tableProperty.isBorder === undefined ? true : tableProperty.isBorder}
        columns={columns}
        dataSource={that.state.data}
        tableProperty={{ ...tableProperty }}
        dashboard={{ containerType: that.props.containerType, }}

        liId={this.view.props.liId}
        tableType={'table'}
        setTableWidthsTag={that.setTableWidthsTag.bind(that)}
        scrollLeft={that.state.scrollLeft}
        view={this.view.props.view}
        linkage={this.view.props.linkage}
      />
    );
  }

  addFooter (objTable, footData, totalFields, totalExpressions = {}, tableProperty = {}) {
    let footer = null;
    if (objTable.heights.length - 1 > objTable.rowGroups[0].endRow) {
      footer = (data, columns) => {
        const rows = objTable.tableRows.slice(objTable.rowGroups[0].endRow + 1);

        return this.buildTableFooter(objTable.widths,
          objTable.heights,
          rows,
          footData,
          totalFields,
          totalExpressions,
          tableProperty,
          columns
        );
      };
    }
    return footer;
  }
  getActualTableWidths (callback, columns, widths) {
    const id = this.view.props.liId;
    const cb = (total, currentValue) => {
      return total + currentValue;
    };
    const tableMap = this.getTableWidth(callback, columns);
    let allWidths = tableMap.allWidths || [];
    let tableWidth = tableMap.width || 0;
    const tableProperty = this.view.props.model.tableProperty || {};
    // if (tableProperty.numberDisplay) {
    //   if (widths.length > columns.length) {
    //     allWidths.unshift(widths[0]);
    //     tableWidth += widths[0];
    //   } else {
    //     allWidths.unshift(55);
    //     tableWidth += 55;
    //   }
    // }
    if (id && (tableWidth < this.view.props.view.clientWidth) && (tableProperty.adaptive || tableProperty.adaptive === undefined)) {
      const multiple = parseFloat(((this.view.props.view.clientWidth - 33) / tableWidth).toFixed(2));
      let ColumnsCol = [];
      for (let i = 0; i < allWidths.length; i++) {
        ColumnsCol.push(
          parseInt(allWidths[i] * multiple)
        )
      }
      const newTableWidth = ColumnsCol.reduce((total, currentValue, currentIndex) => {
        return (currentIndex !== ColumnsCol.length - 1) ? total + currentValue : total + 0;
      }, 0)
      ColumnsCol[ColumnsCol.length - 1] = this.view.props.view.clientWidth - 34 - newTableWidth - 8;
      tableWidth = ColumnsCol.reduce(cb, 0);
      allWidths = ColumnsCol;
    }
    return {
      tableWidthList: allWidths,
      tableWidth
    }
  }
  buildTableFooter (widths, heights, footer, footerData, totalFields, totalExpressions, tableProperty, columns) {
    if (!footer || footer.length === 0) {
      return null;
    }
    let that = this.view;
    let newfoot = [];
    const footHeight = heights.slice(-footer.length);
    let allWidths = this.getActualTableWidths(i => {
      newfoot.push(i)
    }, columns, widths).tableWidthList || [];

    let currentFooter = [];
    footer.forEach((item) => {
      let list = [];
      newfoot.forEach((c, i) => {
        list.push(item[c])
      });
      if (tableProperty.numberDisplay) {
        list.unshift({
          display: 1,
          colspan: 1,
          rowspan: 1,
          textBox: {}
        })
        if (tableProperty.tableFootMerge) {
          list[0].colspan = list[1].colspan + 1;
          list[0].textBox = list[1].textBox;
          list[1].display = 0;
        }
      }
      currentFooter.push(list);
    })

    return (<table className="ant-table-fixed" cellPadding="0" cellSpacing="0" style={{ width: '100%', marginTop: '-1px', overflow: 'visible', tableLayout: 'fixed' }}>
      <colgroup>
        {
          allWidths.map(c => <col style={{ width: `${c}px`, minWidth: `${c}px` }} />)
        }
      </colgroup>
      <tbody className="ant-table-tbody">
        {
          currentFooter.map((row, rowID) => {
            const borderStyle = {};
            if (rowID == (currentFooter.length - 1)) {
              borderStyle.borderBottom = 'none';
            }

            return (<tr key={rowID} className="ant-table-row  ant-table-row-level-0">
              {
                row.map((cell, colID) => {
                  const style = DynamicTableUtils.getStyleFromTextBox(cell.textBox);
                  style.display = 'cell';
                  style.height = `${footHeight[rowID]}px`;
                  // style.whiteSpace = 'pre-wrap';
                  if (tableProperty.isBorder !== undefined && (tableProperty.isBorder === 'no')) {
                    style.border = 'none';
                  }
                  if (!tableProperty.isReport && tableProperty.tableStyleColor) {
                    if (tableProperty.tableStyle != 'level') {
                      style.backgroundColor = conversBgColor(tableProperty.tableStyleColor, 0.2)
                    }
                    style.borderColor = conversBgColor(tableProperty.tableStyleColor, 0.5);
                    if (tableProperty.tableStyle == 'crosswise') {
                      if (colID != row.length - 1) {
                        style.borderColor = 'transparent';
                      } else {
                        style.borderBottomColor = 'transparent';
                      }
                    }
                    if (tableProperty.tableStyle == 'level') {
                      if (colID != row.length - 1) {
                        style.borderRightColor = 'transparent';
                      }
                    }

                  }
                  // if (!style.color) {
                  //   // style.color = getDefaultColor();
                  // }
                  let value = totalExpressions[cell.textBox.id] || cell.textBox.value || '';

                  if (value.substring(1, 4).toUpperCase() == 'SUM' && value.toUpperCase().indexOf('YEARTOTAL') != -1) {
                    value = value.substring(0, value.indexOf(',')) + ')';
                  }
                  value = specialFieldsparsing(value, footerData);
                  // if (footerData) {
                  totalFields.forEach((exp) => {
                    let idx;
                    while ((idx = value.indexOf(exp.expression), idx >= 0)) {
                      value = `${value.substr(0, idx)} Fields.${exp.fieldName} ${value.substr(idx + exp.expression.length)} `;
                    }
                  });


                  value = variableToExps(value, tableProperty.globalVariableList, footerData, this.view.props.dataSet.totalFields);
                  value = clearAggregation(value || '')
                  value = this.getExpressionValue(value, footerData);



                  let warningPictures = '';
                  if (cell.textBox.warningPictures) {//预警图片

                    let warningPicturesUrl = cell.textBox.warningPictures;

                    let picturesResults = '';
                    if (cell.textBox.warningPictures.substring(1, 4) === 'IIf') {
                      warningPicturesUrl = parAggregationExp(cell.textBox, undefined, warningPicturesUrl);
                      picturesResults = this.getExpressionValue(warningPicturesUrl, footerData);
                      if (picturesResults.value !== "" && picturesResults.success) {
                        warningPicturesUrl = picturesResults.value;
                      }
                    }
                    let warningImgStyle = {
                      float: (cell.textBox.warningPicturesLocation === 'right') ? 'right' : 'left',
                      width: '20px', height: '20px', marginLeft: (value === '' ? 'calc(50% - 10px)' : '0px')
                    }
                    warningPictures = (picturesResults.success != undefined && !picturesResults.success) ? (<Tooltip title={'聚合函数与对应文本框不一致'}><img src={warningPicturesUrl} style={warningImgStyle} alt={'警告图片'} /></Tooltip>)
                      : (<img src={warningPicturesUrl} style={warningImgStyle} alt={'警告图片'} />);
                  }

                  if (cell.textBox.warningTextColor) {//预警文字颜色
                    let warningTextColorExp = cell.textBox.warningTextColor;
                    warningTextColorExp = parAggregationExp(cell.textBox, undefined, warningTextColorExp);
                    let warningTextRes = this.getExpressionValue(warningTextColorExp, footerData);
                    if (warningTextRes.value !== "" && warningTextRes.success) {
                      style.color = warningTextRes.value;
                    }
                  }

                  if (!style.textAlign) {
                    style.textAlign = isNaN(value.value) ? 'left' : 'right';
                  }

                  if (value === '' || value.success === true) {
                    value = PropertyUtils.conversionFormat(value.value, conversFormatObject(cell.textBox.formatObject));
                  } else {
                    value = (<Tooltip title={'计算参数错误'}>
                      <span style={{ color: 'red' }}>--</span>
                    </Tooltip>);
                  }



                  // }
                  return cell.display === 1 ? (<td
                    key={colID}
                    style={{ ...style, ...borderStyle }}
                    colSpan={cell.colspan}
                    rowSpan={cell.rowspan}
                    onClick={() => {
                      if ((cell.textBox.action && cell.textBox.action.targetObject && cell.textBox.action.targetObject.length > 0) || cell.textBox.action.openUrl) {
                        that.props.clickHandler.call(that, {}, '', cell.textBox.action, that.props.conditions)
                      }
                    }}
                  >
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={value}>
                      {warningPictures}
                      {
                        value
                      }

                    </div>
                  </td>) : null;
                })
              }
            </tr>);
          })
        }
      </tbody>
    </table>);
  }
  setActionEvent (linkages, fieldName, c, head = false) {
    let that = this.view;
    if (linkages !== undefined || (linkages instanceof Array && linkages.length > 0)) {
      let boole = true;
      for (let i = 0; i < linkages.length; i++) {
        let item = linkages[i];
        if (head) {
          if (item.eventField === fieldName) {
            // c.style.cursor='pointer'
            c.className = '_active';
          }
        } else {
          (linkages.filter((obj) => { return (obj.eventType === '行事件') ? true : false }).length > 0) ? c.style.cursor = 'pointer' : '';
          if (linkages.filter((obj) => { return (obj.eventType === '行事件') ? true : false }).length > 0) {

            if (item.eventField === fieldName) {
              c.className = 'All_active';    //即是行也是列
              boole = false;
            } else {
              if (boole) {
                c.className = 'line_active'    //行
              }
            }
          } else {
            if (item.eventField === fieldName) {
              c.className = '_active'   //列
              c.style.cursor = 'pointer'
            }
          }

        }
      }
    }

  }
}

export default TableManager;
