const express = require('express');
const User = require('../user'); // Giả sử bạn đã tạo mô hình User

module.exports = (db) => {
    const router = express.Router();
    const userModel = new User(db);

    // Đăng ký
    router.post('/register', (req, res) => {
        const { email, password } = req.body;
        userModel.register(email, password, (err) => {
            if (err) {
                return res.status(500).send('Error registering user');
            }
            res.status(201).send('User  registered');
        });
    });

    // Đăng nhập
    router.post('/login', (req, res) => {
        const { email, password } = req.body;
        userModel.login(email, password, (err, user) => {
            if (err) {
                return res.status(500).send('Error logging in');
            }
            if (user) {
                req.session.userId = user.id;
                return res.redirect('/dashboard.html');
            }
            return res.status(401).send('Incorrect password or user not found');
        });
    });

    return router;
};