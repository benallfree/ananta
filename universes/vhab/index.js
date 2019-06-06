const _ = require('lodash')

module.exports = ({ endpoint }) => ({
  name: 'VHAB',
  noop: 'Do you need help? Please contact VHAB at 800-444-7735.',
  routes: {
    root: {
      prompt: ({ profile }) => {
        const ret = []
        ret.push(
          `Welcome to VHAB, my name is Sasha. I am here to help you track your drinking patterns.`
        )
        if (profile.moods) {
          ret.push(
            `Your recent moods have been: ${_.map(
              profile.moods,
              m => m.intent
            ).join(', ')}.`
          )
        }
        return ret.join(' ')
      },
      run: ({ goto, intent, text }) => {
        console.log('goto mood', { intent, text })
        goto('mood')
      },
      routes: {
        mood: {
          prompt:
            "Let's get started. What's your mood right now? You can use normal words like great, terrible, excellent, etc.",
          noop: 'I did not understand that.',

          intents: {
            good: [
              'good',
              'great',
              'excellent',
              'outstanding',
              'dope',
              'pretty good',
              'smiling',
              'cool',
              'coolio',
              'awesome',
              'ashome',
              "eh, i'm feeling great"
            ],
            ok: ['ok', 'normal', 'a little low', 'hanging in there', 'eh'],
            bad: [
              'bad',
              'not good',
              'terrible',
              'suicidal',
              'sad',
              'very sad',
              'suffering'
            ]
          },
          run: ({ now, goto, say, intent, profile }) => {
            if (!profile.moods) profile.moods = []
            if (intent === 'None') return
            profile.moods.push({ createdAt: now, intent })
            say(
              `You said your mood was ${intent}. Going back to the beginning.`
            )
            goto('/root')
          }
        }
      }
    }
  }
})
