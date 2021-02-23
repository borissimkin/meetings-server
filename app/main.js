const express = require('express')
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const cors = require('cors')

const {User} = require("./models/User");
const {Message} = require('./models/Message')
const {Room} = require('./models/Room')
const { AttendanceCheckpoint } = require('./models/AttendanceCheckpoint');
const { Meeting } = require('./models/Meeting');
const { UserMeetingState } = require('./models/UserMeetingsState');
const { Visitor } = require('./models/Visitor');
const { VisitorAttendanceCheck } = require('./models/VisitorAttendanceCheck');
const sequelize = require('./models/index')

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


sequelize.sync()


const port = process.env.PORT || 3000


app.use(express.static(__dirname + '/dist'));


app.use(require('./routes/room'))
app.use('/api', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'))


app.use('/*', express.static(__dirname + '/dist'));

let messageID = 1

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
        socket.leave(roomId)
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

      socket.on('user-speak', () => {
        socket.to(roomId).broadcast.emit('userSpeak', userInfo)
      })

      socket.on('user-stop-speak', () => {
        socket.to(roomId).broadcast.emit('userStopSpeak', userInfo)
      })

      socket.on('whiteboard-drawing', (data) => {
        socket.to(roomId).broadcast.emit('whiteboardDrawing', data)
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