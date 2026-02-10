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
            name: 'Movie Test User ' + Date.now(),
            email: `movietest${Date.now()}@example.com`,
            password: 'password123',
            role: 'USER'
        });

        const userToken = userRes.body.data.token;
        console.log('User registered.');

        console.log('2. Searching for existing MOVIE slots...');
        let slotId = null;

        // Fetch movies
        const moviesRes = await request('/movies', 'GET');
        const movies = moviesRes.body.data || [];

        if (movies.length === 0) {
            console.error("No movies found! Seed script didn't work?");
            return;
        }

        console.log(`Found ${movies.length} movies. Checking slots for first one: ${movies[0].title}`);

        const slotsRes = await request(`/movies/${movies[0]._id}/slots`, 'GET');
        const slots = slotsRes.body.data?.slots || [];

        if (slots.length > 0) {
            slotId = slots[0]._id;
            console.log('Found slot:', slotId);
        } else {
            console.error('No slots found for movie. Generate script failed?');
            return;
        }

        console.log('3. Attempting Booking for Movie Slot:', slotId);

        const bookingRes = await request('/bookings', 'POST', {
            slotId: slotId,
            quantity: 1,
            seats: [{ label: 'M1' }]
        }, userToken);

        console.log('Booking Response Status:', bookingRes.status);

        if (bookingRes.status !== 201) {
            console.error('Booking failed:', JSON.stringify(bookingRes.body, null, 2));
            return;
        }

        console.log('4. Fetching My Bookings to verify display data...');
        const myBookingsRes = await request('/bookings/my-bookings', 'GET', null, userToken);

        const bookings = myBookingsRes.body.data?.bookings || [];
        if (bookings.length > 0) {
            const b = bookings[0];
            console.log('Booking retrieved. Slot populated?');
            console.log('Slot ID:', b.slotId?._id);
            console.log('Movie ID (in Slot):', b.slotId?.movieId);
            console.log('Movie Title (in Slot->Movie):', b.slotId?.movieId?.title);

            if (b.slotId?.movieId?.title) {
                console.log('SUCCESS: Movie data is correctly populated!');
            } else {
                console.error('FAILURE: Movie data missing in population.');
            }
        } else {
            console.error('No bookings found in My Bookings.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

run();
