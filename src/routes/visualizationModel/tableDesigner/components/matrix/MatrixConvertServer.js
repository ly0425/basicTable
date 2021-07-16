import { getDefaultColor } from 'components/Print/color';
import PropertyUtils from '../PropertyUtils';
import { conversBgColor } from '../table/tableConversionFn';
const PATH_SEPARATOR = '$area$';
let tableWidth;
let tableWidthList = [];
// const defaultCellStyle = { backgroundColor: 'transparent' };
const getRowColumns = (rowGroup, header, onCellClick, props) => {
  return rowGroup.map((col, idx) => {
    tableWidth += col.body.width;
    tableWidthList.push(col.body.width)
    const key = `${col.fieldName}$${idx}`;

    const style = { ...col.header.style, whiteSpace: 'pre-wrap', wordBreak: 'break-all', };
    // if (!style.color) {
    //   style.color = getDefaultColor();
    // }
    // style.color='red'
    const tableProperty = props.tableProperty;
    if (!tableProperty.isReport&&tableProperty.tableStyleColor) {
      style.backgroundColor = tableProperty.tableStyleColor;
      style.borderColor = conversBgColor(tableProperty.tableStyleColor, 0.5);
      if (tableProperty.tableStyle === 'simpleV' || tableProperty.tableStyle === 'default') {
        style.borderColor = 'rgba(0,0,0,.2)';
      }

    }
    if (tableProperty.isBorder !== undefined) {
      if ((tableProperty.isBorder === 'no')) {
        style.border = 'none';
      }
    }
    return {
      title: header[idx],
      dataIndex: key,
      key,
      style,
      onCellClick,
      width: col.body.width,
      // fixed:'left'
    };
  });
};

const getValueColumns = (columnGroup, seriesGroup, header, onCellClick, props, propsThis) => {
  const colSpan = seriesGroup.length === 1 ? 0 : 1;

  return header.reduce((columns, col) => {
    const arr = col.split(PATH_SEPARATOR);
    let cs = columns;
    let item;
    // 服务端返回的表头名称中添加了series的名称和标题，所以数组长度要-2
    const actualColumnLength = arr.length - 2;
    let key = '';
    const tableProperty = props.tableProperty;
    let tableStyles = {};
    if (!tableProperty.isReport&&tableProperty.tableStyleColor) {
      tableStyles.backgroundColor = tableProperty.tableStyleColor;
      tableStyles.borderColor = conversBgColor(tableProperty.tableStyleColor, 0.5);

    }
    let ci;
    for (let i = 0; i < actualColumnLength; i += 1) {
      ci = i;
      key = `${key}$${arr[i]}`;
      item = cs.find(c => c.title === arr[i]);
      if (!item) {

        if (tableProperty.isBorder !== undefined) {
          if ((tableProperty.isBorder === 'no')) {
            columnGroup[i].style.border = 'none';
          }
        }

        item = {
          title: PropertyUtils.conversionFormat(arr[i], columnGroup[i].formatObject),
          key,
          onCellClick,
          style: { ...columnGroup[i].style, ...tableStyles },
          children: [],
        };
        cs.push(item);
      }
      cs = item.children;
    }
    if (actualColumnLength < columnGroup.length) {

      item = cs.find(c => c.key === '$$aggregation$$');
      const fieldName = arr[actualColumnLength + 1];
      const newseriesGroup = seriesGroup.find(s => s.fieldName === fieldName);
      if (!item) {
        const g = columnGroup[actualColumnLength];
        //  g.style.color='red'
        item = {
          title: PropertyUtils.conversionFormat(g.sumHeaderText, g.formatObject),
          key: '$$aggregation$$',
          onCellClick,
          style: { ...g.style, ...tableStyles },
          rowSpan: columnGroup.length - actualColumnLength,
          children: [],
        };
        if (colSpan === 0) {
          item.width = seriesGroup[0].header.width;
        }
        if (newseriesGroup.body.isSum || newseriesGroup.body.isSum === undefined) {
          cs.push(item);
        }
        cs = item.children;
      } else {
        if (newseriesGroup.body.isSum || newseriesGroup.body.isSum === undefined) {
          cs = item.children;
        } else {
          cs = [];
        }
      }
    } else if (colSpan === 0 && !item.width) {
      item.width = seriesGroup[0].header.width;
    }
    const vHeader = arr[actualColumnLength];
    const vFieldName = arr[actualColumnLength + 1];
    const series = seriesGroup.find(s => s.fieldName === vFieldName);
    item = cs.find(c => c.title === vHeader);
    if (!item) {
      const tableProperty = props.tableProperty;
      if (tableProperty.isBorder !== undefined) {
        if ((tableProperty.isBorder === 'no') || (tableProperty.isBorder === 'contentNo')) {
          series.header.style.border = 'none';
          series.body.style.border = 'none';
        }
      }
      // series.body.style.color = 'red'
      // series.header.style.color ='red'
      const newStyle = {};
      if (!tableProperty.isReport&&tableProperty.tableStyleColor) {
        newStyle.borderColor = conversBgColor(tableProperty.tableStyleColor, 0.5);
        if (tableProperty.tableStyle == 'crosswise') {
          if (ci != actualColumnLength.length - 1) {
            newStyle.borderColor = 'transparent';
          } else {
            newStyle.borderBottomColor = 'transparent';
          }
        }
        if (tableProperty.tableStyle == 'level') {
          if (ci != actualColumnLength.length - 1) {
            newStyle.borderRightColor = 'transparent';
          }
        }
      }
      cs.push({
        title: vHeader,
        dataIndex: col,
        key: col,
        valueField: vFieldName,
        style: { ...series.header.style, ...newStyle },
        colSpan,
        onCellClick,
        render: (value, r, index) => {
          const newserie = seriesGroup.filter(s => s.fieldName === vFieldName);
          let action;
          if (newserie.length > 0) {
            action = newserie[0].body.action;
          }
          const bg = {}
          if (!tableProperty.isReport&&((index % 2) === 0) && (tableProperty.tableStyle == 'default' || tableProperty.tableStyle == 'crosswise')) {
            bg.backgroundColor = conversBgColor(tableProperty.tableStyleColor)
          }
          if (!tableProperty.isReport&&tableProperty.tableStyleColor) {
            bg.borderColor = conversBgColor(tableProperty.tableStyleColor, 0.5);
            if (tableProperty.tableStyle == 'crosswise') {
              if (ci != actualColumnLength.length - 1) {
                bg.borderColor = 'transparent';
              } else {
                bg.borderBottomColor = 'transparent';
              }
            }
            if (tableProperty.tableStyle == 'level') {
              if (ci != actualColumnLength.length - 1) {
                bg.borderRightColor = 'transparent';
              }
            }
          }
          let warningPictures = '';
          if (series.body.warningPictures) {
            const PicturesResults = propsThis.getExpressionValue(series.body.warningPictures, {});
            if (PicturesResults.value !== "''" && PicturesResults.success) {
              warningPictures = (<img src={PicturesResults.value} style={{ float: (series.body.warningPicturesLocation === 'right') ? 'right' : 'left', width: '20px', height: '20px' }} alt={'警告图片'} />);
            }
          }
          if (!series.body.style.textAlign) {
            series.body.style.textAlign = isNaN(value) ? 'left' : 'right';
          }
          let obj = {
            children: (<div>{warningPictures}<span>{PropertyUtils.conversionFormat(value || '-', series.body.formatObject)}</span></div>),
            props: {
              style: { ...series.body.style, cursor: (action && action.targetObject && action.targetObject.length > 0) ? 'pointer' : '', ...bg, },
            },
          };

          return obj;
        },
        width: series.header.width,
      });
      tableWidth += series.header.width;
      tableWidthList.push(series.header.width)
    }
    return columns;
  }, []);
};

