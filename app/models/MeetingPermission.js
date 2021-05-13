const sequelize = require("./index");
const {Meeting} = require("./Meeting");
const { Model, DataTypes } = require('sequelize');
const { User } = require("./User");

class MeetingPermission extends Model {}
MeetingPermission.init({
  canDrawing: {
    type: DataTypes.BOOLEAN
  }
}, { sequelize, modelName: 'meeting_permission' });

Meeting.hasMany(MeetingPermission)
User.hasMany(MeetingPermission)

module.exports = {
  MeetingPermission
}
