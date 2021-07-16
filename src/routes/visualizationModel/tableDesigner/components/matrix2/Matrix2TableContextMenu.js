import { ContextMenu, MenuItem, SubMenu, connectMenu } from 'react-contextmenu';
import React, { PureComponent } from 'react';
import produce from 'immer';

const TABLE_HANDLE = 'table-handle';
const TABLE_CELLS = 'table-cells';
const TABLE_ROWS = 'table-rows';
const TABLE_COLUMNS = 'table-columns';

const tableMenuItems = [];
const cellMenuItems = [];
const rowMenuItems = [];
const colMenuItems = [];

const menuItems = {
  mergerCell: {
    title: '合并单元格',
    data: { menuId: 'mergerCell' },
  },
  splitCell: {
    title: '拆分单元格',
    data: { menuId: 'splitCell' },
  },
  clearCell: {
    title: '清空单元格',
    data: { menuId: 'clearCell' },
  },
  deleteTable: {
    title: '删除表格',
    data: { menuId: 'deleteTable' },
  },
  insertParentRowGroup: {
    title: '父组',
    data: { menuId: 'insertParentRowGroup' },
  },
  insertChildRowGroup: {
    title: '子组',
    data: { menuId: 'insertChildRowGroup' },
  },
  insertTopAdjacentGroup: {
    title: '上方相邻组',
    data: { menuId: 'insertTopAdjacentGroup' },
  },
  insertBottomAdjacentGroup: {
    title: '下方相邻组',
    data: { menuId: 'insertBottomAdjacentGroup' },
  },
  insertParentColGroup: {
    title: '父组',
    data: { menuId: 'insertParentColGroup' },
  },
  insertChildColGroup: {
    title: '子组',
    data: { menuId: 'insertChildColGroup' },
  },
  insertLeftAdjacentGroup: {
    title: '左侧相邻组',
    data: { menuId: 'insertLeftAdjacentGroup' },
  },
  insertRightAdjacentGroup: {
    title: '右侧相邻组',
    data: { menuId: 'insertRightAdjacentGroup' },
  },
  rowGroup: {
    title: '行组',
    children: [],
  },
  colGroup: {
    title: '列组',
    children: [],
  },
  deleteGroup: {
    title: '删除组',
    data: { menuId: 'deleteGroup' },
  },
  groupInfo: {
    title: '分组属性',
    data: { menuId: 'groupInfo' },
  },
  insertUpRow: {
    title: '向上插入行',
    data: { menuId: 'insertRowUp' },
  },
  insertDownRow: {
    title: '向下插入行',
    data: { menuId: 'insertRowDown' },
  },
  deleteRow: {
    visible: true,
    title: '删除行',
    data: { menuId: 'deleteRow' },
  },
  insertLeftColumn: {
    title: '向左插入列',
    data: { menuId: 'insertColmunLeft' },
  },
  insertRightColumn: {
    title: '向右插入列',
    data: { menuId: 'insertColmunRight' },
  },
  deleteColumn: {
    title: '删除列',
    data: { menuId: 'deleteColumn' },
  },
  addGroups: {
    title: '组操作',
    children: [],
  },
  addTotal: {
    title: '添加总计',
    data: { menuId: 'addTotal' },
  },
};

