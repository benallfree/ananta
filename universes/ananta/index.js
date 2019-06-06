module.exports = ({ endpoint }) => ({
  slug: 'ananta',
  name: 'Ananta',
  noop: 'Nothing happens.',
  routes: {
    root: {
      prompt: 'Ananta is listening.',
      run: async ({ text, say, intent }) => {
        console.log('intent is', { intent })
        switch (intent) {
          case 'look':
            say(
              'You gaze upon the oracle Ananta. She is hovering 6 inches above the ground.'
            )
            break
          case 'attack':
            say("You can't attack Ananta, loser.")
            break
        }
      },
      intents: {
        attack: ['punch her', 'attack her', 'shoot her'],
        look: ['look around', 'look', 'search around']
      }
    }
  }
})
