import React, { PureComponent } from 'react';
import { ContextMenu, MenuItem, SubMenu, connectMenu } from 'react-contextmenu';

const cellMenuItems = [];
const tableMenuItems = [];
const rowMenuItems = [];
const columnMenuItems = [];

const TABLE_CELLS = 'table-cells';
const TABLE_HANDLE = 'table-handle';
const TABLE_COLUMNS = 'table-columns';
const TABLE_ROWS = 'table-rows';

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
  insertGroup: {
    title: '插入分组',
    children: [],
  },
  insertParentRowGroup: {
    title: '父组',
    data: { menuId: 'insertParentRowGroup' },
  },
  insertChildRowGroup: {
    title: '子组',
    data: { menuId: 'insertChildRowGroup' },
  },
  editGroup: {
    title: '分组管理',
    data: { menuId: 'editGroup' },
  },
  group: {
    title: '分组',
    children: [{
      title: '删除分组',
      data: { menuId: 'deleteGroup' },
    }, {
      title: '分组属性',
      data: { menuId: 'groupInfo' },
    }],
  },
  deleteAllGroups : {
    title:'删除全部分组',
    data : { menuId : 'deleteAllGroups' }
  },
  // //////////////////////
  deleteTable: {
    title: '删除表格',
    data: { menuId: 'deleteTable' },
  },
  // //////////////////////
  insertLeftColumn: {
    title: '向左插入列',
    data: { menuId: 'insertColmunLeft' },
  },
  insertRightColumn: {
    title: '向右插入列',
    data: { menuId: 'insertColmunRight' },
  },
  modifyColumnName :{
    title:'修改列名',
    data: { menuId: 'modifyColumnName'},
  },
  deleteColumn: {
    title: '删除列',
    data: { menuId: 'deleteColumn' },
  },
  insertGroupColumn: {
    title: '插入分组列',
    data: { menuId: 'insertGroupColumn' },
  },
  // /////////////////
  insertUpRow: {
    title: '向上插入行',
    data: { menuId: 'insertRowUp' },
  },
  insertDownRow: {
    title: '向下插入行',
    data: { menuId: 'insertRowDown' },
  },
  insertTableHeader: {
    title: '插入表头',
    data: { menuId: 'insertTableHeader' },
  },
  insertTableFooter: {
    title: '插入表尾',
    data: { menuId: 'insertTableFooter' },
  },
  // insertGroupHeader: {
  //   title: '插入分组头',
  //   data: { menuId: 'insertGroupHeader' },
  // },
  // insertGroupFooter: {
  //   title: '插入分组尾',
  //   data: { menuId: 'insertGroupFooter' },
  // },
  deleteRow: {
    visible: true,
    title: '删除行',
    data: { menuId: 'deleteRow' },
  },
};
const getInsertGroupMenu = (hasParent, hasChild) => {
  menuItems.insertGroup.children.length = 0;
  if (hasParent) {
    menuItems.insertGroup.children.push(menuItems.insertParentRowGroup);
  }
  if (hasChild) {
    menuItems.insertGroup.children.push(menuItems.insertChildRowGroup);
  }
  return menuItems.insertGroup;
};
class TableContextMenu extends PureComponent {

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
        data={menu.data}
        onClick={handleClick}
      >{menu.title}</MenuItem>);
    }
  }

  render() {
    const { menuId, items, onContextMenu } = this.props;
    const style = {};
    if (items.length === 0) {
      style.display = 'none';
    }else{
      style.zIndex = '999';
    }
    return (<ContextMenu style={style} id={menuId} hideOnLeave={false}>
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
  return (<TableContextMenu
    menuId={id}
    items={tableMenuItems}
    onContextMenu={onItemClick}
  />);
});
const ColumnHeaderContextMenu = connectMenu(TABLE_COLUMNS)((props) => {
  const { id, trigger } = props;
  const { onItemClick, selection, cornerSize } = (trigger || {});
  columnMenuItems.length = 0;
  if (trigger && selection && selection.type === 'col') {
    const { left, right } = selection;
    if (left >= cornerSize.columns) {
      columnMenuItems.push(menuItems.insertLeftColumn);
    }
    if (right >= cornerSize.columns) {  
      columnMenuItems.push(menuItems.insertRightColumn);
    }
    columnMenuItems.push(menuItems.insertGroupColumn);
    columnMenuItems.push(menuItems.modifyColumnName);
    columnMenuItems.push(menuItems.deleteColumn);
  }

  return (<TableContextMenu
    menuId={id}
    items={columnMenuItems}
    onContextMenu={onItemClick}
  />);
});
const RowHeaderContextMenu = connectMenu(TABLE_ROWS)((props) => {
  const { id, trigger } = props;
  const { onItemClick, selection, rowGroups } = (trigger || {});

  rowMenuItems.length = 0;
  if (trigger && selection && selection.type === 'row') {
    const bodyRange = {
      start: rowGroups[0].startRow,
      end: rowGroups[0].endRow,
    };
    const { top, bottom } = selection;
    if (top < bodyRange.start || top > bodyRange.end) {
      rowMenuItems.push(menuItems.insertUpRow);
    }
    if (bottom < bodyRange.start || bottom > bodyRange.end) {
      rowMenuItems.push(menuItems.insertDownRow);
    }
    rowMenuItems.push(menuItems.insertTableHeader);
    rowMenuItems.push(menuItems.insertTableFooter);
    if (top >= bodyRange.start && bottom <= bodyRange.end) {
      if (top === bottom) {
        // rowMenuItems.push(menuItems.insertGroupHeader);
        // rowMenuItems.push(menuItems.insertGroupFooter);
        const hasChild = rowGroups.length === 1 && rowGroups[0].expressions.length === 0;
        // rowMenuItems.push(getInsertGroupMenu(true, !hasChild));
        rowMenuItems.push(menuItems.deleteAllGroups);
      }
      // rowMenuItems.push(menuItems.group);
    }
    rowMenuItems.push(menuItems.deleteRow);
  }
  return (<TableContextMenu
    menuId={id}
    items={rowMenuItems}
    onContextMenu={onItemClick}
  />);
});
const TableCellContextMenu = connectMenu(TABLE_CELLS)((props) => {
  const { id, trigger } = props;
  const { onItemClick, selection, cornerSize, rowGroups, tableRows, groupIndex } = (trigger || {});
  cellMenuItems.length = 0;
  if (trigger && selection && selection.type === 'rect') {
    const { left, right, top, bottom } = selection;
    if ((left < cornerSize.columns && right >= cornerSize.columns) ||
      (top < cornerSize.rows && bottom >= cornerSize.rows)) {
      // 跨区域
      cellMenuItems.push(menuItems.clearCell);
    } else if (bottom < cornerSize.rows && left < cornerSize.columns) {
      // 右上
      const mergeOrSplit = canMergeOrSplit(tableRows, cornerSize, selection);
      if (mergeOrSplit.canMerge) {
        cellMenuItems.push(menuItems.mergerCell);
      }
      if (mergeOrSplit.canSplit) {
        cellMenuItems.push(menuItems.splitCell);
      }
      cellMenuItems.push(menuItems.clearCell);
    } else if (top >= cornerSize.rows && left >= cornerSize.columns) {
      // 右下
      if (top === bottom && left < right) {
        const cell = tableRows[top][left];
        if (cell.colspan - 1 === right - left) {
          cellMenuItems.push(menuItems.splitCell);
        } else {
          cellMenuItems.push(menuItems.mergerCell);
        }
      }
      cellMenuItems.push(menuItems.clearCell);
      if (bottom <= rowGroups[0].endRow) {
        if (top === bottom) {
          const g = groupIndex >= 0 ? rowGroups[groupIndex] : null;
          cellMenuItems.push(getInsertGroupMenu(true, g && g.expressions.length > 0));
        }
        if(tableRows[top][left].textBox.value !== undefined){
          // cellMenuItems.push(menuItems.group);
          menuItems.group.children.forEach((item) => {cellMenuItems.push(item)});
        }
      }

    } else if (top >= cornerSize.rows && right <= cornerSize.columns) {
      // 左下
      cellMenuItems.push(menuItems.clearCell);
      if (bottom <= rowGroups[0].endRow) {
        const g = groupIndex >= 0 ? rowGroups[groupIndex] : null;
        cellMenuItems.push(getInsertGroupMenu(true, g && g.expressions.length > 0));
        menuItems.group.children.forEach((item) => {cellMenuItems.push(item)});
        // cellMenuItems.push(menuItems.group);
      } else if (top === bottom) {
        const cell = tableRows[top][left];
        if (cell.colspan - 1 === right - left) {
          cellMenuItems.push(menuItems.splitCell);
        } else {
          cellMenuItems.push(menuItems.mergerCell);
        }
      }
    } else if (top < cornerSize.rows && right >= cornerSize.columns) {
      // 左上
      const mergeOrSplit = canMergeOrSplit(tableRows, cornerSize, selection);
      if (mergeOrSplit.canMerge) {
        cellMenuItems.push(menuItems.mergerCell);
      }
      if (mergeOrSplit.canSplit) {
        cellMenuItems.push(menuItems.splitCell);
      }
      cellMenuItems.push(menuItems.clearCell);
    }
     // cellMenuItems.push(menuItems.deleteAllGroups);
  }
  return (<TableContextMenu
    menuId={id}
    items={cellMenuItems}
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
  ColumnHeaderContextMenu,
  RowHeaderContextMenu,
  TableCellContextMenu,
};

