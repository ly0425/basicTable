
import React, { Component } from 'react'
import { Modal, Button, Tabs, Transfer, message, Icon } from 'vadp-ui';
import PropTypes from 'prop-types';
import { fetchDimensionList, fetchMeasureList, fetchDimensionValues } from '../BudgetApi';
import BudgetScreenModal from './BudgetScreenModal';
import produce from 'immer';
import { validateWithLexerAndParser, ExpressionEditorModal } from 'components/Public/ExpressionEditor';
import { FormulaLexer } from '../formulaCalc/FormulaLexer';
import { FormulaParser } from '../formulaCalc/FormulaParser';
import { createExpressionCategaries, addCommonFunc, addMeasure } from './Expression/ExpFuncInfo';;
const { TabPane } = Tabs;
const tabTitle = [
  { tab: "行维度", key: "0" },
  { tab: "列维度", key: "1" },
  { tab: "下侧度量", key: "2" },
  { tab: "右侧度量", key: "3" },
  { tab: "条件参数", key: "4" },
];
const getUrlParameters = () => {
  var arr1 = window.location.href.split("?");
  var params = arr1[1].split("&");
  var obj = {};//声明对象
  for (var i = 0; i < params.length; i++) {
    var param = params[i].split("=");
    obj[param[0]] = param[1];//为对象赋值
  }
  return obj;
}
export class BudgetModal extends Component {
  constructor(props) {
    super(props)

    this.state = {
      visible: false,
      dataList: [],
      targetKeys: [],
      tabKeys: "0",
      //列维度
      rowDesc: [],
      //列维度
      dimension: [],
      //列维度下的度量
      measure: [],
      //列维度右边的度量
      secCol: [],
      //条件参数
      param: [],
      //选中条件参数的key
      paramKeys: [],
      screenMap: {
        iconVisible: false,
        screenData: [],
        screenEchoData: [],
      },
      expMap: {
        expVisible: false,
      },
      control: null,
    }
  }
  componentWillReceiveProps(nextProps) {

    const { plan } = nextProps;
    if (plan) {
      this.setState({
        rowDesc: plan.expandDesc.rowDesc.map(item => { return { ...item, key: item.dataKey, title: item.dimDisplay } }),
        dimension: plan.expandDesc.colDesc.firCol.dimension.map(item => { return { ...item, key: item.dataKey, title: item.dimDisplay } }),
        measure: plan.expandDesc.colDesc.firCol.measure.map(item => { return { ...item, key: item.id, title: item.expandDisplay } }),
        secCol: plan.expandDesc.colDesc.secCol.map(item => { return { ...item, key: item.id, title: item.expandDisplay } }),
        param: plan.param,
        paramKeys: plan.param.map(item => item.dataKey),
      })
    }
  }
  //获取数据
  getData = async () => {

    const { tabKeys } = this.state;
    const { pageParams } = this.props;
    let dataList;
    if (tabKeys === "0" || tabKeys === "1" || tabKeys === "4") {
      dataList = await fetchDimensionList(pageParams.modelId)
      dataList.forEach(item => {
        item.key = item.dataKey;
        item.title = item.dimDisplay;
        item.chosen = false
      })
    } else {
      dataList = await fetchMeasureList(pageParams.modelId)
      dataList.forEach(item => {
        item.key = item.id;
        item.title = item.expandDisplay;
        item.chosen = false;
      })
    }
    this.setState({
      dataList
    })
  }
  showModal = () => {
    this.getData()
    this.setState({
      visible: true
    })
  }
  handleOk = () => {
    const { rowDesc, dimension, measure, secCol, param } = this.state
    if (typeof this.props.getBugetModalData === 'function') {
      const Plan = {
        expandDesc: {
          /** 行维度 data_key 数组 */
          rowDesc: rowDesc.map(item => { return { dataKey: item.key, dimDisplay: item.title, id: item.id, selectedValues: item.selectedValues || [] } }),
          colDesc: {
            firCol: {
              /** 列维度 data_key 数组 */
              dimension: dimension.map(item => { return { dataKey: item.key, dimDisplay: item.title, id: item.id, selectedValues: item.selectedValues || [] } }),
              /** 列维度下面的度量 id 数组 */
              measure: measure.map(item => { return { id: item.key, expandDisplay: item.title, expr: item.expr } }),
            },
            /** 列维度右边的度量 id 数组 */
            secCol: secCol.map(item => { return { id: item.key, expandDisplay: item.title, expr: '' } }),
          }
        },
        param
      }

      this.props.getBugetModalData(Plan)
    } else {
      message.warning('使用组件时请传入调用函数getBugetModalData')
      return
    }
    this.handleCancel()
  }
  handleCancel = () => {
    this.setState({
      visible: false
    })
  }
  changeTabs = (key) => {
    this.setState({
      tabKeys: key,
      dataList: []

    }, () => {
      this.getData()
    })
  }
  //重置
  reloadData = () => {
    const { tabKeys } = this.state;
    this.handleChange([])
    this.changeTabs(tabKeys)
  }
  renderTabPane = () => {
    return tabTitle.map((item) => {
      return <TabPane tab={item.tab} key={item.key}>
        {this.renderTransfer(item.key)}
      </TabPane>
    })
  }
  renderTransfer = (key) => {
    const targetName = this.chooseDataByTabKeys(key);
    let targetKeys = this.state[targetName].map(item => {
      return item.key || item;
    })
    let dataSource = this.state.dataList;
    if (key == 0 || key == 1 || key == 2) {
      dataSource = produce(this.state.dataList, c => {
        targetKeys.forEach(item => {
          const i = c.findIndex(v => v.key == item);
          if (i != -1) {
            c[i].isRight = true;
          }
        })
      })
    }
    return <Transfer
      dataSource={dataSource}
      showSearch
      listStyle={{
        width: 250,
        height: 300,
      }}
      targetKeys={targetKeys}
      onChange={this.handleChange}
      footer={this.renderFooter}
      render={item => {
        return (<div style={{ width: '195px', display: 'inline-block' }}>
          <span>{item.title}</span>
          {item.isRight && <Icon onClick={(e) => { this.iconClick(item.key, e) }} type="plus-circle" style={{ fontSize: 14, color: 'red', float: 'right' }} />}
        </div>)
      }}
    />
  }
  iconClick = (targetKeys, e) => {
    e.stopPropagation();
    const { tabKeys } = this.state;
    this.rightSelectKey = targetKeys;
    if (tabKeys == 0 || tabKeys == 1) {
      this.dimensionScreen(targetKeys, tabKeys);
    } else if (tabKeys == 2) {
      this.easureExp();
    }
  }
  easureExp = () => {
    const validate = validateWithLexerAndParser(FormulaLexer, FormulaParser, 'exprRoot');
    let targetName = this.chooseDataByTabKeys(this.state.tabKeys);
    const currentSelect = this.state[targetName];
    const index = currentSelect.findIndex(i => i.key == this.rightSelectKey);
    let categaries = createExpressionCategaries(true)(addCommonFunc, true)(addMeasure, false, this.state.measure);
    this.setState({
      control: (<ExpressionEditorModal
        visible={true}
        defaultText={currentSelect[index].expr || ''}
        title='表达式编辑器'
        categaries={categaries}
        onOk={this.onOkExpression.bind(this)}
        onCancel={() => { this.setState({ expMap: { expVisible: false } }) }}
        validate={validate}
      />),
      expMap: {
        expVisible: true
      }
    })
  }
  onOkExpression(v) {
    const { tabKeys } = this.state;
    let targetName = this.chooseDataByTabKeys(tabKeys)
    let vs = produce(this.state[targetName], d => {
      const index = d.findIndex(i => i.key == this.rightSelectKey);
      d[index].expr = v;
    })
    this.setState({ [targetName]: vs, expMap: { expVisible: false } });
  }
  dimensionScreen = async (targetKeys, tabKeys) => {
    const { pageParams } = this.props;
    let screenData = await fetchDimensionValues(targetKeys, pageParams || {});
    let targetName = this.chooseDataByTabKeys(tabKeys);
    let screenEchoData = this.state[targetName].filter(i => i.key == this.rightSelectKey)[0].selectedValues || [];
    this.setState({
      screenMap: {
        iconVisible: true,
        screenData,
        screenEchoData
      }
    })
  }
  chooseDataByTabKeys = (tabKeys) => {
    let targetName
    switch (tabKeys) {
      case "1":
        targetName = "dimension"
        break;
      case "2":
        targetName = "measure"
        break;
      case "3":
        targetName = "secCol"
        break;
      case "4":
        targetName = "paramKeys"
        break;
      default:
        targetName = "rowDesc"
        break;
    }
    return targetName
  }
  handleChange = targetKeys => {
    const { tabKeys, dataList } = this.state;
    let targetName = this.chooseDataByTabKeys(tabKeys)
    if (tabKeys !== "4") {
      let targetList = [];
      targetKeys.forEach(v => {
        let current = dataList.filter(item => item.key == v)[0];
        targetList.push(current);
      })
      this.setState({ [targetName]: targetList });
    } else {
      //条件参数

      let param = []
      dataList.forEach((item) => {

        if (targetKeys.includes(item.key)) {
          param.push({
            id: item.id,
            dataKey: item.dataKey,
            dimDisplay: item.title,
          })
        }
      })
      this.setState({
        paramKeys: targetKeys,
        param
      })
    }
  };
  renderFooter = () => (
    <Button size="small" style={{ float: 'right', margin: 5 }} onClick={this.reloadData}>
      重置
    </Button>
  );
  screenOk = (datas) => {
    const { tabKeys } = this.state;
    let targetName = this.chooseDataByTabKeys(tabKeys)
    let vs = produce(this.state[targetName], d => {
      const index = d.findIndex(i => i.key == this.rightSelectKey);
      d[index].selectedValues = datas;
    })
    this.setState({ [targetName]: vs, screenMap: { iconVisible: false } });
  }
  render() {
    const settingElement = this.state.expMap.expVisible ? this.state.control : <span></span>;
    return (
      <div className="budgetModalWrapper">
        <Button onClick={this.showModal}>预算参数选择</Button>
        <Modal
          title="预算参数设置"
          width={660}
          visible={this.state.visible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          wrapClassName="budgetModalWrapper"
        >
          <Tabs defaultActiveKey="0" onChange={this.changeTabs}>
            {this.renderTabPane()}
          </Tabs>
        </Modal>
        {
          this.state.screenMap.iconVisible && < BudgetScreenModal
            visible={this.state.screenMap.iconVisible}
            handleOk={this.screenOk}
            handleCancel={() => { this.setState({ screenMap: { iconVisible: false } }) }}
            data={this.state.screenMap.screenData}
            echoData={this.state.screenMap.screenEchoData}
          />
        }
        {settingElement}
      </div>
    )
  }
}
BudgetModal.propTypes = {
  getBugetModalData: PropTypes.func.isRequired
}
export default BudgetModal
