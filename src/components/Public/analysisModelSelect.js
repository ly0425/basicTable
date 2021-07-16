import React, { Component } from 'react';
import { Select, Modal, Tooltip } from '@vadp/ui';
import NetUtil from '/src/containers/HttpUtil';

const confirm = Modal.confirm;
const Option = Select.Option;
//使用该组件的父组件需要提供 analysisModelChange
class AnalysisModelSelect extends Component {
  constructor(props) {
    super(props);
    this.state = {
      datasource: []
    }
  }
  // shouldComponentUpdate(nextProps, nextState) {

  //  if (this.props.analysisModelId === nextProps.analysisModelId && this.props.categoryId === nextProps.categoryId) {
  //       return false
  //   }
  //   return true
  // }
  componentDidMount() {
    this.refresh(this.props);
  }
  componentWillReceiveProps(nextProps){
    if(this.props.categoryId !== nextProps.categoryId){
      this.refresh(nextProps);
    }
  }
  refresh(props){
    const self = this;
    let categoryId = props.categoryId ? props.categoryId : null;
    if (!categoryId) return;
    NetUtil.get('/analysismodel/getByCategoryId/' + categoryId, null, function (data) {
      self.setState({ datasource: data.data });
    }, function (data) {

    });
  }
  changedHandle(analysisModelId) {
    const that = this;
    if (!this.props.analysisModelId) {
         this.props.analysisModelChange(analysisModelId);
    } else {
         confirm({
            title: '',
            content: '是否要切换',
            okText: '确认',
            cancelText: '取消',
            className:"bi bi-ant-confirm-confirm",
            onOk() {
              window.setDynamicFormHide = true; //防止第一次点击表格不出现
              if (that.props.setHasChangedAnalysisModel) {
                that.props.setHasChangedAnalysisModel(true);
              }
              that.props.analysisModelChange(analysisModelId);
            },
          });
    }
  }
  render() {
    const { analysisModelId } = this.props;
    return (
      <div className="mgb10">
        <Select
          key={Math.random()}
          // showSearch
          className="w100 borderRadius"
          placeholder={ "请选择" }
          optionFilterProp="children"
          filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
          onChange={this.changedHandle.bind(this)}
          value={(analysisModelId === '' || analysisModelId === undefined) ? "请选择" : analysisModelId}
        // defaultValue={this.state.datasource.length>0 && this.state.datasource[0].analysis_model$name}
        >
          {
            this.state.datasource ? this.state.datasource.map(function (v) {

              return <Option key={v.analysis_model$id} title={' '}>
                <Tooltip placement="topLeft" key={v.analysis_model$id} title={v.analysis_model$name}>
                {v.analysis_model$name}
                </Tooltip>
              </Option>
            }) : null
          }
        </Select>
      </div>
    )
  }
}

export default AnalysisModelSelect
