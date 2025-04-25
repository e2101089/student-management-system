const express = require('express');
const router = express.Router();
const pool = require('./db');

// Register route
// Register route
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Email and password are required' 
            });
        }

        // Check if user exists
        const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Email already exists' 
            });
        }

        // Insert new user with plain text password (No hashing, just storing plain text)
        const [result] = await pool.query(
            'INSERT INTO users (email, password, role) VALUES (?, ?, "teacher")', // role mặc định là "teacher"
            [email, password]  // Mã hóa mật khẩu nếu cần, nhưng không làm trong ví dụ này
        );

        return res.status(201).json({ 
            success: true,
            message: 'User registered successfully',
            userId: result.insertId // Lấy ID của người dùng vừa được tạo
        });
    } catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ 
            success: false,
            message: 'Registration failed',
            error: err.message 
        });
    }
});


// Login route
router.post('/login', async (req, res) => {
    console.log('=== Login Request ===');
    console.log('Request body:', req.body);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
        console.log('Missing credentials');
        return res.status(400).json({ 
            success: false, 
            message: 'Email and password are required' 
        });
    }

    try {
        console.log('Querying database for user:', email);
        const [users] = await pool.query('SELECT user_id, email, password, role FROM users WHERE email = ?', [email]);

        console.log('Database response:', users);

        if (users.length === 0) {
            console.log('No user found');
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        const user = users[0];
        console.log('Found user:', user);

        if (password !== user.password) {
            console.log('Password mismatch');
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        const userData = {
            id: user.user_id,
            email: user.email,
            role: user.role || 'user'
        };

        console.log('Preparing response with user data:', userData);
        
        // Set headers
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        
        // Send response
        res.status(200).json({
            success: true,
            message: 'Login successful',
            user: userData
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'An error occurred during login' 
        });
    }
});

module.exports = router;