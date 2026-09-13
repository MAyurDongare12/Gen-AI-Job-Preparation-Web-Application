const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: [true, "Username already taken"],
        required: [true, "Username is required"],
        trim: true
    },
    email: {
        type: String,
        unique: [true, "Account already exists with this email address"],
        required: [true, "Email is required"],
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters"]
    }
}, {
    timestamps: true
});

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;

