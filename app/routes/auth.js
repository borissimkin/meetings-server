const {generateToken} = require("../services/auth-service");
const {verifyPassword} = require("../common/hash");
const {User} = require("../models/User");
const {hashPassword} = require("../common/hash");
const router = require('express').Router();


/** input:
 * {
 *   firstName,
 *   lastName,
 *   email,
 *   password,
 * }**/
router.post('/sign-up', async (req, res, next) => {
  const {password, firstName, lastName, email} = {...req.body}
  //todo: проверка что такой email уже есть + валидация
  try {
    const passwordHashed = await hashPassword(String(password))
    const user = await User.create({
      password: passwordHashed,
      firstName,
      lastName,
      email
    })
    console.log({
      user,
      passwordHashed
    })
    next()
  } catch (error) {
    console.log(error)
  }
})

/** input
 * {
 *  email,
 *  password
 * }
 * output 401 or {
 *  token
 * }
 * **/
router.post('/sign-in', async (req, res) => {
  const {email, password} = {...req.body};
  const user = await User.findOne({
    where: {
      email
    }
  })
  if (!user) {
    res.status(403).send("Неверный email или пароль")
  }
  const isSame = await verifyPassword(password, user.password)
  if (!isSame) {
    return res.status(403).send("Неверный email или пароль")
  }
  const token = generateToken(user)
  res.jsonp({token})

})

module.exports = router;