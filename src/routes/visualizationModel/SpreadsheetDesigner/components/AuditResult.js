import React, { Component } from 'react';
import { Modal, Button, Icon, Tooltip, Table, Badge } from '@vadp/ui';
import { getAuditResult, getAuditRule } from '../BudgetApi';
import { replaceCurrentYearAndCurrentDeptInFXDotFormula, } from '../budgetUtils/budgetRuntimeUtils';
import { updateDefaultMember } from '../BudgetRuntimeDvaModel';
import addressConverter from 'xlsx-populate/lib/addressConverter';
export function createAllRowPropsFormulaList({ pageParams, formulaList, rowProps, tableRows }) {
  const createFormulaList = [];
  const newPageParams = { ...pageParams, queryType: pageParams.queryType == 'manaAudit' ? '' : pageParams.queryType };

  for (let item of formulaList) {
    let value = replaceCurrentYearAndCurrentDeptInFXDotFormula(item, {}, newPageParams)
    if (value.includes('默认成员')) {
      let dimensionFormularArray = [];
      for (let i = 0; i < rowProps.length; i++) {
        if (rowProps[i].dimensionData) {
          if (rowProps[i].rowType == 'float') {
            if(tableRows[i].some((item) => (item.dimensionData && !item.dimensionData.value))){
              continue;
            }
          }
          let newValue = updateDefaultMember(value, pageParams, rowProps[i]);
          dimensionFormularArray.push({ value: newValue, rowDimension: i + 1 });
        }
      }
      createFormulaList.push(...dimensionFormularArray)
    } else {
      createFormulaList.push({ value })
    }
  }
  return createFormulaList;
}

export function replaceCellVal(formulaList, tableRows, pageParams) {
  let cellExps = [];
  let newFormulaList = [];
  console.log(formulaList, pageParams)
  let deptFormulaList = formulaList.filter(item => (!item.deptId || (item.deptId && item.deptId.key == pageParams.deptId)))
  for (let item of deptFormulaList) {
    let text = item.exp;
    let expmMap = getCellVal(text, tableRows);
    if (expmMap.b) {
      cellExps.push({ ...item, exp: expmMap.newText, title: text, members: expmMap.members })
    }
    newFormulaList.push({ exp: expmMap.newText, })
  }
  return { cellExps, newFormulaList };
}

function getCellVal(text, tableRows) {
  const regex = /([a-zA-Z]+)([\d0-9]+)/g;
  let result;
  let newText = text;
  let b = false;
  let members = [];
  while ((result = regex.exec(text), result !== null)) {
    let exp = result[0];
    let col = addressConverter.columnNameToNumber(result[1]) - 1;
    let row = result[2] - 1;
    let cell = tableRows[row][col];
    let map = {};
    if (cell) {
      newText = newText.replace(exp, cell.textBox.value || 0);
      map[exp] = cell.textBox.value || 0;
    } else {
      newText = newText.replace(exp, 0);
      map[exp] = 0;
    }
    members.push(map);
    b = true;
  }
  return { newText, b, members };
}

