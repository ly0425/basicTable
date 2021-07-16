import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button } from '@vadp/ui';
import * as SpreatsheetUtil from './SpreadsheetUtils';
import { ContextMenu, MenuItem, connectMenu } from 'react-contextmenu';
import { SheetBase, mapStateToProps, mapDispatchToProps } from './SpreadsheetControl';

class SheetTemplate extends SheetBase {
  renderCellMenu() {
    const isBI = SpreatsheetUtil.isBI();
    const Menu = connectMenu(this.menu_editgrid)((props) => (
      <ContextMenu id={props.id}>
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
        <MenuItem onClick={this.deleteSelectedCell}>
          删除单元格
        </MenuItem>
        <MenuItem onClick={this.clearSelectedCellContent}>
          清除内容
        </MenuItem>
        {!isBI && <MenuItem onClick={this.showFunctionModal}>
          函数
        </MenuItem>}
        <MenuItem onClick={() => this.setState({ replaceModalVisible: true })}>
          替换
        </MenuItem>
        {!isBI && <MenuItem onClick={this.createIndexes}>
          创建指标
        </MenuItem>}
        {!isBI && <MenuItem onClick={this.createFloatSumFomula}>
          浮动行小计
        </MenuItem>}
      </ContextMenu>
    ));
    return <Menu />;
  }
  renderExtraToolbarItems() {
    return [
      <Button style={{ marginLeft: 10 }} key='toggleCodeNameFormula' onClick={() => {
        console.log(this.actions)
        this.actions.toggleCodeNameFormula();
      }}>{this.model.showFormula ? '显示名称' : '显示公式'}</Button>,
      <Button style={{ marginLeft: 10 }} key='check' onClick={() => {
        this.setState({ checkFormulaModalData: { visible: true, checkFormulas: this.model.checkFormulas } });
      }}>审核公式</Button>,
    ];
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SheetTemplate);