const isRoutePublic =(window.REACT_APP_CONFIG && window.REACT_APP_CONFIG.bi)?'/bi/':'/';
const isRouteAHrefPublic =(window.REACT_APP_CONFIG && window.REACT_APP_CONFIG.bi)?'/OES/user/#/bi/':'/#/';
// 路由专用

const isHttpPublic = (window.REACT_APP_CONFIG && window.REACT_APP_CONFIG.bi)?window.REACT_APP_CONFIG.bi:'/bi/';
// 请求专用

export default isRoutePublic;
export {isHttpPublic,isRouteAHrefPublic};