import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import profileIcon from '../assets/profile.png';
import { FiMenu, FiX, FiUser, FiLogOut } from 'react-icons/fi';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = localStorage.getItem('role');

  const toggleDropdown = () => setDropdownVisible(!dropdownVisible);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('isLoggedIn');
    setDropdownVisible(false);
    setMobileMenuOpen(false);
    navigate('/'); 
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = (
    <>
      <Link to="/" className="font-extrabold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800">Home</Link>
      <Link to="/courses" className="font-extrabold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800">Courses</Link>
      <Link to="/about" className="font-extrabold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800">About</Link>
      <Link to="/career" className="font-extrabold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800">Career</Link>

      {isLoggedIn && userRole === 'admin' && (
        <>
          <Link to="/add-course" className="font-extrabold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors px-3 py-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20">Add Course</Link>
          <Link to="/post-job" className="font-extrabold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors px-3 py-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20">Post Job</Link>
        </>
      )}
    </>
  );

  return (
    <nav className="bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-xl border border-gray-200 dark:border-slate-700 m-4 rounded-[2rem] px-5 sm:px-8 py-3.5 flex items-center justify-between shadow-sm sticky top-4 z-50">
      
      {/* LOGO */}
      <div className="font-black text-2xl text-blue-600 dark:text-blue-400 tracking-tight leading-none z-50">
        <Link to="/">E-learning</Link>
      </div>
      
      {/* DESKTOP NAVIGATION */}
      <div className="hidden md:flex items-center gap-2 text-sm">
        {navLinks}

        {!isLoggedIn && (
          <Link to="/login" className="ml-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl font-extrabold shadow-md shadow-blue-500/30 hover:scale-[0.98] transition-transform">
            Login
          </Link>
        )}

        {isLoggedIn && (
          <div className="relative ml-4" ref={dropdownRef}>
            <img
              src={profileIcon}
              alt="Profile"
              className="w-11 h-11 rounded-[1rem] border border-gray-200 dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-md transition-all bg-white object-cover"
              onClick={toggleDropdown}
            />
            
            {/* SOLID DESKTOP DROPDOWN */}
            {dropdownVisible && (
              <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-[1.5rem] shadow-2xl flex flex-col p-2 z-50 animate-fade-in">
                <button onClick={() => { alert('Edit profile clicked'); setDropdownVisible(false); }} className="w-full flex items-center gap-2 text-left px-4 py-3 text-[13px] font-extrabold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <FiUser size={16} className="opacity-70" /> Edit Profile
                </button>
                <div className="h-px bg-gray-100 dark:bg-slate-800 my-1 mx-2"></div>
                <button onClick={handleLogout} className="w-full flex items-center gap-2 text-left px-4 py-3 text-[13px] font-extrabold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                  <FiLogOut size={16} className="opacity-70" /> Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MOBILE HAMBURGER BUTTON */}
      <div className="md:hidden flex items-center gap-3 z-50">
        {isLoggedIn && (
          <img
            src={profileIcon}
            alt="Profile"
            className="w-10 h-10 rounded-[1rem] border border-gray-200 dark:border-slate-700 shadow-sm bg-white object-cover"
            onClick={toggleDropdown}
          />
        )}
        <button
          onClick={toggleMobileMenu}
          className="p-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl transition-colors border border-gray-200 dark:border-slate-700 shadow-sm"
        >
          {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {mobileMenuOpen && (
        <div className="absolute top-[110%] left-0 right-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-5 rounded-[2rem] shadow-2xl flex flex-col gap-2 md:hidden animate-fade-in">
          {navLinks}
          
          <div className="h-px bg-gray-100 dark:bg-slate-800 my-2"></div>
          
          {!isLoggedIn ? (
            <Link to="/login" className="w-full text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-extrabold shadow-md shadow-blue-500/30">
              Login
            </Link>
          ) : (
            <>
              <button onClick={() => { alert('Edit profile clicked'); setMobileMenuOpen(false); }} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-extrabold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 rounded-xl transition-colors">
                <FiUser size={16} /> Edit Profile
              </button>
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-extrabold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl transition-colors mt-2">
                <FiLogOut size={16} /> Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;