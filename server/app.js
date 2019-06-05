const app = require('express')()
const next = require('next')
import { resolve } from 'path'
import twilio from 'twilio'
import { config } from 'dotenv'
import bodyParser from 'body-parser'
import { Engine } from './Engine'
import {
  Message,
  Endpoint,
  User,
  PhoneNumber,
  UserState
} from './Engine/models'
var sharedsession = require('express-socket.io-session')
const httpServer = require('http').Server(app)
const socketServer = require('socket.io')(httpServer)

config()

const client = new twilio(
  process.env.TWILIO_API_KEY,
  process.env.TWILIO_API_SECRET
)

const engine = new Engine()

const dev = process.env.NODE_ENV !== 'production'
const nextApp = next({ dev })
const nextHandler = nextApp.getRequestHandler()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
// const session = require('express-session')
// const NedbStore = require('nedb-session-store')(session)
// var sess = {
//   secret: process.env.SESSION_SECRET,
//   cookie: {},
//   resave: true,
//   saveUninitialized: true,
//   store: new NedbStore({
//     filename: resolve(__dirname, 'db', process.env.NODE_ENV, 'sessions')
//   })
// }
// if (app.get('env') === 'production') {
//   app.set('trust proxy', 1) // trust first proxy
//   sess.cookie.secure = true // serve secure cookies
// }
// const sessionProvider = session(sess)
// app.use(sessionProvider)

// socketServer.use(
//   sharedsession(sessionProvider, {
//     autoSave: true
//   })
// )
socketServer.on('connection', socket => {
  socket.on('message', require('./endpoints/socket/message')(socket))
})

app.get('/api/v1/messages', (req, res) => {
  res.json([])
})

app.get('/api/v1/universes', async (req, res) => {
  const universes = await Endpoint.all()

  res.json(universes)
})

app.post('/v1/twilio/sms/inbound', async (req, res) => {
  const { From, To, Body } = req.body
  let ret = null

  const endpoint = await Endpoint.findOne({ number: To })
  if (!endpoint) {
    ret = new Message({
      type: 'webchat',
      to: From,
      from: To,
      text: 'Oops! This number is not active. Please check and try again.'
    })
  } else {
    const phone = await PhoneNumber.findOrCreateOne({
      number: From
    })
    if (!phone.userId) {
      const user = await User.create({})
      phone.userId = user._id
      phone.save()
    }
    const userState = await UserState.findOrCreateOne({
      endpointId: endpoint._id,
      userId: phone.userId
    })

    ret = await engine.processInboundMessage({ userState, text: Body })
  }

  if (process.env.NODE_ENV !== 'test') {
    client.messages.create({
      body: ret.text,
      to: From,
      from: To
    })
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.write(JSON.stringify(ret.text))
  res.end()
})

app.get('/ping', (req, res) => {
  res.write('pong')
  res.end()
})

app.get('/:slug', (req, res) => {
  return nextApp.render(req, res, '/universe', { ...req.query, ...req.params })
})

app.get('*', (req, res) => {
  return nextHandler(req, res)
})

const servers = {
  http: httpServer,
  socket: socketServer
}
module.exports = { app, nextApp, servers }