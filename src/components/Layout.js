import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome, FiBookOpen, FiFileText, FiBriefcase, FiSun, FiMoon, FiLogOut, FiUser,
  FiBook, FiStar, FiAward, FiImage, FiUsers, FiHelpCircle, FiClipboard, FiGrid, FiCheckSquare,
  FiMenu, FiX, FiTarget, FiVideo
} from 'react-icons/fi';
import { BsPatchQuestion } from 'react-icons/bs';
import ChangeCredentialsModal from './ChangeCredentialsModal';

const SidebarItem = ({ icon: Icon, text, to, isActive, onClick }) => (
  <Link
    to={to} 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 mb-1 rounded-2xl font-semibold transition-all duration-300 ${
      isActive 
        ? 'bg-blue-600/90 text-white shadow-md shadow-blue-500/20 backdrop-blur-md border border-white/20' 
        : 'text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
    }`}
  >
    <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500'} />
    {text}
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
    <div className="flex h-screen bg-transparent transition-colors duration-300 overflow-hidden">
      
      {/* Mobile Overlay (Glass blur) */}
      <div
        className={`fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* SIDEBAR: Upgraded to Liquid Glass */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[260px] m-4 glass-panel rounded-3xl flex flex-col justify-between transition-all duration-300 ease-in-out md:relative md:m-4 shrink-0
        ${isSidebarOpen ? 'translate-x-0 md:ml-4' : '-translate-x-full md:-ml-[280px]'}`}
      >
        <div className="overflow-y-auto custom-scrollbar h-full flex flex-col pt-2">
          <div className="p-6 flex justify-between items-center shrink-0">
            <h1 className="text-xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
              Destination<br />
              <span className="text-gray-800 dark:text-white text-base opacity-80">Career</span>
            </h1>

            <button
              className="md:hidden text-gray-500 hover:text-gray-900 dark:text-gray-400 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <FiX size={20} />
            </button>
          </div>

          <nav className="mt-2 px-3 pb-4 flex-1">
            <p className="px-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 mb-3 uppercase tracking-widest">
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
          <div className="p-4 mx-3 mb-3 bg-white/40 dark:bg-black/20 rounded-2xl border border-white/50 dark:border-white/5 shrink-0">
            {role === 'student' && (
              <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl mb-4 border border-white/60 dark:border-slate-700/50 flex flex-col items-center shadow-sm">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mb-0.5 tracking-wider uppercase">Employability</p>
                <p className="text-xl font-extrabold text-gray-900 dark:text-white">0 <span className="text-xs text-gray-400 font-medium">/ 100</span></p>
              </div>
            )}

            <div className="flex bg-black/5 dark:bg-black/30 rounded-xl p-1 mb-4">
              <button onClick={() => setIsDarkMode(false)} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${!isDarkMode ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                <FiSun size={14} /> Light
              </button>
              <button onClick={() => setIsDarkMode(true)} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${isDarkMode ? 'bg-slate-700 shadow-sm text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                <FiMoon size={14} /> Dark
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 truncate">
                <div className={`w-9 h-9 shrink-0 rounded-full shadow-sm flex items-center justify-center text-white font-bold text-sm ${isAdmin ? 'bg-red-500' : isTrainer ? 'bg-purple-500' : isPromotional ? 'bg-teal-500' : 'bg-blue-500'}`}>
                  {isAdmin ? 'A' : isTrainer ? 'T' : isPromotional ? 'P' : 'S'}
                </div>
                <div className="truncate">
                  <p className="font-bold text-xs text-gray-900 dark:text-white truncate">
                    {isAdmin ? 'Administrator' : isTrainer ? 'Trainer' : isPromotional ? 'Promo Exec' : 'Student Name'}
                  </p>
                  <p className="text-[10px] font-medium text-gray-500 dark:text-slate-400 truncate">
                    {isAdmin ? 'admin@dc.com' : isTrainer ? 'trainer@dc.com' : isPromotional ? 'promo@dc.com' : 'student@email.com'}
                  </p>
                </div>
              </div>
              <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 bg-white/50 dark:bg-black/20 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors shrink-0" title="Logout">
                <FiLogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header - Glass Effect */}
        <header className="glass-panel m-4 mb-0 p-3 px-4 rounded-2xl flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-600 dark:text-gray-300 p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors"
            >
              <FiMenu size={20} />
            </button>

            <h1 className={`text-base font-extrabold text-blue-600 dark:text-blue-400 transition-opacity duration-300 ${!isSidebarOpen || window.innerWidth < 768 ? 'opacity-100' : 'md:opacity-0 md:w-0 overflow-hidden'}`}>
              Destination<span className="text-gray-800 dark:text-white opacity-80">Career</span>
            </h1>
          </div>

          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ${
              isAdmin ? 'bg-gradient-to-br from-red-500 to-red-600' : isTrainer ? 'bg-gradient-to-br from-purple-500 to-purple-600' : isPromotional ? 'bg-gradient-to-br from-teal-500 to-teal-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'
            }`}
            title={role}
          >
            {isAdmin ? 'A' : isTrainer ? 'T' : isPromotional ? 'P' : 'S'}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-12 transition-colors">
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