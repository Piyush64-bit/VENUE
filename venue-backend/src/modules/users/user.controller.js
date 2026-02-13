const User = require('./user.model');
const AppError = require('../../utils/AppError');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const Event = require('../events/event.model');
const Movie = require('../movies/movie.model');
const { hashPassword, verifyPassword } = require('../../utils/passwordHasher');

// Toggle Favorite (Add/Remove)
exports.toggleFavorite = catchAsync(async (req, res, next) => {
    const { itemId, itemType } = req.body;

    if (!itemId || !itemType) {
        return next(new AppError('Please provide itemId and itemType', 400));
    }

    if (!['Event', 'Movie'].includes(itemType)) {
        return next(new AppError('Invalid itemType. Must be Event or Movie', 400));
    }

    const user = await User.findById(req.user.userId);

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
    const user = await User.findById(req.user.userId);

    const movieIds = user.favorites.filter(f => f.itemType === 'Movie').map(f => f.itemId);
    const eventIds = user.favorites.filter(f => f.itemType === 'Event').map(f => f.itemId);

    const [movies, events] = await Promise.all([
        Movie.find({ _id: { $in: movieIds } }),
        Event.find({ _id: { $in: eventIds } })
    ]);

    const movieMap = new Map(movies.map(m => [m._id.toString(), m]));
    const eventMap = new Map(events.map(e => [e._id.toString(), e]));

    const validFavorites = user.favorites.map(fav => {
        const item = fav.itemType === 'Movie' ? movieMap.get(fav.itemId.toString()) : eventMap.get(fav.itemId.toString());
        if (!item) return null;
        // Construct the expected object structure
        return {
            _id: fav._id,
            itemId: item, // Populated item
            itemType: fav.itemType,
            addedAt: fav.addedAt
        };
    }).filter(f => f !== null);

    res.status(200).json({
        status: 'success',
        results: validFavorites.length,
        data: {
            favorites: validFavorites
        }
    });
});

// Get User Profile
exports.getProfile = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.userId).select('-password');

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    res.status(200).json(
        new ApiResponse(200, { user }, 'Profile fetched successfully')
    );
});

// Update User Profile
exports.updateProfile = catchAsync(async (req, res, next) => {
    const { name, email } = req.body;

    // Check if email is being changed and if it's already taken
    if (email) {
        // Find if ANY user has this email
        const existingUser = await User.findOne({ email });

        // If user exists AND it's not the current user, then it's taken
        if (existingUser && existingUser._id.toString() !== req.user.userId) {
            return next(new AppError('Email already in use', 400));
        }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const user = await User.findByIdAndUpdate(
        req.user.userId,
        updateData,
        { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    res.status(200).json(
        new ApiResponse(200, { user }, 'Profile updated successfully')
    );
});

// Change Password
exports.changePassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return next(new AppError('Please provide all required fields', 400));
    }

    if (newPassword !== confirmPassword) {
        return next(new AppError('New passwords do not match', 400));
    }

    if (newPassword.length < 6) {
        return next(new AppError('Password must be at least 6 characters', 400));
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    // Verify current password
    const isPasswordCorrect = await verifyPassword(currentPassword, user.password);
    if (!isPasswordCorrect) {
        return next(new AppError('Current password is incorrect', 401));
    }

    // Hash new password with Argon2id
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json(
        new ApiResponse(200, null, 'Password changed successfully')
    );
});

// Upload Profile Picture
exports.uploadProfilePicture = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('Please upload an image', 400));
    }

    // Cloudinary URL
    const profilePictureUrl = req.file.path;

    const user = await User.findByIdAndUpdate(
        req.user.userId,
        { profilePicture: profilePictureUrl },
        { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    res.status(200).json(
        new ApiResponse(200, { user }, 'Profile picture uploaded successfully')
    );
});
