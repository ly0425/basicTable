// import   {getSysParams} from 'components/Public/ChartModelUtil.js'; //ly注释
export const getDafaultValueX=({key,defaultValue, type="number",min=1,max=500})=>{
  let sysParams = getSysParams(); //本地存储
  if(sysParams){
      if(sysParams[key]){
            if(type=="number"){
                const v=parseFloat(sysParams[key].value);
                if(typeof(v)==type && v>=min && v<=max)return v;
                return defaultValue;
            }else{
               const v=sysParams[key].value;
               return v;
            } 
      }
  }
  return defaultValue;
}
const ChartConst = {
  Add_Dimension:'ADD_DIMENSIONS',
  Add_Measure:'ADD_MEASURES',
  Adjust_Measure:'ADJUST_MEASURES',
  Delete_Dimension: 'DELETE_DIMENSIONS',
  AnalysisModel_Change:'ANALYSIS_MODEL_CHANGE',
  Category:"分类",
  LeftMeasureAxis:"左值轴",
  RightMeasureAxis:"右值轴",
  ScatterLeftMeasureAxis:'X轴',
  ScatterRightMeasureAxis:'Y轴',
  Index:"指标",
  ReferenceSerie:'系列',
  SankeyDimension:'维度',
  SankeyIndex:'数值',
  color: ['rgba(98,151,217,1)', 'rgba(131,212,232,1)', 'rgba(91,184,137,1)', 'rgba(153,217,102,1)', 'rgba(229,229,87,1)'],
  //图表类型
  column: 'bar', //标准柱状图
  bar: 'bar-chart', //标准条形图
  stackColumn: 'zxdj', //柱形堆积图
  stackBar: 'stacking-bar-chart', //堆积条形图
  line: 'line',  //折线图
  area: 'area', //面积图
  pie: 'pie', //饼图
  circle: 'circle', //环形图
  nestedPie: 'nestedPie', //嵌套饼图，等真图标画出来替换成'nestedpie'
  gauge: 'gauge', //仪表盘
  scatter: 'scatter', //散点图
  bubble: 'bubble',//气泡图
  columnLine: 'bar-line', //折柱混搭
  columnWaterFall: 'waterfall', //柱形瀑布图
  rose: 'rose', //玫瑰图
  radar: 'radar', //雷达图
  map:'map',
  funnel:'funnel', //漏斗图
  treeMap: 'treemap', //矩形树图
  kpi:'KPI', //漏斗图
  pie_radius: '60%',
  pie_linewidth:'20',
  pie_inradius: '50%',
  pie_outradius: '60%',
  gauge_radius:'100%',
  multipleCirclePie:"chart_duohuanxingtu",  // 多环形图
  sankey:'sankey',//桑基图
  defaultColorKey:getDafaultValueX({key:"colorForEchart",defaultValue:1,type:"number",min:1,max:12}),
  showTootipAxisType:getDafaultValueX({key:"showTootipAxisType",defaultValue:"none",type:"boolean"}),
};


