
import Common from 'components/Print/Common';

const comm = new Common();

export const defaultCellWidth = 84;
export const defaultCellHeight = 33;

const defaultTextBoxColor = 'none';
const defaultTextBoxWidth = 84;
const defaultTextBoxHeight = 24;
const defaultTextBoxFamily = 'Microsoft YaHei';
const defaultTextBoxSize = 14;
const defaultTextBoxHorizontal = 'Left';
const defaultTextBoxVertical = 'Middle';
const defaultTextBoxBorderColor = 'Transparent';
const defaultTextBoxBorderWidth = 1;
const defaultTextBoxFontStyle = 'hidden';
const defaultTextBoxBackGroundColor = 'transparent';
const defaultTextBoxPadding = {
  top: '2px',
  bottom: '2px',
  left: '8px',
  right: '8px',
};

const defaultTextBox = {
  autoWrap: true,
  name: '',
  location: { left: 0, top: 0 },
  size: { width: defaultTextBoxWidth, height: defaultTextBoxHeight },
  backGroundColor: defaultTextBoxBackGroundColor,
  fontColor: defaultTextBoxColor,
  horizontalAlignment: defaultTextBoxHorizontal,
  verticalAlignment: defaultTextBoxVertical,
  fontInfo: {
    family: defaultTextBoxFamily,
    size: defaultTextBoxSize,
    fontType: 'Normal',
    // fontWeight: 'Normal',
    fontDecoration: 'Normal',
  },
  value: '',
  formatObject: {},
  action: {
    conditions: [],
    linkAgeSource: '',
    target: '',
    targetObject: [],
  },
  frameBorder: {
    borderWidths: {
      top: defaultTextBoxBorderWidth,
      bottom: defaultTextBoxBorderWidth,
      left: defaultTextBoxBorderWidth,
      right: defaultTextBoxBorderWidth,
    },
    borderLineStyles: {
      left: defaultTextBoxFontStyle,
      right: defaultTextBoxFontStyle,
      top: defaultTextBoxFontStyle,
      bottom: defaultTextBoxFontStyle,
    },
    borderColors: {
      top: defaultTextBoxBorderColor,
      bottom: defaultTextBoxBorderColor,
      left: defaultTextBoxBorderColor,
      right: defaultTextBoxBorderColor,
    },
    borderShowStyle: {
      top: defaultTextBoxFontStyle,
      bottom: defaultTextBoxFontStyle,
      left: defaultTextBoxFontStyle,
      right: defaultTextBoxFontStyle,
    },
    padding: {
      top: '2px',
      bottom: '2px',
      left: '8px',
      right: '8px',
    },
  },
  borderColor: defaultTextBoxBorderColor,
  borderWidth: defaultTextBoxBorderWidth,
  borderStyle: defaultTextBoxFontStyle,
  borderPadding: defaultTextBoxPadding,
};

