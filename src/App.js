import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import JobDetails from './pages/JobDetails';
import TrainerDashboard from './pages/TrainerDashboard';
import StudentAttendance from './pages/StudentAttendance';

// Public Pages
import Login from './pages/Login';
import MockRatings from './pages/MockRatings';
import Register from './pages/Register';
import AssignmentPlayer from './pages/AssignmentPlayer';
import AssignmentBuilder from './pages/AssignmentBuilder';
import Tests from './pages/Tests';
import TestSolve from './pages/TestSolve';

// Layout & Navigation Component
import Layout from './components/Layout';
import PrivateRoute from './PrivateRoute';

// Dashboard & New Architecture Pages
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CoursePlayer from './pages/CoursePlayer';
import Assignments from './pages/Assignments';
import Jobs from './pages/Jobs';
import CompanyQuestions from './pages/CompanyQuestions';
import Profile from './pages/Profile';
import AskTAI from './pages/AskTAI';
import Bookmarks from './pages/Bookmarks';

// Legacy & Admin Pages
import About from './pages/About';
import AddCourse from './pages/AddCourse';
import PostJob from './pages/PostJob';
import Admin from './pages/Admin';
import User from './pages/User';
import CompanyQuestionDetail from './pages/CompanyQuestionDetail';

// SMART ROUTER: Decides which dashboard to show based on Role
const HomeRoute = () => {
  const role = localStorage.getItem('role');
  if (role === 'admin' || role === 'superadmin') return <Navigate to="/admin" replace />;
  if (role === 'trainer') return <Navigate to="/trainer" replace />;
  return <Dashboard />;
};
function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* SMART ROOT ROUTE */}
        <Route path="/" element={<PrivateRoute><Layout><HomeRoute /></Layout></PrivateRoute>} />
        <Route path="/assignments/:id" element={<PrivateRoute><Layout><AssignmentPlayer /></Layout></PrivateRoute>} />
        <Route path="/trainer" element={<PrivateRoute role="trainer"><Layout><TrainerDashboard /></Layout></PrivateRoute>} />
        <Route path="/attendance" element={<PrivateRoute><Layout><StudentAttendance /></Layout></PrivateRoute>} />
        <Route path="/mock-ratings" element={<PrivateRoute><Layout><MockRatings /></Layout></PrivateRoute>} />
        <Route path="/add-assignment" element={<PrivateRoute role="admin"><Layout><AssignmentBuilder /></Layout></PrivateRoute>} />
        <Route path="/edit-assignment/:id" element={<PrivateRoute role="admin"><Layout><AssignmentBuilder /></Layout></PrivateRoute>} />
        <Route path="/company-questions/:id" element={<PrivateRoute><Layout><CompanyQuestionDetail /></Layout></PrivateRoute>} />
        {/* Primary Shared Routes */}
        <Route path="/courses" element={<PrivateRoute><Layout><Courses /></Layout></PrivateRoute>} />
        <Route path="/course-player/:id" element={<PrivateRoute><Layout><CoursePlayer /></Layout></PrivateRoute>} />
        <Route path="/assignments" element={<PrivateRoute><Layout><Assignments /></Layout></PrivateRoute>} />
        <Route path="/jobs" element={<PrivateRoute><Layout><Jobs /></Layout></PrivateRoute>} />
        <Route path="/company-questions" element={<PrivateRoute><Layout><CompanyQuestions /></Layout></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
        <Route path="/ask-tai" element={<PrivateRoute><Layout><AskTAI /></Layout></PrivateRoute>} />
        <Route path="/bookmarks" element={<PrivateRoute><Layout><Bookmarks /></Layout></PrivateRoute>} />
        <Route path="/about" element={<PrivateRoute><Layout><About /></Layout></PrivateRoute>} />
        <Route path="/user" element={<PrivateRoute role="user"><Layout><User /></Layout></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
        <Route path="/tests" element={<PrivateRoute><Layout><Tests /></Layout></PrivateRoute>} />
        <Route path="/tests/:slug" element={<PrivateRoute><Layout><TestSolve /></Layout></PrivateRoute>} />
        <Route path="/jobs/:id" element={<PrivateRoute><Layout><JobDetails /></Layout></PrivateRoute>} />
        {/* Admin Only Routes */}
        <Route path="/admin" element={<PrivateRoute role="admin"><Layout><Admin /></Layout></PrivateRoute>} />
        <Route path="/add-course" element={<PrivateRoute role="admin"><Layout><AddCourse /></Layout></PrivateRoute>} />
        <Route path="/edit-course/:id" element={<PrivateRoute role="admin"><Layout><AddCourse /></Layout></PrivateRoute>} />
        <Route path="/post-job" element={<PrivateRoute role="admin"><Layout><PostJob /></Layout></PrivateRoute>} />
      </Routes>
    </Router>
  );
}
export default App;