export const LightChartColors = {
  1: ['rgba(23,210,175,1)', 'rgba(104,135,241,1)', 'rgba(251,182,77,1)', 'rgba(104,215,242,1)', 'rgba(161,136,255,1)', 'rgba(255,82,119,1)', 'rgba(0,223,211,1)', 'rgba(255,160,107,1)', 'rgba(151,206,120,1)', 'rgba(51,119,255,1)', 'rgba(0,171,250,1)', 'rgba(54,207,233,1)'],
  2: ['rgba(104,135,241,1)', 'rgba(104,215,242,1)', 'rgba(251,182,77,1)', 'rgba(23,210,175,1)', 'rgba(255,82,119,1)', 'rgba(0,223,211,1)', 'rgba(255,214,11,1)', 'rgba(161,136,255,1)', 'rgba(0,171,250,1)', 'rgba(255,160,107,1)', 'rgba(151,206,120,1)', 'rgba(54,207,233,1)'],
  3: ['rgba(98,151,217,1)', 'rgba(131,212,232,1)', 'rgba(91,184,137,1)', 'rgba(153,217,102,1)', 'rgba(229,229,87,1)', 'rgba(227,162,67,1)', 'rgba(211,122,85,1)', 'rgba(229,103,134,1)', 'rgba(203,128,181,1)', 'rgba(182,104,198,1)', 'rgba(146,100,224,1)', 'rgba(132,141,228,1)'],
  4: ['rgba(103,177,141,1)', 'rgba(88,209,197,1)', 'rgba(135,197,235,1)', 'rgba(114,170,239,1)', 'rgba(95,134,242,1)', 'rgba(139,138,231,1)', 'rgba(165,136,250,1)', 'rgba(175,102,243,1)', 'rgba(223,112,215,1)', 'rgba(238,124,180,1)', 'rgba(219,113,138,1)', 'rgba(238,142,113,1)'],
  5: ['rgba(122,215,150,1)', 'rgba(188,202,151,1)', 'rgba(187,209,1,1)', 'rgba(225,187,117,1)', 'rgba(224,147,128,1)', 'rgba(207,134,222,1)', 'rgba(146,118,224,1)', 'rgba(118,151,239,1)', 'rgba(115,176,255,1)', 'rgba(119,193,239,1)', 'rgba(140,221,241,1)', 'rgba(126,224,214,1)'],
  6: ['rgba(76,137,143,1)', 'rgba(77,148,154,1)', 'rgba(79,164,171,1)', 'rgba(80,181,189,1)', 'rgba(79,193,202,1)', 'rgba(79,209,218,1)', 'rgba(79,225,236,1)', 'rgba(83,241,253,1)', 'rgba(115,244,255,1)', 'rgba(151,246,255,1)', 'rgba(192,249,255,1)', 'rgba(229,252,255,1)'],
  7: ['rgba(76,101,177,1)', 'rgba(76,105,193,1)', 'rgba(77,112,215,1)', 'rgba(78,118,240,1)', 'rgba(106,143,255,1)', 'rgba(106,185,255,1)', 'rgba(76,161,236,1)', 'rgba(76,177,218,1)', 'rgba(76,162,197,1)', 'rgba(76,148,178,1)', 'rgba(76,134,158,1)', 'rgba(76,121,141,1)'],
  8: ['rgba(76,136,84,1)', 'rgba(76,152,86,1)', 'rgba(76,172,88,1)', 'rgba(76,206,93,1)', 'rgba(82,225,100,1)', 'rgba(121,241,136,1)', 'rgba(144,242,155,1)', 'rgba(176,245,185,1)', 'rgba(213,243,177,1)', 'rgba(221,249,186,1)', 'rgba(200,248,140,1)', 'rgba(198,235,76,1)'],
  9: ['rgba(167,128,76,1)', 'rgba(208,152,76,1)', 'rgba(255,179,76,1)', 'rgba(255,206,139,1)', 'rgba(255,220,172,1)', 'rgba(214,227,148,1)', 'rgba(201,221,96,1)', 'rgba(190,210,83,1)', 'rgba(169,186,76,1)', 'rgba(144,157,76,1)', 'rgba(118,157,76,1)', 'rgba(98,158,34,1)'],
  10: ['rgba(156,143,76,1)', 'rgba(197,176,76,1)', 'rgba(239,210,76,1)', 'rgba(232,212,119,1)', 'rgba(241,226,160,1)', 'rgba(201,233,161,1)', 'rgba(174,223,112,1)', 'rgba(159,213,91,1)', 'rgba(136,203,51,1)', 'rgba(136,182,77,1)', 'rgba(96,182,65,1)', 'rgba(96,149,77,1)'],
  11: ['rgba(124,178,152,1)', 'rgba(127,202,194,1)', 'rgba(144,193,223,1)', 'rgba(131,177,237,1)', 'rgba(137,162,233,1)', 'rgba(112,141,219,1)', 'rgba(168,140,246,1)', 'rgba(191,147,234,1)', 'rgba(225,146,219,1)', 'rgba(200,139,169,1)', 'rgba(228,124,149,1)', 'rgba(224,155,135,1)'],
  12: ['rgba(102,191,181,1)', 'rgba(146,207,177,1)', 'rgba(100,207,154,1)', 'rgba(197,217,137,1)', 'rgba(225,207,126,1)', 'rgba(151,149,225,1)', 'rgba(178,138,217,1)', 'rgba(123,121,231,1)', 'rgba(114,148,243,1)', 'rgba(114,213,238,1)', 'rgba(108,197,252,1)', 'rgba(76,188,204,1)'],
  
  
}

