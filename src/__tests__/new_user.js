import { Coachbot } from '../Coachbot'
import { Message, DbBase, User } from '../models'
import db from '../db'
DbBase.dbConnection = db

beforeAll(async () => {
  return Promise.all([User.delete(), Message.delete()])
})

test('It should receive a new user message', async () => {
  const cb = new Coachbot()
  const m = new Message({ from: 'a', to: 'b', text: 'test' })
  await cb.processInboundMessage(m)
  expect(User.findOne({ number: 'a' })).resolves.toMatchObject({ number: 'a' })
  expect(Message.findOne({ from: 'a' })).resolves.toMatchObject({
    text: 'test'
  })
})
