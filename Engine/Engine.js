import { User, Track } from './models'
import { State } from './models/State'

class Engine {
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
    const userState = await userState.findOrCreateOne(
      { userId: u._id, trackId: t._id },
      { userId: u._id, trackId: t._id, slug: t.slug }
    )
    const state = await State.findOne({ slug: userState.slug })

    return await inboundMessage.createReply(state.prompt)
  }
}

export { Engine }
