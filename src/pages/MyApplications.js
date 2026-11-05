import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FiMapPin, FiCalendar, FiChevronDown, FiChevronUp, FiBriefcase } from 'react-icons/fi';

const API = process.env.REACT_APP_API_URL;
const STATUSES = ['Applied', 'Shortlisted', 'Interview Scheduled', 'Next Round', 'Selected', 'Rejected'];

const STATUS_STYLE = {
  Applied: 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700',
  Shortlisted: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  'Interview Scheduled': 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  'Next Round': 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  Selected: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  Rejected: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
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

  if (loading) return <div className="h-[50vh] flex items-center justify-center font-bold text-gray-500 animate-pulse text-lg">Loading your applications...</div>;
  if (!data) return <div className="h-[50vh] flex items-center justify-center font-bold text-red-500 text-lg">Could not load your applications. Try again later.</div>;
  
  const visible = filter === 'All' ? data.applications : data.applications.filter((a) => a.status === filter);

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-8 px-4 sm:px-6 animate-fade-in pb-12">
      
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3.5 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl border border-blue-500/20 shadow-sm shrink-0">
          <FiBriefcase className="text-blue-600 dark:text-blue-400" size={28} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">My Applications</h1>
          <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mt-1 opacity-90">
            Track the status of every job you've applied for.
          </p>
        </div>
      </div>

      {/* Counts (Solid Panels) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <button
          type="button"
          onClick={() => setFilter('All')}
          className={`glass-panel p-5 rounded-[1.5rem] text-center hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center border bg-white dark:bg-slate-900 ${
            filter === 'All' ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-gray-200 dark:border-slate-700 shadow-sm'
          }`}
          >
          <p className="text-3xl font-black text-gray-900 dark:text-white mb-2 leading-none">{data.total}</p>
          <span className="inline-block text-[10px] font-extrabold px-3 py-1 rounded-md bg-gray-900 text-white dark:bg-white dark:text-gray-900 uppercase tracking-widest shadow-sm">
            Total
          </span>
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(filter === s ? 'All' : s)}
            className={`glass-panel p-5 rounded-[1.5rem] text-center hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center border bg-white dark:bg-slate-900 ${
              filter === s ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-gray-200 dark:border-slate-700 shadow-sm'
            }`}
          >
            <p className="text-3xl font-black text-gray-900 dark:text-white mb-2.5 leading-none">{data.counts[s] || 0}</p>
            <span className={`inline-block text-[9px] font-extrabold px-2.5 py-1 rounded-md border uppercase tracking-wider shadow-sm ${STATUS_STYLE[s]}`}>{s}</span>
          </button>
        ))}
      </div>

      {/* List */}
      {data.total === 0 ? (
        <div className="glass-panel p-20 text-center rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col items-center justify-center mt-8">
          <p className="text-gray-500 dark:text-gray-400 font-bold text-xl mb-6">You have not applied for any job yet.</p>
          <Link to="/jobs" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-extrabold text-[15px] shadow-lg shadow-blue-500/30 hover:scale-[0.98] transition-transform">
            Browse the Job Board
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="glass-panel p-16 text-center rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-500 font-bold text-lg">
           No applications with the status "{filter}".
        </div>
      ) : (
        <div className="space-y-6 mt-8">
          {visible.map((a) => {
            const open = openId === a._id;
            const history = [...(a.history || [])].reverse();
            return (
              <div key={a._id} className="glass-panel rounded-[2.5rem] p-6 md:p-8 shadow-sm hover:shadow-lg transition-shadow border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 group">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 mb-5">
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-lg uppercase tracking-wider mb-4 inline-block shadow-sm">
                      {a.job.jobId}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white truncate tracking-tight leading-tight">{a.job.title}</h3>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-5 text-[11px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800 w-fit px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                      <span className="flex items-center gap-1.5"><FiMapPin className="text-blue-500" size={14}/> {a.job.location}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                      <span className="flex items-center gap-1.5"><FiCalendar className="text-purple-500" size={14}/> Applied {new Date(a.appliedAt).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})}</span>
                    </div>
                  </div>
                  <span className={`text-[11px] font-extrabold px-4 py-2 rounded-lg uppercase tracking-wider border shadow-sm shrink-0 w-fit ${STATUS_STYLE[a.status]}`}>{a.status}</span>
                </div>

                {(a.status === 'Interview Scheduled' || a.status === 'Next Round') && (
                  <div className="mt-6 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-5 shadow-sm">
                    <p className="text-[10px] font-extrabold text-purple-700 dark:text-purple-400 uppercase tracking-widest mb-1.5">Interview Details</p>
                    <p className="text-[15px] font-black text-gray-900 dark:text-white">Round {a.roundNo} {a.interviewDate ? `— ${a.interviewDate}` : '— Date will be shared soon'}</p>
                  </div>
                )}

                <div className="mt-6 pt-5 border-t border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : a._id)}
                    className="glass-button flex items-center justify-center sm:justify-start gap-2 text-[11px] font-extrabold text-gray-600 dark:text-gray-300 uppercase tracking-wider px-5 py-3 rounded-xl transition-all border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 shadow-sm"
                  >
                    {open ? <FiChevronUp size={16}/> : <FiChevronDown size={16}/>} Status Timeline
                  </button>
                  <Link to={`/jobs/${a.job._id}`} className="glass-button flex items-center justify-center sm:justify-start text-[11px] font-extrabold text-blue-600 dark:text-blue-400 hover:text-white hover:bg-blue-600 uppercase tracking-wider px-5 py-3 rounded-xl transition-all border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 shadow-sm">
                    View Job Post
                  </Link>
                </div>

                {open && (
                  <div className="mt-6 bg-gray-50 dark:bg-slate-800/50 p-6 md:p-8 rounded-[2rem] border border-gray-200 dark:border-slate-700 shadow-inner">
                    <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-200 dark:border-slate-700 pb-3 mb-6">Application History</p>
                    <ol className="border-l-2 border-gray-300 dark:border-slate-600 ml-3 space-y-6">
                      {history.map((h, i) => (
                        <li key={i} className="pl-6 relative text-sm">
                          <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-600 border-4 border-gray-50 dark:border-slate-800 shadow-sm" />
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-md border uppercase tracking-wider shadow-sm ${STATUS_STYLE[h.status]}`}>{h.status}</span>
                            <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">{new Date(h.changedAt).toLocaleString('en-IN', {day:'numeric', month:'short', year:'numeric', hour:'numeric', minute:'numeric', hour12:true})}</span>
                          </div>
                          {(h.status === 'Interview Scheduled' || h.status === 'Next Round') && (
                            <p className="text-[13px] font-black text-gray-800 dark:text-gray-200 mt-2">
                              Round {h.roundNo} {h.interviewDate ? `— ${h.interviewDate}` : ''}
                            </p>
                          )}
                          {h.message && (
                            <div className="mt-3 bg-white dark:bg-slate-900 p-4 md:p-5 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-sm">
                              <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Message from Admin</p>
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