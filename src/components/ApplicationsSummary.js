import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FiBriefcase } from 'react-icons/fi';

const API = process.env.REACT_APP_API_URL;
const STATUSES = ['Applied', 'Shortlisted', 'Interview Scheduled', 'Next Round', 'Selected', 'Rejected'];

const STATUS_STYLE = {
  Applied: 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700',
  Shortlisted: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  'Interview Scheduled': 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  'Next Round': 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  Selected: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
  Rejected: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
};

const ApplicationsSummary = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios
      .get(`${API}/api/applications/mine`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setData(res.data))
      .catch(() => setData(null));
  }, []);

  if (!data || data.total === 0) return null;

  const interviews = data.applications.filter((a) => a.status === 'Interview Scheduled' || a.status === 'Next Round');

  return (
    <section>
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl border border-blue-500/20 shadow-sm shrink-0">
            <FiBriefcase className="text-blue-600 dark:text-blue-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">My Job Applications</h2>
            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mt-1 opacity-90 hidden sm:block">Track the status of your current applications.</p>
          </div>
        </div>
        <Link to="/my-applications" className="text-[13px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline glass-button px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
          View all
        </Link>
      </div>

      <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 md:gap-6 shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="bg-gray-50 dark:bg-slate-800/80 p-5 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform duration-300">
          <p className="text-3xl font-black text-gray-900 dark:text-white mb-2 leading-none">{data.total}</p>
          <span className="inline-block text-[10px] font-extrabold px-3 py-1.5 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 uppercase tracking-wider shadow-sm mt-1">
            Total Apps
          </span>
        </div>
        
        {STATUSES.map((s) => (
          <div key={s} className="bg-gray-50 dark:bg-slate-800/80 p-5 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform duration-300">
            <p className="text-3xl font-black text-gray-900 dark:text-white mb-2 leading-none">{data.counts[s] || 0}</p>
            <span className={`inline-block text-[9px] font-extrabold px-3 py-1.5 rounded-lg border uppercase tracking-wider shadow-sm mt-1 ${STATUS_STYLE[s]}`}>{s}</span>
          </div>
        ))}
      </div>

      {interviews.length > 0 && (
        <div className="mt-6 glass-panel rounded-[2rem] bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/50 p-6 md:p-8 shadow-sm">
          <p className="font-extrabold text-purple-800 dark:text-purple-300 text-[13px] mb-4 uppercase tracking-widest flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
            </span>
            Upcoming Interviews
          </p>
          <ul className="space-y-3 text-[15px] font-medium text-purple-900 dark:text-purple-200">
            {interviews.map((a) => (
              <li key={a._id} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 bg-white/60 dark:bg-slate-900/50 p-3 sm:p-4 rounded-xl border border-purple-100 dark:border-purple-800/50 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
                  <span className="font-extrabold">{a.job.title}</span>
                </div>
                <div className="flex items-center gap-2 text-[13px] text-purple-700 dark:text-purple-400 font-bold ml-4 sm:ml-0">
                  <span className="hidden sm:inline opacity-50">•</span>
                  <span>Round {a.roundNo}</span>
                  <span className="opacity-50">•</span>
                  <span>{a.interviewDate || 'Date TBA'}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default ApplicationsSummary;