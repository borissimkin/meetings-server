const sequelize = require("./index");
const {Meeting} = require("./Meeting");
const { Model, DataTypes } = require('sequelize');
const { User } = require("./User");

class WhiteboardData extends Model {}
WhiteboardData.init({
  drawings: {
    type: DataTypes.TEXT
  }
}, { sequelize, modelName: 'whiteboard_data' });

Meeting.hasMany(WhiteboardData)
User.hasMany(WhiteboardData)

module.exports = {
  WhiteboardData
}
