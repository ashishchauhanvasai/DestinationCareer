import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiX } from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const AdminAttendance = () => {
  const [sessions, setSessions] = useState([]);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    axios.get(`${API}/attendance/sessions`, cfg()).then((r) => setSessions(r.data)).catch((e) => console.error(e));
  }, []);

  const openStudents = async (session) => {
    try { setViewing({ session, students: (await axios.get(`${API}/attendance/sessions/${session._id}/students`, cfg())).data }); }
    catch { alert('Could not load attendees'); }
  };

  return (
    <div className="glass-panel rounded-[2rem] overflow-hidden">
      <div className="p-6 bg-black/5 dark:bg-white/5 font-extrabold border-b border-black/5 dark:border-white/5 text-gray-900 dark:text-white text-lg tracking-tight">
        Class Sessions ({sessions.length})
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-black/5 dark:bg-white/5 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-black/5 dark:border-white/5">
            <tr>
              <th className="p-5">Batch</th>
              <th className="p-5">Trainer</th>
              <th className="p-5">Date</th>
              <th className="p-5">Check-in</th>
              <th className="p-5">Check-out</th>
              <th className="p-5">Status</th>
              <th className="p-5">Attended</th>
              <th className="p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5">
            {sessions.length === 0 && <tr><td colSpan="8" className="p-10 text-center text-gray-500 dark:text-gray-400 font-medium text-lg">No classes recorded yet.</td></tr>}
            {sessions.map((s) => (
              <tr key={s._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                <td className="p-5 font-extrabold text-gray-900 dark:text-white">
                  {s.batch?.subject}<br />
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded uppercase tracking-wider shadow-sm mt-1 inline-block">
                    {s.batch?.batchCode}
                  </span>
                </td>
                <td className="p-5 font-semibold text-gray-700 dark:text-gray-300">{s.trainer?.name}</td>
                <td className="p-5 font-extrabold text-gray-800 dark:text-gray-200">{s.dateKey}</td>
                <td className="p-5 text-gray-600 dark:text-gray-400">{new Date(s.checkInTime).toLocaleTimeString()}</td>
                <td className="p-5 text-gray-600 dark:text-gray-400">{s.checkOutTime ? new Date(s.checkOutTime).toLocaleTimeString() : '—'}</td>
                <td className="p-5">
                  <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider border shadow-sm ${s.status === 'open' ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700'}`}>
                    {s.status}
                  </span>
                </td>
                <td className="p-5 font-extrabold text-lg text-gray-900 dark:text-white">{s.attendedCount}</td>
                <td className="p-5 text-right">
                  <button onClick={() => openStudents(s)} className="glass-button text-blue-600 dark:text-blue-400 font-extrabold text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewing && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewing(null)}>
          <div className="glass-panel p-8 rounded-[2rem] max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl relative custom-scrollbar" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5 border-b border-black/5 dark:border-white/5 pb-4">
              <p className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight">{viewing.session.batch?.subject} <span className="text-gray-400 font-medium text-base block mt-0.5">{viewing.session.dateKey}</span></p>
              <button onClick={() => setViewing(null)} className="p-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full transition-colors"><FiX size={20} className="text-gray-500 dark:text-gray-300" /></button>
            </div>

            {viewing.students.length === 0 ? <p className="text-sm font-medium text-gray-500 dark:text-gray-400 py-6 text-center">No students marked attendance.</p> : (
              <div className="space-y-2">
                {viewing.students.map((s, i) => (
                  <div key={i} className="p-4 flex justify-between items-center text-sm bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
                    <div>
                      <span className="font-extrabold text-gray-900 dark:text-white block mb-0.5">{s.name}</span>
                      <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{s.email}</span>
                    </div>
                    <span className="text-xs font-extrabold bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg shadow-sm">
                      {new Date(s.markedAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAttendance;