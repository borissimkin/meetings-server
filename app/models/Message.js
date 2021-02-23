const sequelize = require("./index");
const { Model, DataTypes } = require('sequelize');
const { User } = require("./User");

class Message extends Model {}
Message.init({
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, { sequelize, modelName: 'message' });

User.hasMany(Message)


module.exports = {
  Message
}
