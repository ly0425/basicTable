import { ExpressionExecute } from './CellCache';
import * as SpreadsheetApi from '../../SpreadsheetApi';
import { from } from 'rxjs';

// 取数结果
export const fetchedData = {};

export default class {
  cache = new Map();
  vh_index_cache = new Map();
  indexDataset = indexDataset();
  VH_INDEX_Pool = VH_INDEX_Pool();
  cross_pool = cross_pool();
  clearCache = () => {
    this.cache.clear();
    this.vh_index_cache.clear();
    this.VH_INDEX_Pool.clear();
  }
  flush = (params, reportId) => {
    this.indexDataset.flush(params);
    this.VH_INDEX_Pool.flush(params, reportId);
    this.cross_pool.flush(params);
  }
  startGetIndexValue = (indexName, params) => {
    return SpreadsheetApi.fetchIndexByName(indexName).then(data => {
      if (data.indexType === '0') {
        if (data.dataType === '0') {
          let model = JSON.parse(data.content);
          model.index_id = data.id;
          // 添加参数
          this.addParams(model, params);
          // 添加一个 fieldName 属性，放在 field 属性同级。
          model.params.forEach(p => {
            if (!p.fieldName) {
              p.fieldName = `${p.field.tableName}.${p.field.fieldName}`;
            }
          });
          return SpreadsheetApi.fetchIndexData([model]).then(data => {
            const value = data[model.index_id];
            return value ? parseFloat(value) : 0;
          });
        } else {
          //基于服务接口
          return Promise.reject({ msg: '基于服务接口暂未实现' });
        }
      } else {
        //复合指标
        const exp = JSON.parse(data.content);
        return ExpressionExecute.getExpressionValue(exp, this.cellCache, this, this.contenxt);
      }
    }, reason => {
      if (reason.code === 666) {
        reason.displayMsg = '指标不存在';
      }
      return Promise.reject(reason);
    });
  }

  addParams = (model, params) => {
    // console.log('aaaaaddParams', this.context.params, params);

    model.params.forEach(p => {
      //　参数为空
      if (p.valueArray.length === 0 || !p.valueArray[0]) {
        // 优先取个性化参数，如没有取全局参数
        let param = (params && params.find(para => para.fieldName === p.field.fieldName))
          || this.context.params.find(para => para.fieldName === p.field.fieldName);
        if (param) {
          p.operation = param.operation || '=';
          if (param.values instanceof Array) {
            p.valueArray = param.values;
          } else {
            p.valueArray = [`${param.values}`];
          }
        }
      }
    });
  }

  getIndexValue = (indexName, params) => {
    // 传参数的不缓存，因为每次参数不一样
    if (!this.cache.has(indexName) || params) {
      const promise = this.startGetIndexValue(indexName, params);
      if (!params) {
        this.cache.set(indexName, promise);
      }
      return promise;
    } else {
      return this.cache.get(indexName);
    }
  }
  getIndexValue2 = (index) => {
    const key = getKey(index);
    if (!this.cache.has(key)) {
      const promise = this.indexDataset.put(index);
      const observable = from(promise);
      this.cache.set(key, observable);
      return observable;
    } else {
      return this.cache.get(key);
    }
  }
  getVH_INDEX = (index) => {
    const key = index.text;
    if (!this.vh_index_cache.has(key)) {
      const promise = this.VH_INDEX_Pool.put(index);
      const observable = from(promise);
      this.vh_index_cache.set(key, observable);
      return observable;
    } else {
      return this.vh_index_cache.get(key);
    }
  }
  getCrossData = (index) => {
    return from(this.cross_pool.put(index));
  }
}

const indexDataset = function () {
  const _items = [];
  const waitForServer = (index, resolve, reject) => {
    _items.push({ index, resolve, reject });
  };
  const onSuccess = (results) => {
    // 结果转 map
    const map = new Map();
    results.forEach((result) => {
      const key = getKey(result);
      map.set(key, result.value);
    });
    _items.forEach((item) => {
      const { index, resolve, reject } = item;
      const key = getKey(index);
      const value = map.get(key);
      const { code, data, msg } = value;
      if (code === 200) {
        resolve(data ? parseFloat(data) : 0);
      } else if (code === 666) {
        reject({ displayMsg: '指标不存在', msg });
      } else {
        reject({ msg });
      }
    });
    // 清空池子
    _items.length = 0;
  };

  return {
    put: (index) => {
      return new Promise((resolve, reject) => {
        waitForServer(index, resolve, reject);
      });
    },
    flush: (params) => {
      if (_items.length > 0) {
        SpreadsheetApi.fetchIndexes(_items.map(item => item.index), params || [])
          .then(onSuccess)
          .catch(() => {
            _items.forEach(item => {
              const { index, reject } = item;
              reject({ displayMsg: '#ERROR#' });
            });
            _items.length = 0;
          });
      }
    },
  };
};

