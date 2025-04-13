const express = require('express');
const router = express.Router();
const db = require('./db');

// Get students in a course
router.get('/:courseId/students', (req, res) => {
    const courseId = req.params.courseId;
    db.query('SELECT * FROM students WHERE course_id = ?', [courseId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
});

// Add student to a course by username
router.post('/:courseId/students', (req, res) => {
    const courseId = req.params.courseId;
    const { email } = req.body;
    const getStudentQuery = 'SELECT id FROM students WHERE email = ?';

    db.query(getStudentQuery, [username], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        const studentId = results[0].id;
        const updateQuery = 'UPDATE students SET course_id = ? WHERE id = ?';
        db.query(updateQuery, [courseId, studentId], (err2) => {
            if (err2) return res.status(500).json({ message: 'Failed to assign student to course' });
            res.json({ message: 'Student added to course' });
        });
    });
});

module.exports = router;