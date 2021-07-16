import { Modal } from '@vadp/ui';
import { routerRedux } from 'dva/router';
import isRoutePublic from '/src/constants/IntegratedEnvironment';
import Message from '/src/components/Public/Message';
import {goForJump} from 'components/Public/CommonComponent';
const confirm = Modal.confirm;
class UrlUtil {

  static getUrlParams(props, key) {
    if (props == null || key == null) return null;
    if (props.params) {
      return props.params[key];
    } else if (props.match && props.match.params) {
      return props.match.params[key];
    } else {
      return null;
    }
  }
}

const goToAnalysis = function (postData = {}, cb = null) {
  let t = this;
  if(postData.analysisModelId && postData.analysisModelId !=""){
   
  // confirm({
  //   title: '',
  //   content: '是否跳转到分析模型？',
  //   okText: '确认',
  //   className: 'bi bi-ant-confirm-confirm',
  //   cancelText: '取消',
  //   onOk(){
      typeof cb == 'function' && cb.apply(t);
      const url=isRoutePublic+"dataModel/AnalysisModelNew/edit/" + postData.analysisModelId + "?goBackUrlForanalysisModel";
      t.props.dispatch(routerRedux.push(url));
      //goForJump(t.props.dispatch,url,"分析模型");
  //   },
  //   onCancel() {
  //     console.log('Cancel');
  //   },
  // });
}else{
  Message.error("还没有分析模型，不可跳转！");
}
};
export { goToAnalysis };
export default UrlUtil;
