/**
 * 汇总公式弹窗
 * 汇总公式格式：FX.取编制数( D.预算年度$维度ID__D.版本$维度ID__D.预算指标$维度ID , E.数量 ，T.样表$样表ID)
 * 其中“维度ID”来自与不同表下的维度，所以添加维度公式时会存一个显示名称，一个提交的汇总公式
 * 暂添加过的公式修改只会修改显示名称，无法修改对应的提交值
 */
import React from 'react';
import { Modal, Input, Button, Tooltip, Table, Spin, message, Select } from '@vadp/ui';
import { fetchTableListData, fetchTableDimensionInfo, fetchDimensionValues } from '../BudgetApi';
import '../../../../style/pages/GatherModal.less';

const { Option } = Select;

const commonItems = [
  { text: '(', value: '(', title: '左括号' },
  { text: ')', value: ')', title: '右括号' },
  { text: ',', value: ',', title: '逗号' },
  { text: '+', value: '+', title: '加' },
  { text: '-', value: '-', title: '减' },
  { text: '×', value: '*', title: '乘' },
  { text: '÷', value: '/', title: '除' },
  { text: '>', value: '>', title: '大于' },
  { text: '<', value: '<', title: '小于' },
];

const TableListItem = ({ item, selected, handleClick }) => {
  const selectedClass = selected ? 'table-list-item-active' : '';
  return <div
    title={item.template_name}
    className={`table-list-item ${selectedClass}`}
    onClick={(e) => handleClick(e, item)}
  >
    {item.template_name}
  </div>;
};

class GatherModal extends React.PureComponent {

  constructor() {
    super();
    this.inputRef = React.createRef();
    this.state = {
      formulaTextValue: '', // 输入框值
      formulaTextSubmitValue: '', // 提交数值
      templateId: '', // 当前选中样表id
      tableList: [], // 当前样表数据集合
      selectedTableItem: undefined, // 选中样表
      currentTableInfo: undefined, // 当前加载出来的样表的维度信息
      currentTableData: [], // 当前加载出来表格数据
      loading: false,
    };
    this.loadTableListData();
  }

  // 加载所有的样表数据
  loadTableListData = async () => {
    try {
      this.setState({
        loading: true
      });
      const list = await fetchTableListData();
      const tableList = list.datas.map(item => {
        return item;
      });
      this.setState({
        tableList,
        loading: false,
      });
    } catch (e) {
      console.log(e, 'e');
      this.setState({
        loading: false
      });
    }
  }

  // 渲染表样列表
  renderTableList = () => {
    const { tableList, selectedTableItem } = this.state;
    if (tableList.length === 0) {
      return <div>暂无数据!</div>
    }
    return tableList.map(item => {
      const selected = selectedTableItem && selectedTableItem.template_id === item.template_id;
      return <TableListItem
        key={item.temlate_id}
        item={item}
        selected={selected}
        handleClick={this.clickTableItem}
      />;
    });
  }

  // 点击表样单项
  clickTableItem = async (e, item) => {
    this.setState({
      selectedTableItem: item,
      loading: true,
      currentTableData: [],
      templateId: item.template_id,
    });
    const params = JSON.stringify({ templateId: item.template_id });
    const info = await fetchTableDimensionInfo(params);
    if (info.datas && info.datas.length > 0) {
      let obj = {};
      for (let i = 0, l = info.datas.length; i < l; i++) {
        const d = info.datas[i];
        if (d.dataKey) {
          if (!obj[d.id]) {
            const list = await fetchDimensionValues(
              d.dataKey,
              { ...this.props.pageParams, isLast: 0 }
            );
            // 所有的度量都默认添加“全部”
            list.unshift({
              id: 'ALL',
              display: '全部',
              code: 'ALL',
            });
            obj[d.id] = list.map(v => v);
          }
        }
      }
      this.setState({
        currentTableInfo: info.datas,
        loading: false,
        ...obj,
      });
    } else {
      this.setState({
        currentTableInfo: undefined,
        loading: false
      });
    }
  }

  renderCommonItems() {
    return (<div className='audit-formula-operator'>
      {commonItems.map(item => (
        <Tooltip key={item.value} title={item.title} placement="bottom">
          <span><Button onClick={() => this.addOperator(item.value)}>{item.text}</Button></span>
        </Tooltip>
      ))}
    </div>);
  }

  addOperator = (value) => {
    const { formulaTextValue, formulaTextSubmitValue } = this.state;
    // const { selectionStart, selectionEnd } = this.inputRef.current.input;
    // const newValue = formulaTextValue.substring(0, selectionStart) + value + formulaTextValue.substring(selectionEnd, formulaTextValue.length);
    // const t = `#${value}#`;
    // const submitValue = formulaTextSubmitValue.substring(0, selectionStart) + t + formulaTextSubmitValue.substring(selectionEnd, formulaTextSubmitValue.length);
    // this.setState({
    //   formulaTextValue: newValue,
    //   formulaTextSubmitValue: submitValue,
    // });
    const newValue = formulaTextValue + value;
    const t = `#${value}#`;
    const submitValue = formulaTextSubmitValue + t;
    this.setState({
      formulaTextValue: newValue,
      formulaTextSubmitValue: submitValue,
    });
  }

  handleChangeFormulaText = (e) => {
    // 删除数据的时候， 需要把对应的提交值进行修改?
    if (!e.target.value) {
      this.setState({
        formulaTextSubmitValue: '',
      });
    }
    this.setState({
      formulaTextValue: e.target.value
    });
  }

  renderTable = () => {
    const { currentTableInfo, currentTableData } = this.state;
    if (currentTableInfo) {
      let obj = {};
      let firstColumn;
      const columns = currentTableInfo.map((item, index) => {
        if (index === 0) {
          firstColumn = item.id;
        }
        return {
          key: item.id,
          id: item.id,
          dataIndex: item.id,
          editing: false,
          title: item.display,
          render: (text, record, index) => this.renderCell(text, record, index, item.id),
        };
      });
      if (columns && columns.length > 0) {
        columns.push({
          title: '操作',
          dataIndex: 'operation',
          render: (text, record, index) => {
            const editing = record[firstColumn].editing;
            return (<div>
                {editing && <React.Fragment>
                  <a onClick={() => this.addNewRowInfo(text, record, index)}>添加</a>
                  {/* <a style={{marginLeft: '6px'}} onClick={() => this.cancelAddNewRowInfo(index)}>取消</a> */}
                </React.Fragment>}
                {/* {false && !editing && <a onClick={() => this.cancelAddNewRowInfo(index)}>删除</a>} */}
              </div>
            )
          }
        });
        return <Table size={'middle'} dataSource={currentTableData} columns={columns} />;
      }
      return <div>暂无数据</div>;
    } else {
      return <div>暂无数据</div>;
    }
  }
  // 渲染单元格
  renderCell = (text, record, index, dataIndex) => {
    return <TableCell
      value={text.value}
      info={text}
      handleChange={(value, option) => this.handleCellChange(index, value, option, record, dataIndex)}
    />
  }

  // 单元格内容修改
  handleCellChange = (index, value, option, record, dataIndex) => {
    const { currentTableData } = this.state;
    const newData = currentTableData.slice();
    newData[index][dataIndex].value = value;
    newData[index][dataIndex].name = option.props.children;
    this.setState({
      currentTableData: newData
    })
  }

  // 添加一行
  addRow = () => {
    const { currentTableData, currentTableInfo } = this.state;
    let obj = {};
    currentTableInfo.forEach(item => {
      if (item.dataKey) {
        obj[item.id] = {
          value: '', // 提交数据
          name: '', // 输入框显示名称
          options: this.state[item.id],
          editing: true
        }
      } else {
        obj[item.id] = {
          value: item.display,
          name: item.display,
          editing: false
        }
      }
    });
    this.setState({
      currentTableData: [...currentTableData, obj]
    })
  }

  // 确认添加新的一行 会有多个维度，但只会有一个预算值
  addNewRowInfo = (text, record, index) => {
    const { currentTableData, currentTableInfo, formulaTextValue, formulaTextSubmitValue,
      templateId, selectedTableItem } = this.state;
    const newData = currentTableData.slice();
    const dimensionNameArray = []; // 存放当前维度名称
    const dimensionValueArray = []; // 存放当前维度值
    let measureStr = '';
    currentTableInfo.forEach(key => {
      const info = newData[index][key.id]
      if (info.value) {
        if (key.dataKey) {
          dimensionNameArray.push(`D.${key.display}$${info.name}`);
          dimensionValueArray.push(`D.${key.display}$${info.value}`);
        } else {
          measureStr = `${info.name}`;
        }
      }
    });
    if (dimensionNameArray.length === 0) {
      message.warn('请至少选择一个维度成员');
      return false;
    }
    currentTableInfo.forEach(key => {
      newData[index][key.id].editing = false;
    });
    const dStr = dimensionNameArray.join('__');
    const dStrValue = dimensionValueArray.join('__');
    let value = '';
    let submitValue = '';
    if (!formulaTextValue) {
      value = `=FX.取编制数(${dStr}, ${measureStr})`;
      submitValue = `=FX.取编制数(${dStrValue}, E.${measureStr}, T.样表$${templateId})`;
    } else {
      value = `${formulaTextValue}FX.取编制数(${dStr}, ${measureStr})`;
      submitValue = `${formulaTextSubmitValue}FX.取编制数(${dStrValue}, E.${measureStr}, T.样表$${templateId})`;
    }
    this.setState({
      currentTableData: newData,
      formulaTextValue: value,
      formulaTextSubmitValue: submitValue
    });
  }

  cancelAddNewRowInfo = (index) => {
    const { currentTableData } = this.state;
    const data = currentTableData.slice();
    this.setState({
      currentTableData: [...data.slice(0, index), ...data.slice(index + 1)]
    })
  }

  afterClose = () => {
    this.setState({
      formulaTextValue: '', // 输入框值
      formulaTextSubmitValue: '', // 提交数值
      templateId: '', // 当前选中样表id
      selectedTableItem: undefined, // 选中样表
      currentTableInfo: undefined, // 当前加载出来的样表的维度信息
      currentTableData: [], // 当前加载出来表格数据
      loading: false,
    })
  }

  /**
   * 提交汇总公式
   * 汇总公式提交给后端格式： FX.取编制数( D.预算年度$id__D.版本$id__D.预算指标$id , E.数量 ，T.样表$id)
   */
  confirm = () => {
    const { formulaTextValue, formulaTextSubmitValue } = this.state;
    if (formulaTextValue && formulaTextSubmitValue) {
      this.props.confirmInfo(formulaTextValue, formulaTextSubmitValue);
    } else {
      message.warn('请选择表样及维度信息！');
    }
  }

  render() {
    const { visible, title, hideGatherModal } = this.props;
    const { formulaTextValue, loading, currentTableInfo } = this.state;
    return (<Modal
      visible={visible}
      title={title || '汇总公式'}
      width={1400}
      maskClosable={false}
      afterClose={this.afterClose}
      onCancel={hideGatherModal}
      onOk={this.confirm}
    >
    <Input
      ref={this.inputRef}
      value={formulaTextValue}
      onChange={this.handleChangeFormulaText}
      className='gather-modal-input'
    />
    {this.renderCommonItems()}
    {loading && <div className='gather-modal-loading'>
      <Spin tip="Loading..." size='large' className='spin-loading' />
    </div>}
    <section className='gather-modal-container'>
      <ul className='gather-modal-list'>
        <li className='gather-modal-list-item'>
          <div className='table-list-container'>
            {this.renderTableList()}
          </div>
        </li>
        <li className='gather-modal-list-item'>
          {currentTableInfo && <React.Fragment>
              <Button onClick={this.addRow}>新增</Button>
              <div className='table-container'>
                {this.renderTable()}
              </div>
            </React.Fragment>
          }
          {
            !currentTableInfo && <div className='no-data'>暂无数据</div>
          }
        </li>
      </ul>
    </section>
    </Modal>);
  }
}

class TableCell extends React.PureComponent {
  constructor() {
    super();
  }

  render() {
    const { value, handleChange, info } = this.props;
    const { options = [] } = info;
    return (<React.Fragment>
      {info.editing && <Select
        value={value}
        onChange={handleChange}
        style={{width: '200px'}}
        showSearch={true}
        filterOption={(input, option) =>
          option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
        }
      >
        {options.map(o => {
          return <Option value={o.id}>{o.display}</Option>
        })}
      </Select>}
      {!info.editing && <span>{info.name}</span>}
    </React.Fragment>);
  }
}


export default GatherModal;
