/**
 * Created by admin on 2017/11/16.
 */
import React, { Component } from 'react';
import { Modal, Menu, Button, Select, InputNumber, Checkbox } from '@vadp/ui';
import Message from 'public/Message';
import PropertyUtils from '../PropertyUtils';
// function crtTimeFtt(val, row) {
//     if (val != null) {
//             var date = new Date(val);
//             return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
//         }
// }
// const SSF = {
//   format:function(General,v){
//    return crtTimeFtt(v)
//   }
// }

const formatOptionNumber = [
  1230,
  -4560,
  4156,
  9956,
];
const dateArrayList = [
  'yyyy-MM-dd',
  'yyyy-MM-dd HH:mm',
  'yyyy"年"MM"月"dd"日"',
  'yyyy"年"MM"月"dd"日" HH:mm',
  'yyyy/MM/dd',
  'dd-MM-yyyy',
];
const Option = Select.Option;
const divTileTow = { overflow: "hidden", margin: '8px 0px', width: "100%" };
const currencyItems = [
  {
    value: '￥',
    label: '￥',
  },
  {
    value: '$',
    label: '$',
  },
];
const defaultFormatData = {
  type: '',
  num: 2,
  thousandth: false,
  percent: false,
  currency: '',
};
const divTitle = {
  width: '30%',
  lineHeight: '30px',
  float: "left"
};

const getFormatData = (formatObject, decimalPlace) => {
  let pattern = formatObject.pattern;
  const formatData = {
    type: formatObject.type,
  };
  if (formatObject.type === 'Date') {
    formatData.pattern = formatObject.pattern;
  } else {
    pattern = pattern.split(';')[0];
    formatData.percent = pattern.slice(-1) === '%';
    if (/"[$￥]"/.test(pattern.slice(0, 3))) {
      formatData.currency = pattern.slice(1, 2);
    }
    formatData.thousandth = /#,##/.test(pattern);
    if (pattern.toLowerCase() === 'general') {
      formatData.num = decimalPlace ? decimalPlace : 2;
    } else {
      const r = /\.(0+)/.exec(pattern);
      if (r) {
        formatData.num = r[1].length;
      } else {
        formatData.num = 0;
      }
    }
  }
  return formatData;
};
const getFormatObject = (formatData) => {
  const formatObject = {};
  formatObject.type = formatData.type;
  if (formatData.type === 'Date') {
    formatObject.pattern = formatData.pattern;
  } else {
    formatObject.pattern = '';
    if (formatData.currency) {
      formatObject.pattern += `"${formatData.currency}"`;
    }
    if (formatData.thousandth) {
      formatObject.pattern += '#,##';
    }
    formatObject.pattern += '0';
    if (formatData.num > 0) {
      formatObject.pattern += `.${'0'.repeat(formatData.num)}`;
    }

    if (formatData.percent) {
      formatObject.pattern += '%';
    }
    formatObject.pattern = `${formatObject.pattern};-${formatObject.pattern}`;
  }
  return formatObject;
};

