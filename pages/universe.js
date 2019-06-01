import { Component } from 'react'
import io from 'socket.io-client'
import Link from 'next/link'
var classNames = require('classnames')

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
    this.setState(state => ({
      messages: state.messages.concat({ ...message, direction: 'received' })
    }))
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
        direction: 'sent',
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
        <style jsx>{`
          /* CSS talk bubble */
          .talk-bubble {
            margin-bottom: 10px;
            display: inline-block;
            position: relative;
            width: 200px;
            height: auto;
            background-color: lightyellow;
          }
          .border {
            border: 8px solid #666;
          }
          .round {
            border-radius: 30px;
            -webkit-border-radius: 30px;
            -moz-border-radius: 30px;
          }

          .chatbox {
            background-color: #efefef;
            border-radius: 5px;
            clear: both;
            padding: 40px;
            width: 400px;
          }

          /* Right triangle placed top left flush. */
          .tri-right.border.left-top:before {
            content: ' ';
            position: absolute;
            width: 0;
            height: 0;
            left: -40px;
            right: auto;
            top: -8px;
            bottom: auto;
            border: 32px solid;
            border-color: #666 transparent transparent transparent;
          }
          .tri-right.left-top:after {
            content: ' ';
            position: absolute;
            width: 0;
            height: 0;
            left: -20px;
            right: auto;
            top: 0px;
            bottom: auto;
            border: 22px solid;
            border-color: lightyellow transparent transparent transparent;
          }

          /* Right triangle, left side slightly down */
          .tri-right.border.left-in:before {
            content: ' ';
            position: absolute;
            width: 0;
            height: 0;
            left: -40px;
            right: auto;
            top: 30px;
            bottom: auto;
            border: 20px solid;
            border-color: #666 #666 transparent transparent;
          }
          .tri-right.left-in:after {
            content: ' ';
            position: absolute;
            width: 0;
            height: 0;
            left: -20px;
            right: auto;
            top: 38px;
            bottom: auto;
            border: 12px solid;
            border-color: lightyellow lightyellow transparent transparent;
          }

          /*Right triangle, placed bottom left side slightly in*/
          .tri-right.border.btm-left:before {
            content: ' ';
            position: absolute;
            width: 0;
            height: 0;
            left: -8px;
            right: auto;
            top: auto;
            bottom: -40px;
            border: 32px solid;
            border-color: transparent transparent transparent #666;
          }
          .tri-right.btm-left:after {
            content: ' ';
            position: absolute;
            width: 0;
            height: 0;
            left: 0px;
            right: auto;
            top: auto;
            bottom: -20px;
            border: 22px solid;
            border-color: transparent transparent transparent lightyellow;
          }

          /*Right triangle, placed bottom left side slightly in*/
          .tri-right.border.btm-left-in:before {
            content: ' ';
            position: absolute;
            width: 0;
            height: 0;
            left: 30px;
            right: auto;
            top: auto;
            bottom: -40px;
            border: 20px solid;
            border-color: #666 transparent transparent #666;
          }
          .tri-right.btm-left-in:after {
            content: ' ';
            position: absolute;
            width: 0;
            height: 0;
            left: 38px;
            right: auto;
            top: auto;
            bottom: -20px;
            border: 12px solid;
            border-color: lightyellow transparent transparent lightyellow;
          }

          /*Right triangle, placed bottom right side slightly in*/
          .tri-right.border.btm-right-in:before {
            content: ' ';
            position: absolute;
            width: 0;
            height: 0;
            left: auto;
            right: 30px;
            bottom: -40px;
            border: 20px solid;
            border-color: #666 #666 transparent transparent;
          }
          .tri-right.btm-right-in:after {
            content: ' ';
            position: absolute;
            width: 0;
            height: 0;
            left: auto;
            right: 38px;
            bottom: -20px;
            border: 12px solid;
            border-color: lightyellow lightyellow transparent transparent;
          }

          /*Right triangle, placed bottom right side slightly in*/
          .tri-right.border.btm-right:before {
            content: ' ';
            position: absolute;
            width: 0;
            height: 0;
            left: auto;
            right: -8px;
            bottom: -40px;
            border: 20px solid;
            border-color: #666 #666 transparent transparent;
          }
          .tri-right.btm-right:after {
            content: ' ';
            position: absolute;
            width: 0;
            height: 0;
            left: auto;
            right: 0px;
            bottom: -20px;
            border: 12px solid;
            border-color: lightyellow lightyellow transparent transparent;
          }

          /* Right triangle, right side slightly down*/
          .tri-right.border.right-in:before {
            content: ' ';
            position: absolute;
            width: 0;
            height: 0;
            left: auto;
            right: -40px;
            top: 30px;
            bottom: auto;
            border: 20px solid;
            border-color: #666 transparent transparent #666;
          }
          .tri-right.right-in:after {
            content: ' ';
            position: absolute;
            width: 0;
            height: 0;
            left: auto;
            right: -20px;
            top: 18px;
            bottom: auto;
            border: 12px solid;
            border-color: lightyellow transparent transparent lightyellow;
          }

          /* Right triangle placed top right flush. */
          .tri-right.border.right-top:before {
            content: ' ';
            position: absolute;
            width: 0;
            height: 0;
            left: auto;
            right: -40px;
            top: -8px;
            bottom: auto;
            border: 32px solid;
            border-color: #666 transparent transparent transparent;
          }
          .tri-right.right-top:after {
            content: ' ';
            position: absolute;
            width: 0;
            height: 0;
            left: auto;
            right: -20px;
            top: 0px;
            bottom: auto;
            border: 20px solid;
            border-color: lightyellow transparent transparent transparent;
          }

          /* talk bubble contents */
          .talktext {
            padding: 1em;
            text-align: left;
            line-height: 1.5em;
          }
          .talktext p {
            /* remove webkit p margins */
            -webkit-margin-before: 0em;
            -webkit-margin-after: 0em;
          }

          .sent {
            display: flex;
            justify-content: flex-end;
          }
          .sent .talk-bubble,
          .sent .talk-bubble .tri-right.right-in:after {
          }
          .received {
            display: flex;
            justify-content: flex-start;
          }
          .received .talk-bubble {
          }
        `}</style>
        <h1>Start Chatting</h1>
        <div>
          <Link href="/">
            <a>Home</a>
          </Link>
        </div>

        <div className="chatbox">
          {messages.map(message => (
            <div
              key={message._id}
              className={classNames({ [message.direction]: true })}
            >
              <div
                className={classNames({
                  'talk-bubble': true,
                  'tri-right': true,
                  'right-in': message.direction === 'sent',
                  'left-in': message.direction === 'received',
                  round: true
                })}
              >
                <div className="talktext">
                  <p>{message.text}</p>
                </div>
              </div>
            </div>
          ))}
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
