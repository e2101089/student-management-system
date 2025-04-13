const express = require('express');
const router = express.Router();
const db = require('./db');

// Lấy danh sách khóa học
router.get('/', (req, res) => {
  db.query('SELECT * FROM courses', (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(200).json(results);
  });
});

// Thêm khóa học
router.post('/', (req, res) => {
  const { names, teacher_id } = req.body;
  const query = 'INSERT INTO courses (name) VALUES (?)';
  db.query(query, [name, description, teacher_id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(201).json({ message: 'Course created successfully', courseId: results.insertId });
  });
});

// Xóa khóa học
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM courses WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(200).json({ message: 'Course deleted successfully' });
  });
});

module.exports = router;
