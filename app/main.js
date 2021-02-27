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
app.use('/api/meeting', require('./routes/meeting'))


app.use('/*', express.static(__dirname + '/dist'));

let messageID = 1

io.sockets
  .on('connection', socketioJwt.authorize({             
    secret: process.env.TOKEN_SECRET,
    timeout: 15000 // 15 seconds to send the authentication message
  }))
  .on('authenticated', async (socket) => {
    const user = await User.findByPk(socket.decoded_token.data.id)
    console.log(socket.adapter.rooms);

    const userInfo = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName
    }
    socket.on('join-meeting', (meetingId) => {
      console.log(socket.adapter.rooms);
      socket.join(meetingId)
      console.log(socket.adapter.rooms);

      socket.meetingId = meetingId;
      socket.to(meetingId).broadcast.emit('userConnected', userInfo)

    });

    socket.on('leave-meeting', (meetingId) => {
      socket.leave(meetingId, (error) => {
        socket.to(meetingId).broadcast.emit('userDisconnected', userInfo)
        if (error) {
          console.log(error)
        }
      })
    })

    socket.on('disconnect', () => {
      socket.to(socket.meetingId).broadcast.emit('userDisconnected', userInfo)
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
      io.in(socket.meetingId).emit('newMessage', message);
    })

    socket.on('user-speak', () => {
      socket.to(socket.meetingId).broadcast.emit('userSpeak', userInfo)
    })

    socket.on('user-stop-speak', () => {
      socket.to(socket.meetingId).broadcast.emit('userStopSpeak', userInfo)
    })

    socket.on('whiteboard-drawing', (data) => {
      socket.to(socket.meetingId).broadcast.emit('whiteboardDrawing', data)
    })

    socket.on('call-connect', (peerId) => {
      socket.user = {
        ...userInfo,
        peerId
      }
      socket.to(socket.meetingId).broadcast.emit('callConnected', userInfo, peerId)
    })


  });

server.listen(port, () => {
  console.log(`listen on port ${port}`)
})

global.io = io