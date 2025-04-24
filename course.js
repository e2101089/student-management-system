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

// GET - Lấy thông tin chi tiết của một khóa học
router.get('/:course_id', async (req, res) => {
  try {
    const courseId = req.params.course_id;
    const [course] = await db.query('SELECT * FROM courses WHERE course_id = ?', [courseId]);
    
    if (!course || course.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Lấy danh sách học sinh trong khóa học
    const [students] = await db.query(`
      SELECT s.*, u.name, u.email, u.phone 
      FROM course_students cs
      JOIN students s ON cs.student_id = s.student_id
      JOIN users u ON s.student_id = u.user_id
      WHERE cs.course_id = ?
    `, [courseId]);

    // Lấy điểm danh của học sinh
    const [attendance] = await db.query(`
      SELECT a.*, s.name as student_name
      FROM attendance a
      JOIN students s ON a.student_id = s.student_id
      WHERE a.course_id = ?
    `, [courseId]);

    // Lấy điểm số của học sinh
    const [grades] = await db.query(`
      SELECT g.*, s.name as student_name
      FROM grades g
      JOIN students s ON g.student_id = s.student_id
      WHERE g.course_id = ?
    `, [courseId]);

    res.json({
      success: true,
      data: {
        course: course[0],
        students: students,
        attendance: attendance,
        grades: grades
      }
    });
  } catch (err) {
    console.error('Error fetching course details:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching course details',
      error: err.message
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

// POST - Thêm học sinh vào khóa học
router.post('/:course_id/students', async (req, res) => {
  const courseId = req.params.course_id;
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Student name, email and phone are required'
    });
  }

  try {
    // Thêm học sinh vào bảng users
    const [userResult] = await db.query(
      'INSERT INTO users (name, email, phone, role) VALUES (?, ?, ?, ?)',
      [name, email, phone, 'student']
    );

    const studentId = userResult.insertId;

    // Thêm học sinh vào bảng students
    await db.query(
      'INSERT INTO students (student_id, name, email, phone) VALUES (?, ?, ?, ?)',
      [studentId, name, email, phone]
    );

    // Thêm học sinh vào khóa học
    await db.query(
      'INSERT INTO course_students (course_id, student_id) VALUES (?, ?)',
      [courseId, studentId]
    );

    res.status(201).json({
      success: true,
      message: 'Student added to course successfully',
      student_id: studentId
    });
  } catch (err) {
    console.error('Error adding student to course:', err);
    res.status(500).json({
      success: false,
      message: 'Error adding student to course',
      error: err.message
    });
  }
});

// POST - Điểm danh học sinh
router.post('/:course_id/attendance', async (req, res) => {
  const courseId = req.params.course_id;
  const { student_id, status } = req.body;

  if (!student_id || !status) {
    return res.status(400).json({
      success: false,
      message: 'Student ID and status are required'
    });
  }

  try {
    await db.query(
      'INSERT INTO attendance (course_id, student_id, status, date) VALUES (?, ?, ?, NOW())',
      [courseId, student_id, status]
    );

    res.json({
      success: true,
      message: 'Attendance recorded successfully'
    });
  } catch (err) {
    console.error('Error recording attendance:', err);
    res.status(500).json({
      success: false,
      message: 'Error recording attendance',
      error: err.message
    });
  }
});

// POST - Cập nhật điểm số
router.post('/:course_id/grades', async (req, res) => {
  const courseId = req.params.course_id;
  const { student_id, grade } = req.body;

  if (!student_id || grade === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Student ID and grade are required'
    });
  }

  try {
    await db.query(
      'INSERT INTO grades (course_id, student_id, grade) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE grade = ?',
      [courseId, student_id, grade, grade]
    );

    res.json({
      success: true,
      message: 'Grade updated successfully'
    });
  } catch (err) {
    console.error('Error updating grade:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating grade',
      error: err.message
    });
  }
});

// DELETE - Xóa khóa học
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

// DELETE - Xóa học sinh khỏi khóa học
router.delete('/:course_id/students/:student_id', async (req, res) => {
  const { course_id, student_id } = req.params;

  try {
    await db.query(
      'DELETE FROM course_students WHERE course_id = ? AND student_id = ?',
      [course_id, student_id]
    );

    res.json({
      success: true,
      message: 'Student removed from course successfully'
    });
  } catch (err) {
    console.error('Error removing student from course:', err);
    res.status(500).json({
      success: false,
      message: 'Error removing student from course',
      error: err.message
    });
  }
});

module.exports = router; 