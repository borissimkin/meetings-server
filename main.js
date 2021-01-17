const express = require('express')
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const cors = require('cors')
const { PeerServer } = require('peer')

app.use(cors())

const peerServer = PeerServer({port: 3001, path: '/'})

const port = process.env.PORT || 3000

const existingRooms = ['123456789', '123', '11111', '123123']

app.use(express.static(__dirname + '/dist'));


app.get('/api/room/:id/exists', (req, res) => {
  res.jsonp({
    exists: existingRooms.includes(req.params.id)
  })

})

app.get('/api/room/:id/users', (req, res) => {
  let sockets = io.sockets.adapter.rooms[req.params.id].sockets
  for (let socketId of Object.keys(sockets)) {
    let clientSocket = io.sockets.connected[socketId];
    console.log(clientSocket.user.userId)
  }
  res.jsonp({
    exists: existingRooms.includes(req.params.id)
  })

})

app.use('/*', express.static(__dirname + '/dist'));



io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    console.log(socket.test)
    socket.user = {
      userId,

    }
    console.log({roomId, userId})
    socket.join(roomId)

    socket.to(roomId).broadcast.emit('userConnected', userId)

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('userDisconnected', userId)
    })

    socket.on('new-message', data => {
      console.log(socket.user)
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
