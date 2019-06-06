const app = require('express')()
const next = require('next')
import { config } from 'dotenv'
import bodyParser from 'body-parser'
import { Endpoint } from './Engine/models'
const httpServer = require('http').Server(app)
const socketServer = require('socket.io')(httpServer)

config()

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

app.post('/v1/twilio/sms/inbound', require('./endpoints/twilio/inbound'))

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
