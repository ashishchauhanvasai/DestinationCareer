// Save as: src/components/AdminApplications.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FiDownload, FiArrowLeft, FiFileText, FiChevronDown, FiChevronUp } from 'react-icons/fi';

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

const inputStyles =
  'w-full p-2 border rounded text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors';

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

// <img> tags cannot send the login token, so the photo is fetched with axios and shown from a blob.
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
      .catch(() => {});
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId]);
  return src ? (
    <img src={src} alt="Candidate" className={className} />
  ) : (
    <div className={`${className} bg-gray-200 dark:bg-slate-700`} />
  );
};

const CountChips = ({ counts, total }) => (
  <div className="flex flex-wrap gap-2">
    <span className="text-xs font-bold px-2 py-1 rounded bg-gray-800 text-white dark:bg-white dark:text-gray-900">
      Total {total}
    </span>
    {STATUSES.map((s) => (
      <span key={s} className={`text-xs font-bold px-2 py-1 rounded ${STATUS_STYLE[s]}`}>
        {s} {counts[s] || 0}
      </span>
    ))}
  </div>
);

const ApplicantCard = ({ app, onSaved }) => {
  const [status, setStatus] = useState(app.status);
  const [roundNo, setRoundNo] = useState(app.roundNo);
  const [interviewDate, setInterviewDate] = useState(app.interviewDate || '');
  const [remarks, setRemarks] = useState(app.remarks || '');
  const [saving, setSaving] = useState(false);
  const s = app.student || {};

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/api/applications/${app._id}/status`, { status, roundNo, interviewDate, remarks }, authHeaders());
      onSaved();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not save changes');
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
    <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-4 flex flex-col lg:flex-row gap-4">
      <AuthImage fileId={app.photoFileId} className="w-24 h-28 object-cover rounded border dark:border-slate-600 shrink-0" />

      <div className="flex-1 min-w-0 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-bold text-gray-900 dark:text-white">{s.name || 'Deleted user'}</h4>
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${STATUS_STYLE[app.status]}`}>{app.status}</span>
        </div>
        <p className="text-gray-600 dark:text-gray-300 break-all">{app.email}</p>
        <p className="text-gray-600 dark:text-gray-300">
          Contact: {app.phone} | Parent: {app.parentPhone}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {s.highestQualification || '-'} ({s.passingYear || '-'}), {s.percentage ?? '-'}%, backlogs {s.backlogs ?? 0}, gap {s.educationGap ?? 0} yrs
        </p>
        {s.skillsAcquired && <p className="text-xs text-gray-500 dark:text-gray-400">Skills: {s.skillsAcquired}</p>}
        <p className="text-xs text-gray-400 mt-1">Applied on {new Date(app.createdAt).toLocaleDateString()}</p>

        <div className="flex flex-wrap gap-3 mt-3">
          <a href={app.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">LinkedIn</a>
          <a href={app.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">GitHub</a>
          <button type="button" onClick={downloadResume} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold hover:underline">
            <FiFileText /> Resume
          </button>
        </div>
      </div>

      <div className="lg:w-72 space-y-2 shrink-0">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputStyles}>
          {STATUSES.map((st) => (
            <option key={st}>{st}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <input type="number" min="1" max="20" value={roundNo} onChange={(e) => setRoundNo(e.target.value)} title="Round number" className={`${inputStyles} w-20`} />
          <input type="text" placeholder="Interview date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} className={inputStyles} />
        </div>
        <input type="text" placeholder="Remarks (only admins see this)" value={remarks} onChange={(e) => setRemarks(e.target.value)} className={inputStyles} />
        <button type="button" onClick={save} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-2 rounded text-sm">
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
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

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const loadApplicants = useCallback(async (jobId) => {
    try {
      const res = await axios.get(`${API}/api/jobs/${jobId}/applications`, authHeaders());
      setApplicants(res.data);
    } catch (err) {
      alert('Could not load the applicants');
    }
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
    } catch {
      alert('Download failed');
    }
  };

  const afterSave = () => {
    loadSummary();
    if (selectedJobId) loadApplicants(selectedJobId);
  };

  if (loading) return <p className="p-8 text-center text-gray-500 dark:text-gray-400">Loading applications...</p>;

  const selectedRow = selectedJobId ? summary.byJob.find((r) => r.job._id === selectedJobId) : null;

  // ----- one job: list of applicants -----
  if (selectedRow) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setSelectedJobId(null)} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600">
          <FiArrowLeft /> Back to all jobs
        </button>

        <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl p-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedRow.job.title}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{selectedRow.job.jobId}</p>
            </div>
            <button
              type="button"
              onClick={() => downloadCsv(selectedRow.job._id, `${safeName(selectedRow.job.jobId)}-candidates.csv`)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm"
            >
              <FiDownload /> Download candidates (CSV)
            </button>
          </div>
          <CountChips counts={selectedRow.counts} total={selectedRow.total} />
        </div>

        {applicants.length === 0 ? (
          <p className="p-8 text-center text-gray-500 dark:text-gray-400">No applications for this job yet.</p>
        ) : (
          applicants.map((a) => <ApplicantCard key={a._id} app={a} onSaved={afterSave} />)
        )}
      </div>
    );
  }

  // ----- overview -----
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {[['jobs', 'By job'], ['students', 'By student']].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={`px-4 py-2 rounded-lg text-sm font-bold ${
                view === key ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border dark:border-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => downloadCsv(null, 'all-applications.csv')}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm"
        >
          <FiDownload /> Download all (CSV)
        </button>
      </div>

      {view === 'jobs' && (
        <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl overflow-x-auto">
          {summary.byJob.length === 0 ? (
            <p className="p-8 text-center text-gray-500 dark:text-gray-400">No jobs posted yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500 dark:text-gray-400 border-b dark:border-slate-700">
                <tr>
                  <th className="p-4">Job</th>
                  <th className="p-4 text-center">Applied</th>
                  {STATUSES.slice(1).map((s) => (
                    <th key={s} className="p-4 text-center">{s}</th>
                  ))}
                  <th className="p-4 text-center">Total</th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {summary.byJob.map((r) => (
                  <tr key={r.job._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="p-4">
                      <div className="font-bold text-gray-900 dark:text-white">{r.job.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{r.job.jobId}</div>
                    </td>
                    <td className="p-4 text-center">{r.counts.Applied}</td>
                    {STATUSES.slice(1).map((s) => (
                      <td key={s} className="p-4 text-center">{r.counts[s]}</td>
                    ))}
                    <td className="p-4 text-center font-bold">{r.total}</td>
                    <td className="p-4 text-right">
                      <button type="button" onClick={() => openJob(r.job._id)} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                        View applicants
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {view === 'students' && (
        <div className="space-y-3">
          {summary.byStudent.length === 0 ? (
            <p className="p-8 text-center text-gray-500 dark:text-gray-400">No student has applied yet.</p>
          ) : (
            summary.byStudent.map((r) => {
              const open = expandedStudent === r.student._id;
              return (
                <div key={r.student._id} className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-4">
                  <button
                    type="button"
                    onClick={() => setExpandedStudent(open ? null : r.student._id)}
                    className="w-full flex items-center justify-between gap-3 text-left"
                  >
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{r.student.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{r.student.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <CountChips counts={r.counts} total={r.total} />
                      {open ? <FiChevronUp /> : <FiChevronDown />}
                    </div>
                  </button>

                  {open && (
                    <ul className="mt-4 divide-y dark:divide-slate-700 text-sm">
                      {r.applications.map((a, i) => (
                        <li key={i} className="py-2 flex items-center justify-between gap-3">
                          <span className="text-gray-800 dark:text-gray-200">
                            {a.title} <span className="text-xs text-gray-400">({a.jobId})</span>
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${STATUS_STYLE[a.status]}`}>{a.status}</span>
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