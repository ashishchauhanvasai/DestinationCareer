// Save as: src/pages/TrainerPerformers.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FiEdit, FiTrash2, FiSearch, FiX } from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api/trainer`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const emptyForm = { studentName: '', metric: '', imageUrl: '' };

const inputStyles =
  'w-full p-3 border rounded-xl text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors';

const TrainerPerformers = () => {
  const [domain, setDomain] = useState(null); 
  const [performers, setPerformers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

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

  useEffect(() => {
    load();
  }, [load]);

  // Handle Search Input
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
    }, 500); // 500ms debounce
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
    if (!form.studentName) {
      alert("Please select a student from the search.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) await axios.put(`${API}/performers/${editingId}`, form, cfg());
      else await axios.post(`${API}/performers`, form, cfg());
      
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (p) => {
    setEditingId(p._id);
    setForm({ studentName: p.studentName, metric: p.metric, imageUrl: p.imageUrl || '' });
    setSearchQuery('');
    setSearchResults([]);
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this top performer?')) return;
    try {
      await axios.delete(`${API}/performers/${id}`, cfg());
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete');
    }
  };

  if (domain === null) return <p className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</p>;

  if (!domain) {
    return (
      <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl p-8 text-center mt-10">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Top Performers</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Your domain is not set yet. Ask the super admin to set it (Java, Python, Data Analytics or Frontend), then come back.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 mt-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Top Performers</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          You manage the <b className="text-blue-600">{domain}</b> category. Students see these on their dashboard.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* ADD/EDIT FORM */}
        <form
          onSubmit={submit}
          className={`bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 shadow-sm space-y-5 ${
            editingId ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900' : ''
          }`}
        >
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              {editingId ? 'Edit Performer' : 'Add Top Performer'}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                className="text-gray-400 hover:text-gray-600 bg-gray-100 p-1.5 rounded-full"
              >
                <FiX size={18} />
              </button>
            )}
          </div>

          <div className="bg-blue-50 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-md inline-block">
            Domain: {domain}
          </div>

          {/* SEARCH STUDENT (Only show when not actively editing the name, or if they want to change it) */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Search Student</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                placeholder="Type name or email..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className={`${inputStyles} pl-10`} 
              />
            </div>
            
            {/* Search Dropdown */}
            {searchQuery.length >= 2 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {isSearching ? (
                  <div className="p-3 text-sm text-gray-500 text-center">Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500 text-center">No students found.</div>
                ) : (
                  searchResults.map(s => (
                    <button
                      key={s._id}
                      type="button"
                      onClick={() => selectStudent(s)}
                      className="w-full text-left p-2 hover:bg-blue-50 flex items-center gap-3 border-b border-gray-100 last:border-0 transition-colors"
                    >
                      <img src={s.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-8 h-8 rounded-full object-cover border border-gray-200 bg-white" alt="" />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-gray-800 truncate">{s.name}</div>
                        <div className="text-[10px] text-gray-400 truncate">{s.email}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* SELECTED STUDENT PREVIEW */}
          {form.studentName && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
              <img src={form.imageUrl} alt="Profile" className="w-12 h-12 rounded-full object-cover border border-gray-300 bg-white" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold">Selected Student</p>
                <p className="font-semibold text-gray-900">{form.studentName}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Achievement</label>
            <input 
              required 
              placeholder="e.g. 98% score in Mock, Placed at TCS" 
              value={form.metric} 
              onChange={(e) => setForm({ ...form, metric: e.target.value })} 
              className={inputStyles} 
            />
          </div>

          <button 
            type="submit" 
            disabled={saving || !form.studentName} 
            className={`w-full text-white p-3 rounded-xl font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${editingId ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {saving ? 'Saving...' : editingId ? 'Update Performer' : 'Publish to Dashboard'}
          </button>
        </form>

        {/* PERFORMERS LIST */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
          {performers.length === 0 && (
            <div className="sm:col-span-2 p-10 border-2 border-dashed border-gray-200 rounded-2xl text-center text-gray-500">
              No <span className="font-bold">{domain}</span> top performers added yet.
            </div>
          )}
          {performers.map((p) => (
            <div key={p._id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group">
              <div className="flex items-start gap-4 mb-3">
                <img src={p.imageUrl} alt="" className="w-14 h-14 rounded-full object-cover border border-gray-200 bg-gray-50 shadow-sm shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-blue-600 bg-blue-50 inline-block px-2 py-0.5 rounded uppercase tracking-wider mb-1">{p.category}</p>
                  <p className="font-bold text-gray-900 dark:text-white truncate" title={p.studentName}>{p.studentName}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-snug break-words">{p.metric}</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => startEdit(p)} className="text-blue-500 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors" title="Edit">
                  <FiEdit size={14} />
                </button>
                <button type="button" onClick={() => remove(p._id)} className="text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors" title="Remove">
                  <FiTrash2 size={14} />
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