
class OtherUtil {

  //条件渗透开启时，只传递常用查询条件到弹出框（包括仪表板、故事版、图表、表格等）
  static getPopupInfo(popupInfo={}){
    let newPopupInfo = JSON.parse(JSON.stringify(popupInfo)) ;
    let intoPopupCondition = [];
    if(newPopupInfo.isConditionToPopup && Array.isArray(newPopupInfo.intoPopupCondition)){
        intoPopupCondition = newPopupInfo.intoPopupCondition.filter(v=>{
            return v.commonUse
        })
        newPopupInfo.intoPopupCondition = intoPopupCondition ;
    }
    return newPopupInfo ;
  }


}
export default OtherUtil;