export const DarkChartColors = {
  1: ['rgba(23,210,175,1)', 'rgba(104,135,241,1)', 'rgba(251,182,77,1)', 'rgba(104,215,242,1)', 'rgba(161,136,255,1)', 'rgba(255,82,119,1)', 'rgba(0,223,211,1)', 'rgba(255,160,107,1)', 'rgba(151,206,120,1)', 'rgba(51,119,255,1)', 'rgba(0,171,250,1)', 'rgba(54,207,233,1)'],
  2: ['rgba(104,135,241,1)', 'rgba(104,215,242,1)', 'rgba(251,182,77,1)', 'rgba(23,210,175,1)', 'rgba(255,82,119,1)', 'rgba(0,223,211,1)', 'rgba(255,214,11,1)', 'rgba(161,136,255,1)', 'rgba(0,171,250,1)', 'rgba(255,160,107,1)', 'rgba(151,206,120,1)', 'rgba(54,207,233,1)'],
  3: ['rgba(26,131,198,1)', 'rgba(56,194,229,1)', 'rgba(48,208,129,1)', 'rgba(95,206,7,1)', 'rgba(220,220,24,1)', 'rgba(253,152,2,1)', 'rgba(255,83,11,1)', 'rgba(249,10,67,1)', 'rgba(251,10,180,1)', 'rgba(190,12,226,1)', 'rgba(94,10,237,1)', 'rgba(8,59,226,1)'],
  4: ['rgba(58,224,142,1)', 'rgba(61,224,207,1)', 'rgba(46,173,251,1)', 'rgba(30,126,248,1)', 'rgba(13,75,245,1)', 'rgba(15,12,246,1)', 'rgba(71,12,237,1)', 'rgba(130,15,238,1)', 'rgba(245,13,229,1)', 'rgba(249,10,127,1)', 'rgba(249,10,67,1)', 'rgba(251,66,11,1)'],
  5: ['rgba(117,215,167,1)', 'rgba(79,193,181,1)', 'rgba(125,202,249,1)', 'rgba(91,160,248,1)', 'rgba(70,116,243,1)', 'rgba(43,86,202,1)', 'rgba(131,91,243,1)', 'rgba(192,125,255,1)', 'rgba(255,117,245,1)', 'rgba(255,141,197,1)', 'rgba(255,92,131,1)', 'rgba(255,134,98,1)'],
  6: ['rgba(61,224,207,1)', 'rgba(117,215,167,1)', 'rgba(0,204,103,1)', 'rgba(197,229,102,1)', 'rgba(235,209,89,1)', 'rgba(118,114,242,1)', 'rgba(152,90,210,1)', 'rgba(62,60,247,1)', 'rgba(54,103,238,1)', 'rgba(68,214,251,1)', 'rgba(46,173,251,1)', 'rgba(0,160,183,1)'],
  7: ['rgba(65,198,106,1)', 'rgba(161,198,65,1)', 'rgba(220,235,89,1)', 'rgba(255,196,85,1)', 'rgba(255,119,85,1)', 'rgba(190,12,226,1)', 'rgba(71,12,237,1)', 'rgba(13,75,245,1)', 'rgba(30,126,248,1)', 'rgba(46,173,251,1)', 'rgba(68,214,251,1)', 'rgba(61,224,207,1)'],
  8: ['rgba(0,88,95,1)', 'rgba(2,103,111,1)', 'rgba(5,126,135,1)', 'rgba(6,150,161,1)', 'rgba(4,168,180,1)', 'rgba(4,189,203,1)', 'rgba(5,213,229,1)', 'rgba(10,235,253,1)', 'rgba(55,240,255,1)', 'rgba(108,243,255,1)', 'rgba(165,248,255,1)', 'rgba(218,252,255,1)'],
  9: ['rgba(0,36,144,1)', 'rgba(0,42,167,1)', 'rgba(2,51,199,1)', 'rgba(3,61,234,1)', 'rgba(43,96,255,1)', 'rgba(43,156,255,1)', 'rgba(0,122,229,1)', 'rgba(0,144,203,1)', 'rgba(0,122,173,1)', 'rgba(0,103,146,1)', 'rgba(0,82,117,1)', 'rgba(1,65,92,1)'],
  10: ['rgba(0,85,11,1)', 'rgba(0,108,14,1)', 'rgba(0,137,18,1)', 'rgba(0,186,24,1)', 'rgba(0,235,30,1)', 'rgba(40,255,67,1)', 'rgba(99,255,119,1)', 'rgba(156,255,169,1)', 'rgba(204,255,211,1)', 'rgba(211,255,156,1)', 'rgba(177,255,80,1)', 'rgba(174,228,0,1)'],
  11: ['rgba(130,75,0,1)', 'rgba(188,109,0,1)', 'rgba(255,148,0,1)', 'rgba(255,186,90,1)', 'rgba(255,206,138,1)', 'rgba(237,255,138,1)', 'rgba(203,234,31,1)', 'rgba(163,191,10,1)', 'rgba(133,157,0,1)', 'rgba(98,115,0,1)', 'rgba(60,115,0,1)', 'rgba(79,152,0,1)'],
  12: ['rgba(115,95,0,1)', 'rgba(173,143,0,1)', 'rgba(232,192,0,1)', 'rgba(255,224,74,1)', 'rgba(255,236,145,1)', 'rgba(206,255,145,1)', 'rgba(160,229,73,1)', 'rgba(133,229,12,1)', 'rgba(108,191,3,1)', 'rgba(85,151,2,1)', 'rgba(44,169,0,1)', 'rgba(28,104,1,1)'],  
}

