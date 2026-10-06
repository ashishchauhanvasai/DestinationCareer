import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { FiPlus, FiTrash2, FiX, FiPrinter } from 'react-icons/fi';

const API = 'http://localhost:5000/api';
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const emptyTrainer = { name: '', email: '', password: '' };
const emptyBatch = { batchCode: '', subject: '', trainerId: '', venue: '', location: '', scheduledStartTime: '', scheduledEndTime: '', durationMinutes: 60, expectedStrength: '' };

const AdminBatches = () => {
  const [trainers, setTrainers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [tForm, setTForm] = useState(emptyTrainer);
  const [bForm, setBForm] = useState(emptyBatch);
  const [qrBatch, setQrBatch] = useState(null);

  const load = async () => {
    try {
      const [t, b] = await Promise.all([axios.get(`${API}/trainers`, cfg()), axios.get(`${API}/batches`, cfg())]);
      setTrainers(t.data); setBatches(b.data);
    } catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, []);

  const addTrainer = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/trainers`, tForm, cfg());
      setTForm(emptyTrainer);
      load();
      alert('Trainer account created. Share these login details with them.');
    } catch (err) { alert(err.response?.data?.message || 'Failed to add trainer'); }
  };

  const addBatch = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/batches`, bForm, cfg());
      setBForm(emptyBatch);
      load();
    } catch (err) { alert(err.response?.data?.message || 'Failed to add batch'); }
  };

  const delBatch = async (id) => {
    if (!window.confirm('Delete this batch? Attendance history is kept, but it disappears from the trainer.')) return;
    await axios.delete(`${API}/batches/${id}`, cfg());
    load();
  };

  const viewQr = async (batch) => {
    try { setQrBatch({ batch, qrValue: (await axios.get(`${API}/batches/${batch._id}/qr`, cfg())).data.qrValue }); }
    catch { alert('Could not load QR'); }
  };

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        <form onSubmit={addTrainer} className="bg-white p-6 rounded-2xl shadow-sm border space-y-3">
          <h3 className="font-bold text-lg">Add Trainer Account</h3>
          <input required placeholder="Full name" value={tForm.name} onChange={(e) => setTForm({ ...tForm, name: e.target.value })} className="w-full p-2 border rounded" />
          <input required type="email" placeholder="Email" value={tForm.email} onChange={(e) => setTForm({ ...tForm, email: e.target.value })} className="w-full p-2 border rounded" />
          <input required type="text" placeholder="Password (share this with them)" value={tForm.password} onChange={(e) => setTForm({ ...tForm, password: e.target.value })} className="w-full p-2 border rounded" />
          <button className="w-full bg-blue-600 text-white p-2 rounded font-bold flex items-center justify-center gap-2"><FiPlus /> Add Trainer</button>
        </form>

        <div className="bg-white rounded-2xl shadow-sm border divide-y max-h-[260px] overflow-y-auto">
          <div className="p-4 bg-gray-50 font-bold rounded-t-2xl">Trainers ({trainers.length})</div>
          {trainers.length === 0 && <p className="p-6 text-center text-gray-500 text-sm">No trainers added yet.</p>}
          {trainers.map((t) => (
            <div key={t._id} className="p-4 text-sm">
              <p className="font-semibold">{t.name}</p>
              <p className="text-xs text-gray-500">{t.email}</p>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={addBatch} className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
        <h3 className="font-bold text-lg">Create Batch</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required placeholder="Batch code (e.g. JAVA-EVE-01)" value={bForm.batchCode} onChange={(e) => setBForm({ ...bForm, batchCode: e.target.value })} className="p-2 border rounded text-sm" />
          <input required placeholder="Subject" value={bForm.subject} onChange={(e) => setBForm({ ...bForm, subject: e.target.value })} className="p-2 border rounded text-sm" />
          <select required value={bForm.trainerId} onChange={(e) => setBForm({ ...bForm, trainerId: e.target.value })} className="p-2 border rounded text-sm">
            <option value="">Select trainer</option>
            {trainers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
          <input required placeholder="Venue" value={bForm.venue} onChange={(e) => setBForm({ ...bForm, venue: e.target.value })} className="p-2 border rounded text-sm" />
          <input placeholder="Location / address" value={bForm.location} onChange={(e) => setBForm({ ...bForm, location: e.target.value })} className="p-2 border rounded text-sm" />
          <input type="number" placeholder="Duration (minutes)" value={bForm.durationMinutes} onChange={(e) => setBForm({ ...bForm, durationMinutes: e.target.value })} className="p-2 border rounded text-sm" />
          <input placeholder="Start time (e.g. 06:00 PM)" value={bForm.scheduledStartTime} onChange={(e) => setBForm({ ...bForm, scheduledStartTime: e.target.value })} className="p-2 border rounded text-sm" />
          <input placeholder="End time (e.g. 08:00 PM)" value={bForm.scheduledEndTime} onChange={(e) => setBForm({ ...bForm, scheduledEndTime: e.target.value })} className="p-2 border rounded text-sm" />
          <input type="number" placeholder="Expected batch strength (optional)" value={bForm.expectedStrength} onChange={(e) => setBForm({ ...bForm, expectedStrength: e.target.value })} className="p-2 border rounded text-sm" />
        </div>
        <button className="bg-blue-600 text-white px-5 py-2 rounded font-bold flex items-center gap-2"><FiPlus /> Create Batch</button>
      </form>

      <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
        <div className="p-4 bg-gray-50 font-bold border-b">Batches ({batches.length})</div>
        <table className="w-full text-left text-sm">
          <thead className="text-gray-500 border-b"><tr><th className="p-3">Code</th><th className="p-3">Subject</th><th className="p-3">Trainer</th><th className="p-3">Venue</th><th className="p-3">Schedule</th><th className="p-3 text-center">Actions</th></tr></thead>
          <tbody className="divide-y">
            {batches.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-gray-500">No batches yet.</td></tr>}
            {batches.map((b) => (
              <tr key={b._id}>
                <td className="p-3 font-semibold">{b.batchCode}</td>
                <td className="p-3">{b.subject}</td>
                <td className="p-3">{b.trainerName}</td>
                <td className="p-3">{b.venue}</td>
                <td className="p-3 text-xs text-gray-500">{b.scheduledStartTime} - {b.scheduledEndTime}</td>
                <td className="p-3">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => viewQr(b)} className="text-blue-600 font-bold text-xs hover:underline">View QR</button>
                    <button onClick={() => delBatch(b._id)} className="text-red-500 p-1"><FiTrash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {qrBatch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setQrBatch(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end"><button onClick={() => setQrBatch(null)}><FiX size={20} className="text-gray-400" /></button></div>
            <h3 className="font-bold mb-1">{qrBatch.batch.subject}</h3>
            <p className="text-xs text-gray-500 mb-4">{qrBatch.batch.batchCode} • {qrBatch.batch.venue}</p>
            <div className="flex justify-center mb-4"><QRCodeSVG value={qrBatch.qrValue} size={200} /></div>
            <button onClick={() => window.print()} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2"><FiPrinter /> Print</button>
            <p className="text-xs text-gray-400 mt-3">Stick this at the venue. The trainer scans it to check in and out.</p>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminBatches;