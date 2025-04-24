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
    const { student_id, course_id, date, status, comment, behavior } = req.body;
    console.log('Recording attendance:', { student_id, course_id, date, status, comment, behavior });

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

        // Check if attendance already recorded for this date
        const [existingAttendance] = await connection.query(
            'SELECT * FROM attendance WHERE student_id = ? AND date = ?',
            [student_id, date]
        );

        if (existingAttendance && existingAttendance.length > 0) {
            await connection.rollback();
            return res.status(400).json({ 
                success: false,
                message: 'Attendance already recorded for this date' 
            });
        }

        // Record attendance
        const [result] = await connection.query(
            'INSERT INTO attendance (student_id, enrollment_id, date, status) VALUES (?, ?, ?, ?)',
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
    const { student_id, course_id, subject, score, comment, behavior } = req.body;
    console.log('Recording grade:', { student_id, course_id, subject, score, comment, behavior });

    if (!student_id || !course_id || !subject || !score) {
        return res.status(400).json({ 
            success: false,
            message: 'All fields are required' 
        });
    }

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
            return res.status(400).json({ 
                success: false,
                message: 'Student is not enrolled in this course' 
            });
        }

        // Record grade
        const [result] = await connection.query(
            'INSERT INTO grades (student_id, course_id, grade, comment, behavior) VALUES (?, ?, ?, ?, ?)',
            [student_id, course_id, score, comment, behavior]
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

        const [attendance] = await db.query(
            'SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC',
            [student_id]
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

        const [grades] = await db.query(
            'SELECT * FROM grades WHERE student_id = ? AND course_id = ? ORDER BY updated_at DESC',
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

module.exports = router;
