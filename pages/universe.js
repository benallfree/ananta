import { Component } from 'react'
import io from 'socket.io-client'
import Link from 'next/link'
import ChatBubble from 'react-chat-bubble'

class Universe extends Component {
  static getInitialProps({ query }) {
    return { query }
  }

  // connect to WS server and listen event
  componentDidMount() {
    this.socket = io('http://localhost:3000/')
    this.socket.on('message', this.handleMessage)
  }

  // close socket connection
  componentWillUnmount() {
    this.socket.off('message', this.handleMessage)
    this.socket.close()
  }

  // add messages from server to the state
  handleMessage = message => {
    console.log({ message })
    this.setState(state => ({ messages: state.messages.concat(message) }))
  }

  handleChange = event => {
    this.setState({ input: event.target.value })
  }

  // send messages to server and add them to the state
  handleSubmit = event => {
    event.preventDefault()

    const { slug, p } = this.props.query
    this.socket.emit('message', {
      slug,
      p,
      text: this.state.input
    })

    // add it to state and clean current input value
    this.setState(state => ({
      input: '',
      messages: state.messages.concat({
        _id: new Date().getTime(),
        text: this.state.input
      })
    }))
  }

  state = {
    input: '',
    messages: []
  }

  render() {
    const { input, messages } = this.state
    return (
      <main>
        <h1>Start Chatting</h1>
        <div>
          <Link href="/">
            <a>Home</a>
          </Link>
        </div>
        <ChatBubble messages={messages} />

        <div>
          <ul>
            {messages.map(message => (
              <li key={message._id}>{message.text}</li>
            ))}
          </ul>
          <form onSubmit={this.handleSubmit}>
            <input
              onChange={this.handleChange}
              type="text"
              placeholder="Hello world!"
              value={input}
            />
            <button>Send</button>
          </form>
        </div>
      </main>
    )
  }
}

export default Universe