export const ChartColorMap = new Map();
ChartColorMap.set('light', {
axisLineColor: '#D9D9D9',
axisTickColor: 'rgba(0,0,0,0.15)', // 默认和轴相同
axisLabelColor: 'rgba(0,0,0,0.55)',
axisNameColor: 'rgba(0,0,0,0.45)',
pieLabelPercentColor: 'rgba(0,0,0,0.65)',
pieLabelTextColor: 'rgba(0,0,0,0.65)',
splitLineColor: ['rgba(0,0,0,0.08)'],
titleColor: 'rgba(0,0,0,0.85)', //
legendColor: 'rgba(0,0,0,0.65)', // 图例文字颜色
legendPageTextColor: 'rgba(0,0,0,0.65)', // 图例太多出现分页时页码的颜色
toolBoxColor: 'rgba(0,0,0,0.55)',
funnelLabelColor: 'rgba(0,0,0,0.45)', // 漏斗图图形标签颜色
colorPeletteBorderColor: 'rgba(0,0,0,0.15)' //调色板边框颜色
});

ChartColorMap.set('dark', {
axisLineColor: '#57575D',
axisTickColor: 'rgba(255,255,255,0.25)',
axisLabelColor: 'rgba(255,255,255,0.45)',
axisNameColor: 'rgba(255,255,255,0.45)',
pieLabelPercentColor: 'rgba(255,255,255,0.65)',
pieLabelTextColor: 'rgba(215,255,255,0.65)',
splitLineColor: ['rgba(255,255,255,0.15)'],
titleColor: 'rgba(255,255,255,0.85)',
legendColor: 'rgba(255,255,255,0.65)',
legendPageTextColor: 'rgba(255,255,255,0.65)',
toolBoxColor: 'rgba(255,255,255,0.65)',
funnelLabelColor: 'rgba(255,255,255,0.85)',
colorPeletteBorderColor: 'rgba(255,255,255,0.25)'
});

