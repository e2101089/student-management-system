const express = require('express');
const router = express.Router();
const db = require('./db');

// Get all students in a course (via enrollments)
// Get all students in a course (via enrollments)
router.get('/course/:courseId/students', (req, res) => {
    const courseId = req.params.courseId;

    const query = `
        SELECT s.student_id, s.email, s.phone
        FROM enrollments e
        JOIN students s ON e.student_id = s.student_id
        WHERE e.course_id = ?;
    `;

    db.query(query, [courseId], (err, results) => {
        if (err) {
            console.log('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'No students found for this course' });
        }

        res.json(results);
    });
});

// Add student to a course by student_id, name, email, phone
router.post('/course/:courseId/enrollments', (req, res) => {
    const course_id = req.params.courseId;
    const { student_id, name, email, phone } = req.body;

    if (!student_id || !name || !email || !phone || !courseId) {
        console.log('Request body:', req.body);
        console.log('Course ID:', req.params.courseId);        
        return res.status(400).json({ message: 'Course ID, Student ID, Name, Email, and Phone are required' });
    }

    // Kiểm tra xem sinh viên có tồn tại trong bảng students không
    const getStudentQuery = 'SELECT id FROM students WHERE student_id = ?';
    db.query(getStudentQuery, [student_id], (err, results) => {
        if (err) {
            console.log('Error checking student existence:', err);
            return res.status(500).json({ message: 'Error checking student existence', error: err });
        }

        if (results.length === 0) {
            // Nếu sinh viên không tồn tại, thêm sinh viên mới vào bảng students
            const insertStudentQuery = 'INSERT INTO students (student_id, name, email, phone) VALUES (?, ?, ?, ?)';
            db.query(insertStudentQuery, [student_id, name, email, phone], (insertErr, insertResults) => {
                if (insertErr) {
                    console.log('Error inserting student:', insertErr);
                    return res.status(500).json({ message: 'Failed to add student', error: insertErr });
                }

                // Sau khi thêm sinh viên, tiếp tục thêm sinh viên vào khóa học
                const studentId = insertResults.insertId; // Lấy ID của sinh viên mới thêm

                // Kiểm tra xem sinh viên đã đăng ký khóa học này chưa
                const checkEnrollmentQuery = 'SELECT * FROM enrollments WHERE course_id = ? AND student_id = ?';
                db.query(checkEnrollmentQuery, [courseId, studentId], (checkErr, checkResults) => {
                    if (checkErr) {
                        console.log('Error checking enrollment:', checkErr);
                        return res.status(500).json({ message: 'Error checking enrollment', error: checkErr });
                    }

                    if (checkResults.length > 0) {
                        return res.status(400).json({ message: 'Student already enrolled in this course' });
                    }

                    // Nếu chưa đăng ký, thêm sinh viên vào khóa học
                    const insertEnrollmentQuery = 'INSERT INTO enrollments (course_id, student_id) VALUES (?, ?)';
                    db.query(insertEnrollmentQuery, [courseId, studentId], (enrollErr) => {
                        if (enrollErr) {
                            console.log('Error inserting enrollment:', enrollErr);
                            return res.status(500).json({ message: 'Failed to enroll student', error: enrollErr });
                        }
                        res.json({ message: 'Student enrolled successfully' });
                    });
                });
            });
        } else {
            // Sinh viên đã tồn tại, kiểm tra xem họ đã đăng ký khóa học chưa
            const studentId = results[0].id;

            const checkEnrollmentQuery = 'SELECT * FROM enrollments WHERE course_id = ? AND student_id = ?';
            db.query(checkEnrollmentQuery, [courseId, studentId], (checkErr, checkResults) => {
                if (checkErr) {
                    console.log('Error checking enrollment:', checkErr);
                    return res.status(500).json({ message: 'Error checking enrollment', error: checkErr });
                }

                if (checkResults.length > 0) {
                    return res.status(400).json({ message: 'Student already enrolled in this course' });
                }

                // Nếu chưa đăng ký, thêm sinh viên vào khóa học
                const insertEnrollmentQuery = 'INSERT INTO enrollments (course_id, student_id) VALUES (?, ?)';
                db.query(insertEnrollmentQuery, [courseId, studentId], (enrollErr) => {
                    if (enrollErr) {
                        console.log('Error inserting enrollment:', enrollErr);
                        return res.status(500).json({ message: 'Failed to enroll student', error: enrollErr });
                    }
                    res.json({ message: 'Student enrolled successfully' });
                });
            });
        }
    });
});

// Record attendance
router.post('/attendance', (req, res) => {
    const { enrollment_id, date, status } = req.body;

    if (!enrollment_id || !date || !status) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const query = 'INSERT INTO attendance (enrollment_id, date, status) VALUES (?, ?, ?)';
    db.query(query, [enrollment_id, date, status], (err) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.status(201).json({ message: 'Attendance recorded successfully' });
    });
});

// Record grades and feedback
router.post('/grade', (req, res) => {
    const { enrollment_id, subject, score, comment, behavior } = req.body;

    if (!enrollment_id || !subject || score === undefined || comment === undefined || behavior === undefined) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const query = 'INSERT INTO grades (enrollment_id, subject, score, comment, behavior) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [enrollment_id, subject, score, comment, behavior], (err) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.status(201).json({ message: 'Grade recorded successfully' });
    });
});

module.exports = router;
