const { servers } = require('../app')
const clientIo = require('socket.io-client')
const { http: httpServer, socket: socketServer } = servers

let client
let httpServerAddr

/**
 * Setup WS & HTTP servers
 */
beforeAll(async () => {
  httpServer.listen()
  httpServerAddr = httpServer.listen().address()
  console.log({ httpServerAddr })
})

/**
 *  Cleanup WS & HTTP servers
 */
afterAll(() => {
  httpServer.close()
  socketServer.close()
})

/**
 * Run before each test
 */
beforeEach(done => {
  // Setup
  // Do not hardcode server port and address, square brackets are used for IPv6
  client = clientIo.connect(
    `http://[${httpServerAddr.address}]:${httpServerAddr.port}`,
    {
      'reconnection delay': 0,
      'reopen delay': 0,
      'force new connection': true,
      transports: ['websocket']
    }
  )
  client.on('connect', () => {
    done()
  })
})

/**
 * Run after each test
 */
afterEach(done => {
  // Cleanup
  if (client.connected) {
    client.disconnect()
  }
  done()
})

describe('Basic web client functionality', () => {
  test('should communicate', done => {
    // once connected, emit Hello World
    socketServer.emit('echo', 'Hello World')
    client.once('echo', message => {
      // Check that the message matches
      expect(message).toBe('Hello World')
      done()
    })
    socketServer.on('connection', mySocket => {
      expect(mySocket).toBeDefined()
    })
  })
  test('should communicate with waiting for socket.io handshakes', done => {
    // Emit sth from Client do Server
    client.emit('examlpe', 'some messages')
    // Use timeout to wait for socket.io server handshakes
    setTimeout(() => {
      // Put your server side expect() here
      done()
    }, 50)
  })
})
