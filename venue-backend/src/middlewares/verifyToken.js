const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const User = require('../modules/users/user.model');

const verifyToken = async (req, res, next) => {
  let token;

  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Check if user still exists
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    req.user = currentUser;
    req.user.userId = currentUser._id;
    next();
  } catch (error) {
    return next(new AppError('Invalid token or session expired', 401));
  }
};

module.exports = verifyToken;
