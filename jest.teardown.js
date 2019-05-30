module.exports = async () => {
  afterEach(done => {
    global.maildev.close(done)
  })
}
