const express = require('express')
const MessagingResponse = require('twilio').twiml.MessagingResponse
const bodyParser = require('body-parser')
import datastore from 'nedb-promise'

const db = {
  users: datastore({
    filename: 'db/users.json',
    autoload: true
  }),
  messages: datastore({
    filename: 'db/messages.json',
    autoload: true
  })
}

const { NlpManager } = require('node-nlp')
const manager = new NlpManager({ languages: ['en'] })

manager.addDocument('en', 'goodbye for now', 'greetings.bye')
manager.addDocument('en', 'bye bye take care', 'greetings.bye')
manager.addDocument('en', 'okay see you later', 'greetings.bye')
manager.addDocument('en', 'bye for now', 'greetings.bye')
manager.addDocument('en', 'i must go', 'greetings.bye')
manager.addDocument('en', 'hello', 'greetings.hello')
manager.addDocument('en', 'hi', 'greetings.hello')
manager.addDocument('en', 'howdy', 'greetings.hello')

// Train also the NLG
manager.addAnswer('en', 'greetings.bye', 'Till next time')
manager.addAnswer('en', 'greetings.bye', 'see you soon!')
manager.addAnswer('en', 'greetings.hello', 'Hey there!')
manager.addAnswer('en', 'greetings.hello', 'Greetings!')
;(async () => {
  await manager.train()
  manager.save()
  const response = await manager.process('ok gtg')
  // console.log(response)
})()

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))

const port = 3000

app.post('/v1/twilio/sms/inbound', async (req, res) => {
  const twiml = new MessagingResponse()
  const message = twiml.message()

  console.log(req.body)
  db.messages.insert(req.body)
  const { From } = req.body
  let user = await db.users.findOne({ From })
  console.log({ user })
  if (!user) {
    user = await db.users.insert(req.body)
  }

  if (req.body.Body == 'hello') {
    message.body('Hi!')
  } else if (req.body.Body == 'bye') {
    message.body('Goodbye')
  } else {
    message.media(
      'https://farm8.staticflickr.com/7090/6941316406_80b4d6d50e_z_d.jpg'
    )
  }

  res.writeHead(200, { 'Content-Type': 'text/xml' })
  res.end(twiml.toString())
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