class FormatType extends Component {
  static defaultProps = {
    formatObject: {},
    contentSourceStyle: '',
  };
  constructor(props) {
    super(props);
    const formatObject = props.formatObject;
    const { decimalPlace } = this.props.pageParams;
    if (decimalPlace) {
      defaultFormatData.num = decimalPlace;
    }
    this.state = {
      selectedIndex: formatObject.type || props.contentSourceStyle,
      formatData: formatObject.pattern ? getFormatData(formatObject, decimalPlace) : { ...defaultFormatData },
    };
    if (!this.state.formatData.type) {
      this.state.formatData.type = props.contentSourceStyle;
    }
    if (this.state.formatData.type === 'Date') {
      this.state.value = '2017-07-07 07:07:07';
    } else {
      this.state.value = 12345;
    }
  }
  componentWillReceiveProps(nextProps) {
    const formatObject = nextProps.formatObject;
    const type = formatObject.type || nextProps.contentSourceStyle;
    const formatData = formatObject.pattern ?
      getFormatData(formatObject) :
      { ...defaultFormatData };
    if (!formatData.type) {
      formatData.type = type;
    }
    this.setState({
      selectedIndex: formatObject.type || nextProps.contentSourceStyle,
      formatData,
      value: type === 'Date' ? Date.parse('2017-07-07 07:07:07') : 12345,
    });
  }
  onSelect = (e) => {
    if (e.keyPath.length !== 0) {
      const formatDatas = { ...defaultFormatData, ...this.state.formatData };
      formatDatas.thousandth = false;
      formatDatas.percent = false;
      formatDatas.currency = '';
      formatDatas.type = e.key;
      if (formatDatas.type === 'Currency') {
        formatDatas.currency = currencyItems[0].label;
      } else if (formatDatas.type === 'Percent') {
        formatDatas.percent = true;
      }
      this.setState({
        selectedIndex: e.key,
        formatData: formatDatas,
      });
    }
  };
  onNumChange = (num) => {
    if (num > 5 || num < 0) {
      Message.warning('请输入一个0~5之间的数值');
      return;
    }
    this.setState({
      value: parseFloat(this.state.value),
      formatData: { ...this.state.formatData, num },
    });
  };
  onCheckboxChange = (e) => {
    this.state.formatData.thousandth = e.target.checked;
    this.setState({
      formatData: this.state.formatData,
    });
  }
  onCurrencyChange = (currency) => {
    this.setState({
      formatData: { ...this.state.formatData, currency },
    });
  }
  onSubmit = () => {
    const result = { ...this.state.formatData, type: this.state.selectedIndex };
    this.props.onOk(getFormatObject(result));
  }
  onCancel = () => {
    this.props.onCancel();
  }
  onDateClick = (item) => {
    this.setState({ formatData: { ...this.state.formatData, pattern: item } });
  };
  // －－－－样式有修改，所有的display：flex布局在IE10上失效，所以真对getFormatItems进行了修改－－－－

  getExampleValue = () => {
    const fo = getFormatObject(this.state.formatData);
    return PropertyUtils.conversionFormat(this.state.value, fo);
  }
  getFormatObject = (pattern) => {
    const formatData = { ...this.state.formatData, pattern };
    const fo = getFormatObject(formatData);
    return fo;
  }
  getFormatItems = (type) => {
    if (type === 'Date') {
      return {
        Date: {
          name: '日期',
          remarks: '日期格式把数值格式为一般的日期值',
          form: (
            <div style={{ height: '90%', flexDirection: 'column' }}>
              <div style={{ width: '100%', overflow: 'hidden' }}>
                <div style={divTitle}>示例</div>
                <span style={{ lineHeight: '30px', float: 'left' }}>{this.getExampleValue()}</span>
              </div>
              <div style={{ width: "100%", overflow: "hidden", marginTop: '8px', flex: 1 }}>
                <div style={divTitle}>类型</div>
                <div style={{ height: '100%', float: "left", width: "70%" }} className="negative-number">
                  {dateArrayList.map((item) => {
                    const style = { width: '100%', marginTop: '5px', cursor: 'pointer' };
                    if (this.state.formatData.pattern === item) {
                      style.backgroundColor = '#108EE9';
                    }
                    const example = PropertyUtils.conversionFormat(this.state.value, this.getFormatObject(item));
                    return (<div
                      key={item}
                      style={style}
                      onClick={this.onDateClick.bind(this, item)}
                    >
                      {example}
                    </div>);
                  })}
                </div>
              </div>
            </div>
          ),
        },
      };
    } else {
      return {
        Number: {
          name: '数值',
          remarks: '数值格式用于一般数字的表示',
          form: (
            <div style={{ height: '90%' }}>
              <div style={{ display: 'flex' }}>
                <div style={divTitle}>示例</div>
                <span style={{ lineHeight: '30px', float: 'left' }}>{this.getExampleValue()}</span>
              </div>
              <div style={divTileTow}>
                <div style={divTitle}>
                  小数位数
                </div>
                <InputNumber defaultValue={this.state.formatData.num}
                  style={{ width: '70%', float: "left" }} onChange={this.onNumChange} max={5} min={0} />
              </div>
              <div style={divTileTow}>
                <Checkbox
                  onChange={this.onCheckboxChange}
                  checked={this.state.formatData.thousandth}
                >使用千分符</Checkbox>
              </div>
              {/* <div style={divTileTow}>
                <div style={divTitle}>负数</div>
                <div className="negative-number" style={{ height: '100px' }}>
                  {formatOptionNumber.map((item) => {
                    return (<div key={item}>
                      {SSF.format(getFormatObject(this.state.formatData).pattern, item)}
                    </div>);
                  })}
                </div>
              </div> */}
            </div>
          ),
        },
        Currency: {
          name: '货币',
          remarks: '货币格式用于表示一般的货币数值',
          form: (
            <div style={{ height: '90%' }}>
              <div style={{ display: 'flex' }}>
                <div style={divTitle}>示例</div>
                <span style={{ lineHeight: '30px', float: 'left' }}>{this.getExampleValue()}</span>
              </div>
              <div style={divTileTow}>
                <div style={divTitle}>
                  小数位数
                </div>
                <InputNumber defaultValue={this.state.formatData.num} value={this.state.formatData.num} style={{ width: '70%', float: "left" }} onChange={this.onNumChange} max={5} min={0} />
              </div>
              <div style={divTileTow}>
                <div style={divTitle}>货币型号</div>
                <Select
                  style={{ width: '100%' }}
                  onChange={this.onCurrencyChange}
                  value={this.state.formatData.currency}
                >
                  {/* <Option value="">无</Option> */}
                  {currencyItems.map((item) => {
                    return (<Option key={item.value} value={item.label}>{item.value}</Option>);
                  })}
                </Select>
              </div>
              {/* <div style={divTileTow}>
                <div style={divTitle}>负数</div>
                <div className="negative-number" style={{ height: '90px' }}>
                  {formatOptionNumber.map((item) => {
                    return (<div key={item}>
                      {SSF.format(getFormatObject(this.state.formatData).pattern, item)}
                    </div>);
                  })}
                </div>
              </div> */}
            </div>
          ),
        },
        Percent: {
          name: '百分比',
          remarks: '以百分数的形式展现单元格数据',
          form: (
            <div style={{ height: '90%' }}>
              <div style={{ display: 'flex' }}>
                <div style={divTitle}>示例</div>
                <span style={{ lineHeight: '30px', float: 'left' }}>{this.getExampleValue()}</span>
              </div>
              <div>
                <div style={{ display: 'flex', marginTop: '8px' }}>
                  <div style={divTitle}>小数位数</div>
                  <InputNumber
                    defaultValue={this.state.formatData.num}
                    style={{ width: '70%', float: 'left' }}
                    onChange={this.onNumChange}
                    max={5}
                    min={0}
                  />
                </div>
              </div>
            </div>
          ),
        },
      };
    }
  }

