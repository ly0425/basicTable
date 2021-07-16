import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Table, Button, Icon, Form, InputNumber, Modal, Col } from '@vadp/ui';
import Message from 'public/Message';
import { addTable, previewTable } from '../SpreadsheetAction';
import NetUitl from 'containers/HttpUtil';
import SpreadsheetControl from './SpreadsheetControl';
import VHTable from 'public/VHTableAdapter';
import { bindTableActions } from "../SpreadsheetSelectors";
import SpreadsheetProperty from "./SpreadsheetProperty";
import SpreadsheetPreview from './SpreadsheetPreview';

const FormItem = Form.Item;
const defaultAreaBackground = 'transparent';
const defaultAreaWidth = '100%';
const defaultAreaHeight = 200;

const vadpSetCssTransforms = () => {
  if (window.$ && $('.bi')) {
    $('.bi').parents('.cssTransforms').addClass('removerCssTransforms');
  }
}

class SpreatsheetDesignArea extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showAddSpreadsheet: false,
      rowCount: 8,
      columnCount: 10,
      currentDraggingItem: null,

    }
    vadpSetCssTransforms();
  };
  componentDidMount() {
    // alert('dd')
    // document.getElementById("SpreadsheetBody").attachEvent("ondragover", function(e){
    //   alert
    //   e.returnValue = false;
    //   e.cancelBubble=true;
    //  });
  }
  componentWillReceiveProps(nextProps, nextContext) {
    vadpSetCssTransforms();
  }
  onDrop = (type, event) => {
    event.preventDefault();
    let text = event.dataTransfer.getData("text");
    text = JSON.parse(text);
    let controlName = text.controlName
    // alert(controlName)
    // let controlName = event.dataTransfer.getData("controlName");
    if (controlName !== 'spreadsheet') {
      return;
    }
    let objTables = this.props.ReportBody.sheets;
    if (objTables.length > 0) {
      return;
    }
    this.setState({ showAddSpreadsheet: true });
  }
  hideAddSpreadsheet = () => {
    this.setState({ showAddSpreadsheet: false });
  }
  addNewSpreadsheet = () => {
    if (this.state.columnCount && this.state.rowCount) {
      let { rowCount, columnCount } = this.state;
      if (rowCount * columnCount > 100000) {
        Message.info('不能超过100000个单元格');
      } else {
        this.setState({ showAddSpreadsheet: false, rowCount: 8, columnCount: 10 });
        this.props.dispatch({
          type: 'Spreadsheet/generateTable',
          columnCount,
          rowCount,
          analysisModelID: this.props.analysisModuleId,
        });
      }
    }
  }
  onRowCountChange = (value) => {
    this.setState({ rowCount: value });
  }
  onColumnCountChange = (value) => {
    this.setState({ columnCount: value });
  }

  changeStatus(titleRow) {
    this.setState({
      titleRow
    })
  }

  onDragStart = (event) => {
    console.log("st")
    this.setState({ currentDraggingItem: event.target });
  };
  onDragEnter = (info) => {
    console.log(info);
  };
  onDragOver = (event) => {
    // event.preventDefault();
    event.stopPropagation();
    event.preventDefault();
  };

  hideModal = () => {
    this.props.dispatch(previewTable(false));
  };


  getPreviewTable = (e) => {
    if (!this.props.preview) {
      return null;
    }
    let objTables = this.props.ReportBody.sheets;
    if (objTables.length > 0) {
      let table = objTables[0].present;
      return (<SpreadsheetPreview
        table={table}
        params={this.props.params}
        conditions={table.conditions || []}
      />);
    } else {
      return null;
    }
  };
  // －－－－改－添加了postion：relateive，－ <div style={{ width: '100%',position:"absolute",left:0,right:0,top:0 }}>为了兼容IE上表格列变多，无法继承父元素的宽度这个是IE老问题了－－－
  render() {
    const styleRegion = {
      backgroundColor: this.props.ReportBody.backGroundColor ? this.props.ReportBody.backGroundColor : defaultAreaBackground,
      width: defaultAreaWidth,
      height: this.props.ReportBody.height ? this.props.ReportBody.height : defaultAreaHeight,
      position: 'relative',
    };
    const wh = window.innerHeight;
    const ww = window.innerWidth;
    const SheetComponent = this.props.sheetComponent || SpreadsheetControl;
    return (
      <div className="spreadsheet-model-container" >
        <div style={{ height: "100%", overflow: "auto", position: "relative", marginRight: this.props.showProperty ? '270px' : '0px' }} className="row margin0">
          <div style={{ width: '100%', height: '100%', position: "absolute", left: 0, right: 0, top: 0 }}>
            <div style={{ width: '100%', height: '100%' }}>
              <div style={{ width: '100%', height: '100%' }}>
                <div
                  id='SpreadsheetBody'
                  style={styleRegion}
                  onDragOver={this.onDragOver.bind(this)}
                  onDrop={this.onDrop.bind(this, 'SpreadsheetBody')}
                  onDragStart={this.onDragStart.bind(this)}
                >
                  <div className='printBodyArea_control' id={'printBodyArea_control'} style={{ height: 'calc(100%)', width: '100%' }}>
                    {
                      this.props.ReportBody.sheets.map((item, idx) => {
                        return (
                          <SheetComponent
                            key={item.present.id}
                            id={item.present.id}
                            index={idx}
                            areaName='printBodyArea'
                            actions={this.props.actions}
                            selectionAllowDrag
                            reportName={this.props.reportName}
                            pageParams={this.props.pageParams}
                          />
                        );
                      })
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {this.props.showProperty && <SpreadsheetProperty
          actions={this.props.actions}
          location={this.props.location}
          pageParams={this.props.pageParams}
        />}
        <Modal
          title={'预览'}
          className="table-preview-modal"
          visible={this.props.preview}
          closable
          width={ww - 40}
          style={{ top: '0px' }}
          bodyStyle={{ height: `${wh - 207}px` }}
          onCancel={this.hideModal.bind(this)}
          footer={[<Button key="submit" type="primary" size="large" onClick={this.hideModal.bind(this)}>确定</Button>]}
          wrapClassName="bi"
        >
          <div style={{ height: '100%', width: '100%', overflow: 'auto' }}>
            {this.getPreviewTable()}
          </div>
        </Modal>
        <Modal
          wrapClassName="bi"
          title={'添加电子表格'}
          visible={this.state.showAddSpreadsheet}
          closable={true}
          width={300}
          onCancel={this.hideAddSpreadsheet.bind(this)}
          footer={[<Button key="cancel" type="defualt" size="large" onClick={this.hideAddSpreadsheet.bind(this)}>取消</Button>,
          <Button key="submit" type="primary" size="large" onClick={this.addNewSpreadsheet.bind(this)}>确定</Button>]}
        >
          <Form>
            <FormItem
              label="行数"
              labelCol={{ span: 10 }}
              wrapperCol={{ span: 14 }}
            >
              <InputNumber min={1} max={5000} value={this.state.rowCount} onChange={this.onRowCountChange} />
            </FormItem>
            <FormItem
              label="列数"
              labelCol={{ span: 10 }}
              wrapperCol={{ span: 14 }}
            >
              <InputNumber min={1} max={5000} value={this.state.columnCount} onChange={this.onColumnCountChange} />
            </FormItem>
          </Form>
        </Modal>
      </div>

    );
  }
}
const mapStateToProps = (state, ownProps) => ({
  ReportBody: state.Spreadsheet.ReportBody,
  preview: state.Spreadsheet.preview,
  analysisModuleId: state.analysisModel.analysisModuleId,
  showProperty: state.Spreadsheet.showProperty,
  params: state.Spreadsheet.params
});

const mapDispatchToProps = (dispatch) => ({
  actions: bindTableActions(dispatch),
  dispatch,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SpreatsheetDesignArea);
