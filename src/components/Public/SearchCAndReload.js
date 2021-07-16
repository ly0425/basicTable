import React, { Component } from 'react';
import SearchC from './searchC.js';
import { Button, Row, Col, Tooltip } from '@vadp/ui';

class SearchCAndReload extends Component {
  constructor(props) {
    super(props);
  }
  getAllData() {
    this.refs.searchCButtonLeft.emitEmpty();  // 清空搜索框
    this.props.changeHandle('');
  }
  changeHandle(value) {
    this.props.changeHandle(value);
  }
  render() {
    return (
      <Row>
        <Col span={24} className="search-all-flag">
          <div className="search-all-flag-left">
            <SearchC changeHandle={this.changeHandle.bind(this)} ref="searchCButtonLeft" />
          </div>
          <Tooltip placement="bottom" title="获取全部">
            <Button
              className="search-all-flag-right"
              shape="circle"
              // ghost  
              onClick={this.getAllData.bind(this)}
            >
              <i className="icon iconfont icon-ALL" />
            </Button>
          </Tooltip>
        </Col>
      </Row>
    );
  }
}

export default SearchCAndReload;
