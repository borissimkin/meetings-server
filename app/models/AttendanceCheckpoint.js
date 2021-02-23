const sequelize = require("./index");
const { Model, DataTypes } = require('sequelize');
const { User } = require("./User");
const { Meeting } = require("./Meeting");

class AttendanceCheckpoint extends Model {}
AttendanceCheckpoint.init({}, {sequelize, tableName: 'attendance_checkpoint'})


Meeting.hasMany(AttendanceCheckpoint)


module.exports = {
  AttendanceCheckpoint
}


