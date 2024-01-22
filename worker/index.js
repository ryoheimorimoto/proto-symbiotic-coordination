// ワーカーのクライアントコード
const io = require('socket.io-client');
const readline = require('readline');
const socket = io('http://192.168.10.178:3000');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

socket.on('connect', () => {
    console.log('Connected to Control Plane');
    rl.prompt();
});

socket.on('error', (error) => {
    console.error('Socket error:', error);
});

rl.on('line', (line) => {
    const startTime = process.hrtime.bigint(); // 送信開始時間
    socket.emit('response', line, () => {
        const endTime = process.hrtime.bigint(); // Ack受信時間
        const durationMs = Number(endTime - startTime) / 1000000; // ナノ秒からミリ秒へ変換
        console.log(`Ack received. Round trip time: ${durationMs.toFixed(3)} milliseconds`);
        rl.prompt();
    });
});

socket.on('message', (data, callback) => {
    console.log('Message from Control Plane:', data);
    callback(); // Ackを送信
});
