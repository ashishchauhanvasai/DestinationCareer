import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { FiPlus, FiTrash2, FiX, FiPrinter, FiUsers, FiClock, FiMapPin } from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const DOMAINS = ['Java', 'Python', 'Data Analytics', 'Frontend'];
const emptyStaff = { name: '', email: '', password: '', domain: '', role: 'trainer' };
const emptyBatch = { batchCode: '', subject: '', trainerId: '', venue: '', location: '', scheduledStartTime: '', scheduledEndTime: '', durationMinutes: 60, expectedStrength: '' };

const inputCls = "apple-input";
const labelCls = "block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-widest pl-1";
const btnCls = "w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-xl font-extrabold shadow-lg shadow-blue-500/30 transition-transform hover:scale-[0.98] flex items-center justify-center gap-2 text-[15px] disabled:opacity-60";

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
    <div className="space-y-10 max-w-7xl mx-auto pb-12">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3.5 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl border border-blue-500/20 shadow-sm shrink-0">
          <FiUsers className="text-blue-600 dark:text-blue-400" size={28} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Batches & Staff</h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Manage trainers, promo team, and offline batches.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* ADD STAFF FORM (Solid Structural Panel) */}
        <form onSubmit={addStaff} className="glass-panel p-6 md:p-8 rounded-[2.5rem] flex flex-col h-full shadow-sm">
          <h3 className="font-extrabold text-2xl text-gray-900 dark:text-white tracking-tight mb-8">Add Staff Account</h3>

          <div className="flex gap-4 mb-8 bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setTForm({ ...tForm, role: 'trainer' })}
              className={`flex-1 py-3 rounded-xl text-sm font-extrabold transition-all duration-300 ${
                tForm.role === 'trainer' 
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-slate-600' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Trainer
            </button>
            <button
              type="button"
              onClick={() => setTForm({ ...tForm, role: 'promotional' })}
              className={`flex-1 py-3 rounded-xl text-sm font-extrabold transition-all duration-300 ${
                tForm.role === 'promotional' 
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm border border-gray-200 dark:border-slate-600' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Promo Team
            </button>
          </div>

          <div className="space-y-5 flex-1">
            <div>
              <label className={labelCls}>Full Name</label>
              <input required placeholder="Enter full name" value={tForm.name} onChange={(e) => setTForm({ ...tForm, name: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email Address</label>
              <input required type="email" placeholder="you@example.com" value={tForm.email} onChange={(e) => setTForm({ ...tForm, email: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Set Password</label>
              <input required type="text" placeholder="Create a password" value={tForm.password} onChange={(e) => setTForm({ ...tForm, password: e.target.value })} className={inputCls} />
            </div>

            {tForm.role === 'trainer' && (
              <div>
                <label className={labelCls}>Domain (Optional)</label>
                <select value={tForm.domain} onChange={(e) => setTForm({ ...tForm, domain: e.target.value })} className={`${inputCls} cursor-pointer`}>
                  <option value="">-- Select Domain --</option>
                  {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}
          </div>

          <button className={`${btnCls} mt-8 ${tForm.role === 'trainer' ? 'from-blue-600 to-indigo-600' : 'from-teal-500 to-emerald-600 shadow-teal-500/30 hover:from-teal-600 hover:to-emerald-700'}`}>
            <FiPlus size={18} /> Create {tForm.role === 'trainer' ? 'Trainer' : 'Promo'} Account
          </button>
        </form>

        {/* STAFF LIST (Solid Structural Panel) */}
        <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] flex flex-col h-[650px] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-6">
             <h3 className="font-extrabold text-2xl text-gray-900 dark:text-white tracking-tight">
               {tForm.role === 'trainer' ? 'Trainers' : 'Promo Team'} 
             </h3>
             <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 shadow-sm uppercase tracking-wider">
                 {tForm.role === 'trainer' ? trainers.length : promoUsers.length} Total
             </span>
          </div>
          
          <div className="overflow-y-auto custom-scrollbar flex-1 space-y-4 pr-1">
            {tForm.role === 'trainer' ? (
              <>
                {trainers.length === 0 && <p className="p-10 text-center text-gray-500 dark:text-gray-400 font-extrabold text-lg">No trainers added yet.</p>}
                {trainers.map((t) => (
                  <div key={t._id} className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-[1.5rem] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-blue-300 dark:hover:border-blue-700 border border-gray-200 dark:border-slate-700 transition-colors shadow-sm">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-center justify-center font-extrabold text-lg shrink-0 border border-blue-500/20">
                         {t.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-gray-900 dark:text-white truncate text-[15px]">{t.name}</p>
                        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate mt-0.5">{t.email}</p>
                      </div>
                    </div>
                    <select value={t.domain || ''} onChange={(e) => changeDomain(t._id, e.target.value)} className="w-full sm:w-auto p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer shadow-sm outline-none focus:ring-2 focus:ring-blue-500/50">
                      <option value="">No Domain</option>
                      {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                ))}
              </>
            ) : (
              <>
                {promoUsers.length === 0 && <p className="p-10 text-center text-gray-500 dark:text-gray-400 font-extrabold text-lg">No promo team members added yet.</p>}
                {promoUsers.map((p) => (
                  <div key={p._id} className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-[1.5rem] flex justify-between items-center hover:border-teal-300 dark:hover:border-teal-700 border border-gray-200 dark:border-slate-700 transition-colors shadow-sm">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-400 flex items-center justify-center font-extrabold text-lg shrink-0 border border-teal-500/20">
                         {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-gray-900 dark:text-white truncate text-[15px]">{p.name}</p>
                        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate mt-0.5">{p.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-teal-700 dark:text-teal-300 bg-teal-500/10 border border-teal-500/20 px-3 py-1.5 rounded-lg uppercase tracking-wider shrink-0 shadow-sm">Promo</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start pt-4 border-t-2 border-gray-200 dark:border-slate-800">
        
        {/* CREATE BATCH FORM (Solid Structural Panel) */}
        <form onSubmit={addBatch} className="glass-panel p-6 md:p-8 rounded-[2.5rem] lg:col-span-1 shadow-sm h-fit sticky top-6">
          <h3 className="font-extrabold text-2xl text-gray-900 dark:text-white tracking-tight mb-8">Create New Batch</h3>
          
          <div className="space-y-5">
            <div>
              <label className={labelCls}>Batch Code *</label>
              <input required placeholder="e.g. JAVA-EVE-01" value={bForm.batchCode} onChange={(e) => setBForm({ ...bForm, batchCode: e.target.value })} className={`${inputCls} font-extrabold uppercase`} />
            </div>
            <div>
              <label className={labelCls}>Subject *</label>
              <input required placeholder="e.g. Core Java" value={bForm.subject} onChange={(e) => setBForm({ ...bForm, subject: e.target.value })} className={inputCls} />
            </div>
            
            <div>
              <label className={labelCls}>Assign Trainer *</label>
              <select required value={bForm.trainerId} onChange={(e) => setBForm({ ...bForm, trainerId: e.target.value })} className={`${inputCls} cursor-pointer`}>
                <option value="">-- Select Trainer --</option>
                {trainers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className={labelCls}>Venue *</label>
                 <input required placeholder="Room 101" value={bForm.venue} onChange={(e) => setBForm({ ...bForm, venue: e.target.value })} className={inputCls} />
               </div>
               <div>
                 <label className={labelCls}>Location</label>
                 <input placeholder="e.g. Jayanagar" value={bForm.location} onChange={(e) => setBForm({ ...bForm, location: e.target.value })} className={inputCls} />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Start Time</label>
                <input placeholder="06:00 PM" value={bForm.scheduledStartTime} onChange={(e) => setBForm({ ...bForm, scheduledStartTime: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>End Time</label>
                <input placeholder="08:00 PM" value={bForm.scheduledEndTime} onChange={(e) => setBForm({ ...bForm, scheduledEndTime: e.target.value })} className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Mins</label>
                <input type="number" placeholder="60" value={bForm.durationMinutes} onChange={(e) => setBForm({ ...bForm, durationMinutes: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Strength</label>
                <input type="number" placeholder="Optional" value={bForm.expectedStrength} onChange={(e) => setBForm({ ...bForm, expectedStrength: e.target.value })} className={inputCls} />
              </div>
            </div>
          </div>

          <button type="submit" className={`${btnCls} mt-8`}>
            <FiPlus size={18} /> Create Batch
          </button>
        </form>

        {/* BATCHES LIST (Solid Grid) */}
        <div className="lg:col-span-2 flex flex-col h-[900px]">
          <div className="flex items-center justify-between mb-6">
             <h3 className="font-extrabold text-3xl text-gray-900 dark:text-white tracking-tight">Active Batches</h3>
             <span className="text-[11px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl shadow-sm uppercase tracking-wider">
               {batches.length} Total
             </span>
          </div>

          <div className="overflow-y-auto custom-scrollbar flex-1 pr-2 space-y-6">
            {batches.length === 0 && (
              <div className="glass-panel p-16 rounded-[2.5rem] text-center">
                 <p className="text-gray-500 dark:text-gray-400 font-extrabold text-xl">No offline batches created yet.</p>
              </div>
            )}
            {batches.map((b) => (
              <div key={b._id} className="glass-panel p-6 md:p-8 rounded-[2.5rem] hover:-translate-y-1 transition-all duration-300 flex flex-col sm:flex-row justify-between gap-6 shadow-sm group">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg tracking-wider uppercase shadow-sm">
                      {b.batchCode}
                    </span>
                    <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-lg shadow-sm uppercase tracking-wider">
                      {b.trainerName}
                    </span>
                  </div>
                  <h4 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6">{b.subject}</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-slate-800/80 p-4 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-sm">
                      <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FiMapPin className="text-blue-500"/> Venue</p>
                      <p className="font-bold text-gray-900 dark:text-white text-[13px] truncate" title={b.venue}>{b.venue}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-800/80 p-4 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-sm">
                      <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FiClock className="text-purple-500"/> Timing</p>
                      <p className="font-bold text-gray-900 dark:text-white text-[13px] leading-snug truncate">{b.scheduledStartTime} - {b.scheduledEndTime}</p>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col justify-end gap-3 shrink-0 mt-2 sm:mt-0">
                  <button onClick={() => viewQr(b)} className="glass-button w-full sm:w-14 h-14 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-extrabold hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-gray-200 dark:border-slate-700">
                    <QRCodeSVG value="dummy" size={24} className="opacity-100 sm:opacity-70 sm:group-hover:opacity-100" />
                  </button>
                  <button onClick={() => delBatch(b._id)} className="glass-button w-full sm:w-14 h-14 rounded-2xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-gray-200 dark:border-slate-700">
                    <FiTrash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QR MODAL (Structural Pop-up) */}
      {qrBatch && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setQrBatch(null)}>
          <div className="glass-panel p-8 md:p-10 rounded-[3rem] max-w-sm w-full text-center shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setQrBatch(null)} className="absolute top-6 right-6 p-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors border border-gray-200 dark:border-slate-600">
              <FiX size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
            
            <h3 className="font-extrabold text-3xl text-gray-900 dark:text-white mb-3 tracking-tight pr-8">{qrBatch.batch.subject}</h3>
            <p className="text-[11px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 inline-block px-4 py-2 rounded-xl mb-8 shadow-sm uppercase tracking-wider">
              {qrBatch.batch.batchCode} • {qrBatch.batch.venue}
            </p>
            
            <div className="bg-white p-5 rounded-[2.5rem] border border-gray-200 shadow-inner mb-8 mx-auto w-fit">
              {qrBatch.qrValue ? <QRCodeSVG value={qrBatch.qrValue} size={220} className="rounded-xl" /> : <div className="h-[220px] w-[220px] flex items-center justify-center text-gray-400 font-bold">Loading...</div>}
            </div>
            
            <button onClick={() => window.print()} className={btnCls}>
              <FiPrinter size={18} /> Print QR Code
            </button>
            
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-6 leading-relaxed px-2">
              Stick this at the venue. The trainer scans it via their dashboard to check in and out.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBatches;