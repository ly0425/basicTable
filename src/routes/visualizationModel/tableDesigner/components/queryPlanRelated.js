
import { Row, Col, Radio, Input, Button, Select, Checkbox,List,Popconfirm } from '@vadp/ui';
import ColorPicker from 'components/Print/ColorPicker';
import ActionModal, {handleModelType} from 'public/ActionModal';
import FormatType from './table/FormatType';
import DynamicTableSortModal from './DynamicTableSortModal';
import ReferenceModal from './ReferenceModal';
import DefaultModal from './DefaultValueModal';
import OperationTypeFn from 'components/Public/ConditionComponent/Operations';
import _ from 'lodash'
const Option = Select.Option;
const RadioGroup = Radio.Group;
const radioOption = [{ label: '是', value: true }, { label: '否', value: false }];
const GroupBoxStyle = {
  marginTop: '0px',
  height: 'calc(100% - 100px)',
  paddingTop: '0px'
}
const rowstyle = {
  display: 'flex',
  alignItems: 'center',
};
const colLeftstyle = {
  textAlign: 'right',
}
const overflow = {
  overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'
}
// 分组框
const GroupBox = (props) => (

  <fieldset className={props.className}>
    <legend align='center'>
      <span>{props.title}</span>

    </legend>
    <div style={{ padding: '0px 8px' }}>搜索:
        <Input onChange={props.onSearch} /></div>
    <div className='groupBoxContent' style={GroupBoxStyle}>
      {props.children}
    </div>
  </fieldset>
);
function searchVData(data = [], searchV) {
  if (!searchV) return data;
  return data.filter(item => item.comments.indexOf(searchV) != -1);
}
function Columns(props) {
  const { data, clickSwitchTab, eventsDisposeList, actionVisible, onCancel, fields, formatTypeVisible, onSearch, searchV } = props;
  let current = data.find(item => item.columnAttributeMap && item.columnAttributeMap.isChecked);
  let attributeMap = current.columnAttributeMap;
  let newData = searchVData(data, searchV);
  let contentSourceStyle = 'Text';
  if (current.dataType === 'date') {
    contentSourceStyle = 'Date';
  } else if (current === 'number') {
    contentSourceStyle = 'Number';
  }
  return (<div className='expressionEditor' style={{ height: 'calc(100% - 60px)' }}>
      <Row gutter={16}>
          <Col span={6}>
            <GroupBox title='栏目' className='queryPlanItem' onSearch={onSearch}>
              <div>
                <List
                  bordered
                  size="small"
                  dataSource={newData}
                  renderItem={item => (
                    <List.Item style={overflow}>
                      <span
                        title={item.comments}
                        onClick={() => { clickSwitchTab('fields', 'columnAttributeMap', item.aliasName || item.fieldName) }}
                        className={`item ${item.columnAttributeMap && item.columnAttributeMap.isChecked ? 'active' : ''}`}
                        key={item.aliasName || item.fieldName}> {item.comments}</span>
                    </List.Item>
                  )}
                />
              </div>
            </GroupBox>
          </Col>
          <Col span={18}>
              <div className='rightContent'>
                  <Row style={rowstyle} gutter={16}>
                      <Col span={6} style={colLeftstyle}>显示名称：</Col>
                      <Col span={6}>
                          <Input
                              value={attributeMap.title || current.comments}
                              onChange={(e) => { eventsDisposeList('fields', 'columnAttributeMap', 'title', e.target.value) }}
                          />
                       </Col>
                      <Col span={6} style={colLeftstyle}>表达式：</Col>
                      <Col span={6}>
                          <Input
                              value={attributeMap.expression}
                              onChange={(e) => { eventsDisposeList('fields', 'columnAttributeMap', 'expression', e.target.value) }}
                          />
                      </Col>
                  </Row>
                  <Row style={rowstyle} gutter={16}>
                      <Col span={6} style={colLeftstyle}>默认宽度：</Col>
                      <Col span={6}>
                          <Input
                              value={attributeMap.defaultWidth}
                              onChange={(e) => { eventsDisposeList('fields', 'columnAttributeMap', 'defaultWidth', e.target.value) }}
                          />
                      </Col>
                      <Col span={6} style={colLeftstyle}>对齐方式：</Col>
                      <Col span={6} style={colLeftstyle}>
                          <Select
                              value={attributeMap.horizontalAlignment}
                              onChange={(v) => { eventsDisposeList('fields', 'columnAttributeMap', 'horizontalAlignment', v) }}
                              style={{width:'100%'}}
                          >
                              <Option value="Left">居左</Option>
                              <Option value="Right">居右</Option>
                              <Option value="Center">居中</Option>
                        </Select>
                      </Col>
                  </Row>
                  <Row style={rowstyle} gutter={16}>
                      <Col span={6} style={colLeftstyle}>是否待选：</Col>
                      <Col span={6}>
                          <Checkbox
                              checked={attributeMap.isOptional === undefined ? true : attributeMap.isOptional}
                              onChange={(e) => { eventsDisposeList('fields', 'columnAttributeMap', 'isOptional', e.target.checked) }}>
                          </Checkbox>
                      </Col>
                      <Col span={6} style={colLeftstyle}>是否固定：</Col>
                      <Col span={6}>
                          <Checkbox
                              checked={attributeMap.isFixed}
                              onChange={(e) => { eventsDisposeList('fields', 'columnAttributeMap', 'isFixed', e.target.checked) }}
                              value={attributeMap.isFixed} />
                      </Col>
                  </Row>
                  <Row style={rowstyle} gutter={16}>
                      <Col span={6} style={colLeftstyle}>数据格式：</Col>
                      <Col span={6}>
                          <Select
                              value={attributeMap.contentSourceStyle || contentSourceStyle}
                              onChange={(v) => { eventsDisposeList('fields', 'columnAttributeMap', 'contentSourceStyle', v) }}
                          >
                              <Option value="Text">文本</Option>
                              <Option value="Date">日期</Option>
                              <Option value="Number">数字</Option>
                          </Select>
                      </Col>
                      <Col span={6} style={colLeftstyle}>是否界面显示：</Col>
                      <Col span={6}>
                          <Checkbox
                              checked={attributeMap.isShow==undefined?true:attributeMap.isShow}
                              onChange={(e) => { eventsDisposeList('fields', 'columnAttributeMap', 'isShow', e.target.checked) }}
                              value={attributeMap.isShow==undefined?true:attributeMap.isShow}/>
                      </Col>
                  </Row>
                  <Row style={rowstyle} gutter={16}>
                      <Col span={6} style={colLeftstyle}>前景色：</Col>
                      <Col span={6}>
                          <ColorPicker
                              onChangeComplete={(v) => { eventsDisposeList('fields', 'columnAttributeMap', 'foreground', v) }}
                              style={{ marginLeft: '10px', width: '93px' }}
                              color={attributeMap.foreground} />
                      </Col>
                      <Col span={6} style={colLeftstyle}>是否聚合：</Col>
                      <Col span={6}>
                          <Checkbox
                              checked={attributeMap.isAggregation}
                              onChange={(e) => { eventsDisposeList('fields', 'columnAttributeMap', 'isAggregation', e.target.checked) }}
                              value={attributeMap.isAggregation} />
                      </Col>
                  </Row>
                  <Row style={rowstyle} gutter={16}>
                      <Col span={6} style={colLeftstyle}>背景色：</Col>
                      <Col span={6}>
                          <ColorPicker
                              onChangeComplete={(v) => { eventsDisposeList('fields', 'columnAttributeMap', 'background', v) }}
                              style={{ marginLeft: '10px', width: '93px' }}
                              color={attributeMap.background}/>
                      </Col>
                      <Col span={6} style={colLeftstyle}>动作设置：</Col>
                      <Col span={6}>
                          <Button onClick={(v) => { eventsDisposeList('fields', 'columnAttributeMap', 'actionModelVisible') }}>设置</Button>
                      </Col>
                  </Row>
              </div>
          </Col>
    </Row>
    {actionVisible && <ActionModal
      onCancel={onCancel}
      visible={actionVisible}
      onOk={(data) => {
        eventsDisposeList('fields', 'columnAttributeMap', 'actionModelVisible');
        eventsDisposeList('fields', 'columnAttributeMap', 'actionData', data);
      }}
      actionData={attributeMap.actionData || {}}
      // fields={fields}
      isShowDimension={false}
      valueOption={fields}
    />}
    {
      formatTypeVisible && (<FormatType
        onCancel={() => { eventsDisposeList('fields', 'columnAttributeMap', 'formatTypeVisible'); }}
        onOk={(data) => {
          eventsDisposeList('fields', 'columnAttributeMap', 'formatTypeVisible');
          eventsDisposeList('fields', 'columnAttributeMap', 'formatObject', data);
        }}
        visible={formatTypeVisible}
        contentSourceStyle={attributeMap.contentSourceStyle || {}}
        formatObject={attributeMap.formatObject || {}}
      />)
    }
  </div>)
}
function Conditions(props) {
  const { data, clickSwitchTab, eventsDisposeList, referenceVisible, tableList, onSearch, searchV, defaultVisible } = props;
  let currentData = data.find(item => item.conditionAttributeMap && item.conditionAttributeMap.isChecked);
  const attributeMap = currentData.conditionAttributeMap;
  let Operation = OperationTypeFn(currentData);
  //ZHCW-12567
    if (currentData.conditionAttributeMap.referenceInfo && currentData.conditionAttributeMap.referenceInfo.type === 'externalReference') {
        Operation.range_all = "区间于";
    }
    // 日期操作符增加一个相对日期特殊处理
    if (currentData.conditionAttributeMap.dataType === 'date') {
        Operation.relative = "相对日期";
    }
    console.log(attributeMap)
  let newData = searchVData(data, searchV);
  return (<div className='expressionEditor' style={{ height: 'calc(100% - 60px)' }}>
    <Row gutter={16}>
      <Col span={6}>
        <GroupBox title='字段' className='queryPlanItem' onSearch={onSearch}>
          <div>
            <List
              bordered
              size="small"
              dataSource={newData}
              renderItem={item => (
                <List.Item style={overflow}>
                  <span
                    title={item.comments}
                    onClick={() => { clickSwitchTab('fields', 'conditionAttributeMap', item.aliasName || item.fieldName) }}
                    className={`item ${item.conditionAttributeMap && item.conditionAttributeMap.isChecked ? 'active' : ''}`}
                    key={item.aliasName || item.fieldName}> {item.comments}</span>
                </List.Item>
              )}
            />
          </div>
        </GroupBox>
      </Col>
      <Col span={18}>
        <div className='rightContent'>
            <Row style={rowstyle} gutter={16}>
                <Col span={6} style={colLeftstyle}>
                    显示名称：
                </Col>
                <Col span={6}>
                    <Input
                        value={attributeMap.title || currentData.comments}
                        onChange={(e) => { eventsDisposeList('fields', 'conditionAttributeMap', 'title', e.target.value) }}
                    />
                </Col>
                <Col span={6} style={colLeftstyle}>
                    是否是基本条件：
                </Col>
                <Col span={6}>
                    <Checkbox
                        checked={attributeMap.isBasic}
                        onChange={(e) => { eventsDisposeList('fields', 'conditionAttributeMap', 'isBasic', e.target.checked) }}
                    >
                    </Checkbox>
                </Col>
            </Row>
            <Row style={rowstyle} gutter={16}>
                <Col span={6} style={colLeftstyle}>
                    是否固定：
                </Col>
                <Col span={6}>
                    <Checkbox
                        checked={attributeMap.isFixed}
                        onChange={(e) => { eventsDisposeList('fields', 'conditionAttributeMap', 'isFixed', e.target.checked) }}>
                    </Checkbox>
                </Col>
                <Col span={6} style={colLeftstyle}>
                    是否可编辑：
                </Col>
                <Col span={6}>
                    <Checkbox
                        checked={attributeMap.isEdit === undefined ? true : attributeMap.isEdit}
                        onChange={(e) => { eventsDisposeList('fields', 'conditionAttributeMap', 'isEdit', e.target.checked) }}
                    >
                    </Checkbox>
                </Col>
            </Row>
            <Row style={rowstyle} gutter={16}>
                <Col span={6} style={colLeftstyle}>
                    是否允许空：
                </Col>
                <Col span={6}>
                    <Checkbox
                        checked={attributeMap.isAllowBlank === undefined ? true : attributeMap.isAllowBlank}
                        onChange={(e) => { eventsDisposeList('fields', 'conditionAttributeMap', 'isAllowBlank', e.target.checked) }}>
                    </Checkbox>
                </Col>
                <Col span={6} style={colLeftstyle}>
                    是否待选：
                </Col>
                <Col span={6}>
                    <Checkbox
                        checked={attributeMap.isOptional === undefined ? true : attributeMap.isOptional}
                        onChange={(e) => { eventsDisposeList('fields', 'conditionAttributeMap', 'isOptional', e.target.checked) }}>
                    </Checkbox>
                </Col>
            </Row>
            <Row style={rowstyle} gutter={16}>
                <Col span={6} style={colLeftstyle}>
                    是否默认表头项：
                </Col>
                <Col span={6}>
                    <Checkbox
                        checked={attributeMap.commonUse}
                        onChange={(e) => { eventsDisposeList('fields', 'conditionAttributeMap', 'commonUse', e.target.checked) }}
                    >
                    </Checkbox>
                </Col>
                <Col span={6} style={colLeftstyle}>
                    值改变是否触发事件：
                </Col>
                <Col span={6}>
                    <Checkbox
                        checked={attributeMap.isTriggerEvent}
                        onChange={(e) => { eventsDisposeList('fields', 'conditionAttributeMap', 'isTriggerEvent', e.target.checked) }}>
                    </Checkbox>
                </Col>
            </Row>
            <Row style={rowstyle} gutter={16}>
                <Col span={6} style={colLeftstyle}>
                    参照设置：
                </Col>
                <Col span={6}>
                    <Button onClick={() => { eventsDisposeList('fields', 'conditionAttributeMap', 'referenceVisible') }}>设置</Button>
                </Col>
                <Col span={6} style={colLeftstyle}>
               是否树形：
                    </Col>
                <Col span={6}>
                <Checkbox
                    checked={attributeMap.isTree}
                    onChange={(e) => { eventsDisposeList('fields', 'conditionAttributeMap', 'isTree', e.target.checked) }}
                  >
                  </Checkbox>
                </Col>
            </Row>
            <Row style={rowstyle} gutter={16}>
                <Col span={6} style={colLeftstyle}>
                    默认值：
                </Col>
                <Col span={6} style={{marginTop: 8}}>
                    <Button onClick={() => { eventsDisposeList('fields', 'conditionAttributeMap', 'defaultVisible') }}>添加</Button>
                </Col>
                <Col span={6} style={colLeftstyle}>
                    运算符：
                </Col>
                <Col span={6}>
                    <Select
                        mode="multiple"
                        value={attributeMap.operators ? attributeMap.operators.map(item => item.code) : []}
                        style={{width:'100%'}}
                        onChange={(v) => {
                            v = v.map(item => {
                                return { code: item, name: Operation[item] }
                                // OperationTypeFn(item) Operation
                            })
                            eventsDisposeList('fields', 'conditionAttributeMap', 'operators', v)
                        }}
                    >
                        {
                            Object.getOwnPropertyNames(Operation).map(item => (<Option value={item}>{Operation[item]}</Option>))
                        }
                    </Select>
                </Col>
            </Row>
        </div>
      </Col>
    </Row>
    {
      referenceVisible && <ReferenceModal
        onCancel={() => { eventsDisposeList('fields', 'conditionAttributeMap', 'referenceVisible') }}
        visible={referenceVisible}
        referenceInfo={attributeMap.referenceInfo || {}}
        tableList={tableList}
        onOk={(data = {}) => {
          eventsDisposeList('fields', 'conditionAttributeMap', 'referenceVisible')

          eventsDisposeList('fields', 'conditionAttributeMap', 'referenceInfo', data)
        }}
      />
    }
      {
          defaultVisible && <DefaultModal
              onCancel={() => { eventsDisposeList('fields', 'conditionAttributeMap', 'defaultVisible') }}
              visible={defaultVisible}
              tableList={tableList}
              defaultValue={attributeMap.defaultValue || []}
              onOk={(data = {}) => {
                  eventsDisposeList('fields', 'conditionAttributeMap', 'defaultVisible')

                  eventsDisposeList('fields', 'conditionAttributeMap', 'defaultValue', data)
              }}
          />
      }
  </div>)
}
function GroupItem(props) {
  const { data, groupAttribute, clickSwitchTab, eventsDisposeList, sortVisible, fields, type, onSearch, searchV } = props;

  let current = data.find(item => item[groupAttribute] && item[groupAttribute].isChecked);
  let attributeMap = current[groupAttribute];
  let newData = searchVData(data, searchV);
  return (<div className='expressionEditor' style={{ height: 'calc(100% - 60px)' }}>
    <Row gutter={16}>
      <Col span={6}>
        <GroupBox title='维度' className='queryPlanItem' onSearch={onSearch}>
          <div>
            <List
              bordered
              size="small"
              dataSource={newData}
              renderItem={item => (
                <List.Item style={overflow}>
                  <span
                    title={item.comments}
                    onClick={() => { clickSwitchTab('fields', groupAttribute, item.aliasName || item.fieldName) }}
                    className={`item ${item[groupAttribute] && item[groupAttribute].isChecked ? 'active' : ''}`}
                    key={item.aliasName || item.fieldName}> {item.comments}</span>
                </List.Item>
              )}
            />
          </div>
        </GroupBox>
      </Col>
      <Col span={18}>
        <div className='rightContent'>
          {
            type === 'rowGroups' && (
              <Row style={rowstyle} gutter={16}>
                 <Col span={6} style={colLeftstyle}>
                 是否界面显示：
                  </Col>
                  <Col span={6}>
                  <RadioGroup
                    onChange={(e) => { eventsDisposeList('fields', groupAttribute, 'isShow', e.target.value) }}
                    options={radioOption} value={attributeMap.isShow==undefined?true:attributeMap.isShow} />
                  </Col>
                  <Col span={12} />
                </Row>
            )
          }
            <Row style={rowstyle} gutter={16}>
                <Col span={6} style={colLeftstyle}>
                    显示名称：
                </Col>
                <Col span={6}>
                    <Input
                        value={attributeMap.title || current.comments}
                        onChange={(e) => { eventsDisposeList('fields', groupAttribute, 'title', e.target.value) }}
                    />
                </Col>
                <Col span={6} style={colLeftstyle}>
                    表达式：
                </Col>
                <Col span={6}>
                    <Input
                        value={attributeMap.groupExpression}
                        onChange={(e) => { eventsDisposeList('fields', groupAttribute, 'groupExpression', e.target.value) }}
                    />
                </Col>
            </Row>

          <Row style={rowstyle} gutter={16}>
              <Col span={6} style={colLeftstyle}>
              排序设置：
              </Col>
              <Col span={6}>
                <Button onClick={(v) => { eventsDisposeList('fields', groupAttribute, 'sortVisible') }}>设置</Button>
              </Col>
              <Col span={6} style={colLeftstyle}>
              对齐方式：
                </Col>
                <Col span={6} style={colLeftstyle}>
                <Select
                  value={attributeMap.horizontalAlignment}
                  onChange={(v) => { eventsDisposeList('fields', groupAttribute, 'horizontalAlignment', v) }}
                  style={{width:'100%'}}
                >
                    <Option value="Left">居左</Option>
                    <Option value="Right">居右</Option>
                    <Option value="Center">居中</Option>
                </Select>
                </Col>
          </Row>
            <Row style={rowstyle} gutter={16}>
                <Col span={6} style={colLeftstyle}>
                    分组行背景色：
                </Col>
                <Col span={6}>
                    <ColorPicker
                        onChangeComplete={(v) => { eventsDisposeList('fields', groupAttribute, 'background', v) }}
                        style={{ marginLeft: '10px', width: '93px' }}
                        color={attributeMap.background}
                    />
                </Col>
                <Col span={6} style={colLeftstyle}>
                    是否待选：
                </Col>
                <Col span={6}>
                    <Checkbox
                        checked={attributeMap.isOptional === undefined ? true : attributeMap.isOptional}
                        onChange={(e) => { eventsDisposeList('fields', groupAttribute, 'isOptional', e.target.checked) }}
                    >
                    </Checkbox>
                </Col>
            </Row>
        </div>
      </Col>
    </Row>
    {
      sortVisible && <DynamicTableSortModal
        sortVisible={sortVisible}
        setSortVisible={() => {
          eventsDisposeList('fields', groupAttribute, 'sortVisible')
        }}
        actionFileds={fields}
        sort={attributeMap.Order || []}
        sortOk={(list) => {
          eventsDisposeList('fields', groupAttribute, 'sortVisible')
          eventsDisposeList('fields', groupAttribute, 'Order', list)
        }}
      />
    }
  </div>)
}
function Orders(props) {
    const { data, groupAttribute,clickSwitchTab, eventsDisposeList, sortVisible, fields, type, onSearch, searchV } = props;

    let current = data.find(item => item[groupAttribute] && item[groupAttribute].isChecked);
    let attributeMap = current[groupAttribute];
    let newData = searchVData(data, searchV);
    return (<div className='expressionEditor' style={{ height: 'calc(100% - 60px)' }}>
        <Row gutter={16}>
            <Col span={6}>
                <GroupBox title='维度' className='queryPlanItem' onSearch={onSearch}>
                    <div>
                        <List
                            bordered
                            size="small"
                            dataSource={newData}
                            renderItem={item => (
                                <List.Item style={overflow}>
                  <span
                      title={item.comments}
                      onClick={() => { clickSwitchTab('fields', groupAttribute, item.aliasName || item.fieldName) }}
                      className={`item ${item[groupAttribute] && item[groupAttribute].isChecked ? 'active' : ''}`}
                      key={item.aliasName || item.fieldName}> {item.comments}</span>
                                </List.Item>
                            )}
                        />
                    </div>
                </GroupBox>
            </Col>
            <Col span={18}>
                <div className='rightContent'>
                    <Row style={rowstyle} gutter={16}>
                        <Col span={4} style={colLeftstyle}>
                            显示名称：
                        </Col>
                        <Col span={4}>
                            <Input
                                value={attributeMap.title || current.comments}
                                onChange={(e) => { eventsDisposeList('fields', groupAttribute, 'title', e.target.value) }}
                            />
                        </Col>
                        <Col span={4} style={colLeftstyle}>
                            是否待选：
                        </Col>
                        <Col span={4}>
                            <Checkbox
                                checked={attributeMap.isOptional}
                                onChange={(e) => { eventsDisposeList('fields', groupAttribute, 'isOptional', e.target.checked) }}
                            >
                            </Checkbox>
                        </Col>
                        <Col span={4} style={colLeftstyle}>
                            是否固定：
                        </Col>
                        <Col span={4}>
                            <Checkbox
                                checked={attributeMap.isFixed}
                                onChange={(e) => { eventsDisposeList('fields', groupAttribute, 'isFixed', e.target.checked) }}
                                value={attributeMap.isFixed}
                            />
                        </Col>
                    </Row>
                </div>
            </Col>
        </Row>
        {
            sortVisible && <DynamicTableSortModal
                sortVisible={sortVisible}
                setSortVisible={() => {
                    eventsDisposeList('fields', groupAttribute, 'sortVisible')
                }}
                actionFileds={fields}
                sort={attributeMap.Order || []}
                sortOk={(list) => {
                    eventsDisposeList('fields', groupAttribute, 'sortVisible')
                    eventsDisposeList('fields', groupAttribute, 'Order', list)
                }}
            />
        }
    </div>)
}
let newActionI = null
function Linkage(props) {
    const {  eventsDisposeList,actionVisible, onCancel, linkageList,data } = props;

    return (<div className='expressionEditor' style={{ height: 'calc(100% - 60px)' }}>
        <div style={{textAlign:'right',marginBottom: 20}}>
            <Button
                type="primary"
                onClick={(v) => {
                    newActionI=null;
                    eventsDisposeList('fields', 'LinkageAttributeMap', 'actionModelVisible') }}>添加</Button>
        </div>
        <List
            bordered
            dataSource={linkageList}
            renderItem={(item,i) =>
                <List.Item
                    actions={[<a onClick={(v) => {
                        newActionI=i
                        eventsDisposeList('fields', 'LinkageAttributeMap', 'actionModelVisible') }}>编辑</a>,
                        <Popconfirm
                            title="确认删除吗？"
                            okText="确定"
                            cancelText="取消"
                            onConfirm={() => { eventsDisposeList('Linkage', 'LinkageAttributeMap', 'isDelete',item) }}
                        >
                            <a>删除</a>
                        </Popconfirm>]}
                >
                    {item.actionName}
                </List.Item>}
        />

        {actionVisible && <ActionModal
            onCancel={onCancel}
            visible={actionVisible}
            onOk={(data) => {
                eventsDisposeList('fields', 'LinkageAttributeMap', 'actionModelVisible');


                if(newActionI===null){
                    eventsDisposeList('Linkage', 'LinkageAttributeMap', 'actionData', data);
                }else{
                    eventsDisposeList('Linkage', 'LinkageAttributeMap', 'actionData', data,newActionI);
                }
            }}
            actionData={_.cloneDeep(linkageList[newActionI]||{})}
            // fields={fields}
            isShowDimension={false}
            valueOption={data}
        />}
    </div>)
}


const actionArray = (data) => {
    console.log(data, "data")
    let index = 0;



    const rootId = data[index].id;
    let nodeMap = new Map();
    // 将数组项放入Map
    data.forEach((row) => {
        nodeMap.set(row.id, {
            label: iconType(row.type, row.name),
            value: row.type ? `${row.id}.${row.type}` : row.id,
            item: row,
            type: row.type,
        });
    });
    // 根据id和parent_id将数组项放入父节点的children数组中。
    data.forEach((row) => {
        if (nodeMap.has(row.parent_id)) {
            if (!nodeMap.get(row.parent_id).children) {
                nodeMap.get(row.parent_id).children = [];
            }
            handleModelType(nodeMap.get(row.parent_id).children, nodeMap.get(row.id));
        }
    });
    // 不要根节点，所以返回根节点的children。
    return nodeMap.get(rootId).children;
};

export {
  Columns,
  Conditions,
  GroupItem,
  Orders,
  Linkage,
}
