import React, { Component } from 'react';
import { Spin } from '@vadp/ui';
import MatrixManager from './MatrixManager';

class MatrixPreview extends Component {

  constructor(props) {
    super(props);
    this.state = {
      data: null,
      model: null,
    };
    this.tableManager = new MatrixManager(this);
  }
  componentDidMount() {
    const { analysisModuleId, model, conditions } = this.props;
    this.tableManager.refreshTable(analysisModuleId, model, conditions);
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.analysisModuleId === this.props.analysisModuleId
      && nextProps.model === this.props.model
      && nextProps.conditions === this.props.conditions
    ) {
      return;
    }

    this.state.data = null;
    this.state.model = null;
    const { analysisModuleId, model, conditions } = nextProps;
    this.tableManager.refreshTable(analysisModuleId, model, conditions);
  }

  handleTableChange = (pagination) => {
    const { analysisModuleId, model, conditions } = this.props;
    this.refreshTable(analysisModuleId, model, conditions, pagination.current);
  }

  render() {
    let content;
    const model = this.state.model;
    if (!model) {
      content = '';
    } else if (!this.state.data) {
      content = <Spin />;
    } else if (this.state.data === 'error') {
      content = '不能获取数据.';
    } else {
      content = this.tableManager.getTable();
    }
    return (
      <div style={{ height: '100%', width: '100%' }}>
        {content}
      </div>
    );
  }
}


export default MatrixPreview;

