const sequelize = require("./index");
const {Meeting} = require("./Meeting");
const { Model, DataTypes } = require('sequelize');
const { User } = require("./User");

class UserExamState extends Model {}
UserExamState.init({
  prepareStart: {
    type: DataTypes.DATE,
  },
  minutesToPrepare: {
    type: DataTypes.INTEGER
  }
}, { sequelize, modelName: 'user_exam_state' });

Meeting.hasMany(UserExamState)
User.hasMany(UserExamState)

module.exports = {
  UserExamState
}
