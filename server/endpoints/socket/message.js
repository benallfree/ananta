module.exports = socket => async ({ slug, p, text }) => {
  const { Engine } = require('../../Engine')
  const {
    Endpoint,
    PhoneNumber,
    UserState,
    User
  } = require('../../Engine/models')
  const engine = new Engine()
  const endpoint = await Endpoint.findOne({ slug })

  let reply = null
  if (!endpoint) {
    reply = new Message({
      type: 'webchat',
      to: p,
      from: slug,
      text: 'Oops! This number is not active. Please check and try again.'
    })
  } else {
    const phone = await PhoneNumber.findOrCreateOne({
      number: p
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

    reply = await engine.processInboundMessage({ userState, text })
  }

  socket.emit('message', reply)
}
