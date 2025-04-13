const express = require('express');
const cors = require('cors');
const app = express();

// Kết nối router
const authRoutes = require('./auth'); // đường dẫn tới auth.js

// Middleware
app.use(cors());
app.use(express.json()); // QUAN TRỌNG để đọc req.body là JSON

// Routes
app.use('/api', authRoutes); // Bắt đầu với /api

// Start server
app.listen(5000, () => {
    console.log('Server running on http://localhost:5000');
});
