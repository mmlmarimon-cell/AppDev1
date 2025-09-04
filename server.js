const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const multer = require('multer');

// Initialize multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Store files in the 'uploads' directory
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir); // Create the 'uploads' directory if it doesn't exist
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Use the original file name
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// File upload filter to allow only specific file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
    }
    cb(null, true);
};

// Set up the multer middleware
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // Limit file size to 5MB

const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>', 'utf8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': mime.lookup(filePath) || 'text/html' });
            res.end(content, 'utf8');
        }
    });
});

// Handle file upload route
server.on('request', (req, res) => {
    if (req.url === '/upload' && req.method === 'POST') {
        // Handle the file upload request
        upload.single('file')(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                // Multer-specific error (e.g., file too large)
                res.writeHead(400, { 'Content-Type': 'text/html' });
                res.end(`<h1>Error: ${err.message}</h1>`);
            } else if (err) {
                // Other errors (e.g., invalid file type)
                res.writeHead(400, { 'Content-Type': 'text/html' });
                res.end(`<h1>Error: ${err.message}</h1>`);
            } else {
                // Success - file uploaded
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end('<h1>File uploaded successfully!</h1>');
            }
        });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
