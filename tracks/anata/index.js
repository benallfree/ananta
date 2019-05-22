module.exports = {
  slug: 'anata',
  name: 'Anata',
  number: '+19384448608',
  noop: 'Nothing happens.',
  routes: {
    root: {
      prompt: 'Anata is listening.',
      run: async ({ text, say, intent }) => {
        switch (intent) {
          case 'look':
            say(
              'You gaze upon the oracle Anata. She is hovering 6 inches above the ground.'
            )
            break
          case 'attack':
            say("You can't attack Anata, loser.")
            break
        }
      },
      intents: {
        attack: ['punch her', 'attack her', 'shoot her'],
        look: ['look around', 'look', 'search around']
      }
    }
  }
}