export const lightPageIconColor="#555";
export const darkPageIconColor="#fff";
//仪表盘颜色
export const lightGaugeColors = {
蓝: '#62C7E0', //'#6297d9',
绿: '#85DA42', //'#5bb889',
黄: '#E3E34A', //'#e5e557',
橙: '#F1A536', //'#e3a243',
红: '#EC7543' //'#D37a55'
};
export const darkGaugeColors = {
蓝: '#0EBDEA', //'#1a83c6',
绿: '#5FCE07', //'#30d081',
黄: '#DCDC18', //'#dcdc18',
橙: '#FD9802', //'#fd9802',
红: '#FF530B' //'#ff530b'
};

//预警线颜色
export const markLineColors = {
蓝: '#00D3FF',
绿: '#00F8E6',
黄: '#FFE500',
橙: '#D45252',
红: '#f00',
黄橙:'#ffb23c',
};

//UE规范
export const VHChartStyle = {
commonChartStyle:{
  axisSplitLineStyle: { //网格线样式
    width: 1,
    type: 'dashed'
  },
  title: {
    padding: [3,0,0,0]
  },
  canvasPadding:'16px', //图表容器默认16px内边距
  toolBox:{
    itemSize:12
  }
},
barChartStyle:{
  barWidth: '50%', //柱形堆积图、条形堆积图、瀑布图和唯一系列图柱宽50%
  barGap: '0', //同类目柱间距（多系列图）默认0，即簇状柱图
  barBorderRadius:getDafaultValueX({key:"barBorderRadius",defaultValue:25}),
},
lineChartStyle:{
  symbolSize:6,
  lineWidth:1.5,
  smooth:getDafaultValueX({key:"lineSmooth",defaultValue:0,type:"number",min:0,max:30})
},
xAxisLabel:{
  wordWrapNumber:4
}
}

export const radarChartInfo = {
  legendcolors: ["#6297d9", "#83d4e8","#5bb889", "#99d966","#e5e557", "#e3a243","#d37a55", "#e56786","#cb80b5", "#b668c6","#9264e0", "#848de4"],   
  radialColor: [["#6297d9", "#6297d9", "#6297d9"], ["#83d4e8", "#83d4e8", "#83d4e8"], ["#5bb889", "#5bb889", "#5bb889"], ["#99d966", "#99d966", "#99d966"], ["#e5e557", "#e5e557", "#e5e557"], ["#e3a243", "#e3a243", "#e3a243"], ["#d37a55", "#d37a55", "#d37a55"], ["#e56786", "#e56786", "#e56786"], ["#cb80b5", "#cb80b5", "#cb80b5"], ["#b668c6", "#b668c6", "#b668c6"], ["#9264e0", "#9264e0", "#9264e0"], ["#848de4", "#848de4", "#848de4"],],  //series覆盖区域颜色
  linearColor: [ ["#e56786", "#e56786", "#e56786"], ["#cb80b5", "#cb80b5", "#cb80b5"], ["#b668c6", "#b668c6", "#b668c6"], ["#9264e0", "#9264e0", "#9264e0"], ["#848de4", "#848de4", "#848de4"],["#6297d9", "#6297d9", "#6297d9"], ["#83d4e8", "#83d4e8", "#83d4e8"], ["#5bb889", "#5bb889", "#5bb889"], ["#99d966", "#99d966", "#99d966"], ["#e5e557", "#e5e557", "#e5e557"], ["#e3a243", "#e3a243", "#e3a243"], ["#d37a55", "#d37a55", "#d37a55"],], //series边界线条颜色
  }
export default ChartConst;

