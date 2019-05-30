module.exports = async () => {
  global.beforeEach(done => {
    const MAIL_PORT = 1025
    global.maildev = new MailDev({
      smtp: MAIL_PORT
    })
    global.maildev.listen(done)
  })
}
