const express = require('express')
const app = require('express')();
const socket = require('socket.io');
const cors = require('cors')

const {User} = require("./models/User");
const {Message} = require('./models/Message')
const {Room} = require('./models/Room')
const {AttendanceCheckpoint} = require('./models/AttendanceCheckpoint');
const {Meeting} = require('./models/Meeting');
const {UserMeetingState} = require('./models/UserMeetingsState');
const {Visitor} = require('./models/Visitor');
const {VisitorAttendanceCheck} = require('./models/VisitorAttendanceCheck');
const {Exam} = require('./models/Exam');
const {UserExamState} = require('./models/UserExamState');
const {WhiteboardData} = require('./models/WhiteboardData');

const sequelize = require('./models/index')

const {PeerServer} = require('peer')
const bodyParser = require('body-parser')
const socketioJwt = require("socketio-jwt");
const {userCanStartCheckListeners} = require("./common/helpers");
const {findUserMeetingsState} = require("./common/helpers");
const {resetUserMeetingState} = require("./common/helpers");
const {createUserMeetingStateIfNotExist} = require("./common/helpers");
const {createVisitorIfNotExist} = require("./common/helpers");
const {createMessageDTO, createUserDTO} = require("./common/helpers");
const {findMeetingByHashId} = require("./common/helpers");
const attendanceInterval = require("./schedulers/attendanceScheduler")
const {sendCheckListeners} = require("./common/helpers");
const fs = require('fs');
const {createWhiteboardDataDTO} = require("./common/helpers");
const {Sequelize} = require("sequelize");
const {getConnectedParticipantsOfMeeting} = require("./common/helpers");
const {createExamUserStateDTO} = require("./common/helpers");
const {createUserExamStateIfNotExist} = require("./common/helpers");


const sslOptions = {}
let httpServer;
const pathKeyFile = "key.pem"
const pathCertFile = "cert.pem"
if (fs.existsSync(pathKeyFile) && fs.existsSync(pathCertFile)) {
  sslOptions.key = fs.readFileSync(pathKeyFile)
  sslOptions.cert = fs.readFileSync(pathCertFile)
  httpServer = require('https');
} else {
  console.log("SSL certificates not found.")
  httpServer = require('http');
}
const server = httpServer.createServer(sslOptions, app);

const io = socket(server)

app.use(cors())

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

const peerServerPort = process.env.PEER_SERVER_PORT || 3001
PeerServer({path: '/', port: peerServerPort, ssl: sslOptions})

console.log(`Work directory= ${__dirname}`)

sequelize.sync()


const port = process.env.PORT || 3000


app.use(express.static(__dirname + '/dist'));


