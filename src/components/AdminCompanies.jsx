import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiTrash2, FiEdit, FiPlus, FiX } from "react-icons/fi";

const API = `${process.env.REACT_APP_API_URL}/api/companies`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const emptyCompany = { name: "", tags: "" };
const emptyQ = { title: "", difficulty: "Easy", topic: "", description: "", answer: "" };

const inputCls = "apple-input";
const labelCls = "block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1";

const diffColor = {
  Easy: 'text-green-700 dark:text-green-400 bg-green-500/10 border-green-500/20',
  Medium: 'text-yellow-700 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  Hard: 'text-red-700 dark:text-red-400 bg-red-500/10 border-red-500/20'
};

const AdminCompanies = () => {
  const canDeleteCompany = ["admin", "superadmin"].includes(localStorage.getItem("role"));

  const [companies, setCompanies] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [cForm, setCForm] = useState(emptyCompany);
  const [editingCompanyId, setEditingCompanyId] = useState(null);
  const [qForm, setQForm] = useState(emptyQ);
  const [editingQId, setEditingQId] = useState(null);

  const load = async () => {
    try { setCompanies((await axios.get(API, cfg())).data); } 
    catch (err) { console.error("Failed to load companies", err); }
  };
  useEffect(() => { load(); }, []);

  const selected = companies.find((c) => c._id === selectedId);

  // ---- Company ----
  const saveCompany = async (e) => {
    e.preventDefault();
    const payload = { name: cForm.name.trim(), tags: cForm.tags.split(",").map((t) => t.trim()).filter(Boolean) };
    try {
      if (editingCompanyId) {
        const res = await axios.put(`${API}/${editingCompanyId}`, payload, cfg());
        setCompanies(companies.map((c) => (c._id === editingCompanyId ? res.data : c)));
      } else {
        const res = await axios.post(API, payload, cfg());
        setCompanies([...companies, res.data]);
      }
      setCForm(emptyCompany);
      setEditingCompanyId(null);
    } catch (err) { alert(err.response?.data?.message || "Failed to save company"); }
  };

  const editCompany = (c) => {
    setEditingCompanyId(c._id);
    setCForm({ name: c.name, tags: (c.tags || []).join(", ") });
  };

  const deleteCompany = async (id) => {
    if (!window.confirm("Delete this company and all its questions?")) return;
    try {
      await axios.delete(`${API}/${id}`, cfg());
      setCompanies(companies.filter((c) => c._id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (err) { alert(err.response?.data?.message || "Could not delete the company"); }
  };

  // ---- Questions ----
  const saveQuestion = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editingQId) res = await axios.put(`${API}/${selectedId}/questions/${editingQId}`, qForm, cfg());
      else res = await axios.post(`${API}/${selectedId}/questions`, qForm, cfg());
      
      setCompanies(companies.map((c) => (c._id === selectedId ? res.data : c)));
      setQForm(emptyQ);
      setEditingQId(null);
    } catch (err) { alert(err.response?.data?.message || "Failed to save question"); }
  };

  const editQuestion = (q) => {
    setEditingQId(q._id);
    setQForm({ title: q.title, difficulty: q.difficulty, topic: q.topic || "", description: q.description || "", answer: q.answer || "" });
  };

  const deleteQuestion = async (qid) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      const res = await axios.delete(`${API}/${selectedId}/questions/${qid}`, cfg());
      setCompanies(companies.map((c) => (c._id === selectedId ? res.data : c)));
    } catch (err) { alert(err.response?.data?.message || "Could not delete the question"); }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
      {/* LEFT: companies */}
      <div className="space-y-6">
        <form onSubmit={saveCompany} className={`glass-panel p-8 rounded-[2rem] shadow-sm border-white/60 space-y-5 transition-all ${editingCompanyId ? "ring-2 ring-blue-500/50 shadow-blue-500/20" : ""}`}>
          <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-4">
            <h3 className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight">
              {editingCompanyId ? "Edit Company" : "Add Company"}
            </h3>
            {editingCompanyId && (
              <button type="button" onClick={() => { setEditingCompanyId(null); setCForm(emptyCompany); }} className="p-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 rounded-full transition-colors text-gray-400">
                <FiX size={18} />
              </button>
            )}
          </div>
          
          <div>
            <label className={labelCls}>Company Name</label>
            <input required placeholder="e.g. Zoho" value={cForm.name} onChange={(e) => setCForm({ ...cForm, name: e.target.value })} className={`${inputCls} font-bold`} />
          </div>
          <div>
            <label className={labelCls}>Tags (Comma Separated)</label>
            <input placeholder="e.g. Core Java, SQL" value={cForm.tags} onChange={(e) => setCForm({ ...cForm, tags: e.target.value })} className={inputCls} />
          </div>
          
          <button className={`w-full mt-4 py-3.5 rounded-xl font-extrabold text-white flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[0.98] ${editingCompanyId ? "bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/30" : "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30"}`}>
            <FiPlus size={18} /> {editingCompanyId ? "Update Company" : "Add Company"}
          </button>
        </form>

        <div className="glass-panel rounded-[2rem] overflow-hidden flex flex-col max-h-[500px] shadow-sm border-white/60">
          <div className="p-5 border-b border-black/5 dark:border-white/5 bg-white/20 dark:bg-slate-800/20 font-extrabold text-gray-900 dark:text-white text-lg">Companies Directory</div>
          <div className="overflow-y-auto custom-scrollbar flex-1 divide-y divide-black/5 dark:divide-white/5 p-2">
            {companies.length === 0 && <p className="p-10 text-center text-gray-500 font-extrabold">No companies yet.</p>}
            {companies.map((c) => (
              <div key={c._id} onClick={() => { setSelectedId(c._id); setEditingQId(null); setQForm(emptyQ); }} className={`p-4 m-1 rounded-2xl flex justify-between items-center cursor-pointer transition-colors group ${selectedId === c._id ? "bg-blue-600 text-white shadow-md" : "hover:bg-black/5 dark:hover:bg-white/5"}`}>
                <div className="min-w-0">
                  <p className={`font-extrabold text-base truncate ${selectedId === c._id ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{c.name}</p>
                  <p className={`text-[10px] font-extrabold uppercase tracking-wider mt-1 ${selectedId === c._id ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                    {c.questions?.length || 0} questions
                  </p>
                </div>
                <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => editCompany(c)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${selectedId === c._id ? "bg-white/20 hover:bg-white/30 text-white" : "text-blue-600 bg-blue-500/10 hover:bg-blue-500/20"}`}><FiEdit size={14} /></button>
                  {canDeleteCompany && (
                    <button onClick={() => deleteCompany(c._id)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${selectedId === c._id ? "bg-white/20 hover:bg-white/30 text-white" : "text-red-500 bg-red-500/10 hover:bg-red-500/20"}`}><FiTrash2 size={14} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: questions of selected company */}
      <div className="lg:col-span-2 space-y-6">
        {!selected ? (
          <div className="glass-panel p-16 rounded-[2rem] shadow-sm border-white/60 h-full flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-4"><FiEdit size={32} className="text-gray-400" /></div>
            <p className="text-gray-500 dark:text-gray-400 font-extrabold text-xl">Select a company on the left</p>
            <p className="text-sm font-medium text-gray-500 mt-2">To view, add, or manage interview questions.</p>
          </div>
        ) : (
          <>
            <form onSubmit={saveQuestion} className={`glass-panel p-8 rounded-[2.5rem] shadow-sm border-white/60 space-y-5 transition-all ${editingQId ? "ring-2 ring-blue-500/50 shadow-blue-500/20" : ""}`}>
              <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-4 mb-4">
                <h3 className="font-extrabold text-2xl text-gray-900 dark:text-white tracking-tight">
                  {editingQId ? "Edit Question" : "Add Question"} <span className="text-blue-600 dark:text-blue-400 opacity-80">· {selected.name}</span>
                </h3>
                {editingQId && (
                  <button type="button" onClick={() => { setEditingQId(null); setQForm(emptyQ); }} className="p-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 rounded-full transition-colors text-gray-400">
                    <FiX size={20} />
                  </button>
                )}
              </div>
              
              <div>
                <label className={labelCls}>Question Title</label>
                <input required placeholder="e.g. Reverse a Linked List" value={qForm.title} onChange={(e) => setQForm({ ...qForm, title: e.target.value })} className={`${inputCls} font-bold`} />
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Difficulty</label>
                  <select value={qForm.difficulty} onChange={(e) => setQForm({ ...qForm, difficulty: e.target.value })} className={`${inputCls} cursor-pointer`}>
                    <option>Easy</option><option>Medium</option><option>Hard</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Topic</label>
                  <input placeholder="e.g. Data Structures" value={qForm.topic} onChange={(e) => setQForm({ ...qForm, topic: e.target.value })} className={inputCls} />
                </div>
              </div>
              
              <div>
                <label className={labelCls}>Question Details</label>
                <textarea rows="4" placeholder="Problem statement..." value={qForm.description} onChange={(e) => setQForm({ ...qForm, description: e.target.value })} className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className={labelCls}>Answer / Solution (Optional)</label>
                <textarea rows="4" placeholder="Solution code or hints..." value={qForm.answer} onChange={(e) => setQForm({ ...qForm, answer: e.target.value })} className={`${inputCls} font-mono text-[13px] resize-none`} />
              </div>
              
              <button type="submit" className={`w-full mt-4 py-3.5 rounded-xl font-extrabold text-white flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[0.98] ${editingQId ? "bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/30" : "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30"}`}>
                <FiPlus size={18} /> {editingQId ? "Update Question" : "Add Question"}
              </button>
            </form>

            <div className="glass-panel rounded-[2rem] overflow-hidden shadow-sm border-white/60 flex flex-col">
              <div className="p-6 border-b border-black/5 dark:border-white/5 bg-white/20 dark:bg-slate-800/20 font-extrabold text-gray-900 dark:text-white text-lg">
                Questions Directory <span className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-lg ml-2">{selected.questions?.length || 0}</span>
              </div>
              <div className="divide-y divide-black/5 dark:divide-white/5 max-h-[500px] overflow-y-auto custom-scrollbar p-2">
                {(selected.questions || []).length === 0 && (
                  <p className="p-16 text-center text-gray-500 font-extrabold text-lg">No questions added yet.</p>
                )}
                {(selected.questions || []).map((q, i) => (
                  <div key={q._id} className="p-5 flex justify-between items-start gap-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-colors m-1 group">
                    <div className="min-w-0">
                      <p className="font-extrabold text-gray-900 dark:text-white text-base mb-2">{i + 1}. {q.title}</p>
                      <div className="flex gap-2 items-center flex-wrap">
                        <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider border shadow-sm ${diffColor[q.difficulty]}`}>{q.difficulty}</span>
                        {q.topic && <span className="text-[10px] font-extrabold text-gray-600 dark:text-gray-300 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 px-3 py-1.5 rounded-lg shadow-sm uppercase tracking-wider">{q.topic}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => editQuestion(q)} className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 bg-blue-500/10 hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-500/20"><FiEdit size={16} /></button>
                      <button onClick={() => deleteQuestion(q._id)} className="w-10 h-10 rounded-xl flex items-center justify-center text-red-500 bg-red-500/10 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-500/20 opacity-0 group-hover:opacity-100"><FiTrash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminCompanies;