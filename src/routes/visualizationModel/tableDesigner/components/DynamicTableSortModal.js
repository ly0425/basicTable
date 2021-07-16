import React, { Component } from 'react';
import { Radio, Select, Modal, Icon,InputNumber,Tooltip } from '@vadp/ui';
import DynamicTableUtil from './DynamicTableUtils';
const RadioGroup = Radio.Group;

const formItemStyle = {
  margin: '8px',
};
const sortoptions = [
  { label: '升序', value: 'ascend' },
  { label: '降序', value: 'descend' },
];

let sortList = ['+', '-', '*', '/', 'sum', 'SUM']
export default class DynamicTableSortModal extends Component {
  constructor(props) {
    super(props);
    let sort = JSON.parse(JSON.stringify(props.sort)) || [];
    let currentSort = sort[0];

    this.state = {
      sort,
      isSortGroupCol: false,
      SortGroupCol: props.tableRows && (props.tableRows[0].length || 0),
      order: 'ascend'
    }
    if (currentSort && sortList.findIndex(c => currentSort.sortfieldName.indexOf(c) != -1) != -1) {
      this.state = {
        sort: [], isSortGroupCol: true, SortGroupCol: currentSort.SortGroupCol, order: currentSort.order
      }
    }

  }
  addSortField = () => {
    const sortMap = {
      sortfieldName: '',
      order: 'ascend'
    }
    this.state.sort.push(sortMap);
    this.setState({
      sort: this.state.sort
    })
  }




  sortChange = (i, type, e) => {
    const sortMap = this.state.sort[i];
    let value = e.target ? e.target.value : e;
    if (type === 'field') {
      sortMap.sortfieldName = value;
    } else if (type === 'direction') {
      sortMap.order = value;
    }
    this.setState({
      sort: this.state.sort
    })

  }
  removeSortFiele = (i, e) => {
    this.state.sort.splice(i, 1);
    this.setState({
      sort: this.state.sort,
    })
  }
  renderSort = () => {

    const actionFileds = this.props.actionFileds;
    const select = this.state.sort.map((item, i) => {
      return (<div className='clearfix' style={{ marginBottom: '5px' }}>
        <div style={{ float: 'left' }}>
          <Select onSelect={this.sortChange.bind(this, i, 'field')} style={{ width: 200, marginBottom: '8px' }} value={item.sortfieldName}>
            {
              actionFileds.map((f) => {
                return (<Select.Option key={f.aliasName} value={f.aliasName}>
                  {f.comments}
                </Select.Option>);
              })
            }
          </Select>
        </div>
        <div style={{ float: 'left', marginLeft: '10px' }}>
          <RadioGroup options={sortoptions} value={item.order} onChange={this.sortChange.bind(this, i, 'direction')} />
          <Icon type="minus-circle" onClick={this.removeSortFiele.bind(this, i)} style={{ fontSize: 16, color: 'red', cursor: 'pointer' }} />
        </div>
      </div>)
    })
    return select;
  }
  render() {
    const options = [
      { label: '是', value: true },
      { label: '否', value: false },
    ];
    const { isSortGroupCol, SortGroupCol, order } = this.state;
    const { lastGroup, tableRows, table } = this.props;

    return (<Modal
      title="排序字段"
      visible={this.props.sortVisible}
      onOk={() => {
        this.props.setSortVisible(false);
        const { isSortGroupCol, SortGroupCol, order } = this.state;
        let sort;
        if (isSortGroupCol) {
          let i = SortGroupCol - 1;
          let cellTextbox;
          let groupFields = DynamicTableUtil.getDataSet(table).groupFields;
          const groupField = groupFields.find(g => g.name === lastGroup.name) || {};
          const expSet = groupField.headerExpressions || {};
          if (tableRows[lastGroup.endRow][lastGroup.colPosition].display) {
            cellTextbox = tableRows[lastGroup.endRow][i].textBox;
          } else {
            cellTextbox = tableRows[lastGroup.startRow][i].textBox;
          }
          let sortfieldName = expSet[cellTextbox.id] || cellTextbox.value;
          sort = [{ sortfieldName, order, SortGroupCol }];
        } else {
          sort = this.state.sort;
        }
        this.props.sortOk(sort);

      }}
      bodyStyle={{ height: '200px' }}
      onCancel={() => { this.props.setSortVisible(false) }}
    >
      <div style={formItemStyle}>
        {tableRows &&
          <React.Fragment>
            <Tooltip title={'可用来做选择对应列表达式排序'}>
            <h4 style={{ margin: 0 }}>是否设置默认列排序：</h4>
            </Tooltip>
            <div style={{ padding: '8px 8px 8px 14px' }}>
              <RadioGroup
                options={options}
                onChange={(e) => { this.setState({ isSortGroupCol: e.target.value }) }}
                value={isSortGroupCol}
              />
            </div>
          </React.Fragment>
        }

        {
          !isSortGroupCol ? (<div>
            <div>
              <Icon type="plus-circle" onClick={this.addSortField} style={{ fontSize: 16, float: 'right', cursor: 'pointer', marginTop: '3px' }} />
            </div>
            <div style={{ padding: '8px 0px 8px 8px' }}>
              {
                this.renderSort()
              }
            </div>
          </div>) : (<div>
            <p>默认排序列：</p>
            <RadioGroup options={sortoptions} value={order} onChange={(e) => { this.setState({ order: e.target.value }) }} />
            <Tooltip title={'请输入排序的列'}>
              <InputNumber min={lastGroup.colPosition + 1} max={tableRows[0].length} value={SortGroupCol}
                style={{ width: '100%', height: '34px', marginTop: '4px' }}
                onChange={(SortGroupCol) => { this.setState({ SortGroupCol }) }} />
            </Tooltip>
          </div>)
        }

      </div>
    </Modal >)
  }
}