const convertAntData = (rawData, rowGroup, header) => {
  return rawData.data.reduce((arr, item) => {
    const row = {};
    for (let i = 0; i < rowGroup.length; i += 1) {
      if (item[i] === 'aggregation') {
        row[`${rowGroup[i].fieldName}$${i}`] = rowGroup[i].sumHeaderText;
        row['$$aggregation$$'] = 1;
      } else {
        row[`${rowGroup[i].fieldName}$${i}`] = item[i];
      }
    }
    for (let i = rowGroup.length; i < item.length; i += 1) {
      row[header[i]] = item[i];
    }
    arr.push(row);
    return arr;
  }, []);
};

const setColumnGroupHeight = (columnGroup) => {
  for (const c of columnGroup) {
    const style = { ...c.style };
    if (!style.height) {
      style.height = `${c.height}px`;
      style.lineHeight = `${c.height}px`;
    }
    style.whiteSpace = 'pre-wrap';
    style.wordBreak = 'break-all';
    // if (!style.color) {
    //   style.color = getDefaultColor();
    // }
    c.style = style;
  }
};

const setSeriesHeight = (seriesGroup) => {
  for (const s of seriesGroup) {
    let style = { ...s.body.style };
    if (!style.height) {
      style.height = `${s.body.height}px`;
      style.lineHeight = `${s.body.height}px`;
    }
    style.whiteSpace = 'pre-wrap';
    style.wordBreak = 'break-all';
    // if (!style.color) {
    //   style.color = getDefaultColor();
    // }
    s.body.style = style;

    style = { ...s.header.style };
    if (!style.height) {
      style.lineHeight = `${s.header.height}px`;
    }
    style.whiteSpace = 'pre-wrap';
    style.wordBreak = 'break-all';
    // if (!style.color) {
    //   style.color = getDefaultColor();
    // }
    s.header.style = style;
  }
};

const convert = (rowGroup, columnGroup, seriesGroup, rawData, onCellClick, props, propsThis) => {
  setColumnGroupHeight(columnGroup);
  setSeriesHeight(seriesGroup);
  // 表格总列数，计算表格宽度用
  tableWidth = 0;
  tableWidthList = [];
  const header = rawData.header;
  // 栏目

  const rowColumns = getRowColumns(rowGroup, header, onCellClick, props);
  const valueColumns = getValueColumns(columnGroup,
    seriesGroup,
    header.slice(rowGroup.length),
    onCellClick,
    props,
    propsThis
  );

  const columns = rowColumns.concat(valueColumns);

  // 数据
  const data = convertAntData(rawData, rowGroup, header);

  return {
    columns, data, tableWidth, tableWidthList,
  };
};

export default convert;
