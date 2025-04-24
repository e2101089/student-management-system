const express = require('express');
const router = express.Router();
const db = require('./db');
const server = require('./server');

// Test database connection
router.get('/test-db', async (req, res) => {
    try {
        const result = await db.query('SELECT 1');
        res.json({ success: true, message: 'Database connection successful' });
    } catch (err) {
        console.error('Database connection error:', err);
        res.status(500).json({ success: false, message: 'Database connection failed', error: err.message });
    }
});

// Get all students in a course
router.get('/courses/:course_id/students', async (req, res) => {
    const course_id = req.params.course_id;
    console.log("Fetching students for course_id:", course_id);
    
    try {
        // First verify the course exists
        const [courseRows] = await db.query('SELECT course_id FROM courses WHERE course_id = ?', [course_id]);
        console.log('Course check result:', courseRows);
        
        if (!courseRows || courseRows.length === 0) {
            console.log('Course not found:', course_id);
            return res.status(404).json({ 
                success: false,
                message: 'Course not found',
                course_id: course_id
            });
        }

        const query = `
            SELECT 
                s.student_id,
                s.name,
                s.email,
                s.phone,
                e.course_id
            FROM students s
            INNER JOIN enrollments e ON s.student_id = e.student_id
            WHERE e.course_id = ?
            ORDER BY s.name ASC
        `;
        
        console.log('Executing query:', query, 'with params:', [course_id]);
        const [studentRows] = await db.query(query, [course_id]);
        console.log('Query results:', studentRows);
        
        if (!studentRows || !Array.isArray(studentRows)) {
            console.log('No results or invalid results format');
            return res.json([]);
        }
        
        return res.json(studentRows);
    } catch (err) {
        console.error('Database error details:', {
            error: err,
            message: err.message,
            sql: err.sql,
            sqlMessage: err.sqlMessage,
            stack: err.stack
        });
        return res.status(500).json({ 
            success: false,
            message: 'Error fetching students', 
            error: err.message,
            sqlError: err.sqlMessage
        });
    }
});

