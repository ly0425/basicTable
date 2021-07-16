import { connect } from 'react-redux';
import React, { Component } from 'react';
import { Tooltip, Select, Radio, Input } from '@vadp/ui';
import Message from 'public/Message';
import produce from 'immer';
import { shortcutToolbarSignal } from 'public/ShortcutToolbar/signal';
import {
  updateReportGroupsExp
} from '../DynamicTableActions';
import { ExpressionEditor, validateWithLexerAndParser, ExpressionEditorModal } from 'components/Public/ExpressionEditor';
import { createExpressionCategaries, addField, addVariable, addCommonFunc, addAggregationFn, addParameterSettings, addContexts, addSpecialField } from '../expressionEngine/ExpressionCategory';
import { ExpressionLexer } from '../expressionEngine/ExpressionLexer';
import { ExpressionParser } from '../expressionEngine/ExpressionParser';
import { analysisModel } from 'public/analysisModel';
import { getProcInfo, analysisModelIdAdd } from 'components/Public/Fields.js';
const Option = Select.Option;
const RadioGroup = Radio.Group;
const spanCss = {
  marginTop: 5,
  width: '70px',
  marginLeft: '20px'
};
class MessageProprrty extends Component {
  constructor(props) {
    super(props);
    this.headSignal = shortcutToolbarSignal.getByControlID('messagePropByHead');
    this.FootSignal = shortcutToolbarSignal.getByControlID('messagePropByFoot');
    this.state = {
      visible: false,
      control: <div />,
      modelFields: [],//分析模型所有字段，包括存储过程和api
      procList: [],
    }
  }
  componentDidMount () {
    this.getAnalysismodelFields(this.props)
  }
  componentWillReceiveProps (nextProps) {
    this.getAnalysismodelFields(nextProps);
  }
  handleChangeValue = (e, type, headOrFootType) => {
    const val = e.target ? e.target.value : e;
    headOrFootType === 'header' ? this.headSignal.action.dispatch({ val, type }) : this.FootSignal.action.dispatch({ val, type });
  }
  expClick = () => {
    let fields = this.state.modelFields;
    const validate = validateWithLexerAndParser(ExpressionLexer, ExpressionParser, 'exe');
    const variableList = this.props.variableList || [];
    const control = (<ExpressionEditorModal
      visible
      defaultText={this.props.reportGroupsExp.value || ''}
      title='表达式编辑器'
      categaries={
        createExpressionCategaries(true)(addField, true, fields)(addParameterSettings, true, this.state.procList)(addVariable, true, variableList)(addContexts, true)(addSpecialField, true)(addCommonFunc, true)(addAggregationFn, false)}
      onOk={this.onOkExpression.bind(this)}
      onCancel={() => {
        this.setState({
          visible: false,
        });
      }}
      validate={(text) => {
        return validate(text[0] === '=' ? text.slice(1) : text)
      }}
    />);
    this.setState({ visible: true, control })
  }
  onOkExpression = (v) => {

    console.log(v)
    let obj = { ...this.props.reportGroupsExp, value: v }
    if (!v) {
      obj.textboxId = '';
      obj.formatString = '';
    }
    this.props.dispatch(updateReportGroupsExp({ reportGroupsExp: obj }))
    this.setState({ visible: false, control: null })
  }
  async getAnalysismodelFields (props) {
    let fields = [];
    let procList = [];
    let type = props.datasource && props.datasource.serviceType;
    if (props.datasource && props.datasource.connectInfo) {
      analysisModel.getFields(props.datasource, null).forEach((item) => {
        fields.push({
          ...item,
          dataType: analysisModel.getFieldDataType(item),
        });
      });
    }
    fields = analysisModelIdAdd(props.analysisModuleId, fields);
    if (fields.length !== 0) {
      fields.forEach((item) => {
        item.fieldName = `Fields.${item.fieldName}`
      })
    }
    if (!type) { //暂时把存储过程注掉，回头做
      procList = JSON.parse(JSON.stringify(fields));
    } else {
      let params = {};
      if (props.datasource && props.datasource.tableList) {
        params = { procName: props.datasource.tableList[0] ? props.datasource.tableList[0]['displayName'] : null, analysisModelId: props.analysisModuleId }
      }
      params.apiName = props.datasource.procedureName;
      procList = await getProcInfo(params);
    }

    this.setState({
      modelFields: fields,
      procList,
    })
  }
  render () {
    const header = this.props.header;
    const footer = this.props.footer;
    const settingElement = this.state.visible ? this.state.control : <span></span>;
    const radioOption = [{ label: '是', value: true }, { label: '否', value: false }];
    return (
      <div style={{ width: '270px' }}>
        <div className="divCss" >
          <span className=" w76 fll" style={spanCss}>表格头显示 :</span>
          <div style={{ display: 'inline-block', width: '59%', marginLeft: '14px' }}>
            <RadioGroup options={radioOption} onChange={(e) => this.handleChangeValue(e, 'isShow', 'header')} value={header.isShow} />
          </div>
        </div>
        <div className="divCss" >
          <span className=" w76 fll" style={spanCss}>表格尾显示 :</span>
          <div style={{ display: 'inline-block', width: '59%', marginLeft: '14px' }}>
            <RadioGroup options={radioOption} onChange={(e) => this.handleChangeValue(e, 'isShow', 'footer')} value={footer.isShow} />
          </div>
        </div>
        <div className="divCss" >
          <span className=" w76 fll" style={spanCss}>报表分组表达式 :</span>
          <div style={{ display: 'inline-block', width: '59%', marginLeft: '14px' }}>
            <Input
              addonAfter={
                <Tooltip placement="bottom" title={'表达式编辑器'}>
                  <span
                    onClick={this.expClick}
                    style={{ cursor: 'pointer' }}
                  >...</span>
                </Tooltip>
              }
              value={this.props.reportGroupsExp.value}
              disabled
            />
          </div>
        </div>
        {settingElement}

        {
          this.props.reportGroupsExp.value && (
            <div className="divCss" >
              <Tooltip placement="bottom" title={'例如部门{0}的报告,{这里是报表分组表达式}'}>
                <span className=" w76 fll" style={spanCss}>分组格式显示 :</span>
              </Tooltip>
              <div style={{ display: 'inline-block', width: '59%', marginLeft: '14px' }}>
                <Input

                  value={this.props.reportGroupsExp.formatString}
                  onChange={(e) => {
                    this.props.dispatch(updateReportGroupsExp({ reportGroupsExp: { ...this.props.reportGroupsExp, formatString: e.target.value } }))
                  }}
                />
              </div>
            </div>
          )
        }
      </div>


    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    header: state.DynamicTableReducer.Header,
    footer: state.DynamicTableReducer.Footer,
    reportGroupsExp: state.DynamicTableReducer.reportGroupsExp,
    analysisModuleId: state.analysisModel.analysisModelId,
    datasource: state.chartDataSource.datasource,
  };
};
export default connect(mapStateToProps)(MessageProprrty);
