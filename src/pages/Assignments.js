import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FiSearch, FiClipboard, FiCheckCircle } from 'react-icons/fi';

// Mapped original Tailwind classes to their glass-style equivalents
const levelColor = {
  Beginner: 'text-green-700 dark:text-green-400 bg-green-500/10 border-green-500/20',
  Intermediate: 'text-yellow-700 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  Advanced: 'text-red-700 dark:text-red-400 bg-red-500/10 border-red-500/20'
};

const Assignments = () => {
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/assignments`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then((r) => setItems(r.data)).catch((e) => console.error(e));
  }, []);

  const totalQ = items.reduce((s, a) => s + a.questions, 0);
  const doneQ = items.reduce((s, a) => s + a.answered, 0);
  const totalMarks = items.reduce((s, a) => s + a.totalMarks, 0);
  const earned = items.reduce((s, a) => s + a.marks, 0);
  const finished = items.filter((a) => a.questions > 0 && a.answered >= a.questions).length;
  const overall = totalQ ? Math.round((doneQ / totalQ) * 100) : 0;

  const visible = items.filter((a) => {
    const complete = a.questions > 0 && a.answered >= a.questions;
    if (activeTab === 'In progress' && (complete || a.answered === 0)) return false;
    if (activeTab === 'Completed' && !complete) return false;
    return a.title.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl backdrop-blur-md border border-blue-500/20 shadow-sm">
          <FiClipboard className="text-blue-600 dark:text-blue-400" size={26} />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Assignments</h1>
      </div>

      {/* Global Stats Panel (Glassmorphism) */}
      <div className="glass-panel p-8 rounded-[2rem] grid grid-cols-1 md:grid-cols-5 gap-6 divide-y md:divide-y-0 md:divide-x divide-black/5 dark:divide-white/5">
        <div className="md:col-span-2 md:pr-6">
          <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Overall Progress</p>
          <div className="flex items-end gap-3 mb-2">
            <p className="text-4xl font-extrabold text-gray-900 dark:text-white leading-none">{overall}%</p>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 pb-1">{doneQ} of {totalQ} questions attempted</p>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 font-medium">Across {items.length} assignments</p>
          <div className="w-full bg-black/5 dark:bg-white/5 rounded-full h-2.5 overflow-hidden border border-black/5 dark:border-white/5 shadow-inner">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${overall}%` }}></div>
          </div>
        </div>

        <div className="pt-6 md:pt-0 md:px-6 flex flex-col justify-center">
          <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Assignments Done</p>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{finished} <span className="text-base text-gray-400">/ {items.length}</span></p>
        </div>
        
        <div className="pt-6 md:pt-0 md:px-6 flex flex-col justify-center">
          <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Questions Attempted</p>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{doneQ}</p>
        </div>
        
        <div className="pt-6 md:pt-0 md:pl-6 flex flex-col justify-center">
          <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Marks Earned</p>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white text-green-600 dark:text-green-400">{earned} <span className="text-base text-gray-400">/ {totalMarks}</span></p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Tabs */}
        <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
          {['All', 'In progress', 'Completed'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-white/60 dark:bg-slate-800/60 text-blue-600 dark:text-blue-400 shadow-sm border border-white/50 dark:border-slate-700/50 backdrop-blur-md' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={18} />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            type="text" 
            placeholder="Search assignments..." 
            className="apple-input pl-11 shadow-sm" 
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="glass-panel text-center py-16 rounded-[2rem]">
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">No assignments found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((a) => {
            const progress = a.questions ? Math.round((a.answered / a.questions) * 100) : 0;
            const complete = a.questions > 0 && a.answered >= a.questions;
            return (
              <Link 
                key={a._id} 
                to={`/assignments/${a._id}`} 
                className="glass-panel p-7 rounded-[2rem] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-6">
                    <h3 className="font-extrabold text-gray-900 dark:text-white text-xl leading-snug tracking-tight">{a.title}</h3>
                    <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider border shrink-0 ${levelColor[a.level]}`}>
                      {a.level}
                    </span>
                  </div>

                  {/* Tiny Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className="bg-black/5 dark:bg-white/5 p-3 rounded-2xl text-center border border-black/5 dark:border-white/5">
                      <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Topics</p>
                      <p className="font-extrabold text-gray-900 dark:text-white text-base">{a.modules}</p>
                    </div>
                    <div className="bg-black/5 dark:bg-white/5 p-3 rounded-2xl text-center border border-black/5 dark:border-white/5">
                      <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Q's</p>
                      <p className="font-extrabold text-gray-900 dark:text-white text-base">{a.questions}</p>
                    </div>
                    <div className="bg-black/5 dark:bg-white/5 p-3 rounded-2xl text-center border border-black/5 dark:border-white/5">
                      <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Marks</p>
                      <p className="font-extrabold text-green-600 dark:text-green-400 text-base">{a.marks}<span className="text-[10px] text-gray-400 font-medium">/{a.totalMarks}</span></p>
                    </div>
                  </div>
                </div>

                {complete ? (
                  <div className="pt-5 border-t border-black/5 dark:border-white/5 flex items-center justify-between mt-auto">
                    <span className="text-sm font-extrabold text-green-600 dark:text-green-400 flex items-center gap-1.5 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
                      <FiCheckCircle /> Completed
                    </span>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                      {a.pending > 0 ? <span className="text-orange-500">{a.pending} awaiting review</span> : 'All graded'}
                    </span>
                  </div>
                ) : (
                  <div className="mt-auto">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Progress</span>
                      <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">{progress}%</span>
                    </div>
                    <div className="w-full bg-black/5 dark:bg-white/5 rounded-full h-2 mb-3 border border-black/5 dark:border-white/5 shadow-inner overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-gray-900 dark:text-white">{a.answered} <span className="text-gray-400 font-medium">attempted</span></span>
                      <span className="text-gray-900 dark:text-white">{a.questions - a.answered} <span className="text-gray-400 font-medium">remaining</span></span>
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Assignments;