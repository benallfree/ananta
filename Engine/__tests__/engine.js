import { Engine } from '../Engine'
import { Message, User, Track, UserState } from '../models'
import { resolve } from 'path'
import glob from 'glob'

const engine = new Engine()

test('Engine should send a friendly message if an unidentified track is pinged', async () => {
  const m = new Message({
    from: 'user',
    to: 'foo',
    text: 'hello'
  })
  const response = await engine.processInboundMessage(m)
  expect(response.text).toMatch(/is not active/)
})

describe('Track tests', () => {
  const rootPath = resolve(__dirname, '../../tracks/')
  const opts = { cwd: rootPath }
  const modules = glob.sync('**/_test.js', opts)
  modules.forEach(path => {
    const testPath = resolve(rootPath, path)
    const trackPath = resolve(rootPath, path, '..')
    const factory = require(testPath)
    const trackConfig = require(trackPath)
    const name = `${trackConfig.name} (${trackConfig.slug})`

    test(`${name} is well formed`, () => {
      expect(trackConfig).toBeTruthy()
      expect(trackConfig.name).toBeTruthy()
      expect(trackConfig.slug).toBeTruthy()
      expect(trackConfig.number).toBeTruthy()
    })

    describe(name, () => {
      let track = null
      beforeEach(async () => {
        await Promise.all([
          User.delete(),
          Message.delete(),
          Track.delete(),
          UserState.delete()
        ])

        track = await Track.create({
          name: trackConfig.name,
          slug: trackConfig.slug,
          number: trackConfig.number
        })
      })

      test('It should welcome a new user', async () => {
        const m = new Message({
          to: track.number,
          from: 'a',
          text: 'test'
        })

        let user = await User.findOne({ number: 'a' })
        expect(user).toBeFalsy()

        const reply = await engine.processInboundMessage(m)

        expect(reply.text).toMatch(/listening/)

        user = await User.findOne({ number: 'a' })
        expect(user).toMatchObject({ number: 'a' })

        const userState = await UserState.findOne({
          userId: user._id,
          trackId: track._id
        })
        expect(userState).toBeTruthy()

        const r = await Message.findOne({
          userId: user._id,
          userStateId: userState._id
        })
        expect(r.text).toMatch(/listening/)
      })

      // test('It should respond with generic help', async () => {
      //   const m = new Message({
      //     to: TO,
      //     from: 'a',
      //     text: 'helpme'
      //   })
      //   await engine.processInboundMessage(m)
      //   const r = await Message.findOne({ to: 'a', from: TO })
      //   expect(r.text).toMatch(/http/)
      // })

      describe('Track-specific tests', () => {
        let reply = null
        async function snd(txt) {
          const m = new Message({
            from: 'user',
            to: track.number,
            text: txt
          })
          reply = await engine.processInboundMessage(m)
        }

        async function rcv(regex) {
          expect(reply.text).toMatch(regex)
        }

        factory({
          snd,
          rcv
        })
      })
    })
  })
})
