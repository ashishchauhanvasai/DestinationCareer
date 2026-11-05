import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FiSearch, FiClipboard, FiCheckCircle } from 'react-icons/fi';

const levelColor = {
  Beginner: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
  Intermediate: 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
  Advanced: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
};

const Assignments = () => {
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/assignments`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then((r) => setItems(r.data))
    .catch((e) => console.error(e))
    .finally(() => setLoading(false));
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

  if (loading) return <div className="h-[50vh] flex items-center justify-center font-bold text-gray-500 animate-pulse text-lg">Loading assignments...</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3.5 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl border border-blue-500/20 shadow-sm shrink-0">
          <FiClipboard className="text-blue-600 dark:text-blue-400" size={28} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Assignments</h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 opacity-90">Complete your assignments and track your progress.</p>
        </div>
      </div>

      {/* Global Stats Panel (Solid Structural Glass Panel) */}
      <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] grid grid-cols-1 md:grid-cols-5 gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-slate-700 shadow-sm">
        <div className="md:col-span-2 md:pr-8">
          <p className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Overall Progress</p>
          <div className="flex items-end gap-3 mb-4">
            <p className="text-5xl font-black text-gray-900 dark:text-white leading-none tracking-tight">{overall}%</p>
            <p className="text-[13px] font-extrabold text-gray-500 dark:text-gray-400 pb-1 uppercase tracking-wider">{doneQ} of {totalQ} questions done</p>
          </div>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-5">Across {items.length} assignments</p>
          <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden border border-gray-200 dark:border-slate-700 shadow-inner">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${overall}%` }}></div>
          </div>
        </div>

        <div className="pt-6 md:pt-0 md:px-8 flex flex-col justify-center text-center md:text-left">
          <p className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Assignments Done</p>
          <p className="text-4xl font-black text-gray-900 dark:text-white">{finished} <span className="text-xl font-bold text-gray-400">/ {items.length}</span></p>
        </div>
        
        <div className="pt-6 md:pt-0 md:px-8 flex flex-col justify-center text-center md:text-left">
          <p className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Q's Attempted</p>
          <p className="text-4xl font-black text-gray-900 dark:text-white">{doneQ}</p>
        </div>
        
        <div className="pt-6 md:pt-0 md:pl-8 flex flex-col justify-center text-center md:text-left">
          <p className="text-[11px] font-extrabold text-green-700 dark:text-green-400 uppercase tracking-widest mb-2">Marks Earned</p>
          <p className="text-4xl font-black text-green-600 dark:text-green-400">{earned} <span className="text-xl font-bold text-green-700/50 dark:text-green-400/50">/ {totalMarks}</span></p>
        </div>
      </div>

      <div className="glass-panel rounded-[2.5rem] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm border border-gray-200 dark:border-slate-700">
        {/* Tabs */}
        <div className="flex bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl shadow-inner border border-gray-200 dark:border-slate-700 overflow-x-auto custom-scrollbar w-full md:w-fit">
          {['All', 'In progress', 'Completed'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-extrabold text-sm transition-all duration-300 whitespace-nowrap text-center ${
                activeTab === tab 
                  ? 'bg-white dark:bg-[#1e293b] text-blue-600 dark:text-blue-400 shadow-md border border-gray-200 dark:border-slate-600' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80 shrink-0">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={18} />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            type="text" 
            placeholder="Search assignments..." 
            className="apple-input pl-11 py-3.5 font-bold text-[15px] shadow-sm" 
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="glass-panel text-center py-20 rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-slate-700">
          <p className="text-gray-500 dark:text-gray-400 font-bold text-xl">No assignments found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visible.map((a) => {
            const progress = a.questions ? Math.round((a.answered / a.questions) * 100) : 0;
            const complete = a.questions > 0 && a.answered >= a.questions;
            return (
              <Link 
                key={a._id} 
                to={`/assignments/${a._id}`} 
                className="glass-panel p-6 md:p-8 rounded-[2.5rem] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group shadow-sm hover:shadow-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-6">
                    <h3 className="font-extrabold text-gray-900 dark:text-white text-2xl leading-tight tracking-tight group-hover:text-blue-600 transition-colors pr-2">{a.title}</h3>
                    <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-md uppercase tracking-wider border shrink-0 shadow-sm ${levelColor[a.level]}`}>
                      {a.level}
                    </span>
                  </div>

                  {/* Tiny Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className="bg-gray-50 dark:bg-slate-800/80 p-4 rounded-[1.5rem] text-center border border-gray-200 dark:border-slate-700 shadow-sm">
                      <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Topics</p>
                      <p className="font-black text-gray-900 dark:text-white text-lg">{a.modules}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-800/80 p-4 rounded-[1.5rem] text-center border border-gray-200 dark:border-slate-700 shadow-sm">
                      <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Q's</p>
                      <p className="font-black text-gray-900 dark:text-white text-lg">{a.questions}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-[1.5rem] text-center border border-green-200 dark:border-green-800/50 shadow-sm">
                      <p className="text-[10px] font-extrabold text-green-700 dark:text-green-400 uppercase tracking-widest mb-1.5">Marks</p>
                      <p className="font-black text-green-600 dark:text-green-400 text-lg">{a.marks}<span className="text-xs text-green-700/50 dark:text-green-400/50 font-bold">/{a.totalMarks}</span></p>
                    </div>
                  </div>
                </div>

                {complete ? (
                  <div className="pt-6 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between mt-auto">
                    <span className="text-[11px] font-extrabold text-green-700 dark:text-green-400 flex items-center gap-1.5 bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800 shadow-sm uppercase tracking-wider">
                      <FiCheckCircle size={16} /> Completed
                    </span>
                    <span className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {a.pending > 0 ? <span className="text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-3 py-1.5 rounded-lg border border-orange-200 dark:border-orange-800 shadow-sm">{a.pending} pending</span> : 'All graded'}
                    </span>
                  </div>
                ) : (
                  <div className="mt-auto pt-6 border-t border-gray-200 dark:border-slate-700">
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Progress</span>
                      <span className="text-[15px] font-black text-blue-600 dark:text-blue-400">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 mb-4 border border-gray-200 dark:border-slate-700 shadow-inner overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[11px] font-extrabold uppercase tracking-widest text-gray-500">
                      <span><strong className="text-gray-900 dark:text-white text-[13px]">{a.answered}</strong> attempted</span>
                      <span><strong className="text-gray-900 dark:text-white text-[13px]">{a.questions - a.answered}</strong> left</span>
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