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
            name: 'Test Booker ' + Date.now(),
            email: `test${Date.now()}@example.com`,
            password: 'password123',
            role: 'USER'
        });

        if (userRes.status !== 201) {
            console.error('User Registration failed:', JSON.stringify(userRes.body, null, 2));
            return;
        }

        const userToken = userRes.body.data.token;
        console.log('User registered. Token acquired.');

        console.log('2. Searching for existing slots (from seed)...');
        let slotId = null;

        // Try fetching events
        const eventsRes = await request('/events', 'GET');
        if (eventsRes.body.data && eventsRes.body.data.events && eventsRes.body.data.events.length > 0) {
            const eventId = eventsRes.body.data.events[0]._id;
            console.log('Found event:', eventId);
            const slotsRes = await request(`/events/${eventId}/slots`, 'GET');
            if (slotsRes.body.data && slotsRes.body.data.slots && slotsRes.body.data.slots.length > 0) {
                slotId = slotsRes.body.data.slots[0]._id;
                console.log('Found slot in event:', slotId);
            }
        }

        if (!slotId) {
            // Try fetching movies
            const moviesRes = await request('/movies', 'GET');
            if (moviesRes.body.data && moviesRes.body.data.length > 0) {
                const movieId = moviesRes.body.data[0]._id;
                const mSlotsRes = await request(`/movies/${movieId}/slots`, 'GET');
                if (mSlotsRes.body.data && mSlotsRes.body.data.slots && mSlotsRes.body.data.slots.length > 0) {
                    slotId = mSlotsRes.body.data.slots[0]._id;
                    console.log('Found slot in movie:', slotId);
                }
            }
        }

        if (!slotId) {
            console.error('No slots available. Seed failed?');
            return;
        }

        console.log('3. Attempting Booking for Slot:', slotId);

        const bookingRes = await request('/bookings', 'POST', {
            slotId: slotId,
            quantity: 1,
            seats: [{ label: 'A1' }]
        }, userToken);

        console.log('Booking Response Status:', bookingRes.status);
        console.log('Booking Response Body:', JSON.stringify(bookingRes.body, null, 2));

    } catch (e) {
        console.error('Error:', e);
    }
}

run();
