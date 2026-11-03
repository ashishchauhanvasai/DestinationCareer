import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiBriefcase } from 'react-icons/fi';

const BASE = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const inputCls = "apple-input";

const GradeRow = ({ ans, onSaved }) => {
  const [marks, setMarks] = useState(ans.graded ? ans.marks : '');
  const [feedback, setFeedback] = useState(ans.feedback || '');
  const max = ans.question?.marks;

  const save = async () => {
    try {
      await axios.put(`${BASE}/assignment-answers/${ans._id}/grade`, { marks, feedback }, cfg());
      onSaved();
    } catch { alert('Failed to save marks'); }
  };

  return (
    <div className="bg-black/5 dark:bg-white/5 p-6 rounded-[1.5rem] border border-black/5 dark:border-white/5 mb-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-center text-[11px] font-extrabold uppercase tracking-wider mb-4 border-b border-black/5 dark:border-white/5 pb-3">
        <span className="text-gray-600 dark:text-gray-300">
          <span className="text-blue-600 dark:text-blue-400">{ans.user?.name}</span> ({ans.user?.email}) <span className="mx-2">•</span> {ans.question?.topic}
        </span>
        <span className={`px-3 py-1 rounded-md shadow-sm border ${ans.graded ? 'bg-green-500/10 text-green-700 border-green-500/20' : 'bg-orange-500/10 text-orange-700 border-orange-500/20 animate-pulse'}`}>
          {ans.graded ? 'Graded' : 'Pending'}
        </span>
      </div>
      
      <p className="font-extrabold text-sm text-gray-900 dark:text-white whitespace-pre-wrap mb-4 tracking-tight leading-relaxed">{ans.question?.text}</p>
      
      {ans.question?.images?.length > 0 && (
        <div className="flex flex-wrap gap-4 mb-4">
          {ans.question.images.map((id) => (
            <img key={id} src={`${BASE}/assignment-images/${id}`} alt="" className="max-h-40 rounded-xl border border-gray-200 shadow-sm bg-white" />
          ))}
        </div>
      )}
      
      <pre className="bg-white/50 dark:bg-slate-900/50 border border-white/50 dark:border-slate-700/50 shadow-inner rounded-xl p-4 text-[13px] whitespace-pre-wrap font-mono text-gray-800 dark:text-gray-200 mb-5">{ans.text}</pre>
      
      <div className="flex flex-wrap gap-3 items-center bg-white/40 dark:bg-slate-800/40 p-4 rounded-xl border border-white/50 dark:border-slate-700/50 shadow-sm">
        <div className="flex items-center gap-2">
          <input type="number" min="0" max={max} value={marks} onChange={(e) => setMarks(e.target.value)} placeholder="Marks" className={`${inputCls} w-24 text-center font-bold`} />
          <span className="text-sm font-extrabold text-gray-500">/ {max}</span>
        </div>
        <input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Feedback (optional)" className={`${inputCls} flex-1 min-w-[200px]`} />
        <button onClick={save} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3.5 rounded-xl font-extrabold text-sm shadow-lg shadow-blue-500/30 hover:scale-[0.98] transition-transform shrink-0">
          Save Marks
        </button>
      </div>
    </div>
  );
};

