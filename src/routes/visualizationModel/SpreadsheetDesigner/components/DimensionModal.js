import React, { Component } from 'react';
import { Modal, Select, Radio, Table, message, Input, Button, Popconfirm, Form } from '@vadp/ui';
import { budgetPost } from "~/routes/visualizationModel/SpreadsheetDesigner/BudgetApi";
import lodash from 'lodash';

const { Option } = Select;
let count = 1;

const EditableContext = React.createContext();

const EditableRow = ({ form, index, ...props }) => (
    <EditableContext.Provider value={form}>
        <tr {...props} />
    </EditableContext.Provider>
);

const EditableFormRow = Form.create()(EditableRow);

class EditableCell extends React.Component {
    state = {
        editing: false,
    };

    toggleEdit = () => {
        const editing = !this.state.editing;
        this.setState({ editing }, () => {
            if (editing) {
                this.input.focus();
            }
        });
    };

    save = e => {
        const { record, handleSave } = this.props;
        this.form.validateFields((error, values) => {
            if (error && error[e.currentTarget.id]) {
                return;
            }
            this.toggleEdit();
            handleSave({ ...record, ...values });
        });
    };

    renderCell = form => {
        this.form = form;
        const { children, dataIndex, record, title } = this.props;
        const { editing } = this.state;
        return editing ? (
            <Form.Item style={{ margin: 0 }}>
                {form.getFieldDecorator(dataIndex, {
                    rules: [
                        {
                            required: true,
                            message: `${title}不能为空！`,
                        },
                    ],
                    initialValue: record[dataIndex],
                })(<Input ref={node => (this.input = node)} onPressEnter={this.save} onBlur={this.save} />)}
            </Form.Item>
        ) : (
                <div
                    className="editable-cell-value-wrap"
                    style={{ paddingRight: 24 }}
                    onClick={this.toggleEdit}
                >
                    {children}
                </div>
            );
    };

    render() {
        const {
            editable,
            dataIndex,
            title,
            record,
            index,
            handleSave,
            children,
            ...restProps
        } = this.props;
        return (
            <td {...restProps}>
                {editable ? (
                    <EditableContext.Consumer>{this.renderCell}</EditableContext.Consumer>
                ) : (
                        children
                    )}
            </td>
        );
    }
}

