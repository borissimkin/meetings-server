const {AttendanceCheckpoint} = require("../models/AttendanceCheckpoint");
const {Meeting} = require("../models/Meeting");
const { Op } = require('sequelize')

const startAttendanceCheck = async () => {
  const countAttendanceCheckpoints = 5
  console.log('защед');
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
    console.log({minutesListenerCheckInterval});
    console.log({durationMeeting});
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
    //todo: посчитать время с последней проверки
    // todo: отправить проверки




  }
  console.log('Done!');
}

const getLastCheckpoint = (checkpoints) => {
  const ids = checkpoints.map(checkpoint => checkpoint.id)
  const maxId = Math.max(...ids)
  return checkpoints.find(checkpoint => checkpoint.id === maxId)
}

const getFullMinutesFromTime = (time) => {
  const splitTime = time.split(':');
  return parseInt(splitTime[0]) * 60 + parseInt(splitTime[1]);
}

const getTimeFromDatetime = (datetime) => {
  return new Date(datetime).toTimeString().split(" ")[0];
}

const getDateFromDatetime = (datetime) => {
  return new Date(datetime).toISOString().slice(0, 10)
}

// module.exports = setInterval(intervalFunc, 1000 * 60);
module.exports = setInterval(startAttendanceCheck, 1000);
