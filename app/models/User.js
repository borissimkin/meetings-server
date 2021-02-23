const sequelize = require("./index");
const { Model, DataTypes } = require('sequelize');

class User extends Model {}
User.init({
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, { sequelize, modelName: 'user' });


module.exports = {
  User
}


