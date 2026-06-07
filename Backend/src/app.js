const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:5173',
            'https://genai-job-preparation-web-app.netlify.app',
            'https://gen-ai-job-preparation-web-application.vercel.app'
        ];
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
/* require all the routes here */
const authRouter = require('./routes/auth.routes');
const interviewRouter = require("./routes/interview.routes")

/* using all the routes here */
app.use('/api/auth', authRouter);
app.use("/api/interview", interviewRouter)

// Global error handler middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

module.exports = app;