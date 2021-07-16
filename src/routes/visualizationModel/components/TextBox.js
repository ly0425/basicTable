/**
 * Created by Victor on 09-05-2017.
 */

import React, { Component, PureComponent } from 'react';
import Style from '@/model/ReportModel/Style';
import { Icon, Tooltip } from '@vadp/ui';
import { formulaTransform } from '@/utils/formulaTransform';


const isValueEmpty = function (value) {
    if (typeof value === 'undefined') {
        return true;
    }
    if (value === null) {
        return true;
    }
    if (typeof value === 'string' && !value) {
        return true;
    }
    return false;
};

function is(x, y) {
    // From: https://github.com/facebook/fbjs/blob/c69904a511b900266935168223063dd8772dfc40/packages/fbjs/src/core/shallowEqual.js
    if (x === y) {
        return x !== 0 || 1 / x === 1 / y;
    } else {
        return x !== x && y !== y;
    }
}

export default class TextBox extends PureComponent {
    componentWillReceiveProps(nextProps) {
        if (nextProps.animateValue && !is(nextProps.textBox.value, this.props.textBox.value) && this.txtEle && this.oldEle) {
            this.setState({ oldValue: this.props.textBox.value });

            this.txtEle.classList.remove("run-add-animation");
            void this.txtEle.offsetWidth;
            this.txtEle.classList.add("run-add-animation");

            this.oldEle.classList.remove("run-del-animation");
            void this.oldEle.offsetWidth;
            this.oldEle.classList.add("run-del-animation");
        }
    }
    handleDoubleClick = (event) => {
        //双击时显示文本框
        const { onBeginEdit } = this.props;
        onBeginEdit && onBeginEdit(this.props);
    };

    handleBlur = (event) => {
        let newValue = event.target.value;
        const { onCommitEdit } = this.props;
        onCommitEdit && onCommitEdit(this.props, newValue);
    };

    handleDrop = (event) => {
        const { onDrop } = this.props;
        onDrop && onDrop(this.props, event);
    };
    treeClick = () => {
        const { treeClick } = this.props;
        treeClick && treeClick(this.props);
    }
    renderOldValue = ({ textBoxFontInfoStyle, text }) => {
        if (!this.props.animateValue || this.props.isEditing) {
            return;
        }
        return (
            <div ref={ele => this.oldEle = ele}
                 style={{ ...textBoxFontInfoStyle, visibility: 'collapse', position: 'absolute', top: 0 }}
            >
                {(this.state && this.state.oldValue) || ''}
            </div>
        );
    }


    // renderDimension = (e) => {
    //   e.preventDefault();
    //   if (e.button === 2) { // 鼠标右键
    //     this.props.renderDimension(this.props.rowIndex, this.props.columnIndex)
    //   }
    // }

