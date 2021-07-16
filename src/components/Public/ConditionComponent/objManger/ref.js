import React from 'react';
import {  Spin,Tooltip } from '@vadp/ui';
import {deTemporaryStorage,deepCopyUseJSON,lastArray,publicComponentBox} from '../ConditionsModalCore';
import {Select} from "antd";
const getRefNewItemValues=(value,data)=>{//解决BI-2458 显示名称传递条件的问题
    let newItemValues=null;
    if(data && data.length  && value && value != ' ' && typeof value === 'string') {
      data.map((d,dIndex)=>{ 
              if(d.id == value){
                if(!newItemValues)newItemValues=[];
                newItemValues.push({
                  key:d.id,
                  label:d.displayName,
                  linkField: d.linkField
                })
              }
      }) 
    }
    return newItemValues;
}
// －－－参照值的转换－－－－
const changeDataCeferenceSelect = (value,isNotShowString) => {
    // console.log(value, 'changeDataCeferenceSelect');
    let values = [];
    if (value && value != ' ') {
      if (typeof value === 'string') { 
          if(isNotShowString){
                
          }else{
            const list = value.split(',');
            list.forEach((item, i) => {
              values.push({
                key: i,
                label: item,
              });
            });
          }
      } else {
        values = value;
      }
    }
    return values;
  };
// －－－参照值的option判断－－－－
const isMultipleCeferenceSelect = (value) => {
    return !!(value == 'in' || value == 'notin');
  };
const getRefObj=(item, fetching, data, that,referenceInfo,obj)=>{
    let mode = 'multiple';
    let refsessionStorage = deTemporaryStorage('ref');
    const refdata = refsessionStorage && !Array.isArray(refsessionStorage) && refsessionStorage[item.aliasName || item.fieldName] ? refsessionStorage[item.aliasName || item.fieldName] : data || [];
    let newItemValues=getRefNewItemValues(item.values,refdata);
    let isNotShowString=false;
    const _content=referenceInfo.content;
    if(_content && _content.field && _content.displayField && (_content.field != _content.displayField)){
      isNotShowString=true;//BI-2458 string不显示
    }
    let values = changeDataCeferenceSelect(newItemValues || item.values,isNotShowString);
    if (isMultipleCeferenceSelect(item.operation)) {
      mode = 'tags';
    } else {
      mode = 'multiple';
      values = deepCopyUseJSON(values);
      values = lastArray(values);
    }
  
    obj.name = 'ReferenceInfoRef';
    obj.specialParameter = {
      click: that.ReferenceInfoRef,
      asc: that.state.asc,
    };
    obj.params = {
      mode: 'multiple',
      labelInValue: true,
      value: values,
      placeholder: '请输入搜索值',
      notFoundContent: fetching ? <Spin size="small" /> : null,
      filterOption: false,
      onSearch: (value) => { that.fetchUser(value, item); },
      onChange: (value) => { 
        that.handleChangemultiple(value, mode); 
      },
      onFocus: (value) => { 
        that.fetchUser(value, item); 
      },
      onDeselect: (value, option) => { that.onDeselect(value, option); },
      style: { width: '92%' },
      children: refdata.map(
        (d, i) => publicComponentBox('Option', { key: `${d.id || d.ID||  d.name || d.NAME || i}`, children: <Tooltip title={d.displayName || d.name || d.id || d.ID} linkField={d.linkField  || d.name || d.id}>
      <span>{d.displayName || d.name ||  d.id || d.ID}</span>
    </Tooltip> })),
    };
    //displayName是显示名称字段，name是过滤字段
    return obj;
  }

