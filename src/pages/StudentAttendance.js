import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QrScannerModal from '../components/QrScannerModal';
import { FiCamera, FiCheckCircle } from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const StudentAttendance = () => {
  const [scanning, setScanning] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { 
      setHistory((await axios.get(`${API}/attendance/mine`, cfg())).data); 
    } catch (e) { 
      console.error(e); 
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { load(); }, []);

  const handleScan = async (qrValue) => {
    setScanning(false);
    try {
      const r = await axios.post(`${API}/attendance/mark`, { qrValue }, cfg());
      alert(r.data.message);
      load();
    } catch (err) { alert(err.response?.data?.message || 'Could not mark attendance'); }
  };

  if (loading) return <div className="h-[50vh] flex items-center justify-center font-bold text-gray-500 animate-pulse text-lg">Loading your attendance...</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in pb-12">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3.5 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl border border-blue-500/20 shadow-sm shrink-0">
          <FiCheckCircle className="text-blue-600 dark:text-blue-400" size={28} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Attendance</h1>
          <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mt-1 opacity-90">Mark your daily presence and track your history.</p>
        </div>
      </div>

      <div className="glass-panel bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm hover:shadow-md transition-shadow p-8 md:p-12 text-center border border-gray-200 dark:border-slate-700">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-200 dark:border-blue-800 shadow-sm">
          <FiCamera size={36} />
        </div>
        <p className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">Scan the batch QR</p>
        <p className="text-[15px] text-gray-500 dark:text-gray-400 font-medium mb-8 max-w-lg mx-auto leading-relaxed">Point your camera at the QR code shown by your trainer to mark yourself present for today's class.</p>
        <button onClick={() => setScanning(true)} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-4 rounded-xl font-extrabold shadow-lg shadow-blue-500/30 hover:scale-[0.98] transition-transform text-[15px]">
          Scan QR Code
        </button>
      </div>

      <div className="glass-panel bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="p-6 md:p-8 bg-gray-50 dark:bg-slate-800/80 font-black text-gray-900 dark:text-white text-xl md:text-2xl border-b border-gray-200 dark:border-slate-700 tracking-tight">
          My Attendance History
        </div>
        <div className="divide-y divide-gray-200 dark:divide-slate-700">
          {history.length === 0 && <p className="p-16 text-center text-gray-500 font-bold text-lg">No attendance marked yet.</p>}
          {history.map((h, i) => (
            <div key={i} className="p-6 md:p-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-sm hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
              <div>
                <p className="font-extrabold text-xl text-gray-900 dark:text-white leading-tight tracking-tight flex flex-wrap items-center gap-2 mb-2">
                  {h.subject} 
                  <span className="text-[10px] font-black text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-2 py-1 rounded-md uppercase tracking-widest shadow-sm">
                    {h.batchCode}
                  </span>
                </p>
                <p className="text-[13px] font-bold text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-2">
                  <span>{h.venue}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                  <span>{h.date}</span>
                </p>
              </div>
              <span className="text-[11px] bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 font-black px-4 py-2 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider shadow-sm w-fit">
                <FiCheckCircle size={16} /> {new Date(h.markedAt).toLocaleTimeString('en-IN', {hour: 'numeric', minute: 'numeric', hour12: true})}
              </span>
            </div>
          ))}
        </div>
      </div>

      {scanning && <QrScannerModal onResult={handleScan} onClose={() => setScanning(false)} />}
    </div>
  );
};
export default StudentAttendance;