    render() {
        const item = { textBox: this.props.textBox };
        const width = this.props.width + 'px';
        const height = this.props.height + 'px';
        const defaultTextBox = this.props.defaultTextBox || {};
        const textBoxStyle = Style.getTextBoxStyle(item, width, height, defaultTextBox);
        // 下钻为绿色
        if(item.textBox.data && item.textBox.data.detail_state === 98){
            textBoxStyle.backgroundColor = '#acb5aa';
        }
        if (item.textBox.xiazuan || (item.textBox.data && item.textBox.data.detail_state === 99)) {
            textBoxStyle.backgroundColor = 'LightGreen';
        }
        // 分解为蓝色
        if (item.textBox.decompose) {
            textBoxStyle.backgroundColor = 'skyblue';
        }


        const textBoxFontInfoStyle = getTextBoxFontInfoStyle(item, defaultTextBox, this.props.fontSizeUnit);
        let picturesUrl = '';
        if (item.textBox.warningPictures !== '' && item.textBox.warningPictures !== undefined) {
            if (item.textBox.warningPictures.substring(1, 4) == 'IIf') {
                picturesUrl = (<Tooltip title="该项已设置预警图片">
                    <Icon type="exclamation-circle-o" style={{ fontSize: 16, color: 'red', marginRight: '5px', cursor: 'pointer' }} />
                </Tooltip>)
            } else {
                console.log(item.textBox.warningPicturesLocation)
                picturesUrl = (<img src={item.textBox.warningPictures}
                                    style={{ width: '20px', height: '20px', marginLeft: item.textBox.value == '' ? 'calc(50% - 10px)' : '0px' }} />)
            }
        }
        textBoxFontInfoStyle.cursor = this.props.isEditing ? 'text' : 'cell';
        if (this.props.cell && this.props.cell.action) {
            textBoxFontInfoStyle.cursor = 'pointer';
        }

        // 格式化函数，用于格式化显示值。不影响真实值和编辑状态的值。
        const { format } = this.props;
        let text;

        if (!isValueEmpty(item.textBox.value)) {
            text = (format ? format(item.textBox) : item.textBox.value);

        } else {
            if (item.textBox.placeHolder) {
                text = item.textBox.placeHolder;
                textBoxStyle.color = '#ccc';
                textBoxFontInfoStyle.justifyContent = 'center';
            }
        }
        if (item.textBox.isExpErr) {
            textBoxFontInfoStyle.color = 'red';
        }
        const cell = this.props.cell;
        if (cell && cell.treeInfo && cell.treeInfo.isTree) {
            text = (<React.Fragment>
                <Icon type={cell.treeInfo.class_name} style={{ textIndent: 0, cursor: 'pointer' }} onClick={this.treeClick} />
                {text}
            </React.Fragment>)
        }
        if (typeof text === 'string' && text.trim().indexOf('=VH_INDEX') === 0) {
            text = formulaTransform(text);
        }
        return (
            <div style={textBoxStyle} className="textbox-for-table" title={this.props.title}>
                {
                    this.props.isEditing ?
                        (<input
                            style={{ ...textBoxFontInfoStyle, color: 'black' }}
                            autoFocus
                            defaultValue={this.props.isEditing ? item.textBox.value : ''}
                            onDrop={this.handleDrop}
                            onBlur={this.handleBlur}
                            spellCheck="false"
                        />)
                        : (<div ref={ele => this.txtEle = ele}
                                name={item.textBox.name}
                                style={textBoxFontInfoStyle}
                                onDoubleClick={this.handleDoubleClick}
                                onDrop={this.handleDrop}
                            // onMouseUp={this.renderDimension}
                        >

                            {item.textBox.warningPicturesLocation === 'right' ? (<div>{text}{picturesUrl && picturesUrl}</div>) : (<div>{picturesUrl && picturesUrl}{text}</div>)}
                            {/* {picturesUrl && picturesUrl}
              {text} */}
                        </div>)
                }
                {this.renderOldValue({ textBoxFontInfoStyle, text })}
            </div>);
    }
}

export function getTextBoxFontInfoStyle(item, defaultTextBox, fontSizeUnit) {
    const fontInfo = item.textBox.fontInfo || {};
    const defautlFontInfo = defaultTextBox.fontInfo || {};
    const alignMap = { Center: 'center', Left: 'flex-start', Right: 'flex-end' };
    const verticalAlignMap = { Middle: 'center', Top: 'flex-start', Bottom: 'flex-end' };
    // 如果没有设置颜色，通过 css 来切换皮肤，因为 PureComponent 可能不会重新 render.
    const textBoxColor = !item.textBox.fontColor || item.textBox.fontColor === 'none' ? undefined : item.textBox.fontColor;
    const textBoxFontInfoStyle = {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: verticalAlignMap[item.textBox.verticalAlignment || defaultTextBox.verticalAlignment || 'Middle'],
        padding: '2px',
        color: textBoxColor,
        justifyContent: alignMap[item.textBox.horizontalAlignment || defaultTextBox.horizontalAlignment],
        fontFamily: fontInfo.family || defautlFontInfo.family,
        fontSize: `${fontInfo.size || defautlFontInfo.size}${fontSizeUnit || 'px'}`,
        fontWeight: fontInfo.fontWeight || defautlFontInfo.fontWeight,
        fontStyle: fontInfo.fontType || defautlFontInfo.fontType,
        backgroundColor: '',
        margin: 0,
        textDecoration: '',
    };
    const tmpDecoration = (fontInfo.fontDecoration || defautlFontInfo.fontDecoration).toLowerCase();
    if (tmpDecoration === 'strikeout') {
        textBoxFontInfoStyle.textDecoration = 'line-through';
    }
    else if (tmpDecoration === 'underline') {
        textBoxFontInfoStyle.textDecoration = 'underline';
    }
    textBoxFontInfoStyle.whiteSpace = (item.textBox.wrap || defaultTextBox.wrap) === 'wrap' ? 'pre-wrap' : 'pre';
    return textBoxFontInfoStyle;
}
