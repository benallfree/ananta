import _ from 'lodash'
import path from 'path'
import { User, Track, UserState, Message } from './models'
const { NlpManager } = require('node-nlp')

class Engine {
  getRoute(trackConfig, routePath) {
    console.log({ trackConfig, routePath })
    const route = _.reduce(
      _.compact(routePath.split('/')),
      (carry, s) => (carry.routes && carry.routes[s]) || carry,
      trackConfig
    )

    if (!(route.run instanceof Function)) {
      route.run = () => {}
    }

    if (!(route.prompt instanceof Function)) {
      const oldPrompt = route.prompt
      route.prompt = () => oldPrompt
    }

    return route
  }

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
      } catch (e) {
        console.log(e.toString())
      }
      if (!trackConfig) {
        throw 'Oops! This number is not functioning, but should be. Please contact support.'
      }

      let userState = await UserState.findOne({ userId: u._id, trackId: t._id })
      if (userState) {
        save.push(userState)
        const currentRoute = this.getRoute(trackConfig, userState.route)

        const chunks = []
        function say(text) {
          chunks.push(text)
        }

        let nextRoutePath = userState.route
        function goto(newRoute) {
          nextRoutePath = path.join(userState.route, newRoute)
        }

        function sendEmail(to, subject, body) {
          console.log('email noop')
        }

        if (!currentRoute.nlpManager) {
          const manager = new NlpManager({ languages: ['en'] })
          _.each(currentRoute.intents, (trainingSet, intentName) =>
            _.each(trainingSet, trainingText =>
              manager.addDocument('en', trainingText, intentName)
            )
          )
          await manager.train()
          await manager.save()
          currentRoute.nlpManager = manager
        }
        const ai = await currentRoute.nlpManager.process(text)

        const entities = {}
        _.each(ai.entities, e => {
          const { entity, sourceText } = e
          if (entity === 'email') {
            entities.email = sourceText
          }
        })

        await currentRoute.run({
          text,
          say,
          goto,
          entities,
          intent: ai.intent,
          sendEmail,
          profile: userState.profile
        })

        if (chunks.length === 0)
          chunks.push(
            currentRoute.noop || trackConfig.noop || 'Nothing happened.'
          )

        const nextRoute = this.getRoute(trackConfig, nextRoutePath)
        chunks.push(nextRoute.prompt({ profile: userState.profile }))

        userState.route = nextRoutePath
        save.push(userState)

        reply.userStateId = userState._id
        reply.text = chunks.join(' ')
      } else {
        userState = await UserState.create({
          userId: u._id,
          trackId: t._id,
          route: '/root',
          profile: {}
        })

        const currentRoute = this.getRoute(trackConfig, userState.route)

        reply.userStateId = userState._id
        reply.text = currentRoute.prompt({ profile: userState.profile })
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
