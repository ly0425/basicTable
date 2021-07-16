import React, { Component } from 'react';
import { Menu, Dropdown, Button, Icon } from '@vadp/ui';

class Item extends Component {
  handleMouseOver = () => {
    if (this.isMouseOver) {
      return;
    }
    this.isMouseOver = true;
    const { onMouseEnter } = this.props;
    onMouseEnter && onMouseEnter({ ...this.props });
  };
  handleMouseOut = () => {
    this.isMouseOver = false;
    const { onMouseOut } = this.props;
    onMouseOut && onMouseOut({ ...this.props });
  };
  render() {
    return (
      <Menu.Item
        onMouseDown={this.handleMouseDown}
        onMouseOver={this.handleMouseOver}
        onMouseOut={this.handleMouseOut}
      >
        {this.props.text}
      </Menu.Item>
    );
  }
}

export default class extends Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }
  onItemMouseOver = (index) => {
    this.setState({ count: index + 1 });
  };
  onItemMouseOut = () => {
    this.setState({ count: 0 });
  };
  render() {
    const { dataSource, children, onButtonClick, onSelect, buttonTip, listTip } = this.props;
    const menu = (
      <div
        style={{
          boxShadow: '0 2px 8px rgba(0,0,0,.15)',
          borderRadius: '4px',
          backgroundColor: 'white',
          minWidth: 120,
        }}
      >
        <ul style={{ maxHeight: '300px', overflow: 'auto' }}>
          {dataSource && dataSource.map((_, index) => {
            const record = dataSource[dataSource.length - 1 - index];
            const style = { padding: '5px 12px', whiteSpace: 'nowrap', cursor: 'pointer' };
            (index < this.state.count) && (style.backgroundColor = '#e6f7ff');
            return (<li
              key={index}
              style={style}
              onMouseOver={() => this.onItemMouseOver(index)}
              onMouseOut={this.onItemMouseOut}
              onClick={() => onSelect(index + 1)}
            >
              {record.description}
            </li>);
          })}
        </ul>
        <div
          style={{
            padding: '5px 12px',
            whiteSpace: 'nowrap',
            borderColor: '#d9d9d9',
            borderTopWidth: '1px',
            borderTopStyle: 'solid',
          }}
        >
          {this.state.count > 0 ? <span>{listTip(this.state.count)}</span> : '　'}
        </div>
      </div>
    );
    const disabled = !dataSource || dataSource.length === 0;
    return (
      <div style={{ display: 'inline-block' }}>
        <div
          disabled={disabled}
          className={'toolitem'}
          onClick={() => onButtonClick()}
          title={buttonTip}
          style={{ width: 'auto', margin: '0 0 0 12px', padding: 0 }}
        >
          {children}
        </div>
        <Dropdown
          disabled={disabled}
          overlay={menu}
          trigger={['click']}
          placement="bottomLeft"
        >
          <div
            disabled={disabled}
            className={'toolitem'}
            title={buttonTip}
            style={{ width: 'auto', margin: '0 0 0 0', padding: 0 }}
          >
            <i className="icon iconfont icon-BI-More" />
          </div>
        </Dropdown>
      </div>
    );
  }
}
