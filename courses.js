const express = require('express');
const router = express.Router();
const db = require('./db');  // Điều chỉnh lại đường dẫn nếu cần

// Tạm thời gán teacher_id cố định (sau này thay bằng session)
const loggedInTeacherId = 1;  // Giả định teacher_id từ phiên đăng nhập hoặc session

// GET - Lấy tất cả khóa học của giáo viên
router.get('/', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM courses');
    res.json(results);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching courses',
      error: err.message,
      sqlError: err.sqlMessage
    });
  }
});

// POST - Thêm một khóa học mới
router.post('/', async (req, res) => {
  const { name, course_id } = req.body;
  
  if (!name || !course_id) {
    return res.status(400).json({ 
      success: false,
      message: 'Course name and ID are required' 
    });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO courses (name, course_id) VALUES (?, ?)',
      [name, course_id]
    );
    
    res.status(201).json({ 
      success: true,
      message: 'Course created successfully',
      course_id: course_id
    });
  } catch (err) {
    console.error('Error creating course:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error creating course',
      error: err.message,
      sqlError: err.sqlMessage
    });
  }
});

// DELETE - Xóa khóa học theo name và course_id
router.delete('/', async (req, res) => {
  const { name, course_id } = req.body;

  if (!name || !course_id) {
    return res.status(400).json({ 
      success: false,
      message: 'Course name and ID are required' 
    });
  }

  try {
    const [result] = await db.query(
      'DELETE FROM courses WHERE name = ? AND course_id = ?',
      [name, course_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      });
    }

    res.json({ 
      success: true,
      message: 'Course deleted successfully' 
    });
  } catch (err) {
    console.error('Error deleting course:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting course',
      error: err.message,
      sqlError: err.sqlMessage
    });
  }
});

module.exports = router;
