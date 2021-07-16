const handleDataToLowerCase=(data)=>{
    let result=null;
    if(Array.isArray(data) && data.length){
       result=data.map((d,dIndex)=>{
               let newD={}
               for (let key in d){
                   newD[key.toLowerCase()]=d[key]
               }
               return newD;
         })
    }
    return result || data;
} 
class _dashboardCommon {
    static getConditions({actionConditions,linkageCondition,conditions}){
        let searchConditions = [];
        //与linkageCondition不一样，actionConditions是之前联动后暂存下来的联动条件，linkageCondition是当前联动产生的联动条件
        if (actionConditions && actionConditions.length > 0) {
          searchConditions = searchConditions.concat(this.getItemConditions(actionConditions, searchConditions));
        }
        if (linkageCondition && linkageCondition.length > 0) {
          this.linkType= "filter" ;
          this.linkType= linkageCondition[0].type || "filter" ;
          if(this.linkType=="filter"){//如果是点亮的联动条件则不拼接到查询条件中
            searchConditions = searchConditions.concat(this.getItemConditions(linkageCondition, searchConditions));
          }
        }
        if (conditions && conditions.length > 0) {
          let conditionsX = this.filterConditions(conditions) ;
          searchConditions = searchConditions.concat(this.getItemConditions2(conditionsX,searchConditions));
        }
        return searchConditions;
      }
      static  getItemConditions2(arr, searchConditions){
        const conditions = [];
        arr.forEach((v) => {
          const item = searchConditions.find((sc) => {
            return sc.fieldName === v.fieldName;
          });
          if (!item && v.type != "lightUp") {//点亮功能不加入查询条件
            conditions.push(v);
          }
        });
        return conditions;
      }
    static filterConditions(conditions) {
        if (conditions == null || conditions.length == 0) return [];
        let conds = conditions.filter(con => {
          if (con.values!=null) {
            if (Array.isArray(con.values)) {
              return con.values.length > 0
            }
            return true;
          }
          return false;
        })
        return conds;
      }
    static getItemConditions(arr, searchConditions){
        const conditions = [];
        arr.forEach((v) => {
          if (v.field2 !== null && v.fieldType !== null && v.values !== null && v.selectedOperation !== null) {
            // 如果设置的查询条件已经包含了联动的条件，则以查询条件为主，去掉相应的联动条件
            const item = searchConditions.find((sc) => {
              return sc.fieldName === v.field2;
            });
            if (!item && v.type != "lightUp") {//点亮功能不加入查询条件
              const c = {
                fieldName: v.field2,
                comments: v.comments,//为了联动的时 候在表格上动态显示查询条件（例如标题）
                tableName: v.tableName,//为了联动目标字段时参照类型的，后台查询需要表格字段
                dataType: v.fieldType,
                operation: v.selectedOperation,
                values: v.values.join(), 
                aliasName:v.aliasName//桑基图
              }; 
              conditions.push(c);
            }
          }
        });
        return conditions;
      }
}
export {handleDataToLowerCase,_dashboardCommon}