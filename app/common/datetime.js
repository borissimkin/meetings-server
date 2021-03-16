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
module.exports = {
  getFullMinutesFromTime,
  getTimeFromDatetime,
  getDateFromDatetime
}
