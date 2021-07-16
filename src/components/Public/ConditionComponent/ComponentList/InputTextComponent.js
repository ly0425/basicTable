import React, {Component, PureComponent} from 'react';
import {publicComponentBox, createInputTextCondition, lastArray,} from '../ConditionsModalCore';
import NetUtil from '@/containers/HttpUtil';
import Message from '../../Message';
import debounce from 'lodash/debounce';
import {stringify} from 'qs';
import {message} from "antd";
const compatibilityAnalysisOldFn = (value, tableName) => {
    if (value) {
        if (value.indexOf(tableName) > -1) {
            value = value.replace(tableName + '_', '');
        }
    }
    return value
};

class InputTextComponent extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
            value: [],
            fetching: false,
            mode: ['month', 'month'],
            asc: true,
            multipleValue: [],
        };
        this.fetchUserInit=this.fetchUser;
        this.fetchUser = debounce(this.fetchUser, 500);
        this.handleChangemultiple = this.handleChangemultiple.bind(this);
        this.handleChangerefSelect = this.handleChangerefSelect.bind(this);
        this.handleChangeExternalRefSelect = this.handleChangeExternalRefSelect.bind(this);
        this.handlePanelChange = this.handlePanelChange.bind(this);// 月份日期特殊的传只方式
        this.ReferenceInfoRef = this.ReferenceInfoRef.bind(this);
        this.LevelSettingCascaderLoadData = this.LevelSettingCascaderLoadData.bind(this);
        this.CascaderonChange = this.CascaderonChange.bind(this);
        this.CascaderonChangeRange = this.CascaderonChangeRange.bind(this);
    }

    // -----改变日期控件的时间-----－
    check = (value, type = false) => {
        this.props.onChange && this.props.onChange(value, this.props.index, type);
    };
    handlePanelChange = (value) => {
        const _value = [value[0].format('YYYY-MM'), value[1].format('YYYY-MM')];
        this.check(_value);
    };
    handleChangemultiple = (value, type) => {
        if (value && value[0] && value[0].label && value[0].label !== '暂无数据') {
            value.map(item => {
                if (item.label && item.label.props) {
                    if (item.label.props.title) {
                        item["linkField"] = item.label.props.linkField; //添加的linkfield
                        item.label = item.label.props.title;
                    }
                } else if (item.label) {
                    item["linkField"] = item.label; //添加的linkfield 兼容
                    item.label = item.label
                    item.key = item.label
                }
            });
            let text = value,
                changeObj = {};
            if (type == 'tags') {
                changeObj = {
                    fetching: false,
                };
            } else {
                text = lastArray(value);
                changeObj = {
                    fetching: false,
                    data: [],
                };
            }
            this.check(text, true);
            this.setState(changeObj);
        }
    };
    // 组件onchange方法处理值变动时缺少判断 clear 的情况
    handleChangeExternalRefSelect=(value,type, record)=>{
        if (value && value.label !== '暂无数据') {
            if (value.length > 0) {
                value.forEach(item => {
                    if (item.label && item.label.props) {
                        if (item.label.props.title) {
                            item.label = item.label.props.title;
                        }else if(item.label.props.children){
                            item.label = item.label.props.children;
                        }
                    } else if (item.label) {
                        item.label = item.label;
                        item.key = item.label
                    }
                });
                let text = value,
                    changeObj = {};
                if (type === 'multiple') {
                    changeObj = {
                        fetching: false,
                    };
                }
                // else {
                //     text = lastArray(value);
                //     changeObj = {
                //         fetching: false,
                //         data: [],
                //     };
                // }
                this.check(text, true);
                this.setState({
                    changeObj,
                    //multipleValue: value //ZHCW-12861
                });
                // this.state.aliasName = value.map(item => item.label).toString();
                if(value.length){
                    let displayName =value.map(item=>`${item.key}:${item.label}`).join('@')
                    record={...record,displayName}
                }
            }else if (type === 'multiple') { // 清除
                let changeObj = {
                    fetching: false,
                    data: [],
                };
                this.setState({
                    changeObj,
                    multipleValue: []
                });
                this.check(value, true);
                this.setState(changeObj);
            }else {
                if (value.label && value.label.props) {
                    if (value.label.props.title) {
                        value.linkField = value.label.props.linkField; // 添加的linkfield
                        value.label = value.label.props.title;
                    }
                } else if (value.label) {
                    value.linkField = value.label; // 添加的linkfield 兼容
                    value.label = value.label;
                    value.key = value.label;
                }
                const changeObj = {
                    fetching: false,
                    data: [],
                };
                this.check(value.key, true);
                this.setState(changeObj);
                this.state.displayName = value.label;
            }

        }
    }
    handleChangerefSelect = (value) => {
        if (value && value.label !== '暂无数据') {
            if (value.label && value.label.props) {
                if (value.label.props.title) {
                    value.linkField = value.label.props.linkField; // 添加的linkfield
                    value.label = value.label.props.title;
                }
            } else if (value.label) {
                value.linkField = value.label; // 添加的linkfield 兼容
                value.label = value.label;
                value.key = value.label;
            }
            const changeObj = {
                fetching: false,
                data: [],
            };
            this.check(value.key, true);
            this.setState(changeObj);
            this.state.aliasName = value.label;
        }
    };
    onDeselect = (value) => {
        this.props.onDeselect(value, this.props.index);
    };

    ReferenceInfoRef = (asc) => {
        if (this.state.asc != asc) {
            this.setState({asc});
        }
    };
    // －－－－－－添加搜索-----－－
    fetchUser = (value = '', item) => {
        this.lastFetchId += 1;
        this.setState({data: null});

        const url = 'reference/getAnalysisModelFieldVal';
        let {tableName, fieldName} = item;
        const params = {
            tableName: tableName,
            fieldName: fieldName,
            filterValue: value,
            asc: this.state.asc,
            analysisModelId: item.analysisModelId,
            linkField: item.linkageInfo && item.linkageInfo.source ? item.linkageInfo.source.filterField : '',
        };
        if (item.referenceInfo && item.referenceInfo.content) {
            let order = item.referenceInfo.content.order;
            let displayField = item.referenceInfo.content.displayField;
            let field = item.referenceInfo.content.field
            let conditions = JSON.stringify(item.referenceInfo.content.conditions); // 5/21日
            if (order) {
                order = compatibilityAnalysisOldFn(order, tableName)
            }
            if (displayField) {
                displayField = compatibilityAnalysisOldFn(displayField, tableName)
            }
            if (field) {
                field = compatibilityAnalysisOldFn(field, tableName)
            }
            params["displayField"] = displayField || field || order;
            params["orderField"] = order ? order : "";
            if (item.referenceInfo.dataSourcekey) {
                params["dataSourceKey"] = item.referenceInfo.dataSourcekey;
            }
            if (conditions) {
                params["conditions"] = conditions
            }
        }
        if (item.parentFields) {
            params.linkParam = JSON.stringify(this.props.parentFieldForTargetField(item.parentFields, item.fieldName));
        } else {
            params.linkParam = "[{'values':[],'fieldName':'none'}]";
        }
        const that = this;
        if (item.referenceInfo.type === "externalReference") {
            const content = item.referenceInfo.reference.parameters;
            const newContent = {};
            for (let i = 0; i < content.length; i++) {
                const item = content[i];
                newContent[item.key] = item.val;
            }
            let conditions = newContent.compCode ? (
                newContent.copyCode? (
                    newContent.acctYear ? [{values:[newContent.compCode],fieldName:'comp_code',operation:'='},{values:[newContent.copyCode],fieldName:'copy_code',operation:'='},{values:[newContent.acctYear],fieldName:'acct_year',operation:'='}] :
                        [{values:[newContent.compCode],fieldName:'comp_code',operation:'='},{values:[newContent.copyCode],fieldName:'copy_code',operation:'='}]
                ) : [{values:[newContent.compCode],fieldName:'comp_code',operation:'='}]
            )
            : [{fieldName:'comp_code',operation:'='}];
        if(newContent.conditions){
            conditions =[...conditions,...JSON.parse(newContent.conditions)]
        }
        conditions = JSON.stringify(conditions)
            const param = {
                dataSourceKey: localStorage.getItem('dataSourceId'),
                reportId: localStorage.getItem('moduleId'),
                type: item.referenceInfo.type,
                conditions,
                filterValue: value,
                ...newContent
            };
            const URL = `reference/getAnalysisModelFieldVal?${stringify(param)}`;
            NetUtil.get(URL, {}, (data) => {
                if (data.code == 200) {
                    const list = data.data && data.data.length ? data.data : [{name: '暂无数据', id: '100'}];
                    that.setState({fetching: false});
                    if (list.length) {
                        let ref = {};
                        //BI-1880  Oracle大写问题 BI-2199
                        let newlist=list.map((lis,lisIndex)=>{
                            if(lis.DISPLAYNAME){
                                return  {
                                    displayName:lis.DISPLAYNAME,
                                    id:lis.ID,
                                    linkField:lis.LINKFIELD
                                }
                            }else{
                                return lis;
                            }
                        });
                        newlist=newlist.filter((lis,lisIndex)=>{
                            if(lis.id)return lis;
                        })
                        if(!newlist.length)newlist=[{name: '暂无数据', id: '100'}];
                        ref[item.aliasName || item.fieldName] = newlist;
                        sessionStorage.setItem('ref', JSON.stringify(ref));
                        let newref = JSON.parse(localStorage.getItem('referValue') ||'{}')
                        newref[item.aliasName || item.fieldName] = newlist;
                        localStorage.setItem('referValue', JSON.stringify(newref));
                        this.setState({data: newlist})
                    }
                } else {
                    Message.error(data.msg);
                    that.setState({fetching: false});
                }
            });
            return;
            // 枚举型数据
        } else if (item.referenceInfo.type === "parameterEnum"){
            const reference = item.referenceInfo.parameterEnum.parameters;
            const list = reference && reference.length ? reference : [{name: '暂无数据', id: '100'}];
            list.map(item => {
                item.id = item.key;
                item.displayName = item.val;
            })
            that.setState({fetching: false});
            if (list.length) {
                let ref = {};
                //BI-1880  Oracle大写问题 BI-2199
                let newlist=list.map((lis,lisIndex)=>{
                    if(lis.DISPLAYNAME){
                        return  {
                            displayName:lis.DISPLAYNAME,
                            id:lis.ID,
                            linkField:lis.LINKFIELD
                        }
                    }else{
                        return lis;
                    }
                });
                newlist=newlist.filter((lis,lisIndex)=>{
                    if(lis.id)return lis;
                })
                if(!newlist.length)newlist=[{name: '暂无数据', id: '100'}];
                ref[item.aliasName || item.fieldName] = newlist;
                sessionStorage.setItem('ref', JSON.stringify(ref));
                let newref = JSON.parse(localStorage.getItem('referValue') ||'{}')
                newref[item.aliasName || item.fieldName] = newlist;
                localStorage.setItem('referValue', JSON.stringify(newref));
                this.setState({data: newlist})
            }
            return;
            // 自定义参照
        } else if (item.referenceInfo.type === "customReference"){
            const reference = item.referenceInfo;
            const {referValue} = this.state;
            const content = reference.reference ? reference.reference.parameters : '';
            content.forEach(item => {
                item.fieldId = item.key
                item.values = item.val.split(",")
                item.operation = '='
            })
            // let newArr = this.props.target.map((item,index) => {
            //     return Object.assign({},{
            //         fieldId:item.fieldId,
            //         title:item.title,
            //         operation:item. operation,
            //         values:item.value ? item.value.split(",") : item.values,
            //     })
            // })
            // const conditions = newArr.concat(content)
            const params = {
                // conditions: JSON.stringify(conditions)
                conditions: JSON.stringify(content)
            }
            const URL = `/AcctDimensionController/getAcctSubjs?${stringify(params)}`;
            NetUtil.get(URL, {}, (data) => {
                if (data.code == 200) {
                    const list = data.data && data.data.length ? data.data : [{name: '暂无数据', id: '100'}];
                    that.setState({fetching: false});
                    if (list.length) {
                        let ref = {};
                        //BI-1880  Oracle大写问题 BI-2199
                        let newlist=list.map((lis,lisIndex)=>{
                            if(lis.DISPLAYNAME){
                                return  {
                                    displayName:lis.DISPLAYNAME,
                                    id:lis.ID,
                                    linkField:lis.LINKFIELD
                                }
                            }else{
                                return lis;
                            }
                        });
                        newlist=newlist.filter((lis,lisIndex)=>{
                            if(lis.id)return lis;
                        })
                        if(!newlist.length)newlist=[{name: '暂无数据', id: '100'}];
                        ref[item.aliasName || item.fieldName] = newlist;
                        sessionStorage.setItem('ref', JSON.stringify(ref));
                        let newref = JSON.parse(localStorage.getItem('referValue') ||'{}')
                        newref[item.aliasName || item.fieldName] = newlist;
                        localStorage.setItem('referValue', JSON.stringify(newref));
                        this.setState({data: newlist})
                    }
                } else {
                    Message.error(data.msg);
                    that.setState({fetching: false});
                }
            },(data) => {
                Message.error(data.msg||'接口报错');
            },true);
            return;
        }
        NetUtil.get(url, params, (data) => {
            if (data.code == 200) {
                const list = data.data && data.data.length ? data.data : [{name: '暂无数据', id: '100'}];
                that.setState({fetching: false});
                if (list.length) {
                    let ref = {};
                    //BI-1880  Oracle大写问题 BI-2199
                    let newlist=list.map((lis,lisIndex)=>{
                            if(lis.DISPLAYNAME){
                                return  {
                                displayName:lis.DISPLAYNAME,
                                id:lis.ID,
                                linkField:lis.LINKFIELD
                                }
                            }else{
                               return lis;
                            }
                         });
                         newlist=newlist.filter((lis,lisIndex)=>{
                                    if(lis.id)return lis;
                            })
                    if(!newlist.length)newlist=[{name: '暂无数据', id: '100'}];
                    ref[item.aliasName || item.fieldName] = newlist;
                    sessionStorage.setItem('ref', JSON.stringify(ref));
                    this.setState({data: newlist})
                }
            } else {
                Message.error(data.msg);
                that.setState({fetching: false});
            }
        });
    };
    LevelSettingCascaderLoadData = (selectedOptions, init = 2, item) => {
        const len = this.state.data.length;

        const url = 'condition/getFieldValList';
        const params = Object.assign({}, {
            fieldName: item.fieldName,
            tableName: item.tableName,
            dataSourcekey: item.referenceInfo.dataSourcekey,
        }, item.referenceInfo.content);

        NetUtil.get(url, params, (data) => {
            if (data.code == 200) {
                let list = data.data || [];
                if(list.length)list.map((ll,llIndex)=>{
                        for(let key in ll){
                            if(key.toLowerCase() !=key){
                                list[llIndex][key.toLowerCase()]=ll[key];
                            }
                        }    
                })
                this.setState({
                    data: LevelCascaderData(list),

                    fetching: false,
                });
            } else {
                Message.error(data.msg);
            }
        });
    };
    CascaderonChange = (selectedOptions) => {
        const _value = selectedOptions.join('/');
        this.check(_value);
    };
    CascaderonChangeRange = (selectedOptions) => {
        let _value = "";
        //第一个框
        if (Array.isArray(selectedOptions[0])) {
            let val = selectedOptions[0].length > 1 ? selectedOptions[0].join('/') : selectedOptions[0][0];
            val = val && val.length ? val : '';

            _value = [val, selectedOptions[1]]
        }
        if (Array.isArray(selectedOptions[1])) {
            let val = selectedOptions[1].length > 1 ? selectedOptions[1].join('/') : selectedOptions[1][0];
            val = val && val.length ? val : '';
            _value = [selectedOptions[0], val]
        }
        this.check(_value);
    };

    componentWillMount() {
        const {referenceInfo} = this.props.item;
        if (referenceInfo && referenceInfo.type == 'treeref') {
            this.setState({fetching: true});
            this.LevelSettingCascaderLoadData('treeref', 1, this.props.item);
        }
        // if (referenceInfo && referenceInfo.type === 'ref') { //参照
        //     this.setState({fetching: true});
        //     this.fetchUserInit('',this.props.item);
        // }
    }

    render() {
        const {item, disabled, placeholder,width} = this.props;
        const {fetching, data, mode} = this.state;
        const that = this;
        if (this.state.multipleValue.length > 0) {
            item.displayName = null;
        }
        const obj = createInputTextCondition(item, disabled, fetching, data, that, mode, placeholder);
        if (this.state.multipleValue.length > 0) {
            obj.params.value = this.state.multipleValue
        }
        return (
            <div className="inputTextWrap refer-to" style={{"width":width}}>
                {publicComponentBox(obj.name, obj.params, obj.specialParameter)}

            </div>
        );
    }
}

