const mongoose = require('mongoose');

let isConnected = false

async function connectDB() {
    if (!process.env.MONGO_URI) {
        console.error('❌ MONGO_URI is not set. The server will start but DB calls will fail until this env var is configured.')
        return
    }

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000, // fail fast instead of hanging
        })

        isConnected = true
        console.log("Connected to MongoDB");

        // Log any future connection errors (e.g. dropped connection in production)
        mongoose.connection.on('error', (err) => {
            console.error('❌ Mongoose connection error:', err.message)
            isConnected = false
        })
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ Mongoose disconnected')
            isConnected = false
        })
        mongoose.connection.on('reconnected', () => {
            console.log('✅ Mongoose reconnected')
            isConnected = true
        })
    } catch (err) {
        console.error('❌ Failed to connect to MongoDB:', err.message)
        console.error('   The server will keep running but DB calls will fail. Fix the MONGO_URI env var in Render and restart.')
        // Don't exit — keep the server alive so the /health endpoint can be hit
        // to diagnose the issue. The owner can fix MONGO_URI and restart the service.
    }
}

function getDbStatus() {
    return {
        isConnected,
        readyState: mongoose.connection.readyState, // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
        host: mongoose.connection.host || null,
    }
}

module.exports = connectDB;
module.exports.getDbStatus = getDbStatus;