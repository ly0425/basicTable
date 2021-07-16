import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Collapse } from '@vadp/ui';
import TableProperty from './TableProperty';
import TextBoxProperty from './TextBoxProperty';
import TableThProperty from './TableThProperty';
import TableTrProperty from './TableTrProperty';
import TextAreaProperty from './TextAreaProperty';
import MessageHeadProprrty from './MessageHeadProprrty';
import MessageProprrty from './MessageProprrty';
const Panel = Collapse.Panel;

class TableItemSetting extends Component {
  constructor(props) {
    super(props);
    this.state = { form: this.attributeMenu(this.props) };
  }
  componentWillReceiveProps(nextProps) {
    this.setState({ form: this.attributeMenu(nextProps) });
  }
  attributeMenu = (p) => {
    if (!p.currentObject || !p.currentObject.controlParentInfo) {
      return <div />;
    }
    const selectCell = p.currentObject;
    const tableID = selectCell.controlParentInfo.tableID;
    const tableIndex = selectCell.controlParentInfo.tableIndex;
    const areaName = selectCell.controlParentInfo.areaName;
    const rowID = selectCell.controlParentInfo.rowID;
    const colID = selectCell.controlParentInfo.colID;

    if (!areaName) {
      return <div />;
    }
    const table = {
      tableID,
      tableIndex,
      rowID,
      colID,
    };
    if (p.currentObject.type.toLowerCase() === 'table') {
      return (<TableProperty
        table={table}
        areaName={areaName}
        tableType={p.currentObject.tableType}
        sumComtitionFields={this.props.sumComtitionFields}
      />);
    } else if (p.currentObject.type.toLowerCase() === 'tableth') {
      return (<TableThProperty
        table={Object.assign(table, { columnSubscript: selectCell.columnSubscript })}
        tableType={p.currentObject.tableType}
        areaName={areaName}
      />)
    } else if (p.currentObject.type.toLowerCase() === 'tabletr') {
      return (<TableTrProperty
        table={Object.assign(table, { rowSubscript: selectCell.rowSubscript })}
        areaName={areaName}
        tableType={p.currentObject.tableType}
      />)
    } else if (p.currentObject.type.toLowerCase() === 'textareaproprrty') {
      return (<TextAreaProperty
        areaName={areaName}
        subScript={selectCell.subScript}
        conditionsModalData={p.conditionsModalData}
        headOrFootType={selectCell.headOrFootType}
      />)
    } else if (p.currentObject.type.toLowerCase() === 'messageheadproprrty') {
      return (<MessageHeadProprrty areaName={areaName} headOrFootType={selectCell.headOrFootType} />)
    } else {
      return (<TextBoxProperty
        table={table}
        areaName={areaName}
        conditionsModalData={p.conditionsModalData}
        tableType={p.currentObject.tableType}
        variableList={p.variableList}
      />);
    }
  };
  render() {
    return (
      <div className="setting-board property-border-left">
        <Collapse bordered={false} defaultActiveKey="2" style={{ fontSize: 12 }} >
          <Panel header="表格属性" key="1" className="customPanelStyle">
            <MessageProprrty />
          </Panel>
          <Panel header="基本属性" key="2" className="customPanelStyle">
            {
              this.state.form
            }
          </Panel>
        </Collapse>
      </div>
    );
  }
}
const mapStateToProps = (state) => {
  return {
    currentObject: state.DynamicTableReducer.currentObject,
  };
};
export default connect(mapStateToProps)(TableItemSetting);
