const express = require('express');
const router = express.Router();
const db = require('./db');

// Get notifications for a user
router.get('/notifications', async (req, res) => {
    const { user_id } = req.query;
    
    try {
        const [notifications] = await db.query(
            `SELECT * FROM notifications 
             WHERE user_id = ? 
             ORDER BY created_at DESC`,
            [user_id]
        );

        return res.status(200).json({
            success: true,
            data: notifications
        });
    } catch (err) {
        console.error('Error fetching notifications:', err);
        return res.status(500).json({
            success: false,
            message: 'Error fetching notifications',
            error: err.message
        });
    }
});

// Create a new notification
router.post('/notifications', async (req, res) => {
    const { user_id, message, type } = req.body;
    
    try {
        const [result] = await db.query(
            `INSERT INTO notifications (user_id, message, type, created_at) 
             VALUES (?, ?, ?, NOW())`,
            [user_id, message, type]
        );

        return res.status(201).json({
            success: true,
            message: 'Notification created successfully',
            data: { id: result.insertId }
        });
    } catch (err) {
        console.error('Error creating notification:', err);
        return res.status(500).json({
            success: false,
            message: 'Error creating notification',
            error: err.message
        });
    }
});

// Mark notification as read
router.put('/notifications/:id/read', async (req, res) => {
    const { id } = req.params;
    
    try {
        await db.query(
            `UPDATE notifications 
             SET is_read = 1 
             WHERE id = ?`,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (err) {
        console.error('Error marking notification as read:', err);
        return res.status(500).json({
            success: false,
            message: 'Error marking notification as read',
            error: err.message
        });
    }
});

module.exports = router; 