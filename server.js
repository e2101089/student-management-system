const express = require('express');
const cors = require('cors');
const app = express();
const db = require('./db');
const bodyParser = require('body-parser');
const auth = require('./auth');

// Import routes
const studentController = require('./studentController');
const courseController = require('./courses');
const courseStudentController = require('./courseStudentController');
const authController = require('./auth');
const chatRoutes = require('./chat');

// CORS configuration
app.use(cors());

// Parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Use routes
app.use('/api/students', studentController);
app.use('/api/courses', courseController);
app.use('/api/course-students', courseStudentController);
app.use('/api/auth', authController);
app.use('/api/chat', chatRoutes);

// Test database connection
app.get('/api/test-db', async (req, res) => {
    try {
        const [result] = await db.query('SELECT 1');
        res.json({ success: true, message: 'Database connection successful' });
    } catch (err) {
        console.error('Database connection error:', err);
        res.status(500).json({ success: false, message: 'Database connection failed', error: err.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something broke!', error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});