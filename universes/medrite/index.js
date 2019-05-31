const path = require('path')

module.exports = {
  name: 'Med+Rite',
  noop: 'Do you need help? Please contact Med+Rite at 800-444-7735.',
  routes: {
    root: {
      prompt:
        'Welcome to Med+Rite, my name is Sasha. I have your eBook on how to avoid Medicare penalties is ready to go, may I have your email address?',
      noop: 'Please provide a valid email address (you@company.com).',
      run: async ({ text, say, ai, goto, entities, profile, sendEmail }) => {
        const { email } = entities
        if (email) {
          profile.email = email
          sendEmail(
            email,
            `Med+Rite eBook`,
            `Here is your free eBook`,
            path.resolve(__dirname, 'ebook.pdf')
          )
          goto('sent')
        }
      },
      routes: {
        sent: {
          prompt: ({ profile }) =>
            `Great, I've sent the eBook to ${
              profile.email
            }. You can also view it at https://medrite.com/ebook. I would like to point you to a couple videos as well, can I get your date of birth so I can choose the right ones?`
        }
      }
    }
  }
}
