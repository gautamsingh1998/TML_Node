const express = require('express');
const authController = require('../controllers/authController');
//const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Register a new user
router.post('/register', authController.register);

// User login
router.post('/login', authController.login);
//router.get('/protected', authMiddleware, authController.protectedRoute);

module.exports = router;
