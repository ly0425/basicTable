import React, { Component } from 'react';
import {
  Icon, Input, Tree, Select, Menu, Row, Col, Modal, Alert, Button, Tooltip,
  Form, message, Checkbox
} from '@vadp/ui';
import { SpreadsheetModelBase } from './SpreadsheetModel';
import { connect } from 'dva';

import { ToolbarItem, SheetBase, mapStateToProps, mapDispatchToProps } from './SpreadsheetControl';
import BudgetModal from './BudgetModal';
import BudgetToolBox from './BudgetToolBox';
import BudgetTemplateDvaModel2 from '../BudgetTemplateDvaModel2';
import { toggleProperty } from '../SpreadsheetAction';
import * as SpreatsheetUtil from './SpreadsheetUtils';
import { ContextMenu, MenuItem, ContextMenuTrigger, connectMenu } from 'react-contextmenu';
import AuditFormulaList from './AuditFormulaList';
import { RenderToolbars } from '~/components/Public/excelCommon';
import { shortcutToolbarSignal } from 'public/ShortcutToolbar/signal';
import Dialog from '~/components/Public/Dialog';
import BudgetActionModal from './BudgetActionModal';
import PageDimensionModal from './PageDimensionModal';
import addressConverter from 'xlsx-populate/lib/addressConverter';
const FormItem = Form.Item;

const confirm = Modal.confirm;

/**
 * 预算样表的表格
 */
class BudgetTemplate2 extends SheetBase {
  signal = shortcutToolbarSignal.getByControlID('budgettree')
  componentDidMount() {
    this.signal.action.add(this.update_budget_tree_disabled);
  }
  componentWillUnmount() {
    this.signal.action.remove(this.update_budget_tree_disabled);
  }
  update_budget_tree_disabled = ({ type, isDisabled }) => {
    if (type === 'isDisabled') {
      this.setState({
        isDisabled: isDisabled
      })
    }
  }
  handleDrop = (ev) => {
    const text = ev.dataTransfer.getData('text');
    const dragData = JSON.parse(text);
    if (dragData.dragType === 'budgetDimension') {
      this.actions.onPageDimensionDrop(dragData);
    }
  }

  getPageDimensionDisplay(item) {
    if (item.dimension.id === 'DEPT_ID') {
      return '下发科室';
    } else if (item.dimension.id === 'BUDG_VERSION') {
      return '默认版本';
    }
  }

  renderPageDimensions(pageDimensions) {
    const children = [];
    for (let i = 0; i < pageDimensions.length; i++) {
      const item = pageDimensions[i];
      children.push(
        <Col span={8} key={i}>
          <FormItem
            labelCol={{ span: 7 }}
            wrapperCol={{ span: 17 }}
            label={item.dimension.dimDisplay}
          >
            {/* <Select style={{ width: '100%' }}>
              {item.dimensionValues.map(v => (
                <Select.Option key={v.id}>{v.display}</Select.Option>
              ))}
            </Select> */}
            <Input readOnly
              value={this.getPageDimensionDisplay(item)}
              suffix={
                <Tooltip title="移除">
                  <Icon type='close' style={{ cursor: 'pointer' }}
                    onClick={() => this.actions.removePageDimension(i)} />
                </Tooltip>
              }
            ></Input>
          </FormItem>
        </Col>
      );
    }
    return <Row gutter={24}>{children}</Row>;
  }
  updateBudgetTreeFieldFlatList = (type) => {
    this.actions.updateBudgetTreeFieldFlatList(type);
  }
  // renderPageHeader() {
  //   const { pageDimensions } = this.props.sheet.present;
  //   return (
  //     <div style={{
  //       position: 'relative',
  //       top: 26,
  //       margin: '10px 25px',
  //     }} onDrop={this.handleDrop}>
  //       {(pageDimensions && pageDimensions.length > 0)
  //         ? this.renderPageDimensions(pageDimensions)
  //         : '页面维度拖动至这里'}
  //     </div>
  //   );
  // }

