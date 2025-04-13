const express2 = require('express');
const router2 = express2.Router();
const db2 = require('./db');

// Get student details
router2.get('/:id', (req, res) => {
    const id = req.params.id;
    db2.query('SELECT * FROM students WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results[0]);
    });
});

// Update student feedback
router2.post('/:id/feedback', (req, res) => {
    const id = req.params.id;
    const { score, comment, behavior } = req.body;
    const query = 'UPDATE students SET score = ?, comment = ?, behavior = ? WHERE id = ?';
    db2.query(query, [score || null, comment || null, behavior || null, id], (err) => {
        if (err) return res.status(500).json({ message: 'Update failed', error: err });
        res.json({ message: 'Student info updated' });
    });
});

module.exports = router2;