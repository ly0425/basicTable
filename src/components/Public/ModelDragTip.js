import React, { Component } from 'react';
class ModelDragTip{
  static tips={
    "chart": ["请拖入维度度量","绘制报表"],
    "table": ["请拖入行列","相关数据"],
    "excel": ["请拖入行列","相关数据"],
    "dashboard": ["请拖拽进行布局","请拖入模型集"]
  }
  static createTipElement(type){
    this.hideTipChangeBox();
    return (
        <div id="tipchangebox" class="bi-tipchangebox">
          <i className="icon iconfont icon-tips">
          </i>
          <p>{this.tips[type] && this.tips[type][0]}<br /> {this.tips[type] && this.tips[type][1]}</p>
        </div>
    )
  }
  static hideTipChangeBox() {
    let $ = window.$;
    $(document).bind('click , mousedown', function (e) {
      // var e = e || window.event;
      // var elem = e.target || e.srcElement;
      // while (elem) {
      //   if (elem.id && elem.id == 'tipchangebox') {
      //     return;
      //   }
      //   elem = elem.parentNode;
      // }
      //如果通过id去获取，则只能获取到第一个，新版本的portal中，可以同时打开多个菜单，如果多个菜单中都存在这个提示，则只有第一个会起作用，所以可以通过class或者根据e.target获取到当前打开的菜单的提示div
      $(".bi-tipchangebox").hide();
    });
  }
}
export default ModelDragTip;