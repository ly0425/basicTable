import NetUitl from '../../containers/HttpUtil';
import Message from './Message';
import {handleDataToLowerCase} from './CommonFn.js'
const handleAllSysParam=(callBack)=>{
	  let sysParams = localStorage.getItem('biDataPublicConfig'); //本地存储
      if(!sysParams){ 
		   postAllSysParam(null);
      }else{
		   if(callBack)callBack();
	  }
}

const postAllSysParam=(param,callBack)=>{ 
	NetUitl.post('/helper/getAllSysParam',param, (data) => { 
		if (data.code === 200) {
			data.data=handleDataToLowerCase(data.data);
			biDataPublicConfig(data.data);
			if(callBack)callBack(data);
		} else {
			Message.error(data.msg);
			biDataPublicConfig([]);
		}
	}, (data) => {
		Message.error(data.message);
		biDataPublicConfig([]);
	});
}
const biDataPublicConfig = function (arr = []) {
  if(arr && arr.length){
	  let config = {};
	  arr.forEach(c => {
	    config[c.name] = {
	      value: c.value,
	      description: c.description
	    }
	  })
	  localStorage.setItem("biDataPublicConfig", JSON.stringify(config));
	}else{
		localStorage.removeItem("biDataPublicConfig");
	}
};
export { biDataPublicConfig,handleAllSysParam,postAllSysParam};
