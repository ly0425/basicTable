import Common from 'components/Print/Common';
const comm = new Common();

// 框选的算法。获取选中的矩形区域
export const getSelectRect = (tableRows, start, target) => {
  let myRect = tableRows;
  let RectLogic = {
    enumFindDirection: {
      left: 0
      , top: 1
      , right: 2
      , bottom: 3
    }
    , doneMap: [0, 0, 0, 0]
    , checkedMap: {}
    , rect: {
      left: 0
      , top: 0
      , right: 0
      , bottom: 0
    }
    , fitRect: function (start, end) {
      this.doneMap = [0, 0, 0, 0];
      this.rect.left = Math.min(start.left, end.left);
      this.rect.top = Math.min(start.top, end.top);
      this.rect.right = Math.max(start.left, end.left);
      this.rect.bottom = Math.max(start.top, end.top);
      this.refit();
      return this.rect;
    }
    , refit: function () {
      this.findSideline(this.enumFindDirection.top);
      this.findSideline(this.enumFindDirection.left);
      this.findSideline(this.enumFindDirection.right);
      this.findSideline(this.enumFindDirection.bottom);
      if (this.doneMap[0] + this.doneMap[1] + this.doneMap[2] + this.doneMap[3] < 4) {
        this.refit();
      }
    }
    , findSideline: function (direction) {
      let left, top, right, bottom;
      let needRefit = false;
      switch (direction) {
        case 0:
          left = right = this.rect.left;
          top = this.rect.top;
          bottom = this.rect.bottom;
          break;
        case 1:
          top = bottom = this.rect.top;
          left = this.rect.left;
          right = this.rect.right;
          break;
        case 2:
          left = right = this.rect.right;
          top = this.rect.top;
          bottom = this.rect.bottom;
          break;
        case 3:
          top = bottom = this.rect.bottom;
          left = this.rect.left;
          right = this.rect.right;
          break;
      }
      for (let topIndex = top; topIndex <= bottom; topIndex++) {
        for (let leftIndex = left; leftIndex <= right; leftIndex++) {
          let target = myRect[topIndex][leftIndex];
          let newLeft, newTop, newRight, newBottom;
          if (target.display !== 1) {
            let owner = this.findOwner(leftIndex, topIndex);
            if (comm.isCheckEmpty(owner.top) === '')
              owner.top = 0;
            target = myRect[owner.top][owner.left];
            newLeft = owner.left;
            newTop = owner.top;
            newRight = target.colspan + newLeft - 1;
            newBottom = target.rowspan + newTop - 1;
          }
          else {
            newLeft = leftIndex;
            newTop = topIndex;
            newRight = target.colspan + leftIndex - 1;
            newBottom = target.rowspan + topIndex - 1;
          }
          if (newLeft < this.rect.left) {
            needRefit = true;
            this.rect.left = newLeft;
            this.doneMap[this.enumFindDirection.left] = 0;
            this.doneMap[this.enumFindDirection.top] = 0;
            this.doneMap[this.enumFindDirection.bottom] = 0;
          }
          if (newTop < this.rect.top) {
            needRefit = true;
            this.rect.top = newTop;
            this.doneMap[this.enumFindDirection.left] = 0;
            this.doneMap[this.enumFindDirection.top] = 0;
            this.doneMap[this.enumFindDirection.right] = 0;
          }
          if (newRight > this.rect.right) {
            needRefit = true;
            this.rect.right = newRight;
            this.doneMap[this.enumFindDirection.right] = 0;
            this.doneMap[this.enumFindDirection.top] = 0;
            this.doneMap[this.enumFindDirection.bottom] = 0;
          }
          if (newBottom > this.rect.bottom) {
            needRefit = true;
            this.rect.bottom = newBottom;
            this.doneMap[this.enumFindDirection.left] = 0;
            this.doneMap[this.enumFindDirection.right] = 0;
            this.doneMap[this.enumFindDirection.bottom] = 0;
          }
          if (needRefit) {
            break;
          }
        }
        if (needRefit) {
          break;
        }
      }
      if (!needRefit) {
        this.doneMap[direction] = 1;
      }
    }
    , findOwner: function (x, y) {
      let owner = null;
      let leftLimit = -1;
      let topLimit = -1;

      for (let topIndex = y; topIndex >= 0; topIndex--) {

        for (let leftIndex = x; leftIndex >= 0; leftIndex--) {
          if (leftLimit !== -1 && leftIndex < leftLimit) {
            break;
          }
          let target = myRect[topIndex][leftIndex];
          if (target.display === 1) {
            leftLimit = leftIndex + target.colspan - 1;
            topLimit = topIndex + target.rowspan - 1;
            if (leftLimit >= x && topLimit >= y) {
              owner = { top: topIndex, left: leftIndex };
            }
          }
        }
      }
      return owner;
    }
  };
  return RectLogic.fitRect(start, target);
};