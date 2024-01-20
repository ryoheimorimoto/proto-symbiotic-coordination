const io = require('socket.io-client');
const socket = io('http://[コントロールプレーンのIPアドレス]:3000');

socket.on('connect', () => {
    console.log('Connected to Control Plane');

    // コントロールプレーンへのメッセージ送信
    socket.emit('response', { data: 'Hello from Worker!' });
});

// コントロールプレーンからのメッセージを受け取る
socket.on('message', (data) => {
    console.log('Message from Control Plane:', data);
});
