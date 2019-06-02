import { Component } from 'react'
import _ from 'lodash'
import Router from 'next/router'

const api = require('../api')

class HomePage extends Component {
  static async getInitialProps({ req }) {
    const universes = await api.universes.list()
    return { universes }
  }

  static defaultProps = {
    universes: []
  }

  state = {
    slug: '',
    phone: ''
  }

  handleSlugChange = e => {
    this.setState({ slug: e.target.value })
  }

  handlePhoneChange = e => {
    this.setState({ phone: e.target.value })
  }

  handleGo = e => {
    const url = `/${this.state.slug}?p=${encodeURIComponent(this.state.phone)}`
    console.log({ url })
    Router.push(url)
  }

  render() {
    const { universes } = this.props
    console.log(this.state)
    return (
      <main>
        <h1>Available Universes</h1>
        <div>
          <select name="slug" onChange={this.handleSlugChange}>
            <option>--Choose--</option>
            {_.map(universes, universe => (
              <option key={universe.slug} value={universe.slug}>
                {universe.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          Phone:{' '}
          <input
            type="text"
            value={this.state.phone}
            onChange={this.handlePhoneChange}
          />
        </div>
        <div>
          <button
            onClick={this.handleGo}
            disabled={!this.state.phone || !this.state.slug}
          >
            Go
          </button>
        </div>
      </main>
    )
  }
}

export default HomePage
