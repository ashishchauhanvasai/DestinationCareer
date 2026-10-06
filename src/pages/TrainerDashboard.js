import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import QrScannerModal from '../components/QrScannerModal';
import { FiMapPin, FiClock, FiUsers, FiLogIn, FiLogOut, FiList, FiStar, FiX } from 'react-icons/fi';

const API = 'http://localhost:5000/api';
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const emptyRating = { studentId: '', technicalRating: 5, communicationRating: 5, codingRating: 5, remarks: '' };

const TrainerDashboard = () => {
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
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">My Batches</h1>
      <p className="text-gray-500 mb-6">Scan the batch QR at the venue to check in before class, and again to check out after.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {batches.length === 0 && <p className="text-gray-500">No batches assigned to you yet.</p>}
        {batches.map((b) => {
          const open = b.openSession;
          const showingQr = qrPanel?.sessionId === open?._id;
          return (
            <div key={b._id} className="bg-white rounded-2xl border shadow-sm p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{b.subject}</h3>
                  <p className="text-xs text-gray-400">{b.batchCode}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${open ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {open ? 'Session Active' : 'Not started today'}
                </span>
              </div>

              <div className="text-sm text-gray-600 space-y-1 mb-4">
                <p className="flex items-center gap-2"><FiMapPin size={14} /> {b.venue}{b.location ? `, ${b.location}` : ''}</p>
                <p className="flex items-center gap-2"><FiClock size={14} /> {b.scheduledStartTime} - {b.scheduledEndTime} • {b.durationMinutes} min</p>
                <p className="flex items-center gap-2"><FiUsers size={14} /> Classes taken: {b.classesTaken}{b.expectedStrength ? ` • Batch strength: ${b.expectedStrength}` : ''}</p>
              </div>

              {!open ? (
                <button onClick={() => setScanFor({ action: 'checkin' })} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700 mb-2">
                  <FiLogIn /> Check In (Scan Batch QR)
                </button>
              ) : (
                <div className="space-y-3 mb-2">
                  <p className="text-xs text-gray-500">Checked in at {new Date(open.checkInTime).toLocaleTimeString()} • {showingQr ? qrPanel.attendedCount : open.attendedCount} student(s) marked present</p>
                  <div className="flex gap-2">
                    <button onClick={() => setQrPanel(showingQr ? null : { sessionId: open._id, qrValue: '', attendedCount: open.attendedCount })} className="flex-1 border border-blue-600 text-blue-600 py-2 rounded-lg font-bold text-sm hover:bg-blue-50">
                      {showingQr ? 'Hide Attendance QR' : 'Show Attendance QR'}
                    </button>
                    <button onClick={() => setScanFor({ action: 'checkout' })} className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-600">
                      <FiLogOut size={16} /> Check Out
                    </button>
                  </div>
                  {showingQr && (
                    <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl border">
                      {qrPanel.qrValue ? <QRCodeSVG value={qrPanel.qrValue} size={180} /> : <p className="text-sm text-gray-400 h-[180px] flex items-center">Loading...</p>}
                      <p className="text-xs text-gray-500 mt-2">Ask students to scan this to mark attendance. Refreshes automatically.</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t">
                <button onClick={() => openHistory(b)} className="flex-1 text-sm font-bold text-gray-600 hover:text-blue-600 flex items-center justify-center gap-1 py-2">
                  <FiList size={16} /> Class History
                </button>
                <button onClick={() => openMock(b)} className="flex-1 text-sm font-bold text-gray-600 hover:text-blue-600 flex items-center justify-center gap-1 py-2">
                  <FiStar size={16} /> Mock Ratings
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {scanFor && <QrScannerModal onResult={handleScan} onClose={() => setScanFor(null)} />}

      {historyBatch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setHistoryBatch(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <p className="font-bold">{historyBatch.subject} — Class History</p>
              <button onClick={() => setHistoryBatch(null)}><FiX size={20} className="text-gray-400" /></button>
            </div>
            {!sessionDetail ? (
              <div className="divide-y">
                {sessions.length === 0 && <p className="text-sm text-gray-500 py-4">No classes recorded yet.</p>}
                {sessions.map((s) => {
                  const absent = historyBatch.expectedStrength ? Math.max(0, historyBatch.expectedStrength - s.attendedCount) : null;
                  return (
                    <button key={s._id} onClick={() => openSessionDetail(s)} className="w-full text-left py-3 flex justify-between items-center hover:bg-gray-50 px-2 rounded">
                      <div>
                        <p className="font-semibold text-sm">{s.dateKey}</p>
                        <p className="text-xs text-gray-500">{new Date(s.checkInTime).toLocaleTimeString()} - {s.checkOutTime ? new Date(s.checkOutTime).toLocaleTimeString() : 'ongoing'}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-bold text-green-600">{s.attendedCount} present</p>
                        {absent !== null && <p className="text-xs text-red-500">{absent} absent</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <button onClick={() => setSessionDetail(null)} className="text-xs font-bold text-blue-600 hover:underline mb-3">&larr; Back to history</button>
                <p className="font-semibold text-sm mb-2">{sessionDetail.session.dateKey} — Present students</p>
                {sessionDetail.students.length === 0 ? <p className="text-sm text-gray-500">No students marked attendance.</p> : (
                  <div className="divide-y">
                    {sessionDetail.students.map((s, i) => (
                      <div key={i} className="py-2 flex justify-between text-sm">
                        <span>{s.name}<br /><span className="text-xs text-gray-400">{s.email}</span></span>
                        <span className="text-gray-500">{new Date(s.markedAt).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                )}
                {historyBatch.expectedStrength > 0 && (
                  <p className="text-xs text-gray-500 mt-3">Present: {sessionDetail.students.length} / {historyBatch.expectedStrength} expected • Absent: {Math.max(0, historyBatch.expectedStrength - sessionDetail.students.length)}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {mockBatch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setMockBatch(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <p className="font-bold">{mockBatch.subject} — Mock Ratings</p>
              <button onClick={() => setMockBatch(null)}><FiX size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={submitRating} className="space-y-3 mb-6 bg-gray-50 p-4 rounded-xl border">
              <select required value={rForm.studentId} onChange={(e) => setRForm({ ...rForm, studentId: e.target.value })} className="w-full p-2 border rounded text-sm">
                <option value="">Select student</option>
                {roster.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
              </select>
              {roster.length === 0 && <p className="text-xs text-gray-500">No students have marked attendance for this batch yet, so none can be rated.</p>}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Technical (1-10)</label>
                  <input type="number" min="1" max="10" value={rForm.technicalRating} onChange={(e) => setRForm({ ...rForm, technicalRating: Number(e.target.value) })} className="w-full p-2 border rounded text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Communication (1-10)</label>
                  <input type="number" min="1" max="10" value={rForm.communicationRating} onChange={(e) => setRForm({ ...rForm, communicationRating: Number(e.target.value) })} className="w-full p-2 border rounded text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Coding (1-10)</label>
                  <input type="number" min="1" max="10" value={rForm.codingRating} onChange={(e) => setRForm({ ...rForm, codingRating: Number(e.target.value) })} className="w-full p-2 border rounded text-sm" />
                </div>
              </div>
              <textarea placeholder="Remarks (optional)" value={rForm.remarks} onChange={(e) => setRForm({ ...rForm, remarks: e.target.value })} className="w-full p-2 border rounded text-sm" rows="2" />
              <button className="w-full bg-blue-600 text-white py-2 rounded font-bold text-sm">Save Mock Rating</button>
            </form>
            <p className="font-semibold text-sm mb-2">Ratings given ({ratings.length})</p>
            <div className="divide-y">
              {ratings.length === 0 && <p className="text-sm text-gray-500">None yet.</p>}
              {ratings.map((r) => (
                <div key={r._id} className="py-2 text-sm">
                  <p className="font-semibold">{r.student?.name} <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span></p>
                  <p className="text-xs text-gray-600">Technical: {r.technicalRating}/10 • Communication: {r.communicationRating}/10 • Coding: {r.codingRating}/10</p>
                  {r.remarks && <p className="text-xs text-gray-500 italic">"{r.remarks}"</p>}
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