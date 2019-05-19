import { DbBase } from './DbBase'

class User extends DbBase {
  static getTableName() {
    return 'users'
  }
}

export { User }