app.use(require('./routes/room'))
app.use('/api', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'))
app.use(require('./routes/meeting'))


app.use('/*', express.static(__dirname + '/dist'));

const secondsIntervalSocketAuthMessage = 15

io.sockets
  .on('connection', socketioJwt.authorize({
    secret: process.env.TOKEN_SECRET,
    timeout: secondsIntervalSocketAuthMessage * 1000
  }))
  .on('authenticated', async (socket) => {
    const user = await User.findByPk(socket.decoded_token.data.id)
    if (!user) {
      return
    }
    console.log(socket.adapter.rooms);

    const userInfo = createUserDTO(user)
    socket.on('join-meeting', async (meetingId, settingDevices) => {
      const meeting = await findMeetingByHashId(meetingId)
      const {enabledVideo, enabledAudio} = {...settingDevices}
      if (!meeting) {
        console.error(`Meeting with hashId=${meetingId} not exist`)
        return
      }
      socket.meetingId = meetingId;
      socket.join(meetingId)
      await createVisitorIfNotExist(meeting.id, userInfo.id)
      const userMeetingState = await createUserMeetingStateIfNotExist(meeting.id, userInfo.id)
      await userMeetingState.update({
        enabledVideo,
        enabledAudio
      })
      socket.to(meetingId).broadcast.emit('userConnected', userInfo, settingDevices)
      if (meeting.isExam && meeting.creatorId !== userInfo.id) {
        const examState = await createUserExamStateIfNotExist(meeting.id, userInfo.id)
        socket.to(meetingId).broadcast.emit('studentConnected', createExamUserStateDTO(examState))
      }
    });

    socket.on('leave-meeting', async (meetingId) => {
      const meeting = await findMeetingByHashId(meetingId)
      const userMeetingState = await findUserMeetingsState(meeting.id, userInfo.id)
      await resetUserMeetingState(userMeetingState)
      socket.leave(meetingId, (error) => {
        socket.to(meetingId).broadcast.emit('userDisconnected', userInfo)
        if (error) {
          console.log(error)
        }
      })
    })

    socket.on('disconnect', async () => {
      if (!socket.meetingId) {
        return
      }
      const meeting = await findMeetingByHashId(socket.meetingId)
      if (!meeting) {
        return
      }
      const userMeetingState = await findUserMeetingsState(meeting.id, userInfo.id)
      if (userMeetingState) {
        await resetUserMeetingState(userMeetingState)
      }
      socket.to(socket.meetingId).broadcast.emit('userDisconnected', userInfo)
    })

    socket.on('new-message', async data => {
      const meeting = await findMeetingByHashId(socket.meetingId)
      const message = await Message.create({
        text: data.message.text,
        userId: userInfo.id,
        meetingId: meeting.id
      })
      const apiMessage = createMessageDTO(message, userInfo)
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

    socket.on('whiteboard-end-drawing', async (data) => {
      const meeting = await findMeetingByHashId(socket.meetingId)
      const drawings = JSON.stringify(data)
      console.log({ drawings })
      const whiteboardData = await WhiteboardData.create({
        userId: userInfo.id,
        meetingId: meeting.id,
        drawings
      })
      io.in(socket.meetingId).emit('whiteboardEndDrawing', createWhiteboardDataDTO(whiteboardData))


    })

    socket.on('raise-hand', async isRaisedHand => {
      const meeting = await findMeetingByHashId(socket.meetingId)
      const userMeetingState = await findUserMeetingsState(meeting.id, userInfo.id)
      await userMeetingState.update({isRaisedHand})
      socket.to(socket.meetingId).broadcast.emit('raisedHand', userInfo.id, isRaisedHand)
    })

    socket.on('toggle-audio', async enabledAudio => {
      const meeting = await findMeetingByHashId(socket.meetingId)
      const userMeetingState = await findUserMeetingsState(meeting.id, userInfo.id)
      await userMeetingState.update({enabledAudio})
      socket.to(socket.meetingId).broadcast.emit('toggleAudio', userInfo.id, enabledAudio)
    })

    socket.on('toggle-video', async enabledVideo => {
      const meeting = await findMeetingByHashId(socket.meetingId)
      const userMeetingState = await findUserMeetingsState(meeting.id, userInfo.id)
      await userMeetingState.update({enabledVideo})
      socket.to(socket.meetingId).broadcast.emit('toggleVideo', userInfo.id, enabledVideo)
    })

    socket.on('call-connect', (peerId) => {
      socket.user = {
        ...userInfo,
        peerId
      }
      socket.to(socket.meetingId).broadcast.emit('callConnected', userInfo, peerId)
    })

    socket.on('change-minutes-to-prepare-exam', async (minutesToPrepare) => {
      const meeting = await findMeetingByHashId(socket.meetingId)
      if (meeting.creatorId !== user.id) {
        return
      }
      const exam = await Exam.findOne({
        where: {
          meetingId: meeting.id
        }
      })
      await exam.update({ minutesToPrepare })
      socket.to(socket.meetingId).broadcast.emit('changeMinutesToPrepareExam', minutesToPrepare)

    })

    socket.on('check-listeners', async () => {
      //todo: делать интервал в которое можно подтвердить присутствие
      const meeting = await findMeetingByHashId(socket.meetingId)
      if (!userCanStartCheckListeners(meeting, socket.user.id)) {
        return
      }
      await sendCheckListeners(meeting)
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

      socket.to(socket.meetingId).broadcast.emit('passCheckListeners', checkpointId, socket.user.id)

    })


  });

server.listen(port, () => {
  console.log(`listen on port ${port}`)
})

global.io = io
