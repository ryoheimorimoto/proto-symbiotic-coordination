const readline = require('readline');
const { Client } = require('node-ssdp');
const ssdpClient = new Client();
let controlPlaneSocket = null;
let isSearching = true; // 検索を制御するフラグ

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function connectToControlPlane(ip) {
    if (controlPlaneSocket) {
        console.log('Already connected to Control Plane.');
        return;
    }

    const io = require('socket.io-client');
    controlPlaneSocket = io(`http://${ip}:3000`);

    controlPlaneSocket.on('connect', () => {
        console.log('Connected to Control Plane');
        isSearching = false; // WebSocket接続が確立したら検索を停止
        rl.prompt();
    });

    controlPlaneSocket.on('error', (error) => {
        console.error('Socket error:', error);
    });

    rl.on('line', (line) => {
        if (!controlPlaneSocket.connected) {
            console.log('Not connected to Control Plane.');
            rl.prompt();
            return;
        }

        const startTime = process.hrtime.bigint();
        controlPlaneSocket.emit('response', line, () => {
            const endTime = process.hrtime.bigint();
            const durationMs = Number(endTime - startTime) / 1000000;
            console.log(`Ack received. Round trip time: ${durationMs.toFixed(3)} milliseconds`);
            rl.prompt();
        });
    });

    controlPlaneSocket.on('message', (data, callback) => {
        console.log('Message from Control Plane:', data);
        callback();
    });
}

ssdpClient.on('response', function (headers, statusCode, rinfo) {
    if (headers.ST === 'urn:schemas-upnp-org:service:proto-symbiotic-robotics-coordination:1') {
        console.log(`Control Plane discovered at ${rinfo.address}`);
        connectToControlPlane(rinfo.address);
    }
});

function searchService() {
    if (isSearching) { // 接続中でなければ検索を実行
        ssdpClient.search('urn:schemas-upnp-org:service:proto-symbiotic-robotics-coordination:1');
    }
}

const searchInterval = setInterval(searchService, 20000);
searchService();

controlPlaneSocket?.on('disconnect', () => {
    console.log('Disconnected from Control Plane. Resuming search...');
    isSearching = true; // 切断されたら検索を再開
});
