// import React, { useState, useEffect } from 'react';
// import { Link, useLocation, useNavigate } from 'react-router-dom';
// import {
//   FiHome, FiBookOpen, FiFileText, FiBriefcase, FiBookmark, FiSun, FiMoon, FiLogOut, FiUser,
//   FiBook, FiStar, FiAward, FiImage, FiUsers, FiHelpCircle, FiClipboard, FiGrid, FiCheckSquare,
//   FiMenu, FiX // Added FiMenu for the hamburger icon and FiX for close
// } from 'react-icons/fi';
// import { BsPatchQuestion } from 'react-icons/bs';
// import ChangeCredentialsModal from './ChangeCredentialsModal';

// const SidebarItem = ({ icon: Icon, text, to, isActive, onClick }) => (
//   <Link
//     to={to}
//     onClick={onClick} // Added onClick so menu closes when tapped on mobile
//     className={`flex items-center gap-4 px-6 py-3 my-1 rounded-r-full font-medium transition-colors ${
//       isActive
//         ? 'bg-blue-50 dark:bg-slate-700/50 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600 dark:border-blue-400'
//         : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
//     }`}
//   >
//     <Icon size={20} />
//     <span>{text}</span>
//   </Link>
// );

// const Layout = ({ children }) => {
//   const location = useLocation();
//   const navigate = useNavigate();

//   const role = localStorage.getItem('role');
//   const isAdmin = role === 'admin' || role === 'superadmin';
//   const isTrainer = role === 'trainer';

//   const currentTab = new URLSearchParams(location.search).get('tab') || 'Courses';

//   // State for mobile menu
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

//   const adminMenu = [
//     { tab: 'Courses', text: 'Manage Courses', icon: FiBook },
//     { tab: 'Testimonials', text: 'Testimonials', icon: FiStar },
//     { tab: 'Performers', text: 'Top Performers', icon: FiAward },
//     { tab: 'Banner', text: 'Banner', icon: FiImage },
//     { tab: 'Approvals', text: 'Approvals', icon: FiUsers },
//     { tab: 'Jobs', text: 'Jobs', icon: FiBriefcase },
//     { tab: 'Company Questions', text: 'Company Questions', icon: FiHelpCircle },
//     { tab: 'Assignments', text: 'Assignments', icon: FiClipboard },
//     { tab: 'Coding Tests', text: 'Coding Tests', icon: FiFileText },
//     ...(role === 'superadmin'
//       ? [
//           { tab: 'Manage Users', text: 'Manage Users', icon: FiUsers },
//           { tab: 'Batches', text: 'Batches & QR', icon: FiGrid }
//         ]
//       : []),
//     { tab: 'Attendance Reports', text: 'Attendance Reports', icon: FiCheckSquare },
//   ];

//   const handleLogout = () => {
//     localStorage.clear();
//     navigate('/login');
//   };

//   const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
//   const [showCreds, setShowCreds] = useState(false);

//   useEffect(() => {
//     const root = window.document.documentElement;
//     if (isDarkMode) {
//       root.classList.add('dark');
//       root.style.backgroundColor = "#0f172a";
//       localStorage.setItem('theme', 'dark');
//     } else {
//       root.classList.remove('dark');
//       root.style.backgroundColor = "#f9fafb";
//       localStorage.setItem('theme', 'light');
//     }
//   }, [isDarkMode]);

//   // Close menu when route changes
//   useEffect(() => {
//     setIsMobileMenuOpen(false);
//   }, [location.pathname, location.search]);

//   return (
//     <div className="flex h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300 overflow-hidden">
      
//       {/* Mobile Dark Overlay Background */}
//       {isMobileMenuOpen && (
//         <div 
//           className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
//           onClick={() => setIsMobileMenuOpen(false)}
//         />
//       )}

//       {/* Sidebar - Updated for slide-out mobile menu */}
//       <aside 
//         className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r dark:border-slate-700 flex flex-col justify-between transition-transform duration-300 md:relative md:translate-x-0 ${
//           isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
//         }`}
//       >
//         <div className="overflow-y-auto custom-scrollbar">
//           <div className="p-6 flex justify-between items-center">
//             <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
//               Destination<br /><span className="text-gray-800 dark:text-white text-lg">Career</span>
//             </h1>
//             {/* Mobile close button */}
//             <button 
//               className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400"
//               onClick={() => setIsMobileMenuOpen(false)}
//             >
//               <FiX size={24} />
//             </button>
//           </div>

