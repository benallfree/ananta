const { sendMail } = require('../jest.mailer')
const path = require('path')

test('It can send email', async () => {
  const email = await sendMail({
    from: '"Fred Foo 👻" <foo@example.com>', // sender address
    to: 'bar@example.com, baz@example.com', // list of receivers
    subject: 'Hello ✔', // Subject line
    text: 'Hello world?', // plain text body
    html: '<b>Hello world?</b>' // html body
  })
  expect(email.text).toBe('Hello world?')
})

test('It can send an attachment', async () => {
  const email = await sendMail({
    from: '"Fred Foo 👻" <foo@example.com>', // sender address
    to: 'bar@example.com, baz@example.com', // list of receivers
    subject: 'Hello ✔', // Subject line
    text: 'Hello world?', // plain text body
    attachments: [
      {
        filename: 'file.pdf',
        path: path.resolve(__dirname, 'att.txt'),
        contentType: 'application/pdf'
      }
    ]
  })
  expect(email.attachments.length).toBe(1)
})
