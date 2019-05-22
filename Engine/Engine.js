import _ from 'lodash'
import path from 'path'
import { User, Track, UserState, Message } from './models'
const { NlpManager } = require('node-nlp')

class Engine {
  async processInboundMessage(inboundMessage) {
    const { to, from, text } = inboundMessage

    const t = await Track.findOne({ number: to })
    if (t) {
      inboundMessage.trackId = t._id
    }

    const u = await User.findOrCreateOne({ number: from })
    inboundMessage.userId = u._id

    const reply = await Message.create({
      from: to,
      to: from,
      userId: u._id
    })

    const save = [inboundMessage, reply]

    try {
      if (!inboundMessage.trackId) {
        throw 'Oops! This number is not active. Please check and try again.'
      }

      reply.trackId = t._id

      const trackPath = `../tracks/${t.slug}`

      let trackConfig = null
      try {
        trackConfig = require(trackPath)
      } catch (e) {}
      if (!trackConfig) {
        throw 'Oops! This number is not functioning, but should be. Please contact support.'
      }

      let userState = await UserState.findOne({ userId: u._id, trackId: t._id })
      if (userState) {
        let currentState = _.reduce(
          _.compact(userState.route.split('/')),
          (carry, s) => (carry.routes && carry.routes[s]) || carry,
          trackConfig
        )

        const chunks = []
        function say(text) {
          chunks.push(text)
        }

        let nextRoute = userState.route
        function goto(newRoute) {
          nextRoute = path.join(userState.route, newRoute)
        }

        if (!currentState.nlpManager) {
          const manager = new NlpManager({ languages: ['en'] })
          _.each(currentState.intents, (trainingSet, intentName) =>
            _.each(trainingSet, trainingText =>
              manager.addDocument('en', trainingText, intentName)
            )
          )
          await manager.train()
          await manager.save()
          currentState.nlpManager = manager
        }
        const { intent } = await currentState.nlpManager.process(text)
        await currentState.run({ text, say, goto, intent })

        if (chunks.length === 0)
          chunks.push(
            currentState.noop || trackConfig.noop || 'Nothing happened.'
          )

        const nextState = _.reduce(
          _.compact(nextRoute.split('/')),
          (carry, s) => (carry.routes && carry.routes[s]) || carry,
          trackConfig
        )
        chunks.push(nextState.prompt)

        userState.route = nextRoute
        save.push(userState)

        reply.userStateId = userState._id
        reply.text = chunks.join(' ')
      } else {
        userState = await UserState.create({
          userId: u._id,
          trackId: t._id,
          route: '/root'
        })

        let currentState = _.reduce(
          _.compact(userState.route.split('/')),
          (carry, s) => (carry.routes && carry.routes[s]) || carry,
          trackConfig
        )

        reply.userStateId = userState._id
        reply.text = currentState.prompt
      }
    } catch (e) {
      reply.text = e.toString()
    } finally {
      await Promise.all(_.map(save, o => o.save()))
    }
    return reply
  }
}

export { Engine }
