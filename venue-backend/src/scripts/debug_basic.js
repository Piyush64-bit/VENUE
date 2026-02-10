const http = require('http');

async function request(path, method, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/v1' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function run() {
    try {
        console.log('1. Registering User...');
        const userRes = await request('/auth/register', 'POST', {
            name: 'Debug User ' + Date.now(),
            email: `debug${Date.now()}@test.com`,
            password: 'password123',
            role: 'USER'
        });
        const userToken = userRes.body.data.token;

        console.log('2. Fetching My Bookings (Expect Empty)...');
        const myBookingsRes = await request('/bookings/my-bookings', 'GET', null, userToken);
        console.log('Bookings Response:', myBookingsRes.body);

    } catch (e) {
        console.error('Error:', e);
    }
}

run();