  renderToolbar() {
    if (this.props.pageParams.editType === 'overView') {
      return;
    }
    if (this.props.pageParams.readOnly) {
      const textBox = this.props.selectedCellTextBox;
      const fontStyle = this.props.selectedCellFontInfo;
      return (<RenderToolbars datas={[{
        type: 'function', cb: this.renderExportButton.bind(this)
      },
      {
        type: 'function', cb: this.renderAuditFormulaBtn && this.renderAuditFormulaBtn.bind(this)
      },
      {
        type: 'function', cb: this.renderImportButton.bind(this), el: <input ref='excelInput' type='file' accept='.xlsx,.xml' style={{ display: 'none' }} onChange={this.handleOpenFile.bind(this)} />
      },
      {
        onClick: this.setCellBold.bind(this),
        title: '加粗',
        iconName: 'icon-bold',
        type: 'ToolbarItem',
        isHeader: true,
        checked: (fontStyle && fontStyle.fontWeight.toLowerCase() === 'bold')
      },
      {
        onClick: this.setCellItalic.bind(this),
        title: '倾斜',
        iconName: 'icon-tilt',
        type: 'ToolbarItem',
        checked: (fontStyle && fontStyle.fontType.toLowerCase() === 'italic')
      },
      {
        onClick: this.setCellUnderline.bind(this),
        title: '下划线',
        iconName: 'icon-BI-Underline',
        type: 'ToolbarItem',
        checked: (fontStyle && fontStyle.fontDecoration.toLowerCase() === 'underline')
      },
      {
        onClick: this.onFormatBrushClick.bind(this),
        title: '格式刷',
        iconName: 'icon-BI-brush',
        type: 'ToolbarItem',
        isHeader: true,
        checked: (this.model.mark && this.model.mark.type === 'brush')
      },
      {
        onClick: this.setAlignLeft.bind(this),
        title: '左对齐',
        iconName: 'icon-BI-Left',
        type: 'ToolbarRadioItem',
        isHeader: true,
        current: (textBox && textBox.horizontalAlignment === 'Left')
      },
      {
        onClick: this.setAlignCenter.bind(this),
        title: '居中',
        iconName: 'icon-BI-Verticalcenter',
        type: 'ToolbarRadioItem',
        isHeader: true,
        current: (textBox && textBox.horizontalAlignment === 'Center')
      },
      {
        onClick: this.setAlignRight.bind(this),
        title: '右对齐',
        iconName: 'icon-BI-right',
        type: 'ToolbarRadioItem',
        isHeader: true,
        current: (textBox && textBox.horizontalAlignment === 'Right')
      },
      {
        onClick: this.setAlignTop.bind(this),
        title: '上对齐',
        iconName: 'icon-BI-Aligntopedge',
        type: 'ToolbarRadioItem',
        isHeader: true,
        current: (textBox && textBox.verticalAlignment === 'Top')
      },
      {
        onClick: this.setAlignMiddle.bind(this),
        title: '垂直居中',
        iconName: 'icon-BI-transverse',
        type: 'ToolbarRadioItem',
        current: (textBox && textBox.verticalAlignment === 'Middle')
      },
      {
        onClick: this.setAlignBottom.bind(this),
        title: '下对齐',
        iconName: 'icon-BI-bottomjustify',
        type: 'ToolbarItem',
        current: (textBox && textBox.verticalAlignment === 'Bottom')
      },
      {
        onClick: this.mergeCell.bind(this), title: '合并单元格', iconName: 'icon-merge', isHeader: true, type: 'ToolbarItem'
      },
      {
        onClick: this.splitCell.bind(this), title: '拆分单元格', iconName: 'icon-split', type: 'ToolbarItem'
      },
      {
        onClick: this.showDimension.bind(this),
        title: '检查维度',
        iconName: 'icon-xiangxixinxi',
        type: 'ToolbarRadioItem',
        isHeader: true,
      },
      {
        onClick: this.togglePropsSetting.bind(this), title: '属性设置', iconName: 'icon-menufold', type: 'ToolbarItem'
      },]} />)
    }
    return super.renderToolbar();
  }
  renderBudgettree() {
    return <Checkbox style={{ marginLeft: '12px' }} disabled={!this.state.isDisabled} onChange={this.BudgettreeChange}>维度是否树形</Checkbox>
  }
  BudgettreeChange = (e) => {
    this.signal.action.dispatch({ type: 'istreeshow', istreeshow: e.target.checked });
  }
  renderExtraToolbarItems() {
    return <React.Fragment>
      <ToolbarItem onClick={this.compare} isHeader title="匹配" iconName='icon-not-intodb' />
      <ToolbarItem onClick={this.bindData} isHeader title="绑定" iconName='icon-liuchengrenwu' />
      <ToolbarItem onClick={this.showDimension} isHeader title="检查维度" iconName='icon-xiangxixinxi' />
      <ToolbarItem onClick={this.cancelBind} isHeader title="取消绑定" iconName='icon-fork' />
      <ToolbarItem onClick={this.handlePageDimClick} isHeader title="页面维度设置" iconName='icon-split' />
      <ToolbarItem onClick={this.togglePropsSetting} isHeader title="属性设置" iconName='icon-menufold' />
    </React.Fragment>
  }
  handlePageDimClick = () => {
    const { sheet } = this.props;
    const { pageDimensions } = sheet.present;
    console.log('handlePageDimClick', pageDimensions);
    const dialog = this.refs['pageDimensionsDialog'];
    dialog.openDialog({ pageDimensions }).then(result => {
      if (result) {
        console.log('pageDimensions', result);
        this.actions.setPageDimensions(result);
      }
    });
  }
  togglePropsSetting = () => {
    this.props.dispatch(toggleProperty());
  }

