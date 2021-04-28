const router = require('express').Router();
const isAuth = require('../middlewares/is-auth')
const {getConnectedParticipantsOfMeeting} = require("../common/helpers");
const {createExamUserStateDTO} = require("../common/helpers");
const {UserExamState} = require("../models/UserExamState");
const {Exam} = require("../models/Exam");
const {createMeetingDTO} = require("../common/helpers");
const {VisitorAttendanceCheck} = require("../models/VisitorAttendanceCheck");
const {AttendanceCheckpoint} = require("../models/AttendanceCheckpoint");
const {createUserDTO} = require("../common/helpers");
const {Visitor} = require("../models/Visitor");
const {Sequelize} = require("sequelize");
const {UserMeetingState} = require("../models/UserMeetingsState");
const {createMessageDTO} = require("../common/helpers");
const {User} = require("../models/User");
const {Message} = require("../models/Message");
const {findMeetingByHashId} = require("../common/helpers");
const {createUuid} = require("../common/uuid");
const {Room} = require("../models/Room");
const {Meeting} = require("../models/Meeting");


const currentUserIsConnectedToMeeting = (meetingHashId, currentUserId) => {
  const meeting = io.sockets.adapter.rooms[meetingHashId]
  if (!meeting) {
    return false
  }
  const sockets = meeting.sockets
  for (let socketId of Object.keys(sockets)) {
    let clientSocket = io.sockets.connected[socketId];
    if (clientSocket.user) {
      if (clientSocket.user.id === currentUserId) {
        return true
      }
    }
  }
  return false
}

/**
 * Возвращает всех участников, кто хоть раз заходил в собрание, не включая текущего пользователя.
 * [{
 *   user: {
          id:
          firstName:
          lastName:
        },
     peerId:,
     online: true|false
 * },
 * {
 *   ...
 * }
 *
 * ]
 * **/
router.get('/api/meeting/:id/all-participants', isAuth, async (req, res) => {
  const meetingHashId = req.params.id
  const currentUser = req.currentUser.dataValues;
  const onlineParticipants = getConnectedParticipantsOfMeeting(meetingHashId, currentUser.id)
  const meeting = await findMeetingByHashId(meetingHashId)
  const visitors = await Visitor.findAll({
    where: {
      meetingId: meeting.id,
      userId: {
        [Sequelize.Op.ne]: currentUser.id
      }
    },
  })
  const result = await Promise.all(
    visitors.map(async visitor => {
      const user = await User.findByPk(visitor.userId)
      const participant = onlineParticipants.find(participant => participant.user.id === user.id)
      const online = !!participant
      let peerId = ""
      if (participant) {
        peerId = participant.peerId
      }
      return {
        user: createUserDTO(user),
        online,
        peerId
      }
    })
  )
  res.json(result)
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
  if (meeting.isExam) {
    await Exam.create({
      meetingId: meeting.id,
    })
  }
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


router.get(`/api/room/:roomId/meeting/:meetingId/can-connect`, isAuth, async (req, res) => {
  const roomHashId = req.params.roomId
  const meetingHashId = req.params.meetingId
  const room = await Room.findOne({
    where: {
      hashId: roomHashId
    }
  })
  if (!room) {
    res.status(404).send()
  }
  const meeting = await Meeting.findOne({
    where: {
      roomId: room.id,
      hashId: meetingHashId
    }
  })
  if (!meeting) {
    res.status(404).send()
  }
  const currentUser = req.currentUser.dataValues;
  const currentUserWasConnected = currentUserIsConnectedToMeeting(meetingHashId, currentUser.id)
  if (currentUserWasConnected) {
    res.status(400).send()

  }
  res.status(200).send()
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
      return createMessageDTO(message, user)
    })
  )
  res.json(result)
})

router.get('/api/meeting/:meetingId', isAuth, async (req, res) => {
  const meetingHashId = req.params.meetingId
  const meeting = await findMeetingByHashId(meetingHashId)

  res.json(await createMeetingDTO(meeting))
})

/**
 * [
 *    {
 *     id,
 *     createdAt
 *     userIds: []

 *   },
 *   {
 *     id,
 *     createdAt,
 *     userIds: []
 *   }
 *
 * ]
 *
 *
 * **/
router.get('/api/meeting/:meetingId/checkpoints', isAuth, async (req, res) => {
  const meetingHashId = req.params.meetingId
  const meeting = await findMeetingByHashId(meetingHashId)
  const checkpoints = await AttendanceCheckpoint.findAll({
    where: {
      meetingId: meeting.id
    }
  })

  const result = await Promise.all(
    checkpoints.map(async checkpoint => {
      let visitorIds = await VisitorAttendanceCheck.findAll({
        attributes: ['visitorId'],
        where: {
          attendanceCheckpointId: checkpoint.id
        }
      })
      visitorIds = visitorIds.map(x => x.get("visitorId"))

      let userIds = await Visitor.findAll({
        attributes: ['userId'],
        where: {
          meetingId: meeting.id,
          id: {
            [Sequelize.Op.in]: visitorIds
          }
        },
      })
      userIds = userIds.map(u => u.get("userId"))

      return {
        "id": checkpoint.id,
        "createdAt": checkpoint.createdAt,
        userIds
      }
    })
  )
  res.json(result)
})

router.get('/api/meeting/:meetingId/exam', isAuth, async (req, res) => {
  const meetingHashId = req.params.meetingId
  const meeting = await findMeetingByHashId(meetingHashId)
  const exam = await Exam.findOne({
    where: {
      meetingId: meeting.id
    },
    raw: true
  })
  const { minutesToPrepare, respondedUserId} = { ...exam }
  res.json({
    minutesToPrepare,
    respondedUserId
  })
})

router.get('/api/meeting/:meetingId/exam/student-states', isAuth, async (req, res) => {
  const meetingHashId = req.params.meetingId
  const meeting = await findMeetingByHashId(meetingHashId)

  const userExamStates = await UserExamState.findAll({
    where: {
      meetingId: meeting.id
    }
  })
  const result = userExamStates.map(examState => createExamUserStateDTO(examState))
  res.json(result)
})

router.put(`/api/meeting/:meetingId/exam/start-all-preparation`, isAuth, async (req, res) => {
  const meetingHashId = req.params.meetingId
  const currentUser = req.currentUser.dataValues;
  const meeting = await findMeetingByHashId(meetingHashId)
  if (meeting.creatorId !== currentUser.id) {
    return res.status(403).send()
  }
  const onlineParticipants = getConnectedParticipantsOfMeeting(meetingHashId, currentUser.id)
  const participantIds = onlineParticipants.map(participant => participant.user.id)
  let examStates = await UserExamState.findAll({
    where: {
      meetingId: meeting.id,
      prepareStart: null,
      userId: {
        [Sequelize.Op.in]: participantIds
      }
    },
  })
  const prepareStart = new Date()
  const examStatesUserIds = examStates.map(examState => examState.userId)
  await UserExamState.update({ prepareStart },{
    where: {
      meetingId: meeting.id,
      userId: {
        [Sequelize.Op.in]: examStatesUserIds
      }
    },
  })
  examStates = await UserExamState.findAll({
    where: {
      meetingId: meeting.id,
      prepareStart: null,
      userId: {
        [Sequelize.Op.in]: examStatesUserIds
      }
    },
  })

  const result = examStates.map(examState => createExamUserStateDTO(examState))

  io.in(meetingHashId).emit('startAllPreparation', result);
  res.status(200).send()

})

module.exports = router
