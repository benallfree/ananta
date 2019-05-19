import _ from 'lodash'

class DbBase {
  static getTableName() {
    throw new Error('must override')
  }

  static getCollectionRef() {
    return this.dbConnection[this.getTableName()]
  }

  static async findOne(search) {
    return this.getCollectionRef().findOne(search)
  }

  static async findOrCreate(search, create = null) {
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
    this.attrs = _.extend(
      { createdAt: new Date().getTime(), updatedAt: new Date().getTime() },
      attrs
    )
  }

  static async create(attrs) {
    const obj = await this.getCollectionRef().insert(attrs)
    return new this(obj)
  }

  async update(atts = {}) {
    _.extend(this.attrs, atts)
    return this.save()
  }

  async save() {
    if (this.attrs._id) {
      return this.constructor
        .getCollectionRef()
        .update({ _id: this.attrs._id }, { $set: this.attrs })
    } else {
      return this.constructor.getCollectionRef().insert(this.attrs)
    }
  }
}

export { DbBase }
