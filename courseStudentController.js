const express = require('express');
const router = express.Router();
const db = require('./db');

// Get all students in a course
router.get('/students/:course_id', async (req, res) => {
    const { course_id } = req.params;
    console.log('Fetching students for course:', course_id);
    
    try {
        // First verify the course exists
        const [courseRows] = await db.query('SELECT course_id FROM courses WHERE course_id = ?', [course_id]);
        if (!courseRows || courseRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        const query = `
            SELECT s.student_id, s.name, s.email, s.phone 
            FROM students s
            INNER JOIN enrollments e ON s.student_id = e.student_id
            WHERE e.course_id = ?
            ORDER BY s.name ASC
        `;
        const [results] = await db.query(query, [course_id]);
        console.log('Query results:', results);
        
        if (!results || !Array.isArray(results)) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            data: results
        });
    } catch (err) {
        console.error('Error fetching students:', err);
        return res.status(500).json({ 
            success: false,
            message: 'Error fetching students',
            error: err.message,
            sqlError: err.sqlMessage
        });
    }
});

// Record attendance
router.post('/attendance', async (req, res) => {
    const { student_id, course_id, date, status } = req.body;
    console.log('Recording attendance:', { student_id, course_id, date, status });

    if (!student_id || !course_id || !date || !status) {
        return res.status(400).json({ 
            success: false,
            message: 'All fields are required' 
        });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Get enrollment_id for the student in this course
        const [enrollment] = await connection.query(
            'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
            [student_id, course_id]
        );

        if (!enrollment || enrollment.length === 0) {
            await connection.rollback();
            return res.status(400).json({ 
                success: false,
                message: 'Student is not enrolled in this course' 
            });
        }

        const enrollment_id = enrollment[0].id;

        // Check if attendance already exists for this student on this date
        const [existingAttendance] = await connection.query(
            'SELECT * FROM attendance WHERE student_id = ? AND enrollment_id = ? AND date = ?',
            [student_id, enrollment_id, date]
        );

        if (existingAttendance && existingAttendance.length > 0) {
            await connection.rollback();
            return res.status(400).json({ 
                success: false,
                message: 'Attendance already recorded for this student on this date' 
            });
        }

        // Record attendance with auto-increment id
        const [result] = await connection.query(
            'INSERT INTO attendance (id, student_id, enrollment_id, date, status) VALUES (NULL, ?, ?, ?, ?)',
            [student_id, enrollment_id, date, status]
        );

        await connection.commit();
        return res.status(201).json({ 
            success: true,
            message: 'Attendance recorded successfully' 
        });
    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error recording attendance:', err);
        return res.status(500).json({ 
            success: false,
            message: 'Error recording attendance',
            error: err.message,
            sqlError: err.sqlMessage
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Record grade
router.post('/grade', async (req, res) => {
    const { student_id, course_id, grade, comment, behavior } = req.body;
    console.log('Recording grade:', { student_id, course_id, grade, comment, behavior });

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // If student_id and course_id are provided, verify enrollment
        if (student_id && course_id) {
            const [enrollment] = await connection.query(
                'SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
                [student_id, course_id]
            );

            if (!enrollment || enrollment.length === 0) {
                await connection.rollback();
                return res.status(400).json({ 
                    success: false,
                    message: 'Student is not enrolled in this course' 
                });
            }

            // Check if grade already exists for this student in this course
            const [existingGrade] = await connection.query(
                'SELECT * FROM grades WHERE student_id = ? AND course_id = ?',
                [student_id, course_id]
            );

            if (existingGrade && existingGrade.length > 0) {
                await connection.rollback();
                return res.status(400).json({ 
                    success: false,
                    message: 'Grade already recorded for this student in this course' 
                });
            }
        }

        // Record grade with auto-increment id, including comment and behavior
        const [result] = await connection.query(
            'INSERT INTO grades (id, student_id, course_id, grade, comment, behavior, updated_at) VALUES (NULL, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
            [student_id || null, course_id || null, grade, comment || null, behavior || null]
        );

        await connection.commit();
        return res.status(201).json({ 
            success: true,
            message: 'Grade recorded successfully' 
        });
    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error recording grade:', err);
        return res.status(500).json({ 
            success: false,
            message: 'Error recording grade',
            error: err.message,
            sqlError: err.sqlMessage
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Get student attendance
router.get('/students/:course_id/attendance/:student_id', async (req, res) => {
    const { course_id, student_id } = req.params;
    console.log('Fetching attendance for student:', { student_id, course_id });

    try {
        // Verify student is enrolled in the course
        const [enrollment] = await db.query(
            'SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
            [student_id, course_id]
        );

        if (!enrollment || enrollment.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student is not enrolled in this course'
            });
        }

        const enrollment_id = enrollment[0].id;

        // Get attendance records using enrollment_id
        const [attendance] = await db.query(
            `SELECT a.*, s.name as student_name 
             FROM attendance a 
             JOIN students s ON a.student_id = s.student_id 
             WHERE a.student_id = ? AND a.enrollment_id = ? 
             ORDER BY a.date DESC`,
            [student_id, enrollment_id]
        );

        if (!attendance || !Array.isArray(attendance)) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            data: attendance
        });
    } catch (err) {
        console.error('Error fetching attendance:', err);
        return res.status(500).json({ 
            success: false,
            message: 'Error fetching attendance',
            error: err.message,
            sqlError: err.sqlMessage
        });
    }
});

// Get student grades
router.get('/students/:course_id/grades/:student_id', async (req, res) => {
    const { course_id, student_id } = req.params;
    console.log('Fetching grades for student:', { student_id, course_id });

    try {
        // Verify student is enrolled in the course
        const [enrollment] = await db.query(
            'SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
            [student_id, course_id]
        );

        if (!enrollment || enrollment.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student is not enrolled in this course'
            });
        }

        // Get grade records using course_id
        const [grades] = await db.query(
            `SELECT g.*, s.name as student_name 
             FROM grades g 
             JOIN students s ON g.student_id = s.student_id 
             WHERE g.student_id = ? AND g.course_id = ? 
             ORDER BY g.id DESC`,
            [student_id, course_id]
        );

        if (!grades || !Array.isArray(grades)) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            data: grades
        });
    } catch (err) {
        console.error('Error fetching grades:', err);
        return res.status(500).json({ 
            success: false,
            message: 'Error fetching grades',
            error: err.message,
            sqlError: err.sqlMessage
        });
    }
});

// Remove student from course
router.delete('/students/:course_id/enrollments/:student_id', async (req, res) => {
    const { course_id, student_id } = req.params;
    console.log('Removing student from course:', { student_id, course_id });

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Verify student is enrolled in the course
        const [enrollment] = await connection.query(
            'SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
            [student_id, course_id]
        );

        if (!enrollment || enrollment.length === 0) {
            await connection.rollback();
            return res.status(404).json({ 
                success: false,
                message: 'Student is not enrolled in this course' 
            });
        }

        // Delete attendance records
        await connection.query(
            'DELETE FROM attendance WHERE student_id = ? AND course_id = ?',
            [student_id, course_id]
        );

        // Delete grade records
        await connection.query(
            'DELETE FROM grades WHERE student_id = ? AND course_id = ?',
            [student_id, course_id]
        );

        // Remove enrollment
        const [result] = await connection.query(
            'DELETE FROM enrollments WHERE student_id = ? AND course_id = ?',
            [student_id, course_id]
        );

        await connection.commit();
        return res.status(200).json({ 
            success: true,
            message: 'Student removed from course successfully' 
        });
    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error removing student:', err);
        return res.status(500).json({ 
            success: false,
            message: 'Error removing student',
            error: err.message,
            sqlError: err.sqlMessage
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Add student to course
router.post('/students/:course_id/enrollments', async (req, res) => {
    const { course_id } = req.params;
    const { student_id, name, email, phone } = req.body;
    console.log('Adding student to course:', { course_id, student_id, name, email, phone });

    if (!student_id || !name || !email || !phone) {
        return res.status(400).json({ 
            success: false,
            message: 'All fields are required' 
        });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Verify course exists
        const [courseRows] = await connection.query('SELECT course_id FROM courses WHERE course_id = ?', [course_id]);
        if (!courseRows || courseRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ 
                success: false,
                message: 'Course not found' 
            });
        }

        // Check if student exists
        const [studentRows] = await connection.query(
            'SELECT student_id FROM students WHERE student_id = ?',
            [student_id]
        );

        if (!studentRows || studentRows.length === 0) {
            // Create new student
            await connection.query(
                'INSERT INTO students (student_id, name, email, phone) VALUES (?, ?, ?, ?)',
                [student_id, name, email, phone]
            );
        } else {
            // Update existing student info
            await connection.query(
                'UPDATE students SET name = ?, email = ?, phone = ? WHERE student_id = ?',
                [name, email, phone, student_id]
            );
        }

        // Check if student is already enrolled
        const [enrollmentRows] = await connection.query(
            'SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
            [student_id, course_id]
        );

        if (enrollmentRows && enrollmentRows.length > 0) {
            await connection.rollback();
            return res.status(400).json({ 
                success: false,
                message: 'Student is already enrolled in this course' 
            });
        }

        // Enroll student
        await connection.query(
            'INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)',
            [student_id, course_id]
        );

        await connection.commit();
        return res.status(201).json({ 
            success: true,
            message: 'Student enrolled successfully' 
        });
    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error enrolling student:', err);
        return res.status(500).json({ 
            success: false,
            message: 'Error enrolling student',
            error: err.message,
            sqlError: err.sqlMessage
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

module.exports = router;