const AdminAssignments = () => {
  const isTrainer = localStorage.getItem('role') === 'trainer';
  const addLink = isTrainer ? '/trainer/add-assignment' : '/add-assignment';
  const editLink = (id) => (isTrainer ? `/trainer/edit-assignment/${id}` : `/edit-assignment/${id}`);

  const [list, setList] = useState([]);
  const [review, setReview] = useState(null);

  const load = async () => {
    try { setList((await axios.get(`${BASE}/assignments`, cfg())).data); }
    catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, []);

  const openReview = async (id) => {
    try {
      const r = await axios.get(`${BASE}/assignments/${id}/review`, cfg());
      setReview({ id, ...r.data });
    } catch (err) { alert(err.response?.data?.message || 'Could not load answers'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this assignment, its images and all student answers?')) return;
    try {
      await axios.delete(`${BASE}/assignments/${id}`, cfg());
      if (review?.id === id) setReview(null);
      load();
    } catch (err) { alert(err.response?.data?.message || 'Could not delete'); }
  };

  const summary = {};
  (review?.answers || []).forEach((x) => {
    const k = x.user?._id;
    summary[k] = summary[k] || { name: x.user?.name, email: x.user?.email, answered: 0, marks: 0, pending: 0 };
    summary[k].answered++;
    summary[k].marks += x.marks || 0;
    if (!x.graded) summary[k].pending++;
  });
  const descriptive = (review?.answers || []).filter((x) => x.question?.qType === 'Descriptive');

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl backdrop-blur-md border border-blue-500/20 shadow-sm">
            <FiBriefcase className="text-blue-600 dark:text-blue-400" size={26} />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{isTrainer ? 'My Assignments' : 'All Assignments'}</h2>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Manage tests and review student submissions.</p>
          </div>
        </div>
        <Link to={addLink} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3.5 rounded-xl font-extrabold flex items-center gap-2 shadow-lg shadow-blue-500/30 hover:scale-[0.98] transition-all text-sm w-full sm:w-auto justify-center">
          <FiPlus size={18} /> Add Assignment
        </Link>
      </div>

      <div className="glass-panel rounded-[2rem] overflow-hidden shadow-sm border-white/60">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/5 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="p-5">Title</th>
                <th className="p-5">For</th>
                {!isTrainer && <th className="p-5">Created by</th>}
                <th className="p-5 text-center">Topics / Questions</th>
                <th className="p-5 text-center">Total marks</th>
                <th className="p-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5 text-sm">
              {list.length === 0 && <tr><td colSpan="6" className="p-16 text-center text-gray-500 font-extrabold text-lg">No assignments yet.</td></tr>}
              {list.map((a) => (
                <tr key={a._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                  <td className="p-5">
                    <p className="font-extrabold text-gray-900 dark:text-white text-base mb-1">{a.title}</p>
                    <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">{a.level}</span>
                  </td>
                  <td className="p-5 font-extrabold">
                    {a.audience === 'batches' ? (
                      <span className="text-purple-700 dark:text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20 shadow-sm">{a.batchLabels.length ? a.batchLabels.join(', ') : 'Selected batches'}</span>
                    ) : (
                      <span className="text-green-700 dark:text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20 shadow-sm">Everyone</span>
                    )}
                  </td>
                  {!isTrainer && <td className="p-5 font-bold text-gray-600 dark:text-gray-300">{a.createdByName || 'Admin'}</td>}
                  <td className="p-5 text-center font-extrabold text-gray-700 dark:text-gray-300">
                    <span className="bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5 shadow-sm">{a.modules} Topics</span> <span className="mx-2">•</span> <span className="bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5 shadow-sm">{a.questions} Q's</span>
                  </td>
                  <td className="p-5 text-center font-extrabold text-lg text-gray-900 dark:text-white">{a.totalMarks}</td>
                  <td className="p-5">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openReview(a._id)} className="w-10 h-10 rounded-xl flex items-center justify-center text-green-600 bg-green-500/10 hover:bg-green-600 hover:text-white transition-all shadow-sm border border-green-500/20" title="Review student answers"><FiEye size={16} /></button>
                      <Link to={editLink(a._id)} className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 bg-blue-500/10 hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-500/20" title="Edit"><FiEdit size={16} /></Link>
                      <button onClick={() => del(a._id)} className="w-10 h-10 rounded-xl flex items-center justify-center text-red-500 bg-red-500/10 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-500/20 opacity-0 group-hover:opacity-100" title="Delete"><FiTrash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {review && (
        <div className="space-y-8 animate-fade-in mt-12">
          <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight border-b border-black/5 dark:border-white/5 pb-4">
            Reviewing: <span className="text-blue-600 dark:text-blue-400">{review.title}</span>
          </h3>

          <div className="glass-panel rounded-[2rem] overflow-hidden shadow-sm border-white/60">
            <div className="p-6 bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/5 font-extrabold text-gray-900 dark:text-white text-lg tracking-tight">Student Marks Summary</div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-black/5 dark:bg-white/5 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-black/5 dark:border-white/5">
                  <tr><th className="p-5">Student</th><th className="p-5 text-center">Answered</th><th className="p-5 text-center">Marks</th><th className="p-5 text-center">Pending Review</th></tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {Object.values(summary).length === 0 && <tr><td colSpan="4" className="p-16 text-center text-gray-500 font-extrabold text-lg">No student has answered yet.</td></tr>}
                  {Object.values(summary).map((s, i) => (
                    <tr key={i} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="p-5">
                        <p className="font-extrabold text-gray-900 dark:text-white text-base">{s.name}</p>
                        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">{s.email}</p>
                      </td>
                      <td className="p-5 text-center font-extrabold text-gray-700 dark:text-gray-300">{s.answered}</td>
                      <td className="p-5 text-center font-extrabold text-green-600 dark:text-green-400 text-lg">{s.marks}</td>
                      <td className="p-5 text-center font-extrabold text-orange-600 dark:text-orange-400">{s.pending}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] overflow-hidden shadow-sm border-white/60">
            <div className="p-6 bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/5 font-extrabold text-gray-900 dark:text-white text-lg tracking-tight">
              Written Answers <span className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg shadow-sm ml-2">{descriptive.length}</span>
            </div>
            <div className="p-6 md:p-8 space-y-2">
              {descriptive.length === 0 && <p className="p-10 text-center text-gray-500 font-extrabold text-lg">No written answers yet.</p>}
              {descriptive.map((ans) => <GradeRow key={ans._id + String(ans.updatedAt)} ans={ans} onSaved={() => openReview(review.id)} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAssignments;