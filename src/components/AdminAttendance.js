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
    <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
      <div className="p-4 bg-gray-50 font-bold border-b">Class Sessions ({sessions.length})</div>
      <table className="w-full text-left text-sm">
        <thead className="text-gray-500 border-b">
          <tr><th className="p-3">Batch</th><th className="p-3">Trainer</th><th className="p-3">Date</th><th className="p-3">Check-in</th><th className="p-3">Check-out</th><th className="p-3">Status</th><th className="p-3">Attended</th><th className="p-3"></th></tr>
        </thead>
        <tbody className="divide-y">
          {sessions.length === 0 && <tr><td colSpan="8" className="p-8 text-center text-gray-500">No classes recorded yet.</td></tr>}
          {sessions.map((s) => (
            <tr key={s._id}>
              <td className="p-3 font-semibold">{s.batch?.subject}<br /><span className="text-xs text-gray-400">{s.batch?.batchCode}</span></td>
              <td className="p-3">{s.trainer?.name}</td>
              <td className="p-3">{s.dateKey}</td>
              <td className="p-3">{new Date(s.checkInTime).toLocaleTimeString()}</td>
              <td className="p-3">{s.checkOutTime ? new Date(s.checkOutTime).toLocaleTimeString() : '—'}</td>
              <td className="p-3"><span className={`text-xs font-bold px-2 py-0.5 rounded ${s.status === 'open' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{s.status}</span></td>
              <td className="p-3">{s.attendedCount}</td>
              <td className="p-3"><button onClick={() => openStudents(s)} className="text-blue-600 font-bold text-xs hover:underline">View</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {viewing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewing(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <p className="font-bold">{viewing.session.batch?.subject} — {viewing.session.dateKey}</p>
              <button onClick={() => setViewing(null)}><FiX size={20} className="text-gray-400" /></button>
            </div>
            {viewing.students.length === 0 ? <p className="text-sm text-gray-500">No students marked attendance.</p> : (
              <div className="divide-y">
                {viewing.students.map((s, i) => (
                  <div key={i} className="py-2 flex justify-between text-sm">
                    <span>{s.name}<br /><span className="text-xs text-gray-400">{s.email}</span></span>
                    <span className="text-gray-500">{new Date(s.markedAt).toLocaleTimeString()}</span>
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