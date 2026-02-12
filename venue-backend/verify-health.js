const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/health',
    method: 'GET',
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
        console.log('No more data in response.');
        if (res.statusCode === 200) {
            console.log('✅ Health check passed');
            process.exit(0);
        } else {
            console.error('❌ Health check failed');
            process.exit(1);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Problem with request: ${e.message}`);
    console.error('Is the server running?');
    process.exit(1);
});

req.end();
