const isAuth = require('../middlewares/is-auth')

const router = require('express').Router();


router.get('/current-user', isAuth, (req, res) => {
  const {id, firstName, lastName, email} = {...req.currentUser.dataValues};
  res.jsonp({
    id,
    firstName,
    lastName,
    email
  })
})

module.exports = router