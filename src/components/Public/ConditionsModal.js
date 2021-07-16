import React, {  Component } from 'react';
import { Modal, Button } from '@vadp/ui';
import { Conditions, submitOnOk } from "./ConditionComponent/ConditionComponent"

const  clearSessionStorageForConditionsFn = (dashboardIDkey=null,data=null) => {
  if(!dashboardIDkey){
    sessionStorage.setItem('temporaryStorage', JSON.stringify([]));
    return true
  }
  let dashboardID = sessionStorage.getItem("dashboardID")
  if(data){
    sessionStorage.setItem('comparData', JSON.stringify(data));
  }
  if(dashboardIDkey!=dashboardID){
    sessionStorage.setItem('temporaryStorage', JSON.stringify([]));

    return true
  }else{
    return false
  }
  
};

class ConditionsModal extends  Component  {
  constructor(props) {
    super(props);
    this.state = {
      isRender:true
    };
  }
        // －－－－－－－提交按钮－－－－－－－－
  handleSubmit = (e) => {
    e.preventDefault();
    const newdata = this.refs.Conditions.handleSubmit();
    this.refs.Conditions.temporaryStorage();
    sessionStorage.setItem('dashboardID', 1);
    submitOnOk(newdata, this.props.onOk, this);
  };
  componentWillMount(){
    this.setState({
      isRender:clearSessionStorageForConditionsFn(this.props.dashboardID)
    })
  }
  render() {
    
    const { type, data, runTime, fields, isShowCommonUseCheckBox,linkBackDate,benchmarkDate,dashboardID,hiddenItem} = this.props;
    const {isRender} = this.state
    console.log(isRender)
    return (<Modal
      title={'选择参数'}
      className="choose-params-modal"
      visible={this.props.visible}
      onCancel={this.props.onCancel}
      width="603px"
      wrapClassName="bi"
      maskClosable={false}
      footer={[
        <Button key={'cancel'} onClick={this.props.onCancel}>取消</Button>,
        <Button key={'ok'} type="primary" onClick={this.handleSubmit.bind(this)}>确定</Button>,
      ]}
    >
      {
          runTime && false && !data.length && !customData.length ? '没有给定预设条件' :
          <Conditions
            mode="list" // 以那种格式进行展示，列表list（默认是list）/平铺（plane）
            ref="Conditions" // 绑定用来获取数据
            data={data} // 已选择中的数据
            runTime={runTime}
            fields={fields} // 下拉参数
            isShowSelectFields={!type && !runTime} // 是否展示下拉框
            isShowDateList={!runTime} // 是否显示最近日期选项
            isShowCheckBox={isShowCommonUseCheckBox} // 是否显示常用项
            isShowDelete={!runTime} // 是否显示删除按钮
            closeSettingBut={!!runTime} //是否显示设置按钮
            isHiddenOperation={false} //是否隐藏operation
            linkBackDate={linkBackDate}
            benchmarkDate={benchmarkDate}
            dashboardID={dashboardID}
            isRender={isRender}
            hiddenItem={hiddenItem}
            fieldWidth={"87px"}
            inputTextWidth={"260px"}
          />
        }
    </Modal>);
  }
}


export default ConditionsModal;
export { Conditions, submitOnOk };
