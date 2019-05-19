var twilio = require('twilio')
var accountSid = 'AC353729cd88d94e749b60d74a1dafc833' // Your Account SID from www.twilio.com/console
var authToken = '8fbaea745453a8dc2634d3b20a0e745e' // Your Auth Token from www.twilio.com/console
var client = new twilio(accountSid, authToken)

;(async () => {
  const message = await client.messages.create({
    body: 'Hello from Node',
    to: '+19384448608', // Text this number
    from: '+19384448608' // From a valid Twilio number
  })

  console.log({ message })
})()
