import { config } from 'dotenv'
import twilio from 'twilio'

module.exports = async (req, res) => {
  config()

  const client = new twilio(
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET
  )

  const { From, To, Body } = req.body
  let ret = null

  const { Engine } = require('../../Engine')
  const {
    Endpoint,
    PhoneNumber,
    UserState,
    User,
    Message
  } = require('../../Engine/models')

  const engine = new Engine()

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

  const message = {
    body: ret.text,
    to: From,
    from: To
  }
  console.log({ message })
  if (process.env.NODE_ENV !== 'test') {
    client.messages.create(message)
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.write(JSON.stringify(ret.text))
  res.end()
}
