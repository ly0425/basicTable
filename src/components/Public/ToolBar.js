import React, { Component } from 'react';
import { Tooltip, Menu, Dropdown } from '@vadp/ui';
import BISignal from './BISignals';
import {getTheme} from '/src/routes/visualizationModel/chartDesigner/components/Public/getTheme.js';
// import ChartModelUtil from './ChartModelUtil'; //ly注释
let className = {
  dashboard: 'dashboard',
  excel: 'excel',
  goBack: 'rollback',
  userCase: 'report_search',
  goToDashboard: 'instrument-panel',
  save: 'save',
  saveAs: 'save-as',
  savePriview: 'view',
  parameterSetting: 'preview',
  actionSetting: 'actionset',
  propsSetting: 'menufold',
  restore: 'reload',
  orderSetting: 'paixu',
  fullScreen: 'full_screen',
  exitFullScreen: 'quit_fulscreen',
  data: 'data',
  brush: "brush",
  export: 'BI-daochu',
  print: 'print',
  editWord: 'edit',
  group: 'BI_Conditiongroup',
  preview: 'preview',
  linkage: 'BI_Linkagesetup',
  meunfold: 'meunfoldv',
  meununfoldv: 'meununfoldv',
  tongbu: 'reload',
  layout_seven: 'layout_seven',
  printset:'printset'

};
const { SubMenu } = Menu;
class ToolBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      propsSetting: 'menufold'
    }
  }
  ButtonClick(clickObj) {
    if (clickObj.key == 'propsSetting') {
      if (className.propsSetting == 'menufold') {
        className.propsSetting = 'menuunfold';
      } else {
        className.propsSetting = 'menufold'
      }
      this.setState({
        propsSetting: className.propsSetting
      });
    }
  }
  ToolBarClick(type, e) {
    BISignal.tableShortcutSignal.dispatch(type);
  }
  tools() {
    let data = this.props.data;
    let arr = [];
    let selectedKeys = '';
    data.map(item => {
      if (item.chartType && ChartModelUtil.isHavingSeparateActionChart(item.chartType)) {
        selectedKeys = item.actionType ? [item.actionType] : ['unified'];
        const menu = (
          <Menu mode="horizontal" className="actionModalMenu" onClick={item.handler} theme={getTheme()} selectedKeys={selectedKeys}>
            <Menu.Item key="unified" >图形统一联动</Menu.Item>
            <Menu.Item key="separate" >图形各自联动</Menu.Item>
          </Menu>
        )
        arr.push(
          <li key={item.type}>
            <Dropdown overlay={menu} placement="bottomCenter">
              <i className={"icon iconfont icon-" + className[item.type]} />
            </Dropdown>
          </li>
        );
      } else {
        arr.push(
          <li key={item.type} className={item.type == 'goToDashboard' ? "go-to-dashboard" : ""}>
            <Tooltip placement="bottom" key={item.type} title={item.title}>
              {
                item.type == 'goToDashboard' ? <svg className="icon svgwh" aria-hidden="true" onClick={item.handler}>
                  <use xlinkHref={`#icon-${className[item.type]}`} />
                </svg > : (item.component || <i className={[item.className || "icon iconfont icon-" + className[item.type], item.addClassName ? item.addClassName : ""].join(" ")}
                  onClick={item.handler} />)
              }
            </Tooltip>
          </li>)
      }
    });
    return arr;
  }
  render() {
    const { title, categoryName } = this.props;
    let table = this.props.type === 'table' ?
      <div className="toolbar" style={{ marginLeft: '136px', top: '10px', width: '200px' }}>
        <div onClick={this.ToolBarClick.bind(this, 'Bold')} className="toolitem toolitem-header" title="加粗">B</div>
        <div onClick={this.ToolBarClick.bind(this, 'Italic')} className="toolitem toolitem-header" title="斜体">I</div>
        <div className="toolitem toolitem-header" title="左对齐"><i className="icon iconfont icon-alignleft" /></div>
        <div className="toolitem toolitem-header" title="居中"><i className="icon iconfont icon-aligncenter" /></div>
        <div className="toolitem toolitem-header" title="右对齐"><i className="icon iconfont icon-alignright" /></div>
        <div className="toolitem toolitem-header" title="格式刷"><i className="icon iconfont icon-brush" /></div>
      </div>
      : null;
    return (
      <div className="pd0 mg0 header-div" style={{ height: '30px' }}>
        {/* {table} */}
        <div className="datasource titleForPage">
          {
            categoryName ? <Tooltip placement="bottom" title={"分类：" + categoryName}>
              <span>{categoryName + "-> "}</span>
            </Tooltip>
              : null
          }
          <Tooltip placement="bottom" title={title}>
            <span>{title || ""}</span>
          </Tooltip>
        </div>
        <ul className="designer-header-tool mg0 flr">
          {this.tools()}
        </ul>
      </div>
    );
  }
}

export default ToolBar
