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
    <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-[2rem] border border-gray-200 dark:border-slate-700 mb-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[11px] font-extrabold uppercase tracking-wider mb-5 border-b border-gray-200 dark:border-slate-700 pb-4">
        <span className="text-gray-600 dark:text-gray-300">
          <span className="text-blue-600 dark:text-blue-400 text-sm">{ans.user?.name}</span> 
          <span className="hidden sm:inline mx-2">•</span>
          <br className="sm:hidden" />
          <span className="opacity-80">{ans.user?.email}</span> 
          <span className="hidden sm:inline mx-2 text-gray-300 dark:text-gray-600">|</span>
          <br className="sm:hidden" />
          <span className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 px-2 py-1 rounded mt-2 sm:mt-0 inline-block">{ans.question?.topic}</span>
        </span>
        <span className={`px-4 py-2 rounded-xl shadow-sm border shrink-0 w-fit ${ans.graded ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' : 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 animate-pulse'}`}>
          {ans.graded ? 'Graded' : 'Pending'}
        </span>
      </div>
      
      <p className="font-extrabold text-base text-gray-900 dark:text-white whitespace-pre-wrap mb-5 tracking-tight leading-relaxed">{ans.question?.text}</p>
      
      {ans.question?.images?.length > 0 && (
        <div className="flex flex-wrap gap-4 mb-5">
          {ans.question.images.map((id) => (
            <img key={id} src={`${BASE}/assignment-images/${id}`} alt="" className="max-h-48 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm bg-white" />
          ))}
        </div>
      )}
      
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-inner rounded-[1.5rem] p-5 mb-6 overflow-x-auto custom-scrollbar">
        <pre className="text-[13px] whitespace-pre-wrap font-mono text-gray-800 dark:text-gray-200 leading-relaxed">{ans.text}</pre>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white/60 dark:bg-slate-900/60 p-5 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3 w-full md:w-auto bg-gray-100 dark:bg-slate-800 p-2 rounded-xl border border-gray-200 dark:border-slate-600">
          <input type="number" min="0" max={max} value={marks} onChange={(e) => setMarks(e.target.value)} placeholder="Marks" className={`${inputCls} w-24 text-center font-extrabold text-lg !p-2 !border-none !shadow-none !bg-white dark:!bg-slate-900`} />
          <span className="text-sm font-extrabold text-gray-500 pr-3">/ {max}</span>
        </div>
        <input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Enter feedback for student (optional)" className={`${inputCls} flex-1 min-w-[200px] w-full`} />
        <button onClick={save} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-4 rounded-xl font-extrabold text-[15px] shadow-lg shadow-blue-500/30 hover:scale-[0.98] transition-transform w-full md:w-auto shrink-0 flex items-center justify-center">
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
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl border border-blue-500/20 shadow-sm">
            <FiBriefcase className="text-blue-600 dark:text-blue-400" size={28} />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{isTrainer ? 'My Assignments' : 'All Assignments'}</h2>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Manage tests and grade student submissions.</p>
          </div>
        </div>
        <Link to={addLink} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3.5 rounded-xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:scale-[0.98] transition-all text-[15px] w-full sm:w-auto">
          <FiPlus size={18} /> Add Assignment
        </Link>
      </div>

      {/* Main Table */}
      <div className="glass-panel rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="p-6">Title</th>
                <th className="p-6">For</th>
                {!isTrainer && <th className="p-6">Created by</th>}
                <th className="p-6 text-center">Topics / Questions</th>
                <th className="p-6 text-center">Total marks</th>
                <th className="p-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700 text-sm">
              {list.length === 0 && <tr><td colSpan="6" className="p-20 text-center text-gray-500 dark:text-gray-400 font-extrabold text-xl">No assignments yet.</td></tr>}
              {list.map((a) => (
                <tr key={a._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="p-6">
                    <p className="font-extrabold text-gray-900 dark:text-white text-[15px] mb-1.5">{a.title}</p>
                    <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">{a.level}</span>
                  </td>
                  <td className="p-6 font-extrabold">
                    {a.audience === 'batches' ? (
                      <span className="text-purple-700 dark:text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20 shadow-sm block w-fit truncate max-w-[200px]" title={a.batchLabels.join(', ')}>
                        {a.batchLabels.length ? a.batchLabels.join(', ') : 'Selected batches'}
                      </span>
                    ) : (
                      <span className="text-green-700 dark:text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20 shadow-sm block w-fit">Everyone</span>
                    )}
                  </td>
                  {!isTrainer && <td className="p-6 font-bold text-gray-600 dark:text-gray-300">{a.createdByName || 'Admin'}</td>}
                  <td className="p-6 text-center font-extrabold text-gray-700 dark:text-gray-300">
                    <span className="bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 shadow-sm">{a.modules} Topics</span> 
                    <span className="mx-2 text-gray-300 dark:text-gray-600">•</span> 
                    <span className="bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 shadow-sm">{a.questions} Q's</span>
                  </td>
                  <td className="p-6 text-center font-black text-xl text-gray-900 dark:text-white">{a.totalMarks}</td>
                  <td className="p-6">
                    <div className="flex justify-center gap-3">
                      <button onClick={() => openReview(a._id)} className="w-10 h-10 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-600 hover:text-white transition-all shadow-sm border border-green-200 dark:border-green-800" title="Review student answers"><FiEye size={16} /></button>
                      <Link to={editLink(a._id)} className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-200 dark:border-blue-800" title="Edit"><FiEdit size={16} /></Link>
                      <button onClick={() => del(a._id)} className="w-10 h-10 rounded-xl flex items-center justify-center text-red-500 bg-red-50 dark:bg-red-900/30 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-200 dark:border-red-800 opacity-100 xl:opacity-0 xl:group-hover:opacity-100" title="Delete"><FiTrash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Section */}
      {review && (
        <div className="space-y-8 animate-fade-in mt-16 border-t-[3px] border-gray-200 dark:border-slate-800 pt-12">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
               Reviewing: <span className="text-blue-600 dark:text-blue-400">{review.title}</span>
             </h3>
             <button onClick={() => setReview(null)} className="glass-button px-5 py-2 rounded-xl text-sm font-extrabold">Close Review</button>
          </div>

          <div className="glass-panel rounded-[2.5rem] overflow-hidden">
            <div className="p-6 md:p-8 bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700 font-extrabold text-gray-900 dark:text-white text-xl tracking-tight">Student Marks Summary</div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white dark:bg-slate-900 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-200 dark:border-slate-700">
                  <tr><th className="p-6">Student</th><th className="p-6 text-center">Answered</th><th className="p-6 text-center">Marks</th><th className="p-6 text-center">Pending Review</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {Object.values(summary).length === 0 && <tr><td colSpan="4" className="p-16 text-center text-gray-500 dark:text-gray-400 font-extrabold text-lg">No student has answered yet.</td></tr>}
                  {Object.values(summary).map((s, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-6">
                        <p className="font-extrabold text-gray-900 dark:text-white text-[15px]">{s.name}</p>
                        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-1">{s.email}</p>
                      </td>
                      <td className="p-6 text-center font-extrabold text-gray-700 dark:text-gray-300 text-base">{s.answered}</td>
                      <td className="p-6 text-center font-black text-green-600 dark:text-green-400 text-xl">{s.marks}</td>
                      <td className="p-6 text-center font-extrabold text-orange-600 dark:text-orange-400 text-base">{s.pending}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-panel rounded-[2.5rem] overflow-hidden">
            <div className="p-6 md:p-8 bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700 font-extrabold text-gray-900 dark:text-white text-xl tracking-tight flex items-center gap-3">
              Written Answers 
              <span className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg shadow-sm">{descriptive.length}</span>
            </div>
            <div className="p-4 sm:p-6 md:p-8">
              {descriptive.length === 0 && <p className="p-16 text-center text-gray-500 dark:text-gray-400 font-extrabold text-xl">No written answers yet.</p>}
              {descriptive.map((ans) => <GradeRow key={ans._id + String(ans.updatedAt)} ans={ans} onSaved={() => openReview(review.id)} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAssignments;