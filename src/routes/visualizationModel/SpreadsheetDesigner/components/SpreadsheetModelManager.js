// import createModelManger from 'components/Public/ModelManager';
// export default createModelManger("excel");

import React, { Component } from 'react';
import CreateModelManger from 'components/Public/ModelManager';
class SpreadsheetModelManager extends Component {
    constructor(props) {
      super(props);
    
      this.state = {};
    }
    render(){
        return <div>
            <CreateModelManger urlType="excel"/>
        </div>
    }
}
export default SpreadsheetModelManager;