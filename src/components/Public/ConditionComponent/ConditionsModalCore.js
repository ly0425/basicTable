import React from 'react';
import { Input, Select, DatePicker, InputNumber, Cascader, Icon, Spin, TreeSelect, Tooltip, Button } from '@vadp/ui';
import { dateFormat,yearOverYearValuesFn,relativeDateChange,dateBackForLinkFn } from './Operations';
import moment from 'moment';
import isRoutePublic from '@/constants/IntegratedEnvironment';
import MonthRangePicker from './ComponentList/MonthRangePicker';
import ReferenceInfoRef from './ComponentList/ReferenceInfoRef';
const maxNumber = 100000000000000000000;
const { RangePicker, MonthPicker } = DatePicker;
const InputGroup = Input.Group;
const Option = Select.Option;
import {getRefObj, changeDataCeferenceSelect, isMultipleCeferenceSelect,getReference} from './objManger/ref';
let test = 1
// －－集中处理组件，解决同一个组件反复被调用的问题－－－

const renderExtraFooterFn = (a)=>{
  return <div style={{width:"100px",height:"38px"}}><button>确定</button></div>
}
const publicComponentBoxLabelOnclick=(analysisModelId)=>{
  if(analysisModelId && window.location.href && window.location.href.indexOf("edit") > -1){
       window.location.href =window.location.href.split("/#/")[0]+"/#"+isRoutePublic+"dataModel/AnalysisModelNew/edit/"+analysisModelId+"?goBackUrlForanalysisModel";
   }
}

const timeRangeMAP={
  num:0,
  val:null, //第一次点击的值
  clear:function () {
    this.num=0;
    this.val='';
  }
}

const publicComponentBox = (name, obj, specialParameter = null) => {
  let input = null;

  switch (name) {
    case 'Input':
      input = <Input {...obj} />;
      break;
    case 'RangePicker':
         input = <RangePicker {...obj} ref={"RangePicker"} />; 
      break;
    case 'MonthRangePickerTag':
        input = <MonthRangePicker {...obj} ref={"RangePicker"} />; 
      break;
    case 'DatePicker':
      input = <DatePicker {...obj} />;
      break;
    case 'MonthPicker':
      input = <MonthPicker {...obj}  />;
      break;
    case 'InputNumber':
      
      input = <InputNumber {...obj} />;
      break;
    case 'Select':
      input = <Select {...obj} dropdownClassName="bi"  />;
      break;
    case 'TreeSelect':
      input = <TreeSelect {...obj} />;
      break;
    case 'Option':
      input = <Option {...obj} />;
      break;
    case 'Cascader':
      input = <Cascader {...obj} dropdownClassName="bi" />;
      break;
    case 'InputGroup':
      input = <InputGroup {...obj} />;
      break;
    case 'SelectGroup':
      input =obj.children;
    case 'label':
      input = <label {...obj}  onClick={publicComponentBoxLabelOnclick.bind(this,obj.analysisModelId)}/>;
      break;
    case 'Tooltip':
      input = <Tooltip {...obj} />;
      break;
    case 'ReferenceInfoRef':
      input =<ReferenceInfoRef obj={{...obj}}  specialParameter={specialParameter}/>;

      break;
    case 'ExternalReference':
      input = <div className="ReferenceInfoRef ExternalReference"><Select {...obj} dropdownClassName="bi" /></div>;
      break;
    case 'treeref':
      input = (<div className="treeref">
        <Cascader {...obj} dropdownClassName="bi" />
        {
          specialParameter && specialParameter.fetching ? <div className="refercen">
            <Spin size="small" />
          </div>:null
        }
      </div>);

      break;
  }
  return input;
};

const nothingOption = (value = '清空') => {
  return (publicComponentBox('Option', { key: 0, value: null, children: value }));
};

const yearDataPublic = (num, value = null, arr, fn) => {
  let initYear = value ? new Date(value) : new Date();
  initYear = Number(initYear.getFullYear());
  const data = arr;
  for (let i = 1; i <= num; i++) {
    const year = initYear + 1 - i;
    data.push(fn(year, year));
  }
  return data;
};
const currentDateFn = (arr,nothingData,fn)=>{
  const data = nothingData;
  if(arr){

    arr.map(item=>{
      data.push(fn(item.label,item.key));
    })
  }
  return data;
}
//年选框组件
const yearOption = (num, value = null,isHaveNothing) => {
  const fn = (year, i) => {
    return publicComponentBox('Option', { key: i, value: `${year}`, children: year });
  };
  let nothingData=[];
  if(!!isHaveNothing){
    nothingData=[nothingOption()];
  }
  const data = [...currentDateFn(null,[],fn),...yearDataPublic(num, value = null,nothingData, fn)];
  return data;
 
};

//相对日期组件
const relativeDateOption = (arr) => {
  const fn = (year, i) => {
    return publicComponentBox('Option', { key: i, value: i, children: year });
  };
  const data = currentDateFn(arr,[nothingOption()],fn)
  return data;
}

const monthDataPublic = (arr, fn) => {
  const data = arr;
  for (let i = 1; i <= 12; i++) {
    data.push(fn(i));
  }

  return data;
};
const monthOption = () => {
  const fn = (i) => {
    return publicComponentBox('Option', { key: i, value: i, children: i });
  };
  const data = monthDataPublic([nothingOption()], fn);
  return data;
};


  // --年和数值类型区间与时间公用的方法--
const yearInputRangeAllFn = (item, obj, _obja, type, that, referenceInfoType,relativeDateData) => {
  let values = item.values;
  let inputNumber = ['', ''];
  if (values !== '' && values!=null && values !=undefined) {
    if(typeof (values) === 'string'){
      inputNumber = values.split(',')
    }else if(typeof (values) === "number"){
      inputNumber = (values+"").split(',')
    }else{
      inputNumber = values
    }
    inputNumber[0] = inputNumber[0] != 'undefined' ? inputNumber[0] : '';
    inputNumber[1] = inputNumber[1] != 'undefined' ? inputNumber[1] : '';
  }
  const _objArr = [];
  inputNumber.forEach((item, i) => {
    const _obj = deepCopyUseJSON(_obja);
    _obj.onChange = i ? (value) => { that.check([inputNumber[0], value]); } : (value) => { that.check([value, inputNumber[1]]); };
    _obj.value = item;

    _obj.allowClear = true
    if (type === 'Select') {
      if(referenceInfoType === "year"){
        _obj.children = yearOption(10);
      }else if(referenceInfoType === "relativeDate"){
        _obj.children = relativeDateOption(relativeDateData);
      }else{
        _obj.children = monthOption();
      }
    }

    _objArr.push(_obj);
  });
  
  obj.params = {
  }
  if(_obja.name && _obja.name!="selectGroup"){
     obj.params.className=_obja.className;
     obj.name = _obja.name;
  }else{
     obj.params.className="inputTextCss";
     obj.name = 'InputGroup';
  }
  obj.params.children=[publicComponentBox(type, _objArr[0]), <span className="conditionsModal-range_all" >~</span>, publicComponentBox(type, _objArr[1])];

  return obj;
};


  // --月份和日期公用的逻辑方法--
const DatePickerMonthPicker = (_obj, item, nameDate, Picker, format="yearMonth") => {
  const { values, operation, dataType,referenceInfo } = item;
  const _dateValues = values || '';
  let arr = [_dateValues, _dateValues];
  let _values = '';
  if (operation === 'range_all' && !(item && item.referenceInfo && item.referenceInfo.content && item.referenceInfo.content.isSingleCalendar)) {
    arr = values && typeof(values)=='string'? values.split(',') : values && values.length>1?values:['', ''];
    arr[0] = yearOverYearValuesFn(item,arr)

      _values = arr[0] && arr[1] ? [moment(arr[0], dateFormat[format]), moment(arr[1], dateFormat[format])] : [];

    _obj.params.placeholder = [`开始${nameDate}`, `结束${nameDate}`];
    _obj.name = Picker[0];

    if(format == "date"){
      // _obj.params["disabledDate"]=disabledDate
      // _obj.params["disabledRangeTime"]=disabledRangeTime
      _obj.params["showTime"]=true
      _obj.params["format"]=item.DateFormat?item.DateFormat:"YYYY-MM-DD";
      _obj.params["mode"]=['date','date'];
    }
    if(format === "date2"){
      _obj.params["format"]=item.DateFormat?item.DateFormat:"YYYY-MM-DD";
      _obj.params["mode"]=['date','date'];
      _obj.params["allowClear"]=false;
    }
  } else {
    _values = rangeChangeJudge(values);
    _values = _values ? moment(_values) : _values;
    _obj.params.placeholder = `请选择${nameDate}`;
    _obj.name = Picker[1];
    if(format == "date"){
      _obj.params["format"]=item.DateFormat?item.DateFormat:"YYYY-MM-DD";
    }
  }
  _obj.params.value = _values;
  _obj.params.className = 'inputTextCss';
  return _obj;
};
// －－－最后一项－－－－
const lastArray = (value) => {
  if (typeof value === 'string') {
    value = value.split(',');
  }
  // if(typeof value === 'string'){

  // }
  return value.length > 1 ? value[value.length - 1] : value;
};
// ----------------
const dateTreeDecode = (obj) => {
  if (obj.value) {
    const arr = [obj.type];
    obj.value.forEach((item) => {
      arr.push(item.value);
    });
    return arr;
  } else if (typeof obj === 'string') {
    return obj.split('/');
  } else {
    return obj;
  }
};
const dateTreeEncode = (valuesArray, content) => {
  let obj = {
    type: valuesArray[0],
    value: [],
  };
  if (valuesArray.length > 1) {
    if (valuesArray.length === 2) {
      const _obj = {
        field: content.year,
        value: valuesArray[1].split('-')[1],
      };
      obj.value.push(_obj);
    }
    if (valuesArray.length === 3) {
      const _obj = {
        field: content[valuesArray[0]],
        value: valuesArray[2].split('-')[1],
      };
      obj.value.push(_obj);
    }
  } else {
    obj = '';
  }
  return obj;
};
const deTemporaryStorage=(type)=>{
  let data = sessionStorage.getItem(type)
  data = data?JSON.parse(data):null
  if(type=="ref"||type=="referValue"){
    if(data){
      return data
    }
  }else{
    if(data && data.length){
      return data
    }
  }
  
  return null
}
const enSessionStorage=(type,data)=>{
  sessionStorage.setItem(type, JSON.stringify(data));

}
let isOpen = false;
// --InputText组件的核心逻辑方法--
const createInputTextCondition = (item, disabled, fetching, data, that, mode, placeholder) => {
  const { referenceInfo } = item;
  let obj = { //默认Input
    name: 'Input',
    params: {
      value: item.value ? item.value : item.values,
      className: 'inputTextCss',
      onChange: (value) => {that.check(value.target.value)},
      placeholder,
    },
  };
  if(item.relativeDate){
    let arr = [] //需要显示什么样子的日期；
    if(referenceInfo && referenceInfo.type === 'yearMonth'){
      // relativeDateOption()
      arr = relativeDateChange[0]
    }else if(referenceInfo && referenceInfo.type === 'month'){
      arr = relativeDateChange[2]
    }
    else if(referenceInfo && referenceInfo.type === 'year'){
      arr = relativeDateChange[4]
    }
    else if(dataTypeJudgeDate(item.dataType) && !item.customDate){
      arr = relativeDateChange[2]
    }

    if (item.operation === 'range_all') {
      const _obj = {
        className: 'numberText',
      };
      obj = yearInputRangeAllFn(item, obj, _obj, 'Select', that, "relativeDate",arr);
    } else {
      const _values = rangeChangeJudge(item.values) || '';
      obj.name = 'Select';
      obj.params = {
        placeholder: '请选择年份',
        value: _values,
        onChange: (value) => { that.check(value); },
        style: { width: '100%' },
        children: relativeDateOption(arr),
      };
    }

  }else{
    if (referenceInfo && !item.customDate) {
      if(referenceInfo.content && referenceInfo.content.openCalendar){ //全日历显示
        DatePickerPublicFn(obj,item,that)
      }else{
        if (referenceInfo.type === 'yearMonth' || (referenceInfo.type === 'range' && referenceInfo.rangeType === "month")) {
          obj.params = {
            mode,
            format: dateFormat["yearMonth"],
            onPanelChange: that.handlePanelChange,
            onChange: (value, dataSource) => { that.check(dataSource); },
          };
          obj = DatePickerMonthPicker(obj, item, '月份', ['RangePicker', 'MonthPicker'], "yearMonth");
          //OESSSWTGL-18937 期间选择功能需要可以选择本月到本月
          if(referenceInfo.type === 'range' && referenceInfo.rangeType === "month" && !(referenceInfo.content && referenceInfo.content.isSingleCalendar)){
            if(obj.params && obj.params.mode && Array.isArray(obj.params.mode) && obj.params.mode.length && (obj.params.mode[0]==="month") && (obj.params.mode[1]=="month") )obj.name="MonthRangePickerTag";
          }
          } else if (referenceInfo && ((referenceInfo.type === 'year' || referenceInfo.type === 'month') || (referenceInfo.type === 'range' && referenceInfo.rangeType === "year"))) {
          if (item.operation === 'range_all' && item.referenceInfo.content && !item.referenceInfo.content.isSingleCalendar) {
            const _obj = {
              className: 'numberText',

            };
            let type = referenceInfo.type && referenceInfo.type!=="range" ?referenceInfo.type:referenceInfo.rangeType
            obj = yearInputRangeAllFn(item, obj, _obj, 'Select', that, type);
          } else {
            if(item.operation=="range_all" && (referenceInfo.type ==="year" || referenceInfo.type ==="month") ){
                  const _obj = {
                    className: 'select-range',
                    name:"SelectGroup"
                  };
                  obj=yearInputRangeAllFn(item, obj, _obj, 'Select', that, referenceInfo.type);
                   
            }else{
                let children=null;
                if(referenceInfo.type === 'year'){
                    children=yearOption(10,null,true);
                }else if(referenceInfo.rangeType === "year"){
                    children=yearOption(10);
                }else{
                  children=monthOption();
                }
                const _values = rangeChangeJudge(item.values) || '';
                obj.name = 'Select';
                obj.params = {
                  placeholder: '请选择年份',
                  value: _values,
                  onChange: (value) => { that.check(value); },
                  style: { width: '100%' },
                  children: children,
                };  
            }
          }
        } else if (referenceInfo && referenceInfo.type === 'treeref') {//树形结构
          obj.name = 'treeref';
          const value = item.values ? item.values.split('/') : [];
          obj.params = {
            options: data,
            style: { width: '100%' },
            placeholder,
            changeOnSelect: true,
            onChange: (value) => { that.CascaderonChange(value); },
            value:value
          };
          obj.specialParameter = {
            fetching,
          };
        } else if (referenceInfo && (referenceInfo.type === 'externalReference' || referenceInfo.type === "parameterEnum"||referenceInfo.type === "customReference")) { // 条件参照
          obj=getReference(item, fetching, data, that,referenceInfo,obj);
        } else if (referenceInfo && referenceInfo.type === 'ref') { //参照
            obj=getRefObj(item, fetching, data, that,referenceInfo,obj);
        }else if (referenceInfo && referenceInfo.type === 'dateTree' || item.dateTree ) {//日期树形
          obj.name = 'treeref';
          const value = item.values ? dateTreeDecode(item.values) : [];

          obj.params = {
            options: dateTreeData(),
            style: { width: '100%' },
            defaultValue: value,
            placeholder,
            changeOnSelect: true,
            onChange: (value) => { that.CascaderonChange(value); },

          };
          obj.specialParameter = {
            fetching,
          };
        }else if (referenceInfo && (referenceInfo.type === 'range' && (referenceInfo.rangeType == "half_year" || referenceInfo.rangeType == "season"))) {//日期树形
          obj.name = 'treeref';
          let values = item.values;
          obj.params = {
            options: dateTreeYearData(referenceInfo.rangeType),
            style: {display:"inlineBlock" },
            placeholder:"区间选择",
            changeOnSelect: true,
            onChange: (value) => { that.CascaderonChange(value); },
          };
          obj.specialParameter = {
            fetching,
          }
          const _dateValues = values || '';
          let inputNumber = [_dateValues, _dateValues];
          if(item.operation === "range_all" && !(item.referenceInfo.content && item.referenceInfo.content.isSingleCalendar)){
            // inputNumberFn(values,inputNumber)
            inputNumber=inputNumberFn(values,inputNumber)
            // if (values !== '' ) {
            //   if(typeof (values) === 'string'){
            //     inputNumber = values.split(',').length>1?values.split(','):inputNumber;
            //   }else{
            //     inputNumber = values.length>1?values:inputNumber;

            //   }
            //   inputNumber[0] = inputNumber[0] != 'undefined' ? inputNumber[0] : _dateValues;
            //   inputNumber[1] = inputNumber[1] != 'undefined' ? inputNumber[1] : _dateValues;
            // }

            inputNumber[0] = yearOverYearValuesFn(item,inputNumber)
            const _objArr = [];
            inputNumber.forEach((item, i) => {
              const _obj = deepCopyUseJSON(obj);
              _obj.params.onChange = !i ? (value) => { that.CascaderonChangeRange(([value,inputNumber[1]])); } : (value) => { that.CascaderonChangeRange(([inputNumber[0], value]))};
              _obj.params.value = dateTreeDecode(item);
              _objArr.push(_obj);
            });
            let newobj = {
              name:'InputGroup',
              params:{}
            }
            newobj.name = 'InputGroup';
            newobj.params = {
              className: 'inputTextCss',
              children: [publicComponentBox(obj.name, _objArr[0].params), <span className="conditionsModal-range_all" >~</span>, publicComponentBox(obj.name, _objArr[1].params)],
            };
            return newobj;
          }else{
            obj.params["style"]["width"]="100%"
            if(item.referenceInfo.content && item.referenceInfo.content.isSingleCalendar){
              obj.params["defaultValue"]= item.values.split(",")[0].split("/")
            }
            let originObj = obj;

            return originObj
          }

        }
        /*   }
         } else if (item.dataType === 'date') {
           obj.name = 'RangePicker';
           obj.params = {
             defaultValue: item.value ? [moment(item.value.substring(0, 10), 'YYYY-MM-DD'),
                 moment(item.value.substring(11), 'YYYY-MM-DD')] : '',
             onChange: (value, dataSource) => {
               that.check(dataSource);
             },*/
      }
    } else if (dataTypeJudgeDate(item.dataType) && !item.customDate) {
      if(item.dataType=="date"){
        // 查询方案实现相对日期快捷方式
        if (item.operation === 'relative') {
          const relativeData = [
            {key:'today',label:'今日'},
            {key:'week',label:'本周'},
            {key:'weekBeginToToday',label:'本周至今日'},
            {key:'currentPeriod',label:'本期'},
            {key:'month',label:'本月'},
            {key:'earlyOfMonth',label:'本月上旬'},
            {key:'middleOfMonth',label:'本月中旬'},
            {key:'lastOfMonth',label:'本月下旬'},
            {key:'monthBeginToToday',label:'本月至今日'},
            {key:'quarter',label:'本季度'},
            {key:'quarterBeginToToday',label:'本季至今日'},
            {key:'year',label:'本年'},
            {key:'yearBeginToToday',label:'本年至今日'},
          ]
          let newItemValues= relativeData.map(item => ({ key:item.id, label:item.displayName}))
          let _values = changeDataCeferenceSelect(newItemValues || item.selectedDate, false);
          obj.name = 'Select';
          obj.params = {
            placeholder: '请选择',
            // value: _values,
            // defaultValue: item.selectedDate,
            onChange: (e, value) => {
              const getFixedDate = JSON.parse(localStorage.getItem('getFixedDate'))
              const dataKey = getFixedDate[value.props.value]
              const newData = dataKey.beginValue+","+dataKey.endValue
              item.values = [newData]
            },
            style: { width: '100%' },
            children: relativeData.map((d, i) => publicComponentBox('Option',
                {
                  value: `${d.key}`,
                  key: `${d.key}`,
                  title: `${d.label}`,
                  children:
                      <span style={{height: 10, display: 'inline-block'}}>{d.label}</span>
                })),
          };
        } else if (item.operation === 'range_all'){
            // 添加自定义页脚
            const renderExtraFooterFn = ()=>{
              return  <Button type="primary" size="small" style={{float:'right',margin: '8px 0'}}
                              onClick={()=>{
                                isOpen = false
                                that.forceUpdate()
                              }}>确定</Button>
            }
            // 自定义日期单元格的内容
            const dateRenderFn = (current)=>{
              let time = current.date()
              return <div style={{cursor:'pointer'}} className="ant-calendar-date" onClick={(e)=>{
                e.stopPropagation();
                let rangeSelectVal = current.format("YYYY-MM-DD");
                timeRangeMAP.num ++
                if (timeRangeMAP.num) {
                  if (timeRangeMAP.num === 1) {
                    timeRangeMAP.val = rangeSelectVal
                    const date = item.values.split(",")
                    let start = date[0]
                    let end = date[1]
                    if (moment(rangeSelectVal).isBefore(start)||(moment(rangeSelectVal).isAfter(start) && moment(rangeSelectVal).isBefore(end))) {
                      start = rangeSelectVal
                    } else if(moment(rangeSelectVal).isAfter(end)){
                      end = rangeSelectVal
                    }
                    date[0] = start;
                    date[1] = end;
                    item.values = date.toString()
                  } else if (timeRangeMAP.num === 2) {
                    if (moment(timeRangeMAP.val).isSame(rangeSelectVal,'day')){
                      item.values = rangeSelectVal.concat(",").concat(rangeSelectVal);
                    }else if (moment(timeRangeMAP.val).isBefore(rangeSelectVal)) {
                      item.values = timeRangeMAP.val.concat(",").concat(rangeSelectVal);
                    } else {
                      item.values = rangeSelectVal.concat(",").concat(timeRangeMAP.val);
                    }
                    timeRangeMAP.clear()
                  }
                }
                that.forceUpdate()
              }}>{time}</div>
            }
            // 弹出日历和关闭日历的回调
            const onOpenChangeFn= (status)=>{
              isOpen = status
              that.forceUpdate()
            }
            obj.params = {
              mode,
              format: dateFormat["yearMonthDay"],
              onPanelChange: that.handlePanelChange,
              onChange: (value, dataSource) => { that.check(dataSource); },
          
              open: isOpen,
              renderExtraFooter: renderExtraFooterFn,
              dateRender: dateRenderFn,
              onOpenChange: onOpenChangeFn
            };
            obj = DatePickerMonthPicker(obj, item, '日', ['RangePicker', 'DatePicker'], "date2");
          }else{
            obj.params = {
              mode,
              format: dateFormat["yearMonthDay"],
              onPanelChange: that.handlePanelChange,
              onChange: (value, dataSource) => { that.check(dataSource); },
            };
            obj = DatePickerMonthPicker(obj, item, '日', ['DatePicker', 'DatePicker'], "date");
          }
          
        }else{
            if (item.operation === 'range_all'){
              obj.params = {
                mode,
                format: dateFormat["yearMonth"],
                onPanelChange: that.handlePanelChange,
                onChange: (value, dataSource) => { that.check(dataSource); },
              };
              obj = DatePickerMonthPicker(obj, item, '月份', ['RangePicker', 'MonthPicker'], "yearMonth");
              if(obj.params && obj.params.mode && Array.isArray(obj.params.mode) &&
                  obj.params.mode.length && (obj.params.mode[0]==="month") &&
              (obj.params.mode[1] === "month"))obj.name="MonthRangePickerTag";
        } else{
          obj.params = {
            mode,
            format: dateFormat["yearMonth"],
            onPanelChange: that.handlePanelChange,
            onChange: (value, dataSource) => { that.check(dataSource); },
          };
          obj = DatePickerMonthPicker(obj, item, '月份', ['MonthPicker', 'MonthPicker'], "yearMonth");
        }
      }
    } else if (item.dataType.toLowerCase() === 'int') {
      if (item.operation === 'range_all') {
        const _obj = {
          className: 'numberText',
          max: maxNumber,
          min: ~maxNumber,
        };
        obj = yearInputRangeAllFn(item, obj, _obj, 'InputNumber', that);
      } else if (item.operation === 'in' || item.operation === 'notin') {
        const _values = item.values;
        obj.params = {
          value: _values,
          className: 'inputTextCss',
          onChange: (value) => { that.check(value.target.value); },
        };
      } else {
        const _values = rangeChangeJudge(item.values);
        obj.params = {
          value: _values,
          className: 'inputTextCss',
          onChange: that.check,
          max: maxNumber,
          min: ~maxNumber,
        };
        obj.name = 'InputNumber';
      }
    } else if (item.dataType.toLowerCase() === 'boolean') {
      const _values = rangeChangeJudge(item.values) || '';
      const refData = [
        {id: 0, displayName: '否'},
        {id: 1, displayName: '是'}
      ];
      obj.name = 'Select';
      obj.params = {
        placeholder: '请选择',
        defaultValue: item.value,
        // value: _values,
        onChange: (value) => {
          that.check(value);
        },
        style: {width: '100%'},
        children: refData.map((d, i) => publicComponentBox('Option',
            {
              value: `${d.id || d.ID || d.name || d.NAME || i}`,
              key: `${d.id || d.ID || d.name || d.NAME || i}`,
              children:
                  <Tooltip
                      title={d.displayName || d.name || d.id || d.ID}
                      linkField={d.linkField || d.name || d.id}
                  >
                    <span>{d.displayName || d.name || d.id || d.ID}</span>
                  </Tooltip>,
            })),
      };
    } else if (item.customDate) {
      obj.params = {
        value: item.values,
        className: 'inputTextCss',
        onChange: that.check,
        min: 0,
        max: 1440,
      };
      obj.name = 'InputNumber';
    }
  }

  return obj;
};
const  inputNumberFn= (values,inputNumber)=>{
  if (values !== '' ) {
    if(typeof (values) === 'string'){
      inputNumber = values.split(',').length>1?values.split(','):inputNumber;
    }else{
      inputNumber = values.length>1?values:inputNumber;

    }
    inputNumber[0] = inputNumber[0] != 'undefined' ? inputNumber[0] : _dateValues;
    inputNumber[1] = inputNumber[1] != 'undefined' ? inputNumber[1] : _dateValues;
  }
  return inputNumber
}
const DatePickerPublicFn = (obj,item,that) => {
  obj.params = {
    onChange: (value, dataSource) => { that.check(dataSource); },
  };
  obj = DatePickerMonthPicker(obj, item, '日期', ['RangePicker', 'DatePicker'], "date");
}

   // －－－－－－－类型判断－－－－－－－－
const dataTypeJudgeDate = (val) => {
  return val && (val.toLowerCase() == 'date' || val.toLowerCase() == 'timestamp' || val.toLowerCase() == 'datetime');
};

// －－－－－－“,”－range_all转换称单数是判断－－－－－－－－
const rangeChangeJudge = (val) => {
  let values=val && typeof val === 'string' && val.match(',') ? (val.split(',')[0] ? val.split(',')[0] : null) : (emptyNotZero(val) ? val : null);
  return values
};

   // －－－－－－－非零空并集判断，判断－－－－－－－－
const emptyNotZero = (val) => {
  if(Array.isArray(val)){
     if(val.length)
     {
       return true;
     }else{
       return false;
     }

  }
  return val != 'undefined' && val != null && val !== '' && val != undefined;
};

// －－－－－－－使用字符串序列化进行深拷贝－－－－－－－－
const deepCopyUseJSON = (value) => {
  let newValue = JSON.stringify(value);
  newValue = JSON.parse(newValue);
  return newValue;
};


const typeLoop = (key) => {
  let type = '';
  switch (key) {
    case 'listData':
      type = 'listData';
      break;
    case 'customDate':
      type = 'customDate';
      break;
    case 'rangeData':
      type = 'rangeData';
      break;
    default:
      type = key;
      break;
  }
  return type;
};
// --------进行不可选条件的方法-------
const CascaderDataDisabledFn = (data, fields) => {
  Object.keys(data).forEach((datakey) => {
    fields.forEach((fieldskey, index) => {
      if (fieldskey && !fieldskey.children) {
        if (data.listData && data.listData.length) {
          data.listData.forEach((itemfields) => {
            if (itemfields.aliasName == fieldskey.value ||(!itemfields.aliasName && itemfields.fieldName == fieldskey.value) ) {
              fieldskey.disabled = true;
            }
          });
        }
      } else if (fieldskey && fieldskey.value === datakey && data[datakey].length) {
        if (!data.customDate) {
          fieldskey.disabled = true;
        } else {
          data.customDate.forEach((itemfields) => {
            fieldskey.children.forEach((item) => {
              if ( itemfields.aliasName == item.obj.aliasName || itemfields.fieldName == item.obj.fieldName ) {
                item.disabled = true;
              }
            });
          });
        }
      }
    });
  });
  return fields;
};
const CascaderDataFn = (fields,isRender) => {
  const newData = constructionData(fields,isRender);
  const CascaderData = [];
  let fieldOperationbclass = true;
  for (var key in newData) {
    const objFather = {
      value: key,
      label: key,
      children: [],
    };
    const groupInfo = {
      value: 1,
      label: '以下组的成员全选',
    };
    newData[key].forEach((item, index) => {
      const obj = {
        value: item.aliasName || item.fieldName,
        label: item.comments || item.fieldName || item.aliasName,
        obj: item,
      };
      if (key == 'listData') {
        obj.index = index;
        CascaderData.push(obj);
      } else {
        fieldOperationbclass = false;
        if (key !== 'customDate') {
          obj.disabled = true;
          objFather.label = item.groupInfo && item.groupInfo.name ? item.groupInfo.name : '';
        } else {
          objFather.label = item[key].label;
        }
        objFather.index = index;
        objFather.children.push(obj);
      }
    });
    if (key !== 'listData') {
      CascaderData.unshift(objFather);
    }
  }
  return { CascaderData, fieldOperationbclass };
};

const constructionData = (data, customData = [],benchmarkDateCopy,isRender=false) => {
  let newData = {};
  newData = data.length ? {
    listData: [],
  } : {};
  data.map((item) => {
    //item.aliasName 有可能为不存在或者null 去掉了 && item.aliasName
    //2019 5 23
   // if ((!item.procedure && item.aliasName && item.fieldName ) || (item.procedure && item.fieldName)) {
     if(item.referenceInfo && item.referenceInfo.type === "range"){
      // item.operation = item.referenceInfo.content && item.referenceInfo.content.isSingleCalendar?"singleCalendar":"range_all";
      item.operation = "range_all";

      // 添加新区间类型选项 6.3
      if(!item["referenceInfo"]["rangeType"]){
        item["referenceInfo"]["rangeType"] = "month"
      }

      if(item["referenceInfo"]["rangeType"]=="month" && isRender){
        let dateBack = item.referenceInfo.relativeDate?item.referenceInfo.relativeDate:"none"
        if(dateBack!="none" ){
          if(item.referenceInfo.content && item.referenceInfo.content.isSingleCalendar){
            item["values"] = dateBackForLinkFn(dateBack,benchmarkDateCopy,null,0)

          }else{
            item["values"] = dateBackForLinkFn(dateBack)
          }
        }
      }
      if(!item["referenceInfo"]["rangeComparison"]){
        item["referenceInfo"]["rangeComparison"] = "origin"
      }
      if(item["copyDateValues"]){
        item.values = item["copyDateValues"]
      }
     }
     if(item.referenceInfo && item.referenceInfo.relativeDate && isRender){
       if(benchmarkDateCopy!="null"&& benchmarkDateCopy){
        let format = 'YYYY-MM'
        if(item.referenceInfo.content && item.referenceInfo.content.openCalendar){
          format = item.DateFormat?item.DateFormat:'YYYY-MM-DD'
        }
        if(item.referenceInfo.content && item.referenceInfo.content.isSingleCalendar){
          item["values"] = dateBackForLinkFn(item.referenceInfo.relativeDate,benchmarkDateCopy,format,0)

        }else{

          item.values = dateBackForLinkFn(item.referenceInfo.relativeDate,benchmarkDateCopy,format)
        }
       }
     }
    if ((!item.procedure && item.fieldName ) || (item.procedure && item.fieldName)) {
      if (item.linkageInfo) {
        let parenttype = 'listData';
        if (item.groupInfo) {
          parenttype = item.groupInfo.id;
        }
        data.map((itemb) => {
          if (itemb.fieldName === item.linkageInfo.target.fieldName || itemb.aliasName === item.linkageInfo.target.fieldName) {
            if (!itemb.parentFields) {
              itemb.parentFields = [];
            }
            let fs = { type: parenttype, parentField: item.aliasName || item.fieldName } ;
            let includeFlag = false ;
            for(let f of itemb.parentFields){
              if(fs.type===f.type && fs.parentField===f.parentField){
                includeFlag = true ;
                break ;
              }
            }
            if(!includeFlag){
              itemb.parentFields.push(fs);
            }
            if (itemb.groupInfo) {
              item.linkageInfo["type"] = itemb.groupInfo.name;
            } else {
              item.linkageInfo["type"] = 'listData';
            }
          }
        });
      }
    }
  });

  data.forEach((item) => {
    //if ((item.aliasName && item.fieldName) || item.dateTree || (item.procedure && item.fieldName)) {
    if ( item.fieldName || item.dateTree || (item.procedure && item.fieldName)) {
      if (item.groupInfo && !item.customDate) {
        const obj = {};
        if (!newData[item.groupInfo.id]) {
          newData[item.groupInfo.id] = [];
        }

        newData[item.groupInfo.id].push(item);
      } else if (item.customDate) {
          item.operation = item.operationNew?item.operationNew:item.operation ;
          item.values = item.valuesNew;
        if (!newData[item.customDate.value]) {
          newData[item.customDate.value] = [];
        }
        newData[item.customDate.value].push(item);
      } else {
        newData.listData.push(item);
      }
    }
  });
  return newData;
};
const dateTreeData = () => {
  const year = (num, label, value = null, ) => {
    const fn = (year, i) => {
      return {
        value: `${label}-${year}`,
        label: `${year}年`,
      };
    };
    const data = yearDataPublic(num, value = null, [], fn);
    return data;
  };
  const month = (label) => {
    const fn = (i) => {
      return {
        value: `${label}-${i}`,
        label: `${i}月`,
      };
    };
    const data = monthDataPublic([], fn);
    return data;
  };
  const quarter = [
    {
      value: 'quarter-1',
      label: '1季度',
    },
    {
      value: 'quarter-2',
      label: '2季度',

    },
    {
      value: 'quarter-3',
      label: '3季度',
    },
    {
      value: 'quarter-4',
      label: '4季度',

    },
  ];
  const halfyear = [
    {
      value: 'halfyear-1',
      label: '上半年',

    },
    {
      value: 'halfyear-2',
      label: '下半年',
    },
  ];
  const firstdata = [
    { value: 'year', label: '年' },
    { value: 'month', label: '月' },
    { value: 'quarter', label: '季度' },
    { value: 'halfyear', label: '半年' },
  ];
  firstdata.map((item) => {
    item.children = year(10, item.value);
    if (item.value === 'month') {
      item.children.map((itemchildren) => {
        itemchildren.children = month(item.value);
      });
    }
    if (item.value === 'quarter') {
      item.children.map((itemchildren) => {
        itemchildren.children = quarter;
      });
    }
    if (item.value === 'halfyear') {
      item.children.map((itemchildren) => {
        itemchildren.children = halfyear;
      });
    }
  });
  return firstdata;
};
const dateTreeYearData = (type) => {
  const year = (num, label, value = null, ) => {
    const fn = (year, i) => {
      return {
        value: `${year}`,
        label: `${year}`,
      };
    };
    const data = yearDataPublic(num, value = null, [], fn);
    return data;
  };
  let returnData = [];
  const quarter = [
    {
      value: 'quarter-1',
      label: '1季度',
    },
    {
      value: 'quarter-2',
      label: '2季度',

    },
    {
      value: 'quarter-3',
      label: '3季度',
    },
    {
      value: 'quarter-4',
      label: '4季度',

    },
  ];
  const halfyear = [
    {
      value: 'halfyear-1',
      label: '上半年',

    },
    {
      value: 'halfyear-2',
      label: '下半年',
    },
  ];
  returnData = year(10, );

  if(type=== 'season'){
    returnData.map((item)=>{
      item.children = quarter
    })
  }
  if(type=== 'half_year'){
    returnData.map((item)=>{
      item.children = halfyear;
    })
  }
  return returnData;
};





export { publicComponentBox,
        lastArray,
        createInputTextCondition,
        dataTypeJudgeDate,
        rangeChangeJudge,
         emptyNotZero,
         typeLoop,
         CascaderDataFn,
         constructionData,
         CascaderDataDisabledFn,
          deepCopyUseJSON,
          dateTreeEncode,
          deTemporaryStorage,
          enSessionStorage
         }
;


const templist = {

  groupInfo: [
    {
      aliasName: 'year_code',
      analysisModelId: '138596360990490624',
      comments: '年',
      commonUse: false,
      dataType: 'int',
      fieldName: 'year_code',
      id: 0.031551463567071725,
      index: 1,
      iscreact: false,
      operation: '=',
      referenceInfo: null,
      required: false,
      tableName: 'vc_dept_direct_cost',
      values: '',
    },
    {
      aliasName: 'month_code',
      analysisModelId: '138596360990490624',
      comments: '月',
      commonUse: false,
      dataType: 'int',
      fieldName: 'month_code',
      id: 0.44861634798125305,
      index: 2,
      iscreact: false,
      operation: '=',
      referenceInfo: null,
      required: false,
      tableName: 'vc_dept_direct_cost',
      values: '',
    },
  ],
  listData: [
    {
      aliasName: 'hosp_type_name',
      analysisModelId: '138596360990490624',
      comments: '医院类型',
      commonUse: false,
      dataType: 'string',
      fieldName: 'hosp_type_name',
      id: 0.9509958894809474,
      index: 7,
      iscreact: false,
      operation: '=',
      referenceInfo: null,
      required: false,
      tableName: 'vc_dept_direct_cost',
      values: '' },
  ],
};

const a = [{ filterField: 'cost1',
  type: 'listData',
  targetField: 'cost' }, { filterField: 'cost1',
    type: 'listData',
    targetField: 'cost1' }]
;
