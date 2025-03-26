const express = require('express');

module.exports = (db) => {
    const router = express.Router();

    // Thêm khóa học
    router.post('/', (req, res) => {
        const { name } = req.body;
        db.query('INSERT INTO courses (name) VALUES (?)', [name], (err) => {
            if (err) {
                return res.status(500).send('Error adding course');
            }
            res.status(201).send('Course added');
        });
    });

    // Lấy danh sách khóa học
    router.get('/', (req, res) => {
        db.query('SELECT * FROM courses', (err, results) => {
            if (err) {
                return res.status(500).send('Error fetching courses');
            }
            res.json(results);
        });
    });

    // Xóa khóa học
    router.delete('/:id', (req, res) => {
        db.query('DELETE FROM courses WHERE id = ?', [req.params.id], (err) => {
            if (err) {
                return res.status(500).send('Error deleting course');
            }
            res.status(204).send();
        });
    });

    return router;
};