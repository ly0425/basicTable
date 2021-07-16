import React, { Component } from 'react';
import { Modal } from '@vadp/ui';
import { ExpressionEditor, ExpressionEditorModal } from 'components/Public/ExpressionEditor';
import SpreadsheetFormulaFunctionParamsEditor from "./SpreadsheetFormulaFunctionParamsEditor";

export default class FormulaEditorModal extends ExpressionEditorModal {
  // renderContent() {
  //   const { categaries, validate } = this.props;
  //   return (
  //     <FormulaEditor
  //       categaries={categaries}
  //       text={this.state.text}
  //       onTextChanged={this.handleTextChanged}
  //       validate={validate} />
  //   );
  // }
}

class FormulaEditor extends ExpressionEditor {
  showParamsEditor(item, cb) {
    this.setState({ paramsEditorVisible: true });
  }

  renderParamsEditor() {
    const { paramsEditorVisible, selectedItem } = this.state;
    if (!paramsEditorVisible || !selectedItem) {
      return;
    }
    return (
      <SpreadsheetFormulaFunctionParamsEditor
        visible={true}
        funcItem={selectedItem}
        onOk={str => {
          this.setState({ paramsEditorVisible: false });
          this.insertString(str);
        }} onCancel={() => {
          this.setState({ paramsEditorVisible: false });
        }} />
    );
  }
}