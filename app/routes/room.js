const isAuth = require('../middlewares/is-auth')
const {createMeetingDTO} = require("../common/helpers");
const {User} = require("../models/User");
const {createUuid} = require("../common/uuid");
const {Meeting} = require("../models/Meeting");
const {Room} = require("../models/Room");

const router = require('express').Router();

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
    raw: true,
    where: {
      roomId: room.id
    }
  })
  const meetingsDto = await Promise.all(meetings.map(async meeting => await createMeetingDTO(meeting)))
  res.json(meetingsDto)
})



module.exports = router
