const User = require('./user.model');
const AppError = require('../../utils/AppError');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const Event = require('../events/event.model');
const Movie = require('../movies/movie.model');
const bcrypt = require('bcrypt');

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

    // Manually populate since we have mixed types (or use populate if refPath works well, but distinct queries might be safer for strict control)
    // Let's rely on standard populate with refPath which we defined in model
    // Note: To make refPath work effectively, we need to ensure the models 'Event' and 'Movie' are registered.
    // We required them above so they should be registered.

    const populatedUser = await User.findById(req.user.userId).populate('favorites.itemId');

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

// Get User Profile
exports.getProfile = catchAsync(async (req, res, next) => {
    console.log('🔍 getProfile called');
    console.log('🔍 req.user:', req.user);
    console.log('🔍 req.user.userId:', req.user?.userId);

    const user = await User.findById(req.user.userId).select('-password');

    console.log('🔍 User found:', user ? 'YES' : 'NO');
    console.log('🔍 User data:', user);

    if (!user) {
        console.log('❌ User not found in database');
        return next(new AppError('User not found', 404));
    }

    console.log('✅ Sending successful response');
    res.status(200).json(
        new ApiResponse(200, { user }, 'Profile fetched successfully')
    );
});

// Update User Profile
exports.updateProfile = catchAsync(async (req, res, next) => {
    const { name, email } = req.body;

    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
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
    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordCorrect) {
        return next(new AppError('Current password is incorrect', 401));
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
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

    // Construct the full URL for the uploaded file
    const protocol = req.protocol;
    const host = req.get('host');
    const profilePictureUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

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
