import { User } from './models'

class Coachbot {
  async processInboundMessage(inboundMessage) {
    const user = await User.findOrCreate({ number: inboundMessage.attrs.from })
    inboundMessage.userId = user._id
    inboundMessage.save()
    const r = await inboundMessage.createReply(
      'Hello from Med+Right! Your free eBook is ready to send. Respond with STOP or STOP ALL at any time to stop messages.'
    )
    return r
  }
}

export { Coachbot }
