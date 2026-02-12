/**
 * Auto Slot Generator Utility
 * Generates time-varied slots for movies and events
 * Designed for portfolio demo - generates 90 days of slots
 */

/**
 * Generate automatic slots for movies or events
 * @param {String} parentType - 'Movie' or 'Event'
 * @param {Date} startDate - Start date for slot generation
 * @param {Date} endDate - End date for slot generation
 * @param {Object} options - Optional configuration
 * @returns {Array} Array of slot objects
 */
const generateAutoSlots = (parentType, startDate, endDate, options = {}) => {
    const slots = [];
    const { capacity } = options;

    // Define time templates for different content types
    const movieTimes = [
        { start: "10:00", end: "13:00" }, // Morning show
        { start: "14:00", end: "17:00" }, // Matinee
        { start: "18:00", end: "21:00" }  // Evening show
    ];

    const eventTimes = [
        { start: "09:00", end: "12:00" }, // Morning session
        { start: "14:00", end: "17:00" }, // Afternoon session
        { start: "19:00", end: "22:00" }  // Evening session
    ];

    // Select appropriate time slots based on content type
    const times = parentType === 'Movie' ? movieTimes : eventTimes;

    // Default capacities (realistic for demo)
    const defaultCapacity = parentType === 'Movie' ? 60 : 100;

    // Generate slots for each day in the date range
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Ensure we include the full end day
    end.setHours(23, 59, 59, 999);

    for (let currentDate = new Date(start); currentDate <= end; currentDate.setDate(currentDate.getDate() + 1)) {
        // Create 3 slots per day
        times.forEach(timeSlot => {
            const slotDate = new Date(currentDate);
            slotDate.setHours(0, 0, 0, 0); // Reset time to midnight

            slots.push({
                date: slotDate,
                startTime: timeSlot.start,
                endTime: timeSlot.end,
                capacity: capacity || defaultCapacity,
                availableSeats: capacity || defaultCapacity,
                status: 'AVAILABLE'
            });
        });
    }

    return slots;
};

module.exports = generateAutoSlots;
