const path = require('path')
const { differenceInYears } = require('date-fns')

function shortDate(dt) {
  return dt.toLocaleDateString('en-US')
}

function age(p) {
  var result = differenceInYears(new Date(), p.birthDate)
  return result
}

function yearsToRetirement(p) {
  return Math.max(0, 65 - age(p))
}

module.exports = ({ endpoint }) => ({
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
          goto(
            'sent',
            `Great, I've sent the eBook to ${
              profile.email
            }. You can also view it at https://medrite.com/ebook.`
          )
        }
      },
      routes: {
        sent: {
          noop: `Sorry, I didn't get that. Please provide a birth date in the form of MM/DD/YYYY.`,
          prompt: `I would like to point you to a couple videos, can I get your date of birth so I can choose the right ones?`,
          run: ({ goto, profile, entities: { date } }) => {
            if (date) {
              profile.birthDate = date
              goto(
                'videos',
                `Okay, you're ${age(
                  profile
                )} years old and will be eligible for Medicare in ${yearsToRetirement(
                  profile
                )} year(s).`
              )
            }
          },
          routes: {
            videos: {
              prompt: ({ profile }) =>
                `Here are the best videos for you based on ${yearsToRetirement(
                  profile
                )} year(s) before Medicare age eligibility.`,
              run: ({ goto }) => {
                goto('..')
              }
            }
          }
        }
      }
    }
  }
})
