import NetUitl from 'containers/HttpUtil';
import Message from 'public/Message';
import { pageSize } from 'constants/Common.js';

// 用promise
export function loadTreeData(params) {
  return new Promise((resolve, reject) => {
    const url = `${params.urlType}/getCategoryAll`;
    NetUitl.get(url, {type:params.urlType}, (data) => {
      const rootNode = [];
      let childrenToBeFiltered;
          // 如果分类主题管理没有根，或者根下没有分类
      if (!data.data || !data.data.children) {
        childrenToBeFiltered = [];
        return resolve({ status: 200, result: childrenToBeFiltered });
      }
      childrenToBeFiltered = data.data.children;

          // 过滤模型即过滤掉children里的有detail的某一项,得到没有detail的新树：
      const iterator = (data, arr) => data.forEach((item) => {
        const itemTitle = item.title.toLowerCase();
        const paramsTitle = params.title.toLowerCase();
        if (item.detail) {

        } else if (!item.children) {
              // 模糊查询
          if (itemTitle.indexOf(paramsTitle) >= 0) {
            arr.push(item);
          }
        } else { 
          const i = { key: item.key, title: item.title, children: [],num:item.num };
              // 模糊查询
          if (itemTitle.indexOf(paramsTitle) >= 0) {
            arr.push(i);
            iterator(item.children, i.children);
          } else {
            iterator(item.children, rootNode);
          }
        }
      });
      iterator(childrenToBeFiltered, rootNode);
      return resolve({ status: 200, result: rootNode, benchmarkDate:data.benchmarkDate});
    }, (err) => {
      console.log(err);
      return reject({ status: 500, result: err, benchmarkDate:data.benchmarkDate });
    });
  });
}

export function renderTree(rootNode,urlType) {
  return { type: 'LOAD_TREEDATA', data: rootNode ,urlType:urlType};
}

export function LoadModelList(params) {
  return (dispatch) => {
    const modelName = encodeURIComponent(params.value);
    let url = `${params.urlType}/getCategoryModel/`;
    if (modelName.length > 0) {
      url += `${modelName}`;
    }
    const id = params.selectedKey && params.selectedKey.length ? params.selectedKey[0] : '';
    let finalUrl = `${url}?pageIndex=${params.pageIndex || 1}&pageSize=${params.pageSize || pageSize}`;
    if(id){
      finalUrl += `&categoryId=${id}`;
    }
    let isAsc;
    if (params.sortOrder == 'ascend') {
      isAsc = true;
      finalUrl += `&isAsc=${isAsc}`;
    }
    if (params.sortField) {
      finalUrl += `&sortField=${params.sortField}`;
    }
    let dataList = [];
    let dataTotal = 0;
    NetUitl.get(finalUrl, null, (data) => {
      try {
        if (data && data.data) {
          dataList = data.data.list;
          dataTotal = data.data.total;
          dispatch({ type: 'LOAD_MODELLIST', data: dataList, total: dataTotal, selectedKey: params.selectedKey, directType: params.urlType, current: params.pageIndex, pageSize: params.pageSize, operator:'' ,urlType:params.urlType});
        }
      } catch (error) {
        Message.error(data.msg);
        dispatch({ type: 'LOAD_MODELLIST', data: dataList, total: dataTotal, selectedKey: params.selectedKey, directType: params.urlType, current: params.pageIndex, pageSize: params.pageSize, operator:'' ,urlType:params.urlType});
      }
    }, (data) => {
      Message.error(data.msg);
      dispatch({ type: 'LOAD_MODELLIST', data: dataList, total: dataTotal, selectedKey: params.selectedKey, directType: params.urlType, current: params.pageIndex, pageSize: params.pageSize, operator:'' ,urlType:params.urlType});
    });
  };
}
export function DeleteModel(modelId, urlType) {
  return (dispatch) => {
    NetUitl.post(`${urlType}/delete`, { id: modelId }, (data) => {
      if (data.code === 200) {
        dispatch({ type: 'DELETEMODEL', id: modelId, ulT: urlType, operator:'delete' });
        Message.success('删除成功!');
      } else {
        Message.error(data.msg);
      }
    }, (data) => {
      console.log(data);
      Message.error(data.message);
    });
  };
}
export function DeleteModels(modelIds, urlType) {
  return (dispatch) => {
    NetUitl.post(`${urlType}/delete`, { ids: modelIds }, (data) => {
      if (data.code === 200) {
        //dispatch({ type: 'DELETEMODELS', ids: modelIds, ulT: urlType, operator:'deletes' });
        Message.success('删除成功!');
      } else {
        Message.error(data.msg);
      }
    }, (data) => {
      console.log(data);
      Message.error(data.message);
    });
  };
}
export function setParamType(paramType) {
  return { type: 'SET_PARAM_TYPE', paramType };
}

export function showNoData(params) {
  return ({ type: 'SHOWNODATA', data: params });
}


export function emptyModelList(urlType) {
  return ({ type: 'EMPTY_MODEL_LIST', data: urlType });
}
