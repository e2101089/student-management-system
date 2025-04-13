const express = require('express');
const router = express.Router();
const db = require('./db'); // file db.js của bạn

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

module.exports = router;
