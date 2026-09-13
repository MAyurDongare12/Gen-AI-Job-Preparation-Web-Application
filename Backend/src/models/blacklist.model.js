const mongoose = require('mongoose');

const blacklistTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, "Token is required to be added in blacklist"],
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // 24 hours in seconds
    }
});

const tokenBlacklistModel = mongoose.model('blacklistTokens', blacklistTokenSchema);

module.exports = tokenBlacklistModel;