import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FiCode } from 'react-icons/fi';

const diffColor = { 
  Easy: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800', 
  Medium: 'text-yellow-700 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800', 
  Hard: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800' 
};

const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const Tests = () => {
  const [problems, setProblems] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/problems`, cfg())
      .then((r) => setProblems(r.data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const earned = problems.reduce((a, p) => a + (p.bestScore || 0), 0);
  const available = problems.reduce((a, p) => a + p.points, 0);
  const solved = problems.filter((p) => p.bestScore === p.points).length;
  const visible = problems.filter((p) => filter === 'All' || p.difficulty === filter);

  if (loading) return <div className="h-[50vh] flex items-center justify-center font-bold text-gray-500 animate-pulse text-lg">Loading tests...</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in pb-12">
      
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3.5 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl border border-blue-500/20 shadow-sm shrink-0">
          <FiCode className="text-blue-600 dark:text-blue-400" size={28} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Coding Tests</h1>
          <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mt-1 opacity-90">Practice coding problems and improve your logic.</p>
        </div>
      </div>
      
      <div className="glass-panel bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-slate-700 shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="md:pr-8 py-5 md:py-2 flex flex-col justify-center text-center md:text-left">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-widest mb-2.5">Marks earned</p>
          <p className="text-3xl lg:text-4xl font-black text-green-600 dark:text-green-400 tracking-tight">{earned} <span className="text-xl font-bold text-gray-300 dark:text-gray-600">/ {available}</span></p>
        </div>
        <div className="md:px-8 py-5 md:py-2 flex flex-col justify-center text-center md:text-left">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-widest mb-2.5">Fully solved</p>
          <p className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight">{solved} <span className="text-xl font-bold text-gray-300 dark:text-gray-600">/ {problems.length}</span></p>
        </div>
        <div className="md:pl-8 py-5 md:py-2 flex flex-col justify-center text-center md:text-left">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-widest mb-2.5">Attempted</p>
          <p className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight">{problems.filter((p) => p.attempts > 0).length}</p>
        </div>
      </div>
      
      <div className="flex gap-4 border-b border-gray-200 dark:border-slate-700 pb-3 overflow-x-auto custom-scrollbar">
        {['All', 'Easy', 'Medium', 'Hard'].map((d) => (
          <button 
            key={d} 
            onClick={() => setFilter(d)} 
            className={`px-6 py-3 rounded-xl text-[13px] font-extrabold transition-all duration-300 whitespace-nowrap shadow-sm border ${
              filter === d 
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-gray-200 dark:border-slate-700' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 border-transparent'
            }`}
          >
            {d}
          </button>
        ))}
      </div>
      
      <div className="glass-panel bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="divide-y divide-gray-200 dark:divide-slate-700 p-2 md:p-3">
          {visible.length === 0 && <p className="p-16 text-center text-gray-500 font-bold text-xl">No questions match this filter.</p>}
          {visible.map((p) => (
            <Link key={p._id} to={`/tests/${p.slug}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 md:p-7 hover:bg-gray-50 dark:hover:bg-slate-800/80 transition-colors m-1 md:m-1.5 rounded-[1.5rem] group">
              <div className="mb-4 sm:mb-0">
                <p className="font-extrabold text-[17px] md:text-lg text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight line-clamp-1">{p.title}</p>
                <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg border shadow-sm uppercase tracking-wider ${diffColor[p.difficulty]}`}>{p.difficulty}</span>
              </div>
              <div className="sm:text-right text-sm">
                <p className={`text-[11px] font-extrabold uppercase tracking-widest ${p.bestScore === p.points ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-300'}`}>
                  {p.bestScore === null ? <span className="bg-gray-100 dark:bg-slate-800 px-3.5 py-2 rounded-[0.8rem] border border-gray-200 dark:border-slate-700 shadow-sm">Not attempted</span> : `Score: ${p.bestScore} / ${p.points}`}
                </p>
                {p.attempts > 0 && <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mt-2.5">{p.attempts} attempt(s)</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
export default Tests;