const nodemailer = require('nodemailer')
import _ from 'lodash'
import path from 'path'
import { Message, Endpoint, ErrorLog } from './models'
const { NlpManager } = require('node-nlp')
require('dotenv').config()
var mime = require('mime-types')

function functionalize(e) {
  if (e instanceof Function) return e
  return () => e
}

console.log('Loading Engine module')

function spamFilter(text) {
  const replacements = {
    'Medi-care': /Medicare/i,
    'el!g!bility': /eligibility/i,
    'el!g!ble': /eligible/i
  }
  let ret = text
  _.each(replacements, (v, k) => (ret = ret.replace(v, k)))
  return ret
}

class Engine {
  getUniverse(universePath, args) {
    const universe = require(universePath)(args)
    if (universe.isInitialized) return universe
    if (!universe.noop) {
      universe.noop = () => 'Nothing happened.'
    }
    universe.noop = functionalize(universe.noop)

    const initRoute = (route, parentRoute) => {
      if (!(route.run instanceof Function)) {
        route.run = () => {}
      }

      route.prompt = functionalize(route.prompt)

      route.parent = parentRoute
      if (!route.noop) {
        route.noop = parentRoute ? parentRoute.noop : universe.noop
      }
      route.noop = functionalize(route.noop)

      _.each(route.routes, r => initRoute(r, parentRoute))
    }
    _.each(universe.routes, r => initRoute(r))
    universe.route = path =>
      _.reduce(
        _.compact(path.split('/')),
        (carry, s) => (carry.routes && carry.routes[s]) || carry,
        universe
      )

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

      await endpoint.save()
      const universePath = `../../universes/${endpoint.slug}`

      let universe = null
      try {
        universe = this.getUniverse(universePath, { endpoint })
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
          console.log('saying', { text })
          const filtered = spamFilter(text)
          chunks.push(filtered)
        }

        let nextRoutePath = userState.route
        const goto = (newRoute, flash = '') => {
          say(flash)
          nextRoutePath = path.resolve(userState.route, newRoute)
          console.log({ nextRoutePath, newRoute })
        }

        const sendEmail = async (to, subject, body, attachment = '') => {
          const { from, transport } = endpoint.profile.mail
          const transporter = nodemailer.createTransport(transport)
          const params = {
            from: from.name ? `"${from.name}" <${from.email}>` : from.email,
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
          const { entity, resolution } = e
          switch (entity) {
            case 'email':
              entities.email = resolution.value
              break
            case 'date':
              entities.date = new Date(resolution.date)
              break
          }
        })
        console.log({ entities })

        const userParams = {
          text,
          say,
          goto,
          entities,
          intent: ai.intent,
          sendEmail,
          profile: userState.profile,
          now: new Date()
        }

        switch (ai.intent) {
          case 'prompt':
            say(currentRoute.prompt(userParams))
            break
          default:
            try {
              await currentRoute.run(userParams)
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
            if (chunks.length === 0) {
              say(currentRoute.noop(userParams))
            }
        }

        const nextRoute = universe.route(nextRoutePath)
        if (nextRoutePath != userState.route) say(nextRoute.prompt(userParams))

        userState.route = nextRoutePath
        save.userState = userState

        reply.userStateId = userState._id
        reply.text = chunks.join('\n\n')
        console.log(reply.text)
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
