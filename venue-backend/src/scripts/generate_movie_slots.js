const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const mongoose = require("mongoose");
const Movie = require("../modules/movies/movie.model"); // Adjust path if needed
const Slot = require("../modules/slots/slot.model");
const connectDB = require("../config/db");

const generateSlots = async () => {
    try {
        await connectDB();
        console.log("Connected to DB");

        const movies = await Movie.find({});
        console.log(`Found ${movies.length} movies.`);

        let totalSlotsCreated = 0;

        for (const movie of movies) {
            // Check if slots already exist
            const existingSlots = await Slot.find({ movieId: movie._id });
            if (existingSlots.length > 0) {
                console.log(`Movie "${movie.title}" already has ${existingSlots.length} slots. Skipping.`);
                continue;
            }

            console.log(`Generating slots for "${movie.title}"...`);

            const slots = [];
            const today = new Date();
            // Generate for next 14 days
            for (let i = 0; i < 14; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() + i);

                // 3 shows per day
                const times = [
                    { start: "10:00", end: "13:00" },
                    { start: "14:00", end: "17:00" },
                    { start: "18:00", end: "21:00" }
                ];

                for (const time of times) {
                    slots.push({
                        movieId: movie._id,
                        date: date,
                        startTime: new Date(date.setHours(parseInt(time.start.split(':')[0]), 0, 0)).toISOString(),
                        endTime: new Date(date.setHours(parseInt(time.end.split(':')[0]), 0, 0)).toISOString(),
                        totalCapacity: 60,
                        remainingCapacity: 60,
                        status: 'AVAILABLE'
                    });
                }
            }

            const formattedSlots = slots.map(s => ({ ...s }));

            // console.log("Example slot:", formattedSlots[0]);

            await Slot.insertMany(formattedSlots);
            totalSlotsCreated += formattedSlots.length;
        }

        console.log(`Done! Created ${totalSlotsCreated} slots across all movies.`);
        process.exit();

    } catch (error) {
        if (error.name === 'ValidationError') {
            console.error('Validation Error Details:', JSON.stringify(error.errors, null, 2));
        } else {
            console.error("Error:", error);
        }
        process.exit(1);
    }
};

generateSlots();
