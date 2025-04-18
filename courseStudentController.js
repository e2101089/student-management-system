const express = require('express');
const router = express.Router();
const db = require('./db');

// Lấy danh sách sinh viên theo course_id
router.get('/students/:courseId', (req, res) => {
    const { courseId } = req.params;
    const query = `
        SELECT s.id, s.name, s.email 
        FROM course_students cs
        JOIN students s ON cs.student_id = s.id
        WHERE cs.course_id = ?
    `;
    db.query(query, [courseId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
});

// Ghi điểm danh
router.post('/attendance', (req, res) => {
    const { student_id, course_id, date, status } = req.body;
    const query = `INSERT INTO attendance (student_id, course_id, date, status) VALUES (?, ?, ?, ?)`;
    db.query(query, [student_id, course_id, date, status], (err) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Attendance recorded' });
    });
});

// Ghi điểm
router.post('/grade', (req, res) => {
    const { student_id, course_id, score } = req.body;
    const query = `INSERT INTO grades (student_id, course_id, score) VALUES (?, ?, ?)`;
    db.query(query, [student_id, course_id, score], (err) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Grade recorded' });
    });
});

module.exports = router;