const getInsertGroupMenu = (hasParent, hasChild, type) => {
  const insertGroup = {
    title: '插入分组',
    children: [],
  };
  if (type === 'row') {
    if (hasParent) {
      insertGroup.children.push(menuItems.insertParentRowGroup);
    }
    if (hasChild) {
      insertGroup.children.push(menuItems.insertChildRowGroup);
    }
    insertGroup.children.push(menuItems.insertTopAdjacentGroup);
    insertGroup.children.push(menuItems.insertBottomAdjacentGroup);
  } else {
    if (hasParent) {
      insertGroup.children.push(menuItems.insertParentColGroup);
    }
    if (hasChild) {
      insertGroup.children.push(menuItems.insertChildColGroup);
    }
    insertGroup.children.push(menuItems.insertLeftAdjacentGroup);
    insertGroup.children.push(menuItems.insertRightAdjacentGroup);
  }
  return insertGroup;
};
class TextboxContextMenu extends PureComponent {
  renderItem = (menu, handleClick) => {
    if (menu.children) {
      const items = menu.children;
      return items.length > 0 ?
        (<SubMenu key={menu.title} preventClose title={menu.title} hoverDelay={200}>
          {
            items.map((item) => {
              return this.renderItem(item, handleClick);
            })
          }
        </SubMenu>) : null;
    } else {
      return (<MenuItem
        key={menu.data.menuId}
        data={{ ...menu.data, type: menu.data.type }}
        onClick={handleClick}
      >{menu.title}</MenuItem>);
    }
  }
  render() {
    const { id, items, onContextMenu } = this.props;
    const style = {};
    if (items.length === 0) {
      style.display = 'none';
    } else {
      style.zIndex = '999';
    }
    return (<ContextMenu style={style} id={id} hideOnLeave={false}>
      {
        items.map((item) => {
          return this.renderItem(item, onContextMenu);
        })
      }
    </ContextMenu>);
  }
}


const TableControlContextMenu = connectMenu(TABLE_HANDLE)((props) => {
  const { id, trigger } = props;
  const { onItemClick } = (trigger || {});
  tableMenuItems.length = 0;
  tableMenuItems.push(menuItems.deleteTable);
  return (
    <TextboxContextMenu
      id={id}
      items={tableMenuItems}
      onContextMenu={onItemClick}
    />
  );
});

