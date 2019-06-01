const nodemailer = require('nodemailer')
import _ from 'lodash'
import path from 'path'
import { Message, Endpoint, ErrorLog } from './models'
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
          },
          ignoreTLS: true
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
      endpointId: userState.endpointId,
      userStateId: userState._id,
      userId: userState.userId,
      direction: 'receive',
      text
    })

    const reply = await Message.create({
      endpointId: userState.endpointId,
      userStateId: userState._id,
      userId: userState.userId,
      direction: 'send',
      text
    })

    const save = { inboundMessage, reply }

    if (!userState.profile) {
      userState.profile = {}
      save.userState = userState
    }

    try {
      const endpoint = await Endpoint.findOne({ _id: userState.endpointId })
      const universePath = `../universes/${endpoint.slug}`

      let universe = null
      try {
        universe = this.getUniverse(universePath)
      } catch (e) {
        console.trace(e.toString())
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
          chunks.push('')
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
          try {
            await transporter.sendMail(params)
          } catch (e) {
            console.trace(e.toString())
            await ErrorLog.create({
              message: e.toString(),
              stack: e.stack
            })
          }
        }

        if (!currentRoute.nlpManager) {
          const manager = new NlpManager({ languages: ['en'] })
          _.each(currentRoute.intents, (trainingSet, intentName) =>
            _.each(trainingSet, trainingText =>
              manager.addDocument('en', trainingText, intentName)
            )
          )
          manager.addDocument('en', 'prompt', 'prompt')
          await manager.train()
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

        try {
          await currentRoute.run({
            text,
            say,
            goto,
            entities,
            intent: ai.intent,
            sendEmail,
            profile: userState.profile
          })
        } catch (e) {
          const errLog = await ErrorLog.create({
            message: e.toString(),
            stack: e.stack
          })
          console.trace(e.toString())
          throw `Oops! An internal error occurred. Please contact support. (ID ${
            errLog._id
          })`
        }
        console.log(ai.intent)
        if (chunks.length === 0) {
          switch (ai.intent) {
            case 'prompt':
              break
            default:
              chunks.push(
                currentRoute.noop || universe.noop || 'Nothing happened.'
              )
          }
        }

        const nextRoute = universe.route(nextRoutePath)
        say(nextRoute.prompt({ profile: userState.profile }))

        userState.route = nextRoutePath
        save.userState = userState

        reply.userStateId = userState._id
        reply.text = chunks.join(' ')
      } else {
        userState.route = '/root'
        save.userState = userState

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
