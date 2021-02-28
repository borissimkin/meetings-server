const isAuth = require('../middlewares/is-auth')
const {createUuid} = require("../common/uuid");
const {Meeting} = require("../models/Meeting");
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

  const hashId = createUuid()
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

router.get('/api/room/:id/exists', isAuth, async (req, res) => {
  const room = await Room.findOne({
    where: {
      hashId: req.params.id
    }
  })
  res.json({
    exists: !!room
  })

})

router.get('/api/room/:id/meetings', isAuth, async (req, res) => {
  const room = await Room.findOne({
    where: {
      hashId: req.params.id
    }
  })
  if (!room) {
    return res.send(404)
  }
  const meetings = await Meeting.findAll({
    where: {
      roomId: room.id
    }
  })
  res.json(meetings)
})



module.exports = router