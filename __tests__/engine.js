import { Engine } from '../Engine'
import { Message, User, Endpoint, UserState } from '../Engine/models'
import { resolve } from 'path'
import glob from 'glob'
import { existsSync } from 'fs'

const engine = new Engine()

describe('Endpoint tests', () => {
  const rootPath = resolve(__dirname, '../universes/')
  const opts = { cwd: rootPath }
  const modules = glob.sync('*', opts)
  modules.forEach(path => {
    const universePath = resolve(rootPath, path)
    const universeConfig = engine.getUniverse(universePath)
    const name = `${universeConfig.name || path}`

    test(`${name} is well formed`, () => {
      expect(universeConfig).toBeTruthy()
      expect(universeConfig.name).toBeTruthy()
      expect(universeConfig.noop).toBeTruthy()
      expect(universeConfig.routes).toBeTruthy()
      expect(universeConfig.routes.root).toBeTruthy()
      expect(universeConfig.routes.root.prompt).toBeTruthy()
      expect(universeConfig.routes.root.run).toBeTruthy()
    })

    describe(name, () => {
      let user = null
      let userState = null
      beforeEach(async () => {
        await Promise.all([
          User.delete(),
          Message.delete(),
          Endpoint.delete(),
          UserState.delete()
        ])
        user = await User.create({})
        userState = await UserState.create({
          universeSlug: path,
          userId: user._id
        })
      })

      test('It should welcome a new user', async () => {
        const reply = await engine.processInboundMessage({
          userState,
          text: 'Hello'
        })

        const r = await Message.findOne({
          userId: user._id
        })
        expect(r).toBeTruthy()

        expect(reply.text).toMatch(universeConfig.routes.root.prompt())
        expect(reply.text).not.toMatch(universeConfig.noop)
      })

      const testPath = resolve(rootPath, path, '_test.js')
      if (existsSync(testPath)) {
        const testFactory = require(testPath)

        describe('Endpoint-specific tests', () => {
          let reply = null

          async function snd(txt) {
            reply = await engine.processInboundMessage({ userState, text: txt })
          }

          async function rcv(regex) {
            expect(reply.text).toMatch(regex)
          }

          testFactory({
            snd,
            rcv
          })
        })
      }
    })
  })
})
