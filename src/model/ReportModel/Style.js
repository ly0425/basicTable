import { getDefaultColor } from 'components/Print/color';

class Style {
  constructor() {
    this.color = '';
    this.backgroundColor = 1;
    this.textAlign = 1;
    this.verticalAlign = '';
    this.fontWeight = 1;
    this.fontFamily = '';
    this.fontSize = '';
    this.fontStyle = '';
    this.fontSize = '';
  }
  static getTextBoxStyle(item, width, height, defaultTextBox) {
    const textAlign = item.textBox.horizontalAlignment || defaultTextBox.horizontalAlignment;
    const frameBorder = item.textBox.frameBorder || {};
    const textBoxStyle = {
      backgroundColor: item.textBox.backGroundColor || defaultTextBox.backGroundColor, // 文本框背景色
      height,
      width,
      overflow: 'hidden',
      cursor: 'cell',
      textAlign, // 水平对齐
      verticalAlign: item.textBox.verticalAlignment || defaultTextBox.verticalAlignment, // 垂直对齐
    };
    if (item.textBox.textIndent) {
      textBoxStyle.textIndent = item.textBox.textIndent;
    }
    // 文本框宽度
    if (frameBorder.borderWidths) {
      textBoxStyle.borderTopWidth = frameBorder.borderWidths.top || defaultTextBox.borderWidth;
      textBoxStyle.borderBottomWidth = frameBorder.borderWidths.bottom || defaultTextBox.borderWidth;
      textBoxStyle.borderLeftWidth = frameBorder.borderWidths.left || defaultTextBox.borderWidth;
      textBoxStyle.borderRightWidth = frameBorder.borderWidths.right || defaultTextBox.borderWidth;
    } else {
      textBoxStyle.borderTopWidth = defaultTextBox.borderWidth;
      textBoxStyle.borderBottomWidth = defaultTextBox.borderWidth;
      textBoxStyle.borderLeftWidth = defaultTextBox.borderWidth;
      textBoxStyle.borderRightWidth = defaultTextBox.borderWidth;
    }
    // 文本框颜色
    if (frameBorder.borderColor) {
      textBoxStyle.borderTopColor = frameBorder.borderColors.top || defaultTextBox.borderColor;
      textBoxStyle.borderBottomColor = frameBorder.borderColors.bottom || defaultTextBox.borderColor;
      textBoxStyle.borderLeftColor = frameBorder.borderColors.left || defaultTextBox.borderColor;
      textBoxStyle.borderRightColor = frameBorder.borderColors.right || defaultTextBox.borderColor;
    } else {
      textBoxStyle.borderTopColor = defaultTextBox.borderColor;
      textBoxStyle.borderBottomColor = defaultTextBox.borderColor;
      textBoxStyle.borderLeftColor = defaultTextBox.borderColor;
      textBoxStyle.borderRightColor = defaultTextBox.borderColor;
    }

    // 文本框样式
    if (frameBorder.borderLineStyles) {
      textBoxStyle.borderTopStyle = frameBorder.borderLineStyles.top || defaultTextBox.borderStyle;
      textBoxStyle.borderBottomStyle = frameBorder.borderLineStyles.bottom || defaultTextBox.borderStyle; // eslint-disable-line max-len
      textBoxStyle.borderLeftStyle = frameBorder.borderLineStyles.left || defaultTextBox.borderStyle;
      textBoxStyle.borderRightStyle = frameBorder.borderLineStyles.right || defaultTextBox.borderStyle;
    } else {
      textBoxStyle.borderTopStyle = defaultTextBox.borderStyle;
      textBoxStyle.borderBottomStyle = defaultTextBox.borderStyle; // eslint-disable-line max-len
      textBoxStyle.borderLeftStyle = defaultTextBox.borderStyle;
      textBoxStyle.borderRightStyle = defaultTextBox.borderStyle;
    }

    if (frameBorder.padding) {
      textBoxStyle.paddingTop = frameBorder.padding.top || defaultTextBox.borderPadding;
      textBoxStyle.paddingBottom = frameBorder.padding.bottom || defaultTextBox.borderPadding;
      textBoxStyle.paddingLeft = frameBorder.padding.left || defaultTextBox.borderPadding;
      textBoxStyle.paddingRight = frameBorder.padding.right || defaultTextBox.borderPadding;
    } else {
      textBoxStyle.paddingTop = defaultTextBox.borderPadding;
      textBoxStyle.paddingBottom = defaultTextBox.borderPadding;
      textBoxStyle.paddingLeft = defaultTextBox.borderPadding;
      textBoxStyle.paddingRight = defaultTextBox.borderPadding;
    }

    return textBoxStyle;
  }
  static getTextBoxFontInfoStyle(item, defaultTextBox) {
    const textAlign = item.textBox.horizontalAlignment || defaultTextBox.horizontalAlignment;
    const fontInfo = item.textBox.fontInfo || {};
    const defaultFontInfo = defaultTextBox.fontInfo;
    const textBoxColor = !item.textBox.fontColor || item.textBox.fontColor === 'none' ? getDefaultColor() : item.textBox.fontColor;
    const textBoxFontInfoStyle = {
      border: '0px',
      width: '100%',
      textAlign, // 水平对齐
      color: textBoxColor, // 字体颜色
      fontFamily: fontInfo.family || defaultFontInfo.family, // 字体样式：宋体，黑体，微软雅黑
      fontSize: `${fontInfo.size || defaultFontInfo.size}px`, // 字体大小
      fontWeight: fontInfo.fontWeight || defaultFontInfo.fontWeight, // 字体加粗 Normal & Bold
      fontStyle: fontInfo.fontType || defaultFontInfo.fontType, // 正常字体 Normal & 斜体 Italic
      margin: 0,
      outline: 'none',
      padding: 0,
      textDecoration: '',
      position: 'relative',
      top: '50%',
      transform: 'translateY(-50%)',
      overflow: 'hidden',
    };
    const tmpDecoration = (fontInfo.fontDecoration || defaultFontInfo.fontDecoration).toLowerCase();
    if (tmpDecoration === 'strikeout') {
      textBoxFontInfoStyle.textDecoration = 'line-through';
    } else if (tmpDecoration === 'underline') {
      textBoxFontInfoStyle.textDecoration = 'underline';
    }
    return textBoxFontInfoStyle;
  }
}
export class TextBoxStyle {
  constructor() {
    this.color = '';
    this.backgroundColor = 1;
    this.textAlign = 1;
    this.verticalAlign = '';
    this.fontFamily = '';
    this.fontSize = '';
    this.fontStyle = '';
    this.fontWeight = 1;
    this.fontSize = '';
    this.borderStyle = '';// 边框线
    this.borderWidth = '';
    this.borderColor = '';
    this.padding = '';
    this.margin = '';
    this.textDecoration = '';


    // height,
    // width,
    // overflow: 'hidden',
    // whiteSpace: 'nowrap',
    // cursor: 'cell',

    // position: 'relative',
    // top: '50%',
    // transform: 'translateY(-50%)',
    // overflow: 'hidden',
  }
}
export default Style;
