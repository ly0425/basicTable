import React, {PureComponent } from 'react';
import { Tooltip } from '@vadp/ui';
import { publicComponentBox} from '../ConditionsModalCore';
// －－－－－－－参数字段组件－－－－－－－－
export default class Field extends  PureComponent  {
    render() {
      const { value,required,analysisModelId,width} = this.props;
      let obj = {};
      const name = 'label';
      obj = {
        analysisModelId:analysisModelId,
        className: 'conditionModal-ellipsis',
        // children: <Tooltip title={value}>
        children: <Tooltip>
          {required?<b>*</b>:null}
          <span>{value}</span>
        </Tooltip>,
        style: { width: width },
      };
  
      return (
        <div className="field-name" style={{ width: width }}>
          {
          publicComponentBox(name, obj)
        }
        </div>
      );
    }
  }