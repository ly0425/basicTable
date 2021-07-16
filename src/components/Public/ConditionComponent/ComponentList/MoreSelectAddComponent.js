import React, {  Component , PureComponent } from 'react';
import { Button,Checkbox,Radio } from '@vadp/ui';

const RadioGroup = Radio.Group;

const CheckboxGroup = Checkbox.Group;

const plainOptions = [{ label: 'Apple', value: 'Apple' },];
const defaultCheckedList = [];

class AppCheckbox extends React.Component {
  state = {
    checkedList: defaultCheckedList,
    indeterminate: true,
    checkAll: false,
    plainOptions:[]
  };

  onChange = (checkedList) => {
    console.log(checkedList,"checkedListAppCheckbox")

    this.setState({
      checkedList,
      indeterminate: !!checkedList.length && (checkedList.length < plainOptions.length),
      checkAll: checkedList.length === plainOptions.length,
    });
  }


  componentWillReceiveProps(nextprops){
    console.log(nextprops,"nextprops")
    let plainOptions = [];
    nextprops.fields.map(item=>{
        let obj = {label:item.label,value:item.value}
        plainOptions.push(obj)
    })
    this.setState({plainOptions:plainOptions})
  }
  render() {
      
    return (
      <div>
        <div >
          {/* <Checkbox
            indeterminate={this.state.indeterminate}
            onChange={this.onCheckAllChange}
            checked={this.state.checkAll}
          >
            全选
          </Checkbox> */}
          基础选项
        </div>
        <CheckboxGroup options={this.state.plainOptions} value={this.state.checkedList} onChange={this.onChange} />
      </div>
    );
  }
}
class GroupDataCheckbox extends React.Component {
  state = {
    checkedList: defaultCheckedList,
    indeterminate: true,
    checkAll: false,
    plainOptions:[]
  };

  onChange = (checkedList) => {
    console.log(checkedList,"checkedListAppCheckbox")

    this.setState({
      checkedList,
      indeterminate: !!checkedList.length && (checkedList.length < plainOptions.length),
      checkAll: checkedList.length === plainOptions.length,
    });
  }


  componentWillReceiveProps(nextprops){
    console.log(nextprops,"nextprops")
    let plainOptions = [];
    nextprops.fields.map(item=>{
        let obj = {label:item.label,value:item.value}
        plainOptions.push(obj)
    })
    this.setState({plainOptions:plainOptions})
  }
  render() {
      
    return (
      <div>
        <div >
          {/* <Checkbox
            indeterminate={this.state.indeterminate}
            onChange={this.onCheckAllChange}
            checked={this.state.checkAll}
          >
            全选
          </Checkbox> */}
          组选项：
        </div>
        <CheckboxGroup options={this.state.plainOptions} value={this.state.checkedList} onChange={this.onChange} />
      </div>
    );
  }
}
class AppRadio extends React.Component {
  state = {
    value:[""],
    plainOptions:[]
  };

  onChange = e => {
    console.log('radio3 checked', e.target.value);
    this.setState({
      value: e.target.value,
    });
  };
  componentWillReceiveProps(nextprops){
    console.log(nextprops,"nextprops")
    let plainOptions = [];
    nextprops.fields.map(item=>{
        let obj = {label:item.label,value:item.value}
        plainOptions.push(obj)
    })
    this.setState({plainOptions:plainOptions})
  }
  render() {
    return (
      <div>
        <div>最近数据查询选项：</div>
        <RadioGroup
          options={this.state.plainOptions}
          onChange={this.onChange}
        />
      </div>
    );
  }
}

class MoreSelectAddComponent extends Component{
    constructor(props) {
      super(props);
      this.state = {
        value: '',
        tempValue: null,
        tempKey: 'listData',
        isAdd: true,
        customDateData:[],
        listData:[],
        groupData:[],
        showSelect:false
      };
      this.onClickAdd = this.onClickAdd.bind(this);
    }
    componentWillReceiveProps(nextprops){
        console.log(nextprops,"MoreSelectAddComponent")
        let customDateData = [];
        let listData = [];
        let groupData = [];
        nextprops.fields.map(item=>{
            if(item.value=="customDate"){
                customDateData=item.children
            }else{
                if(item.children){
                    groupData.push(item)
                }else{

                    listData.push(item)
                }
            }
        })
        this.setState({
            customDateData:customDateData,
            listData:listData,
            groupData:groupData
        })
    }
    onClickAdd(){

    }
    onClickShow(){
      this.setState({showSelect:!this.state.showSelect})
    }
    render() {
      const { fields, index, fieldOperationbclass } = this.props;
      const { value,listData,customDateData,groupData } = this.state;
      let obj = {};
      const that = this;

      return (
        <div className={fieldOperationbclass ? 'field-operation-select MoreSelectAddComponent' : 'MoreSelectAddComponent'} id="area">
            <div className="select-content">
                <div className="ant-cascader-picker select-but" onClick={this.onClickShow}>请选择参数</div>
                <div className="select-list">
                    <AppCheckbox fields={listData}/>
                    {customDateData.length?
                    <AppRadio fields={customDateData}/>
                    :null
                    }
                    {
                        groupData.length?
                        <GroupDataCheckbox fields={groupData}/>
                        :null
                    }
                </div>
            </div>
            <Button
            style={{ marginLeft: '9px', width: '74px', padding: 0,verticalAlign: "top" }}
            key={'add'}  onClick={this.onClickAdd}
          >添加参数</Button>
        </div>
      );
    }
  }

  export default MoreSelectAddComponent;