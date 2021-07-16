
import  _ from 'lodash';
class ArrayUtil {

    static unique(arr){
        var res = [];
        var json = {};
        for(var i = 0; i < arr.length; i++){
            if(!json[arr[i]]){
                res.push(arr[i]);
                json[arr[i]] = 1;
            }
        }
        return res;
    }
    static objMergeToHeavy(arr = [], newarr = []) { 
        var res = newarr || [];
        arr=_.cloneDeep(arr);
        arr.forEach((item) => {
          const name = item.aliasName || item.fieldName;
          res = res.filter((o) => {
    
            return name !== (o.aliasName || o.fieldName) ? true : false;
          })
        })
        return arr.concat(res);
      }

}

export default ArrayUtil;
