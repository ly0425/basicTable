import React, { Component } from 'react';
import { Form ,Input,Modal,Radio} from '@vadp/ui';
import NetUtil from '@/containers/HttpUtil';

const FormItem = Form.Item;
const { TextArea } = Input;
const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 3 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 21 },
  },
};
class SaveModal extends Component {
  static defaultProps = {
    saveData:{
      name:'',
      remark:'',
    },
    visible:false,
    onOk:()=>{},
    onCancel:()=>{}
  };
  constructor(props) {
    super(props);
    this.checkNameExist = this.checkNameExist.bind(this);
  }
  componentDidMount() {
    if (this.props.data.name) {
      this.props.form.setFieldsValue({
        name: this.props.data.name,
        remark: this.props.data.remark,
      });
    }
  }
  handleSubmit= (e) => {
    e.preventDefault();
    let thar =this;
    this.props.form.validateFields((err, values) => {
      if (!err) {
        for(let key in values){
          if(values[key]==null){
            values[key]=thar.props.data[key]
          }
        }
        this.props.onOk(values,this.props.type);
        if(!thar.props.onOKNotShut)this.onCancel(true);
      }
    });
  };
  onCancel(visible) {
    this.props.onCancel(visible);
  }

  checkNameExist(rule, value, callback) {
    let originalName = this.props.data.name;
    let newName = value;
    let modelType = this.props.modelType;
    if(!modelType){
      callback();
      return;
    }
    if(newName==originalName && !this.props.isCopy){
      callback();
      return;
    }
    let url = `${modelType}/name_exist`;
    let para = {name:newName,category_id:this.props.category_id}
    //校验模型名称是否已经存在
    if (newName && newName != " ") {
      let self = this;
      NetUtil.get(url, para, function (data) {
        //data.data为true表示名称未被占用，可以注册;false表示已经存在
        if (data.data == false) {
          callback('该模型名称已存在!')
        } else {
          callback()
        }
      }, function (data) {
        console.log(data);
      }) 
    } else {
      callback()
    }
  }
  render() {
    const {getFieldDecorator} =this.props.form;
    const {data,UrlType}=this.props;
    const isSaveToAllCategories=data.categoryid=="" && UrlType=="edit" ? true : false;
    return (
    <Modal
      title={'保存模型'}
      className="save-modal bi"
      visible={this.props.visible}
      // closable={false}
      width="500px"
      okText="确认"
      maskClosable={false}
      onOk={this.handleSubmit.bind(this)}
      cancelText="取消"
      onCancel={this.onCancel.bind(this,false)}
      wrapClassName="bi"
    >
      <Form>
        <FormItem label='名称' {...formItemLayout} style={{marginBottom:8}}>
          {getFieldDecorator('name',{
            valuePropName: 'checked',
            rules: [
              {
                required: true,
                message: '请输入模型名称!',
                whitespace: true,
              },
              {
                validator: this.checkNameExist
              }
            ],
            validateTrigger: 'onBlur' //校验子节点值的时机，默认onChange
          })(
              <Input type="text" maxLength="30" defaultValue={this.props.data.name} 
              />
          )}

        </FormItem>
        <FormItem label="描述" {...formItemLayout} style={{ marginBottom: 0 }}>
          {getFieldDecorator('remark', {
            valuePropName: 'checked',
            rules: [
              {
                max: 100,
                message: '描述最长 100 个字符',
              },
            ],
          })(
            <TextArea  maxLength="100" className="bi-textArea" defaultValue={this.props.data.remark}  />
          )}
        </FormItem>
         {
           this.props.modelType=="analysismodel" ? <FormItem
            label="保存到"
            {...formItemLayout}  style={{ marginTop: "8px" }}
          >
            {getFieldDecorator('isSaveToAllCategories', {
              initialValue: isSaveToAllCategories
            })(
              <Radio.Group>
                <Radio value={true}>所有分类</Radio>
                <Radio value={false}>当前分类</Radio>
              </Radio.Group>
                     )}
          </FormItem> : null
          }
      </Form>
    </Modal>
      )
    }
  }
const saveModal = Form.create()(SaveModal);
export default saveModal;
