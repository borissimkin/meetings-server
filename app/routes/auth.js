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
 *   confirmPassword
 * }**/
router.post('/sign-up', async (req, res) => {
  const {password, firstName, lastName, email, confirmPassword} = {...req.body}
  if (password !== confirmPassword) {
    return res.status(403).send("Пароли не совпадают")
  }
  const userSameEmail = await User.findOne({
    where: {
      email
    }
  })
  if (userSameEmail) {
    return res.status(403).send("Пользователь с таким email уже существует")
  }
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
    res.end()
  } catch (error) {
    console.log(error)
  }
})

/** input
 * {
 *  email,
 *  password
 * }
 * output 403 or {
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