  render() {
    const contentSourceStyle = this.props.contentSourceStyle;
    const formatItems = this.getFormatItems(contentSourceStyle);
    let formatType;
    if (contentSourceStyle === 'Date') {
      formatType = Object.keys(formatItems).filter(f => f === 'Date');
    } else {
      formatType = Object.keys(formatItems).filter(f => f !== 'Date');
    }
    const selectedFormat = formatItems[this.state.selectedIndex];
    return (
      <Modal
        title={'格式样式'}
        className="format-style-modal"
        visible={this.props.visible}
        closable
        width="500px"
        onCancel={this.onCancel.bind(this)}
        okText="确定"
        cancelText="取消"
        maskClosable={false}
        bodyStyle={{ padding: 0 }}
        wrapClassName='bi'
        footer={
          <div style={{ marginRight: 30 }}>
            <Button onClick={this.onCancel.bind(this)} >取消</Button>
            <Button type="primary" onClick={this.onSubmit.bind(this)}>保存</Button>
          </div>
        }
        wrapClassName="bi"
      >
        <div style={{ marginTop: 6, width: '100%' }}>
          <div className="table-format-left-container" style={{ float: "left" }}>
            <div style={{ height: '100%', width: '100%' }}>
              <div style={{ fontSize: 14 }}>分类</div>
              <Menu
                onClick={this.onSelect}
                defaultSelectedKeys={[this.state.selectedIndex]}
                mode="inline"
                className="category-menu"
              >
                {formatType.map((item) => {
                  return (<Menu.Item key={item}>{formatItems[item].name}</Menu.Item>);
                })}
              </Menu>
            </div>
          </div>
          <div style={{ height: '300px', width: '70%', paddingLeft: '21.5px', float: "left" }}>
            <div>
              {selectedFormat.remarks}
            </div>
            {selectedFormat.form}

          </div>
        </div>
      </Modal>
    );
  }
}
export {
  getFormatObject,
}

export default FormatType;