export default class DimensionModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            type: undefined,
            selectData: [],
            selectValue: undefined,
            tableData: [],
            tableSelect: undefined,
            tableSelectKey: undefined,
            userDictData: [],
            userDictValue: undefined,
            userDictID: undefined,
            userDictTitle: undefined,
            userDefineID: undefined,
            userDefineTitle: undefined
        }
    }
    componentDidMount() {
        const { data } = this.props;
        if (data) {
            const type = data.type ? data.type : 'dim';
            this.typeChange({ target: { value: type } }, data);
        }
    }
    typeChange = (e, data) => {
        const type = e.target.value;
        if (type === 'dim' || type === 'dictionary') {
            budgetPost(
                'getDimOrDictComb',
                {
                    type,
                    templateId: this.props.templateId
                },
                'POST'
            ).then((res) => {
                const selectData = res.datas;
                this.setState({
                    type,
                    selectData,
                    selectValue: undefined,
                    tableData: [],
                    tableSelect: undefined,
                    tableSelectKey: undefined
                }, () => {
                    if (data) {
                        this.selectChange(data.dimID || data.id, null, data);
                    }
                });
            }).catch((err) => {
                message.warning('网络连接错误！')
            });
        }
        else if (type === 'userDic') {
            this.setState({
                type,
                userDictData: data ? data.userDic.values : [],
                userDictValue: undefined,
                userDictID: data ? data.id : undefined,
                userDictTitle: data ? data.title : undefined
            });
        }
        else {
            this.setState({
                type,
                userDefineID: data ? data.id : undefined,
                userDefineTitle: data ? data.title : undefined
            });
        }
    }
    selectChange = (value, props, data) => {
        let postData = {
            combId: value
        }
        let dictType = '';
        if (this.state.type === 'dictionary') {
            postData.dictType = dictType = props ? props.props.extra : data.dictionary.dictType;
        }
        budgetPost(
            'getDimOrDictColumn',
            postData,
            'POST'
        ).then((res) => {
            const tableData = res.datas;
            let tableSelectKey = undefined;
            let tableSelect = undefined;
            if (data) {
                tableSelect = [tableData.find(item => item.column_name === (data.fieldName || data.dictionary.nameField))];
                tableSelectKey = tableData.findIndex(item => item.column_name === (data.fieldName || data.dictionary.nameField));
            }
            this.setState({
                tableData,
                selectValue: value,
                tableSelect,
                tableSelectKey: [tableSelectKey],
                dictType
            });
        }).catch((err) => {
            message.warning(err)
        })
    }
    modalSave = (flag) => {
        let data = undefined;
        if (flag) {
            if (this.state.selectValue === undefined && this.state.tableSelect === undefined && (this.state.userDictData.length === 0 || this.state.userDictID === undefined) && this.state.userDefineID === undefined) {
                message.warning('未选择或未定义属性！');
                return;
            }
            if (this.state.type === 'dim') {
                data = {
                    dimID: this.state.selectValue,
                    fieldName: this.state.tableSelect[0].column_name,
                    displayName: this.state.tableSelect[0].column_description
                };
            }
            else if (this.state.type === 'dictionary') {
                data = {
                    id: this.state.selectValue,
                    type: 'dictionary',
                    dictionary: {
                        dicID: this.state.selectValue,
                        dictType: this.state.dictType,
                        keyField: this.state.tableSelect[0].column_name,
                        nameField: this.state.tableSelect[0].column_name,
                        displayName: this.state.tableSelect[0].column_description
                    }
                };
            }
            else if (this.state.type === 'userDic') {
                data = {
                    id: this.state.userDictID,
                    type: 'userDic',
                    title: this.state.userDictTitle,
                    userDic: {
                        values: this.state.userDictData
                    }
                };
            }
            else {
                data = {
                    id: this.state.userDefineID,
                    type: 'userDefine',
                    title: this.state.userDefineTitle
                };
            }
        }
        this.props.handle(data);
    }
    inputChange = (path, e) => {
        let state = lodash.cloneDeep(this.state);
        state[path] = e.target.value;
        this.setState(state);
    }
    addUserDict = () => {
        let { userDictData, userDictValue } = lodash.cloneDeep(this.state);
        if (!userDictValue) {
            return;
        }
        userDictData.push({ key: count++, name: this.state.userDictValue });
        userDictValue = ''
        this.setState({ userDictData, userDictValue });
    }
    handleDelete = key => {
        const { userDictData } = lodash.cloneDeep(this.state);
        this.setState({ userDictData: userDictData.filter(item => item.key !== key) });
    };
    handleSave = row => {
        const { userDictData } = lodash.cloneDeep(this.state);
        const index = userDictData.findIndex(item => row.key === item.key);
        const item = userDictData[index];
        userDictData.splice(index, 1, {
            ...item,
            ...row,
        });
        this.setState({ userDictData });
    };
    render() {
        const { type } = this.state;
        const columns = [{
            title: type !== 'userDic' ? '字段名' : '键',
            dataIndex: type !== 'userDic' ? 'column_name' : 'key',
            key: type !== 'userDic' ? 'column_name' : 'key',
            widht: 233,
            textWrap: 'word-break',
            ellipsis: true,
            render: (text) => (
                <div style={{ wordWrap: 'break-word', wordBreak: 'break-word', width: 187 }}>
                    {text}
                </div>
            )
        },
        {
            title: type !== 'userDic' ? '备注' : '值',
            dataIndex: type !== 'userDic' ? 'column_description' : 'name',
            key: type !== 'userDic' ? 'column_description' : 'name',
            textWrap: 'word-break',
            width: 232,
            ellipsis: true,
            render: (text) => (
                <div style={{ wordWrap: 'break-word', wordBreak: 'break-word', width: 186 }}>
                    {text}
                </div>
            )
        }];
        const rowSelection = {
            type: 'radio',
            selectedRowKeys: this.state.tableSelectKey,
            onChange: (selectedRowKeys, selectedRows) => {
                this.setState({ tableSelect: selectedRows, tableSelectKey: selectedRowKeys })
            }
        }

        const columns2 = [
            {
                title: '键',
                dataIndex: 'key',
                key: 'key',
                width: 220,
            },
            {
                title: '值',
                dataIndex: 'name',
                key: 'name',
                width: 220,
                editable: true
            },
            {
                title: '',
                dataIndex: 'operation',
                key: 'operation',
                render: (text, record) =>
                    this.state.userDictData.length >= 1 ? (
                        <Popconfirm okText="确认" cancelText="取消" title="确认删除?" onConfirm={() => this.handleDelete(record.key)}>
                            <a>删除</a>
                        </Popconfirm>
                    ) : null,
            },
        ];
        const dataSource = this.state.userDictData;
        const components = {
            body: {
                row: EditableFormRow,
                cell: EditableCell,
            },
        };
        const userDictColumns = columns2.map(col => {
            if (!col.editable) {
                return col;
            }
            return {
                ...col,
                onCell: record => ({
                    record,
                    editable: col.editable,
                    dataIndex: col.dataIndex,
                    title: col.title,
                    handleSave: this.handleSave,
                }),
            };
        });
        return (
            <Modal
                visible={true}
                title="维度属性/基础字典"
                onOk={this.modalSave.bind(this, true)}
                onCancel={this.modalSave.bind(this, false)}
                width={600}
                wrapClassName="bi"
                destroyOnClose={true}
            >
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                    <Radio.Group onChange={this.typeChange} value={this.state.type}>
                        <Radio value="dim">维度属性</Radio>
                        <Radio value="dictionary">基础字典</Radio>
                        <Radio value="userDic">自定义字典</Radio>
                        <Radio value="userDefine">自定义属性</Radio>
                    </Radio.Group>
                </div>
                <div style={{ border: '1px solid #ddd', marginBottom: 12, padding: 16, display: this.state.type ? 'block' : 'none', height: this.state.type === 'userDefine' ? 66 : 300 }}>
                    <div style={{ textAlign: 'center', display: this.state.type === 'dim' || this.state.type === 'dictionary' ? 'block' : 'none' }}>
                        {this.state.type === "dim" ? "维度属性" : "基础字典"}:
                        <Select
                            showSearch
                            placeholder={`请选择${this.state.type === "dim" ? "维度属性" : "基础字典"}`}
                            style={{ width: 200, marginLeft: 10, marginBottom: 12 }}
                            value={this.state.selectValue}
                            onChange={this.selectChange}
                            filterOption={(input, option) =>
                                option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }
                        >
                            {
                                this.state.selectData.map(item => <Option extra={item.dictType} key={item.value} value={item.value} >{item.display}</Option>)
                            }
                        </Select>
                        <Table tableLayout="fixed" scroll={{ y: 180 }} columns={columns} dataSource={this.state.tableData} pagination={false} rowSelection={rowSelection} />
                    </div>
                    <div style={{ textAlign: 'center', display: this.state.type === 'userDic' ? 'block' : 'none' }}>
                        标识:
                        <Input style={{ width: 95, margin: '0 10px 16px 10px' }} placeholder="请输入标识" onChange={this.inputChange.bind(this, 'userDictID')} value={this.state.userDictID} />
                        标题:
                        <Input style={{ width: 95, margin: '0 10px 16px 10px' }} placeholder="请输入标题" onChange={this.inputChange.bind(this, 'userDictTitle')} value={this.state.userDictTitle} />
                        字典:
                        <Input style={{ width: 95, margin: '0 10px 16px 10px' }} placeholder="请输入字典" onChange={this.inputChange.bind(this, 'userDictValue')} value={this.state.userDictValue} onPressEnter={this.addUserDict} />
                        <Button style={{ width: 60 }} onClick={this.addUserDict}>增加</Button>
                        <Table tableLayout="fixed" scroll={{ y: 180 }} rowClassName={() => 'editable-row'} columns={userDictColumns} dataSource={dataSource} pagination={false} components={components} />
                    </div>
                    <div style={{ textAlign: 'center', display: this.state.type === 'userDefine' ? 'block' : 'none' }}>
                        标识:
                        <Input style={{ width: 180, margin: '0 10px 16px 10px' }} placeholder="请输入标识" onChange={this.inputChange.bind(this, 'userDefineID')} value={this.state.userDefineID} />
                        标题:
                        <Input style={{ width: 180, margin: '0 10px 16px 10px' }} placeholder="请输入标题" onChange={this.inputChange.bind(this, 'userDefineTitle')} value={this.state.userDefineTitle} />
                    </div>
                </div>
            </Modal>);
    }
}