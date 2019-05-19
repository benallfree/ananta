import datastore from 'nedb-promise'

const db = {
  users: datastore({
    filename: `db/${process.env.NODE_ENV}/users`,
    autoload: true
  }),
  messages: datastore({
    filename: `db/${process.env.NODE_ENV}/messages`,
    autoload: true
  })
}

export default db
