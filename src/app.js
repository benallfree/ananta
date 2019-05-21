import { Message } from './models'
import { Engine } from './Engine'
import express from 'express'
import bodyParser from 'body-parser'
import twilio from 'twilio'
require('dotenv').config()

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))

const client = new twilio(
  process.env.TWILIO_API_KEY,
  process.env.TWILIO_API_SECRET
)

const cb = new Engine()

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

export { app, cb }
