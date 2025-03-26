import React, { useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

const CourseForm = () => {
    const [courseName, setCourseName] = useState('');
    const history = useHistory();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/courses', { name: courseName });
            history.push('/courses');
        } catch (error) {
            console.error('Error adding course:', error);
        }
    };

    return (
        <div>
            <h2>Add course</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Course name"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    required
                />
                <button type="submit">Add course</button>
            </form>
        </div>
    );
};

export default CourseForm;