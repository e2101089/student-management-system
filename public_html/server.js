const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db'); // Import kết nối cơ sở dữ liệu
const authRoutes = require('./routes/auth.route')(db);
const courseRoutes = require('./routes/course.route')(db);
const studentRoutes = require('./routes/student.route')(db);

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));

// Routes
app.use('/auth', authRoutes);
app.use('/courses', courseRoutes);
app.use('/students', studentRoutes);

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});