const getReference = (item, fetching, data, that, referenceInfo, obj) => {
    obj.name = 'ExternalReference';
    let refsessionStorage = JSON.parse(localStorage.getItem('referValue')||'{}')

    let refData = refsessionStorage && !Array.isArray(refsessionStorage) && refsessionStorage[item.aliasName || item.fieldName] ? refsessionStorage[item.aliasName || item.fieldName] : data || [];
    if (refData && refData.length > 0 && item.operation !== 'in') {
        let pleaseSelect = [{id: ' ', linkField: ' ', displayName: " "}]
        refData = pleaseSelect.concat(refData)
    }
    let newItemValues = getRefNewItemValues(item.values, refData);
    let isNotShowString = false;
    const _content = referenceInfo.content;
    if (_content && _content.field && _content.displayField && (_content.field != _content.displayField)) {
        isNotShowString = true;//BI-2458 string不显示
    }
    let currentSelects=[];
    if(item.displayName){
        currentSelects = item.displayName.split('@').map(item=>{
            let arr = item.split(':')
            return {
                id:String(arr[1]),
                displayName:arr[0]
            }
        })
        newItemValues= currentSelects.map(item => ({ key:item.id, label:item.displayName}))
    }
    currentSelects = !refData.length?(currentSelects.map((d, i) => publicComponentBox('Option',
        {
            value: `${d.id || d.ID || d.name || d.NAME || i}`,
            key: `${d.id || d.ID || d.name || d.NAME || i}`,
            title: `${d.displayName || d.name || d.NAME || d.id || d.ID || i}`, // ZHCW-12744
            children:
                <span style={{height: 10, display: 'inline-block'}}>
                        {d.displayName || d.DISPLAYNAME || d.name || d.id || d.ID}</span>
        }))):[]

    // 默认值回显
    let defaultVal;
    try{
        defaultVal =item.defaultValue ? JSON.parse(item.defaultValue||'[]') : []
    }catch (e) {
        defaultVal = []
    }
    // if (item.defaultValue && newItemValues !== null) {
    if (item.defaultValue) {
        // if (item.operation === 'in') {
        // }
        if(!newItemValues && typeof item.values == 'string'){
            newItemValues=item.values.split(',').map(item=>{
                let current = defaultVal.find(c=>c.key === item);
                return {
                    key:item,
                    label:current.val
                }
            })
        }

    }
    defaultVal = !refData.length?(defaultVal.map((d, i) => publicComponentBox('Option',
        {
            value: `${d.id || d.ID || d.name || d.NAME || i || d.key}`,
            key: `${d.id || d.ID || d.name || d.NAME || i || d.key}`,
            title: `${d.id || d.ID || d.name || d.NAME || i || d.val}`,
            children:
                <span style={{height: 10, display: 'inline-block'}}>
                    {d.displayName || d.DISPLAYNAME || d.name || d.id || d.ID || d.val}</span>
        }))):[]

    let values = changeDataCeferenceSelect(newItemValues || item.values, isNotShowString);
    if (item.operation === 'in') {
        values = deepCopyUseJSON(values);
    }
    let currentCef;
    obj.params = {
        mode: item.operation === 'in' ? 'multiple' : '',
        labelInValue: true,
        value: values,
        placeholder: '请选择',
        notFoundContent: fetching ? <Spin size="small"/> : null,
        filterOption: item.referenceInfo.type === "customReference",
        showSearch: item.operation !== 'in',
        allowClear: true,
        showArrow: true,
        dropdownMatchSelectWidth:false,
        ref: (ref) => {
            currentCef = ref;
        },
        onSearch: (value) => {
            if(item.referenceInfo.type !== "customReference") {
                that.fetchUser(value, item);
            }
        },
        onChange: (value) => {
            // ZHCW-12651
            if (obj.params.mode !== 'multiple') {
                currentCef && currentCef.blur()
            }
            item.displayName = null;
            obj.params.value = value;
            that.handleChangeExternalRefSelect(value, obj.params.mode, item);
        },
        onFocus: (value) => {
            that.fetchUser(value, item);
        },
        onDeselect: (value, option) => {
            that.onDeselect(value, option);
        },
        style: {width: '100%'},
        children: refData && refData.length > 0 ? refData.map((d, i) => publicComponentBox('Option',
            {
                value: `${d.id || d.ID || d.name || d.NAME || i}`,
                key: `${d.id || d.ID || d.name || d.NAME || i}`,
                title: `${d.displayName || d.name || d.NAME || d.id || d.ID || i}`, // ZHCW-12744
                children:
                    <span style={{height: 10, display: 'inline-block'}}>
                        {d.displayName || d.DISPLAYNAME || d.name || d.id || d.ID}</span>
            })) : [],
    };
    obj.params.children=[...obj.params.children,...currentSelects,...defaultVal]
    return obj;
}

  export { 
    getRefObj,changeDataCeferenceSelect,isMultipleCeferenceSelect,getReference
  };