import PropertyUtils from '../PropertyUtils';
const PATH_SEPARATOR = "$$";
const regex = new RegExp("\\$\\$", 'g');
const replacePathSeparator = (s) => {
  return s && s.replace ? s.replace(regex, '**') : s;
}

let tableWidth = 0;
const setValue = (row, dataRow, col, path) => {
  let children = col.children;
  if (!children) {
    let key = path + PATH_SEPARATOR + replacePathSeparator(col.valueField);
    row[key] = (row[key] || 0) + Number(dataRow[col.valueField]);
  } else {
    if (col.field) {
      if (dataRow[col.field] === col.value) {
        for (let idx = 0; idx < children.length; idx++) {
          setValue(row, dataRow, children[idx], path + PATH_SEPARATOR + replacePathSeparator(dataRow[col.field]));
        }
      }
    } else {
      for (let idx = 0; idx < children.length; idx++) {
        setValue(row, dataRow, children[idx], path);
      }
    }
  }
}

const getRowColumns = (rowGroup,onCellClick) => {
  return rowGroup.map((col,idx) => {
    tableWidth += col.body.width;
    let key = `${col.fieldName}$${idx}`;
    return {
      title: col.header.text,
      dataIndex: key,
      key: key,
      style:col.header.style,
      onCellClick,
      width: col.body.width
      //fixed:'left'
    };
  });
}
const addSumColumns = (columns, path, lvl, columnGroup, seriesGroup,onCellClick) => {
  if (lvl < columnGroup.length - 1) {
    for (let col of columns) {
      addSumColumns(col.children, path + PATH_SEPARATOR + replacePathSeparator(col.value), lvl + 1, columnGroup, seriesGroup,onCellClick);
    }
  }
  if (columnGroup[lvl].hasSum) {
    let sumCol = {
      title: columnGroup[lvl].sumHeaderText,
      dataIndex: path,
      style:{backgroundColor:'transparent'},
      key: path,
      onCellClick,
      rowSpan: columnGroup.length - lvl
    };
    if (sumCol.rowSpan < 2) {
      delete sumCol.rowSpan;
    }
    columns.push(sumCol);
    sumCol.children = seriesGroup.map(v => {
      tableWidth+=v.header.width;
      let key =`${v.fieldName}`;
      return {
        title: v.header.text,
        dataIndex: path + PATH_SEPARATOR + replacePathSeparator(key),
        key: path + PATH_SEPARATOR + replacePathSeparator(key),
        valueField: key,
        style:{backgroundColor:'transparent'},
        onCellClick,
        render:(value,row,index)=>{
          let obj ={children:PropertyUtils.conversionFormat(value,v.body.formatObject),props:{style:v.body.style}};
          return obj;
        },
        width: v.header.width
      };
    });
    //值只有一列时，不显示值的表头
    if (seriesGroup.length === 1) {
      sumCol.rowSpan = sumCol.rowSpan + 1;
      sumCol.children[0].colSpan = 0;
    }
  }
}

