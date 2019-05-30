const nodemailer = require('nodemailer')
import _ from 'lodash'
import path from 'path'
import { Message } from './models'
const { NlpManager } = require('node-nlp')
require('dotenv').config()
var mime = require('mime-types')

class Engine {
  getUniverse(universePath) {
    const universe = require(universePath)
    if (universe.isInitialized) return universe

    const initRoute = route => {
      if (!(route.run instanceof Function)) {
        route.run = () => {}
      }

      if (!(route.prompt instanceof Function)) {
        const oldPrompt = route.prompt
        route.prompt = () => oldPrompt
      }

      _.each(route.routes, r => initRoute(r))
    }
    _.each(universe.routes, r => initRoute(r))
    universe.route = path =>
      _.reduce(
        _.compact(path.split('/')),
        (carry, s) => (carry.routes && carry.routes[s]) || carry,
        universe
      )
    if (!universe.smtp) {
      universe.smtp = {
        fromName: universe.name,
        fromEmail: 'noreply@ananta.io',
        transport: {
          host: process.env.MAIL_HOST,
          port: process.env.MAIL_PORT,
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASSWORD
          }
        }
      }
    }
    if (process.env.NODE_ENV === 'test') {
      universe.smtp.transport = {
        host: 'localhost',
        port: 1025,
        ignoreTLS: true
      }
    }
    universe.isInitialized = true
    return universe
  }

  async processInboundMessage({ userState, text }) {
    const inboundMessage = new Message({
      userId: userState.userId,
      userStateId: userState._id,
      universeSlug: userState.universeSlug,
      direction: 'receive',
      text
    })

    const reply = await Message.create({
      userId: userState.userId,
      userStateId: userState._id,
      universeSlug: userState.universeSlug,
      direction: 'send',
      text
    })

    const save = { inboundMessage, reply }

    if (!userState.profile) {
      userState.profile = {}
      save.userState = userState
    }

    try {
      const universePath = `../universes/${userState.universeSlug}`

      let universe = null
      try {
        universe = this.getUniverse(universePath)
      } catch (e) {
        console.log(e.toString())
      }
      if (!universe) {
        throw 'Oops! This number is not functioning, but should be. Please contact support.'
      }

      if (userState.route) {
        save.userState = userState
        const currentRoute = universe.route(userState.route)

        const chunks = []
        const say = text => {
          chunks.push(text)
        }

        let nextRoutePath = userState.route
        const goto = newRoute => {
          nextRoutePath = path.join(userState.route, newRoute)
        }

        const sendEmail = async (to, subject, body, attachment = '') => {
          const transporter = nodemailer.createTransport(
            universe.smtp.transport
          )
          const params = {
            from: `"${universe.smtp.fromName}" <${universe.smtp.fromEmail}>`,
            to,
            subject,
            text: body
          }

          if (attachment) {
            params.attachments = [
              {
                filename: path.basename(attachment),
                path: attachment,
                contentType: mime.lookup(attachment)
              }
            ]
          }
          transporter.sendMail(params)
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
          chunks.push(currentRoute.noop || universe.noop || 'Nothing happened.')

        const nextRoute = universe.route(nextRoutePath)
        chunks.push(nextRoute.prompt({ profile: userState.profile }))

        userState.route = nextRoutePath
        save.userState = userState

        reply.userStateId = userState._id
        reply.text = chunks.join(' ')
      } else {
        userState.route = '/root'

        const currentRoute = universe.route(userState.route)

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
