const mongoose = require('mongoose');

async function connectDB() {
    if (!process.env.MONGO_URI) {
        console.error('❌ MONGO_URI is not set in environment. Refusing to start.');
        process.exit(1)
    }

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000, // fail fast instead of hanging
        })

        console.log("Connected to MongoDB");

        // Log any future connection errors (e.g. dropped connection in production)
        mongoose.connection.on('error', (err) => {
            console.error('❌ Mongoose connection error:', err.message)
        })
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ Mongoose disconnected')
        })
    } catch (err) {
        console.error('❌ Failed to connect to MongoDB:', err.message)
        process.exit(1)
    }
}

module.exports = connectDB;