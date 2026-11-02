import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import profileIcon from '../assets/profile.png';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const navigate = useNavigate();
  const userRole = localStorage.getItem('role');

  const toggleDropdown = () => setDropdownVisible(!dropdownVisible);

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('isLoggedIn');
    setDropdownVisible(false);
    navigate('/'); 
  };

  return (
    <nav className="glass-panel m-4 rounded-[2rem] px-6 py-4 flex items-center justify-between shadow-sm sticky top-4 z-50">
      <div className="font-extrabold text-xl text-blue-600 dark:text-blue-400 tracking-tight">
        <Link to="/">E-learning</Link>
      </div>
      
      <div className="flex items-center gap-6 font-bold text-sm text-gray-700 dark:text-gray-200">
        <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
        <Link to="/courses" className="hover:text-blue-600 transition-colors">Courses</Link>
        <Link to="/about" className="hover:text-blue-600 transition-colors">About</Link>
        <Link to="/career" className="hover:text-blue-600 transition-colors">Career</Link>

        {isLoggedIn && userRole === 'admin' && (
          <>
            <Link to="/add-course" className="hover:text-blue-600 transition-colors">Add Course</Link>
            <Link to="/post-job" className="hover:text-blue-600 transition-colors">Post Job</Link>
          </>
        )}

        {!isLoggedIn && (
          <Link to="/login" className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            Login
          </Link>
        )}

        {isLoggedIn && (
          <div className="relative">
            <img
              src={profileIcon}
              alt="Profile"
              className="w-10 h-10 rounded-full border-2 border-white/60 shadow-sm cursor-pointer hover:scale-105 transition-transform bg-white"
              onClick={toggleDropdown}
            />
            {dropdownVisible && (
              <div className="absolute right-0 mt-3 w-40 glass-panel rounded-2xl shadow-xl flex flex-col p-2 overflow-hidden border-white/60">
                <button onClick={() => alert('Edit profile clicked')} className="text-left px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-black/5 rounded-xl transition-colors">
                  Edit Profile
                </button>
                <button onClick={handleLogout} className="text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-500/10 rounded-xl transition-colors mt-1">
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;