const TableCellContextMenu = connectMenu(TABLE_CELLS)((props) => {
  const { id, trigger } = props;
  const { onItemClick, cornerSize, tableRows, selection, rowGroups, columnGroups, getGroupRelatedInfo, rowsId, colsId, getGroupStart } = (trigger || {});
  cellMenuItems.length = 0;
  if (trigger && selection && selection.type === 'rect') {
    cellMenuItems.push(menuItems.clearCell);
    if (selection.bottom < cornerSize.rows && selection.left < cornerSize.columns) {
      // corner
      const mergeOrSplit = canMergeOrSplit(tableRows, cornerSize, selection);
      if (mergeOrSplit.canMerge) {
        cellMenuItems.push(menuItems.mergerCell);
      }
      if (mergeOrSplit.canSplit) {
        cellMenuItems.push(menuItems.splitCell);
      }
      cellMenuItems.push(menuItems.clearCell);
    } else if (selection.top >= cornerSize.rows && selection.left < cornerSize.columns && selection.bottom >= cornerSize.rows && selection.right < cornerSize.columns) {
      // row
      if (selection.top < selection.bottom || selection.left < selection.right) {
        const cell = tableRows[selection.top][selection.left];
        if (cell.colspan - 1 === selection.right - selection.left &&
          cell.rowspan - 1 === selection.bottom - selection.top) {
          const splitCell = produce(menuItems.splitCell, (draft) => {
            draft.data.type = 'row';
          });
          const textBox = tableRows[selection.top][selection.left];
          const childTextbox = tableRows[selection.top][selection.right + 1];
          if (textBox.colspan !== childTextbox.colspan || textBox.rowspan !== childTextbox.rowspan) {
            cellMenuItems.push(splitCell);
          }
        } else {
          let isMergerCell = true;
          let selectionKeyList = [];
          for (let i = selection.left; i <= selection.right; i++) {
            if (i > selection.left && i < selection.right) {
              if (rowGroups.get(colsId[i])) {
                if (rowGroups.get(colsId[i]).get(rowsId[selection.top])) {
                  isMergerCell = false;
                }
              }
            }
            for (let n = selection.top; n <= selection.bottom; n++) {
              const groupInfo = getGroupRelatedInfo('row', true, {
                top: n,
                left: i,
              });
              selectionKeyList.push(groupInfo.rowActualKey)
            }
          }
          let initialKey = selectionKeyList[0];
          if (selectionKeyList.findIndex(i => i !== initialKey) !== -1) {
            isMergerCell = false;
          }
          let textBox = null;
          for (let m = selection.bottom; m >= cornerSize.rows && !textBox; m--) {
            if (tableRows[m][selection.left - 1] && tableRows[m][selection.left - 1].display) {
              textBox = tableRows[m][selection.left - 1];
              if (!(m <= selection.top) || !((m + textBox.rowspan - 1) >= selection.bottom)) {
                isMergerCell = false;
              }
            }
          }
          isMergerCell && cellMenuItems.push(menuItems.mergerCell);
        }
      }
      cellMenuItems.push(getInsertGroupMenu(true, true, 'row'));
      menuItems.rowGroup.children.length = 0;
      if (getGroupRelatedInfo('row', true).currentSelectedGroup) {
        menuItems.rowGroup.children.push(menuItems.deleteGroup);
        menuItems.rowGroup.children.push(menuItems.groupInfo);
        const addTotal = produce(menuItems.addTotal, (draft) => {
          draft.data.type = 'row';
        });
        menuItems.rowGroup.children.push(addTotal);
      }
      cellMenuItems.push(menuItems.rowGroup);
    } else if (selection.left >= cornerSize.columns && selection.top < cornerSize.rows && selection.right >= cornerSize.columns && selection.bottom < cornerSize.rows) {
      // columns
      if (selection.top < selection.bottom || selection.left < selection.right) {
        const cell = tableRows[selection.top][selection.left];
        if (cell.colspan - 1 === selection.right - selection.left &&
          cell.rowspan - 1 === selection.bottom - selection.top) {
          const splitCell = produce(menuItems.splitCell, (draft) => {
            draft.data.type = 'col';
          });
          const textBox = tableRows[selection.top][selection.left];
          const childTextbox = tableRows[selection.bottom + 1][selection.left];
          if (textBox.colspan !== childTextbox.colspan || textBox.rowspan !== childTextbox.rowspan) {
            cellMenuItems.push(splitCell);
          }
        } else {
          let isMergerCell = true;
          let selectionKeyList = [];
          for (let i = selection.top; i <= selection.bottom; i++) {
            if (i > selection.top && i < selection.bottom) {
              if (columnGroups.get(rowsId[i])) {
                if (columnGroups.get(rowsId[i]).get(rowsId[selection.left])) {
                  isMergerCell = false;
                }
              }
            }
            for (let n = selection.left; n <= selection.right; n++) {
              const groupInfo = getGroupRelatedInfo('col', true, {
                top: i,
                left: n,
              });
              selectionKeyList.push(groupInfo.colActualKey);
            }
          }
          let initialKey = selectionKeyList[0];
          if (selectionKeyList.findIndex(i => i !== initialKey) !== -1) {
            isMergerCell = false;
          }
          let textBox = null;
          for (let m = selection.right; m >= cornerSize.columns && !textBox; m--) {
            if (tableRows[selection.top - 1] && tableRows[selection.top - 1][m].display) {
              textBox = tableRows[selection.top - 1][m];
              if (!(m <= selection.left) || !((m + textBox.colspan - 1) >= selection.right)) {
                isMergerCell = false;
              }
            }
          }
          isMergerCell && cellMenuItems.push(menuItems.mergerCell);
        }
      }
      cellMenuItems.push(getInsertGroupMenu(true, true, 'col'));
      menuItems.colGroup.children.length = 0;
      if (getGroupRelatedInfo('col', true).currentSelectedGroup) {
        menuItems.colGroup.children.push(menuItems.groupInfo);
        menuItems.colGroup.children.push(menuItems.deleteGroup);
        const addTotal = produce(menuItems.addTotal, (draft) => {
          draft.data.type = 'col';
        });
        menuItems.colGroup.children.push(addTotal);
      }
      cellMenuItems.push(menuItems.colGroup);
    } else if (selection.left >= cornerSize.columns && selection.top >= cornerSize.rows) {
      // body
      if (selection.top === selection.bottom && selection.left < selection.right) {
        const cell = tableRows[selection.top][selection.left];
        if (cell.colspan - 1 === selection.right - selection.left) {
          cellMenuItems.push(menuItems.splitCell);
        } else {
          let selectionKeyList = [];
          for (let i = selection.left; i <= selection.right; i++) {
            const groupInfo = getGroupRelatedInfo('col', true, {
              top: selection.top,
              left: i,
            });
            selectionKeyList.push(groupInfo.colActualKey)
          }
          console.log(selectionKeyList)
          let initialKey = selectionKeyList[0];
          if (selectionKeyList.findIndex(i => i !== initialKey) === -1) {
            cellMenuItems.push(menuItems.mergerCell);
          }
        }
      }
      menuItems.addGroups.children.length = 0;
      menuItems.colGroup.children.length = 0;
      menuItems.rowGroup.children.length = 0;
      menuItems.colGroup.children.push(getInsertGroupMenu(true, true, 'col'));
      let groupInfo = JSON.parse(JSON.stringify(menuItems.groupInfo)),
        deleteGroup = JSON.parse(JSON.stringify(menuItems.deleteGroup));
      groupInfo.data.type = 'col';
      deleteGroup.data.type = 'col';
      menuItems.colGroup.children.push(groupInfo);
      menuItems.colGroup.children.push(deleteGroup);
      menuItems.rowGroup.children.push(getInsertGroupMenu(true, true, 'row'));
      groupInfo = JSON.parse(JSON.stringify(menuItems.groupInfo));
      deleteGroup = JSON.parse(JSON.stringify(menuItems.deleteGroup));
      groupInfo.data.type = 'row';
      deleteGroup.data.type = 'row';
      menuItems.rowGroup.children.push(groupInfo);
      menuItems.rowGroup.children.push(deleteGroup);
      menuItems.addGroups.children.push(menuItems.rowGroup);
      menuItems.addGroups.children.push(menuItems.colGroup);
      // cellMenuItems.push(menuItems.addGroups);
      // cellMenuItems.push(menuItems.clearCell);
    }
  }
  return (
    <TextboxContextMenu
      id={id}
      items={cellMenuItems}
      onContextMenu={onItemClick}
    />
  );
});

