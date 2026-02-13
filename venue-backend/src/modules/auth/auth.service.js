const { hashPassword, verifyPassword } = require('../../utils/passwordHasher');
const jwt = require('jsonwebtoken');
const User = require('../users/user.model');
const AppError = require('../../utils/AppError');

const register = async (userData) => {
    const { name, email, password, role } = userData;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new AppError('User already exists', 400);
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: role || 'USER',
    });

    // Remove password from response object (plain JS object)
    const userResponse = user.toObject();
    delete userResponse.password;

    const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    return { user: userResponse, token };
};

const login = async (email, password) => {
    if (!email || !password) {
        throw new AppError('Please provide email and password', 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    // Verify password with Argon2id
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
    }

    const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    const userResponse = user.toObject();
    delete userResponse.password;

    return { user: userResponse, token };
};

module.exports = {
    register,
    login,
};
