const mysql = require('mysql');

const studentSchema = new mysql.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    grades: [{ courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, score: Number, comment: String }]
}, { collection: 'students' });

module.exports = mysql.model('Student', studentSchema);