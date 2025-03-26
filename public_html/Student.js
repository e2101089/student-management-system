const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    grades: [{ courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, score: Number, comment: String }]
}, { collection: 'students' });

module.exports = mongoose.model('Student', studentSchema);