// 级次处理方法  根节点“”，0，-1时候好使
const LevelCascaderData = (data,) => {
    let index = 0;
    let arr = []
    for (let i = 0; i < data.length; i++) {
        if (!data[i].parentid || data[i].parentid == "0" || data[i].parentid == "-1") {
            let obj = {
                label: data[i].name || '空',
                value: data[i].name || i,
                key: data[i].id
            }

            arr.push(obj)
        }
    }

    if (index === -1) {
        return [];
    }
    const nodeMap = new Map();
    // 将数组项放入Map
    data.forEach((row, i) => {
        if (row.id) {
            nodeMap.set(row.id, {
                label: row.name || '空',
                value: row.name || i,
                key: row.id || i,
            });
        }
    });
    // 根据id和parent_id将数组项放入父节点的children数组中。
    data.forEach((row) => {
        let parentid = row.parentid ? row.parentid.toString() : null
        if (nodeMap.has(parentid)) {
            if (!nodeMap.get(parentid).children) {
                nodeMap.get(parentid).children = [];
            }
            nodeMap.get(parentid).children.push(nodeMap.get(row.id));
        }
    });
    // 不要根节点，所以返回根节点的children。
    arr.map(item => {
        item['children'] = nodeMap.get(item.key).children
    });
    return arr || [];
};

export default InputTextComponent;
