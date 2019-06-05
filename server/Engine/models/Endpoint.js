import { DbBase } from './DbBase'

class Endpoint extends DbBase {
  static getMigrations() {
    return [
      obj => {
        obj.profile = {
          mail: {
            from: {
              name: obj._id,
              email: `${obj._id}@anata.io`
            },
            transport: {
              host: '0.0.0.0',
              port: 1025,
              auth: {
                user: 'test',
                pass: 'test'
              },
              ignoreTLS: true
            }
          }
        }
      }
    ]
  }
}

export { Endpoint }
