/**
 * 审查公式
 */
import React from 'react';
import { connect } from 'mini-store';
import {Modal} from '@vadp/ui';

class ExamineFormula extends React.PureComponent {

  render () {
    return (
      <Modal
        title={'审查公示'}
        maskClosable={false}
        mask={false}
        wrapClassName={'wrapClassName'}
        className={'className'}
      >
        <section>
          
        </section>
      </Modal>
    )
  }
}

const mapStateToProps = ({state}) => {

}
export default connect(mapStateToProps)(ExamineFormula);
