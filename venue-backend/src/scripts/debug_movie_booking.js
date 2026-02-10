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
        console.log('1. Registering Admin (to create movie)...');
        const adminRes = await request('/auth/register', 'POST', {
            name: 'Movie Debug Admin ' + Date.now(),
            email: `movieadmin${Date.now()}@test.com`,
            password: 'password123',
            role: 'ADMIN'
        });
        const adminToken = adminRes.body.data.token;

        console.log('2. Creating Movie...');
        const movieRes = await request('/movies', 'POST', {
            title: 'Debug Movie ' + Date.now(),
            description: 'Test Description',
            releaseDate: new Date().toISOString(),
            runtime: '120 min',
            poster: 'http://example.com/poster.jpg',
            genre: 'Debug',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 86400000).toISOString()
        }, adminToken);

        let slotId;
        if (movieRes.body.data && movieRes.body.data.slots && movieRes.body.data.slots.length > 0) {
            slotId = movieRes.body.data.slots[0]._id;
            console.log('Movie Created. Slot ID:', slotId);
        } else {
            console.error('Movie creation failed or no slots:', movieRes.body);
            return;
        }

        console.log('3. Registering User (to book)...');
        const userRes = await request('/auth/register', 'POST', {
            name: 'Movie Debug User ' + Date.now(),
            email: `movieuser${Date.now()}@test.com`,
            password: 'password123',
            role: 'USER'
        });
        const userToken = userRes.body.data.token;

        console.log('4. Booking Movie Slot...');
        const bookingRes = await request('/bookings', 'POST', {
            slotId: slotId,
            quantity: 1,
            seats: []
        }, userToken);

        if (bookingRes.status !== 201) {
            console.error('Booking failed:', bookingRes.body);
            return;
        }
        console.log('Booking Confirmed.');

        console.log('5. Fetching My Bookings...');
        const myBookingsRes = await request('/bookings/my-bookings', 'GET', null, userToken);

        console.log('---------------------------------------------------');
        console.log('MY BOOKINGS RESPONSE (Deep Log):');
        console.dir(myBookingsRes.body, { depth: null, colors: true });
        console.log('---------------------------------------------------');

    } catch (e) {
        console.error('Error:', e);
    }
}

run();
