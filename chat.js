const express3 = require('express');
const router3 = express3.Router();
const db3 = require('./db');

// Get chat messages between two users
router3.get('/:from/:to', (req, res) => {
    const { from, to } = req.params;
    const query = `SELECT * FROM messages WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?) ORDER BY timestamp ASC`;
    db3.query(query, [from, to, to, from], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
});

// Send a message
router3.post('/', (req, res) => {
    const { sender, receiver, content } = req.body;
    const query = 'INSERT INTO messages (sender, receiver, content, timestamp) VALUES (?, ?, ?, NOW())';
    db3.query(query, [sender, receiver, content], (err) => {
        if (err) return res.status(500).json({ message: 'Failed to send message', error: err });
        res.json({ message: 'Message sent' });
    });
});

module.exports = router3;
