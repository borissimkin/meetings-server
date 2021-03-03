const {Meeting} = require('../models/Meeting')

const findMeetingByHashId = meetingHashId => {
  return Meeting.findOne({
    where: {
      hashId: meetingHashId
    }
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

module.exports = {
  findMeetingByHashId,
  createMessageForApi
}