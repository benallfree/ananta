const { expectMail } = require('../../jest.mailer')

module.exports = function({ snd, rcv }) {
  test('Responds with greeting', async done => {
    await snd('hi')
    await rcv(/email/i)
    await snd('foo')
    await rcv(/valid/i)
    expectMail(async email => {
      expect(email.text).toMatch(/free ebook/i)
      expect(email.attachments.length).toBe(1)
      await rcv(/ben@benallfree.com/i)
      done()
    })
    await snd('ben@benallfree.com')
  })
}