//           <nav className="mt-2 pr-4 pb-4">
//             <p className="px-6 text-xs font-semibold text-gray-400 dark:text-slate-500 mb-2 uppercase tracking-wider">
//               {isAdmin ? 'Admin Panel' : isTrainer ? 'Trainer' : 'Menu'}
//             </p>

//             {isTrainer ? (
//               <SidebarItem onClick={() => setIsMobileMenuOpen(false)} icon={FiGrid} text="My Batches" to="/trainer" isActive={location.pathname === '/trainer'} />
//             ) : isAdmin ? (
//               adminMenu.map((item) => (
//                 <SidebarItem
//                   key={item.tab}
//                   onClick={() => setIsMobileMenuOpen(false)}
//                   icon={item.icon}
//                   text={item.text}
//                   to={`/admin?tab=${encodeURIComponent(item.tab)}`}
//                   isActive={location.pathname === '/admin' && currentTab === item.tab}
//                 />
//               ))
//             ) : (
//               <>
//                 <SidebarItem onClick={() => setIsMobileMenuOpen(false)} icon={FiHome} text="Dashboard" to="/" isActive={location.pathname === '/'} />
//                 <SidebarItem onClick={() => setIsMobileMenuOpen(false)} icon={FiUser} text="My Profile" to="/profile" isActive={location.pathname === '/profile'} />
//                 <SidebarItem onClick={() => setIsMobileMenuOpen(false)} icon={FiBookOpen} text="Courses" to="/courses" isActive={location.pathname === '/courses'} />
//                 <SidebarItem onClick={() => setIsMobileMenuOpen(false)} icon={FiFileText} text="Tests" to="/tests" isActive={location.pathname === '/tests'} />
//                 <SidebarItem onClick={() => setIsMobileMenuOpen(false)} icon={FiFileText} text="Assignments" to="/assignments" isActive={location.pathname === '/assignments'} />
//                 <SidebarItem onClick={() => setIsMobileMenuOpen(false)} icon={FiCheckSquare} text="Attendance" to="/attendance" isActive={location.pathname === '/attendance'} />
//                 <SidebarItem onClick={() => setIsMobileMenuOpen(false)} icon={FiStar} text="Mock Ratings" to="/mock-ratings" isActive={location.pathname === '/mock-ratings'} />
//                 <SidebarItem onClick={() => setIsMobileMenuOpen(false)} icon={BsPatchQuestion} text="Company Questions" to="/company-questions" isActive={location.pathname === '/company-questions'} />
//                 <SidebarItem onClick={() => setIsMobileMenuOpen(false)} icon={FiBriefcase} text="Jobs" to="/jobs" isActive={location.pathname === '/jobs'} />
//                 <SidebarItem onClick={() => setIsMobileMenuOpen(false)} icon={FiBookmark} text="Bookmarks" to="/bookmarks" isActive={location.pathname === '/bookmarks'} />
//               </>
//             )}
//           </nav>
//         </div>

//         <div className="p-4 border-t dark:border-slate-700 bg-white dark:bg-slate-800">
//           {role === 'student' && (
//             <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl mb-4 border dark:border-slate-700 flex flex-col items-center transition-colors">
//               <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">EMPLOYABILITY SCORE</p>
//               <p className="text-2xl font-bold text-gray-800 dark:text-white">0 <span className="text-sm text-gray-400 dark:text-slate-500">/ 100</span></p>
//             </div>
//           )}

//           <div className="flex bg-gray-200 dark:bg-slate-900 rounded-full p-1 mb-4 transition-colors">
//             <button onClick={() => setIsDarkMode(false)} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-medium transition-all ${!isDarkMode ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
//               <FiSun /> Light
//             </button>
//             <button onClick={() => setIsDarkMode(true)} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-medium transition-all ${isDarkMode ? 'bg-slate-700 shadow text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
//               <FiMoon /> Dark
//             </button>
//           </div>

//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isAdmin ? 'bg-red-600' : isTrainer ? 'bg-purple-600' : 'bg-blue-600'}`}>
//                 {isAdmin ? 'A' : isTrainer ? 'T' : 'S'}
//               </div>
//               <div>
//                 <p className="font-semibold text-sm dark:text-white truncate w-28">{isAdmin ? 'Administrator' : isTrainer ? 'Trainer' : 'Student Name'}</p>
//                 <p className="text-xs text-gray-500 dark:text-slate-400 truncate w-28">{isAdmin ? 'admin@dc.com' : isTrainer ? 'trainer@dc.com' : 'student@email.com'}</p>
//               </div>
//             </div>
//             <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Logout">
//               <FiLogOut size={20} />
//             </button>
//           </div>
//         </div>
//       </aside>

