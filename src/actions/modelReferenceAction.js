export function showModelReference(){
    return {type:"SHOWMODELREFERENCE"};
}

export function modelReferenceVisible(isVisible){
    return {type:"MODEL_REFERENCE_VISIBLE",isVisible};
}







// export function loadCollapseData(params) {
//   return (dispatch) => {
//     NetUitl.get("category/getCategoryAll", null, function(data) {
//       console.log("tree data:"+JSON.stringify(data));


//       dispatch({ type: "LOADCOLLAPSEDATA"});
//     }, function(data) {
//       console.log(data);
//     })
//   }

// }