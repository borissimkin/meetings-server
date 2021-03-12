const sequelize = require("./index");
const { Model, DataTypes } = require('sequelize');
const { User } = require("./User");
const { Meeting } = require("./Meeting");

class UserMeetingState extends Model {}
UserMeetingState.init({
  enabledVideo: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  enabledAudio: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isRaisedHand: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }

}, { sequelize, tableName: "user_meeting_state" });

User.hasMany(UserMeetingState, {as: "UserMeetingState",})
Meeting.hasMany(UserMeetingState)


module.exports = {
  UserMeetingState
}


