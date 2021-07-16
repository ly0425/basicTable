import React, {Component } from 'react';
 import { Tooltip, Checkbox } from '@vadp/ui';
import  {SettingComponent} from "../ComponentList/SettingComponent";// －－－－－－－参数字段组件－－－－－－－－
import FieldOperationInputText from './FieldOperationInputText';
import FieldOperationInputFieldSelectText from './FieldOperationInputFieldSelectText';
export default class  FormItemsList extends  Component  {
    render() {
        const {data, type, that, benchmarkDateCopy}=this.props;
        const { isShowCheckBox, isShowDelete , mode,closeSettingBut,hiddenItem} = that.props;
        // console.log(mode,"mode",mode !== "plane")
          // －－－－－－－formItems初始化－－－－－－－－
        // customReference(that, index, data)
        const customReference  = (that, index, data) => {
            // const url = "unieap.WEB_APP_NAME + '/ui/vhwsp?page=acctBase-selCompCopy-subtreeByCheckType'"
            // const str=url.substring(0, 19);
            // console.log(data[index].referenceInfo && data[index].referenceInfo.reference.url)

            // if(data[index].fieldId === 'subjCode' || data[index].fieldId === 'acctSubj' ||
            //                     data[index].fieldName === '科目') {
            //     return(
            //         <i
            //             className="icon iconfont icon-search iconSearchRef"
            //             onClick={() => onShowRefer(data, data[index])}
            //         />
            //     )
            // }
        };
        const formItems = data.length && data.map((k, index) => {
          if(data[index].commonUse || mode !== "plane"){
            // console.log(data[index])
             //BI-2710 postion:ralative ?加了会有问题
            return (
              <ul >
                <li className="createFormItemsList-li" style={!!hiddenItem && data[index].hidden ? {display:"none"}:{display:"block"}}>
                  <div className="FormItems ">
                    {
                      data[index]["referenceInfo"] && data[index]["referenceInfo"]["type"] == "range"
                        ?
                        <FieldOperationInputFieldSelectText
                         that={that}
                         index={index}
                         dataItem={data[index]}
                         mode={mode}
                        />:
                        <FieldOperationInputText
                         that={that}
                         index={index}
                         dataItem={data[index]}
                         mode={mode}
                        />
                      }
                  </div>
                  {
                      mode !== "plane"? //平铺不需要设置按钮
                      <div className="op">
                        {
                            isShowCheckBox && <Tooltip title="设置常用项">
                              <Checkbox
                                checked={data[index].commonUse}
                                className="commonUse-btn"
                                onChange={(value) => { that.onChangeCheckbox(value, index, data); }}
                              />
                              </Tooltip>
                        }
                        {
                          !closeSettingBut && 
                          <SettingComponent 
                            data={data}
                            index={index}
                            onOk={that.onChangeSetting}
                            benchmarkDate={benchmarkDateCopy}
                        />
                        }
                        {
                          isShowDelete &&
                          <i
                            className=" icon iconfont icon-delete_o delete-btn"
                            onClick={() => { that.props.remove(index, type); }}
                          />
                        }
                      </div>
                      : customReference(that, index, data)
                  }
                </li>
              </ul>
            );
          }
        });

        // 自定义参照弹框
        function onShowRefer(data, record) {
            const refData = record.referenceInfo.reference.parameters;
            const newRefData = {};
            for (let i = 0; i < refData.length; i++) {
                const item = refData[i];
                newRefData[item.key] = item.val;
            }
            const paramMap = {
                compCopy: '100190-001',
                isKindId: "0",
                coId: -1,
                beginPeriod: "2020-03",
                endPeriod: "2020-03",
                isDisposal: "0",
                thisosz: "0",
                endosz: "0",
                isRange: "0",
                pv030131: "列表",
                searchOrAddSubj: "add",
                subjLevel: null,
                unMustShow: "",
                ...newRefData
            };
            unieap.cmpPath = '/finance/ui/vhwsp';
            XDialogUtil.createDialog({
                url: `${unieap.cmpPath}?page=acctBase-selCompCopy-subtreeByCheckType`,
                title: '科目选择',
                width: '800px',
                height: '600px',
                dialogData: {
                    paramMap,
                },
                isMax: false,
                onComplete(dc) {
                    if (dc != null) {
                        const subjCodes = dc.subjCodes;
                        record.values = subjCodes;
                        localStorage.setItem('subjCodes',subjCodes)
                        console.log(localStorage.getItem('subjCodes'))
                        for (var i = 0, len = data.length; i < len; i++) {
                            if (data[i].fieldName === "subjCode" || data[i].fieldName === "acctSubj") {
                                data[i] = record;
                            }
                        }
                        console.log(data);
                        console.log(record);
                    }
                },
            }).show();
        };
        return formItems;
    }
  }