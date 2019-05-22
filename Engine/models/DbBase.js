import _ from 'lodash'
import { camelize, pluralize } from 'inflection'
import datastore from 'nedb-promise'

const dataStores = {}

class DbBase {
  static getTableName() {
    return pluralize(camelize(this.name, true))
  }

  static getDataStoreFileName(collectionName) {
    return `db/${process.env.NODE_ENV}/${collectionName}`
  }

  static getCollectionRef() {
    const collectionName = this.getTableName()
    if (dataStores[collectionName]) return dataStores[collectionName]
    dataStores[collectionName] = datastore({
      filename: this.getDataStoreFileName(collectionName),
      autoload: true
    })
    return dataStores[collectionName]
  }

  static async findOne(search) {
    const res = await this.getCollectionRef().findOne(search)
    if (!res) return null
    return new this(res)
  }

  static async findOrCreateOne(search, create = null) {
    let obj = await this.findOne(search)
    if (!obj) {
      obj = await this.create(create || search)
    }
    return obj
  }

  static async delete(search = {}) {
    return this.getCollectionRef().remove(search, { multi: true })
  }

  constructor(attrs = {}) {
    _.extend(
      this,
      { createdAt: new Date().getTime(), updatedAt: new Date().getTime() },
      attrs
    )
  }

  static async create(attrs) {
    const obj = await this.getCollectionRef().insert(attrs)
    return new this(obj)
  }

  async update(atts = {}) {
    _.extend(this, atts)
    return this.save()
  }

  async save() {
    if (this._id) {
      return this.constructor
        .getCollectionRef()
        .update({ _id: this._id }, { $set: this.getAttrs() })
    } else {
      return this.constructor.getCollectionRef().insert(this.getAttrs())
    }
  }

  getAttrs() {
    return { ...this }
  }
}

export { DbBase }
