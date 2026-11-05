import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiX, FiCheckSquare, FiClock, FiUsers } from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

// Upgraded component matching the Liquid Glass structural UI
const AdminAttendance = () => {
  const [sessions, setSessions] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/attendance/sessions`, cfg())
      .then((r) => setSessions(r.data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const openStudents = async (session) => {
    try { 
      setViewing({ 
        session, 
        students: (await axios.get(`${API}/attendance/sessions/${session._id}/students`, cfg())).data 
      }); 
    }
    catch { alert('Could not load attendees'); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-12">
      
      {/* Structural Header matching other views */}
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3.5 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl border border-blue-500/20 shadow-sm shrink-0">
          <FiCheckSquare className="text-blue-600 dark:text-blue-400" size={28} />
        </div>
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Class Sessions</h2>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Review check-ins and check-outs across all active batches.</p>
        </div>
      </div>

      {/* Main Structural Panel */}
      <div className="glass-panel rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="p-6 md:p-8 bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
          <span className="font-extrabold text-gray-900 dark:text-white text-xl tracking-tight">
            Recent Sessions
          </span>
          <span className="text-xs font-extrabold text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl shadow-sm uppercase tracking-wider">
            {sessions.length} Recorded
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white dark:bg-slate-900 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="p-6">Batch Details</th>
                <th className="p-6">Trainer</th>
                <th className="p-6 text-center">Date & Timings</th>
                <th className="p-6 text-center">Status</th>
                <th className="p-6 text-center">Attended</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {loading && <tr><td colSpan="6" className="p-20 text-center text-gray-500 dark:text-gray-400 font-extrabold text-xl animate-pulse">Loading sessions...</td></tr>}
              {!loading && sessions.length === 0 && <tr><td colSpan="6" className="p-20 text-center text-gray-500 dark:text-gray-400 font-extrabold text-xl">No classes recorded yet.</td></tr>}
              {!loading && sessions.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="p-6">
                    <p className="font-extrabold text-gray-900 dark:text-white text-[15px] mb-1.5">{s.batch?.subject}</p>
                    <span className="text-[10px] text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm inline-block">
                      {s.batch?.batchCode}
                    </span>
                  </td>
                  <td className="p-6 font-extrabold text-gray-700 dark:text-gray-300">
                    {s.trainer?.name}
                  </td>
                  <td className="p-6 text-center">
                    <p className="font-extrabold text-gray-900 dark:text-white text-[14px]">{s.dateKey}</p>
                    <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-center gap-1">
                      <FiClock size={12} className="opacity-70" /> 
                      {new Date(s.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                      {' - '} 
                      {s.checkOutTime ? new Date(s.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Ongoing'}
                    </p>
                  </td>
                  <td className="p-6 text-center">
                    <span className={`text-[10px] font-extrabold px-4 py-2 rounded-xl uppercase tracking-wider border shadow-sm ${s.status === 'open' ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 animate-pulse' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="p-6 text-center font-black text-xl text-gray-900 dark:text-white">
                    {s.attendedCount}
                  </td>
                  <td className="p-6 text-right">
                    <button onClick={() => openStudents(s)} className="glass-button text-blue-600 dark:text-blue-400 font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all opacity-100 xl:opacity-0 xl:group-hover:opacity-100 uppercase tracking-wider flex items-center gap-2 ml-auto">
                      <FiUsers size={14} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Structural Modal Review Box */}
      {viewing && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewing(null)}>
          <div className="glass-panel p-0 rounded-[2.5rem] max-w-lg w-full max-h-[85vh] overflow-hidden shadow-2xl relative flex flex-col" onClick={(e) => e.stopPropagation()}>
            
            <div className="p-6 md:p-8 bg-gray-50 dark:bg-slate-800/90 border-b border-gray-200 dark:border-slate-700 flex justify-between items-start shrink-0">
              <div>
                <h3 className="font-extrabold text-2xl text-gray-900 dark:text-white tracking-tight">{viewing.session.batch?.subject}</h3>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg shadow-sm uppercase tracking-wider">{viewing.session.batch?.batchCode}</span>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><FiClock /> {viewing.session.dateKey}</span>
                </div>
              </div>
              <button onClick={() => setViewing(null)} className="p-2.5 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded-full transition-colors border border-gray-300 dark:border-slate-600 shadow-sm shrink-0">
                <FiX size={18} className="text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <div className="overflow-y-auto custom-scrollbar p-6 md:p-8 flex-1 bg-white dark:bg-[#1e293b]">
              <div className="flex items-center justify-between mb-6">
                 <h4 className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Attendance Roster</h4>
                 <span className="text-[10px] font-extrabold text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">{viewing.students.length} Marked</span>
              </div>

              {viewing.students.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <FiUsers size={40} className="text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-lg font-bold text-gray-500 dark:text-gray-400">No students checked in.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {viewing.students.map((s, i) => (
                    <div key={i} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 transition-colors hover:border-blue-300 dark:hover:border-blue-700">
                      <div className="min-w-0">
                        <span className="font-extrabold text-gray-900 dark:text-white text-[15px] block mb-1 truncate">{s.name}</span>
                        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate block">{s.email}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="text-[11px] font-extrabold text-gray-700 dark:text-gray-300">
                          {new Date(s.markedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAttendance;