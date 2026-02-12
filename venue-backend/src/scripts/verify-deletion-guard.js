require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Event = require('../modules/events/event.model');
const Slot = require('../modules/slots/slot.model');
const Booking = require('../modules/bookings/booking.model');
const User = require('../modules/users/user.model'); // Assuming User model exists
const { deleteEvent } = require('../modules/organizer/organizer.controller');

// Mock Express objects
const mockReq = (params, body, user) => ({
    params: params || {},
    body: body || {},
    user: user || {},
});

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

const mockNext = (err) => {
    if (err) {
        console.log(`[EXPECTED ERROR] Next called with error: ${err.message} (Status: ${err.statusCode})`);
        return err;
    }
};

const runVerification = async () => {
    try {
        await connectDB();

        console.log('--- Starting Verification ---');

        // 1. Create Dummy Organizer
        const organizer = await User.create({
            name: 'Test Organizer',
            email: `test_org_${Date.now()}@example.com`,
            password: 'password123',
            role: 'ORGANIZER'
        });
        console.log('1. Created Test Organizer:', organizer._id);

        // 2. Create Dummy Event
        const event = await Event.create({
            title: 'Test Event for Deletion',
            organizerId: organizer._id,
            description: 'Test Description',
            startDate: new Date(),
            endDate: new Date(new Date().setDate(new Date().getDate() + 1)),
            location: 'Test Location',
            category: 'Music',
            price: 100,
            image: 'http://test.com/image.jpg',
            isPublished: true
        });
        console.log('2. Created Test Event:', event._id);

        // 3. Create Slot
        const slot = await Slot.create({
            parentType: 'Event',
            parentId: event._id,
            date: new Date(),
            startTime: '10:00',
            endTime: '12:00',
            capacity: 100,
            availableSeats: 100
        });
        console.log('3. Created Test Slot:', slot._id);

        // 4. Create Confirmed Booking
        const booking = await Booking.create({
            userId: organizer._id, // User booking their own event for simplicity
            slotId: slot._id,
            quantity: 2,
            status: 'CONFIRMED',
            seats: ['A1', 'A2']
        });
        console.log('4. Created Confirmed Booking:', booking._id);

        // 5. Attempt Deletion (Should Fail)
        console.log('\n--- Attempting Delete with Active Booking (Expect FAILURE) ---');
        const req1 = mockReq({ id: event._id }, {}, { userId: organizer._id });
        const res1 = mockRes();

        // We need to wrap deleteEvent because it's async and catches errors via next
        // But since we are calling it directly, we can just intercept the next call
        let errorCaught = null;
        const captureNext = (err) => {
            errorCaught = err;
        };

        console.log('--- CALLING deleteEvent NOW ---');
        await deleteEvent(req1, res1, captureNext);

        if (errorCaught && errorCaught.statusCode === 409) {
            console.log('PASSED: Deletion blocked with 409 Conflict as expected.');
        } else {
            console.error('FAILED: Deletion did NOT fail with 409. Result:', errorCaught || 'Success');
            process.exit(1);
        }

        // 6. Delete Booking
        await Booking.findByIdAndDelete(booking._id);
        console.log('\n6. Deleted Booking manually.');

        // 7. Attempt Deletion (Should Success)
        console.log('\n--- Attempting Delete with NO Bookings (Expect SUCCESS) ---');
        const req2 = mockReq({ id: event._id }, {}, { userId: organizer._id });
        const res2 = mockRes();
        let successCaught = null;

        await deleteEvent(req2, res2, (err) => console.error('Unexpected error:', err));

        if (res2.statusCode === 200) {
            console.log('PASSED: Deletion succeeded with 200 OK.');
        } else {
            console.error('FAILED: Deletion failed. Status:', res2.statusCode);
            process.exit(1);
        }

        // 8. Verify Cleanup
        const eventCheck = await Event.findById(event._id);
        const slotCheck = await Slot.findById(slot._id);

        if (!eventCheck && !slotCheck) {
            console.log('PASSED: Event and Slots removed from DB.');
        } else {
            console.error('FAILED: Event or Slots still exist in DB.');
            process.exit(1);
        }

        console.log('\n--- Verification Completed Successfully ---');

    } catch (error) {
        console.error('Verification Script Failed:', error);
    } finally {
        // Cleanup User
        // await User.deleteMany({ email: { $regex: /test_org_/ } });
        await mongoose.disconnect();
        process.exit(0);
    }
};

runVerification();
