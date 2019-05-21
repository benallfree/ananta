import { Engine } from '../Engine'
import { Message, User, Track } from './models'

const TO = '+19384448608'

const cb = new Engine()

describe('basic user tests', () => {
  beforeEach(async () => {
    await Promise.all([User.delete(), Message.delete(), Track.delete()])
    const t = await Track.create({ number: TO })
    expect(t._id).toBeTruthy()
  })

  test('It should send a friendly message if an unidentified track is pinged', async () => {
    const m = new Message({
      from: 'user',
      to: 'track',
      text: 'hello'
    })
    const response = await cb.processInboundMessage(m)
    expect(response.text).toMatch(/is not active/)
  })

  test('It should receive a new user message', async () => {
    const m = new Message({
      to: TO,
      from: 'a',
      text: 'test'
    })
    let u = await User.findOne({ number: 'a' })
    expect(u).toBeFalsy()
    await cb.processInboundMessage(m)
    u = await User.findOne({ number: 'a' })
    expect(u).toMatchObject({ number: 'a' })
    const r = await Message.findOne({ userId: u._id, from: TO })
    expect(r.text).toMatch(/STOP/)
  })

  test('It should respond with generic help', async () => {
    const m = new Message({
      to: TO,
      from: 'a',
      text: 'helpme'
    })
    await cb.processInboundMessage(m)
    const r = await Message.findOne({ to: 'a', from: TO })
    expect(r.text).toMatch(/http/)
  })
})

describe('multi-tenant', () => {
  beforeEach(async () => {
    await Promise.all([User.delete(), Message.delete(), Track.delete()])
    await Track.create({ number: 'a', name: 'Med+Rite' })
    await Track.create({ number: 'b', name: 'Vehab' })
  })

  test('Track A', async () => {
    const m = new Message({
      from: 'user',
      to: 'a',
      text: 'hello'
    })
    const response = await cb.processInboundMessage(m)
    expect(response.text).toMatch(/Med\+Rite/)
  })
  test('Track B', async () => {
    const m = new Message({
      from: 'user',
      to: 'b',
      text: 'hello'
    })
    const response = await cb.processInboundMessage(m)
    expect(response.text).toMatch(/Vehab/)
  })
})
