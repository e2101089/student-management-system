import React from 'react';
import { Route, Switch } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import CourseList from './components/CourseList';
import CourseDetail from './components/CourseDetail';
import StudentDetail from './components/StudentDetail';
import CourseForm from './components/CourseForm';

const App = () => {
    return (
        <div>
            <Switch>
                <Route path="/login" component={Login} />
                <Route path="/register" component={Register} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/courses/new" component={CourseForm} />
                <Route path="/courses" component={CourseList} />
                <Route path="/courses/:id" component={CourseDetail} />
                <Route path="/students/:id" component={StudentDetail} />
                <Route path="/" exact component={Login} />
            </Switch>
        </div>
    );
};

export default App;