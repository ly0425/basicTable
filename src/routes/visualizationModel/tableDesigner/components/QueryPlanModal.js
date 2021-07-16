
import React, { Component } from 'react';
import { Modal, Tabs, Tree } from '@vadp/ui';
import { Columns, Conditions, GroupItem, Orders, Linkage } from './queryPlanRelated';
import produce from 'immer';
const { TabPane } = Tabs;
const { TreeNode } = Tree;
let attributeMap = { isChecked: true };
class QueryPlanModal extends Component {
  constructor(props) {
    super(props);
    const queryPlanMap = JSON.parse(JSON.stringify(props.queryPlanMap));
    let columnAttributeMap = queryPlanMap.fields[0].columnAttributeMap || {};
    let conditionAttributeMap = queryPlanMap.fields[0].conditionAttributeMap || {};
    let LinkageAttributeMap = queryPlanMap.fields[0].LinkageAttributeMap || {};
    queryPlanMap.fields[0].columnAttributeMap = { ...columnAttributeMap, ...attributeMap };

    queryPlanMap.fields[0].conditionAttributeMap = { ...conditionAttributeMap, ...attributeMap };
    queryPlanMap.fields[0].LinkageAttributeMap = { ...LinkageAttributeMap, ...attributeMap };

    this.state = {
      titleTabs: [
        { id: 'conditions', name: '条件' },
        { id: 'columns', name: '栏目' },
        { id: 'rowGroups', name: '行分组' },
        { id: 'colGroups', name: '列分组' },
        { id: 'orders', name: '排序' },
        { id: 'linkage', name: '联动目标设置' },
      ],
      selectKey: 'conditions',
      groupKey: null,
      data: queryPlanMap,
      actionModelVisible: false,
      formatTypeVisible: false,
      sortVisible: false,
      referenceVisible: false,
      defaultVisible: false,
      searchV: '',
      linkageList: queryPlanMap.linkageList,
    };
  }
  componentDidMount() {

  }
  onOk = () => {
    const { data,linkageList } = this.state;
    let columns = data.fields.map(item => {
      let { isChecked,columnAttributeMap={}, ...arg } = item;
      let obj = {...columnAttributeMap};
      obj.fieldName = item.aliasName || item.fieldName;
      obj.tableName = item.tableName;
      obj.originalName = item.comments || item.aliasName || item.fieldName;
      obj.title = columnAttributeMap.title || item.comments || item.aliasName || item.fieldName;
      obj.dataType = item.dataType;
      obj.fieldType = item.fieldType;
      obj.isOptional = (columnAttributeMap.isOptional == undefined ? true : columnAttributeMap.isOptional);
      obj.isShow = (columnAttributeMap.isShow == undefined ? true : columnAttributeMap.isShow);
      obj.parentId = item.parentId;
      obj.parentName = item.parentName;
      obj.orderNo = item.orderNo;
      delete  obj.isChecked;
      return obj;
    });
    let conditions = data.fields.map(item => {
        let { isChecked,conditionAttributeMap={}, ...arg } = item;
      let obj = {...conditionAttributeMap};
      obj.fieldName = item.aliasName || item.fieldName;
      obj.tableName = item.tableName;
      obj.title = conditionAttributeMap.title || item.comments || item.aliasName || item.fieldName;
      obj.dataType = item.dataType;
      obj.isEdit = conditionAttributeMap.isEdit === undefined ? true : conditionAttributeMap.isEdit;
      obj.isOptional = conditionAttributeMap.isOptional == undefined ? true : conditionAttributeMap.isOptional;
        // arg.dataType = item.conditionAttributeMap.dataType;
      obj.isAllowBlank = conditionAttributeMap.isAllowBlank === undefined ? true : conditionAttributeMap.isAllowBlank;
      obj.parentId = item.parentId;
      obj.parentName = item.parentName;
      obj.orderNo = item.orderNo;
      delete  obj.isChecked;
        return obj;
      })
    let rowGroups = data.fields.filter(item=>item.fieldType=='dimension').map(item => {
        let { isChecked,rowGroupsAttributeMap={}, ...arg } = item;
      let obj = {...rowGroupsAttributeMap};
      obj.fieldName = item.aliasName || item.fieldName;
      obj.tableName = item.tableName;
      obj.title = rowGroupsAttributeMap.title || item.comments || item.aliasName || item.fieldName;
      obj.dataType = item.dataType;
      // obj.isOptional = rowGroupsAttributeMap.isOptional == undefined ? true : rowGroupsAttributeMap.isOptional;
      // obj.isOptional=false
      obj.isShow = (rowGroupsAttributeMap.isShow == undefined ? true : rowGroupsAttributeMap.isShow);
      obj.parentId = item.parentId;
      obj.parentName = item.parentName;
      obj.orderNo = item.orderNo;
      delete  obj.isChecked;
        return obj;
      })
    let colGroups = data.fields.filter(item=>item.fieldType=='dimension').map(item => {
        let { isChecked,colGroupsAttributeMap={}, ...arg } = item;
      let obj = {...colGroupsAttributeMap};
      obj.fieldName = item.aliasName || item.fieldName;
      obj.tableName = item.tableName;
      obj.title = colGroupsAttributeMap.title || item.comments || item.aliasName || item.fieldName;
      obj.dataType = item.dataType;
      // obj.isOptional = colGroupsAttributeMap.isOptional == undefined ? true : colGroupsAttributeMap.isOptional;
      // obj.isOptional=false
      obj.isShow = true;
      obj.parentId = item.parentId;
      obj.parentName = item.parentName;
      obj.orderNo = item.orderNo;
      delete  obj.isChecked;
        return obj;
      })
    let orders = data.fields.filter(item=>item.fieldType==='dimension').map(item => {
      let { isChecked,ordersAttribute={}, ...arg } = item;
      let obj = {...ordersAttribute};
      obj.fieldName = item.aliasName || item.fieldName;
      obj.tableName = item.tableName;
      obj.title = ordersAttribute.title || item.comments || item.aliasName || item.fieldName;
      obj.dataType = item.dataType;
      // obj.isOptional = ordersAttribute.isOptional === undefined ? true : ordersAttribute.isOptional;
      obj.isOptional = ordersAttribute.isOptional;
      obj.isFixed = ordersAttribute.isFixed;
      obj.order = 'ascend'; // 默认升序
      obj.parentId = item.parentId;
      obj.parentName = item.parentName;
      delete  obj.isChecked;
      return obj;
    })
    this.props.onOk({
      columns, conditions, rowGroups, colGroups,orders, linkageList
    })
  }
  clickSwitchTab = (categoryType, attributeType, fieldName) => {
    const data = produce(this.state.data, d => {
      d[categoryType].forEach(item => {
        if (!item[attributeType]) {
          item[attributeType] = {};
        }
        if (item.fieldName == fieldName) {
          item[attributeType].isChecked = true;
        } else {
          item[attributeType].isChecked = false;
        }
      });
    })
    this.setState({ data })
  }
  renderTreeNodes = data =>
      data.map(item => {
        if (item.children) {
          return (
              <TreeNode title={item.title} key={item.key} dataRef={item}>
                {this.renderTreeNodes(item.children)}
              </TreeNode>
          );
        }
        return <TreeNode key={item.key} {...item} />;
      });
  tabsChange = (selectKey) => {
    let groupKey = null;
    let data = this.state.data;
    switch (selectKey) {
      case 'rowGroups':
        groupKey = selectKey;
        data = produce(data, d => {
          let index = d.fields.findIndex(item => item.rowGroupsAttributeMap);
          if (index == -1) {
            let dimensionIndex = d.fields.findIndex(item => item.fieldType == 'dimension');
            d.fields[dimensionIndex].rowGroupsAttributeMap = attributeMap;
          } else {
            let isCheckedI = d.fields.findIndex(item => item.rowGroupsAttributeMap && item.rowGroupsAttributeMap.isChecked);
            if (isCheckedI == -1) {
              d.fields[index].rowGroupsAttributeMap.isChecked = true;;
            }
          }

        })
        break;
      case 'colGroups':
        groupKey = selectKey;
        data = produce(data, d => {
          let index = d.fields.findIndex(item => item.colGroupsAttributeMap);
          if (index == -1) {
            let dimensionIndex = d.fields.findIndex(item => item.fieldType == 'dimension');
            d.fields[dimensionIndex].colGroupsAttributeMap = attributeMap;
          } else {
            let isCheckedI = d.fields.findIndex(item => item.colGroupsAttributeMap && item.colGroupsAttributeMap.isChecked);
            if (isCheckedI == -1) {
              d.fields[index].colGroupsAttributeMap.isChecked = true;;
            }
          }
        })
        break;
      case 'orders':
        groupKey = selectKey;
        data = produce(data, d => {
          let index = d.fields.findIndex(item => item.ordersAttribute);
          if (index == -1) {
            let dimensionIndex = d.fields.findIndex(item => item.fieldType == 'dimension');
            d.fields[dimensionIndex].ordersAttribute = attributeMap;
          } else {
            let isCheckedI = d.fields.findIndex(item => item.ordersAttribute && item.ordersAttribute.isChecked);
            if (isCheckedI == -1) {
              d.fields[index].ordersAttribute.isChecked = true;
            }
          }
        })
        break;
      case 'linkage':
        groupKey = selectKey;
        data = produce(data, d => {
          let index = d.fields.findIndex(item => item.LinkageAttributeMap);
          if (index == -1) {
            let dimensionIndex = d.fields.findIndex(item => item.fieldType == 'dimension');
            d.fields[dimensionIndex].LinkageAttributeMap = attributeMap;
          } else {
            let isCheckedI = d.fields.findIndex(item => item.LinkageAttributeMap && item.LinkageAttributeMap.isChecked);
            if (isCheckedI == -1) {
              d.fields[index].LinkageAttributeMap.isChecked = true;
            }
          }
        })
        break;
      default: break;
    }
    this.setState({ selectKey, groupKey, data, searchV: '' })
  }

