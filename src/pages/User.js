import React from 'react';
import { FiUser } from 'react-icons/fi';

const User = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 animate-fade-in relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[140px] rounded-full pointer-events-none fixed"></div>
      
      <div className="glass-panel p-12 md:p-16 rounded-[3rem] shadow-2xl max-w-lg w-full text-center border-white/60 relative z-10">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-800 text-blue-600 dark:text-blue-400 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-white/60 dark:border-slate-600">
           <FiUser size={36} />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4 leading-tight">User Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg leading-relaxed bg-black/5 dark:bg-white/5 p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-inner">
          Welcome, User! Here you can browse and watch courses directly from the platform.
        </p>
      </div>
    </div>
  );
};

export default User;