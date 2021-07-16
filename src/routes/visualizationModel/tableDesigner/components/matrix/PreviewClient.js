import React, { Component } from 'react';
import { Icon, Modal, Col } from '@vadp/ui';
import Table from 'components/ViewTable/Table';
import convert from './matrixConvert';
import NetUitl from 'containers/HttpUtil';

class MatrixPreview extends Component {
  state = {
    data: null
  };
  model = null
  loadData = (analysisModelId, model, conditions) => {
    let that = this;
    this.model = model;
    if (!analysisModelId || !model) {
      this.setState({ data: "error" });
      return;
    }
    if (model.columnGroup.length === 0 || model.rowGroup.length === 0 || model.seriesGroup.length === 0) {
      return;
    }
    let url = `analysismodel/getAllData`;
    let par = { id: analysisModelId };
    if (conditions && conditions.length > 0) {
      par.conditions = conditions;
    }
    NetUitl.post(url, par, function (data) {
      if (data.data) {
        that.setState({
          data: data.data
        });
      }
    }, function (data) {
      that.setState({ data: 'error' });
    });
  }
  componentDidMount() {
    let { analysisModuleId, model, conditions } = this.props;
    this.loadData(analysisModuleId, model, conditions);
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.analysisModuleId === this.props.analysisModuleId
      && nextProps.model === this.props.model
      && nextProps.conditions === this.props.conditions
    ) {
      return;
    }
    let { analysisModuleId, model, conditions } = nextProps;
    this.loadData(analysisModuleId, model, conditions);
  }

  getTable = () => {
    let that = this;
    let { rowGroup, columnGroup, seriesGroup } = this.model;
    const handleCellClick = (record, ev, column, index) => {
      if (that.props.clickHandler) {
        let columnName, rc = {}, action = {};
        if (column.valueField) {
          columnName = column.valueField;
          let series = seriesGroup.filter(s => s.fieldName === columnName);
          action = {};
          if (series.length > 0) {
            action = series[0].body.action;
          }
          rowGroup.forEach((r, i) => {
            let v = record[`${r.fieldName}$${i}`];
            if (v !== rowGroup[i].sumHeaderText)
              rc[r.fieldName] = v;
          });
          rc[columnName] = record[column.dataIndex];
          let colValues = column.dataIndex.split('$$');
          for (let i = 1; i < colValues.length - 1; i++) {
            rc[columnGroup[i - 1].fieldName] = colValues[i];
          }
        } else {
          columnName = column.dataIndex.substr(0, column.dataIndex.indexOf('$'));
          let colIndex = Number(column.dataIndex.substr(column.dataIndex.indexOf('$') + 1));
          for (let i = 0; i <= colIndex; i++) {
            let r = rowGroup[i];
            rc[r.fieldName] = record[`${r.fieldName}$${i}`];
          };
          action = rowGroup[Number(column.dataIndex.substr(column.dataIndex.indexOf('$') + 1))].body.action;
        }
        that.props.clickHandler(rc, columnName, action, ev);
      }
    };


    let config = convert(rowGroup, columnGroup, seriesGroup, this.state.data, handleCellClick);

    let rowSpanMap = new Map();
    for (let i = 0; i < rowGroup.length - 1; i++) {
      rowSpanMap.set(`${rowGroup[i].fieldName}$${i}`, []);
    }

    const mapData = (data, source, tmplate, lvl) => {
      let last = null;
      source.forEach((item, index) => {
        let rowKey = `${rowGroup[lvl].fieldName}$${lvl}`;
        if (lvl < rowGroup.length - 1 && last !== item[rowKey]) {
          last = item[rowKey];
          let tmp = rowSpanMap.get(rowKey);
          tmp.push({ row: data.length, span: 0 });
        }
        if (item.children) {
          let tmplate2 = { ...tmplate };
          tmplate2[rowKey] = item[rowKey];
          mapData(data, item.children, tmplate2, lvl + 1);
        } else {
          data.push({ ...item, ...tmplate, key: data.length + 1 });
          for (let i = 0; i < rowGroup.length - 1; i++) {
            let tmpKey = `${rowGroup[i].fieldName}$${i}`;
            let tmp = rowSpanMap.get(tmpKey);
            if (i > lvl) {
              tmp.push({ row: data.length - 1, span: 0 });
            }
            tmp[tmp.length - 1].span = tmp[tmp.length - 1].span + 1;
          }
        }
      });
    }
    let columns = config.columns;
    let data = [];
    mapData(data, config.data, {}, 0);

    const renderCallback = (key, i) => {
      return function (value, row, index) {
        let style = rowGroup[i].body.style;
        let obj = {
          children: value
        };
        let prop = { style };
        if (rowSpanMap.has(key)) {
          let arr = rowSpanMap.get(key);
          let item = arr.find(n => n.row === index);
          if (item) {
            prop.rowSpan = item.span;
          }else{
            prop.rowSpan = 0;
          }
        }
        obj.props = prop;
        return obj;
      };
    };
    for (let i = 0; i < rowGroup.length; i++) {
      columns[i].render = renderCallback(columns[i].key, i);
    }
    let scrollConfig = { x: config.tableWidth };
    // if (this.props.fixed === true) {
    //   scrollConfig.y = 350;
    // }
    let title = this.props.tableProperty?this.getTitle():null;
    return <Table title={this.getTitle()} fixed={this.props.fixed} columns={columns} pagination={{ pageSize: 1000 }} scroll={scrollConfig} dataSource={data} bordered />;
  }
  getTitle=()=>{
    let tableProperty = this.props.tableProperty;
    return ()=>( <div style={{display:'flex' }}>
      <div style={{ textAlign: 'center', flex:1,
        display: tableProperty.isDisplay ? '' : 'none' }} >
        标题：{tableProperty.title}
      </div>
      <div style={{ textAlign: 'right',  display: tableProperty.isUnitDisplay ? '' : 'none', marginLeft:tableProperty.isDisplay ? '4%' : '89%' }}>
        单位：{tableProperty.unitName}
      </div>
    </div>);

  }
  render() {
    let content;
    let model = this.model;
    if (!model) {
      content = "";
    }
    else if (model.columnGroup.length === 0 || model.rowGroup.length === 0 || model.seriesGroup.length === 0) {
      content = "模型不完整，不能预览。";
    }
    else if (!this.state.data) {
      content = "正在加载数据...";
    } else if (this.state.data === 'error') {
      content = "不能获取数据.";
    } else {
      content = this.getTable();
    }

    return (
      <div style={{height:'100%',width:'100%'}}>
        {content}
      </div>

    );
  }
}


export default MatrixPreview;

