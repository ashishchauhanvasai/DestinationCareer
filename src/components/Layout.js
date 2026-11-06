import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome, FiBookOpen, FiFileText, FiBriefcase, FiSun, FiMoon, FiLogOut, FiUser,
  FiBook, FiStar, FiAward, FiImage, FiUsers, FiHelpCircle, FiClipboard, FiGrid, FiCheckSquare,
  FiMenu, FiX, FiTarget, FiVideo, FiSearch
} from 'react-icons/fi';
import { BsPatchQuestion } from 'react-icons/bs';
import ChangeCredentialsModal from './ChangeCredentialsModal';

const SidebarItem = ({ icon: Icon, text, to, isActive, onClick }) => (
  <Link
    to={to} 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3.5 mb-1.5 rounded-2xl font-semibold transition-all duration-300 ${
      isActive 
        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 border border-transparent' 
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
    }`}
  >
    <Icon size={18} className={isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'} />
    <span className="text-[14px]">{text}</span>
  </Link>
);

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const role = localStorage.getItem('role');
  const isAdmin = role === 'admin' || role === 'superadmin';
  const isTrainer = role === 'trainer';
  const isPromotional = role === 'promotional'; 

  const currentTab = new URLSearchParams(location.search).get('tab') || 'Courses';

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  const adminMenu = [
    { tab: 'Courses', text: 'Manage Courses', icon: FiBook },
    { tab: 'Testimonials', text: 'Testimonials', icon: FiStar },
    { tab: 'Performers', text: 'Top Performers', icon: FiAward },
    { tab: 'Banner', text: 'Banner', icon: FiImage },
    { tab: 'Approvals', text: 'Approvals', icon: FiUsers },
    { tab: 'Jobs', text: 'Jobs', icon: FiBriefcase },
    { tab: 'Applications', text: 'Applications', icon: FiUsers },
    { tab: 'Company Questions', text: 'Company Questions', icon: FiHelpCircle },
    { tab: 'Assignments', text: 'Assignments', icon: FiClipboard },
    { tab: 'Coding Tests', text: 'Coding Tests', icon: FiFileText },
    ...(role === 'superadmin'
      ? [
          { tab: 'Manage Users', text: 'Manage Users', icon: FiUsers },
          { tab: 'Batches', text: 'Batches & QR', icon: FiGrid }
        ]
      : []),
    { tab: 'online-classes', text: 'Online Classes', icon: FiVideo },
    { tab: 'Students by Batch & Attendance Reports', text: 'Students & Attendance', icon: FiUsers },
  ];

  // --- Search Bar Logic ---
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSearchableRoutes = () => {
    if (isAdmin) {
      return adminMenu.map(item => ({ name: item.text, path: `/admin?tab=${encodeURIComponent(item.tab)}`, icon: item.icon }));
    } else if (isTrainer) {
      return [
        { name: 'My Batches', path: '/trainer', icon: FiGrid },
        { name: 'My Students', path: '/trainer/students', icon: FiUsers },
        { name: 'Courses & Doubts', path: '/courses', icon: FiBookOpen },
        { name: 'Assignments', path: '/trainer/assignments', icon: FiClipboard },
        { name: 'Company Questions', path: '/trainer/company-questions', icon: FiHelpCircle },
        { name: 'Top Performers', path: '/trainer/performers', icon: FiAward },
      ];
    } else if (isPromotional) {
      return [
        { name: 'Campus Drives', path: '/promo-dashboard', icon: FiTarget },
        { name: 'My Profile', path: '/profile', icon: FiUser },
      ];
    } else {
      return [
        { name: 'Dashboard', path: '/', icon: FiHome },
        { name: 'My Profile', path: '/profile', icon: FiUser },
        { name: 'Courses', path: '/courses', icon: FiBookOpen },
        { name: 'Coding Tests', path: '/tests', icon: FiFileText },
        { name: 'Assignments', path: '/assignments', icon: FiFileText },
        { name: 'Attendance', path: '/attendance', icon: FiCheckSquare },
        { name: 'Mock Ratings', path: '/mock-ratings', icon: FiStar },
        { name: 'Company Questions', path: '/company-questions', icon: BsPatchQuestion },
        { name: 'Jobs', path: '/jobs', icon: FiBriefcase },
        { name: 'My Applications', path: '/my-applications', icon: FiClipboard },
      ];
    }
  };

  const searchableRoutes = getSearchableRoutes();
  const filteredRoutes = searchableRoutes.filter(route => 
    route.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectRoute = (path) => {
    navigate(path);
    setSearchQuery('');
    setShowSearchDropdown(false);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };
  // ------------------------

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('driveCode');
    navigate('/login');
  };

  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [showCreds, setShowCreds] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const closeMobileSidebar = () => {
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-[100dvh] bg-transparent transition-colors duration-300 overflow-hidden">

      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-gray-900/70 backdrop-blur-md z-40 md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] m-4 bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-slate-800 shadow-2xl rounded-[1.5rem] flex flex-col justify-between transition-all duration-300 ease-in-out md:relative md:m-4 shrink-0
        ${isSidebarOpen ? 'translate-x-0 md:ml-4' : '-translate-x-full md:-ml-[280px]'}`}
      >
        <div className="overflow-y-auto custom-scrollbar h-full flex flex-col pt-2 pb-2">
          <div className="p-6 md:p-8 flex justify-between items-center shrink-0">
            <h1 className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight leading-none">
              Destination<br />
              <span className="text-gray-900 dark:text-white text-lg opacity-90">Career</span>
            </h1>

            <button
              className="md:hidden text-gray-500 hover:text-gray-900 dark:text-gray-300 p-2.5 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors border border-gray-200 dark:border-slate-600 shadow-sm"
              onClick={() => setIsSidebarOpen(false)}
            >
              <FiX size={18} />
            </button>
          </div>

          <nav className="mt-2 px-3 pb-4 flex-1">
            <p className="px-5 text-[10px] font-extrabold text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-widest">
              {isAdmin ? 'Admin Panel' : isTrainer ? 'Trainer' : isPromotional ? 'CSR Team' : 'Main Menu'}
            </p>

            {isTrainer ? (
              <>
                <SidebarItem onClick={closeMobileSidebar} icon={FiGrid} text="My Batches" to="/trainer" isActive={location.pathname === '/trainer'} />
                <SidebarItem onClick={closeMobileSidebar} icon={FiUsers} text="My Students" to="/trainer/students" isActive={location.pathname === '/trainer/students'} />
                <SidebarItem onClick={closeMobileSidebar} icon={FiBookOpen} text="Courses & Doubts" to="/courses" isActive={location.pathname === '/courses'} />
                <SidebarItem onClick={closeMobileSidebar} icon={FiClipboard} text="Assignments" to="/trainer/assignments" isActive={location.pathname.includes('assignment')} />
                <SidebarItem onClick={closeMobileSidebar} icon={FiHelpCircle} text="Company Questions" to="/trainer/company-questions" isActive={location.pathname === '/trainer/company-questions'} />
                <SidebarItem onClick={closeMobileSidebar} icon={FiAward} text="Top Performers" to="/trainer/performers" isActive={location.pathname === '/trainer/performers'} />
              </>
            ) : isAdmin ? (
              adminMenu.map((item) => (
                <SidebarItem
                  key={item.tab}
                  onClick={closeMobileSidebar}
                  icon={item.icon}
                  text={item.text}
                  to={`/admin?tab=${encodeURIComponent(item.tab)}`}
                  isActive={location.pathname === '/admin' && currentTab === item.tab}
                />
              ))
            ) : isPromotional ? (
              <>
                <SidebarItem onClick={closeMobileSidebar} icon={FiTarget} text="Campus Drives" to="/promo-dashboard" isActive={location.pathname === '/promo-dashboard'} />
                <SidebarItem onClick={closeMobileSidebar} icon={FiUser} text="My Profile" to="/profile" isActive={location.pathname === '/profile'} />
              </>
            ) : (
              <>
                <SidebarItem onClick={closeMobileSidebar} icon={FiHome} text="Dashboard" to="/" isActive={location.pathname === '/'} />
                <SidebarItem onClick={closeMobileSidebar} icon={FiUser} text="My Profile" to="/profile" isActive={location.pathname === '/profile'} />
                <SidebarItem onClick={closeMobileSidebar} icon={FiBookOpen} text="Courses" to="/courses" isActive={location.pathname === '/courses'} />
                <SidebarItem onClick={closeMobileSidebar} icon={FiFileText} text="Tests" to="/tests" isActive={location.pathname === '/tests'} />
                <SidebarItem onClick={closeMobileSidebar} icon={FiFileText} text="Assignments" to="/assignments" isActive={location.pathname === '/assignments'} />
                <SidebarItem onClick={closeMobileSidebar} icon={FiCheckSquare} text="Attendance" to="/attendance" isActive={location.pathname === '/attendance'} />
                <SidebarItem onClick={closeMobileSidebar} icon={FiStar} text="Mock Ratings" to="/mock-ratings" isActive={location.pathname === '/mock-ratings'} />
                <SidebarItem onClick={closeMobileSidebar} icon={BsPatchQuestion} text="Company Questions" to="/company-questions" isActive={location.pathname === '/company-questions'} />
                <SidebarItem onClick={closeMobileSidebar} icon={FiBriefcase} text="Jobs" to="/jobs" isActive={location.pathname === '/jobs'} />
                <SidebarItem onClick={closeMobileSidebar} icon={FiClipboard} text="My Applications" to="/my-applications" isActive={location.pathname === '/my-applications'} />
              </>
            )}
          </nav>

          {/* User Widget / Dark Mode Toggle */}
          <div className="p-5 mx-3 mb-2 bg-gray-50 dark:bg-slate-800 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shrink-0 shadow-sm">
            {role === 'student' && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl mb-5 border border-gray-200 dark:border-slate-700 flex flex-col items-center shadow-sm">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-extrabold mb-1 tracking-widest uppercase">Employability</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">0 <span className="text-sm font-bold text-gray-400">/ 100</span></p>
              </div>
            )}

            <div className="flex bg-gray-200 dark:bg-slate-900 rounded-xl p-1.5 mb-5 border border-gray-300 dark:border-slate-800 shadow-inner">
              <button onClick={() => setIsDarkMode(false)} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-extrabold transition-all ${!isDarkMode ? 'bg-white shadow-sm text-gray-900 border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}>
                <FiSun size={14} /> Light
              </button>
              <button onClick={() => setIsDarkMode(true)} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-extrabold transition-all ${isDarkMode ? 'bg-slate-700 shadow-sm text-white border border-slate-600' : 'text-gray-500 hover:text-gray-300'}`}>
                <FiMoon size={14} /> Dark
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className={`w-10 h-10 shrink-0 rounded-[0.8rem] shadow-sm flex items-center justify-center text-white font-black text-sm border border-white/20 ${isAdmin ? 'bg-red-500' : isTrainer ? 'bg-purple-500' : isPromotional ? 'bg-teal-500' : 'bg-blue-600'}`}>
                  {isAdmin ? 'A' : isTrainer ? 'T' : isPromotional ? 'P' : 'S'}
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-[13px] text-gray-900 dark:text-white truncate">
                    {isAdmin ? 'Administrator' : isTrainer ? 'Trainer' : isPromotional ? 'Promo Exec' : 'Student Name'}
                  </p>
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {isAdmin ? 'admin@dc.com' : isTrainer ? 'trainer@dc.com' : isPromotional ? 'promo@dc.com' : 'student@email.com'}
                  </p>
                </div>
              </div>
              <button onClick={handleLogout} className="p-2.5 text-gray-500 hover:text-red-500 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-200 dark:hover:border-red-800 rounded-[0.8rem] transition-colors shrink-0 shadow-sm" title="Logout">
                <FiLogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-gray-200 dark:border-slate-700 m-4 mb-0 p-3 px-5 rounded-[1.2rem] flex items-center justify-between z-10 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-600 dark:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-transparent dark:hover:border-slate-700"
            >
              <FiMenu size={22} />
            </button>

            <h1 className={`text-lg font-black text-blue-600 dark:text-blue-400 transition-opacity duration-300 tracking-tight hidden sm:block ${!isSidebarOpen || window.innerWidth < 768 ? 'opacity-100' : 'md:opacity-0 md:w-0 overflow-hidden'}`}>
              Destination<span className="text-gray-900 dark:text-white opacity-90">Career</span>
            </h1>
          </div>

          {/* Search Bar Block */}
          <div className="flex-1 max-w-md px-4 relative" ref={searchRef}>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search menus..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                className="w-full bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full py-2 pl-9 pr-4 text-[13px] font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
              />
            </div>

            {showSearchDropdown && searchQuery.length > 0 && (
              <div className="absolute top-full left-4 right-4 mt-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar z-50 p-2">
                {filteredRoutes.length > 0 ? (
                  filteredRoutes.map((route, idx) => {
                    const Icon = route.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectRoute(route.path)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                      >
                        <Icon size={16} className="text-blue-500 dark:text-blue-400 shrink-0" />
                        <span className="text-[13px] font-extrabold text-gray-900 dark:text-gray-100 truncate">{route.name}</span>
                      </button>
                    )
                  })
                ) : (
                  <div className="px-4 py-4 text-center text-[13px] font-bold text-gray-500 dark:text-gray-400">
                    No matching menus found.
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className={`w-10 h-10 rounded-[0.8rem] flex items-center justify-center text-white font-black text-sm shadow-sm border border-white/20 shrink-0 ${
              isAdmin ? 'bg-gradient-to-br from-red-500 to-red-600' : isTrainer ? 'bg-gradient-to-br from-purple-500 to-purple-600' : isPromotional ? 'bg-gradient-to-br from-teal-500 to-teal-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'
            }`}
            title={role}
          >
            {isAdmin ? 'A' : isTrainer ? 'T' : isPromotional ? 'P' : 'S'}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 pb-20 md:pb-12 transition-colors">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {showCreds && <ChangeCredentialsModal onClose={() => setShowCreds(false)} />}
    </div>
  );
};

export default Layout;