import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FiDownload, FiArrowLeft, FiFileText, FiChevronDown, FiChevronUp, FiClock, FiUsers, FiBriefcase } from 'react-icons/fi';

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

const inputStyles = "apple-input";

const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const fetchFileBlob = async (fileId) => {
  const res = await axios.get(`${API}/api/files/${fileId}`, { ...authHeaders(), responseType: 'blob' });
  return res.data;
};

const safeName = (s) => String(s || 'candidate').replace(/[^a-z0-9]+/gi, '-');

const AuthImage = ({ fileId, className }) => {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let objectUrl = '';
    let cancelled = false;
    fetchFileBlob(fileId)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => { });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId]);
  return src ? (
    <img src={src} alt="Candidate" className={className} />
  ) : (
    <div className={`${className} bg-black/5 dark:bg-white/5 animate-pulse`} />
  );
};

const CountChips = ({ counts, total }) => (
  <div className="flex flex-wrap gap-2">
    <span className="text-[10px] font-extrabold px-3 py-1.5 rounded-lg bg-gray-800 text-white dark:bg-white dark:text-gray-900 shadow-sm uppercase tracking-wider">
      Total {total}
    </span>
    {STATUSES.map((s) => (
      <span key={s} className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider border shadow-sm ${STATUS_STYLE[s]}`}>
        {s} {counts[s] || 0}
      </span>
    ))}
  </div>
);

const OverallTotals = ({ rows }) => {
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  let total = 0;
  rows.forEach((r) => {
    total += r.total;
    STATUSES.forEach((s) => {
      counts[s] += r.counts[s] || 0;
    });
  });
  return (
    <div className="glass-panel p-6 md:p-8 rounded-[2rem] grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
      <div className="bg-white/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm flex flex-col justify-center">
        <p className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">{total}</p>
        <span className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">
          Total Apps
        </span>
      </div>
      {STATUSES.map((s) => (
        <div key={s} className="bg-white/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm flex flex-col justify-center">
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{counts[s]}</p>
          <span className={`inline-block mt-2 text-[9px] font-extrabold px-2 py-1 rounded-md uppercase tracking-wider w-fit border ${STATUS_STYLE[s]}`}>{s}</span>
        </div>
      ))}
    </div>
  );
};

const HistoryTimeline = ({ history, createdAt }) => {
  const items = (history && history.length
    ? history
    : [{ status: 'Applied', roundNo: 1, changedBy: 'Student', changedAt: createdAt }]
  )
    .slice()
    .reverse();

  return (
    <ol className="mt-6 border-l-2 border-gray-200 dark:border-slate-700 ml-4 space-y-6">
      {items.map((h, i) => (
        <li key={i} className="pl-6 relative text-sm">
          <span className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-blue-600 border-4 border-white dark:border-slate-900 shadow-sm" />
          <div className="flex flex-wrap items-center gap-3">
            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider border shadow-sm ${STATUS_STYLE[h.status]}`}>{h.status}</span>
            <span className="text-xs font-bold text-gray-400">{new Date(h.changedAt).toLocaleString()}</span>
            <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider bg-black/5 dark:bg-white/5 px-2 py-1 rounded">by {h.changedBy || 'Admin'}</span>
          </div>
          {(h.status === 'Interview Scheduled' || h.status === 'Next Round') && (
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-2 bg-black/5 dark:bg-white/5 p-2 rounded-lg border border-black/5 dark:border-white/5 inline-block">
              Round {h.roundNo}
              {h.interviewDate ? ` • ${h.interviewDate}` : ''}
            </p>
          )}
          {h.message && <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-2 bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-white/50 dark:border-slate-700/50 shadow-sm italic leading-relaxed">"{h.message}"</p>}
        </li>
      ))}
    </ol>
  );
};

const ApplicantCard = ({ app, onSaved }) => {
  const [status, setStatus] = useState(app.status);
  const [roundNo, setRoundNo] = useState(app.roundNo);
  const [interviewDate, setInterviewDate] = useState(app.interviewDate || '');
  const [remarks, setRemarks] = useState(app.remarks || '');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const s = app.student || {};

  const save = async () => {
    setSaving(true);
    setNote('');
    try {
      const res = await axios.put(
        `${API}/api/applications/${app._id}/status`,
        { status, roundNo, interviewDate, remarks, message },
        authHeaders()
      );
      setNote(res.data.notified ? 'Saved. Student notified via email.' : 'Saved. No changes detected, email skipped.');
      setMessage('');
      onSaved();
    } catch (err) {
      setNote(err.response?.data?.message || 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  const downloadResume = async () => {
    try {
      saveBlob(await fetchFileBlob(app.resumeFileId), `${safeName(s.name)}-resume.pdf`);
    } catch {
      alert('Could not download the resume');
    }
  };

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-[2rem] shadow-sm flex flex-col lg:flex-row gap-8 transition-all hover:shadow-md">
      <div className="flex flex-col sm:flex-row gap-6 lg:w-2/3">
        <AuthImage fileId={app.photoFileId} className="w-28 h-32 object-cover rounded-[1.5rem] border-2 border-white/60 shadow-sm shrink-0 bg-white" />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h4 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">{s.name || 'Deleted user'}</h4>
            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider border shadow-sm ${STATUS_STYLE[app.status]}`}>{app.status}</span>
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 break-all mb-3">{app.email}</p>

          <div className="bg-black/5 dark:bg-white/5 p-4 rounded-[1.5rem] border border-black/5 dark:border-white/5 space-y-1.5 mb-4 shadow-inner text-[13px] font-medium text-gray-700 dark:text-gray-300">
            <p><strong>Contact:</strong> {app.phone} <span className="mx-2 text-gray-300">|</span> <strong>Parent:</strong> {app.parentPhone}</p>
            <p>
              {s.highestQualification || '-'} ({s.passingYear || '-'}), {s.percentage ?? '-'}%, backlogs {s.backlogs ?? 0}, gap {s.educationGap ?? 0} yrs
            </p>
            {s.skillsAcquired && <p className="text-xs"><strong>Skills:</strong> {s.skillsAcquired}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a href={app.linkedin} target="_blank" rel="noopener noreferrer" className="glass-button px-4 py-2 rounded-xl text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:text-white hover:bg-blue-600 transition-all">LinkedIn</a>
            <a href={app.github} target="_blank" rel="noopener noreferrer" className="glass-button px-4 py-2 rounded-xl text-xs font-extrabold text-gray-700 dark:text-gray-300 hover:text-white hover:bg-gray-800 transition-all">GitHub</a>
            <button type="button" onClick={downloadResume} className="glass-button px-4 py-2 rounded-xl text-xs font-extrabold text-teal-600 dark:text-teal-400 hover:text-white hover:bg-teal-600 transition-all flex items-center gap-1.5">
              <FiFileText size={14} /> Resume
            </button>
            <button type="button" onClick={() => setShowHistory(!showHistory)} className="glass-button px-4 py-2 rounded-xl text-xs font-extrabold text-purple-600 dark:text-purple-400 hover:text-white hover:bg-purple-600 transition-all flex items-center gap-1.5 ml-auto">
              <FiClock size={14} /> {showHistory ? 'Hide History' : 'View History'}
            </button>
          </div>
        </div>
      </div>

      <div className="lg:w-1/3 bg-white/40 dark:bg-slate-900/40 p-6 rounded-[1.5rem] border border-white/50 dark:border-slate-700/50 shadow-sm flex flex-col gap-4">
        <div>
          <label className="block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputStyles} cursor-pointer`}>
            {STATUSES.map((st) => <option key={st}>{st}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Round</label>
            <input type="number" min="1" max="20" value={roundNo} onChange={(e) => setRoundNo(e.target.value)} className={inputStyles} />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Date</label>
            <input type="text" placeholder="e.g. 15 Oct" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} className={inputStyles} />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Message (Emailed)</label>
          <input type="text" placeholder="Optional message..." value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} className={inputStyles} />
        </div>

        <div>
          <label className="block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Private Remarks (Admins)</label>
          <input type="text" placeholder="Internal notes..." value={remarks} onChange={(e) => setRemarks(e.target.value)} className={inputStyles} />
        </div>

        <button type="button" onClick={save} disabled={saving} className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white font-extrabold py-3.5 rounded-xl text-sm shadow-lg shadow-blue-500/30 transition-all hover:scale-[0.98]">
          {saving ? 'Saving...' : 'Save & Notify'}
        </button>
        {note && <p className="text-[11px] font-bold text-gray-600 dark:text-gray-300 text-center bg-black/5 dark:bg-white/5 p-2 rounded-lg">{note}</p>}
      </div>

      {showHistory && (
        <div className="mt-6 lg:col-span-2">
          <HistoryTimeline history={app.history} createdAt={app.createdAt} />
        </div>
      )}
    </div>
  );
};

const AdminApplications = () => {
  const [view, setView] = useState('jobs'); // 'jobs' | 'students'
  const [summary, setSummary] = useState({ byJob: [], byStudent: [] });
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [expandedStudent, setExpandedStudent] = useState(null);

  const loadSummary = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/applications/summary`, authHeaders());
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to load applications summary', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const loadApplicants = useCallback(async (jobId) => {
    try {
      const res = await axios.get(`${API}/api/jobs/${jobId}/applications`, authHeaders());
      setApplicants(res.data);
    } catch (err) { alert('Could not load the applicants'); }
  }, []);

  const openJob = (jobId) => {
    setSelectedJobId(jobId);
    setApplicants([]);
    loadApplicants(jobId);
  };

  const downloadCsv = async (jobId, fileName) => {
    try {
      const res = await axios.get(`${API}/api/applications/export`, {
        ...authHeaders(),
        params: jobId ? { jobId } : {},
        responseType: 'blob'
      });
      saveBlob(res.data, fileName);
    } catch { alert('Download failed'); }
  };

  const afterSave = () => {
    loadSummary();
    if (selectedJobId) loadApplicants(selectedJobId);
  };

  if (loading) return <div className="h-[50vh] flex items-center justify-center text-lg font-bold text-gray-500">Loading applications...</div>;

  const selectedRow = selectedJobId ? summary.byJob.find((r) => r.job._id === selectedJobId) : null;

  if (selectedRow) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <button type="button" onClick={() => setSelectedJobId(null)} className="flex items-center gap-2 text-sm font-extrabold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md px-4 py-2 rounded-xl w-fit shadow-sm border border-white/50 dark:border-slate-700/50 transition-colors">
          <FiArrowLeft size={16} /> Back to all jobs
        </button>

        <div className="glass-panel p-8 rounded-[2rem] space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-black/5 dark:border-white/5 pb-5">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{selectedRow.job.title}</h2>
              <p className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg w-fit mt-3 shadow-sm">{selectedRow.job.jobId}</p>
            </div>
            <button
              type="button"
              onClick={() => downloadCsv(selectedRow.job._id, `${safeName(selectedRow.job.jobId)}-candidates.csv`)}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-3 rounded-xl font-extrabold text-sm shadow-lg shadow-green-500/30 hover:scale-[0.98] transition-transform"
            >
              <FiDownload size={16} /> Download (CSV)
            </button>
          </div>
          <CountChips counts={selectedRow.counts} total={selectedRow.total} />
        </div>

        {applicants.length === 0 ? (
          <div className="glass-panel p-16 rounded-[2rem] text-center text-gray-500 dark:text-gray-400 font-medium text-lg">No applications for this job yet.</div>
        ) : (
          <div className="space-y-6">
            {applicants.map((a) => <ApplicantCard key={a._id} app={a} onSaved={afterSave} />)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl backdrop-blur-md border border-blue-500/20 shadow-sm">
          <FiUsers className="text-blue-600 dark:text-blue-400" size={26} />
        </div>
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Job Applications</h2>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Track and manage student applications globally.</p>
        </div>
      </div>

      <OverallTotals rows={summary.byJob} />

      <div className="glass-panel rounded-[2rem] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex bg-black/5 dark:bg-white/5 p-1.5 rounded-2xl shadow-inner border border-black/5 dark:border-white/5 w-fit">
          {[['jobs', 'By Job'], ['students', 'By Student']].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={`px-6 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-300 ${view === key
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-white/50 dark:border-slate-700/50 backdrop-blur-md'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              <FiBriefcase className="inline mr-2 opacity-70" /> {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => downloadCsv(null, 'all-applications.csv')}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-extrabold text-sm shadow-lg shadow-green-500/30 hover:scale-[0.98] transition-transform w-full md:w-auto"
        >
          <FiDownload size={16} /> Download All (CSV)
        </button>
      </div>

      {view === 'jobs' && (
        <div className="glass-panel rounded-[2rem] overflow-hidden">
          {summary.byJob.length === 0 ? (
            <p className="p-16 text-center text-gray-500 dark:text-gray-400 text-lg font-medium">No jobs posted yet.</p>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/5 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="p-5">Job</th>
                    <th className="p-5 text-center">Applied</th>
                    {STATUSES.slice(1).map((s) => <th key={s} className="p-5 text-center">{s}</th>)}
                    <th className="p-5 text-center">Total</th>
                    <th className="p-5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {summary.byJob.map((r) => (
                    <tr key={r.job._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                      <td className="p-5">
                        <div className="font-extrabold text-gray-900 dark:text-white text-base">{r.job.title}</div>
                        <div className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase mt-1 tracking-wider bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded w-fit shadow-sm">{r.job.jobId}</div>
                      </td>
                      <td className="p-5 text-center font-bold text-gray-700 dark:text-gray-300">{r.counts.Applied}</td>
                      {STATUSES.slice(1).map((s) => (
                        <td key={s} className="p-5 text-center font-bold text-gray-700 dark:text-gray-300">{r.counts[s]}</td>
                      ))}
                      <td className="p-5 text-center font-extrabold text-lg text-gray-900 dark:text-white">{r.total}</td>
                      <td className="p-5 text-right">
                        <button type="button" onClick={() => openJob(r.job._id)} className="glass-button text-blue-600 dark:text-blue-400 font-extrabold text-xs px-4 py-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 uppercase tracking-wider">
                          View Applicants
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {view === 'students' && (
        <div className="space-y-6">
          {summary.byStudent.length === 0 ? (
            <div className="glass-panel p-16 text-center text-gray-500 dark:text-gray-400 text-lg font-medium rounded-[2rem]">No student has applied yet.</div>
          ) : (
            summary.byStudent.map((r) => {
              const open = expandedStudent === r.student._id;
              return (
                <div key={r.student._id} className="glass-panel rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow">
                  <button
                    type="button"
                    onClick={() => setExpandedStudent(open ? null : r.student._id)}
                    className="w-full flex flex-col md:flex-row md:items-center justify-between gap-5 text-left group"
                  >
                    <div>
                      <p className="font-extrabold text-xl text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{r.student.name}</p>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{r.student.email}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <CountChips counts={r.counts} total={r.total} />
                      <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 transition-transform duration-300">
                        {open ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                      </div>
                    </div>
                  </button>

                  {open && (
                    <ul className="mt-6 pt-2 border-t border-black/5 dark:border-white/5 divide-y divide-black/5 dark:divide-white/5 text-sm">
                      {r.applications.map((a, i) => (
                        <li key={i} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-black/5 dark:hover:bg-white/5 px-4 -mx-4 rounded-xl transition-colors">
                          <div>
                            <span className="font-extrabold text-gray-900 dark:text-gray-100 text-base block mb-1">
                              {a.title}
                            </span>
                            <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">{a.jobId}</span>
                          </div>
                          <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider border shadow-sm shrink-0 ${STATUS_STYLE[a.status]}`}>{a.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default AdminApplications;