  cancelBind = () => {
    const { sheet } = this.props;
    const { selectedRanges } = sheet.present;
    if (selectedRanges && selectedRanges.length > 0) {
      this.props.dispatch({
        type: 'Spreadsheet/cancelBind'
      });
      message.success('取消绑定信息成功！');
    } else {
      message.warn('请选中取消绑定信息区域！');
    }
  }

  showDimension = () => {
    const { sheet } = this.props;
    const { selectedRanges, rowProps, colProps, tableRows } = sheet.present;
    if (selectedRanges && selectedRanges.length > 0) {
      const { top, left, right, bottom } = selectedRanges[0];
      const array = [];
      for (let row = top; row <= bottom; row++) {
        // 浮动行绑定维度，并没有维度成员，展示维度成员信息时排除掉
        if (!(rowProps[row].rowType && rowProps[row].rowType === 'float')) {
          for (let column = left; column <= right; column++) {
            const cellValue = tableRows[row][column].textBox.value;
            const colName = addressConverter.columnNumberToName(column + 1);
            if (tableRows[row][column] && tableRows[row][column].dimensionData) {
              const name = tableRows[row][column].dimensionData.dimension.dimDisplay;
              const direction = tableRows[row][column].direction;
              let value;
              let code;
              if (tableRows[row][column].dimensionData.value) {
                value = tableRows[row][column].dimensionData.value.display;
                code = tableRows[row][column].dimensionData.value.code;
              }
              array.push(`第 ${row + 1} 行第 ${colName} 列内容为：${cellValue}，绑定${direction === 'row' ? '行' : '列'}维度为：${name}，绑定成员为：${value}（${code}）`);
            } else if (tableRows[row][column] && tableRows[row][column].measure) {
              const name = tableRows[row][column].measure.expandDisplay;
              array.push(`第 ${row + 1} 行第 ${colName} 列内容为：${cellValue}，绑定度量为：${name}`);
            }
          }
        }
      }
      Modal.info({
        title: '绑定维度信息',
        width: '800',
        content: <section style={{ maxHeight: '300px', overflow: 'auto' }}>
          {array.length === 0 && <p>暂无绑定维度信息</p>}
          {array.map(item => {
            return <p>{item}</p>
          })}
        </section>,
        okText: '确认',
      });
    } else {
      message.warn('请选中查看信息区域！')
    }
  }