const getValueColumns = (columnGroup, seriesGroup, rawData,onCellClick) => {
  let columns = rawData.reduce((cols, aRow) => {
    let theCols = cols;
    let path = "";
    let col;

    for (let lvl = 0; lvl < columnGroup.length; lvl++) {
      let colField = columnGroup[lvl];
      let key = `${colField.fieldName}`;
      col = theCols.find(n => {

        let f = seriesGroup.length === 1 ? `${seriesGroup[0].fieldName}` : "";
        return path + PATH_SEPARATOR + replacePathSeparator(aRow[key]) === n.dataIndex || path + PATH_SEPARATOR + replacePathSeparator(aRow[key]) + PATH_SEPARATOR + replacePathSeparator(f) === n.dataIndex;
      });
      if (!col) {
        col = { title: aRow[key], value: aRow[key] ,onCellClick};
        col.dataIndex = path + PATH_SEPARATOR + replacePathSeparator(col.value);
        col.field = key;
        col.style=colField.style;
        col.key = col.dataIndex;
        let insertPosition = theCols.findIndex(n => {
          return n.value > col.value;
        });
        if (insertPosition === -1) {
          insertPosition = theCols.length;
        }
        for (let ix = theCols.length; ix > insertPosition; ix--) {
          theCols[ix] = theCols[ix - 1];
        }
        theCols[insertPosition] = col;
      }

      if (!col.children) {
        col.children = [];
      }
      theCols = col.children;
      path = path + PATH_SEPARATOR + replacePathSeparator(col.value);
    }

    if (!col.children || col.children.length === 0) {
      col.children = seriesGroup.map(v => {
        tableWidth+=v.header.width;
        let key = `${v.fieldName}`;
        return {
          title: v.header.text,
          dataIndex: col.dataIndex + PATH_SEPARATOR + replacePathSeparator(key),
          key: col.dataIndex + PATH_SEPARATOR + replacePathSeparator(key),
          valueField: key,
          style:v.header.style,
          onCellClick,
          render:(value,row,index)=>{
            let obj ={children:PropertyUtils.conversionFormat(value,v.body.formatObject),props:{style:v.body.style}};
            return obj;
          },
          width: v.header.width
        };
      });
      //值只有一列时，不显示值的表头
      if (seriesGroup.length === 1) {
        col.rowSpan = 2;
        col.children[0].colSpan = 0;
      }
    }
    return cols;
  }, []);

  addSumColumns(columns, "", 0, columnGroup, seriesGroup,onCellClick);
  return columns;
}


const addSumRows = (data, rowGroup, lvl) => {
  let sumRow = {};
  data.forEach(row => {
    if (row.children) {
      let added = addSumRows(row.children, rowGroup, lvl + 1);
      let set = new Set(rowGroup.map((g,idx) => `${g.fieldName}$${idx}`));
      for (let p in added) {
        if (!set.has(p)) {
          sumRow[p] = (sumRow[p] || 0) + added[p];
        }
      }
    }
  });
  if (lvl === rowGroup.length - 1) {
    let set = new Set(rowGroup.map((g,idx) => `${g.fieldName}$${idx}`));
    data.forEach(d => {
      for (let p in d) {
        if (!set.has(p)) {
          sumRow[p] = (sumRow[p] || 0) + Number(d[p]);
        }
      }
    });
  }
  if (rowGroup[lvl].hasSum) {
    let key = `${rowGroup[lvl].fieldName}$${lvl}`;
    sumRow[key] = rowGroup[lvl].sumHeaderText;
    data.push(sumRow);
  }
  return sumRow;
}

const getData = (rowGroup, rawData, valueColumns) => {
  let data = rawData.reduce((rows, aRow) => {
    let theRows = rows;
    let row;
    ///找到行
    for (let rowIdx = 0; rowIdx < rowGroup.length; rowIdx++) {
      let rawField = `${rowGroup[rowIdx].fieldName}`;
      let rowField = `${rawField}$${rowIdx}`;
      row = theRows.find(n => {
        return n[rowField] === aRow[rawField];
      });
      if (!row) {
        row = {};
        row[rowField] = aRow[rawField];
        row.children = [];
        let insertPosition = theRows.findIndex(n => {
          return n[rowField] > row[rowField];
        });
        if (insertPosition === -1) {
          insertPosition = theRows.length;
        }
        for (let ix = theRows.length; ix > insertPosition; ix--) {
          theRows[ix] = theRows[ix - 1];
        }
        theRows[insertPosition] = row;
      }
      theRows = row.children;
    }

    delete row.children;
    //赋值
    for (let colIdx = 0; colIdx < valueColumns.length; colIdx++) {
      setValue(row, aRow, valueColumns[colIdx], "");
    }
    return rows;
  }, []);
  addSumRows(data, rowGroup, 0);
  return data;
}

export default (rowGroup, columnGroup, seriesGroup, rawData,onCellClick) => {
  //表格总列数，计算表格宽度用
  tableWidth = 0;
  //栏目
  let rowColumns = getRowColumns(rowGroup,onCellClick);
  let valueColumns = getValueColumns(columnGroup, seriesGroup, rawData,onCellClick);
  let columns = rowColumns.concat(valueColumns);


  ///数据
  let data = getData(rowGroup, rawData, valueColumns);

  return {
    columns, data, tableWidth
  };
}
