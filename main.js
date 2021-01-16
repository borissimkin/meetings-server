const app = require('express')();
const server = require('http').createServer(app);
const options = { /* ... */ };
const io = require('socket.io')(server, options);
const cors = require('cors')
// const { PeerServer } = require('peer')

app.use(cors())

// const peerServer = PeerServer({port: 9000, path: '/myapp'})

const port = process.env.PORT || 3000

const existingRooms = ['123456789', '123', '11111', '123123']

app.get('/api/room/:id/exists', (req, res) => {
  res.jsonp({
    exists: existingRooms.includes(req.params.id)
  })

})

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    console.log({roomId, userId})
    socket.join(roomId)

    socket.to(roomId).broadcast.emit('userConnected', userId)

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('userDisconnected', userId)
    })

    socket.on('new-message', data => {
      socket.to(roomId).broadcast.emit('newMessage', data)
    })

    socket.on('call-connect', (peerId, userId) => {
      console.log(`Call connect peerId=${peerId} userId=${userId}`)
      socket.to(roomId).broadcast.emit('callConnected', peerId, userId)
    })
  })
})


server.listen(port, () => {
    console.log(`listen on port ${port}`)
})
