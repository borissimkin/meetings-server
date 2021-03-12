const router = require('express').Router();
const isAuth = require('../middlewares/is-auth')
const {Sequelize} = require("sequelize");
const {UserMeetingState} = require("../models/UserMeetingsState");
const {createMessageForApi} = require("../common/helpers");
const {User} = require("../models/User");
const {Message} = require("../models/Message");
const {findMeetingByHashId} = require("../common/helpers");
const {createUuid} = require("../common/uuid");
const {Room} = require("../models/Room");
const {Meeting} = require("../models/Meeting");

const getConnectedParticipantsOfMeeting = (meetingHashId, currentUserId) => {
  const meeting = io.sockets.adapter.rooms[meetingHashId]
  const connectedParticipant = []
  if (!meeting) {
    return connectedParticipant
  }
  const sockets = meeting.sockets
  for (let socketId of Object.keys(sockets)) {
    let clientSocket = io.sockets.connected[socketId];
    if (clientSocket.user) {
      if (clientSocket.user.id === currentUserId) {
        continue
      }
      connectedParticipant.push({
        user: {
          id: clientSocket.user.id,
          firstName: clientSocket.user.firstName,
          lastName: clientSocket.user.lastName
        },
        peerId: clientSocket.user.peerId,
      })
    }
  }
  return connectedParticipant
}

router.get('/api/meeting/:id/peers', isAuth, (req, res) => {
  const meetingHashId = req.params.id
  const currentUser = req.currentUser.dataValues;
  res.jsonp(getConnectedParticipantsOfMeeting(meetingHashId, currentUser.id))
})

/**
 * {
 *   userId: {
 *     enabledVideo
 *     ...
 *   },
 *   ...
 * }
 * **/
router.get('/api/meeting/:id/states-participants', isAuth, async (req, res) => {
  const meetingHashId = req.params.id
  const currentUser = req.currentUser.dataValues;
  const connectedParticipants = getConnectedParticipantsOfMeeting(meetingHashId, currentUser.id)
  const meeting = await Meeting.findOne({
    where: {
      hashId: meetingHashId
    }
  })
  const participantIds = connectedParticipants.map(participant => participant.user.id)
  const meetingStates = await UserMeetingState.findAll({
    where: {
      meetingId: meeting.id,
      userId: {
        [Sequelize.Op.in]: participantIds
      }
    },
  })
  const result = {}
  meetingStates.forEach(meetingState => {
    result[meetingState.userId] = {
      enabledVideo: meetingState.enabledVideo,
      enabledAudio: meetingState.enabledAudio,
      isRaisedHand: meetingState.isRaisedHand
    }
  })
  res.jsonp(result)

})

/** input
 * {
 *   roomId,
 *   name,
 *   startDate,
 *   startTime,
 *   endTime,
 *   isCheckListeners,
 *   isExam
 * },
 * output {
 *   id
 *   name,
 *   hashId
 *   startDate,
 *   startTime,
 *   endTime,
 *   isCheckListeners,
 *   isExam,
 *   creator {
 *     id,
 *     firstName,
 *     lastName
 *   }
 * }
 * **/
router.post('/api/meeting/', isAuth, async (req, res) => {
  const {id, firstName, lastName} = {...req.currentUser.dataValues}
  const {roomId, name, startDate, startTime, endTime, isCheckListeners, isExam} = {...req.body}
  const room = await Room.findOne({
    where: {
      hashId: roomId
    }
  })
  if (!room) {
    res.sendStatus(404)
  }
  const hashId = createUuid()

  const meeting = await Meeting.create({
    name,
    roomId: room.id,
    startDate,
    startTime,
    endTime,
    isCheckListeners,
    isExam,
    hashId,
    creatorId: id
  })
  const creator = {
    id,
    firstName,
    lastName
  }
  res.json({
    id: meeting.id,
    name,
    hashId,
    startDate,
    startTime,
    endTime,
    isCheckListeners,
    isExam,
    creator,
    createdAt: meeting.createdAt

  })
})


router.get('/api/room/:roomId/meeting/:meetingId/exists', isAuth, async (req, res) => {
  const roomHashId = req.params.roomId
  const meetingHashId = req.params.meetingId
  const room = await Room.findOne({
    where: {
      hashId: roomHashId
    }
  })
  if (room) {
    const meeting = await Meeting.findOne({
      where: {
        roomId: room.id,
        hashId: meetingHashId
      }
    })
    if (meeting) {
      return res.jsonp({
        exists: true
      })
    }
  }
  res.jsonp({
    exists: false
  })
})

router.get('/api/meeting/:meetingId/messages', isAuth, async (req, res) => {
  const meetingHashId = req.params.meetingId
  const meeting = await findMeetingByHashId(meetingHashId)
  const messages = await Message.findAll({
    where: {
      meetingId: meeting.id
    }
  })
  const result = await Promise.all(
    messages.map(async message => {
      const user = await User.findByPk(message.userId)
      return createMessageForApi(message, user)
    })
  )
  res.json(result)
})

router.get('/api/meeting/:meetingId', isAuth, async (req, res) => {
  const meetingHashId = req.params.meetingId
  const meeting = await findMeetingByHashId(meetingHashId)
  res.json({...meeting.dataValues})
})

module.exports = router
