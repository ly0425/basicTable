import React, {Component } from 'react'; 
import { Tooltip, Checkbox } from '@vadp/ui';
import FieldOperationInputText from './FieldOperationInputText';
import FieldOperationInputFieldSelectText from './FieldOperationInputFieldSelectText';
export default class  FormItemsGroup extends  Component  {
    render() {
        const {data, type, that, index,runTime}=this.props;
        const { isShowCheckBox, isShowDelete ,mode} = that.props;
        // －－－－－－－formItems初始化－－－－－－－－
        if (data && data[index] && (data[index].commonUse || mode !== "plane") ){
    
          const formItems = (
            <div className="group">
              <div className="group-title mgb8">
                <span className="group-label">
                  <div className="field-name group-name">
                    {
                    data.length ? data[0].groupInfo.name : ''
                  }
                  </div>
                </span>
                { mode !== "plane" ?
                <div className="op">
                  {
                  isShowCheckBox && <Tooltip title="设置常用项">
                    <Checkbox
                      checked={data[index].commonUse}
                      className="commonUse-btn"
                      onChange={(value) => { that.onChangeCheckbox(value, index, data, 'groupInfo'); }}
                    />
                  </Tooltip>
                 }
                  
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
              <div className="FormItems">
                {
                    data.length && data.map((k, index) => {
                      { /* if (commonUseWay && !data[index].commonUse) {
                        return null;
                      } else { */ }
                      return (
                            <div className="field-operation-list mgb8">
                                {
                                  data[index]["referenceInfo"] && data[index]["referenceInfo"]["type"] == "range"
                                  ?
                                  
                                  <FieldOperationInputFieldSelectText
                                  that={that}
                                  index={index}
                                  dataItem={data[index]}
                                  />:
                                  <FieldOperationInputText
                                    that={that}
                                    index={index}
                                    dataItem={data[index]}
                                    />
                                } 
                            </div>
                      );
                    })
                  }
    
              </div>
            </div>
          );
    
          return formItems;
        }
        return null;
    }
  }