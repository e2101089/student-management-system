const express = require('express');
const router = express.Router();
const db = require('./db');  // Điều chỉnh lại đường dẫn nếu cần

// Tạm thời gán teacher_id cố định (sau này thay bằng session)
const loggedInTeacherId = 1;  // Giả định teacher_id từ phiên đăng nhập hoặc session

// GET - Lấy tất cả khóa học của giáo viên
router.get('/', (req, res) => {
  const query = 'SELECT * FROM courses';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    res.json(results);
  });
});

// POST - Thêm một khóa học mới
router.post('/', (req, res) => {
  const { name, course_id } = req.body;
  if (!name || !course_id) {
    return res.status(400).json({ message: 'Missing name or course_id' });
  }

  const query = 'INSERT INTO courses (name, course_id) VALUES (?, ?)';
  db.query(query, [name, course_id], (err, results) => {
    if (err) {
      console.error('Database error:',err);
      return res.status(500).json({ message: 'Database error', error: err });
    }
    res.status(201).json({ message: 'Course created successfully', courseId: results.insertId });
  });
});

// DELETE - Xóa khóa học theo name và course_id
router.delete('/', (req, res) => {
  const { name, course_id } = req.body;

  if (!name || !course_id) {
    return res.status(400).json({ message: 'Missing name or course_id' });
  }

  const query = 'DELETE FROM courses WHERE name = ? AND course_id = ?';
  db.query(query, [name, course_id], (err, results) => {
    if (err) {
      console.error('Database error:', err); // In ra lỗi nếu có
      return res.status(500).json({ message: 'Database error', error: err });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json({ message: 'Course deleted successfully' });
  });
});

module.exports = router;
