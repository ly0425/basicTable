import CrossSelectModal from '../CrossSelectModal';

export function createFormulaCategaries() {
  const categaries = [{
    title: '运算符', children: [
      {
        title: '数学运算', items: [
          { value: '+', description: '加', example: '' },
          { value: '-', description: '减', example: '' },
          { value: '*', description: '乘', example: '' },
          { value: '/', description: '除', example: '' },
        ]
      },
      {
        title: '关系运算', items: [
          { value: '=', description: '等于', example: '' },
          { value: '<>', description: '不等于', example: '' },
          { value: '<', description: '小于', example: '' },
          { value: '<=', description: '小于等于', example: '' },
          { value: '>', description: '大于', example: '' },
          { value: '>=', description: '大于等于', example: '' },
        ]
      },
      {
        title: '字符串', items: [
          { value: '&', description: '字符串连接', example: '' },
        ]
      },
    ]
  },
  {
    title: '函数', children: [
      {
        title: '数学', items: [
          {
            title: 'SUM',
            value: 'SUM(${number})',
            description: '计算单元格或指标范围内所有数值的和。',
            example: '=SUM(number)',
            params: [
              {
                name: 'number',
                description: '待求和的数值、单元格范围或浮动行指标'
              },
            ]
          }, // 不定参数
          {
            title: 'SUMIFS',
            value: 'SUMIFS(${sum_range}, ${criteria_range1}, ${criteria1})',
            description: '计算其满足多个条件的全部参数的总量',
            example: '=SUMIFS(sum_range, criteria_range1, criteria1)',
            params: [
              {
                name: 'sum_range',
                description: '要求和的单元格区域'
              },
              {
                name: 'criteria_range1',
                description: '使用 Criteria1 测试的区域'
              },
              {
                name: 'criteria1',
                description: '定义将计算 Criteria_range1 中的哪些单元格的和的条件，支持按多个值过滤，用英文逗号隔开'
              },
            ]
          },
          {
            title: 'COUNTIFS',
            value: 'COUNTIFS(${criteria_range1}, ${criteria1})',
            description: '计算多个区域中满足给定条件的单元格个数',
            example: '=COUNTIFS(criteria_range1, criteria1)',
            params: [
              {
                name: 'criteria_range1',
                description: '使用 Criteria1 测试的区域'
              },
              {
                name: 'criteria1',
                description: '定义将计算 Criteria_range1 中的哪些单元格的个数的条件，支持按多个值过滤，用英文逗号隔开'
              },
            ]
          },
          {
            title: 'AVERAGE',
            value: 'AVERAGE(${number1},${number2})',
            description: '返回参数的算术平均值。',
            example: '=AVERAGE(number1,number2,...)',
            params: [
              {
                name: 'number1',
                description: '要计算的数值'
              },
              {
                name: 'number2',
                description: '要计算的数值'
              }
            ]
          },
          {
            title: 'MIN',
            value: 'MIN(${number1},${number2})',
            description: '返回一组值中的最小值',
            example: '=MIN(number1, number2, ...)',
            params: [
              {
                name: 'number1',
                description: '要计算的数值'
              },
              {
                name: 'number2',
                description: '要计算的数值'
              }
            ]
          },
          {
            title: 'MAX',
            value: 'MAX(${number1},${number2})',
            description: '返回一组值中的最大值',
            example: '=MAX(number1, number2, ...)',
            params: [
              {
                name: 'number1',
                description: '要计算的数值'
              },
              {
                name: 'number2',
                description: '要计算的数值'
              }
            ]
          },
          {
            title: 'ROUND',
            value: 'ROUND(${number}, ${num_digits})',
            description: '将数字四舍五入到指定的位数。',
            example: '=ROUND(number, num_digits)',
            params: [
              {
                name: 'number',
                description: '要四舍五入的数字。'
              },
              {
                name: 'num_digits',
                description: '要进行四舍五入运算的位数。'
              }
            ]
          },
          // {
          //   title: 'SIN',
          //   value: 'SIN(${number})',
          //   description: '求正弦值。',
          //   example: '=SIN(number)',
          //   params: [{
          //     name: 'number',
          //     description: '要进行计算的数字'
          //   }]
          // },
        ],
      },
      {
        title: '文本', items: [
          // {
          //   title: 'REPLACE',
          //   value: 'REPLACE(${old_text}, ${start_num}, ${num_chars}, ${new_text})',
          //   description: '根据指定的字符数，REPLACE 将部分文本字符串替换为不同的文本字符串。',
          //   example: '=REPLACE(old_text, start_num, num_chars, new_text)',
          //   params: [
          //     {
          //       name: 'old_text',
          //       description: '要替换其部分字符的文本。'
          //     },
          //     {
          //       name: 'start_num',
          //       description: 'old_text 中要替换为 new_text 的字符位置。'
          //     },
          //     {
          //       name: 'num_chars',
          //       description: 'old_text 中希望 REPLACE 使用 new_text 来进行替换的字符数。'
          //     },
          //     {
          //       name: 'new_text',
          //       description: '将替换 old_text 中字符的文本。'
          //     },
          //   ]
          // },
          {
            title: 'LEFT',
            value: 'LEFT(${text}, ${num_chars})',
            description: '从文本字符串的第一个字符开始返回指定个数的字符。',
            example: '=LEFT(text, num_chars)',
            params: [
              {
                name: 'text',
                description: '包含要提取的字符的文本字符串。'
              },
              {
                name: 'num_chars',
                description: '可选。 指定要由 LEFT 提取的字符的数量。默认为1。'
              },
            ]
          },
          {
            title: 'RIGHT',
            value: 'RIGHT(${text}, ${num_chars})',
            description: '根据所指定的字符数返回文本字符串中最后一个或多个字符。',
            example: '=RIGHT(text, num_chars)',
            params: [
              {
                name: 'text',
                description: '包含要提取字符的文本字符串。'
              },
              {
                name: 'num_chars',
                description: '可选。 指定希望 RIGHT 提取的字符数。默认为1。'
              },
            ]
          },
          {
            title: 'MID',
            value: 'MID(${text}, ${start_num}, ${num_chars})',
            description: '返回文本字符串中从指定位置开始的特定数目的字符，该数目由用户指定。',
            example: '=MID(text, start_num, num_chars)',
            params: [
              {
                name: 'text',
                description: '包含要提取字符的文本字符串。'
              },
              {
                name: 'start_num',
                description: '文本中要提取的第一个字符的位置。 文本中第一个字符的 start_num 为 1，以此类推。'
              },
              {
                name: 'num_chars',
                description: '指定希望 MID 从文本中返回字符的个数。'
              },
            ]
          },
          // {
          //   title: 'TRIM',
          //   value: 'TRIM(${text})',
          //   description: '移除左右两侧的空格。',
          //   example: '=TRIM(text)',
          //   params: [
          //     {
          //       name: 'text',
          //       description: '要从中移除空格的文本。'
          //     },
          //   ]
          // },
          // {
          //   title: 'LTrim',
          //   value: 'LTrim(${text})',
          //   description: '移除左侧的空格。',
          //   example: '=LTrim(text)',
          //   params: [
          //     {
          //       name: 'text',
          //       description: '要从中移除空格的文本。'
          //     },
          //   ]
          // },
          // {
          //   title: 'RTrim',
          //   value: 'RTrim(${text})',
          //   description: '移除右侧的空格。',
          //   example: '=RTrim(text)',
          //   params: [
          //     {
          //       name: 'text',
          //       description: '要从中移除空格的文本。'
          //     },
          //   ]
          // },
          // {
          //   title: 'LOWER',
          //   value: 'LOWER(${text})',
          //   description: '将一个字符串的所有字母转换为小写形式',
          //   example: '=LOWER(text)',
          //   params: [
          //     {
          //       name: 'text',
          //       description: '要转换为小写字母的文本。 文本可以是引用或文本字符串。'
          //     },
          //   ]
          // },
          // {
          //   title: 'UPPER',
          //   value: 'UPPER(${text})',
          //   description: '将文本转换为大写字母。',
          //   example: '=UPPER(text)',
          //   params: [
          //     {
          //       name: 'text',
          //       description: '要转换为大写字母的文本。 文本可以是引用或文本字符串。'
          //     },
          //   ]
          // },
          // {
          //   title: 'FIND',
          //   value: 'FIND(${find_text}, ${within_text}, ${start_num})',
          //   description: '用于在第二个文本串中定位第一个文本串，并返回第一个文本串的起始位置的值，该值从第二个文本串的第一个字符算起。',
          //   example: '=FIND(find_text, within_text, start_num)',
          //   params: [
          //     {
          //       name: 'find_text',
          //       description: '要查找的文本。'
          //     },
          //     {
          //       name: 'within_text',
          //       description: '包含要查找文本的文本。'
          //     },
          //     {
          //       name: 'start_num',
          //       description: '可选。 指定开始进行查找的字符。 within_text 中的首字符是编号为 1 的字符。 如果省略 start_num，则假定其值为 1。'
          //     },
          //   ]
          // },
        ]
      }, {
        title: '逻辑', items: [
          {
            title: 'IF',
            value: 'IF(${logical_test}, ${value_if_true}, ${value_if_false})',
            description: '判断是否满足某个条件，如果满足返回一个值，如果不满足则返回另一个值。',
            example: 'IF(logical_test, value_if_true, value_if_false)',
            params: [
              {
                name: 'logical_test',
                description: '逻辑表达式',
                datasource: [{ text: '一', value: 'A1' }, { text: '二', value: 'A2' }]
              },
              {
                name: 'value_if_true',
                description: 'logical_test 为 TRUE 时的返回值'
              },
              {
                name: 'value_if_false',
                description: 'logical_test 为 FALSE 时的返回值'
              }
            ]
          }
        ]
      }, {
        title: '同比环比', items: [
          {
            title: 'getPreviousPeriod',
            value: 'getPreviousPeriod(${index_name}, ${param_year_name}, ${param_month_name}, ${year_or_month}, ${span})',
            description: '计算同比环比',
            example: '=getPreviousPeriod(index_name, param_year_name, param_month_name, year_or_month, span)',
            params: [
              {
                name: 'index_name',
                description: '指标名称'
              },
              {
                name: 'param_year_name',
                description: '年参数名称'
              },
              {
                name: 'param_month_name',
                description: '月参数名称'
              },
              {
                name: 'year_or_month',
                description: '年还是月，年用1表示，月用2表示。'
              },
              {
                name: 'span',
                description: '减去的年或月的数量。'
              },
            ]
          }
        ]
      }, {
        title: '跨表取数', items: [
          {
            title: 'getDataFromOtherSheet',
            value: 'getDataFromOtherSheet(${template_id}, ${index_id})',
            description: '跨表取数',
            example: '=getDataFromOtherSheet(template_id, index_id)',
            modal: CrossSelectModal,
            params: [
              {
                name: 'template_id',
                description: '模板ID'
              },
              {
                name: 'index_id',
                description: '指标ID'
              },
            ]
          }
        ]
      }, {
        title: '日期', items: [
          { value: 'getCurrentDate()', description: '获取当前日期', example: '' },
          { value: 'getCurrentYear()', description: '获取当前年份', example: '' },
          { value: 'getCurrentMonth()', description: '获取当前月份', example: '' },
          { value: 'getCurrentDay()', description: '获取当前日', example: '' },
        ]
      }, {
        title: '预算函数', items: [
          { value: 'edit_dept()', description: '编制科室', example: '' },
          { value: 'edit_user()', description: '编制人', example: '' },
          { value: 'phone_number()', description: '编制人电话', example: '' },
          { value: 'edit_date()', description: '编制时间', example: '' },
          { value: 'audit_opinion()', description: '审批意见', example: '' },
          { value: 'audit_person()', description: '审批人', example: '' },
          { value: 'audit_time()', description: '审批时间', example: '' }
        ]
      }],

  }];
  return categaries;
}