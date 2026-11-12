import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { FiPlus, FiTrash2, FiX, FiPrinter, FiUsers, FiClock, FiMapPin, FiSettings } from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const emptyStaff = { name: '', email: '', password: '', domain: [], role: 'trainer' };
const emptyBatch = { batchCode: '', subject: '', trainerId: '', venue: '', location: '', scheduledStartTime: '', scheduledEndTime: '', durationMinutes: 60, expectedStrength: '' };

const inputCls = "apple-input w-full";
const labelCls = "block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest pl-1";
const btnCls = "w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-xl font-extrabold shadow-lg shadow-blue-500/30 transition-transform hover:scale-[0.98] flex items-center justify-center gap-2 text-[15px] disabled:opacity-60";

const AdminBatches = () => {
  const [trainers, setTrainers] = useState([]);
  const [promoUsers, setPromoUsers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [tForm, setTForm] = useState(emptyStaff);
  const [bForm, setBForm] = useState(emptyBatch);
  const [qrBatch, setQrBatch] = useState(null);

  // Dynamic Domains State
  const [domainsList, setDomainsList] = useState([]);
  const [isManagingDomains, setIsManagingDomains] = useState(false);
  const [newDomainName, setNewDomainName] = useState('');

  const load = async () => {
    try {
      const [t, b, p, dRes] = await Promise.all([
        axios.get(`${API}/trainers/overview`, cfg()).catch(() => ({ data: [] })),
        axios.get(`${API}/batches`, cfg()).catch(() => ({ data: [] })),
        axios.get(`${API}/users?role=promotional`, cfg()).catch(() => ({ data: [] })),
        axios.get(`${API}/domains`, cfg()).catch(() => ({ data: [] }))
      ]);
      setTrainers(t.data || []);
      setBatches(b.data || []);
      setPromoUsers(p.data || []);
      setDomainsList(dRes.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  // Form toggle for multi-select domains
  const toggleFormDomain = (d) => {
    setTForm(prev => {
      const newDomains = prev.domain.includes(d) 
        ? prev.domain.filter(item => item !== d) 
        : [...prev.domain, d];
      return { ...prev, domain: newDomains };
    });
  };

  const addStaff = async (e) => {
    e.preventDefault();
    try {
      if (tForm.role === 'trainer') {
        const { role, ...account } = tForm;
        await axios.post(`${API}/trainers`, account, cfg());
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

  // Toggle domain array for an existing trainer
  const toggleTrainerDomain = async (trainer, d) => {
    const currentDomains = Array.isArray(trainer.domain) ? trainer.domain : (trainer.domain ? [trainer.domain] : []);
    const newDomains = currentDomains.includes(d)
      ? currentDomains.filter(item => item !== d)
      : [...currentDomains, d];

    try {
      await axios.put(`${API}/trainers/${trainer._id}/domain`, { domain: newDomains }, cfg());
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not change the domain');
    }
  };

  // ADD NEW DOMAIN
  const handleAddDomain = async () => {
    if (!newDomainName.trim()) return;
    try {
      await axios.post(`${API}/domains`, { name: newDomainName.trim() }, cfg());
      setNewDomainName('');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add domain');
    }
  };

  // DELETE EXISTING DOMAIN
  const handleDeleteDomain = async (id) => {
    if (!window.confirm('Delete this domain? It will still remain on trainers who already have it, but cannot be assigned to new ones.')) return;
    try {
      await axios.delete(`${API}/domains/${id}`, cfg());
      load();
    } catch (err) {
      alert('Failed to delete domain');
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
    <div className="space-y-10 max-w-7xl mx-auto pb-16 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-[1.2rem] border border-gray-200 dark:border-slate-700 shadow-sm shrink-0">
          <FiUsers className="text-blue-600 dark:text-blue-400" size={32} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">Batches & Staff</h1>
          <p className="text-[15px] font-medium text-gray-500 dark:text-gray-400 mt-1">Manage trainers, promo team, and offline batches.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* ADD STAFF FORM */}
        <form onSubmit={addStaff} className="glass-panel bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] flex flex-col h-full shadow-sm border border-gray-200 dark:border-slate-700">
          <h3 className="font-black text-2xl text-gray-900 dark:text-white tracking-tight mb-8">Add Staff Account</h3>

          <div className="flex gap-3 mb-8 bg-gray-50 dark:bg-slate-800 p-2 rounded-[1.2rem] border border-gray-200 dark:border-slate-700 shadow-inner">
            <button
              type="button"
              onClick={() => setTForm({ ...tForm, role: 'trainer' })}
              className={`flex-1 py-3 rounded-xl text-[13px] font-extrabold transition-all duration-300 ${
                tForm.role === 'trainer' 
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-slate-700' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-transparent'
              }`}
            >
              Trainer
            </button>
            <button
              type="button"
              onClick={() => setTForm({ ...tForm, role: 'promotional' })}
              className={`flex-1 py-3 rounded-xl text-[13px] font-extrabold transition-all duration-300 ${
                tForm.role === 'promotional' 
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm border border-gray-200 dark:border-slate-700' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-transparent'
              }`}
            >
              Promo Team
            </button>
          </div>

          <div className="space-y-6 flex-1">
            <div>
              <label className={labelCls}>Full Name</label>
              <input required placeholder="Enter full name" value={tForm.name} onChange={(e) => setTForm({ ...tForm, name: e.target.value })} className={`${inputCls} font-bold`} />
            </div>
            <div>
              <label className={labelCls}>Email Address</label>
              <input required type="email" placeholder="you@example.com" value={tForm.email} onChange={(e) => setTForm({ ...tForm, email: e.target.value })} className={`${inputCls} font-bold`} />
            </div>
            <div>
              <label className={labelCls}>Set Password</label>
              <input required type="text" placeholder="Create a password" value={tForm.password} onChange={(e) => setTForm({ ...tForm, password: e.target.value })} className={`${inputCls} font-bold`} />
            </div>

            {tForm.role === 'trainer' && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Domain Assignment</label>
                  <button 
                    type="button" 
                    onClick={() => setIsManagingDomains(!isManagingDomains)}
                    className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md"
                  >
                    <FiSettings size={12}/> {isManagingDomains ? 'Done' : 'Manage'}
                  </button>
                </div>

                {isManagingDomains ? (
                  <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 animate-fade-in space-y-4">
                    <div className="flex gap-2">
                      <input 
                        placeholder="Add new domain..." 
                        value={newDomainName} 
                        onChange={e => setNewDomainName(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddDomain())}
                        className={`${inputCls} py-2.5 text-[13px] font-bold`} 
                      />
                      <button type="button" onClick={handleAddDomain} className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-xl shadow-sm transition-colors">
                        <FiPlus size={18} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {domainsList.length === 0 && <p className="text-xs text-gray-500 font-bold w-full text-center">No domains added yet.</p>}
                      {domainsList.map(dObj => (
                         <span key={dObj._id} className="pl-3 pr-2 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 flex items-center gap-2 shadow-sm text-gray-700 dark:text-gray-300">
                           {dObj.name}
                           <button type="button" onClick={() => handleDeleteDomain(dObj._id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 p-1 rounded-md transition-colors">
                             <FiX size={14} />
                           </button>
                         </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2.5 animate-fade-in">
                    {domainsList.length === 0 && <p className="text-xs text-gray-500 font-bold">No domains available. Click Manage to add.</p>}
                    {domainsList.map((dObj) => {
                      const d = dObj.name;
                      const isSel = tForm.domain.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleFormDomain(d)}
                          className={`px-3.5 py-2 rounded-xl text-[11px] font-extrabold uppercase tracking-widest border transition-all shadow-sm ${
                            isSel
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                              : 'bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {d}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <button className={`${btnCls} mt-8 ${tForm.role === 'trainer' ? 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' : 'from-teal-500 to-emerald-600 shadow-teal-500/30 hover:from-teal-600 hover:to-emerald-700'}`}>
            <FiPlus size={18} /> Create {tForm.role === 'trainer' ? 'Trainer' : 'Promo'} Account
          </button>
        </form>

        {/* STAFF LIST */}
        <div className="glass-panel bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] flex flex-col h-[700px] shadow-sm overflow-hidden border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-8">
             <h3 className="font-black text-2xl text-gray-900 dark:text-white tracking-tight">
               {tForm.role === 'trainer' ? 'Trainers' : 'Promo Team'} 
             </h3>
             <span className="text-[11px] font-extrabold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3.5 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm uppercase tracking-wider">
                 {tForm.role === 'trainer' ? trainers.length : promoUsers.length} Total
             </span>
          </div>
          
          <div className="overflow-y-auto custom-scrollbar flex-1 space-y-4 pr-3">
            {tForm.role === 'trainer' ? (
              <>
                {trainers.length === 0 && <p className="p-10 text-center text-gray-500 dark:text-gray-400 font-extrabold text-lg">No trainers added yet.</p>}
                {trainers.map((t) => (
                  <div key={t._id} className="bg-gray-50 dark:bg-slate-800/80 p-5 rounded-[1.5rem] flex flex-col hover:border-blue-300 dark:hover:border-blue-700 border border-gray-200 dark:border-slate-700 transition-colors shadow-sm">
                    <div className="flex items-center gap-4 min-w-0 mb-4">
                      <div className="w-12 h-12 rounded-[1rem] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center font-black text-[17px] shrink-0 border border-blue-200 dark:border-blue-800 shadow-sm">
                         {t.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-gray-900 dark:text-white truncate text-[15px] tracking-tight">{t.name}</p>
                        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate mt-1">{t.email}</p>
                      </div>
                    </div>
                    
                    {/* Multi-Select Pills for Trainer Row */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200 dark:border-slate-700">
                      {domainsList.map(dObj => {
                        const d = dObj.name;
                        const tDomains = Array.isArray(t.domain) ? t.domain : [];
                        const isSel = tDomains.includes(d);
                        return (
                          <button
                            key={d}
                            onClick={() => toggleTrainerDomain(t, d)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-widest border transition-colors shadow-sm ${
                              isSel
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                                : 'bg-white dark:bg-slate-900 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            {d}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                {promoUsers.length === 0 && <p className="p-10 text-center text-gray-500 dark:text-gray-400 font-extrabold text-lg">No promo team members added yet.</p>}
                {promoUsers.map((p) => (
                  <div key={p._id} className="bg-gray-50 dark:bg-slate-800/80 p-5 rounded-[1.5rem] flex justify-between items-center hover:border-teal-300 dark:hover:border-teal-700 border border-gray-200 dark:border-slate-700 transition-colors shadow-sm">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-[1rem] bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 flex items-center justify-center font-black text-[17px] shrink-0 border border-teal-200 dark:border-teal-800 shadow-sm">
                         {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-gray-900 dark:text-white truncate text-[15px] tracking-tight">{p.name}</p>
                        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate mt-1">{p.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 px-3.5 py-1.5 rounded-lg uppercase tracking-wider shrink-0 shadow-sm">Promo</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start pt-10 mt-10 border-t border-gray-200 dark:border-slate-700">
        
        {/* CREATE BATCH FORM */}
        <form onSubmit={addBatch} className="glass-panel bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] lg:col-span-1 shadow-sm h-fit sticky top-6 border border-gray-200 dark:border-slate-700">
          <h3 className="font-black text-2xl text-gray-900 dark:text-white tracking-tight mb-8">Create New Batch</h3>
          
          <div className="space-y-6">
            <div>
              <label className={labelCls}>Batch Code *</label>
              <input required placeholder="e.g. JAVA-EVE-01" value={bForm.batchCode} onChange={(e) => setBForm({ ...bForm, batchCode: e.target.value })} className={`${inputCls} font-black uppercase text-[15px]`} />
            </div>
            <div>
              <label className={labelCls}>Subject *</label>
              <input required placeholder="e.g. Core Java" value={bForm.subject} onChange={(e) => setBForm({ ...bForm, subject: e.target.value })} className={`${inputCls} font-bold text-[15px]`} />
            </div>
            
            <div>
              <label className={labelCls}>Assign Trainer *</label>
              <select required value={bForm.trainerId} onChange={(e) => setBForm({ ...bForm, trainerId: e.target.value })} className={`${inputCls} cursor-pointer font-bold text-[15px]`}>
                <option value="">-- Select Trainer --</option>
                {trainers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className={labelCls}>Venue *</label>
                 <input required placeholder="Room 101" value={bForm.venue} onChange={(e) => setBForm({ ...bForm, venue: e.target.value })} className={`${inputCls} font-bold`} />
               </div>
               <div>
                 <label className={labelCls}>Location</label>
                 <input placeholder="e.g. Jayanagar" value={bForm.location} onChange={(e) => setBForm({ ...bForm, location: e.target.value })} className={`${inputCls} font-bold`} />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Start Time</label>
                <input placeholder="06:00 PM" value={bForm.scheduledStartTime} onChange={(e) => setBForm({ ...bForm, scheduledStartTime: e.target.value })} className={`${inputCls} font-bold`} />
              </div>
              <div>
                <label className={labelCls}>End Time</label>
                <input placeholder="08:00 PM" value={bForm.scheduledEndTime} onChange={(e) => setBForm({ ...bForm, scheduledEndTime: e.target.value })} className={`${inputCls} font-bold`} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Mins</label>
                <input type="number" placeholder="60" value={bForm.durationMinutes} onChange={(e) => setBForm({ ...bForm, durationMinutes: e.target.value })} className={`${inputCls} font-bold`} />
              </div>
              <div>
                <label className={labelCls}>Strength</label>
                <input type="number" placeholder="Optional" value={bForm.expectedStrength} onChange={(e) => setBForm({ ...bForm, expectedStrength: e.target.value })} className={`${inputCls} font-bold`} />
              </div>
            </div>
          </div>

          <button type="submit" className={`${btnCls} mt-10`}>
            <FiPlus size={18} /> Create Batch
          </button>
        </form>

        {/* BATCHES LIST */}
        <div className="lg:col-span-2 flex flex-col h-[900px]">
          <div className="flex items-center justify-between mb-8">
             <h3 className="font-black text-3xl text-gray-900 dark:text-white tracking-tight">Active Batches</h3>
             <span className="text-[11px] font-extrabold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-4 py-2 rounded-xl shadow-sm uppercase tracking-wider">
               {batches.length} Total
             </span>
          </div>

          <div className="overflow-y-auto custom-scrollbar flex-1 pr-3 space-y-6">
            {batches.length === 0 && (
              <div className="glass-panel bg-white dark:bg-slate-900 p-16 rounded-[2.5rem] border border-gray-200 dark:border-slate-700 text-center">
                 <p className="text-gray-500 dark:text-gray-400 font-bold text-xl">No offline batches created yet.</p>
              </div>
            )}
            {batches.map((b) => (
              <div key={b._id} className="glass-panel bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] hover:-translate-y-1 transition-all duration-300 flex flex-col sm:flex-row justify-between gap-8 shadow-sm group border border-gray-200 dark:border-slate-700">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-5">
                    <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-3.5 py-1.5 rounded-lg tracking-widest uppercase shadow-sm">
                      {b.batchCode}
                    </span>
                    <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 px-3.5 py-1.5 rounded-lg shadow-sm uppercase tracking-widest">
                      {b.trainerName}
                    </span>
                  </div>
                  <h4 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mb-8 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{b.subject}</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-slate-800 p-5 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-sm">
                      <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FiMapPin className="text-blue-500"/> Venue</p>
                      <p className="font-black text-gray-900 dark:text-white text-[15px] truncate" title={b.venue}>{b.venue}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-800 p-5 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-sm">
                      <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FiClock className="text-purple-500"/> Timing</p>
                      <p className="font-black text-gray-900 dark:text-white text-[15px] leading-snug truncate">{b.scheduledStartTime} - {b.scheduledEndTime}</p>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col justify-end gap-3 shrink-0 mt-2 sm:mt-0">
                  <button onClick={() => viewQr(b)} className="glass-button w-full sm:w-14 h-14 rounded-[1.2rem] bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-extrabold hover:bg-blue-600 hover:text-white transition-colors shadow-sm border border-gray-200 dark:border-slate-700">
                    <QRCodeSVG value="dummy" size={24} className="opacity-100 sm:opacity-70 sm:group-hover:opacity-100" />
                  </button>
                  <button onClick={() => delBatch(b._id)} className="glass-button w-full sm:w-14 h-14 rounded-[1.2rem] bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 dark:text-red-400 hover:bg-red-600 hover:text-white transition-colors shadow-sm border border-red-200 dark:border-red-800/50">
                    <FiTrash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QR MODAL */}
      {qrBatch && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setQrBatch(null)}>
          <div className="glass-panel bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-8 md:p-12 rounded-[3rem] max-w-md w-full text-center shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setQrBatch(null)} className="absolute top-6 right-6 p-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors border border-gray-200 dark:border-slate-700 shadow-sm">
              <FiX size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            
            <h3 className="font-black text-3xl text-gray-900 dark:text-white mb-4 tracking-tight pr-8">{qrBatch.batch.subject}</h3>
            <p className="text-[11px] font-extrabold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 inline-block px-4 py-2 rounded-xl mb-8 shadow-sm uppercase tracking-wider">
              {qrBatch.batch.batchCode} | {qrBatch.batch.venue}
            </p>
            
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm mb-8 mx-auto w-fit">
              {qrBatch.qrValue ? <QRCodeSVG value={qrBatch.qrValue} size={240} className="rounded-xl" /> : <div className="h-[240px] w-[240px] flex items-center justify-center text-gray-400 font-bold">Loading...</div>}
            </div>
            
            <button onClick={() => window.print()} className={btnCls}>
              <FiPrinter size={18} /> Print QR Code
            </button>
            
            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mt-6 leading-relaxed px-2">
              Stick this at the venue. The trainer scans it via their dashboard to check in and out.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBatches;