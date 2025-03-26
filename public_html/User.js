const mysql = require('mysql2');

class User {
    constructor(db) {
        this.db = db;
    }

    register(email, password, callback) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        this.db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], callback);
    }

    login(email, password, callback) {
        this.db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
            if (err) return callback(err);
            if (results.length > 0) {
                const user = results[0];
                if (bcrypt.compareSync(password, user.password)) {
                    return callback(null, user);
                }
                return callback(null, null); // Incorrect password
            }
            return callback(null, null); // User not found
        });
    }
}

module.exports = User;