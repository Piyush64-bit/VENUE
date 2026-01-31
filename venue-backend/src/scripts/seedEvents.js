const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const mongoose = require("mongoose");
const User = require("../modules/users/user.model");
const Event = require("../modules/events/event.model");
const connectDB = require("../config/db");
const bcrypt = require("bcrypt");

// ------------------------------
// DATA POOLS
// ------------------------------

const TITLES = [
  "Jaipur Comedy Night",
  "Music Jam Session",
  "Startup Pitch Evening",
  "Photography Workshop",
  "Morning Yoga Camp",
  "Web Development Bootcamp",
  "Tech Meetup Jaipur",
  "AI & ML Awareness Session",
  "UI/UX Design Workshop",
  "Fitness Bootcamp",
  "Stock Market Basics",
  "Digital Marketing Workshop",
  "Creative Writing Workshop",
  "Public Speaking Workshop",
  "Weekend Coding Hackathon",
  "Mobile App Development Session",
  "Leadership & Management Talk",
  "E-commerce Business Workshop",
  "Music Production Workshop",
  "Heritage Night Walk",
  "Art & Painting Class",
  "Content Creators Meetup",
  "Business Networking Night"
];

const CATEGORIES = [
  "Music",
  "Comedy",
  "Workshops",
  "Meetups",
  "Theatre",
  "Technology",
  "Fitness",
  "Business"
];

const IMAGES = [
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30",
  "https://images.unsplash.com/photo-1518770660439-4636190af475",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d",
  "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14",
  "https://images.unsplash.com/photo-1515187029135-18ee286d815b",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4"
];

// ------------------------------
// HELPERS
// ------------------------------

const randomItem = arr => arr[Math.floor(Math.random() * arr.length)];

const randomFutureDate = (startDays = 1, range = 90) => {
  const d = new Date();
  d.setDate(d.getDate() + startDays + Math.floor(Math.random() * range));
  return d;
};

const generateEvents = (count, organizerId) => {
  const events = [];

  for (let i = 0; i < count; i++) {
    const startDate = randomFutureDate();
    startDate.setHours(18, 0, 0); // 6 PM

    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 3); // 3 hour event

    events.push({
      title: randomItem(TITLES),
      description: "Auto generated event for testing and development.",
      organizerId,
      startDate,
      endDate,
      image: randomItem(IMAGES),
      location: "Jaipur, Rajasthan",
      price: Math.floor(Math.random() * 3000),
      category: randomItem(CATEGORIES),
      status: "ACTIVE"
    });
  }

  return events;
};

// ------------------------------
// SEED FUNCTION
// ------------------------------

const seedData = async () => {
  try {
    await connectDB();

    // 1️⃣ Find or Create Organizer
    let organizer = await User.findOne({ role: "ORGANIZER" });

    if (!organizer) {
      console.log("No organizer found. Creating one...");

      const hashedPassword = await bcrypt.hash("password123", 10);

      organizer = await User.create({
        name: "Venue Organizer",
        email: "organizer@venue.com",
        password: hashedPassword,
        role: "ORGANIZER"
      });
    }

    console.log("Using Organizer:", organizer._id);

    // 2️⃣ Clear Events
    await Event.deleteMany({});
    console.log("Old events cleared");

    // 3️⃣ Generate 50 Events
    const events = generateEvents(50, organizer._id);

    await Event.insertMany(events);

    console.log(`🔥 ${events.length} Events Seeded Successfully`);

    process.exit();
  } catch (error) {
    console.error("Seed Error:", error);
    process.exit(1);
  }
};

seedData();
