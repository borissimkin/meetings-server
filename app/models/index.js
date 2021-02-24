const {Sequelize} = require("sequelize");
//todo: вынести в конфиг

const sequelize = new Sequelize('postgresql://postgres:postgres@localhost:5432/meetings', {
  logging: false
});

module.exports = sequelize;
