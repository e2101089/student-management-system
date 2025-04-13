const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'mariadb.vamk.fi',
    user: 'e2101089',
    password: 'SxtR6JNQAW7',
    database: 'e2101089_studentmanagement'
});

// Connect to the database
db.connect(err => {
    if (err) {
        console.error('Database connection error:', err);
        return;
    }
    console.log('Connected to the database');
});

module.exports = db;