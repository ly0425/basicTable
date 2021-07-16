import NetUtil from 'containers/HttpUtil';

const MaxRequest = 5;

export default class {
  requestCount = 0;
  requestList = [];
  makeCallBack = (fn) => {
    return (data) => {
      if (this.requestList.length > 0) {
        const req = this.requestList.shift();
        this.startRequest(req);
      } else {
        this.requestCount--;
      }
      fn(data);
    };
  }
  startRequest = (req) => {
    const { method, url, par, successFun, failedFun } = req;
    if (method.toLowerCase() === 'get') {
      NetUtil.get(url, par, this.makeCallBack(successFun), this.makeCallBack(failedFun));
    } else if (method.toLowerCase() === 'post') {
      NetUtil.post(url, par, this.makeCallBack(successFun), this.makeCallBack(failedFun));
    }
  }
  addRequest = (req) => {
    if (this.requestCount < MaxRequest) {
      this.requestCount++;
      this.startRequest(req);
    } else {
      this.requestList.push(req);
    }
  }
}
