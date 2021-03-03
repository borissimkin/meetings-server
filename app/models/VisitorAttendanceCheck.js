const sequelize = require("./index");
const { Model, DataTypes } = require('sequelize');
const { User } = require("./User");
const { Meeting } = require("./Meeting");
const { AttendanceCheckpoint } = require("./AttendanceCheckpoint");
const { Visitor } = require("./Visitor");

class VisitorAttendanceCheck extends Model {}
VisitorAttendanceCheck.init({

}, {sequelize, tableName: 'visitor_attendance_check'})

AttendanceCheckpoint.hasMany(VisitorAttendanceCheck, {foreignKey: "attendanceCheckpointId"})
Visitor.hasMany(VisitorAttendanceCheck, {foreignKey: "visitorId"})

module.exports = {
  VisitorAttendanceCheck
}


