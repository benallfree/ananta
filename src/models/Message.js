import { DbBase } from './DbBase'

class Message extends DbBase {
  static getTableName() {
    return 'messages'
  }

  async createReply(msg = '') {
    const { _id, createdAt, updatedAt, from, to, text, ...rest } = this.attrs
    const r = new Message({ from: to, to: from, text: msg, ...rest })
    await r.save()
    return r
  }
}

export { Message }
