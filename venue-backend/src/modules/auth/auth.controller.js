const authService = require('./auth.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');

const registerUser = catchAsync(async (req, res, next) => {
  const { user, token } = await authService.register(req.body);

  // Send token in cookie (Consistent with login)
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // basic protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(201).json(
    new ApiResponse(201, { user }, 'User registered successfully')
  );
});

const loginUser = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const { user, token } = await authService.login(email, password);

  // Send token in cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json(
    new ApiResponse(200, { user }, 'Login successful')
  );
});

const logoutUser = catchAsync(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json(new ApiResponse(200, {}, 'User logged out successfully'));
});

const getCurrentUser = catchAsync(async (req, res, next) => {
  res.status(200).json(new ApiResponse(200, { user: req.user }, 'Current user fetched successfully'));
});

module.exports = { registerUser, loginUser, logoutUser, getCurrentUser };
