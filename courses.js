const express = require('express');
const router = express.Router();
const pool = require('./db');

// GET - Lấy tất cả khóa học
router.get('/', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM courses');
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

// GET - Lấy thông tin đăng ký khóa học của người dùng
router.get('/registrations', async (req, res) => {
    try {
        const userId = req.user.id;
        const [results] = await pool.query(`
            SELECT c.*, uc.registered_at 
            FROM courses c
            JOIN user_course uc ON c.course_id = uc.course_id
            WHERE uc.user_id = ?
        `, [userId]);
        res.json(results);
    } catch (err) {
        console.error('Error fetching course registrations:', err);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching course registrations',
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
        const [result] = await pool.query(
            'INSERT INTO courses (course_id, name) VALUES (?, ?)',
            [course_id, name]
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

// POST - Đăng ký khóa học
router.post('/register', async (req, res) => {
    const { course_id } = req.body;
    const userId = req.user.id;

    if (!course_id) {
        return res.status(400).json({ 
            success: false,
            message: 'Course ID is required' 
        });
    }

    try {
        // Kiểm tra xem khóa học đã tồn tại chưa
        const [course] = await pool.query(
            'SELECT * FROM courses WHERE course_id = ?',
            [course_id]
        );

        if (course.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Course not found' 
            });
        }

        // Kiểm tra xem đã đăng ký chưa
        const [existing] = await pool.query(
            'SELECT * FROM user_course WHERE user_id = ? AND course_id = ?',
            [userId, course_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Already registered for this course' 
            });
        }

        // Đăng ký khóa học
        await pool.query(
            'INSERT INTO user_course (user_id, course_id) VALUES (?, ?)',
            [userId, course_id]
        );

        res.json({ 
            success: true,
            message: 'Successfully registered for the course'
        });
    } catch (err) {
        console.error('Error registering for course:', err);
        res.status(500).json({ 
            success: false,
            message: 'Error registering for course',
            error: err.message
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
        const [result] = await pool.query(
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