  eventsDisposeList = (categoryType, attributeTypeType, vType, v,newActionI) => {
    if(attributeTypeType==='LinkageAttributeMap'&& categoryType==='Linkage'){
      const linkageList = produce(this.state.linkageList, d => {
        if(vType==='actionData'){
          let actionName =typeof v.selectedOptions==='string' ?  v.selectedOptions :(v.selectedOptions.map(item => {
            if(!item.children) {
              return item.item.name;
            }
          })).slice(-1)
          const {selectedOptions,...args}=v;
          if(!newActionI && newActionI === 0){
            d[newActionI] = {...args,actionName}
          }else{
            d.push({...args,actionName})
          }
        }else if(vType==='isDelete'){
          let index = d.findIndex(c=>c.targetObject[c.targetObject.length-1] === v.targetObject[v.targetObject.length-1])
          d.splice(index,1)
        }

      })
      this.setState({ linkageList })
      return;
    }
    const data = produce(this.state.data, d => {
      let index = d[categoryType].findIndex(item => item[attributeTypeType] && item[attributeTypeType].isChecked);
      this.fieldsEvents(d, index, attributeTypeType, vType, v)
    })
    this.setState({ data })
  }
  fieldsEvents = (d, index, attributeTypeType, vType, v) => {
    const { groupKey } = this.state;
    if (vType === 'actionModelVisible' || vType === 'formatTypeVisible' || vType === 'sortVisible' || vType === 'referenceVisible' || vType === 'defaultVisible') {
      this.setState({
        [vType]: !this.state[vType]
      })
      return;
    }
    if (!groupKey) {
      if (vType === 'contentSourceStyle') {
        d.fields[index][attributeTypeType][vType] = v;
        d.fields[index][attributeTypeType]['formatObject'] = { type: v, pattern: 'General' };
        v === 'Text' ? this.setState({ formatTypeVisible: false }) : this.setState({ formatTypeVisible: true });
        return;
      }
      d.fields[index][attributeTypeType][vType] = v;
    } else {
      if (groupKey == 'rowGroups') {
        d.fields[index].rowGroupsAttributeMap[vType] = v;
      } else if (groupKey === 'colGroups') {
        d.fields[index].colGroupsAttributeMap[vType] = v;
      } else if (groupKey === 'orders') {
        d.fields[index].ordersAttribute[vType] = v;
      }
    }
  }
  onSearch = (e) => {

    this.setState({ searchV: e.target.value })
  }
  render() {
    const { titleTabs, data, selectKey, actionModelVisible, formatTypeVisible, sortVisible, referenceVisible, searchV,linkageList, defaultVisible } = this.state;
    let template = null;
    switch (selectKey) {
      case 'columns':
        template = <Columns
          data={data.fields}
          clickSwitchTab={this.clickSwitchTab}
          eventsDisposeList={this.eventsDisposeList}
          actionVisible={actionModelVisible}
          onCancel={() => { this.eventsDisposeList('fields', 'columnAttributeMap', 'actionModelVisible') }}
          fields={this.props.fields}
          formatTypeVisible={formatTypeVisible}
          onSearch={this.onSearch}
          searchV={searchV}
          renderTreeNodes={this.renderTreeNodes}
        />;
        break;
      case 'conditions':
        template = <Conditions
          data={data.fields}
          clickSwitchTab={this.clickSwitchTab}
          eventsDisposeList={this.eventsDisposeList}
          referenceVisible={referenceVisible}
          defaultVisible={defaultVisible}
          tableList={this.props.tableList}
          onSearch={this.onSearch}
          searchV={searchV}
        />;
        break;
      case 'rowGroups':
        template = <GroupItem
          data={data.fields.filter(item => item.fieldType == 'dimension')}
          clickSwitchTab={this.clickSwitchTab}
          groupAttribute={'rowGroupsAttributeMap'}
          eventsDisposeList={this.eventsDisposeList}
          sortVisible={sortVisible}
          fields={data.fields}
          type={'rowGroups'}
          onSearch={this.onSearch}
          searchV={searchV}
        />;
        break;
      case 'colGroups':
        template = <GroupItem
          data={data.fields.filter(item => item.fieldType == 'dimension')}
          clickSwitchTab={this.clickSwitchTab}
          groupAttribute={'colGroupsAttributeMap'}
          eventsDisposeList={this.eventsDisposeList}
          sortVisible={sortVisible}
          fields={data.fields}
          onSearch={this.onSearch}
          searchV={searchV}
        />;
        break;
      case 'orders':
        template = <Orders
            data={data.fields.filter(item => item.fieldType === 'dimension')}
            clickSwitchTab={this.clickSwitchTab}
            groupAttribute={'ordersAttribute'}
            eventsDisposeList={this.eventsDisposeList}
            sortVisible={sortVisible}
            fields={data.fields}
            onSearch={this.onSearch}
            searchV={searchV}
        />;
        break;
      case 'linkage':
        template = <Linkage
            eventsDisposeList={this.eventsDisposeList}
            actionVisible={actionModelVisible}
            onCancel={() => { this.eventsDisposeList('fields', 'LinkageAttributeMap', 'actionModelVisible') }}
            linkageList={linkageList}
            data={data.fields}
        />;
        break;
      default: break;
    }
    return (
      <Modal
        title={'表格查询方案设计器'}
        visible={this.props.visible}
        maskClosable={false} //点击蒙层不允许关闭
        width={(document.documentElement.clientWidth || document.body.clientWidth) * 0.6 + 'px'}
        okText="确认"
        onOk={this.onOk}
        cancelText="取消"
        onCancel={this.props.onCancel}
        wrapClassName="bi"
        bodyStyle={{ height: `${(document.documentElement.clientHeight || document.body.clientHeight) * 0.7}px`, }}
      >
        <div id='queryPlan'>
          <Tabs activeKey={titleTabs.find(item => item.id === selectKey).id} animated={false} onChange={this.tabsChange}>
            {
              titleTabs.map(item =>
                (<TabPane tab={item.name} key={item.id}>
                  {template}
                </TabPane>))
            }
          </Tabs>,
                </div>
      </Modal>
    );
  }
}
export default QueryPlanModal;
