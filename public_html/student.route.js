const express = require('express');

module.exports = (db) => {
    const router = express.Router();

    // Thêm học sinh
    router.post('/', (req, res) => {
        const { name, email, phone } = req.body;
        db.query('INSERT INTO students (name, email, phone) VALUES (?, ?, ?)', [name, email, phone], (err) => {
            if (err) {
                return res.status(500).send('Error adding student');
            }
            res.status(201).send('Student added');
        });
    });

    // Lấy danh sách học sinh
    router.get('/', (req, res) => {
        db.query('SELECT * FROM students', (err, results) => {
            if (err) {
                return res.status(500).send('Error fetching students');
            }
            res.json(results);
        });
    });

    // Xóa học sinh
    router.delete('/:id', (req, res) => {
        db.query('DELETE FROM students WHERE id = ?', [req.params.id], (err) => {
            if (err) {
                return res.status(500).send('Error deleting student');
            }
            res.status(204).send();
        });
    });

    return router;
};