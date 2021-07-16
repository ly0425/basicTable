import { ContextMenu, MenuItem, SubMenu, connectMenu } from 'react-contextmenu';
import React, { PureComponent } from 'react';

let Text_Area = 'head-text-area';
const setTextAreaRight = (v)=> {
  Text_Area = v;
  return connectMenu(Text_Area)(DynamicMenu);
};
const textAreaMenuItems = [];
const menuItems = {
	delete: {
	    title: '删除当前项',
	    data: { menuId: 'delete' },
    },
    setgroupPrintHead: {
	    title: '设置为分组打印显示头',
	    data: { menuId: 'setgroupPrintHead' },
  	},
  setlayout: {
    title: '设置左右布局',
    children: [{
      title: '居左',
      data: { menuId: 'left' },
    }, {
      title: '居右',
      data: { menuId: 'right' },
    },
    {
      title: '居中',
      data: { menuId: 'center' },
    }],
  },
};

class TextboxContextMenu extends PureComponent {
  renderItem = (menu, handleClick,index='All') => {
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
        data={{data:menu.data,index}}
        onClick={handleClick}
      >{menu.title}</MenuItem>);
    }
  }
  render() {
    const { id, items, onContextMenu,index } = this.props;
    const style = {};
    if (items.length === 0) {
      style.display = 'none';
    }else{
      style.zIndex = '999';
    }
    return (<ContextMenu style={style} id={id} hideOnLeave={false}>
      {
        items.map((item) => {
          return this.renderItem(item, onContextMenu,index);
        })
      }
    </ContextMenu>);
  }
}

const DynamicMenu=(props)=>{
	const { id, trigger } = props;
    const {onItemClick,index} = (trigger||{});
    textAreaMenuItems.length = 0;
    if(index !== undefined){
    	textAreaMenuItems.push(menuItems.delete);
      textAreaMenuItems.push(menuItems.setlayout);
      textAreaMenuItems.push(menuItems.setgroupPrintHead);
    }

    return (
		<TextboxContextMenu
		id={id}
		index={index}
		items={textAreaMenuItems}
		onContextMenu={onItemClick}
		/>
    );
}
export {setTextAreaRight}
