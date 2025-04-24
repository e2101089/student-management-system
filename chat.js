const express = require('express');
const router = express.Router();
const pool = require('./db');

// GET - Lấy thông tin giáo viên
router.get('/teacher', async (req, res) => {
    try {
        console.log('Fetching teacher information...');
        
        // Lấy thông tin giáo viên từ bảng users
        const [teachers] = await pool.query(`
            SELECT user_id, name, email, role 
            FROM users 
            WHERE role = 'teacher' 
            LIMIT 1
        `);

        console.log('Teacher query result:', teachers);

        if (!teachers || teachers.length === 0) {
            // Nếu không có giáo viên, tạo một giáo viên mặc định
            const [result] = await pool.query(`
                INSERT INTO users (name, email, role) 
                VALUES ('Default Teacher', 'teacher@example.com', 'teacher')
            `);
            
            const [newTeacher] = await pool.query(`
                SELECT user_id, name, email, role 
                FROM users 
                WHERE user_id = ?
            `, [result.insertId]);

            return res.json({
                success: true,
                data: newTeacher[0]
            });
        }

        res.json({
            success: true,
            data: teachers[0]
        });
    } catch (error) {
        console.error('Error getting teacher:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting teacher information'
        });
    }
});

// GET - Lấy tin nhắn riêng tư giữa hai người trong khóa học
router.get('/private/:receiver_id', async (req, res) => {
    try {
        const receiverId = req.params.receiver_id;
        const courseId = req.query.course_id;
        const senderId = req.query.sender_id;

        if (!courseId || !senderId) {
            return res.status(400).json({
                success: false,
                message: 'Course ID and Sender ID are required'
            });
        }

        const [messages] = await pool.query(`
            SELECT id, course_id, sender_id, receiver_id, sender_name, message, created_at
            FROM private_messages
            WHERE course_id = ? 
            AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
            ORDER BY created_at ASC
        `, [courseId, senderId, receiverId, receiverId, senderId]);

        res.json({
            success: true,
            data: messages
        });
    } catch (err) {
        console.error('Error fetching private messages:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching messages',
            error: err.message
        });
    }
});

// POST - Gửi tin nhắn riêng tư
router.post('/private/:receiver_id', async (req, res) => {
    try {
        const receiverId = req.params.receiver_id;
        const { message, course_id, sender_id, sender_name } = req.body;

        if (!message || !course_id || !sender_id || !sender_name) {
            return res.status(400).json({
                success: false,
                message: 'Message, course_id, sender_id, and sender_name are required'
            });
        }

        const [result] = await pool.query(`
            INSERT INTO private_messages 
            (course_id, sender_id, receiver_id, sender_name, message) 
            VALUES (?, ?, ?, ?, ?)
        `, [course_id, sender_id, receiverId, sender_name, message]);

        res.json({
            success: true,
            message: 'Message sent successfully',
            data: {
                id: result.insertId,
                course_id,
                sender_id,
                receiver_id: receiverId,
                sender_name,
                message,
                created_at: new Date()
            }
        });
    } catch (err) {
        console.error('Error sending private message:', err);
        res.status(500).json({
            success: false,
            message: 'Error sending message',
            error: err.message
        });
    }
});

module.exports = router;
