import React, {Component } from 'react';
import FieldSelect from './FieldSelect.js';
import DataChain from './DataChain.js';
import InputTextComponent from "../ComponentList/InputTextComponent"
import FastSelectDateModel from './FastSelectDateModel';
export default class  FieldOperationInputFieldSelectText extends  Component  {
    render() {
        const {that, index, dataItem}=this.props;
        const name = dataItem.comments || dataItem.fieldName;
        const {mode} = that.props;
  
    return (
      <div className={["Field-Operation-InputText", mode === "plane"?"Field-Operation-InputText-special-plane":"Field-Operation-InputText-special"].join(' ')}>       
        <DataChain
          width={mode === "plane"?"80px":"87px"}
          onChange={(value, index) => that.onDataChainChange(value, index, )}
          index={index}
          item={dataItem}
          className="field-operation"
          hiddenTBHB={dataItem["referenceInfo"]["content"]["hiddenTBHB"]}
        />
         <FieldSelect
            width={mode === "plane"?"80px":"96px"}
            value={name}
            required={dataItem.required}
            onChange={(value, index) => that.onFieldSelectChange(value, index, )}
            index={index}
            item={dataItem}
            mode={mode}
          />
        <InputTextComponent
          width={mode === "plane"?"300px":"260px"}
          placeholder={name}
          index={index}
          item={dataItem}
          onChange={(value, index, type) => { that.onInputTextChange(value, index, type); }}
          parentFieldForTargetField={that.parentFieldForTargetField}
          onDeselect={(value, index) => that.onDeselect(value, index)} 
        />
        {
          mode === "plane" && dataItem.referenceInfo && dataItem.referenceInfo.rangeType=="month" && !dataItem.referenceInfo.content.isSingleCalendar ?
          <FastSelectDateModel
             values={dataItem.valueArray}
             onChange={(value) => { that.onInputTextChange(value, index,null,"submit"); }}
          />:null
        }
        </div>
    );
    }
  }