  // 绑定数据
  bindData = () => {
    const { sheet, selectSingleLeafNode } = this.props;
    const { selectedRanges } = sheet.present;
    if (!selectedRanges) {
      message.warn('请选中一个需绑定的单元格!')
      return false;
    }
    if (!selectSingleLeafNode) {
      message.warn('请选中一个需绑定维度或度量！')
      return false;
    }
    if (selectSingleLeafNode.length > 1) {
      message.warn('绑定数据时只允许选中一条数据!')
      return false;
    }
    // if (selectedRanges && selectedRanges.length > 0) {
    const { top, left, right, bottom } = selectedRanges[0];
    if ((top !== bottom && (right - left) > 1) || (right !== left && (bottom - top) > 1)) {
      message.warn('只允许请选择一行或一列！')
      return false
    }
    this.props.dispatch({
      type: 'Spreadsheet/bindDimension'
    });
    message.success('绑定成功！')
  }

  compare = () => {
    const { sheet, selectedDimension } = this.props;
    const { selectedRanges } = sheet.present;
    if (selectedRanges && selectedRanges.length > 0) {
      const { top, left, right, bottom } = selectedRanges[0];
      // console.log(top, left, right, bottom)
      if ((top !== bottom && (right - left) > 1) || (right !== left && (bottom - top) > 1)) {
        message.warn('只允许请选择一行或一列！')
        return false
      }

      if (!selectedRanges) {
        message.warn('请选择区域')
        return false;
      }
      if (!selectedDimension) {
        message.warn('请选择节点');
        return false
      }
      const child = selectedDimension[1];
      if ([...child.keys()].length === 0) {
        message.warn('请确认当前维度下是否存在成员')
        return false;
      }
      this.props.dispatch({
        type: 'Spreadsheet/compareDimension'
      })
      message.success('匹配完成！')
    } else {
      message.warn('请选中一列或一行！')
    }
  }
  handleActionClick = () => {
    const { pageParams } = this.props;
    this.refs['actionDialog'].openDialog({ pageParams }).then(item => {
      const action = {
        targetReportID: item.template_id,
        targetBIDataID: item.bi_data_id,
        displayName: item.template_name,
      };
      this.actions.setAction(action);
    });
  }
  renderCellMenu() {
    let dimensionMenu = '';
    const { selectedCell } = this.props;
    if (selectedCell) {
      if (selectedCell.dimProp || selectedCell.extendProp) {
        dimensionMenu = <MenuItem onClick={this.delDimensionOrDict}>清除维度属性</MenuItem>
      }
    }
    if (this.props.pageParams.editType === 'overView') {
      return;
    }
    let contextMenu = (
      <React.Fragment>
        <MenuItem onClick={this.cutSelectedCell}>
          剪切
      </MenuItem>
        <MenuItem onClick={this.copySelectedCell}>
          复制
      </MenuItem>
        <MenuItem onClick={this.pasteSelectedCell}>
          粘贴
      </MenuItem>
        <MenuItem onClick={this.showFormulaModal.bind(this, 'formulaModalVisible')}>
          公式
      </MenuItem>
        <MenuItem onClick={this.showFunctionModal}>
          函数
        </MenuItem>
        <MenuItem onClick={this.showFormulaModal.bind(this, 'budgetFormulaVisible')}>
          预算样表公式
      </MenuItem>
        <MenuItem onClick={this.showDimensionModal}>
          维度属性/基础字典
      </MenuItem>
        {dimensionMenu}
        <MenuItem onClick={this.deleteSelectedCell}>
          删除单元格
      </MenuItem>
        <MenuItem onClick={this.clearSelectedCellContent}>
          清除内容
      </MenuItem>
        {/* <MenuItem onClick={this.showGatherModal}>
        汇总公式
      </MenuItem> */}
        <MenuItem onClick={this.handleActionClick}>
          动作
        </MenuItem>
        <MenuItem onClick={() => this.setState({ replaceModalVisible: true })}>
          替换
      </MenuItem>
        {/* <MenuItem onClick={this.showDimensionFormulaModal.bind(this)}>
        维度公式
      </MenuItem> */}
      </React.Fragment>
    )
    if (this.props.pageParams.readOnly) {
      contextMenu = (
        <React.Fragment>
          <MenuItem onClick={this.copySelectedCell}>
            复制
          </MenuItem>
          <MenuItem onClick={this.pasteSelectedCell}>
            粘贴
          </MenuItem>
          <MenuItem onClick={this.showFormulaModal.bind(this, 'formulaModalVisible')}>
            公式
          </MenuItem>
          <MenuItem onClick={this.showFunctionModal}>
            函数
          </MenuItem>
          <MenuItem onClick={this.showFormulaModal.bind(this, 'budgetFormulaVisible')}>
            预算样表公式
          </MenuItem>
          <MenuItem onClick={this.showDimensionModal}>
            维度属性/基础字典
          </MenuItem>
          <MenuItem onClick={this.clearSelectedCellContent}>
            清除内容
          </MenuItem>
        </React.Fragment>
      )
    }
    const isBI = SpreatsheetUtil.isBI();
    const Menu = connectMenu(this.menu_editgrid)((props) => (
      <ContextMenu id={props.id}>
        {contextMenu}
      </ContextMenu>
    ));
    return <Menu />;
  }
  renderOther() {
    return (
      <React.Fragment>
        <Dialog ref="actionDialog" component={BudgetActionModal} pageParams={this.props.pageParams} />
        <Dialog ref="pageDimensionsDialog" component={PageDimensionModal} pageParams={this.props.pageParams} />
      </React.Fragment>
    );
  }
  renderRowMenu() {
    if (this.props.pageParams.editType === 'overView') {
      return;
    }
    // return super.renderRowMenu();
    let Menu = connectMenu(this.menu_row)((props) => (
      <ContextMenu id={props.id}>
        <MenuItem onClick={this.insertRowUp}>
          {this.renderMenuItemIcon('icon-xiangshangcharuhang')}
          向上插入行
        </MenuItem>
        <MenuItem onClick={this.insertRowDown}>
          {this.renderMenuItemIcon('icon-xiangxiacharuhang')}
          向下插入行
        </MenuItem>
        <MenuItem onClick={this.removeRows}>
          {this.renderMenuItemIcon('icon-shanchuhang')}
          删除行
        </MenuItem>
        <MenuItem onClick={this.showRowHeightDialog.bind(this)}>
          行高
        </MenuItem>
        <MenuItem onClick={this.clearAnalysisModel}>
          清除分析模型
        </MenuItem>
        {/* <MenuItem onClick={() => this.setState({ attachmentModalVisible: true })}>
          附件
        </MenuItem> */}
        <MenuItem onClick={this.setFrozenRow}>
          冻结到此行
        </MenuItem>
        <MenuItem onClick={this.clearFrozenRow}>
          取消冻结行
        </MenuItem>
        <MenuItem onClick={this.setTableHeader}>
          设为表头
        </MenuItem>
        <MenuItem onClick={this.setTableFooter}>
          设为表尾
        </MenuItem>
        <MenuItem onClick={this.cancelTableHeaderOrFooter}>
          取消表头或表尾
        </MenuItem>

      </ContextMenu>
    ));
    if (this.props.pageParams.readOnly) {
      Menu = connectMenu(this.menu_row)((props) => (
        <ContextMenu id={props.id}>
          <MenuItem onClick={this.insertRowUp}>
            {this.renderMenuItemIcon('icon-xiangshangcharuhang')}
            向上插入行
          </MenuItem>
          <MenuItem onClick={this.setTableHeader}>
            设为表头
        </MenuItem>
          <MenuItem onClick={this.setTableFooter}>
            设为表尾
        </MenuItem>
        </ContextMenu>
      ));
    }
    return <Menu />;
  }
  renderColMenu() {
    if (this.props.pageParams.editType === 'overView') {
      return;
    }
    let Menu = connectMenu(this.menu_column)((props) => (
      <ContextMenu id={props.id}>
        <MenuItem onClick={this.insertColumnLeft}>
          {this.renderMenuItemIcon('icon-xiangzuocharulie')}
          向左插入列
          </MenuItem>
        <MenuItem onClick={this.insertColumnRight}>
          {this.renderMenuItemIcon('icon-xiangyoucharulie')}
          向右插入列
          </MenuItem>
        <MenuItem onClick={this.removeColumns}>
          {this.renderMenuItemIcon('icon-shanchulie')}
          删除列
        </MenuItem>
        <MenuItem onClick={this.showColWidthDialog.bind(this)}>
          列宽
        </MenuItem>
        <MenuItem onClick={this.setFrozenCol}>
          冻结到此列
        </MenuItem>
        <MenuItem onClick={this.clearFrozenCol}>
          取消冻结列
        </MenuItem>
        {/* <MenuItem onClick={this.showDimensionFormulaModal.bind(this)}>
          维度公式
        </MenuItem> */}
      </ContextMenu>
    ));
    if (this.props.pageParams.readOnly) {
      Menu = connectMenu(this.menu_column)((props) => (
        <ContextMenu id={props.id}>
          <MenuItem onClick={this.insertColumnLeft}>
            {this.renderMenuItemIcon('icon-xiangzuocharulie')}
            向左插入列
            </MenuItem>
          <MenuItem onClick={this.insertColumnRight}>
            {this.renderMenuItemIcon('icon-xiangyoucharulie')}
            向右插入列
            </MenuItem>
        </ContextMenu>
      ));
    }
    return <Menu />;
  }
  renderImportButton() {
    return <ToolbarItem style={{ display: 'none' }} onClick={this.importExcel} isHeader title="导入" iconName='icon-BI_daoru' />;
  }
  renderExportButton() {
    return <ToolbarItem style={{ display: 'none' }} onClick={this.exportExcel} title="导出" iconName='icon-BI_daochu' />;
  }
  renderAuditFormulaBtn() {
    // return (<Icon type="idcard" title='管理审核公式' style={{ marginLeft: 10,fontSize:18,cursor:'pointer'  }} onClick={() => { this.setState({ auditFormulaVisible: true }) }}/>)
    return (<Button style={{ marginLeft: 10, display: 'none' }} onClick={() => { this.setState({ auditFormulaVisible: true }) }}>管理审核公式</Button>)
  }
  renderAuditFormulaList = () => {//审核公式
    const { auditFormulaVisible } = this.state;

    return auditFormulaVisible ? (
      <AuditFormulaList
        visible={auditFormulaVisible}
        formulaList={this.props.sheet.present.auditFormulaList}
        acctYear={this.props.pageParams.acctYear}
        width={this.props.pageParams.width}
        height={this.props.pageParams.height}
        handleOk={(auditFormulaList) => {
          this.actions.addAuditFormula(auditFormulaList);
          this.setState({ auditFormulaVisible: false });
        }}
        handleCancel={() => {
          this.setState({ auditFormulaVisible: false })
        }}
      />
    ) : null;
  }
  renderTableMenu() {
    if (this.props.pageParams.editType === 'overView') {
      return;
    }
    const Menu = connectMenu('menu_table')((props) => (
      <ContextMenu id={props.id}>
        <MenuItem onClick={this.selectAllCell}>
          <svg className="icon" aria-hidden="true"
            style={{ width: "16.6px", height: "16.6px", marginRight: 10, verticalAlign: 'middle' }}>
            <use xlinkHref="#icon-all1"></use>
          </svg>
          全选
        </MenuItem>
      </ContextMenu>
    ));
    return <Menu />;
  }
}

const ConnectedSheetTemplate = connect(mapStateToProps, mapDispatchToProps)(BudgetTemplate2);

/**
 * 预算的设计器
 */
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
      this.pageParams.readOnly = this.pageParams.readOnly == 'true' ? true : false;
      console.log('pageParams', this.pageParams);
    }
  }

  componentDidMount() {
    if (this.pageParams.editType === 'overView') {
      this.setState({ isShowChartDataSource: false })
    }
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
    return this.pageParams.budgetName || '预算模板设置';
  }
  renderToolBox() {
    if (this.pageParams.editType === 'overView') {

      return <div></div>;
    }
    if (this.pageParams.readOnly) {
      return <div></div>;
    }
    return (
      <BudgetToolBox pageParams={this.pageParams} isShowChartDataSource={this.state.isShowChartDataSource} onToggle={this.handleToggle} />
    );
  }

}


const mapModelStateToProps = (state, ownProps) => {
  return {

  }
}

class Budget extends Component {
  render() {
    return <BudgetTemplateContainer {...this.props} sheetComponent={ConnectedSheetTemplate} className='budget-template' />;
  }
}

export default connect(mapModelStateToProps)(Budget);



