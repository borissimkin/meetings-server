const sequelize = require("./index");
const { Model, DataTypes } = require('sequelize');
const { User } = require("./User");

class Room extends Model {}
Room.init({
  name: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  hashId: {
    type: DataTypes.STRING,
    allowNull: false,

  }
}, { sequelize, modelName: 'room' });

User.hasMany(Room, {as: "UserRooms", foreignKey: "creatorId"})


module.exports = {
  Room
}
