const express = require('express');
const userController = require('./user.controller');
const verifyToken = require('../../middlewares/verifyToken');

const router = express.Router();

// protect all routes after this middleware
router.use(verifyToken);

router.post('/favorites', userController.toggleFavorite);
router.get('/favorites', userController.getMyFavorites);

module.exports = router;
