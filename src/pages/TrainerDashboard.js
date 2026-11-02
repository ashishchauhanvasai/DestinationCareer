import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import QrScannerModal from '../components/QrScannerModal';
import { FiMapPin, FiClock, FiUsers, FiLogIn, FiLogOut, FiList, FiStar, FiX, FiVideo } from 'react-icons/fi';

import OnlineClassesManager from '../components/OnlineClassesManager';

const API = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const emptyRating = { studentId: '', technicalRating: 5, communicationRating: 5, codingRating: 5, remarks: '' };

const inputStyles = "w-full p-3.5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 outline-none transition-all text-gray-900 dark:text-white shadow-sm font-medium";

const TrainerDashboard = () => {
  const [activeTab, setActiveTab] = useState('offline');

  const [batches, setBatches] = useState([]);
  const [scanFor, setScanFor] = useState(null);
  const [qrPanel, setQrPanel] = useState(null);

  const [historyBatch, setHistoryBatch] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionDetail, setSessionDetail] = useState(null);

  const [mockBatch, setMockBatch] = useState(null);
  const [roster, setRoster] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [rForm, setRForm] = useState(emptyRating);

  const load = useCallback(async () => {
    try { setBatches((await axios.get(`${API}/batches/mine`, cfg())).data); }
    catch (e) { console.error(e); }
  }, []);
  
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!qrPanel) return;
    const tick = async () => {
      try {
        const r = await axios.get(`${API}/sessions/${qrPanel.sessionId}/qr-token`, cfg());
        setQrPanel((p) => (p ? { ...p, qrValue: r.data.qrValue, attendedCount: r.data.attendedCount } : p));
      } catch { /* session may already be closed */ }
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [qrPanel?.sessionId]); 

  const handleScan = async (qrValue) => {
    const { action } = scanFor;
    setScanFor(null);
    try {
      const url = action === 'checkin' ? `${API}/sessions/checkin` : `${API}/sessions/checkout`;
      const r = await axios.post(url, { qrValue }, cfg());
      alert(r.data.message);
      setQrPanel(null);
      load();
    } catch (err) { alert(err.response?.data?.message || 'Scan failed'); }
  };

  const openHistory = async (batch) => {
    setHistoryBatch(batch);
    setSessionDetail(null);
    try { setSessions((await axios.get(`${API}/batches/${batch._id}/sessions`, cfg())).data); }
    catch { alert('Could not load class history'); }
  };

  const openSessionDetail = async (session) => {
    try { setSessionDetail({ session, students: (await axios.get(`${API}/attendance/sessions/${session._id}/students`, cfg())).data }); }
    catch { alert('Could not load attendance'); }
  };

  const openMock = async (batch) => {
    setMockBatch(batch);
    setRForm(emptyRating);
    try {
      const [r, list] = await Promise.all([
        axios.get(`${API}/batches/${batch._id}/students`, cfg()),
        axios.get(`${API}/mock-ratings/batch/${batch._id}`, cfg())
      ]);
      setRoster(r.data);
      setRatings(list.data);
    } catch { alert('Could not load batch students'); }
  };

  const submitRating = async (e) => {
    e.preventDefault();
    if (!rForm.studentId) return alert('Select a student');
    try {
      await axios.post(`${API}/mock-ratings`, { batchId: mockBatch._id, ...rForm }, cfg());
      setRatings((await axios.get(`${API}/mock-ratings/batch/${mockBatch._id}`, cfg())).data);
      setRForm(emptyRating);
    } catch (err) { alert(err.response?.data?.message || 'Failed to save rating'); }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 pb-12">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">Trainer Dashboard</h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Manage your offline center batches and live online classes.</p>
        </div>

        <div className="flex bg-black/5 dark:bg-white/5 p-1.5 rounded-2xl shadow-inner w-fit border border-black/5 dark:border-white/5 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab('offline')}
            className={`px-6 py-2.5 rounded-xl text-sm font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'offline' 
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-white/50 dark:border-slate-700/50 backdrop-blur-md' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <FiUsers size={16} /> Offline Batches
          </button>
          <button
            onClick={() => setActiveTab('online')}
            className={`px-6 py-2.5 rounded-xl text-sm font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'online' 
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-white/50 dark:border-slate-700/50 backdrop-blur-md' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <FiVideo size={16} /> Online Classes
          </button>
        </div>
      </div>

      {activeTab === 'online' ? (
        <div className="animate-fade-in">
          <OnlineClassesManager />
        </div>
      ) : (
        <div className="animate-fade-in space-y-8">
          <div className="glass-panel p-4 px-5 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FiLogIn size={18} />
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm font-medium leading-relaxed">
              Scan the batch QR at the venue to check in before class, and again to check out after.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {batches.length === 0 && (
              <div className="lg:col-span-2 glass-panel p-16 rounded-[2rem] text-center">
                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">No offline batches assigned to you yet.</p>
              </div>
            )}
            
            {batches.map((b) => {
              const open = b.openSession;
              const showingQr = qrPanel?.sessionId === open?._id;
              
              return (
                <div key={b._id} className="glass-panel p-8 rounded-[2rem] flex flex-col hover:-translate-y-1 transition-all duration-300">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-extrabold text-2xl text-gray-900 dark:text-white tracking-tight">{b.subject}</h3>
                      <p className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider mt-1 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 w-fit">
                        {b.batchCode}
                      </p>
                    </div>
                    <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider border shadow-sm ${open ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' : 'bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-black/5 dark:border-white/5'}`}>
                      {open ? 'Session Active' : 'Not started'}
                    </span>
                  </div>

                  <div className="bg-black/5 dark:bg-white/5 p-5 rounded-[1.5rem] border border-black/5 dark:border-white/5 space-y-3 mb-6">
                    <p className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-gray-300">
                      <FiMapPin className="text-blue-500" size={16} /> 
                      <span className="truncate">{b.venue}{b.location ? `, ${b.location}` : ''}</span>
                    </p>
                    <p className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-gray-300">
                      <FiClock className="text-purple-500" size={16} /> 
                      <span>{b.scheduledStartTime} - {b.scheduledEndTime} <span className="text-gray-500 dark:text-gray-400 font-medium">({b.durationMinutes} min)</span></span>
                    </p>
                    <p className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-gray-300">
                      <FiUsers className="text-orange-500" size={16} /> 
                      <span>Classes taken: {b.classesTaken} <span className="text-gray-500 dark:text-gray-400 font-medium">{b.expectedStrength ? ` / Strength: ${b.expectedStrength}` : ''}</span></span>
                    </p>
                  </div>

                  {!open ? (
                    <button onClick={() => setScanFor({ action: 'checkin' })} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3.5 rounded-xl font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30 mb-2">
                      <FiLogIn /> Check In (Scan Batch QR)
                    </button>
                  ) : (
                    <div className="space-y-4 mb-2">
                      <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-[1.5rem] text-center">
                        <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-1">
                          Checked in at {new Date(open.checkInTime).toLocaleTimeString()}
                        </p>
                        <p className="text-lg font-extrabold text-green-800 dark:text-green-300">
                          {showingQr ? qrPanel.attendedCount : open.attendedCount} <span className="text-sm font-medium">students present</span>
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button onClick={() => setQrPanel(showingQr ? null : { sessionId: open._id, qrValue: '', attendedCount: open.attendedCount })} className="flex-1 glass-button text-blue-600 dark:text-blue-400 py-3 rounded-xl font-extrabold text-xs transition-all">
                          {showingQr ? 'Hide QR' : 'Show Attendance QR'}
                        </button>
                        <button onClick={() => setScanFor({ action: 'checkout' })} className="flex-1 bg-red-500 hover:bg-red-400 text-white py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-red-500/20">
                          <FiLogOut size={16} /> Check Out
                        </button>
                      </div>

                      {showingQr && (
                        <div className="flex flex-col items-center p-6 bg-white dark:bg-white rounded-[1.5rem] border border-gray-200 mt-4 shadow-inner">
                          {qrPanel.qrValue ? <QRCodeSVG value={qrPanel.qrValue} size={180} /> : <p className="text-sm text-gray-400 h-[180px] flex items-center font-bold">Loading QR...</p>}
                          <p className="text-xs text-gray-500 mt-4 font-bold text-center">Students scan this to mark attendance. Refreshes automatically.</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 pt-5 mt-auto border-t border-black/5 dark:border-white/5">
                    <button onClick={() => openHistory(b)} className="flex-1 glass-button text-gray-700 dark:text-gray-300 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-extrabold transition-all">
                      <FiList size={16} className="text-blue-500" /> History
                    </button>
                    <button onClick={() => openMock(b)} className="flex-1 glass-button text-gray-700 dark:text-gray-300 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-extrabold transition-all">
                      <FiStar size={16} className="text-yellow-500" /> Mocks
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {scanFor && <QrScannerModal onResult={handleScan} onClose={() => setScanFor(null)} />}

      {/* HISTORY MODAL (Glassmorphism) */}
      {historyBatch && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setHistoryBatch(null)}>
          <div className="glass-panel p-8 rounded-[2rem] max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 border-b border-black/5 dark:border-white/5 pb-4">
              <p className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight">{historyBatch.subject} <span className="text-gray-400 font-medium">History</span></p>
              <button onClick={() => setHistoryBatch(null)} className="p-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full transition-colors"><FiX size={20} className="text-gray-500 dark:text-gray-300" /></button>
            </div>
            
            {!sessionDetail ? (
              <div className="space-y-3">
                {sessions.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center font-medium">No classes recorded yet.</p>}
                {sessions.map((s) => {
                  const absent = historyBatch.expectedStrength ? Math.max(0, historyBatch.expectedStrength - s.attendedCount) : null;
                  return (
                    <button key={s._id} onClick={() => openSessionDetail(s)} className="w-full text-left p-4 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 rounded-2xl transition-all flex justify-between items-center group">
                      <div>
                        <p className="font-extrabold text-sm text-gray-900 dark:text-white">{s.dateKey}</p>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{new Date(s.checkInTime).toLocaleTimeString()} - {s.checkOutTime ? new Date(s.checkOutTime).toLocaleTimeString() : 'Ongoing'}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-extrabold text-green-600 dark:text-green-400">{s.attendedCount} present</p>
                        {absent !== null && <p className="text-xs font-bold text-red-500 dark:text-red-400 mt-0.5">{absent} absent</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="animate-fade-in">
                <button onClick={() => setSessionDetail(null)} className="text-xs font-extrabold text-blue-600 dark:text-blue-400 mb-5 flex items-center gap-1.5 bg-blue-500/10 px-4 py-2 rounded-xl w-fit transition-all hover:bg-blue-500/20">&larr; Back to history</button>
                <p className="font-extrabold text-sm mb-4 bg-black/5 dark:bg-white/5 p-3 rounded-xl text-center text-gray-800 dark:text-gray-200 border border-black/5 dark:border-white/5">{sessionDetail.session.dateKey} — Present Students</p>
                
                {sessionDetail.students.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6 font-medium">No students marked attendance.</p> : (
                  <div className="space-y-2">
                    {sessionDetail.students.map((s, i) => (
                      <div key={i} className="p-4 flex justify-between items-center text-sm bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
                        <div>
                          <p className="font-extrabold text-gray-900 dark:text-white">{s.name}</p>
                          <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{s.email}</p>
                        </div>
                        <span className="text-xs font-extrabold bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 px-3 py-1 rounded-lg">{new Date(s.markedAt).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {historyBatch.expectedStrength > 0 && (
                  <div className="mt-5 flex justify-between bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/5 text-sm font-extrabold">
                    <span className="text-green-600 dark:text-green-400">Present: {sessionDetail.students.length} / {historyBatch.expectedStrength}</span>
                    <span className="text-red-500 dark:text-red-400">Absent: {Math.max(0, historyBatch.expectedStrength - sessionDetail.students.length)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MOCK RATING MODAL (Glassmorphism) */}
      {mockBatch && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setMockBatch(null)}>
          <div className="glass-panel p-8 rounded-[2rem] max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 border-b border-black/5 dark:border-white/5 pb-4">
              <p className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight">{mockBatch.subject} <span className="text-gray-400 font-medium">Ratings</span></p>
              <button onClick={() => setMockBatch(null)} className="p-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full transition-colors"><FiX size={20} className="text-gray-500 dark:text-gray-300" /></button>
            </div>
            
            <form onSubmit={submitRating} className="space-y-5 mb-8 bg-blue-500/10 p-6 rounded-[1.5rem] border border-blue-500/20">
              <div>
                <label className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Select Student</label>
                <select required value={rForm.studentId} onChange={(e) => setRForm({ ...rForm, studentId: e.target.value })} className={inputStyles}>
                  <option value="">-- Choose student --</option>
                  {roster.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
                </select>
                {roster.length === 0 && <p className="text-[10px] text-red-500 dark:text-red-400 mt-2 font-bold">No students have marked attendance for this batch yet.</p>}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">Tech (1-10)</label>
                  <input type="number" min="1" max="10" value={rForm.technicalRating} onChange={(e) => setRForm({ ...rForm, technicalRating: Number(e.target.value) })} className={`${inputStyles} text-center font-bold`} />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">Comm (1-10)</label>
                  <input type="number" min="1" max="10" value={rForm.communicationRating} onChange={(e) => setRForm({ ...rForm, communicationRating: Number(e.target.value) })} className={`${inputStyles} text-center font-bold`} />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">Code (1-10)</label>
                  <input type="number" min="1" max="10" value={rForm.codingRating} onChange={(e) => setRForm({ ...rForm, codingRating: Number(e.target.value) })} className={`${inputStyles} text-center font-bold`} />
                </div>
              </div>
              
              <div>
                <label className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">Feedback/Remarks (Optional)</label>
                <textarea placeholder="Write your feedback..." value={rForm.remarks} onChange={(e) => setRForm({ ...rForm, remarks: e.target.value })} className={`${inputStyles} resize-none`} rows="2" />
              </div>
              
              <button disabled={!rForm.studentId} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-extrabold text-sm shadow-lg shadow-blue-500/30 disabled:opacity-50 transition-all mt-2">
                Save Mock Rating
              </button>
            </form>

            <p className="font-extrabold text-gray-900 dark:text-white text-lg mb-4">Past Ratings ({ratings.length})</p>
            <div className="space-y-3">
              {ratings.length === 0 && <p className="text-sm font-medium text-gray-500 dark:text-gray-400 p-6 text-center bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">No ratings given yet.</p>}
              {ratings.map((r) => (
                <div key={r._id} className="p-5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-[1.5rem] hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-sm">
                  <div className="flex justify-between items-start mb-3">
                    <p className="font-extrabold text-gray-900 dark:text-white">{r.student?.name}</p>
                    <span className="text-[10px] text-gray-500 dark:text-gray-300 font-extrabold bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/10 px-2.5 py-1 rounded-lg uppercase tracking-wider">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2 text-[11px] font-extrabold text-gray-700 dark:text-gray-300 mb-3">
                    <span className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-lg">Tech: {r.technicalRating}</span>
                    <span className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-lg">Comm: {r.communicationRating}</span>
                    <span className="bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 px-2.5 py-1 rounded-lg">Code: {r.codingRating}</span>
                  </div>
                  {r.remarks && <p className="text-xs text-gray-600 dark:text-gray-400 font-medium italic border-l-2 border-gray-300 dark:border-gray-600 pl-3 leading-relaxed">"{r.remarks}"</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerDashboard;