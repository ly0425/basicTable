import { addCategory } from "~/actions/categorySubjectAction";

function createExpressionCategaries(isExtension) {
  const categaries = [];
  const operators = {
    title: '运算符',
    children: [{
      title: '算术',
      items: [{
        title: '+',
        value: '+',
        description: '用于数字加法运算，也用于字符串连接',
      },
      {
        title: '-',
        value: '-',
        description: '用于数字减法运算',
      },
      {
        title: '*',
        value: '*',
        description: '用于数字乘法运算',
      },
      {
        title: '/',
        value: '/',
        description: '用于数字除法运算',
      },
      {
        title: '%',
        value: '%',
        description: '用于取余数',
      }],
    },
    {
      title: '比较',
      items: [{
        title: '=',
        value: '=',
        description: '关系运算符，等于',
      },
      {
        title: '<',
        value: '<',
        description: '关系运算符，小于',
      },
      {
        title: '>',
        value: '>',
        description: '关系运算符，大于',
      },
      {
        title: '<=',
        value: '<=',
        description: '关系运算符，小于等于',
      },
      {
        title: '>=',
        value: '>=',
        description: '关系运算符，大于等于',
      },
      {
        title: '<>',
        value: '<>',
        description: '关系运算符，不等于',
      }],
    },
    {
      title: '串联',
      items: [{
        title: '&',
        value: '&',
        description: '用于字符串连接',
      },
      {
        title: '+',
        value: '+',
        description: '用于数字加法运算，也用于字符串连接',
      }],
    },
    {
      title: '逻辑',
      items: [{
        title: 'Not',
        value: 'Not',
        description: '逻辑运算符，否',
      },
      {
        title: 'And',
        value: 'And',
        description: '逻辑运算符，且',
      },
      {
        title: 'Or',
        value: 'Or',
        description: '关系运算符，或',
      }],
    },
    {
      title: '符号',
      items: [
        {
          title: '(',
          value: '(',
          description: '左括号',
        },
        {
          title: ')',
          value: ')',
          description: '右括号',
        },
        {
          title: ',',
          value: ',',
          description: '逗号',
        }],
    }],
  };
  categaries.push(operators);
  return (isExtension) ? function (func, ...args) { return func(categaries, ...args) } : categaries;
}

function addCommonFunc(categaries, isExtension) {
  const commonFn = {
    title: '常见函数',
    children: [
      {
        title: '表达式函数',
        items: [
          {
            title: 'getMeasValue',
            value: 'getMeasValue()',
            description: '返回当前选中度量得值',
            example: 'getMeasValue("度量")',
          },
        ],
      }
    ]
  }
  categaries.push(commonFn);
  return (isExtension) ? function (func, ...args) { return func(categaries, ...args) } : categaries;
}


function addMeasure(categaries, isExtension,measures) {
  console.log(measures)
  const measure = {
    title: '度量',
    items: [],
  }
  measures.forEach((item)=>{
    measure.items.push({
      title:item.title,
      value:`"${item.key}"`
    })
  })
  categaries.push(measure);
  return (isExtension) ? function (func, ...args) { return func(categaries, ...args) } : categaries;
}
export {
  createExpressionCategaries,
  addCommonFunc,
  addMeasure
};

