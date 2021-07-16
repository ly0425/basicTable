import Common from '../Print/Common';

const comm = new Common();
const TableHeadOrFootUtils = {
	createTableHeadControl(headerData) {
		const control = {
			position: {
				x: (headerData.pageX - headerData.offsetLeft) > 0 ? (headerData.pageX - headerData.offsetLeft) : 0,
				y: (headerData.pageY - headerData.offsetTop) > 0 ? (headerData.pageY - headerData.offsetTop) : 0
			},
			width: 100,
			height: 34,
			name: '',
			value: '',
			style: {},
			containerLocation: '...',
			calculation: 'left',
			id: comm.genId(),
      fontInfo:{
        size:14
      }
		};
		return control;
	},
	setDataStructure(data, type) {
		if (data) {
			let isShow;
			if (type === 'vhtable') {
				isShow = (data.isShow === undefined ? false : data.isShow)
			} else {
				isShow = (data.isShow === undefined ? true : data.isShow)
			}
			return {
				height: data.height || 150,
				isShow,
				textBoxes: data.Items.TextBoxs[0] && data.Items.TextBoxs[0].isDisplay ? [] : data.Items.TextBoxs || [],
			}
		}
		return {};
	}
}

export default TableHeadOrFootUtils;
