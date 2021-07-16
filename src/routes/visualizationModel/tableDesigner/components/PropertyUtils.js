/**
 * Created by admin on 2017/11/24.
 */
import moment from 'moment';
import ssf from './ssf';

class PropertyUtils {
  // 格式区分转换
  static conversionFormat(value, formatObject) {
    if (!formatObject || !formatObject.type || value === null || value === ''|| value === undefined) {
      return value;
    }
    let result;
    const type = formatObject.type;
    let pattern = formatObject.pattern || 'General';
    if (type === 'Date') {
      if (pattern.toLowerCase() === 'general') {
        pattern = 'yyyy-mm-dd hh:mm:ss';
      }
      const numValue = Number(value);
      if (isNaN(numValue)) {
        const date = moment(value).toDate();
        if (isNaN(date)) {
          result = value;
        } else {
          result = ssf.format(pattern, date);
        }
      } else {
        result = ssf.format(pattern, numValue);
      }
    } else if(type == 'More'){ //从多页签调用这个类里的时候，没有formatObject，做个特殊处理
      if(!isNaN(value)){
        return Math.round(value*100)/100;
      }
    } else {
      if (type && type !== 'Text') {
        const tmp = Number(value);
        if (!isNaN(tmp)) {
          value = tmp;
        }
      }
      result = ssf.format(pattern, value);
    }
    return result;
  }
}
export default PropertyUtils;
