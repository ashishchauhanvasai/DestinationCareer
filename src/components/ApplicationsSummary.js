// Save as: src/components/ApplicationsSummary.js   (NEW file)
// Small widget for the student Dashboard. It loads its own data and shows nothing
// until the student has applied for at least one job.
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FiBriefcase } from 'react-icons/fi';

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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiBriefcase className="text-blue-600 dark:text-blue-400" size={24} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Job Applications</h2>
        </div>
        <Link to="/my-applications" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="rounded-xl border p-4 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.total}</p>
          <span className="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded bg-gray-800 text-white dark:bg-white dark:text-gray-900">
            Total
          </span>
        </div>
        {STATUSES.map((s) => (
          <div key={s} className="rounded-xl border p-4 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.counts[s] || 0}</p>
            <span className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded ${STATUS_STYLE[s]}`}>{s}</span>
          </div>
        ))}
      </div>

      {interviews.length > 0 && (
        <div className="mt-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4">
          <p className="font-bold text-purple-800 dark:text-purple-200 text-sm mb-2">Upcoming interviews</p>
          <ul className="space-y-1 text-sm text-purple-900 dark:text-purple-100">
            {interviews.map((a) => (
              <li key={a._id}>
                {a.job.title}: round {a.roundNo}
                {a.interviewDate ? `, ${a.interviewDate}` : ', date will be shared soon'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default ApplicationsSummary;