const express = require('express');
const userController = require('./user.controller');
const verifyToken = require('../../middlewares/verifyToken');
const { upload } = require('../../middlewares/upload.middleware');

const router = express.Router();

// Test route to verify router is working
router.get('/test', (req, res) => {
    res.json({ message: 'User routes are working!' });
});

// protect all routes after this middleware
router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

// User Profile Routes
router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);
router.patch('/password', userController.changePassword);
router.post('/profile/picture', upload.single('profilePicture'), userController.uploadProfilePicture);

/**
 * @swagger
 * /users/favorites:
 *   post:
 *     summary: Toggle a favorite item (event or movie)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemId
 *               - type
 *             properties:
 *               itemId:
 *                 type: string
 *                 description: ID of the event or movie
 *               type:
 *                 type: string
 *                 enum: [EVENT, MOVIE]
 *     responses:
 *       200:
 *         description: Favorite toggled successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/favorites', userController.toggleFavorite);

/**
 * @swagger
 * /users/favorites:
 *   get:
 *     summary: Get logged-in user's favorites
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorite items
 *       401:
 *         description: Unauthorized
 */
router.get('/favorites', userController.getMyFavorites);

module.exports = router;
