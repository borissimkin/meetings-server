const router = require('express').Router();
const isAuth = require('../middlewares/is-auth')


router.get('/api/meeting/:id/peers', isAuth, (req, res) => {
  let meeting = io.sockets.adapter.rooms[req.params.id]
  if (!meeting) {
    return res.jsonp([])
  }
  const results = [];
  const sockets = meeting.sockets
  const user = req.currentUser.dataValues;
  for (let socketId of Object.keys(sockets)) {
    let clientSocket = io.sockets.connected[socketId];
    if (clientSocket.user) {
      if (clientSocket.user.id === user.id) {
        continue
      }
      results.push({
        user: {
          id: clientSocket.user.id,
          firstName: clientSocket.user.firstName,
          lastName: clientSocket.user.lastName
        },
        peerId: clientSocket.user.peerId,
      })
    }
  }
  res.jsonp(results)

})

router.get('/api/meeting/')

//todo
const existingRooms = ['123456789', '123', '11111', '123123']

router.get('/api/meeting/:id/exists', isAuth, (req, res) => {
  const user = req.currentUser;
  res.jsonp({
    exists: existingRooms.includes(req.params.id)
  })

})

module.exports = router