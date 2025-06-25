const express = require('express');
require('dotenv').config();
const sequelize = require('./config/db');
const sendResponse = require('./middlewares/response.middleware');
const handleNotFound = require('./middlewares/notFound.middleware');
const errorHandler = require('./middlewares/errorHandler.middleware');
const userRoutes = require('./routes/user.routes');

const cors = require('cors');
const path = require('path');

const app = express();

// Environment variables
const port = process.env.APP_PORT || 3000;
const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'https://ahamcore.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(sendResponse);

// File upload middleware
const fileUploadMiddleware = require('./middlewares/fileUpload.middleware');
app.use(fileUploadMiddleware);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const creatorRoutes = require('./routes/creator.routes');
const graphicNovelRoutes = require('./routes/graphicNovel.routes');
const audiobookRoutes = require('./routes/audiobook.routes');
const adminRoutes = require('./routes/admin.routes');

// Routes
app.get('/', (req, res) => {
    res.success(200, 'true', 'Welcome to AhamCore API', { version: '1.0.0' });
});

// API routes
app.use('/api/creators', creatorRoutes);
app.use('/api/graphic-novels', graphicNovelRoutes);
app.use('/api/audiobooks', audiobookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);


// Error handling middleware
app.use(handleNotFound);
app.use(errorHandler);

// Database connection and server startup
async function startServer() {
    try {
        // Connect to database
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        
        // Sync models
        try {
            await sequelize.sync({ force: false, alter: true });
            console.log('Database tables synced successfully.');
        } catch (syncError) {
            console.error("Database sync error:", syncError);
            console.log("Continuing server startup despite sync issues...");
        }
        
        // Start the server
        app.listen(port, () => {
            console.log(`Server running at: ${baseUrl}`);
        });
    } catch (error) {
        console.error("Server startup error:", error);
        process.exit(1); // Exit if startup fails
    }
}

startServer();

module.exports = app;


