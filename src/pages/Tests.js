import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FiCode } from 'react-icons/fi';

const diffColor = { Easy: 'text-green-700 bg-green-500/10 border-green-500/20', Medium: 'text-yellow-700 bg-yellow-500/10 border-yellow-500/20', Hard: 'text-red-700 bg-red-500/10 border-red-500/20' };
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const Tests = () => {
  const [problems, setProblems] = useState([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/problems`, cfg()).then((r) => setProblems(r.data)).catch((e) => console.error(e));
  }, []);

  const earned = problems.reduce((a, p) => a + (p.bestScore || 0), 0);
  const available = problems.reduce((a, p) => a + p.points, 0);
  const solved = problems.filter((p) => p.bestScore === p.points).length;
  const visible = problems.filter((p) => filter === 'All' || p.difficulty === filter);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl backdrop-blur-md border border-blue-500/20 shadow-sm">
          <FiCode className="text-blue-600 dark:text-blue-400" size={28} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Coding Tests</h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Practice coding problems and improve your logic.</p>
        </div>
      </div>
      
      <div className="glass-panel rounded-[2rem] p-8 md:p-10 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black/5 dark:divide-white/5 shadow-sm border-white/60">
        <div className="md:pr-8 py-4 md:py-0 flex flex-col justify-center text-center md:text-left">
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-widest mb-2">Marks earned</p>
          <p className="text-3xl font-extrabold text-green-600 dark:text-green-400">{earned} <span className="text-lg text-gray-400">/ {available}</span></p>
        </div>
        <div className="md:px-8 py-4 md:py-0 flex flex-col justify-center text-center md:text-left">
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-widest mb-2">Fully solved</p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{solved} <span className="text-lg text-gray-400">/ {problems.length}</span></p>
        </div>
        <div className="md:pl-8 py-4 md:py-0 flex flex-col justify-center text-center md:text-left">
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-widest mb-2">Attempted</p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{problems.filter((p) => p.attempts > 0).length}</p>
        </div>
      </div>
      
      <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
        {['All', 'Easy', 'Medium', 'Hard'].map((d) => (
          <button 
            key={d} 
            onClick={() => setFilter(d)} 
            className={`px-6 py-2.5 rounded-full text-sm font-extrabold transition-all duration-300 whitespace-nowrap ${
              filter === d 
                ? 'bg-white/60 dark:bg-slate-800/60 text-blue-600 dark:text-blue-400 shadow-sm border border-white/50 dark:border-slate-700/50 backdrop-blur-md' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            {d}
          </button>
        ))}
      </div>
      
      <div className="glass-panel rounded-[2.5rem] shadow-sm border-white/60 overflow-hidden">
        <div className="divide-y divide-black/5 dark:divide-white/5 p-2">
          {visible.length === 0 && <p className="p-16 text-center text-gray-500 font-medium text-lg">No questions yet.</p>}
          {visible.map((p) => (
            <Link key={p._id} to={`/tests/${p.slug}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-black/5 dark:hover:bg-white/5 transition-colors m-1 rounded-2xl group">
              <div className="mb-4 sm:mb-0">
                <p className="font-extrabold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors tracking-tight">{p.title}</p>
                <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg border shadow-sm uppercase tracking-wider ${diffColor[p.difficulty]}`}>{p.difficulty}</span>
              </div>
              <div className="sm:text-right text-sm">
                <p className={`text-[13px] font-extrabold uppercase tracking-wider ${p.bestScore === p.points ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-300'}`}>
                  {p.bestScore === null ? <span className="bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-black/5">Not attempted</span> : `Score: ${p.bestScore} / ${p.points}`}
                </p>
                {p.attempts > 0 && <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mt-2">{p.attempts} attempt(s)</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
export default Tests;