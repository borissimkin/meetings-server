const {UserMeetingState} = require("../models/UserMeetingsState");
const {Visitor} = require("../models/Visitor");
const {Meeting} = require('../models/Meeting')

const findMeetingByHashId = meetingHashId => {
  return Meeting.findOne({
    where: {
      hashId: meetingHashId
    }
  })
}

const findUserMeetingsState = (meetingId, userId) => {
  return UserMeetingState.findOne({
    where: {
      meetingId,
      userId,

    },
  })
}

const createUserDTO = user => {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName
  }

}

const createMessageDTO = (message, user) => {
  return {
    message: {
      id: message.id,
      text: message.text,
      date: message.createdAt,
    },
    user: createUserDTO(user)
  }
}

//todo: оказывается  библиотекие уже в есть такая функция
const createVisitorIfNotExist = async (meetingId, userId) => {
  let visitor = await Visitor.findOne({
    where: {
      userId,
      meetingId
    }
  })
  if (!visitor) {
    visitor = await Visitor.create({
      userId,
      meetingId
    })
  }
  return visitor
}

const createUserMeetingStateIfNotExist = async (meetingId, userId) => {
  let userMeetingState = await UserMeetingState.findOne({
    where: {
      userId,
      meetingId
    }
  })
  if (!userMeetingState) {
    userMeetingState = await UserMeetingState.create({
      userId,
      meetingId
    })
  }
  return userMeetingState
}
const userCanStartCheckListeners = (meeting, userId) => {
  return meeting.creatorId === userId
}


const resetUserMeetingState = (userMeetingState) => {
  const defaultValues = {
    isRaisedHand: false,
    enabledAudio: false,
    enabledVideo: false
  }
  return userMeetingState.update(defaultValues)
}

module.exports = {
  createVisitorIfNotExist,
  createUserMeetingStateIfNotExist,
  findMeetingByHashId,
  createMessageDTO,
  userCanStartCheckListeners,
  resetUserMeetingState,
  findUserMeetingsState,
  createUserDTO,

}
