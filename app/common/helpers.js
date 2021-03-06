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

const createMessageForApi = (message, user) => {
  return {
    message: {
      id: message.id,
      text: message.text,
      date: message.createdAt,
    },
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName
    }
  }
}

const createVisitorIfNotExist = async (meetingId, userId) => {
  const visitor = await Visitor.findOne({
    where: {
      userId,
      meetingId
    }
  })
  if (!visitor) {
    await Visitor.create({
      userId,
      meetingId
    })
  }
}

const createUserMeetingStateIfNotExist = async (meetingId, userId) => {
  const userMeetingState = await UserMeetingState.findOne({
    where: {
      userId,
      meetingId
    }
  })
  if (!userMeetingState) {
    await UserMeetingState.create({
      userId,
      meetingId
    })
  }
}
const userCanStartCheckListeners = (meeting, userId) => {
  return meeting.creatorId === userId
}


const resetUserMeetingState = (userMeetingState) => {
  const defaultValues = {
    isRaiseHand: false,
    enabledAudio: false,
    enabledVideo: false
  }
  return userMeetingState.update(defaultValues)
}

module.exports = {
  createVisitorIfNotExist,
  createUserMeetingStateIfNotExist,
  findMeetingByHashId,
  createMessageForApi,
  userCanStartCheckListeners,
  resetUserMeetingState,
  findUserMeetingsState,

}
