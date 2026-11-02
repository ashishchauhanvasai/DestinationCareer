import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FiBriefcase } from 'react-icons/fi';

const API = process.env.REACT_APP_API_URL;
const STATUSES = ['Applied', 'Shortlisted', 'Interview Scheduled', 'Next Round', 'Selected', 'Rejected'];

const STATUS_STYLE = {
  Applied: 'bg-black/5 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-black/5 dark:border-white/10',
  Shortlisted: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  'Interview Scheduled': 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
  'Next Round': 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  Selected: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20',
  Rejected: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20'
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
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/10 dark:bg-blue-400/10 rounded-xl backdrop-blur-md border border-blue-500/20 shadow-sm">
            <FiBriefcase className="text-blue-600 dark:text-blue-400" size={22} />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">My Job Applications</h2>
        </div>
        <Link to="/my-applications" className="text-sm font-extrabold text-blue-600 dark:text-blue-400 hover:underline">
          View all
        </Link>
      </div>

      <div className="glass-panel p-6 md:p-8 rounded-[2rem] grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-5 shadow-lg border-white/60">
        <div className="bg-white/60 dark:bg-slate-800/60 p-4 rounded-[1.5rem] border border-white/50 dark:border-slate-700/50 shadow-sm flex flex-col items-center justify-center text-center hover:scale-105 transition-transform duration-300">
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">{data.total}</p>
          <span className="inline-block text-[10px] font-extrabold px-3 py-1 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 uppercase tracking-wider shadow-sm">
            Total
          </span>
        </div>
        
        {STATUSES.map((s) => (
          <div key={s} className="bg-white/60 dark:bg-slate-800/60 p-4 rounded-[1.5rem] border border-white/50 dark:border-slate-700/50 shadow-sm flex flex-col items-center justify-center text-center hover:scale-105 transition-transform duration-300">
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">{data.counts[s] || 0}</p>
            <span className={`inline-block text-[9px] font-extrabold px-2.5 py-1 rounded-lg border uppercase tracking-wider shadow-sm ${STATUS_STYLE[s]}`}>{s}</span>
          </div>
        ))}
      </div>

      {interviews.length > 0 && (
        <div className="mt-6 glass-panel rounded-[1.5rem] bg-purple-500/5 dark:bg-purple-500/10 border-purple-500/20 p-5 shadow-sm">
          <p className="font-extrabold text-purple-800 dark:text-purple-300 text-sm mb-3 uppercase tracking-wider">Upcoming Interviews</p>
          <ul className="space-y-2 text-sm font-medium text-purple-900 dark:text-purple-200">
            {interviews.map((a) => (
              <li key={a._id} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></span>
                <span className="font-bold">{a.job.title}:</span> round {a.roundNo}
                {a.interviewDate ? ` • ${a.interviewDate}` : ' • date will be shared soon'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default ApplicationsSummary;