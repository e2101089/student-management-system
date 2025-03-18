const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();
const port = 12096;

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Create a MySQL connection
const db = mysql.createConnection({
    host: 'mariadb.vamk.fi',
    user: 'e2101089',
    password: 'gJztwcB7nUG',
    database: 'e2101089_student_management'
});

// Connect to the database
db.connect(err => {
    if (err) {
        console.error('Database connection error:', err);
        return;
    }
    console.log('Connected to the database');
});

// API endpoint for adding a course
app.post('/addCourse', (req, res) => {
    const { courseName, courseCode } = req.body;

    // Validate course code format (if needed)
    if (!isValidCourseCode(courseCode)) {
        return res.status(400).json({ message: 'Invalid course code format' });
    }

    // Insert course into the database
    const insertQuery = 'INSERT INTO Courses (courseName, courseCode) VALUES (?, ?)';
    db.query(insertQuery, [courseName, courseCode], (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        if (result.affectedRows > 0) {
            return res.status(201).json({ message: 'Course added successfully' });
        } else {
            return res.status(400).json({ message: 'Failed to add course' });
        }
    });
});

// Function to validate course code format
function isValidCourseCode(courseCode) {
    // Example regex for validating course code (modify as needed)
    const courseCodeRegex = /^[A-Z]{3}\d{3}$/; // This requires a pattern like ABC123
    return courseCodeRegex.test(courseCode);
}

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

module.exports = router;