import React, {Component} from 'react';
import {  Select,Tooltip,Icon  } from '@vadp/ui'; 
export default class ReferenceInfoRef extends Component {
  constructor(props) {
        super(props);
        this.state = {
               
            }; 
    }
    componentDidMount(){
       //this.init(this.props);
    }
    componentWillReceiveProps(nextProps){
       // this.init(nextProps)
    } 
    init(props){ 
       
    }
  
  render() { 
    const {obj,specialParameter}=this.props;
    return (
        <div className="ReferenceInfoRef">
        <Select {...obj} dropdownClassName="bi" maxTagTextLength={5} />
        <div className="refercen">
          <div className={specialParameter.asc ? 'show up' : 'up'} onClick={() => { specialParameter.click(true); }}>
            <Tooltip title={'正序'} placement="right">
              <Icon type="arrow-up" theme="outlined" />
            </Tooltip>
          </div>

          <div className={!specialParameter.asc ? 'show down' : 'down'} onClick={() => { specialParameter.click(false); }}>
            <Tooltip title={'逆序'} placement="right">
              <Icon type="arrow-down" theme="outlined" />
            </Tooltip>
          </div></div>
      </div>
     
    )
  }
}
