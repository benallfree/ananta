module.exports = function({ snd, rcv }) {
  test('Responds with greeting', async () => {
    await snd('hi')
    await rcv(/email/i)
    await snd('foo')
    await rcv(/valid/i)
    await snd('ben@benallfree.com')
    await rcv(/ben@benallfree.com/i)
  })
}
