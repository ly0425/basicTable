import React, { Component } from 'react';
import { Tree, Tooltip } from '@vadp/ui';
import { analysisModel } from './analysisModel';
import NothingMessage from './NothingMessage';

const TreeNode = Tree.TreeNode;

class DataSourceTree extends Component {

  constructor(props) {
    super(props);
    this.state = {
      datasource: []
    }
  }
  handleChartExpressions(data, fields) {
    let newFields = fields;
    if (data.expressions && data.expressions.length > 0) { //新增表达式后渲染度量
      newFields = fields.concat(data.expressions);
    } else {
      //编辑模型时渲染设置过的计算字段
      //(创建的自定义字段保存到chartModel.expressions，拖拽到值轴上的保存到chartModel.measures，编辑模型时tableTree应该从chartModel.expressions取得自定义字段，这样值轴上删除时也不会把tableTree上的删掉)
      let expressions = this.props.expressions && this.props.expressions.filter((item) => {
        return item.expression;
      });
      if (expressions && expressions.length > 0) {
        newFields = fields.concat(expressions);
      }
    }
    return newFields;
  }
  updateFields(type,value){
    this.props.updateFields && this.props.updateFields(type,value)
  }
  transformData(data) {
    let filter=this.props.filter;
    let that = this;
    let arr = [];
    let tmp;
    if (!data || !data.tableList){
      this.updateFields(type,[])
      return;
    }
    let type = that.props.ttype;
    let fields =null;
    if(this.props.source && this.props.source=="htmlContainer"){
        fields = analysisModel.getFields(data,undefined,undefined,1);
    }else{
        fields = analysisModel.getFields(data);
    }

    /*处理图表自定义字段开始*/
    fields=this.handleChartExpressions(data, fields);
    /*处理图表自定义字段结束*/

    fields = fields.filter(f=>f.fieldType===type);
    let className = type==="dimension" ? "icon iconfont icon-file" : "icon iconfont icon-stock";
    //分析模型关联表里如果没有可以作为维度或度量的字段则在tableTree里不显示
    if(fields.length==0){ 
      this.updateFields(type,[])
      return null;
    }
    this.updateFields(type,fields)
    for (let v of fields) {
      let title="";
      if(v.fieldName){
        if(v.comments &&v.comments!=v.fieldName){
          title=v.comments+" "+v.fieldName;
        }else{
          title=v.fieldName;
        }
      }else{
        title=v.comments;
      }
      if ((filter.length>0 && v.comments.toLowerCase().indexOf(filter.toLowerCase()) >-1) || filter.length==0){
        tmp = <li key={v.aliasName}  >
          <i className={className}></i>
          <span draggable="true" onDragStart=
          {that.drag.bind(that,
            {
              tableName: v.tableName,
              fieldName: v.aliasName,
              text: v.comments,
              dataType: v.dataType,
              expression: v.expression, //分析模型计算字段
              isChartUserDefined: v.isChartUserDefined, //图表创建的计算字段
              fieldType: v.fieldType,
              key: v.key,
              frontExpression:v.frontExpression //标签模块使用
            })}>
            <Tooltip placement="left" key={v.comments} title={title}>
              {v.comments || v.fieldName} 
            </Tooltip>
          </span>
        </li>;
        arr.push(tmp);
      }
    }
    return arr;
  }

  drag(item, ev) {
    item.type = this.props.ttype;
    let text = JSON.stringify(item)
    ev.dataTransfer.setData("text", text);
    // ev.dataTransfer.setData("text", item.text);
    // ev.dataTransfer.setData("fieldName", item.fieldName);
    // ev.dataTransfer.setData("tableName", item.tableName);
    // ev.dataTransfer.setData("type", this.props.ttype);
    // ev.dataTransfer.setData("dataType", item.dataType);
    // ev.dataTransfer.setDragImage(ev.target, 0, 0);
  }

  render() {
    let tree = this.transformData(this.props.datasource);
    return tree && tree.length>0 ? 
      <ul className="tableTree-ul">
        {tree}
      </ul> : NothingMessage();
  }
}

export default DataSourceTree
