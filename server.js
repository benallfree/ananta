import express from 'express'
import bodyParser from 'body-parser'
import twilio from 'twilio'
import { config } from 'dotenv'
import next from 'next'
import { Engine } from './Engine'
import { Message } from './Engine/models'

config()

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = express()

  server.use(bodyParser.urlencoded({ extended: false }))

  const client = new twilio(
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET
  )

  const cb = new Engine()

  server.post('/v1/twilio/sms/inbound', async (req, res) => {
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

  server.get('*', (req, res) => {
    return handle(req, res)
  })

  server.listen(port, err => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  })
})
