import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import QrScannerModal from '../components/QrScannerModal';
import { FiMapPin, FiClock, FiUsers, FiLogIn, FiLogOut, FiList, FiStar, FiX, FiVideo } from 'react-icons/fi';

import OnlineClassesManager from '../components/OnlineClassesManager';

const API = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const emptyRating = { studentId: '', technicalRating: 5, communicationRating: 5, codingRating: 5, remarks: '' };

const inputStyles = "apple-input w-full";
const labelCls = "block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest pl-1";

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
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-16 animate-fade-in">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Trainer Dashboard</h1>
          <p className="text-[15px] font-medium text-gray-500 dark:text-gray-400">Manage your offline center batches and live online classes.</p>
        </div>

        <div className="flex bg-gray-50 dark:bg-slate-800 p-1.5 rounded-[1.2rem] shadow-sm w-fit border border-gray-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('offline')}
            className={`px-6 py-3 rounded-xl text-[13px] font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'offline' 
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-slate-700' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-transparent'
            }`}
          >
            <FiUsers size={16} /> Offline Batches
          </button>
          <button
            onClick={() => setActiveTab('online')}
            className={`px-6 py-3 rounded-xl text-[13px] font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'online' 
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-slate-700' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-transparent'
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
          <div className="glass-panel bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-5 rounded-[1.5rem] flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-[1rem] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800 shadow-sm">
              <FiLogIn size={20} />
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-[15px] font-medium leading-relaxed">
              Scan the batch QR at the venue to check in before class, and again to check out after.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {batches.length === 0 && (
              <div className="lg:col-span-2 glass-panel bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-20 rounded-[2.5rem] text-center shadow-sm">
                <p className="text-gray-500 dark:text-gray-400 font-bold text-xl">No offline batches assigned to you yet.</p>
              </div>
            )}
            
            {batches.map((b) => {
              const open = b.openSession;
              const showingQr = qrPanel?.sessionId === open?._id;
              
              return (
                <div key={b._id} className="glass-panel bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-8 md:p-10 rounded-[2.5rem] flex flex-col hover:-translate-y-1 transition-transform duration-300 group shadow-sm hover:shadow-lg">
                  <div className="flex justify-between items-start mb-6">
                    <div className="pr-4">
                      <h3 className="font-black text-2xl md:text-3xl text-gray-900 dark:text-white tracking-tight mb-2 leading-tight">{b.subject}</h3>
                      <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-3.5 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm inline-block mt-1">
                        {b.batchCode}
                      </span>
                    </div>
                    <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-widest border shadow-sm shrink-0 whitespace-nowrap ${open ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700'}`}>
                      {open ? 'Session Active' : 'Not started'}
                    </span>
                  </div>

                  <div className="bg-gray-50 dark:bg-slate-800/80 p-5 md:p-6 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 space-y-4 mb-8 shadow-sm">
                    <p className="flex items-center gap-3 text-[15px] font-bold text-gray-800 dark:text-gray-200">
                      <FiMapPin className="text-blue-500" size={18} /> 
                      <span className="truncate">{b.venue}{b.location ? `, ${b.location}` : ''}</span>
                    </p>
                    <p className="flex items-center gap-3 text-[15px] font-bold text-gray-800 dark:text-gray-200">
                      <FiClock className="text-purple-500" size={18} /> 
                      <span>{b.scheduledStartTime} - {b.scheduledEndTime} <span className="text-gray-500 dark:text-gray-400 font-medium">({b.durationMinutes} min)</span></span>
                    </p>
                    <p className="flex items-center gap-3 text-[15px] font-bold text-gray-800 dark:text-gray-200">
                      <FiUsers className="text-orange-500" size={18} /> 
                      <span>Classes taken: {b.classesTaken} <span className="text-gray-500 dark:text-gray-400 font-medium">{b.expectedStrength ? ` / Strength: ${b.expectedStrength}` : ''}</span></span>
                    </p>
                  </div>

                  {!open ? (
                    <button onClick={() => setScanFor({ action: 'checkin' })} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-xl font-extrabold flex items-center justify-center gap-2 transition-transform hover:scale-[0.98] shadow-lg shadow-blue-500/30 mb-2 text-[15px]">
                      <FiLogIn size={20} /> Check In (Scan Batch QR)
                    </button>
                  ) : (
                    <div className="space-y-5 mb-4">
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 p-6 rounded-[1.5rem] text-center shadow-sm">
                        <p className="text-[11px] font-extrabold text-green-700 dark:text-green-500 uppercase tracking-widest mb-1">
                          Checked in at {new Date(open.checkInTime).toLocaleTimeString('en-IN', {hour:'numeric', minute:'numeric', hour12:true})}
                        </p>
                        <p className="text-2xl font-black text-green-800 dark:text-green-400 tracking-tight">
                          {showingQr ? qrPanel.attendedCount : open.attendedCount} <span className="text-sm font-bold">students present</span>
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={() => setQrPanel(showingQr ? null : { sessionId: open._id, qrValue: '', attendedCount: open.attendedCount })} className="flex-1 glass-button bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 py-3.5 rounded-xl font-extrabold text-[13px] uppercase tracking-wider transition-colors shadow-sm">
                          {showingQr ? 'Hide QR' : 'Show Attendance QR'}
                        </button>
                        <button onClick={() => setScanFor({ action: 'checkout' })} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-extrabold text-[13px] uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-500/30">
                          <FiLogOut size={16} /> Check Out
                        </button>
                      </div>

                      {showingQr && (
                        <div className="flex flex-col items-center p-8 bg-white dark:bg-slate-800 rounded-[2rem] border border-gray-200 dark:border-slate-700 mt-6 shadow-sm">
                          {qrPanel.qrValue ? <QRCodeSVG value={qrPanel.qrValue} size={200} className="bg-white p-2 rounded-xl" /> : <p className="text-[15px] text-gray-500 dark:text-gray-400 h-[200px] flex items-center font-bold">Loading QR...</p>}
                          <p className="text-[11px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400 mt-5 text-center">Students scan this to mark attendance. Refreshes automatically.</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-4 pt-6 mt-auto border-t border-gray-200 dark:border-slate-700">
                    <button onClick={() => openHistory(b)} className="flex-1 glass-button bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 py-3.5 rounded-xl flex items-center justify-center gap-2 text-[13px] uppercase tracking-wider font-extrabold transition-colors shadow-sm">
                      <FiList size={16} className="text-blue-500" /> History
                    </button>
                    <button onClick={() => openMock(b)} className="flex-1 glass-button bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 py-3.5 rounded-xl flex items-center justify-center gap-2 text-[13px] uppercase tracking-wider font-extrabold transition-colors shadow-sm">
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

      {/* HISTORY MODAL */}
      {historyBatch && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setHistoryBatch(null)}>
          <div className="glass-panel bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-8 md:p-10 rounded-[2.5rem] max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl custom-scrollbar" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-slate-700 pb-5">
              <p className="font-black text-2xl text-gray-900 dark:text-white tracking-tight">{historyBatch.subject} <span className="text-gray-400 font-bold">History</span></p>
              <button onClick={() => setHistoryBatch(null)} className="p-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors border border-gray-200 dark:border-slate-700 shadow-sm"><FiX size={20} className="text-gray-600 dark:text-gray-400" /></button>
            </div>
            
            {!sessionDetail ? (
              <div className="space-y-4">
                {sessions.length === 0 && <p className="text-[15px] text-gray-500 dark:text-gray-400 py-8 text-center font-bold">No classes recorded yet.</p>}
                {sessions.map((s) => {
                  const absent = historyBatch.expectedStrength ? Math.max(0, historyBatch.expectedStrength - s.attendedCount) : null;
                  return (
                    <button key={s._id} onClick={() => openSessionDetail(s)} className="w-full text-left p-5 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-2xl transition-colors shadow-sm flex justify-between items-center group">
                      <div>
                        <p className="font-black text-[15px] text-gray-900 dark:text-white tracking-tight">{s.dateKey}</p>
                        <p className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">{new Date(s.checkInTime).toLocaleTimeString('en-IN', {hour:'numeric', minute:'numeric', hour12:true})} - {s.checkOutTime ? new Date(s.checkOutTime).toLocaleTimeString('en-IN', {hour:'numeric', minute:'numeric', hour12:true}) : 'Ongoing'}</p>
                      </div>
                      <div className="text-right text-[13px]">
                        <p className="font-black text-green-600 dark:text-green-400">{s.attendedCount} present</p>
                        {absent !== null && <p className="text-[11px] font-extrabold text-red-500 dark:text-red-400 mt-1 uppercase tracking-wider">{absent} absent</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="animate-fade-in">
                <button onClick={() => setSessionDetail(null)} className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 mb-6 flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-4 py-2.5 rounded-xl w-fit transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/50 shadow-sm uppercase tracking-wider">&larr; Back to history</button>
                
                <p className="font-black text-[15px] mb-5 bg-gray-50 dark:bg-slate-800 p-4 rounded-xl text-center text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-slate-700 shadow-sm">{sessionDetail.session.dateKey} — Present Students</p>
                
                {sessionDetail.students.length === 0 ? <p className="text-[15px] text-gray-500 dark:text-gray-400 text-center py-8 font-bold">No students marked attendance.</p> : (
                  <div className="space-y-3">
                    {sessionDetail.students.map((s, i) => (
                      <div key={i} className="p-4 flex justify-between items-center text-[13px] bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                        <div>
                          <p className="font-black text-gray-900 dark:text-white tracking-tight">{s.name}</p>
                          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">{s.email}</p>
                        </div>
                        <span className="text-[10px] font-extrabold bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm">{new Date(s.markedAt).toLocaleTimeString('en-IN', {hour:'numeric', minute:'numeric', hour12:true})}</span>
                      </div>
                    ))}
                  </div>
                )}

                {historyBatch.expectedStrength > 0 && (
                  <div className="mt-6 flex justify-between bg-gray-100 dark:bg-slate-800 p-5 rounded-[1.2rem] border border-gray-200 dark:border-slate-700 text-[13px] font-black shadow-sm">
                    <span className="text-green-600 dark:text-green-400">Present: {sessionDetail.students.length} / {historyBatch.expectedStrength}</span>
                    <span className="text-red-600 dark:text-red-400">Absent: {Math.max(0, historyBatch.expectedStrength - sessionDetail.students.length)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MOCK RATING MODAL */}
      {mockBatch && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setMockBatch(null)}>
          <div className="glass-panel bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-8 md:p-10 rounded-[2.5rem] max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl custom-scrollbar" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-slate-700 pb-5">
              <p className="font-black text-2xl text-gray-900 dark:text-white tracking-tight">{mockBatch.subject} <span className="text-gray-400 font-bold">Ratings</span></p>
              <button onClick={() => setMockBatch(null)} className="p-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors border border-gray-200 dark:border-slate-700 shadow-sm"><FiX size={20} className="text-gray-600 dark:text-gray-400" /></button>
            </div>
            
            <form onSubmit={submitRating} className="space-y-6 mb-10 bg-blue-50 dark:bg-blue-900/20 p-6 md:p-8 rounded-[1.5rem] border border-blue-200 dark:border-blue-800 shadow-sm">
              <div>
                <label className={labelCls}>Select Student</label>
                <select required value={rForm.studentId} onChange={(e) => setRForm({ ...rForm, studentId: e.target.value })} className={`${inputStyles} cursor-pointer font-bold`}>
                  <option value="">-- Choose student --</option>
                  {roster.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
                </select>
                {roster.length === 0 && <p className="text-[11px] text-red-600 dark:text-red-400 mt-2 font-extrabold uppercase tracking-wider">No students have marked attendance for this batch yet.</p>}
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div>
                  <label className={labelCls}>Tech (1-10)</label>
                  <input type="number" min="1" max="10" value={rForm.technicalRating} onChange={(e) => setRForm({ ...rForm, technicalRating: Number(e.target.value) })} className={`${inputStyles} text-center font-black`} />
                </div>
                <div>
                  <label className={labelCls}>Comm (1-10)</label>
                  <input type="number" min="1" max="10" value={rForm.communicationRating} onChange={(e) => setRForm({ ...rForm, communicationRating: Number(e.target.value) })} className={`${inputStyles} text-center font-black`} />
                </div>
                <div>
                  <label className={labelCls}>Code (1-10)</label>
                  <input type="number" min="1" max="10" value={rForm.codingRating} onChange={(e) => setRForm({ ...rForm, codingRating: Number(e.target.value) })} className={`${inputStyles} text-center font-black`} />
                </div>
              </div>
              
              <div>
                <label className={labelCls}>Feedback/Remarks (Optional)</label>
                <textarea placeholder="Write your feedback..." value={rForm.remarks} onChange={(e) => setRForm({ ...rForm, remarks: e.target.value })} className={`${inputStyles} resize-none leading-relaxed text-[13px]`} rows="3" />
              </div>
              
              <button disabled={!rForm.studentId} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-xl font-extrabold text-[15px] shadow-lg shadow-blue-500/30 disabled:opacity-50 transition-transform hover:scale-[0.98] mt-2">
                Save Mock Rating
              </button>
            </form>

            <p className="font-black text-gray-900 dark:text-white text-xl mb-5 tracking-tight border-b border-gray-200 dark:border-slate-700 pb-3">Past Ratings ({ratings.length})</p>
            <div className="space-y-4">
              {ratings.length === 0 && <p className="text-[15px] font-bold text-gray-500 dark:text-gray-400 p-8 text-center bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">No ratings given yet.</p>}
              {ratings.map((r) => (
                <div key={r._id} className="p-6 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-[1.5rem] shadow-sm">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <p className="font-black text-gray-900 dark:text-white text-[15px] tracking-tight">{r.student?.name}</p>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-extrabold bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm shrink-0">{new Date(r.createdAt).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})}</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5 text-[11px] font-extrabold uppercase tracking-widest text-gray-700 dark:text-gray-300 mb-4">
                    <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-lg shadow-sm">Tech: {r.technicalRating}</span>
                    <span className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 px-3 py-1.5 rounded-lg shadow-sm">Comm: {r.communicationRating}</span>
                    <span className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 px-3 py-1.5 rounded-lg shadow-sm">Code: {r.codingRating}</span>
                  </div>
                  {r.remarks && <p className="text-[13px] text-gray-700 dark:text-gray-300 font-medium italic border-l-2 border-gray-300 dark:border-slate-600 pl-4 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-r-xl border-y border-r border-gray-200 dark:border-slate-700 shadow-sm">"{r.remarks}"</p>}
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