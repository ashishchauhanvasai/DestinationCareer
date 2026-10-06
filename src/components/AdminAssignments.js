import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiEye } from 'react-icons/fi';

const BASE = 'http://localhost:5000/api';
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

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
    <div className="p-4 space-y-2">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{ans.user?.name} ({ans.user?.email}) • {ans.question?.topic}</span>
        <span className={ans.graded ? 'text-green-600 font-bold' : 'text-orange-500 font-bold'}>{ans.graded ? 'Graded' : 'Pending'}</span>
      </div>
      <p className="font-semibold text-sm whitespace-pre-wrap">{ans.question?.text}</p>
      {ans.question?.images?.map((id) => <img key={id} src={`${BASE}/assignment-images/${id}`} alt="" className="max-h-40 rounded border" />)}
      <pre className="bg-gray-50 border rounded p-3 text-sm whitespace-pre-wrap">{ans.text}</pre>
      <div className="flex gap-2 items-center">
        <input type="number" min="0" max={max} value={marks} onChange={(e) => setMarks(e.target.value)} placeholder="Marks" className="w-24 p-2 border rounded text-sm" />
        <span className="text-sm text-gray-500">/ {max}</span>
        <input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Feedback (optional)" className="flex-1 p-2 border rounded text-sm" />
        <button onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm">Save</button>
      </div>
    </div>
  );
};

const AdminAssignments = () => {
  const [list, setList] = useState([]);
  const [review, setReview] = useState(null); // { id, title, answers }

  const load = async () => {
    try { setList((await axios.get(`${BASE}/assignments`, cfg())).data); }
    catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, []);

  const openReview = async (id) => {
    try {
      const r = await axios.get(`${BASE}/assignments/${id}/review`, cfg());
      setReview({ id, ...r.data });
    } catch { alert('Could not load answers'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this assignment, its images and all student answers?')) return;
    await axios.delete(`${BASE}/assignments/${id}`, cfg());
    if (review?.id === id) setReview(null);
    load();
  };

  // Per-student summary from the answers
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">All Assignments</h2>
        <Link to="/add-assignment" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700"><FiPlus size={18} /> Add Assignment</Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-sm border-b">
            <tr><th className="p-4">Title</th><th className="p-4 text-center">Topics / Questions</th><th className="p-4 text-center">Total marks</th><th className="p-4 text-center">Actions</th></tr>
          </thead>
          <tbody className="divide-y">
            {list.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-gray-500">No assignments yet.</td></tr>}
            {list.map((a) => (
              <tr key={a._id}>
                <td className="p-4 font-semibold text-gray-800">{a.title} <span className="text-xs text-gray-400">({a.level})</span></td>
                <td className="p-4 text-center text-sm text-gray-500">{a.modules} topics • {a.questions} questions</td>
                <td className="p-4 text-center text-sm">{a.totalMarks}</td>
                <td className="p-4">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => openReview(a._id)} className="text-green-600 p-2" title="Review student answers"><FiEye size={18} /></button>
                    <Link to={`/edit-assignment/${a._id}`} className="text-blue-500 p-2" title="Edit"><FiEdit size={18} /></Link>
                    <button onClick={() => del(a._id)} className="text-red-500 p-2" title="Delete"><FiTrash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {review && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold">Review: {review.title}</h3>

          <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
            <div className="p-4 bg-gray-50 border-b font-bold">Student marks</div>
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500 border-b"><tr><th className="p-3">Student</th><th className="p-3">Answered</th><th className="p-3">Marks</th><th className="p-3">Pending review</th></tr></thead>
              <tbody className="divide-y">
                {Object.values(summary).length === 0 && <tr><td colSpan="4" className="p-6 text-center text-gray-500">No student has answered yet.</td></tr>}
                {Object.values(summary).map((s, i) => (
                  <tr key={i}><td className="p-3">{s.name}<br /><span className="text-xs text-gray-400">{s.email}</span></td><td className="p-3">{s.answered}</td><td className="p-3 font-bold">{s.marks}</td><td className="p-3">{s.pending}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border divide-y">
            <div className="p-4 bg-gray-50 font-bold rounded-t-2xl">Written answers ({descriptive.length})</div>
            {descriptive.length === 0 && <p className="p-6 text-center text-gray-500 text-sm">No written answers yet.</p>}
            {descriptive.map((ans) => <GradeRow key={ans._id + String(ans.updatedAt)} ans={ans} onSaved={() => openReview(review.id)} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAssignments;