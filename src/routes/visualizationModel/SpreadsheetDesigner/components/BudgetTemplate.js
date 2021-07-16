import React, { Component } from 'react';
import { Input, Tree, Select, Menu, Row, Col, Modal, Alert, Button, Tooltip, Form } from 'antd';
import { SpreadsheetModelBase } from './SpreadsheetModel';
import { connect } from 'dva';

import { SheetBase, mapStateToProps, mapDispatchToProps } from './SpreadsheetControl';
import BudgetModal from './BudgetModal';

class BudgetTemplate extends SheetBase {
  getBugetModalData(plan) {
    this.props.dispatch({ type: 'Spreadsheet/createBudgetTemplateAsync', plan });
  }
  renderExtraToolbarItems() {
    const { plan, pageParams } = this.props;
    return [
      <BudgetModal plan={plan} pageParams={pageParams} getBugetModalData={(plan) => this.getBugetModalData(plan)} />
    ];
  }
}

const ConnectedSheetTemplate = connect(mapStateToProps, mapDispatchToProps)(BudgetTemplate);

class BudgetTemplateContainer extends SpreadsheetModelBase {
  pageParams = {};
  constructor(props) {
    super(props);
    // 查询字符串
    this.search = props.location.search;
    // 页面参数
    if (this.search.indexOf('?') === 0) {
      let array = this.search.slice(1).split('&');
      for (const str of array) {
        const pair = str.split('=');
        if (pair.length === 2) {
          this.pageParams[pair[0]] = decodeURIComponent(pair[1]);
        }
      }
      console.log('pageParams', this.pageParams);
    }
  }
  componentDidMount() {
    this.init();
  }
  async init() {
    this.props.dispatch({ type: 'Spreadsheet/initBudgetTemplateAsync', pageParams: this.pageParams });
  }

  handleSave() {
    this.props.dispatch({ type: 'Spreadsheet/saveBudgetTemplateAsync' });
  }

  toolBarData() {
    return [
      // {
      //   title: '方案设置 ',
      //   handler: this.togglePropsSetting.bind(this),
      //   type: 'parameterSetting',
      // },
      {
        title: '保存',
        handler: this.handleSave.bind(this),
        type: 'save',
        className: 'icon iconfont icon-save',
      },
      {
        title: '属性设置 ',
        handler: this.togglePropsSetting.bind(this),
        type: 'propsSetting',
      },
    ];
  }
  getReportName() {
    return '预算模板设置';
  }
}


const mapModelStateToProps = (state, ownProps) => {
  return {

  }
}

class Budget extends Component {
  render() {
    return <BudgetTemplateContainer {...this.props} sheetComponent={ConnectedSheetTemplate} />;
  }
}

export default connect(mapModelStateToProps)(Budget);