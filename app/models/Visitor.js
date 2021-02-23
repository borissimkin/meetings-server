const sequelize = require("./index");
const { Model, DataTypes } = require('sequelize');
const { User } = require("./User");
const { Meeting } = require("./Meeting");

class Visitor extends Model {}
Visitor.init({}, {sequelize, tableName: "visitor"})

User.hasMany(Visitor)
Meeting.hasMany(Visitor)


module.exports = {
  Visitor
}


