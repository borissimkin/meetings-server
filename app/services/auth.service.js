const jwt = require('jsonwebtoken')
require('dotenv').config()

const generateToken = user => {
  console.log({user})
  const data =  {
    id: user.id,
    name: user.name,
    email: user.email
  };
  const signature = process.env.TOKEN_SECRET;
  const expiration = '6h';

  return jwt.sign({ data, }, signature, { expiresIn: expiration });

}

module.exports = {
  generateToken
}