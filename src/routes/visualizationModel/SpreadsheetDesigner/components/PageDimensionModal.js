import React, { Component } from 'react';
import { Button, Input, Radio, Select, Modal } from '@vadp/ui';
import { Table } from 'antd';
import { fetchDimensionValues } from '../BudgetApi';
import Message from '~/components/Public/Message';
import produce from 'immer';

export default class PageDimensionModal extends Component {
  constructor(props) {
    super(props);
    const pageDimensions = this.props.pageDimensions
      ? this.props.pageDimensions.map(p => ({ ...p }))
      : [];
    console.log('PageDimensionModal', pageDimensions);
    this.state = {
      pageDimensions,
      dims: [
        {
          id: 'MONEY_RESOURCE',
          dataKey: 'V_SYS_MONEY_RESOURCE',
          dimDisplay: '资金性质',
        },
        {
          id: 'ACCT_YEAR',
          dataKey: 'BUDG_YEAR',
          dimDisplay: '预算年度',
        },
        {
          id: 'DETAIL_ID',
          dataKey: 'SYS_BUDG_DETAIL',
          dimDisplay: '预算指标',
        }
      ],
      dimValuesMap: {},
    };
  }

  componentDidMount() {
    // 加载维度成员列表
    for (const { dimension, value } of this.state.pageDimensions) {
      this.fetchDimValues(dimension);
    }
  }

  handleOk = () => {
    const { pageDimensions } = this.state;
    if (pageDimensions.find(p => !p.value)) {
      Message.warning('请选择维度成员');
      return;
    }
    this.props.onOk(pageDimensions);
  }

  handleCancel = () => {
    this.props.onCancel();
  }

  handleAddClick = () => {
    const { selectedDimId, pageDimensions, dims, dimValuesMap } = this.state;
    const dimension = dims.find(d => d.id === selectedDimId);
    if (pageDimensions.find(p => p.dimension.id === dimension.id)) {
      Message.warning('不能重复添加维度');
      return;
    }
    this.setState({
      selectedDimId: undefined,
      pageDimensions: [
        ...pageDimensions, {
          dimension
        }]
    });
    // 查询维度成员
    if (!dimValuesMap[dimension.id]) {
      this.fetchDimValues(dimension);
    }
  }

  fetchDimValues(dimension) {
    const { id, dataKey } = dimension;
    fetchDimensionValues(dataKey, this.props.pageParams, undefined, dataKey === 'SYS_BUDG_DETAIL' ? true : undefined).then(values => {
      this.setState(produce(state => {
        state.dimValuesMap[id] = values;
      }));
    });
  }

  render() {
    const { dims, selectedDimId, pageDimensions } = this.state;
    const columns = [
      {
        title: '序号',
        dataIndex: 'rowNumber',
        width: '20%'
      },
      {
        title: '维度',
        dataIndex: 'dimDisplay',
        width: '30%'
      },
      {
        title: '维度成员',
        dataIndex: 'value',
        width: '30%',
        render: (text, record, i) => {
          const { dimValuesMap } = this.state;
          const { dimension, value } = record;
          const values = dimValuesMap[dimension.id];
          return (
            <Select
              labelInValue
              style={{ width: '100%' }}
              value={{ key: value && value.id }}
              onChange={(value, label) => {
                console.log(value, label);
                this.setState(produce(state => {
                  state.pageDimensions[i].value = label.props.item;
                }));
              }}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
            >
              {values && values.map(v => (
                <Select.Option value={v.id} item={v}>{v.display}</Select.Option>
              ))}
            </Select>
          );
        }
      },
      {
        title: '操作',
        dataIndex: 'value',
        width: '30%',
        render: (text, record, i) => {
          return <Button onClick={() => {
            this.setState(produce(state => {
              state.pageDimensions.splice(i, 1);
            }));
          }}>删除</Button>
        }
      },
    ];
    const dataSource = pageDimensions.map((p, i) => ({
      ...p,
      dimDisplay: p.dimension.dimDisplay,
      rowNumber: i + 1
    }));
    return (
      <Modal
        visible={this.props.visible}
        title='页面维度'
        onOk={this.handleOk}
        onCancel={this.handleCancel}
      >
        <div>
          <Select
            placeholder='请选择'
            value={selectedDimId}
            onChange={id => { this.setState({ selectedDimId: id }) }}
            style={{ width: '150px' }}
          >
            {dims.map(dim => (
              <Select.Option value={dim.id}>{dim.dimDisplay}</Select.Option>
            ))}
          </Select>
          <Button disabled={!selectedDimId} onClick={this.handleAddClick}>添加</Button>
          <Table
            columns={columns}
            dataSource={dataSource}
          />
        </div>
      </Modal>
    );
  }
}