const TableUtil = {
  generateTextBox({ type, text, placeHolder, internal } = {}) {
    let textBox;
    if (internal) {
      textBox = { id: comm.genId() };
    } else {
      textBox = { ...defaultTextBox, id: comm.genId() };
    }
    if (type) {
      textBox.type = type;
      textBox.placeHolder = placeHolder;
    }
    if (text) {
      textBox.value = text;
    }
    return textBox;
  },
  generateCell({
    type,
    placeHolder,
    width,
    height,
    text,
    colspan,
    rowspan,
    display,
    model,
    sumTag,
  } = {}) {
    const objCell = {
      width: width || defaultCellWidth,
      height: height || defaultCellHeight,
      colspan: colspan || 1,
      rowspan: rowspan || 1,
      display: display === undefined ? 1 : display,
      model,
      sumTag,
    };

    objCell.textBox = this.generateTextBox({ type, text, placeHolder, internal: true });
    return objCell;
  },
  setTextBoxStyle(textBox, style) {
    const childFontInfoStyle = {
      fontWeight: style.fontWeight,
      family: style.fontFamily,
      size: style.fontSize,
      fontType: style.fontStyle,
      fontDecoration: 'Normal',
    }
    // const childPaddingStyle = {
    //   left : style.paddingLeft || '2px',
    //   right : style.paddingRight || '2px',
    //   top : style.paddingTop || '2px',
    //   bottom : style.paddingBottom || '2px',
    // }
    if (style.textDecoration) {
      if (style.textDecoration === 'line-through') {
        childFontInfoStyle.fontDecoration = 'Strikeout';
      } else if (style.textDecoration === 'underline') {
        childFontInfoStyle.fontDecoration = 'UnderLine';
      }
    }
    textBox.fontColor = style.color;
    textBox.backGroundColor = style.backgroundColor;
    if (style.textAlign) {
      textBox.horizontalAlignment = style.textAlign;
    }
    if (style.verticalAlign) {
      textBox.verticalAlignment = style.verticalAlign;
    }
    textBox.fontInfo = Object.assign({}, textBox.fontInfo, childFontInfoStyle);
    // textBox.frameBorder.padding = Object.assign({},textBox.frameBorder.padding,childPaddingStyle);
    // textBox.fontInfo = Object.assign({},textBox.fontInfo,childStyle);
    // if (style.fontWeight) {
    //   textBox.fontInfo.fontWeight = style.fontWeight;
    // }
    // if (style.fontFamily) {
    //   textBox.fontInfo.family = style.fontFamily;
    // }
    // if (style.fontSize) {
    //   textBox.fontInfo.size = style.fontSize;
    // }
    // if (style.fontStyle) {
    //   textBox.fontInfo.fontType = style.fontStyle;
    // }
    // const padding = textBox.frameBorder.padding;
    // padding.left = style.paddingLeft || '2px';
    // padding.right = style.paddingRight || '2px';
    // padding.top = style.paddingTop || '2px';
    // padding.bottom = style.paddingBottom || '2px';

  },
  getStyleFromTextBox(textBox) {
    if (!textBox) {
      return {};
    }
    const fontInfo = textBox.fontInfo || {};
    const defaultFontInfo = defaultTextBox.fontInfo;
    const frameBorder = textBox.frameBorder || {};
    const style = {
      backgroundColor: textBox.backGroundColor || defaultTextBox.backGroundColor,
      textAlign: textBox.horizontalAlignment,
      verticalAlign: textBox.verticalAlignment || defaultTextBox.verticalAlignment,
      fontWeight: fontInfo.fontWeight || defaultFontInfo.fontWeight,
      fontFamily: fontInfo.family || defaultFontInfo.family,
      fontSize: fontInfo.size || defaultFontInfo.size,
      fontStyle: fontInfo.fontType || defaultFontInfo.fontType,
      boxSizing: 'border-box',
    };
    // if (frameBorder.padding) {
    //   style.paddingTop = frameBorder.padding.top || defaultTextBox.borderPadding.top;
    //   style.paddingBottom = frameBorder.padding.bottom || defaultTextBox.borderPadding.bottom;
    //   style.paddingLeft = frameBorder.padding.left || defaultTextBox.borderPadding.left;
    //   style.paddingRight = frameBorder.padding.right || defaultTextBox.borderPadding.right;
    // } else {
    style.paddingTop = defaultTextBox.borderPadding.top;
    style.paddingBottom = defaultTextBox.borderPadding.bottom;
    style.paddingLeft = defaultTextBox.borderPadding.left;
    style.paddingRight = defaultTextBox.borderPadding.right;
    // }

    if (textBox.fontColor !== 'none') {
      style.color = textBox.fontColor;
    }

    if ((fontInfo.fontDecoration || defaultFontInfo.fontDecoration) === 'Strikeout') {
      style.textDecoration = 'line-through';
    } else if ((fontInfo.fontDecoration || defaultFontInfo.fontDecoration) === 'UnderLine') {
      style.textDecoration = 'underline';
    }
    return style;
  },
  parsePoint(p) {
    const arr = p.split(',');
    return { row: parseInt(arr[0], 10), col: parseInt(arr[1], 10) };
  },
  getStartPointFromSet(set) {
    let v;
    for (const p of set) {
      const e = this.parsePoint(p);
      if (!v || v.col > e.col || v.row > e.row) {
        v = { ...e };
      }
    }
    return v;
  },
  getEndPointFromSet(set) {
    let v;
    for (const p of set) {
      const e = this.parsePoint(p);
      if (!v || v.col < e.col || v.row < e.row) {
        v = { ...e };
      }
    }
    return v;
  },
};
export default TableUtil;
