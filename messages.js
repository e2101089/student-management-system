const express = require('express');
const router = express.Router();
const db = require('./db');

// Gửi tin nhắn
router.post('/', (req, res) => {
  const { sender_id, receiver_id, message } = req.body;
  
  const query = 'INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)';
  db.query(query, [sender_id, receiver_id, message], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(201).json({ message: 'Message sent successfully' });
  });
});

// Lấy tin nhắn giữa học sinh và giáo viên
router.get('/:sender_id/:receiver_id', (req, res) => {
  const { sender_id, receiver_id } = req.params;
  
  const query = 'SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)';
  db.query(query, [sender_id, receiver_id, receiver_id, sender_id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(200).json(results);
  });
});

module.exports = router;
