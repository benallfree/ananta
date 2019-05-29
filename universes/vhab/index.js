module.exports = {
  slug: 'vhab',
  name: 'VHAB',
  number: '+13103638812',
  noop: 'Do you need help? Please contact VHAB at 800-444-7735.',
  routes: {
    root: {
      prompt:
        'Welcome to VHAB, my name is Sasha. I am here to help you track your drinking patterns.',
      run: async ({ text, say, intent }) => {
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
}
