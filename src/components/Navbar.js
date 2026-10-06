import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import profileIcon from '../assets/profile.png';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const navigate = useNavigate();
  const userRole = localStorage.getItem('role');

  const toggleDropdown = () => setDropdownVisible(!dropdownVisible);

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.clear();
    setDropdownVisible(false);
    navigate('/'); // redirect to home
  };

  return (
    <nav className="navbar">
      <div className="nav-logo">
        <Link to="/">E-learning</Link>
      </div>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/courses">Courses</Link>
        <Link to="/about">About</Link>
        <Link to="/career">Career</Link> {/* NEW: Visible to all */}

        {isLoggedIn && userRole === 'admin' && (
          <>
            <Link to="/add-course">Add Course</Link>
            <Link to="/post-job">Post Job</Link> {/* NEW: Admin only */}
          </>
        )}

        {!isLoggedIn && <Link to="/login">Login</Link>}

        {isLoggedIn && (
          <div className="profile-menu">
            <img
              src={profileIcon}
              alt="Profile"
              className="profile-icon"
              onClick={toggleDropdown}
            />
            {dropdownVisible && (
              <div className="dropdown">
                <button onClick={() => alert('Edit profile clicked')}>Edit Profile</button>
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
