import { Message, User, Track, UserState } from '../models'

function beforeEach(dirName) {
  return async () => {
    await Promise.all([
      User.delete(),
      Message.delete(),
      Track.delete(),
      UserState.delete()
    ])
    const m = require(dirName + '/..')
    await Track.create({ number: m.slug, name: m.name, slug: m.slug })
  }
}

export { beforeEach }
