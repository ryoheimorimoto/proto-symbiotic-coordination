const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
    console.log('A worker connected');

    // 例: ワーカーにメッセージを送信
    socket.emit('message', { data: 'Hello from Control Plane!' });

    // ワーカーからのメッセージを受け取る
    socket.on('response', (data) => {
        console.log('Message from worker:', data);
    });
});

server.listen(3000, () => {
    console.log('Control Plane listening on port 3000');
});