//       {/* Main Content Wrapper */}
//       <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
//         {/* Mobile Top Header containing Hamburger Menu */}
//         <header className="md:hidden bg-white dark:bg-slate-800 border-b dark:border-slate-700 p-4 flex items-center justify-between z-10 shrink-0">
//           <div className="flex items-center gap-3">
//             <button 
//               onClick={() => setIsMobileMenuOpen(true)} 
//               className="text-gray-600 dark:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
//             >
//               <FiMenu size={24} />
//             </button>
//             <h1 className="text-lg font-bold text-blue-600 dark:text-blue-400">
//               Destination<span className="text-gray-800 dark:text-white">Career</span>
//             </h1>
//           </div>
//           <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${isAdmin ? 'bg-red-600' : isTrainer ? 'bg-purple-600' : 'bg-blue-600'}`}>
//             {isAdmin ? 'A' : isTrainer ? 'T' : 'S'}
//           </div>
//         </header>

//         {/* Scrollable Main Content - Padding reduced for mobile */}
//         <main className="flex-1 overflow-y-auto p-4 md:p-8">
//           {children}
//         </main>
//       </div>

//       {showCreds && (
//         <ChangeCredentialsModal onClose={() => setShowCreds(false)} />
//       )}
//     </div>
//   );
// };

// export default Layout;




import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome, FiBookOpen, FiFileText, FiBriefcase, FiSun, FiMoon, FiLogOut, FiUser,
  FiBook, FiStar, FiAward, FiImage, FiUsers, FiHelpCircle, FiClipboard, FiGrid, FiCheckSquare,
  FiMenu, FiX
} from 'react-icons/fi';
import { BsPatchQuestion } from 'react-icons/bs';
import ChangeCredentialsModal from './ChangeCredentialsModal';

