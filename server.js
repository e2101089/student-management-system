const express = require('express');
const cors = require('cors');
const app = express();
const db = require('./db'); // Kết nối DB
const studentController = require('./studentController');
const courseStudentController = require('./courseStudentController');

// Sử dụng middleware CORS ngay sau khi khởi tạo app
app.use(cors());

app.use(express.json()); // Middleware để parse body của yêu cầu

// Kết nối controller
app.use('/api/students', studentController);
app.use('/api/course-students', courseStudentController);

// Kết nối router courses.js
const courses = require('./courses'); // Import courses.js
app.use('/api/courses', courses); // Chuyển tất cả routes cho /api/courses sang courses.js

// Routes
const authRoutes = require('./auth'); // đường dẫn tới auth.js
app.use('/api', authRoutes); // Bắt đầu với /api

// Start server
app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
