const app = require('express')()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const next = require('next')
import twilio from 'twilio'
import { config } from 'dotenv'
import bodyParser from 'body-parser'
import { Engine } from './Engine'
import { Message, Track, User } from './Engine/models'

config()

const client = new twilio(
  process.env.TWILIO_API_KEY,
  process.env.TWILIO_API_SECRET
)

const engine = new Engine()

const dev = process.env.NODE_ENV !== 'production'
const nextApp = next({ dev })
const nextHandler = nextApp.getRequestHandler()

const messages = []
// socket.io server
io.on('connection', socket => {
  socket.on('message', async message => {
    const track = await Track.findOne({ slug: 'anata' })
    const user = await User.findOrCreateOne({
      number: '+18054032380',
      language: 'en'
    })
    const inbound = new Message({
      from: user.number,
      to: track.number,
      text: message
    })
    const reply = await engine.processInboundMessage(inbound)
    console.log({ reply })

    messages.push(inbound)
    messages.push(reply)
    socket.emit('message', reply)
  })
})

nextApp.prepare().then(() => {
  app.use(bodyParser.urlencoded({ extended: false }))

  app.get('/api/v1/messages', (req, res) => {
    res.json(messages)
  })

  app.post('/v1/twilio/sms/inbound', async (req, res) => {
    console.log('Incoming text', { ...req.body })
    const { From, To, Body } = req.body
    const m = new Message({
      to: To,
      from: From,
      text: Body
    })

    const ret = await cb.processInboundMessage(m)

    const { to, from, text } = ret
    client.messages.create({
      body: text,
      to,
      from
    })

    res.writeHead(200, { 'Content-Type': 'text/xml' })
    res.end()
  })

  app.get('*', (req, res) => {
    return nextHandler(req, res)
  })

  const port = parseInt(process.env.PORT, 10) || 3000
  server.listen(port, err => {
    if (err) throw err
    console.log('> Ready on http://localhost:3000')
  })
})
