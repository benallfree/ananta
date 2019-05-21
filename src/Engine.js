import { User, Track } from './models'

let state = 0

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

    console.log('State is', { state })
    switch (state) {
      case 0:
        if (text.match(/helpme/i)) {
          const domain = t.domain || 'coachbot.com'
          return await inboundMessage.createReply(
            `Please visit the help page at https://${domain}/help.`
          )
        }

        if (text.match(/human/i)) {
          return await inboundMessage.createReply(
            `A human will contact you ASAP`
          )
        }

        if (text.match(/checkin/i)) {
          state = 1
          return await inboundMessage.createReply(
            `How many drinks have you had in the past 24 hours?`
          )
        }
        break
      case 1:
        if (text.match(/helpme/i)) {
          const domain = t.domain || 'coachbot.com'
          return await inboundMessage.createReply(
            `Please use numeric input (1, 2, 3...) or visit the help page at https://${domain}/help/checkin.`
          )
        }
        if (text.match(/\d+/i)) {
          state = 0
          return await inboundMessage.createReply(
            `You had ${text} drinks today.`
          )
        } else {
          return await inboundMessage.createReply(
            `Didn't understand your answer. Say again, how many drinks have you had in the past 24 hours?`
          )
        }
        break
    }
    return await inboundMessage.createReply(
      `Hello from ${
        t.name
      }! Respond at any time with HELP to get help, or STOP to stop messages.`
    )
  }
}

export { Engine }
