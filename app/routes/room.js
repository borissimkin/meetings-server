const isAuth = require('../middlewares/is-auth')
const {v4: uuidv4}= require("uuid");
const {Room} = require("../models/Room");

const router = require('express').Router();
const existingRooms = ['123456789', '123', '11111', '123123']

/**
 * input {
 *  name
 * }
 *
 * output {
 *   id
 *   name
 *   hashId
 * }
 * **/
router.post('/api/room', isAuth, async (req, res) => {
  const {name} = {...req.body}
  const user = req.currentUser.dataValues;

  const hashId = uuidv4()

  const room = await Room.create({
    name,
    hashId,
    creatorId: user.id
  })

  res.json({
    id: room.id,
    name: room.name,
    hashId: room.hashId
  })

})

router.get('/api/rooms', isAuth, async (req, res) => {
  const rooms = await Room.findAll()
  return res.json(rooms)
})


router.get('/api/room/:id/exists', isAuth, (req, res) => {
  const user = req.currentUser;
  res.jsonp({
    exists: existingRooms.includes(req.params.id)
  })

})

router.get('/api/room/:id/peers', isAuth, (req, res) => {
  let room = io.sockets.adapter.rooms[req.params.id]
  if (!room) {
    return res.jsonp([])
  }
  const results = [];
  const sockets = room.sockets
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

module.exports = router