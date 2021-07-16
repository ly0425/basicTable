import React, {Component } from 'react'; 
import FieldOperationInputText from './FieldOperationInputText';
export default class  FormItemsDate extends  Component  {
    render() {
        const {data, type, that,remindCustome}=this.props;
        const { isShowDelete,mode } = that.props;
        // －－－－－－－formItems初始化－－－－－－－－
      const formItems = data.length && data.map((k, index) => {
        return (
          <div className="group">
            <div className="group-title mgb8">
              <span className="group-label">
                  <div className="field-name">
                    最近数据查询
                  </div>
              </span>
              {
                    mode !== "plane"? //平铺不需要设置按钮
                    <div className="op">
                      {
                        isShowDelete &&
                        <i
                          className=" icon iconfont icon-delete_o delete-btn"
                          onClick={() => { that.props.remove(0, type); }}
                        />
                      }
                    </div>
                    : null
            }
            </div>
            <div className="FormItems ">
              {
                <FieldOperationInputText 
                           that={that }
                           index={index}
                           dataItem={data[index]}
                          />
              }
            </div>
            {
            remindCustome && k.values ?
            <div className="Infotip">
              {remindCustome.operation && remindCustome.operation!="年" ?<span>最大值1440！</span> :null} <span>当前时间向后倒退<i>{remindCustome.value}{remindCustome.operation}</i></span>查询范围是<span>{remindCustome.time}</span>
            </div>:null
            }
          </div>
        );
      });
      return formItems;
    }
  }