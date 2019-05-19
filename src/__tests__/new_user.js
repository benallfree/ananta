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
  const u = await User.findOne({ number: 'a' })
  expect(u).toMatchObject({ number: 'a' })
  expect(Message.findOne({ userId: u._id })).resolves.toMatchObject({
    text: 'test'
  })
})
