// コントロールプレーンのサーバーコード
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const readline = require('readline');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
    console.log('A worker connected');

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.prompt();

    rl.on('line', (line) => {
        const startTime = process.hrtime.bigint(); // 送信開始時間
        socket.emit('message', line, () => {
            const endTime = process.hrtime.bigint(); // Ack受信時間
            const durationMs = Number(endTime - startTime) / 1000000; // ナノ秒からミリ秒へ変換
            console.log(`Ack received. Round trip time: ${durationMs.toFixed(3)} milliseconds`);
            rl.prompt();
        });
    });

    socket.on('response', (data, callback) => {
        console.log('Message from worker:', data);
        callback();
    });
});

server.listen(3000, () => {
    console.log('Control Plane listening on port 3000');
});
