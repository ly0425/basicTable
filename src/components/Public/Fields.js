import { analysisModel } from './analysisModel';
import NetUitl from '/src/containers/HttpUtil';

class Fields {
	static formatFields(fields) {
		return analysisModel.formatFields(fields);
	}
}
export default Fields;
const getFieldDataType = (field, type = 1) => {
	if (field.type != "group") {
		let dataType = type ? field.dataType.toLowerCase() : field.dataTypeName.toLowerCase();
		if (dataType.indexOf('int') >= 0 ||
			dataType.indexOf('float') >= 0 ||
			dataType.indexOf('double') >= 0 ||
			dataType.indexOf('number') >= 0 ||
			dataType.indexOf('numeric') >= 0 ||
			dataType.indexOf('bigint') >= 0) {
			return 'int';
		} else if (dataType.indexOf('datetree') >= 0) {
			return 'dateTree';//日期级次字段
		} else if (dataType.indexOf('date') >= 0) {
			return 'date';
		}
	}
	return 'string';
}
const getFildsForConditionsModal = (para) => {
	let url = 'datadict/get_model_params';
	if (!para.procName) {
		url = 'datadict/get_model_params_byId';
	}
	const promise = new Promise((resolve, reject) => {
		NetUitl.get(url, para, (arr) => {
			if (arr.code == 200) {
				const newdata = arr.data || [];
				let tag = para.type == "proc" ? 0 : 1;
				console.log(newdata, 'newdata')
				let obj = {};
				const data = [];
				newdata.map((item) => {
					obj = {
						comments: item.comments,
						dataType: getFieldDataType(item, tag),
						fieldName: item.fieldName || item.name,
						isChecked: true,
						analysisModelId: para.analysisModelId,
						procedure: true
					};
					if (item.aliasName) {
						obj['aliasName'] = item.name;
					}
					data.push(obj);
				});
				console.log('data', data)
				resolve({ status: true, data });
			} else {
				if (arr.code == 9990) {//表正常情况
					resolve({ status: true, data: [] });
					return;
				}
				reject({ status: false, data: [] });
			}
		}, (data) => {
			reject({ status: false, data: [] });
		});
	});


	return promise;
};
const getProcInfo = (params) => {
	// const sessionStorageData = JSON.parse(sessionStorage.getItem('data'));
	// if (sessionStorageData && sessionStorageData.data.length && sessionStorageData.name == params.name && sessionStorageData.analysisModelId == params.analysisModelId) {
	// 	return sessionStorageData.data;
	// } else {
	return getFildsForConditionsModal(params).then((obj) => {
		const fields = obj.data;
		// const sessionData =   JSON.stringify(Object.assign({}, { data: fields }, params));
		// if(fields.length){
		// 	sessionStorage.setItem('data', sessionData);
		// }
		// return sessionData
		return fields;
	});
	// }
}


const getAnalysismodelInfo=(params)=>{
	const promise = new Promise((resolve, reject) => {
		NetUitl.get("analysismodel/getAssociateInfo/" + params.id, null, function(data) {
			localStorage.setItem('dataSourceId', data.data.datasource$id);
			let jsData;
			let type = '';
			try {
			  jsData = JSON.parse(data.data.analysis_model$content);
	  			type= jsData.type;
			} catch (error) {
			  console.error("data 解析报错了：", error)
			} finally {

			}
			resolve({ status: true, type });
		  }, function(data) {
			reject({ status: false, type: '' });
		  })

	});


	return promise;

}
const analysisModelIdAdd = (analysisModelId, data) => {
	data.map(item => {
		item['analysisModelId'] = analysisModelId;
	})
	return data
}
export { getFildsForConditionsModal, getProcInfo, analysisModelIdAdd,getAnalysismodelInfo };
