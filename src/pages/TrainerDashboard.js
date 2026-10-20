import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import QrScannerModal from '../components/QrScannerModal';
import { FiMapPin, FiClock, FiUsers, FiLogIn, FiLogOut, FiList, FiStar, FiX, FiVideo } from 'react-icons/fi';

// YAHAN ONLINE CLASSES COMPONENT IMPORT KIYA HAI
import OnlineClassesManager from '../components/OnlineClassesManager';

const API = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const emptyRating = { studentId: '', technicalRating: 5, communicationRating: 5, codingRating: 5, remarks: '' };

const TrainerDashboard = () => {
  // NAYA STATE: Tab switch karne ke liye (offline vs online)
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
  }, [qrPanel?.sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Trainer Dashboard</h1>
          <p className="text-gray-500 text-sm">Manage your offline center batches and live online classes.</p>
        </div>

        {/* NAYA TOGGLE BUTTON: Offline vs Online */}
        <div className="flex bg-gray-100 p-1 rounded-xl shadow-sm w-fit border border-gray-200">
          <button
            onClick={() => setActiveTab('offline')}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'offline' ? 'bg-white text-blue-700 shadow border border-gray-200' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <FiUsers size={16} /> Offline Batches
          </button>
          <button
            onClick={() => setActiveTab('online')}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'online' ? 'bg-white text-blue-700 shadow border border-gray-200' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <FiVideo size={16} /> Online Classes
          </button>
        </div>
      </div>

      {/* TABS RENDERING LOGIC */}
      {activeTab === 'online' ? (
        // ---------------- ONLINE CLASSES TAB ----------------
        <div className="animate-fade-in">
          <OnlineClassesManager />
        </div>
      ) : (
        // ---------------- OFFLINE BATCHES TAB ----------------
        <div className="animate-fade-in">
          <p className="text-gray-500 mb-6 bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm flex items-center gap-2">
            <FiLogIn className="text-blue-600" />
            Scan the batch QR at the venue to check in before class, and again to check out after.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {batches.length === 0 && <p className="text-gray-500 col-span-2 text-center py-10 bg-white rounded-2xl border">No offline batches assigned to you yet.</p>}
            {batches.map((b) => {
              const open = b.openSession;
              const showingQr = qrPanel?.sessionId === open?._id;
              return (
                <div key={b._id} className="bg-white rounded-2xl border shadow-sm p-6 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{b.subject}</h3>
                      <p className="text-xs text-gray-400">{b.batchCode}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${open ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {open ? 'Session Active' : 'Not started today'}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="flex items-center gap-2 font-medium text-gray-800"><FiMapPin size={14} className="text-gray-400" /> {b.venue}{b.location ? `, ${b.location}` : ''}</p>
                    <p className="flex items-center gap-2"><FiClock size={14} className="text-gray-400" /> {b.scheduledStartTime} - {b.scheduledEndTime} ({b.durationMinutes} min)</p>
                    <p className="flex items-center gap-2"><FiUsers size={14} className="text-gray-400" /> Classes taken: <span className="font-bold">{b.classesTaken}</span> {b.expectedStrength ? ` / Batch strength: ${b.expectedStrength}` : ''}</p>
                  </div>

                  {!open ? (
                    <button onClick={() => setScanFor({ action: 'checkin' })} className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 mb-2 transition">
                      <FiLogIn /> Check In (Scan Batch QR)
                    </button>
                  ) : (
                    <div className="space-y-3 mb-2">
                      <p className="text-xs text-gray-500 text-center font-semibold bg-green-50 text-green-800 py-1.5 rounded-lg border border-green-200">
                        Checked in at {new Date(open.checkInTime).toLocaleTimeString()} • {showingQr ? qrPanel.attendedCount : open.attendedCount} student(s) marked present
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => setQrPanel(showingQr ? null : { sessionId: open._id, qrValue: '', attendedCount: open.attendedCount })} className="flex-1 border border-blue-600 text-blue-600 py-2.5 rounded-xl font-bold text-xs hover:bg-blue-50 transition">
                          {showingQr ? 'Hide Attendance QR' : 'Show Attendance QR'}
                        </button>
                        <button onClick={() => setScanFor({ action: 'checkout' })} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-600 transition">
                          <FiLogOut size={16} /> Check Out
                        </button>
                      </div>
                      {showingQr && (
                        <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl border border-gray-200 mt-2">
                          {qrPanel.qrValue ? <QRCodeSVG value={qrPanel.qrValue} size={180} /> : <p className="text-sm text-gray-400 h-[180px] flex items-center">Loading...</p>}
                          <p className="text-xs text-gray-500 mt-3 font-semibold text-center">Ask students to scan this to mark attendance. Refreshes automatically.</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 mt-3 border-t">
                    <button onClick={() => openHistory(b)} className="flex-1 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-center gap-1 py-2 transition">
                      <FiList size={16} /> Class History
                    </button>
                    <button onClick={() => openMock(b)} className="flex-1 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-center gap-1 py-2 transition">
                      <FiStar size={16} className="text-yellow-500" /> Mock Ratings
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setHistoryBatch(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <p className="font-bold text-lg text-gray-900">{historyBatch.subject} — Class History</p>
              <button onClick={() => setHistoryBatch(null)} className="p-1 hover:bg-gray-100 rounded-full"><FiX size={20} className="text-gray-500" /></button>
            </div>
            {!sessionDetail ? (
              <div className="divide-y divide-gray-100">
                {sessions.length === 0 && <p className="text-sm text-gray-500 py-4 text-center">No classes recorded yet.</p>}
                {sessions.map((s) => {
                  const absent = historyBatch.expectedStrength ? Math.max(0, historyBatch.expectedStrength - s.attendedCount) : null;
                  return (
                    <button key={s._id} onClick={() => openSessionDetail(s)} className="w-full text-left py-3 flex justify-between items-center hover:bg-gray-50 px-3 rounded-xl transition">
                      <div>
                        <p className="font-bold text-sm text-gray-800">{s.dateKey}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(s.checkInTime).toLocaleTimeString()} - {s.checkOutTime ? new Date(s.checkOutTime).toLocaleTimeString() : 'Ongoing'}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-extrabold text-green-600">{s.attendedCount} present</p>
                        {absent !== null && <p className="text-xs font-bold text-red-500 mt-0.5">{absent} absent</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="animate-fade-in">
                <button onClick={() => setSessionDetail(null)} className="text-xs font-bold text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg w-fit transition">&larr; Back to history</button>
                <p className="font-bold text-sm mb-3 bg-gray-100 p-2 rounded text-center">{sessionDetail.session.dateKey} — Present students</p>
                {sessionDetail.students.length === 0 ? <p className="text-sm text-gray-500 text-center py-4">No students marked attendance.</p> : (
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl">
                    {sessionDetail.students.map((s, i) => (
                      <div key={i} className="py-3 px-4 flex justify-between items-center text-sm hover:bg-gray-50 transition">
                        <div>
                          <p className="font-semibold text-gray-800">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.email}</p>
                        </div>
                        <span className="text-xs font-bold bg-green-50 text-green-700 px-2 py-1 rounded">{new Date(s.markedAt).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                )}
                {historyBatch.expectedStrength > 0 && (
                  <div className="mt-4 flex justify-between bg-gray-50 p-3 rounded-lg border text-sm font-bold">
                    <span className="text-green-600">Present: {sessionDetail.students.length}/{historyBatch.expectedStrength}</span>
                    <span className="text-red-500">Absent: {Math.max(0, historyBatch.expectedStrength - sessionDetail.students.length)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MOCK RATING MODAL */}
      {mockBatch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setMockBatch(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <p className="font-bold text-lg text-gray-900">{mockBatch.subject} — Mock Ratings</p>
              <button onClick={() => setMockBatch(null)} className="p-1 hover:bg-gray-100 rounded-full"><FiX size={20} className="text-gray-500" /></button>
            </div>
            
            <form onSubmit={submitRating} className="space-y-4 mb-6 bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Select Student</label>
                <select required value={rForm.studentId} onChange={(e) => setRForm({ ...rForm, studentId: e.target.value })} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option value="">-- Choose student --</option>
                  {roster.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
                </select>
                {roster.length === 0 && <p className="text-[10px] text-red-500 mt-1 font-bold">No students have marked attendance for this batch yet.</p>}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Technical (1-10)</label>
                  <input type="number" min="1" max="10" value={rForm.technicalRating} onChange={(e) => setRForm({ ...rForm, technicalRating: Number(e.target.value) })} className="w-full p-2 border border-gray-200 rounded-lg text-sm text-center font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Comms (1-10)</label>
                  <input type="number" min="1" max="10" value={rForm.communicationRating} onChange={(e) => setRForm({ ...rForm, communicationRating: Number(e.target.value) })} className="w-full p-2 border border-gray-200 rounded-lg text-sm text-center font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Coding (1-10)</label>
                  <input type="number" min="1" max="10" value={rForm.codingRating} onChange={(e) => setRForm({ ...rForm, codingRating: Number(e.target.value) })} className="w-full p-2 border border-gray-200 rounded-lg text-sm text-center font-bold" />
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Feedback/Remarks (Optional)</label>
                <textarea placeholder="Write your feedback..." value={rForm.remarks} onChange={(e) => setRForm({ ...rForm, remarks: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows="2" />
              </div>
              
              <button disabled={!rForm.studentId} className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 disabled:opacity-50 transition">
                Save Mock Rating
              </button>
            </form>

            <p className="font-bold text-gray-800 text-sm mb-3">Past Ratings ({ratings.length})</p>
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl">
              {ratings.length === 0 && <p className="text-sm text-gray-500 p-4 text-center bg-gray-50">No ratings given yet.</p>}
              {ratings.map((r) => (
                <div key={r._id} className="p-4 text-sm hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-gray-900">{r.student?.name}</p>
                    <span className="text-[10px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2 text-xs font-bold text-gray-600 mb-2">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">Tech: {r.technicalRating}</span>
                    <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded">Comm: {r.communicationRating}</span>
                    <span className="bg-green-50 text-green-700 px-2 py-1 rounded">Code: {r.codingRating}</span>
                  </div>
                  {r.remarks && <p className="text-xs text-gray-600 italic border-l-2 border-gray-300 pl-2">"{r.remarks}"</p>}
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