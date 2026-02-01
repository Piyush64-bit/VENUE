const User = require('./user.model');
const AppError = require('../../utils/AppError');
const catchAsync = require('../../utils/catchAsync');
const Event = require('../events/event.model');
const Movie = require('../movies/movie.model');

// Toggle Favorite (Add/Remove)
exports.toggleFavorite = catchAsync(async (req, res, next) => {
    console.log('[DEBUG] Toggle Favorite:', req.body, 'User:', req.user?.id);
    const { itemId, itemType } = req.body;

    if (!itemId || !itemType) {
        return next(new AppError('Please provide itemId and itemType', 400));
    }

    if (!['Event', 'Movie'].includes(itemType)) {
        return next(new AppError('Invalid itemType. Must be Event or Movie', 400));
    }

    const user = await User.findById(req.user.id);

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    if (!user.favorites) {
        user.favorites = [];
    }

    // Check if already in favorites
    const existingIndex = user.favorites.findIndex(
        (fav) => fav.itemId.toString() === itemId && fav.itemType === itemType
    );

    let status;

    if (existingIndex > -1) {
        // Remove
        user.favorites.splice(existingIndex, 1);
        status = 'removed';
    } else {
        // Add
        user.favorites.push({ itemId, itemType });
        status = 'added';
    }

    await user.save();

    res.status(200).json({
        status: 'success',
        data: {
            action: status,
            favorites: user.favorites
        }
    });
});

// Get My Favorites
exports.getMyFavorites = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    // Manually populate since we have mixed types (or use populate if refPath works well, but distinct queries might be safer for strict control)
    // Let's rely on standard populate with refPath which we defined in model
    // Note: To make refPath work effectively, we need to ensure the models 'Event' and 'Movie' are registered.
    // We required them above so they should be registered.

    const populatedUser = await User.findById(req.user.id).populate('favorites.itemId');

    // Filter out nulls (in case item was deleted)
    const validFavorites = populatedUser.favorites.filter(fav => fav.itemId !== null);

    res.status(200).json({
        status: 'success',
        results: validFavorites.length,
        data: {
            favorites: validFavorites
        }
    });
});
