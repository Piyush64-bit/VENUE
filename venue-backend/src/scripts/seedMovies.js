const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const mongoose = require("mongoose");
const Movie = require("../modules/movies/movie.model");
const connectDB = require("../config/db");

// ------------------------------
// DATA POOLS
// ------------------------------

const TITLES = [
  "Interstellar",
  "Oppenheimer",
  "Dune: Part Two",
  "Past Lives",
  "Spider-Man: Across the Spider-Verse",
  "The Batman",
  "Inception",
  "Blade Runner 2049",
  "Everything Everywhere All At Once",
  "The Creator",
  "Avatar: The Way of Water",
  "John Wick: Chapter 4",
  "Killers of the Flower Moon",
  "Poor Things",
  "The Holdovers",
  "Barbie",
  "Top Gun: Maverick",
  "Mission: Impossible – Dead Reckoning",
  "Tenet",
  "The Matrix Resurrections"
];

const GENRES = [
  "Sci-Fi",
  "Action",
  "Drama",
  "Comedy",
  "Romance",
  "Thriller",
  "Biography",
  "Animation",
  "Fantasy",
  "Adventure"
];

const POSTERS = [
  "https://images.unsplash.com/photo-1534447677768-be436bb09401",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1",
  "https://images.unsplash.com/photo-1541963463532-d68292c34b19",
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1",
  "https://images.unsplash.com/photo-1635805737707-575885ab0820",
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba"
];

// ------------------------------
// HELPERS
// ------------------------------

const randomItem = arr => arr[Math.floor(Math.random() * arr.length)];

const randomRuntime = () => {
  const hours = Math.floor(Math.random() * 2) + 1;
  const minutes = Math.floor(Math.random() * 59);
  return `${hours}h ${minutes}m`;
};

const randomReleaseDate = () => {
  const start = new Date("2010-01-01");
  const end = new Date("2026-12-31");
  return new Date(
    start.getTime() +
      Math.random() * (end.getTime() - start.getTime())
  );
};

// ------------------------------
// GENERATOR
// ------------------------------

const generateMovies = (count = 50) => {
  const movies = [];

  for (let i = 0; i < count; i++) {
    movies.push({
      title: randomItem(TITLES),
      description: "Auto generated movie for testing and development.",
      poster: randomItem(POSTERS),
      genre: randomItem(GENRES),
      rating: Number((Math.random() * 2 + 3).toFixed(1)), // 3.0 - 5.0
      runtime: randomRuntime(),
      releaseDate: randomReleaseDate(),
      status: Math.random() > 0.3 ? "NOW_SHOWING" : "COMING_SOON"
    });
  }

  return movies;
};

// ------------------------------
// SEED FUNCTION
// ------------------------------

const seedMovies = async () => {
  try {
    await connectDB();

    await Movie.deleteMany({});
    console.log("Old movies cleared");

    const movies = generateMovies(50);

    await Movie.insertMany(movies);

    console.log(`🔥 ${movies.length} Movies Seeded Successfully`);

    process.exit();
  } catch (error) {
    console.error("Seed Error:", error);
    process.exit(1);
  }
};

seedMovies();
