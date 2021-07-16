import React, { Component } from 'react';
import { ExpressionEditor, ExpressionEditorModal } from 'components/Public/ExpressionEditor';
import { Modal } from '@vadp/ui';
class BudgetFormulaModal extends ExpressionEditorModal {
    constructor(props) {
        super(props);
        this.state.budgetExpExplain = props.budgetExpExplain || '';
    }
    renderContent(newHeight) {
        return (
            <ExpressionEditor
                text={this.state.text}
                onTextChanged={this.handleTextChanged}
                acctYear={this.props.acctYear}
                height={this.props.height || newHeight}
                type={'budgetSpecial'}
                budgetExpExplain={this.state.budgetExpExplain}
                budgetExpExplainChange={this.budgetExpExplainChange}
                ref={(ref) => this.expEditorRef = ref}
                auditScopeDept={this.props.auditScopeDept}
                auditScopeDeptName={this.props.auditScopeDeptName}
            />
        );
    }
    budgetExpExplainChange = (v) => {

        this.setState({ budgetExpExplain: v })
    }
    handleOk = () => {
        const { onOk } = this.props;
        let okMap = { expression: this.state.text, ruleDesc: this.state.budgetExpExplain }
        if (this.expEditorRef.state.auditScopeDept) {
            console.log(this.expEditorRef.state)
            okMap.deptId = this.expEditorRef.state.auditScopeDept;
            okMap.deptName = this.expEditorRef.state.auditScopeDeptName || '全体';
        }
        onOk(okMap)
    }
    render() {
        const { visible, width, height } = this.props;
        let newHeight = (document.documentElement.clientHeight || document.body.clientHeight);

        return (<Modal
            visible={visible}
            title={'预算样表公式'}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
            width={width * 0.8}
            bodyStyle={{ height: `${(height || newHeight) * 0.8}px` }}
            wrapClassName='expressionEditorModal bi'
        >
            {this.renderContent(newHeight)}
        </Modal>);
    }
}

export default BudgetFormulaModal;