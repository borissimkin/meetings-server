const sequelize = require("./index");
const {Meeting} = require("./Meeting");
const { Model, DataTypes } = require('sequelize');
const { User } = require("./User");

class Exam extends Model {}
Exam.init({
  minutesToPrepare: {
    type: DataTypes.INTEGER,
  },
}, { sequelize, modelName: 'exam' });

Meeting.hasOne(Exam)
User.hasOne(Exam, {foreignKey: "respondedUserId"})

module.exports = {
  Exam
}
