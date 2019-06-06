import { app } from '../server/app'
import request from 'supertest'
import { Endpoint, User, Message } from '../server/Engine/models'

describe('Twilio endpoint tests', () => {
  beforeEach(async () => {
    await Promise.all([User.delete(), Message.delete(), Endpoint.delete()])
    await Endpoint.create({ number: 'a', slug: 'ananta' })
  })

  test("Twilio endpoint should say if a Universe doesn't exist", async () => {
    const response = await request(app)
      .post('/v1/twilio/sms/inbound')
      .expect(200)
      .send({
        To: 'x',
        From: 'b',
        Body: 'Hello'
      })
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toMatch(/oops/i)
  })

  test('Twilio endpoint should say hello', async () => {
    const response = await request(app)
      .post('/v1/twilio/sms/inbound')
      .expect(200)
      .send({
        To: 'a',
        From: 'b',
        Body: 'Hello'
      })
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toMatch(/listening/i)
  })
})