const SidebarItem = ({ icon: Icon, text, to, isActive, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-4 px-6 py-3 my-1 rounded-r-full font-medium transition-colors ${
      isActive
        ? 'bg-blue-50 dark:bg-slate-700/50 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600 dark:border-blue-400'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
    }`}
  >
    <Icon size={20} />
    <span>{text}</span>
  </Link>
);

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const role = localStorage.getItem('role');
  const isAdmin = role === 'admin' || role === 'superadmin';
  const isTrainer = role === 'trainer';

  const currentTab = new URLSearchParams(location.search).get('tab') || 'Courses';

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    { tab: 'Attendance Reports', text: 'Attendance Reports', icon: FiCheckSquare },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [showCreds, setShowCreds] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.style.backgroundColor = '#0f172a';
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = '#f9fafb';
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300 overflow-hidden">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r dark:border-slate-700 flex flex-col justify-between transition-transform duration-300 md:relative md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="overflow-y-auto custom-scrollbar">
          <div className="p-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              Destination<br />
              <span className="text-gray-800 dark:text-white text-lg">Career</span>
            </h1>

            <button
              className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <FiX size={24} />
            </button>
          </div>

          <nav className="mt-2 pr-4 pb-4">
            <p className="px-6 text-xs font-semibold text-gray-400 dark:text-slate-500 mb-2 uppercase tracking-wider">
              {isAdmin ? 'Admin Panel' : isTrainer ? 'Trainer' : 'Menu'}
            </p>

            {isTrainer ? (
              <SidebarItem
                onClick={() => setIsMobileMenuOpen(false)}
                icon={FiGrid}
                text="My Batches"
                to="/trainer"
                isActive={location.pathname === '/trainer'}
              />
            ) : isAdmin ? (
              adminMenu.map((item) => (
                <SidebarItem
                  key={item.tab}
                  onClick={() => setIsMobileMenuOpen(false)}
                  icon={item.icon}
                  text={item.text}
                  to={`/admin?tab=${encodeURIComponent(item.tab)}`}
                  isActive={location.pathname === '/admin' && currentTab === item.tab}
                />
              ))
            ) : (
              <>
                <SidebarItem
                  onClick={() => setIsMobileMenuOpen(false)}
                  icon={FiHome}
                  text="Dashboard"
                  to="/"
                  isActive={location.pathname === '/'}
                />
                <SidebarItem
                  onClick={() => setIsMobileMenuOpen(false)}
                  icon={FiUser}
                  text="My Profile"
                  to="/profile"
                  isActive={location.pathname === '/profile'}
                />
                <SidebarItem
                  onClick={() => setIsMobileMenuOpen(false)}
                  icon={FiBookOpen}
                  text="Courses"
                  to="/courses"
                  isActive={location.pathname === '/courses'}
                />
                <SidebarItem
                  onClick={() => setIsMobileMenuOpen(false)}
                  icon={FiFileText}
                  text="Tests"
                  to="/tests"
                  isActive={location.pathname === '/tests'}
                />
                <SidebarItem
                  onClick={() => setIsMobileMenuOpen(false)}
                  icon={FiFileText}
                  text="Assignments"
                  to="/assignments"
                  isActive={location.pathname === '/assignments'}
                />
                <SidebarItem
                  onClick={() => setIsMobileMenuOpen(false)}
                  icon={FiCheckSquare}
                  text="Attendance"
                  to="/attendance"
                  isActive={location.pathname === '/attendance'}
                />
                <SidebarItem
                  onClick={() => setIsMobileMenuOpen(false)}
                  icon={FiStar}
                  text="Mock Ratings"
                  to="/mock-ratings"
                  isActive={location.pathname === '/mock-ratings'}
                />
                <SidebarItem
                  onClick={() => setIsMobileMenuOpen(false)}
                  icon={BsPatchQuestion}
                  text="Company Questions"
                  to="/company-questions"
                  isActive={location.pathname === '/company-questions'}
                />
                <SidebarItem
                  onClick={() => setIsMobileMenuOpen(false)}
                  icon={FiBriefcase}
                  text="Jobs"
                  to="/jobs"
                  isActive={location.pathname === '/jobs'}
                />
                <SidebarItem
                  onClick={() => setIsMobileMenuOpen(false)}
                  icon={FiClipboard}
                  text="My Applications"
                  to="/my-applications"
                  isActive={location.pathname === '/my-applications'}
                />
              </>
            )}
          </nav>
        </div>

        <div className="p-4 border-t dark:border-slate-700 bg-white dark:bg-slate-800">
          {role === 'student' && (
            <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl mb-4 border dark:border-slate-700 flex flex-col items-center transition-colors">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">
                EMPLOYABILITY SCORE
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                0 <span className="text-sm text-gray-400 dark:text-slate-500">/ 100</span>
              </p>
            </div>
          )}

          <div className="flex bg-gray-200 dark:bg-slate-900 rounded-full p-1 mb-4 transition-colors">
            <button
              onClick={() => setIsDarkMode(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-medium transition-all ${
                !isDarkMode
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <FiSun /> Light
            </button>
            <button
              onClick={() => setIsDarkMode(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-medium transition-all ${
                isDarkMode
                  ? 'bg-slate-700 shadow text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <FiMoon /> Dark
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                  isAdmin ? 'bg-red-600' : isTrainer ? 'bg-purple-600' : 'bg-blue-600'
                }`}
              >
                {isAdmin ? 'A' : isTrainer ? 'T' : 'S'}
              </div>
              <div>
                <p className="font-semibold text-sm dark:text-white truncate w-28">
                  {isAdmin ? 'Administrator' : isTrainer ? 'Trainer' : 'Student Name'}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate w-28">
                  {isAdmin ? 'admin@dc.com' : isTrainer ? 'trainer@dc.com' : 'student@email.com'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Logout"
            >
              <FiLogOut size={20} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden bg-white dark:bg-slate-800 border-b dark:border-slate-700 p-4 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-gray-600 dark:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
            >
              <FiMenu size={24} />
            </button>
            <h1 className="text-lg font-bold text-blue-600 dark:text-blue-400">
              Destination<span className="text-gray-800 dark:text-white">Career</span>
            </h1>
          </div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
              isAdmin ? 'bg-red-600' : isTrainer ? 'bg-purple-600' : 'bg-blue-600'
            }`}
          >
            {isAdmin ? 'A' : isTrainer ? 'T' : 'S'}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>

      {showCreds && (
        <ChangeCredentialsModal onClose={() => setShowCreds(false)} />
      )}
    </div>
  );
};

export default Layout;
