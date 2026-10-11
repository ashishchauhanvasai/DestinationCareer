// Save as: src/pages/TrainerPerformers.js   (NEW file)
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FiEdit, FiTrash2, FiUploadCloud, FiX } from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api/trainer/performers`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const emptyForm = { studentName: '', metric: '', imageUrl: '' };

const inputStyles =
  'w-full p-2 border rounded text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors';

// Shrinks the photo to a 400x400 JPEG so it stays small in the database
const compressSquare = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const S = 400;
      const canvas = document.createElement('canvas');
      canvas.width = S;
      canvas.height = S;
      const ctx = canvas.getContext('2d');
      const scale = Math.max(S / img.width, S / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This file is not a valid image'));
    };
    img.src = url;
  });

const TrainerPerformers = () => {
  const [domain, setDomain] = useState(null); // null = still loading, '' = not set
  const [performers, setPerformers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await axios.get(API, cfg());
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

  const handleImage = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      setForm((f) => ({ ...f }));
      const dataUrl = await compressSquare(file);
      setForm((f) => ({ ...f, imageUrl: dataUrl }));
    } catch (err) {
      alert(err.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) await axios.put(`${API}/${editingId}`, form, cfg());
      else await axios.post(API, form, cfg());
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
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this top performer?')) return;
    try {
      await axios.delete(`${API}/${id}`, cfg());
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
      <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl p-8 text-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Top Performers</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Your domain is not set yet. Ask the super admin to set it (Java, Python, Data Analytics or Frontend), then come back.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Top Performers</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          You manage the <b>{domain}</b> category. Students see these on their dashboard.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <form
          onSubmit={submit}
          className={`bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 space-y-4 ${
            editingId ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900' : ''
          }`}
        >
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{editingId ? 'Edit Performer' : 'Add Top Performer'}</h3>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>
            )}
          </div>

          <input className={inputStyles} value={domain} disabled title="Your domain" />
          <input required placeholder="Student name" value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} className={inputStyles} />
          <input required placeholder="Achievement (e.g. 98% score)" value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} className={inputStyles} />

          <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-4 text-center">
            <label className="cursor-pointer text-sm font-bold text-gray-600 dark:text-gray-300 flex flex-col items-center gap-2">
              <FiUploadCloud size={24} className="text-blue-500" />
              Upload photo
              <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
            </label>
          </div>
          {form.imageUrl && <img src={form.imageUrl} alt="Preview" className="w-24 h-24 object-cover rounded-full border dark:border-slate-600 mx-auto" />}

          <button type="submit" disabled={saving} className={`w-full text-white p-2 rounded font-bold disabled:opacity-60 ${editingId ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {saving ? 'Saving...' : editingId ? 'Update' : 'Save'}
          </button>
        </form>

        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
          {performers.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm">No {domain} performers yet.</p>}
          {performers.map((p) => (
            <div key={p._id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-3 min-w-0">
                <img src={p.imageUrl} alt="" className="w-12 h-12 rounded-full object-cover border dark:border-slate-600 bg-gray-100" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">{p.category}</p>
                  <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{p.studentName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{p.metric}</p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button type="button" onClick={() => startEdit(p)} className="text-blue-500 p-2"><FiEdit size={16} /></button>
                <button type="button" onClick={() => remove(p._id)} className="text-red-500 p-2"><FiTrash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrainerPerformers;