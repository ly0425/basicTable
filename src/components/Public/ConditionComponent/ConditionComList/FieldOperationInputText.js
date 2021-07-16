import React, {Component } from 'react';
import Field from '../ConditionComList/Field.js';
import InputTextComponent from "../ComponentList/InputTextComponent"
import OperationComponent from "../ComponentList/OperationComponent"; 

export default class  FieldOperationInputText extends  Component  {
    shouldComponentUpdate(nextProps,nextState){
          return true;
          // //效率优化 代码存在污染 不更新nextProps.dataItem
          // if(
          //   nextProps.isHiddenOperation !=this.props.isHiddenOperation
          //   || nextProps.fieldWidth !=this.props.fieldWidth
          //   || nextProps.inputTextWidth !=this.props.inputTextWidth
          //   || nextProps.index !=this.props.index
          //   || nextProps.fieldType !=this.props.fieldType
          //   || JSON.stringify(nextProps.dataItem) !=JSON.stringify(this.props.dataItem)
          //   ){
          //    return true;
          // }

          // return false;
    }
    render() {
        const {that, index, dataItem, fieldType="field"}=this.props;
        const name = dataItem.comments || dataItem.fieldName;
        const {mode,isHiddenOperation,fieldWidth,inputTextWidth} = that.props;
        return (
          <div className={"Field-Operation-InputText"}>
             <Field
              width={fieldWidth || "87px"}
              value={name}
              analysisModelId={dataItem.analysisModelId}
              required={dataItem.required} />
              {!isHiddenOperation?
                  <OperationComponent
                  onChange={(value, index) => that.onOperationChange(value, index, )}
                  index={index}
                  item={dataItem}
                  className="field-operation"
                />
                :null
              }
            <InputTextComponent
              width={inputTextWidth || "260px"}
              placeholder={name}
              index={index}
              item={dataItem}
              onChange={(value, index, type) => { that.onInputTextChange(value, index, type); }}
              parentFieldForTargetField={that.parentFieldForTargetField}
              onDeselect={(value, index) => that.onDeselect(value, index)}
      
            />
          </div>
        );
    }
  }