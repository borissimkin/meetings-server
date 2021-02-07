const { Sequelize, Model, DataTypes } = require('sequelize');
//todo: вынести в конфиг
const sequelize = new Sequelize('postgresql://postgres:postgres@localhost:5432/meetings');


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


