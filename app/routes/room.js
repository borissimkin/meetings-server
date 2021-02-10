const router = require('express').Router();
const existingRooms = ['123456789', '123', '11111', '123123']


router.get('/api/room/:id/exists', (req, res) => {
  res.jsonp({
    exists: existingRooms.includes(req.params.id)
  })

})

router.get('/api/room/:id/peers', (req, res) => {
  let room = io.sockets.adapter.rooms[req.params.id]
  if (!room) {
    return res.jsonp([])
  }
  const results = [];
  const sockets = room.sockets
  for (let socketId of Object.keys(sockets)) {
    let clientSocket = io.sockets.connected[socketId];
    if (clientSocket.user) {
      results.push({
        userId: clientSocket.user.userId,
        peerId: clientSocket.user.peerId,
      })
    }
  }
  res.jsonp(results)

})

module.exports = router