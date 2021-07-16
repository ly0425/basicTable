// －－－－参照获得参数判断－－－
const judgeDataTypeCeferenceSelect = (params, data) => {
  let type = null,
    list = [];
  if (params.filterName == params.codeField) {
    type = 'code';
  } else if (params.filterName == params.idField) {
    type = 'id';
  } else {
    type = 'name';
  }
  data.forEach((itme) => {
    list.push(itme[type]);
  });
  return list;
};


  // －－－－－－－合并对象－－－－－－－－
const mergeObject = (...val) => {
  return Object.assign(...val);
};

const rangeAllFn = (values) => {
  let _values = '';
  _values = (values.match('undefined') || values.endsWith(',') || values.startsWith(',')) ? '' :
    values.match(',') ? values.length > 1 ? values : ''
    : `${values},${values}`;
  return _values;
};

const toLocaleLowerCaseForOrc =(data)=>{
  let obj = {};
  if(data && data[0]){
    for(let key in data[0]){
      obj[key.toLocaleLowerCase()]=key;
    }
  }
return obj
}
// －－－－－－－使用字符串序列化进行深拷贝－－－－－－－－
const deepCopyUseJSON = (value) => {
  let newValue = JSON.stringify(value);
  newValue = JSON.parse(newValue);
  return newValue;
};

export {
    judgeDataTypeCeferenceSelect,
    mergeObject,
    rangeAllFn,
    toLocaleLowerCaseForOrc,
    deepCopyUseJSON
  };
