const jwt = require("express-jwt");
require('dotenv').config();

const getTokenFromHeader = (req) => {
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    return req.headers.authorization.split(' ')[1];
  }
}


export default jwt({
  secret: process.env.TOKEN_SECRET,
  userProperty: 'token',
  getToken: getTokenFromHeader,
  
})