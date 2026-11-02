import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { FiPlus, FiTrash2, FiX, FiPrinter, FiUser, FiUsers, FiClock, FiMapPin } from 'react-icons/fi';

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
    <div className="space-y-10 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl backdrop-blur-md border border-blue-500/20 shadow-sm">
          <FiUsers className="text-blue-600 dark:text-blue-400" size={26} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Batches & Staff</h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Manage trainers, promo team, and offline batches.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">

        {/* ADD STAFF FORM (Glass Panel) */}
        <form onSubmit={addStaff} className="glass-panel p-8 rounded-[2rem] flex flex-col h-full shadow-lg border-white/60">
          <h3 className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight mb-6">Add Staff Account</h3>

          <div className="flex gap-4 mb-6 bg-black/5 dark:bg-white/5 p-1.5 rounded-2xl border border-black/5 dark:border-white/5">
            <button
              type="button"
              onClick={() => setTForm({ ...tForm, role: 'trainer' })}
              className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-300 ${tForm.role === 'trainer'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
            >
              Trainer
            </button>
            <button
              type="button"
              onClick={() => setTForm({ ...tForm, role: 'promotional' })}
              className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-300 ${tForm.role === 'promotional'
                  ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
            >
              Promo Team
            </button>
          </div>

          <div className="space-y-4 flex-1">
            <input required placeholder="Full name" value={tForm.name} onChange={(e) => setTForm({ ...tForm, name: e.target.value })} className="apple-input" />
            <input required type="email" placeholder="Email ID" value={tForm.email} onChange={(e) => setTForm({ ...tForm, email: e.target.value })} className="apple-input" />
            <input required type="text" placeholder="Set Password" value={tForm.password} onChange={(e) => setTForm({ ...tForm, password: e.target.value })} className="apple-input" />

            {tForm.role === 'trainer' && (
              <select value={tForm.domain} onChange={(e) => setTForm({ ...tForm, domain: e.target.value })} className="apple-input cursor-pointer">
                <option value="">Domain (optional)</option>
                {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
          </div>

          <button className={`w-full mt-6 py-3.5 rounded-xl font-extrabold text-white flex items-center justify-center gap-2 shadow-lg transition-all ${tForm.role === 'trainer' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/30' : 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:shadow-teal-500/30'
            }`}>
            <FiPlus size={18} /> Create {tForm.role === 'trainer' ? 'Trainer' : 'Promo'} Account
          </button>
        </form>

        {/* STAFF LIST (Glass Panel) */}
        <div className="glass-panel p-6 rounded-[2rem] flex flex-col h-[500px] shadow-lg border-white/60 overflow-hidden">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight">
              {tForm.role === 'trainer' ? 'Trainers' : 'Promo Team'}
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-full border border-black/5 dark:border-white/5">
                {tForm.role === 'trainer' ? trainers.length : promoUsers.length}
              </span>
            </h3>
          </div>

          <div className="overflow-y-auto custom-scrollbar pr-2 flex-1 space-y-3">
            {tForm.role === 'trainer' ? (
              <>
                {trainers.length === 0 && <p className="p-10 text-center text-gray-500 dark:text-gray-400 font-medium">No trainers added yet.</p>}
                {trainers.map((t) => (
                  <div key={t._id} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/50 dark:border-slate-700/50 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-500/20">
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-gray-900 dark:text-white truncate">{t.name}</p>
                        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate">{t.email}</p>
                      </div>
                    </div>
                    <select value={t.domain || ''} onChange={(e) => changeDomain(t._id, e.target.value)} className="text-xs font-bold text-gray-700 dark:text-gray-300 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-2 cursor-pointer w-full sm:w-auto outline-none focus:ring-2 focus:ring-blue-500/50">
                      <option value="">No Domain</option>
                      {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                ))}
              </>
            ) : (
              <>
                {promoUsers.length === 0 && <p className="p-10 text-center text-gray-500 dark:text-gray-400 font-medium">No promo team members added yet.</p>}
                {promoUsers.map((p) => (
                  <div key={p._id} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/50 dark:border-slate-700/50 p-4 rounded-2xl flex justify-between items-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold text-sm shrink-0 border border-teal-500/20">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-gray-900 dark:text-white truncate">{p.name}</p>
                        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate">{p.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-teal-700 dark:text-teal-300 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider shrink-0 shadow-sm">Promo</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {tForm.role === 'trainer' && (
        <div className="grid lg:grid-cols-3 gap-8 items-start">

          {/* CREATE BATCH FORM (Glass Panel) */}
          <form onSubmit={addBatch} className="glass-panel p-8 rounded-[2rem] lg:col-span-1 shadow-lg border-white/60 h-fit sticky top-6">
            <h3 className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight mb-6">Create New Batch</h3>

            <div className="space-y-4">
              <input required placeholder="Batch Code (e.g. JAVA-EVE-01)" value={bForm.batchCode} onChange={(e) => setBForm({ ...bForm, batchCode: e.target.value })} className="apple-input font-bold" />
              <input required placeholder="Subject (e.g. Core Java)" value={bForm.subject} onChange={(e) => setBForm({ ...bForm, subject: e.target.value })} className="apple-input" />

              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                <select required value={bForm.trainerId} onChange={(e) => setBForm({ ...bForm, trainerId: e.target.value })} className="apple-input pl-11 cursor-pointer">
                  <option value="">Select Trainer</option>
                  {trainers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Venue" value={bForm.venue} onChange={(e) => setBForm({ ...bForm, venue: e.target.value })} className="apple-input" />
                <input placeholder="Location" value={bForm.location} onChange={(e) => setBForm({ ...bForm, location: e.target.value })} className="apple-input" />
              </div>

              <div className="relative">
                <FiClock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                <input type="number" placeholder="Duration (min)" value={bForm.durationMinutes} onChange={(e) => setBForm({ ...bForm, durationMinutes: e.target.value })} className="apple-input pl-11" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Start (06:00 PM)" value={bForm.scheduledStartTime} onChange={(e) => setBForm({ ...bForm, scheduledStartTime: e.target.value })} className="apple-input" />
                <input placeholder="End (08:00 PM)" value={bForm.scheduledEndTime} onChange={(e) => setBForm({ ...bForm, scheduledEndTime: e.target.value })} className="apple-input" />
              </div>

              <div className="relative">
                <FiUsers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                <input type="number" placeholder="Expected Strength (optional)" value={bForm.expectedStrength} onChange={(e) => setBForm({ ...bForm, expectedStrength: e.target.value })} className="apple-input pl-11" />
              </div>
            </div>

            <button type="submit" className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3.5 rounded-xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all">
              <FiPlus size={18} /> Create Batch
            </button>
          </form>

          {/* BATCHES LIST (Glass Panel Grid) */}
          <div className="lg:col-span-2 flex flex-col h-[700px]">
            <div className="flex items-center justify-between mb-6 px-2">
              <h3 className="font-extrabold text-2xl text-gray-900 dark:text-white tracking-tight">Active Batches</h3>
              <span className="text-sm font-extrabold text-blue-600 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl shadow-sm">
                {batches.length} Total
              </span>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 pr-2 space-y-5">
              {batches.length === 0 && (
                <div className="glass-panel p-16 rounded-[2rem] text-center">
                  <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">No offline batches created yet.</p>
                </div>
              )}
              {batches.map((b) => (
                <div key={b._id} className="glass-panel p-6 rounded-[2rem] hover:-translate-y-1 transition-all duration-300 flex flex-col sm:flex-row justify-between gap-6 shadow-lg border-white/60 group">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-md tracking-wider uppercase shadow-sm">
                        {b.batchCode}
                      </span>
                      <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-md shadow-sm">
                        {b.trainerName}
                      </span>
                    </div>
                    <h4 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">{b.subject}</h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/60 dark:bg-slate-800/60 p-3 rounded-xl border border-white/50 dark:border-slate-700/50 shadow-sm">
                        <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><FiMapPin className="text-blue-500" /> Venue</p>
                        <p className="font-bold text-gray-900 dark:text-white text-sm truncate" title={b.venue}>{b.venue}</p>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 p-3 rounded-xl border border-white/50 dark:border-slate-700/50 shadow-sm">
                        <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><FiClock className="text-purple-500" /> Timing</p>
                        <p className="font-bold text-gray-900 dark:text-white text-xs leading-snug">{b.scheduledStartTime}<br />{b.scheduledEndTime}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col justify-end gap-3 shrink-0">
                    <button onClick={() => viewQr(b)} className="glass-button w-full sm:w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-extrabold hover:bg-blue-600 hover:text-white transition-all shadow-md group">
                      <QRCodeSVG value="dummy" size={20} className="opacity-70 group-hover:opacity-100" />
                    </button>
                    <button onClick={() => delBatch(b._id)} className="glass-button w-full sm:w-12 h-12 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-md">
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* QR MODAL (Glassmorphism) */}
      {qrBatch && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setQrBatch(null)}>
          <div className="glass-panel p-8 rounded-[2.5rem] max-w-sm w-full text-center shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setQrBatch(null)} className="absolute top-5 right-5 p-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full transition-colors">
              <FiX size={20} className="text-gray-500 dark:text-gray-300" />
            </button>

            <h3 className="font-extrabold text-2xl text-gray-900 dark:text-white mb-2 tracking-tight pr-8">{qrBatch.batch.subject}</h3>
            <p className="text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 inline-block px-3 py-1.5 rounded-lg mb-6 shadow-sm">
              {qrBatch.batch.batchCode} • {qrBatch.batch.venue}
            </p>

            <div className="bg-white p-4 rounded-[2rem] border-4 border-gray-100 shadow-inner mb-6 mx-auto w-fit">
              {qrBatch.qrValue ? <QRCodeSVG value={qrBatch.qrValue} size={200} className="rounded-xl" /> : <div className="h-[200px] w-[200px] flex items-center justify-center text-gray-400 font-bold">Loading...</div>}
            </div>

            <button onClick={() => window.print()} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3.5 rounded-xl font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30">
              <FiPrinter size={18} /> Print QR Code
            </button>

            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-5 leading-relaxed px-4">
              Stick this at the venue. The trainer scans it via their dashboard to check in and out.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBatches;