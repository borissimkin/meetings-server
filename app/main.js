const express = require('express')
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const cors = require('cors')

const { PeerServer } = require('peer')
const bodyParser = require('body-parser')
const socketioJwt = require("socketio-jwt");

app.use(cors())

app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({
  extended: false
}));

const peerServer = PeerServer({port: 3001, path: '/'})

// peerServer.on('connection', (client) => {
//   console.log(client)
// });
//
// peerServer.on('disconnect', (client) => {
//   console.log(client)
// });

const port = process.env.PORT || 3000


app.use(express.static(__dirname + '/dist'));


app.use(require('./routes/room'))
app.use('/api', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'))


app.use('/*', express.static(__dirname + '/dist'));

let messageID = 1
const {User} = require("./models/User");

io.sockets
  .on('connection', socketioJwt.authorize({             
    secret: process.env.TOKEN_SECRET,
    timeout: 15000 // 15 seconds to send the authentication message
  }))
  .on('authenticated', (socket) => {
    socket.on('join-room', async (roomId) => {
      const user = await User.findByPk(socket.decoded_token.data.id)
      const userInfo = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName
      }
      socket.join(roomId)

      socket.to(roomId).broadcast.emit('userConnected', userInfo)

      socket.on('disconnect', () => {
        socket.to(roomId).broadcast.emit('userDisconnected', userInfo)
      })
      socket.on('new-message',  data => {
        const message = {
          user: userInfo,
          message: {
            id: messageID,
            text: data.message.text,
            date: new Date()
          }
        }
        messageID++;
        io.in(roomId).emit('newMessage', message);
      })

      socket.on('call-connect', (peerId) => {
        socket.user = {
          ...userInfo,
          peerId
        }
        socket.to(roomId).broadcast.emit('callConnected', userInfo, peerId)
      })
    })

  });

server.listen(port, () => {
  console.log(`listen on port ${port}`)
})

global.io = io