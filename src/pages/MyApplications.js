// Save as: src/pages/MyApplications.js   (NEW file)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FiMapPin, FiCalendar, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const API = process.env.REACT_APP_API_URL;
const STATUSES = ['Applied', 'Shortlisted', 'Interview Scheduled', 'Next Round', 'Selected', 'Rejected'];

const STATUS_STYLE = {
  Applied: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-200',
  Shortlisted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'Interview Scheduled': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'Next Round': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  Selected: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
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

  if (loading) return <p className="p-8 text-center text-gray-500 dark:text-gray-400">Loading your applications...</p>;
  if (!data) return <p className="p-8 text-center text-red-600">Could not load your applications. Try again later.</p>;

  const visible = filter === 'All' ? data.applications : data.applications.filter((a) => a.status === filter);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Applications</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Every job you applied for and where it stands. Select a box to filter the list.
        </p>
      </div>

      {/* Counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <button
          type="button"
          onClick={() => setFilter('All')}
          className={`rounded-xl border p-4 text-left bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 ${
            filter === 'All' ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.total}</p>
          <span className="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded bg-gray-800 text-white dark:bg-white dark:text-gray-900">
            Total
          </span>
        </button>

        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(filter === s ? 'All' : s)}
            className={`rounded-xl border p-4 text-left bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 ${
              filter === s ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.counts[s] || 0}</p>
            <span className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded ${STATUS_STYLE[s]}`}>{s}</span>
          </button>
        ))}
      </div>

      {/* List */}
      {data.total === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700">
          <p className="text-gray-500 dark:text-gray-400 font-medium">You have not applied for any job yet.</p>
          <Link to="/jobs" className="inline-block mt-4 text-blue-600 dark:text-blue-400 font-bold hover:underline">
            Browse the job board
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <p className="p-8 text-center text-gray-500 dark:text-gray-400">No applications with the status "{filter}".</p>
      ) : (
        <div className="space-y-4">
          {visible.map((a) => {
            const open = openId === a._id;
            const history = [...(a.history || [])].reverse();
            return (
              <div key={a._id} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{a.job.jobId}</p>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{a.job.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1"><FiMapPin /> {a.job.location}</span>
                      <span className="flex items-center gap-1"><FiCalendar /> Applied {new Date(a.appliedAt).toLocaleDateString()}</span>
                    </p>
                  </div>
                  <span className={`text-sm font-bold px-3 py-1 rounded ${STATUS_STYLE[a.status]}`}>{a.status}</span>
                </div>

                {(a.status === 'Interview Scheduled' || a.status === 'Next Round') && (
                  <div className="mt-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-3 text-sm text-purple-800 dark:text-purple-200">
                    Round {a.roundNo}
                    {a.interviewDate ? `, ${a.interviewDate}` : ', date will be shared soon'}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : a._id)}
                    className="flex items-center gap-1 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {open ? <FiChevronUp /> : <FiChevronDown />} Status timeline
                  </button>
                  <Link to={`/jobs/${a.job._id}`} className="text-sm font-bold text-gray-500 hover:text-blue-600">
                    View job
                  </Link>
                </div>

                {open && (
                  <ol className="mt-4 border-l-2 border-gray-200 dark:border-slate-600 ml-2 space-y-4">
                    {history.map((h, i) => (
                      <li key={i} className="pl-4 relative">
                        <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-blue-600" />
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${STATUS_STYLE[h.status]}`}>{h.status}</span>
                          <span className="text-xs text-gray-400">{new Date(h.changedAt).toLocaleString()}</span>
                        </div>
                        {(h.status === 'Interview Scheduled' || h.status === 'Next Round') && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            Round {h.roundNo}
                            {h.interviewDate ? `, ${h.interviewDate}` : ''}
                          </p>
                        )}
                        {h.message && <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">{h.message}</p>}
                      </li>
                    ))}
                  </ol>
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