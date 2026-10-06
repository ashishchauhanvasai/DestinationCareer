import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QrScannerModal from '../components/QrScannerModal';
import { FiCamera, FiCheckCircle } from 'react-icons/fi';

const API = 'http://localhost:5000/api';
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
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Attendance</h1>

      <div className="bg-white rounded-2xl border shadow-sm p-8 text-center mb-8">
        <FiCamera size={40} className="text-blue-500 mx-auto mb-3" />
        <p className="font-bold text-gray-800 mb-1">Scan the QR shown by your trainer</p>
        <p className="text-sm text-gray-500 mb-4">This marks you present for today's class.</p>
        <button onClick={() => setScanning(true)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">Scan QR Code</button>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm divide-y">
        <div className="p-4 bg-gray-50 font-bold rounded-t-2xl">My Attendance History</div>
        {history.length === 0 && <p className="p-6 text-center text-gray-500 text-sm">No attendance marked yet.</p>}
        {history.map((h, i) => (
          <div key={i} className="p-4 flex justify-between items-center text-sm">
            <div>
              <p className="font-semibold">{h.subject} <span className="text-xs text-gray-400">({h.batchCode})</span></p>
              <p className="text-xs text-gray-500">{h.venue} • {h.date}</p>
            </div>
            <span className="text-green-600 font-bold flex items-center gap-1"><FiCheckCircle /> {new Date(h.markedAt).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>

      {scanning && <QrScannerModal onResult={handleScan} onClose={() => setScanning(false)} />}
    </div>
  );
};
export default StudentAttendance;