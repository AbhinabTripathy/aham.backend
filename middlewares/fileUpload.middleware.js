const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');

const fileUploadMiddleware = fileUpload({
    createParentPath: true,
    limits: { 
        fileSize: 50 * 1024 * 1024 // 50MB max file size
    },
    abortOnLimit: true,
    responseOnLimit: "File size limit has been reached",
    useTempFiles: true,
    tempFileDir: path.join(__dirname, '../temp')
});

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

module.exports = fileUploadMiddleware;