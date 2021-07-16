import { message } from '@vadp/ui';

class Message {
  static messageConfig(top = 100, time = 2) {
    message.config({
      top: top,
      duration: time
    });
  }
  static success(info = "操作成功", top = 100, time = 2) {
    Message.messageConfig(top, time);
    message.success(info);
  }
  static error(info = "操作失败", top = 20, time = 2) {
    Message.messageConfig(top, time);
    message.error(info);
  }
  static warning(info = "操作失败", top = 100, time = 2) {
    Message.messageConfig(top, time);
    message.warning(info);
  }
  static info(info = "操作失败", time = 2) {
    Message.messageConfig(100, time);
    message.info(info);
  }
}
export default Message;