function getKey(index) {
  const { name, function: func, params } = index;
  if (!func) {
    return name;
  }
  const { indexName, paramYearName, paramMonthName, yearOrMonth, span } = params;
  const key = `${func}_${indexName}_${paramYearName}_${paramMonthName}_${yearOrMonth}_${span}`;
  return key;
}

const VH_INDEX_Pool = function () {
  const _items = [];
  const waitForServer = (index, resolve, reject) => {
    _items.push({ index, resolve, reject });
  };
  const onSuccess = (result) => {
    console.log('fetchVH_INDEX complete', result);
    // 存储取数结果
    result.forEach(({ fetchExp, value: { code, data, msg } }) => {
      if (code === 200) {
        fetchedData[fetchExp] = data;
      } else {
        // 错误的也存
        fetchedData[fetchExp] = { errMsg: msg };
      }
    });
    // 通知
    _items.forEach((item, i) => {
      const { index, resolve, reject } = item;
      const { code, data, msg } = result[i].value;
      if (code === 200) {
        resolve(data);
      } else if (code === 666) {
        reject({ displayMsg: '指标不存在', msg });
      } else {
        reject({ displayMsg: msg });
      }
    });
    // 清空池子
    _items.length = 0;
  };

  return {
    put: (index) => {
      return new Promise((resolve, reject) => {
        waitForServer(index, resolve, reject);
      });
    },
    flush: (pageParams, reportId) => {
      if (_items.length > 0) {
        SpreadsheetApi.fetchVH_INDEX(_items.map(item => ({
          fetchExp: item.index.text,
          fetchParams: item.index.params
        })), pageParams, reportId)
          .then(onSuccess)
          .catch(() => {
            _items.forEach(item => {
              const { index, reject } = item;
              reject({ displayMsg: '#ERROR#' });
            });
            _items.length = 0;
          });
      }
    },
    clear: () => {
      _items.length = 0;
    },
  };
};

const cross_pool = function () {
  const _items = [];
  const waitForServer = (index, resolve, reject) => {
    _items.push({ index, resolve, reject });
  };
  const onSuccess = (result) => {
    console.log('跨表取数结果', result);
    // 通知
    _items.forEach((item, i) => {
      const { index: { reportId, indexId }, resolve, reject } = item;
      let value = '';
      const reportData = result.find(x => x.reportId === reportId);
      if (reportData) {
        const indexData = reportData.indexes.find(x => x.indexId === indexId);
        if (indexData) {
          value = indexData.value;
        }
      }
      resolve(value);
    });
    // 清空池子
    _items.length = 0;
  };

  return {
    put: (index) => {
      return new Promise((resolve, reject) => {
        waitForServer(index, resolve, reject);
      });
    },
    flush: (pageParams) => {
      if (_items.length === 0) {
        return;
      }
      // 拼成树
      const reportMap = new Map();
      for (const { index: { reportId, indexId } } of _items) {
        if (!reportMap.has(reportId)) {
          reportMap.set(reportId, new Map());
        }
        const indexMap = reportMap.get(reportId);
        if (!indexMap.has(indexId)) {
          indexMap.set(indexId, indexId);
        }
      }
      const para = { pageParams, reportIndexes: [] };
      for (const [reportId, indexMap] of reportMap) {
        const obj = { reportId, indexes: [] };
        for (const [indexId] of indexMap) {
          obj.indexes.push({ indexId });
        }
        para.reportIndexes.push(obj);
      }
      // 发请求
      SpreadsheetApi.fetchCrossData(para)
        .then(onSuccess)
        .catch(() => {
          _items.forEach(item => {
            const { index, reject } = item;
            reject({ displayMsg: '#ERROR#' });
          });
          _items.length = 0;
        });
    },
    clear: () => {
      _items.length = 0;
    },
  };
};