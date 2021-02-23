const sequelize = require("./index");
const { Model, DataTypes } = require('sequelize');
const { User } = require("./User");
const { Meeting } = require("./Meeting");
const { AttendanceCheckpoint } = require("./AttendanceCheckpoint");
const { Visitor } = require("./Visitor");

class VisitorAttendanceCheck extends Model {}
VisitorAttendanceCheck.init({
  passedCheck: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  }

}, {sequelize, tableName: 'visitor_attendance_check'})

AttendanceCheckpoint.hasMany(VisitorAttendanceCheck)
Visitor.hasMany(VisitorAttendanceCheck)

module.exports = {
  VisitorAttendanceCheck
}


