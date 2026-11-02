import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FiMapPin, FiCalendar, FiChevronDown, FiChevronUp, FiBriefcase } from 'react-icons/fi';

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

const MyApplications = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios
      .get(`${API}/api/applications/mine`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setData(res.data))
      .catch((err) => console.error('Failed to load applications', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-16 text-center text-gray-500 font-extrabold text-lg animate-pulse">Loading your applications...</div>;
  if (!data) return <div className="p-16 text-center text-red-600 font-extrabold text-lg">Could not load your applications. Try again later.</div>;
  
  const visible = filter === 'All' ? data.applications : data.applications.filter((a) => a.status === filter);

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6 px-2 animate-fade-in">
      
      <div className="flex items-center gap-4 mb-2">
        <div className="p-3 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl backdrop-blur-md border border-blue-500/20 shadow-sm">
          <FiBriefcase className="text-blue-600 dark:text-blue-400" size={28} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">My Applications</h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
            Track the status of every job you've applied for.
          </p>
        </div>
      </div>

      {/* Counts (Glass Panels) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <button
          type="button"
          onClick={() => setFilter('All')}
          className={`glass-panel p-5 rounded-[1.5rem] text-center hover:scale-[1.03] transition-transform duration-300 flex flex-col items-center justify-center ${
            filter === 'All' ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-sm'
          }`}
          >
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 leading-none">{data.total}</p>
          <span className="inline-block text-[10px] font-extrabold px-3 py-1 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 uppercase tracking-widest shadow-sm">
            Total
          </span>
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(filter === s ? 'All' : s)}
            className={`glass-panel p-5 rounded-[1.5rem] text-center hover:scale-[1.03] transition-transform duration-300 flex flex-col items-center justify-center ${
              filter === s ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-sm'
            }`}
          >
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 leading-none">{data.counts[s] || 0}</p>
            <span className={`inline-block text-[9px] font-extrabold px-2.5 py-1 rounded-lg border uppercase tracking-wider shadow-sm ${STATUS_STYLE[s]}`}>{s}</span>
          </button>
        ))}
      </div>

      {/* List */}
      {data.total === 0 ? (
        <div className="glass-panel p-16 text-center rounded-[2.5rem] shadow-sm border-white/60 flex flex-col items-center justify-center mt-8">
          <p className="text-gray-500 dark:text-gray-400 font-bold text-lg mb-6">You have not applied for any job yet.</p>
          <Link to="/jobs" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3.5 rounded-xl font-extrabold text-[15px] shadow-lg shadow-blue-500/30 hover:scale-[0.98] transition-transform">
            Browse the Job Board
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-[2rem] text-gray-500 font-bold">
           No applications with the status "{filter}".
        </div>
      ) : (
        <div className="space-y-6 mt-8">
          {visible.map((a) => {
            const open = openId === a._id;
            const history = [...(a.history || [])].reverse();
            return (
              <div key={a._id} className="glass-panel rounded-[2rem] p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow border-white/60 group">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 mb-4">
                  <div className="min-w-0">
                    <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg uppercase tracking-wider mb-3 inline-block shadow-sm">
                      {a.job.jobId}
                    </span>
                    <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white truncate tracking-tight">{a.job.title}</h3>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-bold text-gray-500 dark:text-gray-400 bg-black/5 dark:bg-white/5 w-fit px-4 py-2 rounded-xl border border-black/5 dark:border-white/5">
                      <span className="flex items-center gap-1.5"><FiMapPin className="text-blue-500" size={14}/> {a.job.location}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span className="flex items-center gap-1.5"><FiCalendar className="text-purple-500" size={14}/> Applied {new Date(a.appliedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className={`text-[11px] font-extrabold px-3.5 py-1.5 rounded-lg uppercase tracking-wider border shadow-sm shrink-0 ${STATUS_STYLE[a.status]}`}>{a.status}</span>
                </div>

                {(a.status === 'Interview Scheduled' || a.status === 'Next Round') && (
                  <div className="mt-6 rounded-2xl bg-purple-500/10 border border-purple-500/20 p-5 shadow-inner">
                    <p className="text-[10px] font-extrabold text-purple-700 dark:text-purple-400 uppercase tracking-widest mb-1">Interview Details</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Round {a.roundNo} {a.interviewDate ? `— ${a.interviewDate}` : '— Date will be shared soon'}</p>
                  </div>
                )}

                <div className="mt-6 pt-5 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : a._id)}
                    className="glass-button flex items-center gap-2 text-[11px] font-extrabold text-gray-600 dark:text-gray-300 uppercase tracking-wider px-4 py-2 rounded-xl transition-colors"
                  >
                    {open ? <FiChevronUp size={16}/> : <FiChevronDown size={16}/>} Status Timeline
                  </button>
                  <Link to={`/jobs/${a.job._id}`} className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-wider px-4 py-2">
                    View Job Post
                  </Link>
                </div>

                {open && (
                  <div className="mt-8 bg-black/5 dark:bg-white/5 p-6 rounded-[1.5rem] border border-black/5 dark:border-white/5 shadow-inner">
                    <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-black/5 dark:border-white/5 pb-3 mb-5">Application History</p>
                    <ol className="border-l-2 border-gray-300 dark:border-slate-600 ml-3 space-y-6">
                      {history.map((h, i) => (
                        <li key={i} className="pl-6 relative text-sm">
                          <span className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-blue-600 border-4 border-white dark:border-slate-900 shadow-sm" />
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-md border uppercase tracking-wider shadow-sm ${STATUS_STYLE[h.status]}`}>{h.status}</span>
                            <span className="text-[11px] font-bold text-gray-500">{new Date(h.changedAt).toLocaleString()}</span>
                          </div>
                          {(h.status === 'Interview Scheduled' || h.status === 'Next Round') && (
                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-1">
                              Round {h.roundNo} {h.interviewDate ? `— ${h.interviewDate}` : ''}
                            </p>
                          )}
                          {h.message && (
                            <div className="mt-3 bg-white/60 dark:bg-slate-800/60 p-4 rounded-xl border border-white/50 dark:border-slate-700/50 shadow-sm">
                              <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Message from Admin</p>
                              <p className="text-[13px] text-gray-800 dark:text-gray-200 font-medium italic leading-relaxed">"{h.message}"</p>
                            </div>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default MyApplications;