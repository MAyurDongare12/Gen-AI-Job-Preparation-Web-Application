const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authRouter = express.Router();

/**
 * @route POST /api/auth/register
 * @description Register a new user
 * @access Public
 */

authRouter.post('/register', authController.registerUserController)


/**
 * @route POST /api/auth/login
 * @description Login a user with email and password, returns a JWT token in cookie
 * @access Public
 */
authRouter.post('/login', authController.loginUserController)

/**
 * @route POST /api/auth/logout
 * @description Logout a user by blacklisting the token, expects token in cookie
 * @access Public
 */
authRouter.get('/logout', authController.logoutUserController)

/**
 * @route GET /api/auth/get-me
 * @description Get the details of the logged in user, expects token in cookie
 * @access Private
 */
authRouter.get('/get-me', authMiddleware.authUser, authController.getMeController)
    
 

module.exports = authRouter;