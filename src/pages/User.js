import React from 'react';
import { FiUser } from 'react-icons/fi';

const User = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 animate-fade-in relative overflow-hidden bg-gray-50 dark:bg-[#0f172a]">
      {/* Background gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[140px] rounded-full pointer-events-none fixed"></div>
      
      <div className="glass-panel bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-12 md:p-16 rounded-[2.5rem] shadow-xl max-w-lg w-full text-center relative z-10">
        <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-200 dark:border-slate-700">
           <FiUser size={40} />
        </div>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-4 leading-tight">User Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300 font-medium text-[15px] leading-relaxed bg-gray-50 dark:bg-slate-800 p-5 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-inner">
          Welcome, User! Here you can browse and watch courses directly from the platform.
        </p>
      </div>
    </div>
  );
};

export default User;