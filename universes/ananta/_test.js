module.exports = function({ snd, rcv }) {
  test('Responds with greeting', async () => {
    await snd('hi')
    await rcv('listening')
    await snd('attack')
    await rcv('loser')
    await snd('look around')
    await rcv('hovering')
    await snd('foo')
    await rcv(/nothing/i)
  })
}
