import { User } from './models'

class Coachbot {
  async processInboundMessage(inboundMessage) {
    const user = await User.findOrCreate({ number: inboundMessage.attrs.from })
    console.log({ user })
    await inboundMessage.update({ userId: user.attrs._id })
    const r = await inboundMessage.createReply(
      'Hello from Med+Right! Respond at any time with HELP to get help, or STOP to stop messages.'
    )
    return r
  }
}

export { Coachbot }
