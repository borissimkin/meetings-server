const jwt = require('jsonwebtoken');
const createError = require('http-errors')
require('dotenv').config();
const {User} = require("../models/User");


const getTokenFromHeader = (req) => {
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    return req.headers.authorization.split(' ')[1];
  }
}


module.exports = async  (req, res, next) => {
  const token = getTokenFromHeader(req);
  if (!token) {
    return next(createError(401));
  }
  try {
    const decoded = jwt.verify(token,  process.env.TOKEN_SECRET);
    const user = await User.findOne({ where: {
        id: decoded.data.id
      }
    })
    if (!user) {
      return next(createError(401));
    }
    req.currentUser = user;
    next()
  } catch (error) {
    return next(createError(401));
  }
}