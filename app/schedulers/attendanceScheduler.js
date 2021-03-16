const {sendCheckListeners} = require("../common/helpers");
const {getDateFromDatetime} = require("../common/datetime");
const {getTimeFromDatetime} = require("../common/datetime");
const {getFullMinutesFromTime} = require("../common/datetime");
const {AttendanceCheckpoint} = require("../models/AttendanceCheckpoint");
const {Meeting} = require("../models/Meeting");
const { Op } = require('sequelize')

const startAttendanceCheck = async () => {
  const countAttendanceCheckpoints = 5 // потом будет вводить пользователь при создании собрания
  const today = new Date()
  const currentTime = getTimeFromDatetime(today)
  const currentDate = getDateFromDatetime(today)

  const currentMeetings = await Meeting.findAll({
    where: {
      startTime: {
        [Op.lte]: currentTime,
      },
      endTime: {
        [Op.gte]: currentTime
      },
      startDate: {
        [Op.eq]: currentDate
      },
      isCheckListeners: true
    }
  })

  for (const meeting of currentMeetings) {
    const durationMeeting = getFullMinutesFromTime(meeting.endTime) - getFullMinutesFromTime(meeting.startTime)
    const minutesListenerCheckInterval = durationMeeting / countAttendanceCheckpoints;
    const attendanceCheckpoints = await AttendanceCheckpoint.findAll({
      where: {
        meetingId: meeting.id
      }
    })
    const lastCheckpoint = getLastCheckpoint(attendanceCheckpoints)
    let referencePoint = meeting.startTime
    if (lastCheckpoint) {
      referencePoint = getTimeFromDatetime(lastCheckpoint.createdAt)
    }
    const minutesPassed = getFullMinutesFromTime(currentTime) - getFullMinutesFromTime(referencePoint)
    if (minutesPassed >= minutesListenerCheckInterval) {
      await sendCheckListeners(meeting)
    }
  }
}

const getLastCheckpoint = (checkpoints) => {
  const ids = checkpoints.map(checkpoint => checkpoint.id)
  const maxId = Math.max(...ids)
  return checkpoints.find(checkpoint => checkpoint.id === maxId)
}

module.exports = setInterval(startAttendanceCheck, 1000 * 30);
