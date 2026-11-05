import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FiEdit, FiTrash2, FiSearch, FiX, FiAward } from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api/trainer`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const emptyForm = { studentName: '', metric: '', imageUrl: '', category: '' };

const inputStyles = "apple-input w-full font-bold text-[13px]";
const labelCls = "block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1";

const TrainerPerformers = () => {
  const role = localStorage.getItem('role');
  const isSuperAdmin = role === 'superadmin' || role === 'admin';

  const [domain, setDomain] = useState(null); 
  const [performers, setPerformers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filters for SuperAdmin
  const [filterDomain, setFilterDomain] = useState('All');

  const load = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/performers`, cfg());
      setDomain(r.data.domain);
      setPerformers(r.data.performers);
    } catch (e) {
      console.error(e);
      setDomain('');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await axios.get(`${API}/search-students?q=${searchQuery}`, cfg());
        setSearchResults(res.data);
      } catch (err) {
        console.error("Search failed");
      } finally {
        setIsSearching(false);
      }
    }, 500); 
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectStudent = (student) => {
    setForm({
      ...form,
      studentName: student.name,
      imageUrl: student.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.studentName) return alert("Please select a student from the search.");
    if (isSuperAdmin && !form.category && !editingId) return alert("Please select a domain/category for this student.");

    setSaving(true);
    try {
      if (editingId) {
        const res = await axios.put(`${API}/performers/${editingId}`, form, cfg());
        setPerformers(performers.map(p => p._id === editingId ? res.data : p));
      } else {
        const res = await axios.post(`${API}/performers`, form, cfg());
        setPerformers([res.data, ...performers]);
      }
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) { alert(err.response?.data?.message || 'Could not save'); } 
    finally { setSaving(false); }
  };

  const startEdit = (p) => {
    setEditingId(p._id);
    setForm({ studentName: p.studentName, metric: p.metric, imageUrl: p.imageUrl || '', category: p.category });
    setSearchQuery('');
    setSearchResults([]);
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this top performer?')) return;
    try {
      await axios.delete(`${API}/performers/${id}`, cfg());
      setPerformers(performers.filter(p => p._id !== id));
      if (editingId === id) { setEditingId(null); setForm(emptyForm); }
    } catch (err) { alert(err.response?.data?.message || 'Could not delete'); }
  };

  if (domain === null) return <div className="h-[50vh] flex items-center justify-center font-bold text-gray-500 animate-pulse text-lg">Loading Performers...</div>;

  if (!isSuperAdmin && !domain) {
    return (
      <div className="max-w-xl mx-auto glass-panel bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-[2.5rem] p-12 text-center mt-10 shadow-sm animate-fade-in">
        <div className="w-24 h-24 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-yellow-200 dark:border-yellow-800 shadow-sm"><FiAward size={40} /></div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Top Performers</h1>
        <p className="text-gray-600 dark:text-gray-300 font-medium leading-relaxed text-[15px]">
          Your domain is not set yet. Ask the super admin to set it (Java, Python, Data Analytics or Frontend), then come back.
        </p>
      </div>
    );
  }

  const displayedPerformers = filterDomain === 'All' ? performers : performers.filter(p => p.category === filterDomain);

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-8 px-4 sm:px-6 animate-fade-in pb-12">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 rounded-[1.2rem] flex items-center justify-center border border-yellow-200 dark:border-yellow-800 shadow-sm shrink-0">
             <FiAward size={28} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">Top Performers</h1>
            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mt-1.5 opacity-90">
              {isSuperAdmin 
                ? "Manage top performers across all domains globally." 
                : <>You manage the <b className="text-blue-600 dark:text-blue-400 font-bold">{domain}</b> category. Students see these on their dashboard.</>}
            </p>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="w-full sm:w-64">
             <select 
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
              className="apple-input cursor-pointer font-extrabold text-[13px] shadow-sm w-full"
            >
              <option value="All">All Domains</option>
              <option value="Java">Java</option>
              <option value="Python">Python</option>
              <option value="Data Analytics">Data Analytics</option>
              <option value="Frontend">Frontend</option>
            </select>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        
        {/* ADD/EDIT FORM */}
        <div className="lg:col-span-1">
          <form
            onSubmit={submit}
            className={`glass-panel bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm space-y-6 sticky top-24 transition-all duration-300 border border-gray-200 dark:border-slate-700 ${
              editingId ? 'ring-2 ring-blue-500 shadow-md' : ''
            }`}
          >
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-slate-700 pb-5">
              <h3 className="font-black text-xl md:text-2xl text-gray-900 dark:text-white tracking-tight">
                {editingId ? 'Edit Performer' : 'Add Performer'}
              </h3>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="p-2.5 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-full transition-colors text-gray-500 shadow-sm shrink-0">
                  <FiX size={18} />
                </button>
              )}
            </div>

            {!isSuperAdmin ? (
              <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-extrabold uppercase tracking-widest px-3.5 py-1.5 rounded-lg inline-block border border-blue-200 dark:border-blue-800 shadow-sm">
                Domain: {domain}
              </div>
            ) : (
              <div>
                <label className={labelCls}>Select Domain</label>
                <select required value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className={`${inputStyles} cursor-pointer`}>
                  <option value="">-- Choose Domain --</option>
                  <option value="Java">Java</option><option value="Python">Python</option><option value="Data Analytics">Data Analytics</option><option value="Frontend">Frontend</option>
                </select>
              </div>
            )}

            {/* SEARCH STUDENT */}
            <div className="relative">
              <label className={labelCls}>Search Student</label>
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input placeholder="Type name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`${inputStyles} pl-10`} />
              </div>
              
              {searchQuery.length >= 2 && (
                <div className="absolute z-20 w-full mt-2 glass-panel bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-lg max-h-[300px] overflow-y-auto custom-scrollbar border border-gray-200 dark:border-slate-700 p-2">
                  {isSearching ? (
                    <div className="p-5 text-[13px] font-extrabold text-gray-500 text-center animate-pulse">Searching...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-5 text-[13px] font-extrabold text-gray-500 text-center">No students found.</div>
                  ) : (
                    searchResults.map(s => (
                      <button key={s._id} type="button" onClick={() => selectStudent(s)} className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-4 transition-colors">
                        <img src={s.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-12 h-12 rounded-[1rem] object-cover border border-gray-200 dark:border-slate-700 shadow-sm bg-white shrink-0" alt="" />
                        <div className="min-w-0">
                          <div className="text-[15px] font-black text-gray-900 dark:text-white truncate tracking-tight">{s.name}</div>
                          <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate mt-0.5">{s.email}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* SELECTED STUDENT PREVIEW */}
            {form.studentName && (
              <div className="p-4 bg-gray-50 dark:bg-slate-800/80 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-sm flex items-center gap-4 animate-fade-in">
                <img src={form.imageUrl} alt="Profile" className="w-14 h-14 rounded-[1rem] object-cover border border-gray-200 dark:border-slate-700 shadow-sm bg-white shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-extrabold tracking-widest mb-1">Selected Student</p>
                  <p className="font-black text-gray-900 dark:text-white truncate text-[15px]">{form.studentName}</p>
                </div>
              </div>
            )}

            <div>
              <label className={labelCls}>Achievement Detail</label>
              <textarea required placeholder="e.g. 98% score in Mock, Placed at TCS" value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} className={`${inputStyles} resize-none leading-relaxed text-[13px]`} rows="3" />
            </div>

            <button type="submit" disabled={saving || !form.studentName} className={`w-full py-4 rounded-xl font-extrabold text-[15px] text-white flex items-center justify-center gap-2 transition-transform shadow-lg disabled:opacity-60 disabled:scale-100 hover:scale-[0.98] ${editingId ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/30' : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30'}`}>
              {saving ? 'Saving...' : editingId ? 'Update Performer' : 'Publish to Dashboard'}
            </button>
          </form>
        </div>

        {/* PERFORMERS LIST */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 content-start">
          {displayedPerformers.length === 0 && (
            <div className="sm:col-span-2 p-16 glass-panel bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-[2.5rem] text-center shadow-sm">
              <p className="text-gray-500 dark:text-gray-400 font-bold text-xl">No top performers found for {filterDomain === 'All' ? 'any domain' : filterDomain}.</p>
            </div>
          )}
          {displayedPerformers.map((p) => (
            <div key={p._id} className="glass-panel bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-slate-700 group">
              <div className="flex items-start gap-4 mb-5">
                <img src={p.imageUrl} alt="" className="w-16 h-16 rounded-[1.2rem] object-cover border border-gray-200 dark:border-slate-700 bg-white shadow-sm shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 inline-block px-3 py-1.5 rounded-lg uppercase tracking-wider mb-2.5 shadow-sm">
                    {p.category}
                  </p>
                  <p className="font-black text-xl text-gray-900 dark:text-white truncate leading-tight tracking-tight" title={p.studentName}>{p.studentName}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-slate-800 p-5 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-sm mb-5">
                 <p className="text-[13px] font-medium text-gray-700 dark:text-gray-300 leading-relaxed italic">"{p.metric}"</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700 mt-auto">
                <button type="button" onClick={() => startEdit(p)} className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all shadow-sm border border-blue-200 dark:border-blue-800" title="Edit">
                  <FiEdit size={16} />
                </button>
                <button type="button" onClick={() => remove(p._id)} className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all shadow-sm opacity-100 lg:opacity-0 lg:group-hover:opacity-100 border border-red-200 dark:border-red-800" title="Remove">
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrainerPerformers;