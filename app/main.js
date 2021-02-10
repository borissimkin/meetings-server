const express = require('express')
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const cors = require('cors')

const { PeerServer } = require('peer')
const bodyParser = require('body-parser')

app.use(cors())

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: false
}));

const peerServer = PeerServer({port: 3001, path: '/'})

peerServer.on('connection', (client) => {
  console.log(client)
});

peerServer.on('disconnect', (client) => {
  console.log(client)
});

const port = process.env.PORT || 3000


app.use(express.static(__dirname + '/dist'));

app.use('/api', require('./routes/auth'));
app.use(require('./routes/room'))



app.use('/*', express.static(__dirname + '/dist'));



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
      socket.user = {
        userId,
        peerId
      }
      socket.to(roomId).broadcast.emit('callConnected', peerId, userId)
    })
  })
})


server.listen(port, () => {
  console.log(`listen on port ${port}`)
})

global.io = io