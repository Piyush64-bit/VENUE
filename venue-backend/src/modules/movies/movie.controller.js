const Movie = require("./movie.model");
const catchAsync = require('../../utils/catchAsync');

const createMovie = catchAsync(async (req, res, next) => {
    const movie = await Movie.create(req.body);
    return res.status(201).json(movie);
});

const getMovies = catchAsync(async (req, res, next) => {
    const movies = await Movie.find().sort({ releaseDate: -1 });
    return res.status(200).json(movies);
});

module.exports = { createMovie, getMovies };