const expandedRowRender = (record, index, indent, expanded) => {
  const columns = [
    {
      title: '子公式',
      dataIndex: 'subformula',
      key: 'subformula',
      align: 'center',
      width: 320,
      render: (t, record, index) => (
        <Tooltip title={t}>{t}</Tooltip>
      ),
    },
    {
      title: '值',
      dataIndex: 'val',
      key: 'val',
      align: 'center',
      width: 50,
      render: (t, record, index) => (
        <Tooltip title={t}>{t}</Tooltip>
      ),
    },
  ];

  const recordData = record.values || [];
  recordData.map((c) => {
    let keys = Object.getOwnPropertyNames(c);
    c.subformula = keys[0];
    c.val = c[c.subformula];
  })
  console.log(recordData)

  return <Table columns={columns} dataSource={recordData} bordered={true} pagination={false} />;
};
class AuditResult extends Component {
  constructor(props) {
    super(props);
    this.state = { dataSource: [] }
  }
  columns = [
    {
      title: '序号',
      key: 'rowNumber',
      align: 'center',
      width: '5%',
      render: (t, c, i) => (i + 1)
    },
    {
      title: '表达式',
      key: 'exp',
      align: 'center',
      dataIndex: 'exp',
      render: (t, record, index) => (
        <Tooltip title={t}>{t}</Tooltip>
      ),
    },
    {
      title: '公式来源',
      key: 'type',
      align: 'center',
      dataIndex: 'type',
      width: '8%'
    },
    {
      title: '说明',
      key: 'ruleDesc',
      align: 'center',
      dataIndex: 'ruleDesc',
      width: '23%'
    },
    {
      title: '所在行',
      key: 'rowDimension',
      align: 'center',
      dataIndex: 'rowDimension',
      width: '9%'
    },
    {
      title: '结果',
      key: 'res',
      align: 'center',
      width: '15%',
      render: (t, record, index) => {
        return (record.success && record.result) ? (<Icon type="check-circle" style={{ color: 'green' }} />) : (<Icon type="close-circle" style={{ color: 'red' }} />)
      }
    }
  ];
  componentDidMount() {

    this.getData();
  }
  getData = async () => {
    const { templateId, pageParams, rowProps, tableRows } = this.props;
    let r = await getAuditRule({ biDataId: templateId });
    let formulaListMap = replaceCellVal(this.props.formulaList, tableRows, pageParams);
    let newFormulaList = [];
    let cellExps = formulaListMap.cellExps;
    if (r.datas) {
      r.datas.forEach(item => {
        let audit_rule = JSON.parse(item.audit_rule);
        newFormulaList.push({
          audit_rule,
          strategy_name: item.strategy_name
        })
      })
    }
    let copyNewFormulaList = newFormulaList.map(item => item.audit_rule).reduce((total, currentValue) => {
      return total.concat(currentValue);
    }, [])

    let formulaList = [...(formulaListMap.newFormulaList || []), ...copyNewFormulaList].map((c) => c.exp);



    let formulaListInfo = createAllRowPropsFormulaList({ pageParams, formulaList, rowProps, tableRows });
    console.log(formulaListInfo)
    formulaList = formulaListInfo.map(item => item.value);

    let res = await getAuditResult({ functions: formulaList });
    const { datas } = res;
    let dataSource = [];

    for (let key in datas) {
      let curKey = this.props.formulaList.find(item => item.exp == key);
      datas[key].ruleDesc = curKey ? curKey.ruleDesc : '';
      datas[key].exp = key;
      let currentKey = cellExps.find(item => item.exp == key);
      if (currentKey) {
        datas[key].exp = currentKey.title;
        datas[key].ruleDesc = currentKey.ruleDesc || '';//单元格引用得重新赋值一次
        datas[key].values.push(...currentKey.members)
      }
      let rowAndColCoordinates = formulaListInfo.find(item => item.value == key);
      datas[key].rowDimension = rowAndColCoordinates ? rowAndColCoordinates.rowDimension : '';
      let index = newFormulaList.findIndex(item => {
        let i = item.audit_rule.findIndex(c => c.exp == key);
        return i != -1;
      })
      if (index != -1) {
        datas[key].type = newFormulaList[index].strategy_name;
      } else {
        datas[key].type = '样表自身';
      }
      dataSource.push(datas[key]);
    }
    this.setState({ dataSource });
  }
  handleOk = () => {
    this.props.handleOk()
  }
  render() {
    const { visible, handleCancel } = this.props;
    const { dataSource } = this.state;
    return (
      <div >
        <Modal
          title="审核公式结果"
          visible={visible}
          onOk={this.handleOk}
          onCancel={handleCancel}
          bodyStyle={{ maxHeight: '375px' }}
          width={1200}
        >
          <div className='auditFormulaResults'>
            <Table locale={{ emptyText: '暂无数据' }}
              className="components-table-demo-nested"
              columns={this.columns} dataSource={dataSource}

              expandedRowRender={expandedRowRender} pagination={false} scroll={{ y: 335 }} />
          </div>
        </Modal>
      </div>
    );
  }
}

export default AuditResult;