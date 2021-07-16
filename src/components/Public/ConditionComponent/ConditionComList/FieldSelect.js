import React, {PureComponent } from 'react';
import { publicComponentBox} from '../ConditionsModalCore';
// －－－－－－－参数字段组件－－－－－－－－
export default class FieldSelect extends  PureComponent  {
    componentWillReceiveProps(nextProps){
  
    }
    
    componentDidMount(){
  
    }
    getObjData(item){ 
      let rangeDisplaynone=null;
      const {mode}=this.props;
      if(item && item.referenceInfo &&  item.referenceInfo.rangeDisplaynone){
          rangeDisplaynone=item.referenceInfo.rangeDisplaynone;
          if(rangeDisplaynone){
              if(rangeDisplaynone=="all-display-none"){//全部隐藏
                    if(mode && mode=="plane"){
                      return [];
                    }
              }else if(Array.isArray(rangeDisplaynone)){ //新版
                if(mode && mode=="plane"){
                     let rangeType = item["referenceInfo"]["rangeType"]?item["referenceInfo"]["rangeType"]:"month";
                     let hiddenType="";
                     if(rangeType=="half-year"){
                         hiddenType='halfyear-hidden';
                     }else if(rangeType=="month"){
                         hiddenType='month-hidden';
                     }else if(rangeType=="year"){
                         hiddenType='year-hidden';
                     }else if(rangeType=="season"){
                         hiddenType='season-hidden';
                     }
                     if(rangeDisplaynone.includes(hiddenType)){ 
                         return [];
                     }
                 } 
              }else if(!Array.isArray(rangeDisplaynone)){
                rangeDisplaynone=null;
              } 
          }
      } 
      

      const month={ key: 0, value: 'month', children: "月" };
      const season={ key: 1, value: 'season', children: "季度" };
      const half_year={ key: 2, value: 'half_year', children: "半年" };
      const year={ key: 3, value: 'year', children: "年" }
      let objdata=[];  
      if(item.referenceInfo && item.referenceInfo.content){  
              this.addData({//月
                objdata,value:month,jiaoyan:'month-hidden',rangeDisplaynone,
                disabled:!item.referenceInfo.content.month
              })
               this.addData({//季度
                  objdata,value:season,jiaoyan:'season-hidden',rangeDisplaynone,
                  disabled:!item.referenceInfo.content.quarter
               })   
               this.addData({//半年
                   objdata,value:half_year,jiaoyan:'halfyear-hidden',rangeDisplaynone,
                   disabled:!item.referenceInfo.content.half_year
               }) 
               this.addData({//年
                objdata,value:year,jiaoyan:'year-hidden',rangeDisplaynone,
                disabled:!item.referenceInfo.content.year 
               })
      }  
      
      return objdata;
    }
    addData({objdata,value,jiaoyan,rangeDisplaynone,disabled}){
        const {mode}=this.props;
        if(mode && mode=="plane" && Array.isArray(rangeDisplaynone) && rangeDisplaynone.includes(jiaoyan)){//平铺下的需要隐藏 
              
        }else{
          objdata.push({
            ...value,
            disabled:disabled
          });
        }
    }
    getClassName(objdata){
      
        if(objdata && objdata.length){ 
            return "";
        }else{
           return "all-display-none";
        } 
    }
    render() {
      const { value,required, index,item,width } = this.props;
      let obj = {};
      const name = 'Select';
  
      let objdata = this.getObjData(item);
      let children = []
      objdata.map(item=>{
        children.push(publicComponentBox("Option", item))
      })
      let that = this;
      let rangeType = item["referenceInfo"]["rangeType"]?item["referenceInfo"]["rangeType"]:"month"
        obj = {
        className: "FieldSelect",
        children: children,
        placeholder: '区间',
        style: { width: width },
        value:rangeType,
        onChange: (value) => { that.props.onChange(value, index); },
  
      };
      return (
        <div className={`field-name DataChain-FieldSelect ${this.getClassName(objdata)}`} style={{"width":width}}>
          {
          publicComponentBox(name, obj)
        }
        </div>
      );
    }
  }