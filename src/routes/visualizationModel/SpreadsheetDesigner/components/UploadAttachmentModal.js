
import React, { Component } from 'react'
import { Modal, Upload, message, Button, Icon, Popconfirm } from '@vadp/ui';
import '../../../../style/pages/UploadAttachmentModal.css';
import PropTypes from 'prop-types';
import _ from 'lodash';
import isRoutePublic, { isHttpPublic } from 'constants/IntegratedEnvironment';

export class UploadAttachmentModal extends Component {
  constructor(props) {
    super(props)

    let currentList = [];
    let currentRowIndex = -1;
    const { rowProps, selectedRanges } = props;
    if (selectedRanges && selectedRanges.length > 0) {
      currentRowIndex = selectedRanges[0].top == undefined ? -1 : selectedRanges[0].top;
    }
    if (currentRowIndex >= 0 && rowProps) {
      const objRow = rowProps[currentRowIndex];
      if (objRow.hasOwnProperty('attachmentInfo')) {
        currentList = objRow.attachmentInfo.List == undefined ? [] : objRow.attachmentInfo.List;
      }
    }

    this.state = {
      fileList: [],
      dataList: currentList,
      rowIndex: currentRowIndex
    }

  }

  handleChange = info => {
    if (info.file.status !== 'uploading') {

      console.log(info.file, info.fileList);
    }
    if (info.file.status === 'done') {
      message.success(`${info.file.name} 上传成功！`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 上传失败！`);
    }
    else if (info.file.status === 'removed') {
      const { fileList } = this.state;
      const newFileList = fileList.filter(item => item.id != info.file.uid)
      this.setState({ fileList: newFileList });
      return;
    } else if (info.file.status === 'repeat') {
      message.error(`${info.file.name}:重复附件！`);
      let index = info.fileList.findIndex(item => item.name == info.file.name);
      info.fileList.splice(index, 1);
      return;
    }

    let fileList = [];
    // 1. Limit the number of uploaded files
    // Only to show two recent uploaded files, and old ones will be replaced by the new
    //fileList = fileList.slice(-2);
    // 2. Read from response and show file link
    info.fileList.map(file => {
      // Component will show file.url as link
      if (file.response && file.status === 'done') {
        if (file.response.msg == '成功') {
          const fileDataList = file.response.data;
          let filePath = file.response.data[0];
          if (fileDataList.length > 0) {
            fileDataList.map((item) => {
              if (item.includes(file.name)) {
                return filePath = item;
              }
            })
          }
          fileList.push({
            id: file.uid,
            fieldName: file.name,
            size: file.size,
            createDate: file.response.currDate,
            url: filePath
          })
        }
      }
    })

    this.setState({ fileList });
  }

  deleteAttachment = (index) => {
    const { dataList } = this.state;
    let newDataList = _.cloneDeep(dataList);
    if (newDataList.length > 1)
      newDataList.splice(index, 1);
    else
      newDataList = [];
    this.setState({ dataList: newDataList });
  }

  handleOk = () => {
    const { dataList, fileList } = this.state;
    let newFileList = _.cloneDeep(fileList);
    newFileList.map((item) => {
      delete item.id;
    })
    const newList = dataList.concat(newFileList);
    console.log(newList);
    const { selectedRanges, onUpload } = this.props;
    let rowIndex = -1;
    if (selectedRanges && selectedRanges.length > 0) {
      rowIndex = selectedRanges[0].top == undefined ? -1 : selectedRanges[0].top;
    }
    if (rowIndex >= 0)
      onUpload(rowIndex, { List: newList });
    this.handleCancel()
  }

  handleCancel = () => {
    const { onCancel } = this.props;
    onCancel && onCancel();
  }

  convertSize = (size) => {
    const intSize = parseInt(size);
    if (intSize == 0)
      return '1B';
    else if (intSize > 1 && intSize < 1024)
      return intSize + ' B';
    else if (intSize > 1024 && intSize < 1024 * 1024)
      return parseInt(intSize / 1024) + ' KB';
    else if (intSize > 1024 * 1024 && intSize < 1024 * 1024 * 1024)
      return parseInt(intSize / 1024 / 1024) + ' MB';
  }
  beforeUpload = (file) => {
    const { dataList, fileList } = this.state;
    if (dataList.find(item => item.fieldName == file.name) || fileList.find(item => item.fieldName == file.name)) {
      file.status = 'repeat';
      return false;
    }
    return true;
  }
  render() {
    const { visible, pageParams } = this.props;
    const { state, optType, mainState, BudgEditModel } = pageParams;
    const { dataList } = this.state;
    const props = {
      action: isHttpPublic + 'excelBudg/upload',
      onChange: this.handleChange,
      multiple: true,
      beforeUpload: this.beforeUpload
    };
    // 基本资料，通过 state 判断,  编制状态是 1, 提交状态是4, 发布状态是 6
    // const hideUpdateBtn = (
    //   (optType === '1' && (state === '5' || state === '6' || state === '3' || state === '4'))
    //   || (optType === '2')
    //   || (optType === '3')
    // );
    const showUpdateBtn = (BudgEditModel === 'Simple' ? (mainState == 1 || mainState == 2 || mainState == 3 || mainState == 4) : (mainState == 1 || mainState == 2) && (optType != 2));
    return (
      <Modal
        visible={visible}
        title='附件'
        onOk={this.handleOk}
        onCancel={this.handleCancel}
        width="660px"
        // style={{maxHeight:404}}
        okText="确定"
        cancelText="取消"
        maskClosable={false}
        destroyOnClose
      >
        {/* 预算编制：审核中、已完成、职能审批不可上传附件 */}
        {showUpdateBtn && <div>
          <Upload {...props} ><Button><Icon type="upload" /> 点击上传 </Button></Upload>
        </div>}
        <div className={'upload-attachment'}>
          <ul className={'table-list border-top'}>
            <li>文件名</li><li>文件大小</li><li>上传日期</li><li>操作</li>
          </ul>
          {dataList.map((item, index) => {
            return (
              <ul key={index} className={'table-list'}>
                <li><a href={isHttpPublic + 'excelBudg/download?filePath=' + item.url}>{item.fieldName}</a></li>
                <li>{this.convertSize(item.size)}</li>
                <li>{item.createDate}</li>
                <li>
                  {showUpdateBtn &&
                    <Popconfirm title="确认删除此附件?" onConfirm={this.deleteAttachment.bind(this, index)}>
                      <i className="iconfont icon-delete" style={{ cursor: 'pointer' }}></i>
                    </Popconfirm>
                  }
                </li>
              </ul>
            )
          })}
        </div>
      </Modal>
    );
  }
}
UploadAttachmentModal.propTypes = {
  visible: PropTypes.bool,
  onUpload: PropTypes.func,
  onCancel: PropTypes.func,
};

export default UploadAttachmentModal
