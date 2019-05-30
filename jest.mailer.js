const nodemailer = require('nodemailer')
const MailDev = require('maildev')

let maildev = null
let transporter = null

const MAIL_PORT = 1025
maildev = new MailDev({
  smtp: MAIL_PORT
})

beforeEach(done => {
  maildev.listen(done)

  const config = {
    host: 'localhost',
    port: MAIL_PORT,
    ignoreTLS: true
  }
  transporter = nodemailer.createTransport(config)
})

afterEach(done => {
  maildev.close(done)
})

async function sendMail(info) {
  return new Promise((resolve, reject) => {
    maildev.on('new', function(email) {
      resolve(email)
    })

    transporter.sendMail(info)
  })
}

function expectMail(cb) {
  maildev.on('new', cb)
}

module.exports = { maildev, sendMail, expectMail }
