const server = require('http').createServer();


const port = process.env.PORT || 3000;

const io = require('socket.io')(server);

io.on('connection', (socket) => {
    console.log(`One user joined the chat with ID: ${ socket.id }`)
    socket.on('message', data => {
        /** При получении сообщения рассылаем его всем остальным соединениям
         * */
        socket.broadcast.emit('receiveMessage', data)
    });

})


server.listen(port, () => {
    console.log(`listen on port ${port}`)
})
