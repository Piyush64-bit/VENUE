const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

const jar = new CookieJar();
const client = wrapper(axios.create({
    baseURL: 'http://localhost:5000/api/v1',
    jar,
    withCredentials: true
}));

async function verifyAuth() {
    console.log('🚀 Starting Auth Verification...');

    const testUser = {
        name: 'Test Verify',
        email: `test_${Date.now()}@example.com`,
        password: 'password123'
    };

    try {
        // 1. Register
        console.log('\nTesting Register...');
        const regRes = await client.post('/auth/register', testUser);
        console.log('✅ Register Status:', regRes.status);
        console.log('🍪 Cookies after register:', jar.getCookiesSync('http://localhost:5000').map(c => c.key));

        if (!regRes.data.data.user) console.error('❌ User data missing in register response');
        if (regRes.data.data.token) console.error('❌ Token leaked in register response body');
        else console.log('✅ Token NOT in register response body');

        // 2. Get Me (should work with cookie from register)
        console.log('\nTesting Get Me (Access Token via Cookie)...');
        const meRes = await client.get('/auth/me');
        console.log('✅ Get Me Status:', meRes.status);
        console.log('👤 User email:', meRes.data.data.user.email);

        // 3. Logout
        console.log('\nTesting Logout...');
        const logoutRes = await client.get('/auth/logout');
        console.log('✅ Logout Status:', logoutRes.status);
        console.log('🍪 Cookies after logout:', jar.getCookiesSync('http://localhost:5000').map(c => c.key));

        // 4. Get Me (should fail)
        console.log('\nTesting Get Me after Logout...');
        try {
            await client.get('/auth/me');
            console.error('❌ Should have failed with 401');
        } catch (err) {
            if (err.response && err.response.status === 401) {
                console.log('✅ Get Me failed correctly with 401');
            } else {
                console.error('❌ Unexpected error:', err.message);
            }
        }

    } catch (error) {
        const fs = require('fs');
        let errorMsg = '❌ Verification Failed:\n';
        if (error.code === 'ECONNREFUSED') {
            errorMsg += 'Could not connect to backend at http://localhost:5000. Is the server running?';
        } else if (error.response) {
            errorMsg += `Status: ${error.response.status}\nData: ${JSON.stringify(error.response.data, null, 2)}`;
        } else {
            errorMsg += error.message;
        }
        console.error(errorMsg);
        fs.writeFileSync('verification_error.log', errorMsg);
    }
}

verifyAuth();
