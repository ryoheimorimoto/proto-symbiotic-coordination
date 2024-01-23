const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const readline = require('readline');
const { Server } = require('node-ssdp');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// SSDPサーバーの設定
const ssdpServer = new Server({
    location: `http://${require('ip').address()}:3000/description.xml`,
    udn: `uuid:${crypto.randomUUID()}`
});

ssdpServer.addUSN('upnp:rootdevice');
ssdpServer.addUSN('urn:schemas-upnp-org:service:proto-symbiotic-robotics-coordination:1');

let msgSentAt = 0;
const clients = [];

// Control PlaneのWebSocketサーバー設定
io.on('connection', (socket) => {
    console.log(`A worker connected. Client ID: ${socket.client.id}`);
    clients.push(socket);

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });

    socket.on('response', (data, callback) => {
        console.log('Message from worker:', data);
        callback();
    });


});

// Readlineインターフェースの設定
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.prompt();

rl.on('line', (line) => {
    const startTime = process.hrtime.bigint(); // 送信開始時間
    msgSentAt = startTime;

    for (const client of clients) {
        client.emit('message', line, () => {
            const endTime = process.hrtime.bigint(); // Ack受信時間
            const durationMs = Number(endTime - startTime) / 1000000; // ナノ秒からミリ秒へ変換
            console.log(`Ack received. Round trip time: ${durationMs.toFixed(3)} milliseconds`);
        });
    }
});

server.listen(3000, () => {
    console.log('Control Plane listening on port 3000');
    ssdpServer.start(() => console.log('SSDP Server started'));
});

process.on('exit', () => {
    ssdpServer.stop(); // Clean up on exit
});
