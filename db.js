const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'mariadb.vamk.fi',
    user: 'e2101089',
    password: 'FrcP25TGjgF',
    database: 'e2101089_studentmanagement',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection
pool.getConnection()
    .then(connection => {
        console.log('Connected to the database');
        connection.release();
    })
    .catch(err => {
        console.error('Database connection error:', err);
    });

module.exports = pool;