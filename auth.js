const express = require('express');
const router = express.Router();
const db = require('./db'); // Đảm bảo bạn đã kết nối DB từ file db.js

// Đăng ký tài khoản
// Route /register
router.post('/register', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'email and password are required' });
    }

    const checkUserQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(checkUserQuery, [email], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });

        if (results.length > 0) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const insertUserQuery = 'INSERT INTO users (email, password) VALUES (?, ?)';
        db.query(insertUserQuery, [email, password], (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });

            return res.status(201).json({ message: 'User registered successfully' });
        });
    });
});

// Đăng nhập
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
    db.query(query, [email, password], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });

        // Kiểm tra xem người dùng có tồn tại không
        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid  or password' });
        }

        // Đăng nhập thành công
        return res.status(200).json({ message: 'Login successful', email: results[0] });
    });
});

module.exports = router;
