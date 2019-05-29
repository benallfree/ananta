import { app } from '../app'
import request from 'supertest'

test('It should have a ping method', async () => {
  const response = await request(app).get('/ping')
  expect(response.statusCode).toBe(200)
})
