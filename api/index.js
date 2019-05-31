const axios = require('axios')

const api = {
  baseUrl: 'http://localhost:3000/api/v1',
  universes: {
    list: async () => {
      const data = await api.get('/universes')

      return data
    }
  },
  get: async path => {
    const url = `${api.baseUrl}${path}`
    console.log('GET', { url })
    const response = await axios.get(url)
    console.log('GET->Reply', { url }, response.data)

    return response.data
  }
}

module.exports = api
