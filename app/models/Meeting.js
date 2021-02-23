const sequelize = require("./index");
const { Model, DataTypes } = require('sequelize');
const { User } = require("./User");
const { Room } = require("./Room");

class Meeting extends Model {}
Meeting.init({
  name: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  hashId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  startDate: {
    type: DataTypes.DATE,
  },
  startTime: {
    type: DataTypes.TIME
  },

  endTime: {
    type: DataTypes.TIME
  },
  isExam: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },

  isCheckListeners: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
}, { sequelize, modelName: 'meeting' });

User.hasMany(Meeting, {as: "UserMeetings"})
Room.hasMany(Meeting, {as: "RoomMeetings"})

module.exports = {
  Meeting
}
