import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiTrash2, FiEdit, FiPlus, FiX } from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api/companies`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const emptyCompany = { name: '', tags: '' };
const emptyQ = { title: '', difficulty: 'Easy', topic: '', description: '', answer: '' };

const AdminCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [cForm, setCForm] = useState(emptyCompany);
  const [editingCompanyId, setEditingCompanyId] = useState(null);
  const [qForm, setQForm] = useState(emptyQ);
  const [editingQId, setEditingQId] = useState(null);

  const load = async () => {
    try {
      const res = await axios.get(API, cfg());
      setCompanies(res.data);
    } catch (err) {
      console.error('Failed to load companies', err);
    }
  };
  useEffect(() => { load(); }, []);

  const selected = companies.find((c) => c._id === selectedId);

  // ---- Company ----
  const saveCompany = async (e) => {
    e.preventDefault();
    const payload = {
      name: cForm.name.trim(),
      tags: cForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
    };
    try {
      if (editingCompanyId) await axios.put(`${API}/${editingCompanyId}`, payload, cfg());
      else await axios.post(API, payload, cfg());
      setCForm(emptyCompany);
      setEditingCompanyId(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save company');
    }
  };

  const editCompany = (c) => {
    setEditingCompanyId(c._id);
    setCForm({ name: c.name, tags: (c.tags || []).join(', ') });
  };

  const deleteCompany = async (id) => {
    if (!window.confirm('Delete this company and all its questions?')) return;
    await axios.delete(`${API}/${id}`, cfg());
    if (selectedId === id) setSelectedId(null);
    load();
  };

  // ---- Questions ----
  const saveQuestion = async (e) => {
    e.preventDefault();
    try {
      if (editingQId) await axios.put(`${API}/${selectedId}/questions/${editingQId}`, qForm, cfg());
      else await axios.post(`${API}/${selectedId}/questions`, qForm, cfg());
      setQForm(emptyQ);
      setEditingQId(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save question');
    }
  };

  const editQuestion = (q) => {
    setEditingQId(q._id);
    setQForm({
      title: q.title,
      difficulty: q.difficulty,
      topic: q.topic || '',
      description: q.description || '',
      answer: q.answer || ''
    });
  };

  const deleteQuestion = async (qid) => {
    if (!window.confirm('Delete this question?')) return;
    await axios.delete(`${API}/${selectedId}/questions/${qid}`, cfg());
    load();
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* LEFT: companies */}
      <div className="space-y-4">
        <form onSubmit={saveCompany} className={`bg-white p-6 rounded-2xl shadow-sm border space-y-3 ${editingCompanyId ? 'border-blue-500 ring-2 ring-blue-100' : ''}`}>
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">{editingCompanyId ? 'Edit Company' : 'Add Company'}</h3>
            {editingCompanyId && (
              <button type="button" onClick={() => { setEditingCompanyId(null); setCForm(emptyCompany); }} className="text-gray-400"><FiX size={20} /></button>
            )}
          </div>
          <input required placeholder="Company name (e.g. Zoho)" value={cForm.name} onChange={(e) => setCForm({ ...cForm, name: e.target.value })} className="w-full p-2 border rounded" />
          <input placeholder="Tags, comma separated (Core Java, SQL)" value={cForm.tags} onChange={(e) => setCForm({ ...cForm, tags: e.target.value })} className="w-full p-2 border rounded text-sm" />
          <button className={`w-full text-white p-2 rounded font-bold ${editingCompanyId ? 'bg-green-600' : 'bg-blue-600'}`}>
            {editingCompanyId ? 'Update Company' : 'Add Company'}
          </button>
        </form>

        <div className="bg-white rounded-2xl shadow-sm border divide-y max-h-[500px] overflow-y-auto">
          {companies.length === 0 && <p className="p-6 text-center text-gray-500 text-sm">No companies yet.</p>}
          {companies.map((c) => (
            <div key={c._id} className={`p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 ${selectedId === c._id ? 'bg-blue-50' : ''}`} onClick={() => { setSelectedId(c._id); setEditingQId(null); setQForm(emptyQ); }}>
              <div>
                <p className="font-semibold text-sm">{c.name}</p>
                <p className="text-xs text-gray-500">{c.questions?.length || 0} questions</p>
              </div>
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => editCompany(c)} className="text-blue-500 p-1"><FiEdit size={16} /></button>
                <button onClick={() => deleteCompany(c._id)} className="text-red-500 p-1"><FiTrash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: questions of selected company */}
      <div className="lg:col-span-2 space-y-4">
        {!selected ? (
          <div className="bg-white rounded-2xl border p-10 text-center text-gray-500">
            Select a company on the left to add or manage its questions.
          </div>
        ) : (
          <>
            <form onSubmit={saveQuestion} className={`bg-white p-6 rounded-2xl shadow-sm border space-y-3 ${editingQId ? 'border-blue-500 ring-2 ring-blue-100' : ''}`}>
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">
                  {editingQId ? 'Edit Question' : 'Add Question'} <span className="text-blue-600">· {selected.name}</span>
                </h3>
                {editingQId && (
                  <button type="button" onClick={() => { setEditingQId(null); setQForm(emptyQ); }} className="text-gray-400"><FiX size={20} /></button>
                )}
              </div>
              <input required placeholder="Question title" value={qForm.title} onChange={(e) => setQForm({ ...qForm, title: e.target.value })} className="w-full p-2 border rounded" />
              <div className="grid grid-cols-2 gap-3">
                <select value={qForm.difficulty} onChange={(e) => setQForm({ ...qForm, difficulty: e.target.value })} className="p-2 border rounded text-sm">
                  <option>Easy</option><option>Medium</option><option>Hard</option>
                </select>
                <input placeholder="Topic (Core Java, SQL, Aptitude...)" value={qForm.topic} onChange={(e) => setQForm({ ...qForm, topic: e.target.value })} className="p-2 border rounded text-sm" />
              </div>
              <textarea rows="4" placeholder="Question details / problem statement" value={qForm.description} onChange={(e) => setQForm({ ...qForm, description: e.target.value })} className="w-full p-2 border rounded text-sm" />
              <textarea rows="4" placeholder="Answer / solution (optional)" value={qForm.answer} onChange={(e) => setQForm({ ...qForm, answer: e.target.value })} className="w-full p-2 border rounded text-sm font-mono" />
              <button className={`px-5 py-2 text-white rounded font-bold flex items-center gap-2 ${editingQId ? 'bg-green-600' : 'bg-blue-600'}`}>
                <FiPlus /> {editingQId ? 'Update Question' : 'Add Question'}
              </button>
            </form>

            <div className="bg-white rounded-2xl shadow-sm border divide-y">
              <div className="p-4 bg-gray-50 font-bold rounded-t-2xl">Questions ({selected.questions?.length || 0})</div>
              {(selected.questions || []).length === 0 && <p className="p-6 text-center text-gray-500 text-sm">No questions added yet.</p>}
              {(selected.questions || []).map((q, i) => (
                <div key={q._id} className="p-4 flex justify-between gap-4">
                  <div>
                    <p className="font-semibold text-sm">{i + 1}. {q.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{q.difficulty}{q.topic ? ` • ${q.topic}` : ''}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => editQuestion(q)} className="text-blue-500 p-1"><FiEdit size={16} /></button>
                    <button onClick={() => deleteQuestion(q._id)} className="text-red-500 p-1"><FiTrash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminCompanies;