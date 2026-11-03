import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QrScannerModal from '../components/QrScannerModal';
import { FiCamera, FiCheckCircle } from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const StudentAttendance = () => {
  const [scanning, setScanning] = useState(false);
  const [history, setHistory] = useState([]);

  const load = async () => {
    try { setHistory((await axios.get(`${API}/attendance/mine`, cfg())).data); }
    catch (e) { console.error(e); }
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

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      <div className="flex items-center gap-4 mb-2">
        <div className="p-3 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl backdrop-blur-md border border-blue-500/20 shadow-sm">
          <FiCheckCircle className="text-blue-600 dark:text-blue-400" size={28} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Attendance</h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Mark your daily presence and track your history.</p>
        </div>
      </div>

      <div className="glass-panel rounded-[2.5rem] shadow-lg p-10 md:p-12 text-center border-white/60">
        <div className="w-20 h-20 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-5 border border-blue-500/20 shadow-inner">
          <FiCamera size={36} />
        </div>
        <p className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">Scan the batch QR</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-8">Point your camera at the QR code shown by your trainer to mark yourself present for today's class.</p>
        <button onClick={() => setScanning(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-10 py-4 rounded-xl font-extrabold shadow-lg shadow-blue-500/30 hover:scale-[0.98] transition-transform text-[15px]">
          Scan QR Code
        </button>
      </div>

      <div className="glass-panel rounded-[2rem] overflow-hidden shadow-sm border-white/60">
        <div className="p-6 md:p-8 bg-white/20 dark:bg-slate-800/20 font-extrabold text-gray-900 dark:text-white text-xl border-b border-black/5 dark:border-white/5 tracking-tight">
          My Attendance History
        </div>
        <div className="divide-y divide-black/5 dark:divide-white/5">
          {history.length === 0 && <p className="p-10 text-center text-gray-500 font-medium text-lg">No attendance marked yet.</p>}
          {history.map((h, i) => (
            <div key={i} className="p-6 flex justify-between items-center text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
              <div>
                <p className="font-extrabold text-lg text-gray-900 dark:text-white leading-snug">
                  {h.subject} 
                  <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded uppercase tracking-wider ml-2 shadow-sm relative -top-0.5">
                    {h.batchCode}
                  </span>
                </p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1.5">{h.venue} • {h.date}</p>
              </div>
              <span className="text-[11px] bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5 uppercase tracking-wider shadow-sm">
                <FiCheckCircle size={14} /> {new Date(h.markedAt).toLocaleTimeString()}
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