const RowHeaderContextMenu = connectMenu(TABLE_ROWS)((props) => {
  const { id, trigger } = props;
  const { onItemClick, selection, rowGroups } = (trigger || {});

  rowMenuItems.length = 0;
  if (trigger && selection && selection.type === 'row') {
    rowMenuItems.push(menuItems.insertUpRow);
    rowMenuItems.push(menuItems.insertDownRow);
    rowMenuItems.push(menuItems.deleteRow);
  }
  return (<TextboxContextMenu
    id={id}
    items={rowMenuItems}
    onContextMenu={onItemClick}
  />);
});

const ColumnHeaderContextMenu = connectMenu(TABLE_COLUMNS)((props) => {
  const { id, trigger } = props;
  const { onItemClick, selection, rowGroups } = (trigger || {});

  colMenuItems.length = 0;
  if (trigger && selection && selection.type === 'col') {
    colMenuItems.push(menuItems.insertLeftColumn);
    colMenuItems.push(menuItems.insertRightColumn);
    colMenuItems.push(menuItems.deleteColumn);
  }
  return (<TextboxContextMenu
    id={id}
    items={colMenuItems}
    onContextMenu={onItemClick}
  />);
});
const canMergeOrSplit = (tableRows, cornerSize, selection) => {
  const { left, right, top, bottom } = selection;
  let canMerge = true;
  let canSplit = true;
  const { rowspan, colspan } = tableRows[top][left];
  if (colspan - 1 === right - left && rowspan - 1 === bottom - top) {
    canMerge = false;
  } else if (top > 0) {
    for (let i = left + 1; i <= right; i += 1) {
      if (tableRows[top - 1][i].display === 1) {
        canMerge = false;
        break;
      }
    }
  }

  if (!canMerge && (rowspan > 1 || colspan > 1) &&
    (colspan - 1 === right - left && rowspan - 1 === bottom - top)) {
    if (bottom < cornerSize.rows - 1) {
      for (let i = left + 1; i <= right; i += 1) {
        if (tableRows[top + 1][i].display === 0) {
          canSplit = false;
          break;
        }
      }
    }
  } else {
    canSplit = false;
  }
  return { canMerge, canSplit };
};
export {
  TableControlContextMenu,
  TableCellContextMenu,
  RowHeaderContextMenu,
  ColumnHeaderContextMenu,
};
