import React, { Component } from 'react';
import { Modal, Input} from '@vadp/ui';
import Message from 'public/Message';


export default class ModifyColumnNameModal extends Component {
	constructor(props){
		super(props)
		this.state={
			currentLineName:'',
		}
	}
	componentDidMount() {
		let currentIndex =this.props.model.getCurrentSelection();
	    this.currentIndex =  (currentIndex) ?  currentIndex :  {};
	    this.setState({
	    	currentLineName:this.props.model.columns[this.currentIndex.left].fieldName
	    })
	    
  	}
  	handleSubmit(){
  		if(this.state.currentLineName===this.props.model.columns[this.currentIndex.left].fieldName){
  			this.props.callBack()
  		}else{
			if(this.props.model.columns.filter((item)=>item.fieldName===this.state.currentLineName ? true : false).length>0){
				Message.info('列名不可以重复');
			}else{
				this.props.callBack(this.state.currentLineName,this.currentIndex.left)
			}			
  		}	
  	}
  	handleCancel(){
  		if(this.props.onCancel){
  			this.props.onCancel()
  		}
  	}
  	changeCurrentLineName(event){
		this.setState({ currentLineName: event.target.value });
  	}
	render(){
		return (
			<Modal  title={'修改列名'}
			visible={this.props.visible}
			width="500px"
			okText="确认"
			onOk={this.handleSubmit.bind(this)}
			cancelText="取消"
			onCancel={this.handleCancel.bind(this)}
			wrapClassName="bi"
			>
        	<div>
        		<p style={{ marginRight: 16,marginBottom:16 }}>当前列名 ：</p>
        		<Input placeholder="请输入列名" onChange={this.changeCurrentLineName.bind(this)} value={this.state.currentLineName} maxLength={20}></Input>
        	</div>
        </Modal>
			)
	}
}