import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPlus, FiSave, FiTrash2, FiImage, FiX } from 'react-icons/fi';

const BASE = 'http://localhost:5000/api';
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const emptyQuestion = () => ({
  qType: 'Descriptive', text: '', images: [], options: ['', ''], correctIndex: 0, explanation: '', marks: 1
});
const emptyTopic = () => ({ topicName: '', questions: [emptyQuestion()] });
const emptyAssignment = () => ({ title: '', level: 'Beginner', description: '', topics: [emptyTopic()] });

// Shrink big screenshots/diagrams before upload (white background so PNG transparency doesn't turn black)
const compressImage = (file, maxW = 1400) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

const AssignmentBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [a, setA] = useState(emptyAssignment());
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    axios.get(`${BASE}/assignments/${id}`, cfg())
      .then((r) => setA(r.data))
      .catch(() => alert('Could not load assignment'));
  }, [id, isEdit]);

  // Clone, change, save — keeps every handler tiny
  const mutate = (fn) => setA((prev) => { const n = JSON.parse(JSON.stringify(prev)); fn(n); return n; });

  const uploadImages = async (ti, qi, files) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const dataUrl = await compressImage(file);
        const r = await axios.post(`${BASE}/assignment-images`, { dataUrl }, cfg());
        mutate((n) => n.topics[ti].questions[qi].images.push(r.data.id));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Image upload failed');
    }
    setUploading(false);
  };

  const save = async (e) => {
    e.preventDefault();
    for (const t of a.topics) {
      for (const q of t.questions) {
        if (q.qType === 'MCQ' && (q.options.length < 2 || q.options.some((o) => !o.trim()))) {
          return alert(`MCQ in topic "${t.topicName}" needs at least 2 options and none can be empty.`);
        }
      }
    }
    try {
      if (isEdit) await axios.put(`${BASE}/assignments/${id}`, a, cfg());
      else await axios.post(`${BASE}/assignments`, a, cfg());
      alert('Assignment saved!');
      navigate('/admin');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    }
  };

  return (
    <form onSubmit={save} className="max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{isEdit ? 'Edit Assignment' : 'Assignment Builder'}</h1>
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/admin')} className="px-6 py-2 rounded-lg font-bold border border-gray-300 text-gray-600 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={uploading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
            <FiSave /> {uploading ? 'Uploading image...' : 'Save Assignment'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border mb-8 space-y-4">
        <h2 className="font-bold text-lg">1. Assignment Details</h2>
        <input required placeholder="Title (e.g. Java OOP Assignment)" value={a.title} onChange={(e) => mutate((n) => { n.title = e.target.value; })} className="w-full p-3 border rounded-lg bg-gray-50 font-bold text-lg" />
        <select value={a.level} onChange={(e) => mutate((n) => { n.level = e.target.value; })} className="p-2 border rounded-lg">
          <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
        </select>
        <textarea placeholder="Short description (optional)" value={a.description} onChange={(e) => mutate((n) => { n.description = e.target.value; })} className="w-full p-3 border rounded-lg bg-gray-50" rows="2" />
      </div>

      {a.topics.map((t, ti) => (
        <div key={t._id || ti} className="bg-white p-6 rounded-2xl shadow-sm border mb-6 border-l-4 border-l-blue-500">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-blue-800">Topic {ti + 1}</h2>
            <button type="button" onClick={() => window.confirm('Remove this topic and all its questions?') && mutate((n) => { n.topics.splice(ti, 1); })} className="text-xs text-red-500 hover:underline">Remove Topic</button>
          </div>
          <input required placeholder="Topic name (e.g. Inheritance)" value={t.topicName} onChange={(e) => mutate((n) => { n.topics[ti].topicName = e.target.value; })} className="w-full p-3 border rounded-lg mb-5 bg-blue-50/50 font-bold" />

          <div className="pl-6 border-l-2 border-gray-200 space-y-5">
            {t.questions.map((q, qi) => (
              <div key={q._id || qi} className="bg-gray-50 p-4 rounded-xl border space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Question {qi + 1}</span>
                  <button type="button" onClick={() => window.confirm('Remove this question?') && mutate((n) => { n.topics[ti].questions.splice(qi, 1); })} className="text-xs text-red-500 hover:underline">Remove Question</button>
                </div>

                <div className="flex gap-3">
                  <select value={q.qType} onChange={(e) => mutate((n) => { n.topics[ti].questions[qi].qType = e.target.value; })} className="p-2 border rounded text-sm bg-white">
                    <option value="Descriptive">Descriptive (written answer)</option>
                    <option value="MCQ">MCQ (auto-graded)</option>
                  </select>
                  <input type="number" min="0" value={q.marks} onChange={(e) => mutate((n) => { n.topics[ti].questions[qi].marks = Number(e.target.value); })} className="w-24 p-2 border rounded text-sm" title="Marks" />
                  <span className="text-sm text-gray-500 self-center">marks</span>
                </div>

                <textarea required placeholder="Question text" rows="3" value={q.text} onChange={(e) => mutate((n) => { n.topics[ti].questions[qi].text = e.target.value; })} className="w-full p-2 border rounded text-sm bg-white" />

                {/* Images */}
                <div>
                  <div className="flex flex-wrap gap-3 mb-2">
                    {q.images.map((imgId) => (
                      <div key={imgId} className="relative">
                        <img src={`${BASE}/assignment-images/${imgId}`} alt="" className="h-24 rounded border bg-white" />
                        <button type="button" onClick={() => mutate((n) => { n.topics[ti].questions[qi].images = n.topics[ti].questions[qi].images.filter((x) => x !== imgId); })} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><FiX size={14} /></button>
                      </div>
                    ))}
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 cursor-pointer hover:underline">
                    <FiImage /> Add image (UML, diagram, screenshot)
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { uploadImages(ti, qi, e.target.files); e.target.value = ''; }} />
                  </label>
                </div>

                {/* MCQ options */}
                {q.qType === 'MCQ' && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Select the radio button of the correct option.</p>
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input type="radio" name={`correct-${ti}-${qi}`} checked={q.correctIndex === oi} onChange={() => mutate((n) => { n.topics[ti].questions[qi].correctIndex = oi; })} />
                        <input value={opt} placeholder={`Option ${oi + 1}`} onChange={(e) => mutate((n) => { n.topics[ti].questions[qi].options[oi] = e.target.value; })} className="flex-1 p-2 border rounded text-sm bg-white" />
                        {q.options.length > 2 && (
                          <button type="button" onClick={() => mutate((n) => { const qq = n.topics[ti].questions[qi]; qq.options.splice(oi, 1); if (qq.correctIndex >= qq.options.length) qq.correctIndex = 0; })} className="text-red-500"><FiTrash2 size={16} /></button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => mutate((n) => { n.topics[ti].questions[qi].options.push(''); })} className="text-sm font-bold text-blue-600 hover:underline">+ Add option</button>
                    <textarea placeholder="Explanation shown after the student answers (optional)" rows="2" value={q.explanation} onChange={(e) => mutate((n) => { n.topics[ti].questions[qi].explanation = e.target.value; })} className="w-full p-2 border rounded text-sm bg-white" />
                  </div>
                )}
              </div>
            ))}
            <button type="button" onClick={() => mutate((n) => { n.topics[ti].questions.push(emptyQuestion()); })} className="text-sm font-bold text-blue-600 flex items-center gap-1 hover:underline">
              <FiPlus /> Add another question to this topic
            </button>
          </div>
        </div>
      ))}

      <button type="button" onClick={() => mutate((n) => { n.topics.push(emptyTopic()); })} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold flex items-center justify-center gap-2 hover:bg-gray-50">
        <FiPlus size={20} /> Add New Topic
      </button>
    </form>
  );
};

export default AssignmentBuilder;