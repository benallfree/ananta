module.exports = {
  slug: 'medrite',
  name: 'Med+Rite',
  number: '+13103638812',
  noop: 'Do you need help? Please contact Med+Rite at 800-444-7735.',
  routes: {
    root: {
      prompt:
        'Welcome to Med+Rite, my name is Sasha. I have your eBook on how to avoid Medicare penalties is ready to go, may I have your email address?',
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
