const userModel = require('../models/user.model');
const tokenBlacklistModel = require('../models/blacklist.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * @name registerUserController
 * @description Register a new user, expects username, email and password in the request body
 * @access Public
 */
async function registerUserController(req, res) {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Please provide username, email and password"
            })
        }

        const isUserAlredyExists = await userModel.findOne({
            $or: [
                { username },
                { email }
            ]
        })

        if (isUserAlredyExists) {
            return res.status(400).json({
                message: "Account with this username or email already exists"
            })
        }

        const hash = await bcrypt.hash(password, 10)

        const user = await userModel.create({
            username,
            email,
            password: hash
        })

        const token = jwt.sign({
            id: user._id.toString(),
            username: user.username
        },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        )

        res.cookie('token', token, {
            httpOnly: true,
            secure: true, // Required for cross-site cookies
            sameSite: 'none', // Required for cross-site cookies
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        })
        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (error) {
        console.error('Error in registerUserController:', error);
        res.status(500).json({
            message: "Failed to register user",
            error: error.message
        });
    }
}

/**
 * @name loginUserController
 * @description Login a user, expects email and password in the request body
 * @access Public
 */

async function loginUserController(req, res) {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({
            email
        })

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }

        const token = jwt.sign({
            id: user._id.toString(),
            username: user.username
        },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        )

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        })
        res.status(200).json({
            message: "User logged in successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (error) {
        console.error('Error in loginUserController:', error);
        res.status(500).json({
            message: "Failed to login",
            error: error.message
        });
    }
}

/**
 * @name logoutUserController
 * @description Logout a user by blacklisting the token in the cookie
 * @access Public
 */
async function logoutUserController(req, res) {
    try {
        const token = req.cookies.token;

        if (token) {
            await tokenBlacklistModel.create({
                token
            })
        }
        res.clearCookie('token', {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        });
        res.status(200).json({
            message: "User logged out successfully"
        })
    } catch (error) {
        console.error('Error in logoutUserController:', error);
        res.status(500).json({
            message: "Failed to logout",
            error: error.message
        });
    }
}

/**
 * @name getMeController
 * @description Get the details of the logged in user, expects token in cookie
 * @access Private
 */
async function getMeController(req, res) {
    try {
        const user = await userModel.findById(req.user.id)
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
            message: "User details fetched successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (error) {
        console.error('Error in getMeController:', error);
        res.status(500).json({
            message: "Failed to fetch user details",
            error: error.message
        });
    }
}

module.exports = { registerUserController, loginUserController, logoutUserController, getMeController }
