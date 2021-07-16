import React, { Component } from 'react';
import { Input,Icon } from '@vadp/ui';


const Search = Input.Search;

class searchC extends Component {
  constructor(props) {
    super(props);
    this.state={
        value:props.value || ''
    }
  }
  componentWillReceiveProps(nextProps){
      if(nextProps.value !=this.props.value){
        this.setState({ value: nextProps.value});
      }
  }
  emitEmpty(){
     this.setState({ value: '' });
  }
  onChangeValue = (e) =>{
      this.setState({ value: e.target.value });
  }
  search(v){
    if(this.props.changeHandle){
      this.props.changeHandle(v)
    }
  }
  //onSearch为点击搜索或按下回车时的回调函数
  render() {
    const { value } = this.state;
    return (
       <Search
          className="custom-search"
          enterButton={<i className="icon iconfont icon-search"></i>}
          placeholder="请输入..."
          onSearch={(value)=>this.search(value)}
          value={value}
          onChange={this.onChangeValue}
        />
    )
  }
}

export default searchC
