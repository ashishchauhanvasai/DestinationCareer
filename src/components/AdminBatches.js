// Save as: src/components/AdminBatches.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { FiPlus, FiTrash2, FiX, FiPrinter } from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const DOMAINS = ['Java', 'Python', 'Data Analytics', 'Frontend'];
const emptyStaff = { name: '', email: '', password: '', domain: '', role: 'trainer' };
const emptyBatch = { batchCode: '', subject: '', trainerId: '', venue: '', location: '', scheduledStartTime: '', scheduledEndTime: '', durationMinutes: 60, expectedStrength: '' };

const AdminBatches = () => {
  const [trainers, setTrainers] = useState([]);
  const [promoUsers, setPromoUsers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [tForm, setTForm] = useState(emptyStaff);
  const [bForm, setBForm] = useState(emptyBatch);
  const [qrBatch, setQrBatch] = useState(null);

  const load = async () => {
    try {
      const [t, b, p] = await Promise.all([
        axios.get(`${API}/trainers/overview`, cfg()).catch(() => ({ data: [] })),
        axios.get(`${API}/batches`, cfg()).catch(() => ({ data: [] })),
        axios.get(`${API}/users?role=promotional`, cfg()).catch(() => ({ data: [] }))
      ]);
      setTrainers(t.data || []);
      setBatches(b.data || []);
      setPromoUsers(p.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const addStaff = async (e) => {
    e.preventDefault();
    try {
      if (tForm.role === 'trainer') {
        const { domain, role, ...account } = tForm;
        const created = await axios.post(`${API}/trainers`, account, cfg());
        if (domain) await axios.put(`${API}/trainers/${created.data._id}/domain`, { domain }, cfg());
      } else {
        await axios.post(`${API}/users/admin-create`, {
          name: tForm.name,
          email: tForm.email,
          password: tForm.password,
          role: tForm.role
        }, cfg());
      }
      setTForm({ ...emptyStaff, role: tForm.role });
      load();
      alert(`${tForm.role === 'trainer' ? 'Trainer' : 'Promotional'} account created successfully. Share these login details with them.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add staff member');
    }
  };

  const changeDomain = async (trainerId, domain) => {
    try {
      await axios.put(`${API}/trainers/${trainerId}/domain`, { domain }, cfg());
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not change the domain');
    }
  };

  const addBatch = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/batches`, bForm, cfg());
      setBForm(emptyBatch);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add batch');
    }
  };

  const delBatch = async (id) => {
    if (!window.confirm('Delete this batch? Attendance history is kept, but it disappears from the trainer.')) return;
    await axios.delete(`${API}/batches/${id}`, cfg());
    load();
  };

  const viewQr = async (batch) => {
    try {
      setQrBatch({ batch, qrValue: (await axios.get(`${API}/batches/${batch._id}/qr`, cfg())).data.qrValue });
    } catch {
      alert('Could not load QR');
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        <form onSubmit={addStaff} className="bg-white p-6 rounded-2xl shadow-sm border space-y-3 h-fit">
          <h3 className="font-bold text-lg border-b pb-2">Add Staff Account</h3>

          <div className="grid grid-cols-2 gap-3 mb-2">
            <button
              type="button"
              onClick={() => setTForm({ ...tForm, role: 'trainer' })}
              className={`p-2 rounded-lg font-bold text-sm border-2 transition ${tForm.role === 'trainer' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-500'}`}
            >
              Trainer
            </button>
            <button
              type="button"
              onClick={() => setTForm({ ...tForm, role: 'promotional' })}
              className={`p-2 rounded-lg font-bold text-sm border-2 transition ${tForm.role === 'promotional' ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-gray-200 text-gray-500'}`}
            >
              Promo Team
            </button>
          </div>

          <input required placeholder="Full name" value={tForm.name} onChange={(e) => setTForm({ ...tForm, name: e.target.value })} className="w-full p-2 border rounded" />
          <input required type="email" placeholder="Email ID" value={tForm.email} onChange={(e) => setTForm({ ...tForm, email: e.target.value })} className="w-full p-2 border rounded" />
          <input required type="text" placeholder="Set Password" value={tForm.password} onChange={(e) => setTForm({ ...tForm, password: e.target.value })} className="w-full p-2 border rounded" />

          {tForm.role === 'trainer' && (
            <select value={tForm.domain} onChange={(e) => setTForm({ ...tForm, domain: e.target.value })} className="w-full p-2 border rounded text-sm">
              <option value="">Domain (decides which top performers they manage)</option>
              {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          )}

          <button className={`w-full text-white p-2.5 rounded font-bold flex items-center justify-center gap-2 mt-2 ${tForm.role === 'trainer' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-teal-600 hover:bg-teal-700'}`}>
            <FiPlus /> Create {tForm.role === 'trainer' ? 'Trainer' : 'Promo'} Account
          </button>
        </form>

        <div className="bg-white rounded-2xl shadow-sm border divide-y max-h-[350px] overflow-y-auto">
          {tForm.role === 'trainer' ? (
            <>
              <div className="p-4 bg-gray-50 font-bold rounded-t-2xl">Trainers ({trainers.length})</div>
              {trainers.length === 0 && <p className="p-6 text-center text-gray-500 text-sm">No trainers added yet.</p>}
              {trainers.map((t) => (
                <div key={t._id} className="p-4 text-sm flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-xs text-gray-500 truncate">{t.email}</p>
                  </div>
                  <select value={t.domain || ''} onChange={(e) => changeDomain(t._id, e.target.value)} className="p-1 border rounded text-xs" title="Trainer domain">
                    <option value="">No domain</option>
                    {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="p-4 bg-teal-50 text-teal-800 font-bold rounded-t-2xl">Promo Team ({promoUsers.length})</div>
              {promoUsers.length === 0 && <p className="p-6 text-center text-gray-500 text-sm">No promo team members added yet.</p>}
              {promoUsers.map((p) => (
                <div key={p._id} className="p-4 text-sm flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-gray-500 truncate">{p.email}</p>
                  </div>
                  <span className="text-xs font-bold text-teal-700 bg-teal-100 px-2 py-1 rounded">Promo</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {tForm.role === 'trainer' && (
        <>
          <form onSubmit={addBatch} className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
            <h3 className="font-bold text-lg border-b pb-2">Create New Batch</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required placeholder="Batch code (e.g. JAVA-EVE-01)" value={bForm.batchCode} onChange={(e) => setBForm({ ...bForm, batchCode: e.target.value })} className="p-2 border rounded text-sm bg-gray-50 focus:bg-white" />
              <input required placeholder="Subject" value={bForm.subject} onChange={(e) => setBForm({ ...bForm, subject: e.target.value })} className="p-2 border rounded text-sm bg-gray-50 focus:bg-white" />
              <select required value={bForm.trainerId} onChange={(e) => setBForm({ ...bForm, trainerId: e.target.value })} className="p-2 border rounded text-sm bg-gray-50 focus:bg-white">
                <option value="">Select trainer</option>
                {trainers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
              <input required placeholder="Venue" value={bForm.venue} onChange={(e) => setBForm({ ...bForm, venue: e.target.value })} className="p-2 border rounded text-sm bg-gray-50 focus:bg-white" />
              <input placeholder="Location / address" value={bForm.location} onChange={(e) => setBForm({ ...bForm, location: e.target.value })} className="p-2 border rounded text-sm bg-gray-50 focus:bg-white" />
              <input type="number" placeholder="Duration (minutes)" value={bForm.durationMinutes} onChange={(e) => setBForm({ ...bForm, durationMinutes: e.target.value })} className="p-2 border rounded text-sm bg-gray-50 focus:bg-white" />
              <input placeholder="Start time (e.g. 06:00 PM)" value={bForm.scheduledStartTime} onChange={(e) => setBForm({ ...bForm, scheduledStartTime: e.target.value })} className="p-2 border rounded text-sm bg-gray-50 focus:bg-white" />
              <input placeholder="End time (e.g. 08:00 PM)" value={bForm.scheduledEndTime} onChange={(e) => setBForm({ ...bForm, scheduledEndTime: e.target.value })} className="p-2 border rounded text-sm bg-gray-50 focus:bg-white" />
              <input type="number" placeholder="Expected batch strength (optional)" value={bForm.expectedStrength} onChange={(e) => setBForm({ ...bForm, expectedStrength: e.target.value })} className="p-2 border rounded text-sm bg-gray-50 focus:bg-white md:col-span-2" />
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded font-bold flex items-center gap-2"><FiPlus /> Create Batch</button>
          </form>

          <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
            <div className="p-4 bg-gray-50 font-bold border-b">Batches ({batches.length})</div>
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-gray-500 border-b bg-gray-50/50">
                <tr>
                  <th className="p-4 font-semibold">Code</th>
                  <th className="p-4 font-semibold">Subject</th>
                  <th className="p-4 font-semibold">Trainer</th>
                  <th className="p-4 font-semibold">Venue</th>
                  <th className="p-4 font-semibold">Schedule</th>
                  <th className="p-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {batches.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-gray-500">No batches yet.</td></tr>}
                {batches.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-bold text-gray-800">{b.batchCode}</td>
                    <td className="p-4 text-gray-700">{b.subject}</td>
                    <td className="p-4 text-blue-700 font-semibold bg-blue-50/30">{b.trainerName}</td>
                    <td className="p-4 text-gray-700">{b.venue}</td>
                    <td className="p-4 text-xs text-gray-500 font-medium">
                      <div className="flex flex-col gap-0.5">
                        <span>{b.scheduledStartTime} to</span>
                        <span>{b.scheduledEndTime}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => viewQr(b)} className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded font-bold text-xs hover:bg-blue-100 transition">View QR</button>
                        <button onClick={() => delBatch(b._id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition" title="Delete Batch"><FiTrash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {qrBatch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setQrBatch(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end"><button onClick={() => setQrBatch(null)} className="p-1 hover:bg-gray-100 rounded-full"><FiX size={20} className="text-gray-400" /></button></div>
            <h3 className="font-bold text-lg text-gray-800 mb-1">{qrBatch.batch.subject}</h3>
            <p className="text-xs font-semibold text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded mb-4">
              {qrBatch.batch.batchCode} • {qrBatch.batch.venue}
            </p>
            <div className="flex justify-center mb-5 bg-white p-2 rounded-xl border border-gray-100"><QRCodeSVG value={qrBatch.qrValue} size={200} /></div>
            <button onClick={() => window.print()} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition"><FiPrinter /> Print QR Code</button>
            <p className="text-xs text-gray-400 mt-4 leading-relaxed">Stick this at the venue. The trainer scans it via their app to check in and out.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBatches;