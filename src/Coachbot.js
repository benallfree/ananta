import { User, Track } from './models'

class Coachbot {
  async processInboundMessage(inboundMessage) {
    const { to, from, text } = inboundMessage
    const t = await Track.findOne({ number: to })
    if (t) {
      inboundMessage.trackId = t._id
    }
    const u = await User.findOrCreateOne({ number: from })
    inboundMessage.userId = u._id
    await inboundMessage.save()
    if (!inboundMessage.trackId) {
      return await inboundMessage.createReply(
        'Oops! This number is not active. Please check and try again.'
      )
    }

    if (text.match(/help/i)) {
      return await inboundMessage.createReply(
        'Please visit the help page at http://coachbot.com/asdf/help.'
      )
    }
    const r = await inboundMessage.createReply(
      `Hello from ${
        t.name
      }! Respond at any time with HELP to get help, or STOP to stop messages.`
    )
    return r
  }
}

export { Coachbot }
