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
const {createMessageForApi} = require("./common/helpers");
const {findMeetingByHashId} = require("./common/helpers");


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
app.use(require('./routes/meeting'))


app.use('/*', express.static(__dirname + '/dist'));

//todo: не знаю в какие файлики ложить
const createVisitorIfNotExist = async (meetingHashId, userId) => {
  const meeting = await findMeetingByHashId(meetingHashId)
  if (!meeting) {
    console.error(`Meeting with hashId=${meetingHashId} not exist`)
    return
  }
  const visitor = await Visitor.findOne({
    where: {
      userId,
      meetingId: meeting.id
    }
  })
  if (!visitor) {
    await Visitor.create({
      userId: userId,
      meetingId: meeting.id
    })
  }
}

const userCanStartCheckListeners = (meeting, userId) => {
  return meeting.creatorId === userId

}

io.sockets
  .on('connection', socketioJwt.authorize({             
    secret: process.env.TOKEN_SECRET,
    timeout: 15000 // 15 seconds to send the authentication message
  }))
  .on('authenticated', async (socket) => {
    const user = await User.findByPk(socket.decoded_token.data.id)
    if (!user) {
      return
    }
    console.log(socket.adapter.rooms);

    const userInfo = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName
    }
    socket.on('join-meeting', async (meetingId) => {
      socket.join(meetingId)
      await createVisitorIfNotExist(meetingId, userInfo.id)
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

    socket.on('new-message', async data => {
      const meeting = await findMeetingByHashId(socket.meetingId)
      const message = await Message.create({
        text: data.message.text,
        userId: userInfo.id,
        meetingId: meeting.id
      })
      const apiMessage = createMessageForApi(message, userInfo)
      io.in(socket.meetingId).emit('newMessage', apiMessage);
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

    socket.on('check-listeners', async () => {
      //todo: делать интервал в которое можно подтвердить присутствие
      const meeting = await findMeetingByHashId(socket.meetingId)
      if (!meeting) {
        return
      }
      if (!userCanStartCheckListeners(meeting, socket.user.id)) {
        return
      }
      const attendanceCheckpoint = await AttendanceCheckpoint.create({
        meetingId: meeting.id
      })
      socket.to(socket.meetingId).broadcast.emit('checkListeners', {
        id: attendanceCheckpoint.id
      })
    })

    socket.on('pass-check-listeners', async (checkpointId) => {
      const checkpoint = await AttendanceCheckpoint.findByPk(checkpointId)
      if (!checkpoint) {
        return
      }
      const meeting = await findMeetingByHashId(socket.meetingId)
      if (checkpoint.meetingId !== meeting.id) {
        console.log(`Attendance check user=${id} meeting not equals`)
        return
      }
      const visitor = await Visitor.findOne({
        where: {
          userId: socket.user.id,
          meetingId: meeting.id
        }
      })
      await VisitorAttendanceCheck.create({
        visitorId: visitor.id,
        attendanceCheckpointId: checkpoint.id
      })

    })


  });

server.listen(port, () => {
  console.log(`listen on port ${port}`)
})

global.io = io