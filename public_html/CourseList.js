import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const CourseList = () => {
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        const fetchCourses = async () => {
            const response = await axios.get('/courses');
            setCourses(response.data);
        };
        fetchCourses();
    }, []);

    return (
        <div>
            <h2>Danh Sách Khóa Học</h2>
            <Link to="/courses/new">Thêm Khóa Học</Link>
            <ul>
                {courses.map(course => (
                    <li key={course._id}>
                        <Link to={`/courses/${course._id}`}>{course.name}</Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CourseList;