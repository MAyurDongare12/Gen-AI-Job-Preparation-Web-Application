const jwt = require('jsonwebtoken');
const tokenBlacklistModel = require('../models/blacklist.model');

async function authUser(req, res, next) {
    try {
        let token = req.cookies?.token;
        if (!token && req.headers?.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.slice(7).trim();
            } else {
                token = authHeader.trim();
            }
        }
        if (!token && req.query?.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({
                message: "Authentication required. Token not provided."
            });
        }

        const isTokenBlacklisted = await tokenBlacklistModel.findOne({ token });
        if (isTokenBlacklisted) {
            return res.status(401).json({
                message: "Session expired or invalid. Please log in again."
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        req.token = token;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err.message);
        return res.status(401).json({
            message: "Invalid or expired token. Please log in again."
        });
    }
}

module.exports = { authUser };