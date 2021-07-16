import React, { Component } from 'react';
import { Row, Col, Modal, Input, Select } from '@vadp/ui';
const Option = Select.Option;
import { fetchTemplateList, fetchIndexList } from '../SpreadsheetApi';

const periodList = [
  {
    "value": "0",
    "label": "0 本期"
  },
  {
    "value": "-1",
    "label": "-1 上期"
  },
  {
    "value": "-2",
    "label": "-2 上2期"
  },
  {
    "value": "-3",
    "label": "-3 上3期"
  },
  {
    "value": "-4",
    "label": "-4 上4期"
  },
  {
    "value": "-5",
    "label": "-5 上5期"
  },
  {
    "value": "-6",
    "label": "-6 上6期"
  },
  {
    "value": "-7",
    "label": "-7 上7期"
  },
  {
    "value": "-8",
    "label": "-8 上8期"
  },
  {
    "value": "-9",
    "label": "-9 上9期"
  },
  {
    "value": "-10",
    "label": "-10 上10期"
  },
  {
    "value": "-11",
    "label": "-11 上11期"
  },
  {
    "value": "-12",
    "label": "-12 上12期"
  },
  {
    "value": "1",
    "label": "1 下期"
  },
  {
    "value": "2",
    "label": "2 下2期"
  },
  {
    "value": "3",
    "label": "3 下3期"
  },
  {
    "value": "4",
    "label": "4 下4期"
  },
  {
    "value": "5",
    "label": "5 下5期"
  },
  {
    "value": "6",
    "label": "6 下6期"
  },
  {
    "value": "7",
    "label": "7 下7期"
  },
  {
    "value": "8",
    "label": "8 下8期"
  },
  {
    "value": "9",
    "label": "9 下9期"
  },
  {
    "value": "10",
    "label": "10 下10期"
  },
  {
    "value": "11",
    "label": "11 下11期"
  },
  {
    "value": "12",
    "label": "12 下12期"
  }
]
export default class CrossSelectModal extends Component {
  constructor(props) {
    super(props);
    const { funcItem } = this.props;
    const { params } = funcItem;
    this.state = {
      template: { id: '', loading: true, datasource: [] },
      index: { id: '', loading: true, datasource: [] },
    };
  }
  componentDidMount() {
    this.init();
  }
  async init() {
    const list = await fetchTemplateList(window.pageParams);
    const datasource = this.getTemplateListItems(list);
    this.setState(({ template }) => ({ template: { ...template, datasource } }));
  }
  getTemplateListItems(list) {
    // 名字重复时在后面显示编码，否则不显示
    const nameCountMap = new Map();
    for (const { reportName } of list) {
      if (nameCountMap.has(reportName)) {
        nameCountMap.set(reportName, nameCountMap.get(reportName) + 1);
      } else {
        nameCountMap.set(reportName, 1);
      }
    }
    return list.map(({ reportId, reportCode, reportName }) => ({
      value: reportId, text: nameCountMap.get(reportName) > 1 ? `${reportName}(${reportCode})` : reportName, reportId, reportName
    }));
  }
  handleValueChange = (param, value) => {
    let { values } = this.state;
    let { name } = param;
    values.set(name, value);
    this.setState({ values });
  };

  getFunctionString() {
    const { template, index } = this.state;
    const reportName = this.state.template.datasource.find(x => x.reportId === template.id).reportName;
    const period = this.state.period ? `, "${this.state.period}"` : '';
    return `${this.props.funcItem.title}("${reportName}", "${index.id}"${period})`;
  }
  handleTemplateChange = (value) => {
    this.setState(({ template }) => ({ template: { ...template, id: value } }), () => {
      const reportId = this.state.template.datasource.find(x => x.value === value).reportId;
      fetchIndexList(reportId).then(list => {
        this.setState(({ index }) => ({
          index: {
            ...index,
            datasource: list.map(({ indexId, indexCode, indexName }) => ({
              value: indexName, text: `${indexName}`
            })),
          }
        }));
      });
    });
  }
  handleIndexChange = (value) => {
    this.setState(({ index }) => ({ index: { ...index, id: value } }));
  }
  handlePeriodChange = (value) => {
    this.setState({ period: value });
  }
  render() {
    const { visible, onOk, onCancel } = this.props;
    const { template, index, period } = this.state;
    return (
      <Modal visible={visible} title='跨表取数函数参数选择'
        wrapClassName='bi'
        onOk={e => onOk(this.getFunctionString())}
        onCancel={onCancel}
        wrapClassName="bi"
      >
        <div className='functionParamsEditor'>
          <table><tbody>
            <tr>
              <td>模板：</td>
              <td>
                <Select
                  value={template.id}
                  loading={template.loading}
                  onChange={this.handleTemplateChange}
                  style={{ width: 300 }}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                >
                  {template.datasource.map(data => (
                    <Option key={data.value} value={data.value} title={data.text}>{data.text}</Option>
                  ))}
                </Select>
              </td>
            </tr>
            <tr>
              <td>指标：</td>
              <td>
                <Select
                  value={index.id}
                  loading={index.loading}
                  onChange={this.handleIndexChange}
                  style={{ width: 300 }}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                >
                  {index.datasource.map(data => (
                    <Option key={data.value} value={data.value} title={data.text}>{data.text}</Option>
                  ))}
                </Select>
              </td>
            </tr>
            <tr>
              <td>期间：</td>
              <td>
                <Select
                  value={period}
                  onChange={this.handlePeriodChange}
                  style={{ width: 300 }}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                >
                  {
                    periodList.map(item => (<Option key={item.value} value={item.value} title={item.label}>{item.label}</Option>))
                  }

                </Select>
              </td>
            </tr>
          </tbody></table>
        </div>
      </Modal>
    );
  }
}