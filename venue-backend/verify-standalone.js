const express = require('express');
const mongoSanitize = require('express-mongo-sanitize');
const request = require('supertest');
const assert = require('assert');

const app = express();

// Mimic app.js security setup
app.use(express.json());
app.use(mongoSanitize({ replaceWith: '_' }));

app.post('/test', (req, res) => {
    res.json(req.body);
});

async function runTests() {
    console.log('Running security verification...');

    // 1. Test express.json()
    try {
        const res = await request(app)
            .post('/test')
            .send({ foo: 'bar' });
        assert.strictEqual(res.body.foo, 'bar');
        console.log('✅ express.json() is working');
    } catch (e) {
        console.error('❌ express.json() failed:', e);
        process.exit(1);
    }

    // 2. Test mongoSanitize
    try {
        const res = await request(app)
            .post('/test')
            .send({ 'user': { '$gt': '' } });

        // Should be sanitized to _gt
        assert.strictEqual(res.body.user._gt, '');
        assert.strictEqual(res.body.user.$gt, undefined);
        console.log('✅ express-mongo-sanitize is working');
    } catch (e) {
        console.error('❌ express-mongo-sanitize failed:', e);
        process.exit(1);
    }

    // 3. Check if xss-clean is truly gone from project files
    const fs = require('fs');
    const appJs = fs.readFileSync('d:\\WebDev\\VENUE\\venue-backend\\src\\app.js', 'utf8');
    if (appJs.includes('xss-clean')) {
        console.error('❌ xss-clean traces found in app.js');
        process.exit(1);
    }
    console.log('✅ No traces of xss-clean in app.js');

    const packageJson = fs.readFileSync('d:\\WebDev\\VENUE\\venue-backend\\package.json', 'utf8');
    if (packageJson.includes('xss-clean')) {
        console.error('❌ xss-clean traces found in package.json');
        process.exit(1);
    }
    console.log('✅ No traces of xss-clean in package.json');

    console.log('ALL CHECKS PASSED');
}

runTests();
