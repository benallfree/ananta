import { Message } from './models'
import { Engine } from './Engine'
import express from 'express'
import bodyParser from 'body-parser'
import twilio from 'twilio'

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))

const client = new twilio(
  'AC353729cd88d94e749b60d74a1dafc833',
  '8fbaea745453a8dc2634d3b20a0e745e'
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
