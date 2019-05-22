module.exports = {
  prompt: '[never shown]',
  getIntent: () => 'arrive',
  intents: {
    arrive: {
      prompt: 'Welcome to VHAB!',
      getIntent: async text => {
        const { NlpManager } = require('node-nlp')

        const manager = new NlpManager({ languages: ['en'] })

        manager.addDocument('en', 'punch her', 'attack')
        manager.addDocument('en', 'attack her', 'attack')
        manager.addDocument('en', 'shoot her', 'attack')

        await manager.train()
        manager.save()
        const response = await manager.process(text)

        console.log(response)
        return response.intent
      },
      intents: {
        attack: {
          prompt: 'Your attack does nothing, loser.'
        }
      }
    }
  }
}
