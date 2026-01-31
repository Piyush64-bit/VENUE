const authService = require('./auth.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');

const registerUser = catchAsync(async (req, res, next) => {
  const { user, token } = await authService.register(req.body);

  // Send token in cookie (Consistent with login)
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(201).json(
    new ApiResponse(201, { user, token }, 'User registered successfully')
  );
});

const loginUser = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const { user, token } = await authService.login(email, password);

  // Send token in cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json(
    new ApiResponse(200, { user, token }, 'Login successful')
  );
});

module.exports = { registerUser, loginUser };
