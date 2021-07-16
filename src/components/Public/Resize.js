
class Resize {
    static  getNewWidth(clientX,offsetLeft,oldWidth,minWidth,maxWidth){//鼠标所在的位置，线所在的位置
            console.log(clientX,offsetLeft);
            const diffValue=clientX - offsetLeft;//差值 鼠标到左边距减去垂直线的offsetLeft
            let newWidth=oldWidth + diffValue; //新的宽度
            newWidth=Resize.getWidth(newWidth,minWidth,maxWidth);
            return newWidth;
    }
    static getWidth(newWidth,minWidth,maxWidth){
              const _minWidth=minWidth || 120;//最小宽度
              const _maxWidth=maxWidth || 500;//最大宽度
              let _newWidth=newWidth;
              if(_newWidth < _minWidth){ //不能小于_minWidth
                 _newWidth=_minWidth;
              }
              if(_newWidth > _maxWidth){//不能大于_maxWidth
                 _newWidth=_maxWidth;
              }
              return _newWidth;
    }
}


export default Resize;
