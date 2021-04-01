const {Sequelize} = require("sequelize");
require('dotenv').config()

const sequelize = new Sequelize(`postgresql://${process.env.DATABASE_PATH}`, {
  logging: false
});

module.exports = sequelize;