// Add student to a course
router.post('/courses/:course_id/enrollments', async (req, res) => {
    const course_id = req.params.course_id;
    const { student_id, name, email, phone } = req.body;

    console.log('=== Starting Enrollment Process ===');
    console.log('Request details:', { course_id, student_id, name, email, phone });

    if (!student_id || !name || !email || !phone) {
        console.log('Missing required fields');
        return res.status(400).json({ 
            success: false,
            message: 'All student fields are required' 
        });
    }

    let connection;
    try {
        // Get a connection from the pool
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Verify course exists
        console.log('Checking if course exists...');
        const [courseRows] = await connection.query('SELECT course_id FROM courses WHERE course_id = ?', [course_id]);
        console.log('Course check result:', courseRows);
        
        if (!courseRows || courseRows.length === 0) {
            await connection.rollback();
            console.log('Course not found:', course_id);
            return res.status(404).json({ 
                success: false,
                message: 'Course not found' 
            });
        }

        // First check if student exists
        console.log('Checking if student exists...');
        const [studentRows] = await connection.query(
            'SELECT student_id, name, email, phone FROM students WHERE student_id = ?', 
            [student_id]
        );
        
        console.log('Existing student check result:', studentRows);

        if (!studentRows || studentRows.length === 0) {
            // Student doesn't exist, create new student
            console.log('Student does not exist, creating new student...');
            try {
                const [insertResult] = await connection.query(
                    'INSERT INTO students (student_id, name, email, phone) VALUES (?, ?, ?, ?)', 
                    [student_id, name, email, phone]
                );
                console.log('Student creation result:', insertResult);
            } catch (insertErr) {
                await connection.rollback();
                console.error('Error creating student:', insertErr);
                return res.status(500).json({ 
                    success: false,
                    message: 'Error creating student', 
                    error: insertErr.message,
                    sqlError: insertErr.sqlMessage
                });
            }
        } else {
            // Update existing student information if different
            const existingStudent = studentRows[0];
            console.log('Student exists, checking if information needs update...');
            if (existingStudent.name !== name || 
                existingStudent.email !== email || 
                existingStudent.phone !== phone) {
                console.log('Updating existing student information...');
                try {
                    const [updateResult] = await connection.query(
                        'UPDATE students SET name = ?, email = ?, phone = ? WHERE student_id = ?',
                        [name, email, phone, student_id]
                    );
                    console.log('Student update result:', updateResult);
                } catch (updateErr) {
                    await connection.rollback();
                    console.error('Error updating student:', updateErr);
                    return res.status(500).json({ 
                        success: false,
                        message: 'Error updating student', 
                        error: updateErr.message,
                        sqlError: updateErr.sqlMessage
                    });
                }
            } else {
                console.log('Student information is up to date');
            }
        }

        // Check if student is already enrolled in this course
        console.log('Checking if student is already enrolled in this course...');
        const [enrollmentRows] = await connection.query(
            `SELECT e.*, s.name, s.email, s.phone 
             FROM enrollments e 
             JOIN students s ON e.student_id = s.student_id 
             WHERE e.course_id = ? AND e.student_id = ?`,
            [course_id, student_id]
        );

        console.log('Existing enrollment check result:', enrollmentRows);
        console.log('Query parameters:', { course_id, student_id });

        if (enrollmentRows && enrollmentRows.length > 0) {
            const existingEnrollment = enrollmentRows[0];
            console.log('Found existing enrollment:', {
                student_id: existingEnrollment.student_id,
                course_id: existingEnrollment.course_id,
                name: existingEnrollment.name
            });
            await connection.rollback();
            return res.status(400).json({ 
                success: false,
                message: 'Student already enrolled in this course',
                student: {
                    student_id: existingEnrollment.student_id,
                    name: existingEnrollment.name,
                    email: existingEnrollment.email,
                    phone: existingEnrollment.phone
                }
            });
        } else {
            console.log('No existing enrollment found for student:', student_id, 'in course:', course_id);
        }

        // Enroll student in course
        console.log('Enrolling student in course...');
        try {
            const [enrollResult] = await connection.query(
                'INSERT INTO enrollments (course_id, student_id) VALUES (?, ?)',
                [course_id, student_id]
            );
            console.log('Enrollment result:', enrollResult);

            // Get the complete student information
            console.log('Fetching final student information...');
            const [studentInfoRows] = await connection.query(
                `SELECT s.student_id, s.name, s.email, s.phone 
                 FROM students s 
                 JOIN enrollments e ON s.student_id = e.student_id 
                 WHERE s.student_id = ? AND e.course_id = ?`,
                [student_id, course_id]
            );
            console.log('Final student information:', studentInfoRows);

            if (!studentInfoRows || studentInfoRows.length === 0) {
                throw new Error('Failed to retrieve student information after enrollment');
            }

            // Commit the transaction
            await connection.commit();
            console.log('=== Enrollment Process Completed Successfully ===');

            return res.status(201).json({ 
                success: true,
                message: 'Student enrolled successfully',
                student: studentInfoRows[0]
            });
        } catch (enrollErr) {
            await connection.rollback();
            console.error('Error enrolling student:', enrollErr);
            return res.status(500).json({ 
                success: false,
                message: 'Error enrolling student', 
                error: enrollErr.message,
                sqlError: enrollErr.sqlMessage
            });
        }
    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('=== Error in Enrollment Process ===');
        console.error('Detailed error:', {
            error: err,
            message: err.message,
            sql: err.sql,
            sqlMessage: err.sqlMessage,
            stack: err.stack
        });
        return res.status(500).json({ 
            success: false,
            message: 'Error processing enrollment', 
            error: err.message,
            sqlError: err.sqlMessage
        });
    } finally {
        if (connection) {
            connection.release();
        }
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

        // Check if attendance already recorded for this date
        const [existingAttendance] = await connection.query(
            'SELECT * FROM attendance WHERE student_id = ? AND course_id = ? AND date = ?',
            [student_id, course_id, date]
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
            'INSERT INTO attendance (student_id, course_id, date, status) VALUES (?, ?, ?, ?)',
            [student_id, course_id, date, status]
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

    if (!student_id || !course_id || !subject || !score || !comment || !behavior) {
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
            'INSERT INTO grades (student_id, course_id, subject, score, comment, behavior) VALUES (?, ?, ?, ?, ?, ?)',
            [student_id, course_id, subject, score, comment, behavior]
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
router.get('/courses/:course_id/students/:student_id/attendance', async (req, res) => {
    const { course_id, student_id } = req.params;
    console.log('Fetching attendance for student:', { student_id, course_id });

    try {
        const [attendance] = await db.query(
            'SELECT * FROM attendance WHERE student_id = ? AND course_id = ? ORDER BY date DESC',
            [student_id, course_id]
        );

        return res.json(attendance);
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
router.get('/courses/:course_id/students/:student_id/grades', async (req, res) => {
    const { course_id, student_id } = req.params;
    console.log('Fetching grades for student:', { student_id, course_id });

    try {
        const [grades] = await db.query(
            'SELECT * FROM grades WHERE student_id = ? AND course_id = ? ORDER BY subject ASC',
            [student_id, course_id]
        );

        return res.json(grades);
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
router.delete('/courses/:course_id/enrollments', async (req, res) => {
    const course_id = req.params.course_id;
    const { student_id } = req.body;

    if (!student_id) {
        return res.status(400).json({ message: 'Student ID is required' });
    }

    try {
        const result = await db.query(
            'DELETE FROM enrollments WHERE course_id = ? AND student_id = ?',
            [course_id, student_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Student not found in this course' });
        }

        return res.json({ 
            success: true,
            message: 'Student removed from course successfully' 
        });
    } catch (err) {
        console.error('Error removing student:', err);
        return res.status(500).json({ 
            success: false,
            message: 'Error removing student',
            error: err.message,
            sqlError: err.sqlMessage
        });
    }
});

module.exports = router;
