import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPlus, FiSave, FiTrash2, FiImage, FiX } from 'react-icons/fi';

const BASE = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const emptyQuestion = () => ({
  qType: 'Descriptive', text: '', images: [], options: ['', ''], correctIndex: 0, explanation: '', marks: 1
});
const emptyTopic = () => ({ topicName: '', questions: [emptyQuestion()] });
const emptyAssignment = () => ({
  title: '', level: 'Beginner', description: '', topics: [emptyTopic()],
  audience: 'everyone', batches: []
});

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

const inputCls = "apple-input";
const labelCls = "block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1";

const AssignmentBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const isTrainer = localStorage.getItem('role') === 'trainer';
  const home = isTrainer ? '/trainer/assignments' : '/admin?tab=Assignments';

  const [a, setA] = useState(() => ({ ...emptyAssignment(), audience: isTrainer ? 'batches' : 'everyone' }));
  const [batchList, setBatchList] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    axios.get(`${BASE}/staff/batches`, cfg())
      .then((r) => setBatchList(r.data.batches))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    axios.get(`${BASE}/assignments/${id}`, cfg())
      .then((r) => setA({ ...r.data, audience: r.data.audience || 'everyone', batches: (r.data.batches || []).map(String) }))
      .catch(() => alert('Could not load assignment'));
  }, [id, isEdit]);

  const mutate = (fn) => setA((prev) => { const n = JSON.parse(JSON.stringify(prev)); fn(n); return n; });

  const toggleBatch = (batchId) => mutate((n) => {
    const i = n.batches.indexOf(batchId);
    if (i >= 0) n.batches.splice(i, 1);
    else n.batches.push(batchId);
  });

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
    if ((isTrainer || a.audience === 'batches') && a.batches.length === 0) {
      return alert('Choose at least one batch for this assignment.');
    }
    try {
      const payload = { ...a, audience: isTrainer ? 'batches' : a.audience, batchIds: a.batches };
      if (isEdit) await axios.put(`${BASE}/assignments/${id}`, payload, cfg());
      else await axios.post(`${BASE}/assignments`, payload, cfg());
      alert('Assignment saved!');
      navigate(home);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    }
  };

  const showBatchPicker = isTrainer || a.audience === 'batches';

  return (
    <form onSubmit={save} className="max-w-5xl mx-auto py-8 space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          {isEdit ? 'Edit Assignment' : 'Assignment Builder'}
        </h1>
        <div className="flex gap-4">
          <button type="button" onClick={() => navigate(home)} className="glass-button px-6 py-3.5 rounded-xl font-extrabold text-gray-700 dark:text-gray-300 text-[15px] transition-all hover:scale-[0.98]">
            Cancel
          </button>
          <button type="submit" disabled={uploading} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white px-8 py-3.5 rounded-xl font-extrabold flex items-center gap-2 shadow-lg shadow-blue-500/30 text-[15px] transition-all hover:scale-[0.98]">
            <FiSave size={18} /> {uploading ? 'Uploading image...' : 'Save Assignment'}
          </button>
        </div>
      </div>

      <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] shadow-sm border-white/60 space-y-5">
        <h2 className="font-extrabold text-2xl text-gray-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-4 mb-4 tracking-tight">1. Assignment Details</h2>
        <div>
          <label className={labelCls}>Assignment Title</label>
          <input required placeholder="e.g. Java OOP Assignment" value={a.title} onChange={(e) => mutate((n) => { n.title = e.target.value; })} className={`${inputCls} font-bold text-lg`} />
        </div>
        <div>
          <label className={labelCls}>Difficulty Level</label>
          <select value={a.level} onChange={(e) => mutate((n) => { n.level = e.target.value; })} className={`${inputCls} cursor-pointer`}>
            <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Description (Optional)</label>
          <textarea placeholder="Short description..." value={a.description} onChange={(e) => mutate((n) => { n.description = e.target.value; })} className={`${inputCls} resize-none h-24`} />
        </div>
      </div>

      {/* WHO CAN SEE IT */}
      <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] shadow-sm border-white/60 space-y-6">
        <h2 className="font-extrabold text-2xl text-gray-900 dark:text-white tracking-tight border-b border-black/5 dark:border-white/5 pb-4">2. Visibility & Access</h2>

        {!isTrainer && (
          <div className="flex flex-wrap gap-8 p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 shadow-inner">
            <label className="flex items-center gap-3 text-sm font-extrabold cursor-pointer group">
              <input type="radio" name="audience" checked={a.audience === 'everyone'} onChange={() => mutate((n) => { n.audience = 'everyone'; })} className="w-5 h-5 accent-blue-600" />
              <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-600 transition-colors">Everyone (all students)</span>
            </label>
            <label className="flex items-center gap-3 text-sm font-extrabold cursor-pointer group">
              <input type="radio" name="audience" checked={a.audience === 'batches'} onChange={() => mutate((n) => { n.audience = 'batches'; })} className="w-5 h-5 accent-blue-600" />
              <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-600 transition-colors">Only selected batches</span>
            </label>
          </div>
        )}

        {showBatchPicker && (
          <div className="animate-fade-in">
            <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-4 bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
              {isTrainer
                ? 'Only students of the batches you tick will see this assignment. A student joins a batch when they scan attendance.'
                : 'Only students of the ticked batches will see it. A student joins a batch when they scan attendance.'}
            </p>
            {batchList.length === 0 ? (
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 p-8 text-center bg-black/5 dark:bg-white/5 rounded-2xl">
                {isTrainer ? 'No batches are assigned to you yet.' : 'No batches created yet.'}
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {batchList.map((b) => (
                  <label key={b._id} className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer transition-all duration-300 shadow-sm border ${a.batches.includes(String(b._id)) ? 'border-blue-500 bg-blue-500/10' : 'bg-white/50 dark:bg-slate-800/50 border-white/50 dark:border-slate-700/50 hover:bg-white hover:border-gray-300'}`}>
                    <input type="checkbox" className="mt-1 w-5 h-5 accent-blue-600 rounded" checked={a.batches.includes(String(b._id))} onChange={() => toggleBatch(String(b._id))} />
                    <div className="min-w-0">
                      <p className="font-extrabold text-gray-900 dark:text-white truncate">{b.subject}</p>
                      <p className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider mt-1">{b.batchCode}</p>
                      {!isTrainer && b.trainerName && <p className="text-[10px] font-medium text-gray-500 mt-1 truncate">Trainer: {b.trainerName}</p>}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {a.topics.map((t, ti) => (
        <div key={t._id || ti} className="glass-panel p-8 md:p-10 rounded-[2.5rem] shadow-md border-l-8 border-l-blue-500 relative transition-all duration-300 group">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-extrabold text-2xl text-blue-600 dark:text-blue-400 tracking-tight">Topic {ti + 1}</h2>
            <button type="button" onClick={() => window.confirm('Remove this topic and all its questions?') && mutate((n) => { n.topics.splice(ti, 1); })} className="text-xs font-extrabold text-red-500 hover:text-white bg-red-500/10 hover:bg-red-600 px-4 py-2 rounded-xl border border-red-500/20 transition-all uppercase tracking-wider">
              Remove Topic
            </button>
          </div>
          
          <div className="mb-8">
            <label className={labelCls}>Topic Name</label>
            <input required placeholder="e.g. Inheritance" value={t.topicName} onChange={(e) => mutate((n) => { n.topics[ti].topicName = e.target.value; })} className={`${inputCls} font-bold`} />
          </div>

          <div className="pl-4 md:pl-8 border-l-2 border-black/5 dark:border-white/10 space-y-6">
            {t.questions.map((q, qi) => (
              <div key={q._id || qi} className="bg-black/5 dark:bg-white/5 p-6 md:p-8 rounded-[2rem] border border-black/5 dark:border-white/5 shadow-inner space-y-5">
                <div className="flex justify-between items-center border-b border-black/10 dark:border-white/10 pb-4">
                  <span className="text-sm font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-widest bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">Question {qi + 1}</span>
                  <button type="button" onClick={() => window.confirm('Remove this question?') && mutate((n) => { n.topics[ti].questions.splice(qi, 1); })} className="text-[11px] font-extrabold text-red-500 hover:text-red-700 uppercase tracking-wider">Remove Question</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}>Question Type</label>
                    <select value={q.qType} onChange={(e) => mutate((n) => { n.topics[ti].questions[qi].qType = e.target.value; })} className={`${inputCls} cursor-pointer`}>
                      <option value="Descriptive">Descriptive (written answer)</option>
                      <option value="MCQ">MCQ (auto-graded)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Marks</label>
                    <div className="flex items-center gap-3">
                      <input type="number" min="0" value={q.marks} onChange={(e) => mutate((n) => { n.topics[ti].questions[qi].marks = Number(e.target.value); })} className="apple-input w-28 text-center font-bold" />
                      <span className="text-sm font-bold text-gray-500">Marks</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Question Text</label>
                  <textarea required placeholder="Write your question here..." rows="4" value={q.text} onChange={(e) => mutate((n) => { n.topics[ti].questions[qi].text = e.target.value; })} className={`${inputCls} resize-none`} />
                </div>

                {/* Images */}
                <div className="bg-white/40 dark:bg-slate-900/40 p-5 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm">
                  <label className={labelCls}>Attached Images</label>
                  <div className="flex flex-wrap gap-4 mb-4 mt-2">
                    {q.images.map((imgId) => (
                      <div key={imgId} className="relative group">
                        <img src={`${BASE}/assignment-images/${imgId}`} alt="" className="h-28 rounded-xl border border-gray-200 bg-white shadow-sm object-cover" />
                        <button type="button" onClick={() => mutate((n) => { n.topics[ti].questions[qi].images = n.topics[ti].questions[qi].images.filter((x) => x !== imgId); })} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"><FiX size={14} /></button>
                      </div>
                    ))}
                  </div>
                  <label className="inline-flex items-center justify-center gap-2 text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-4 py-2.5 rounded-xl cursor-pointer hover:bg-blue-500/20 transition-colors uppercase tracking-wider">
                    <FiImage size={16} /> Add Diagram / Screenshot
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { uploadImages(ti, qi, e.target.files); e.target.value = ''; }} />
                  </label>
                </div>

                {/* MCQ options */}
                {q.qType === 'MCQ' && (
                  <div className="bg-white/40 dark:bg-slate-900/40 p-6 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm space-y-4">
                    <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest border-b border-black/5 dark:border-white/5 pb-2">MCQ Options (Select the correct one)</p>
                    {q.options.map((opt, oi) => (
                      <div key={oi} className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${q.correctIndex === oi ? 'border-green-500 bg-green-500/10' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                        <input type="radio" name={`correct-${ti}-${qi}`} className="w-5 h-5 accent-green-600" checked={q.correctIndex === oi} onChange={() => mutate((n) => { n.topics[ti].questions[qi].correctIndex = oi; })} />
                        <input value={opt} placeholder={`Option ${oi + 1}`} onChange={(e) => mutate((n) => { n.topics[ti].questions[qi].options[oi] = e.target.value; })} className="flex-1 bg-transparent border-none focus:outline-none text-sm font-semibold text-gray-800 dark:text-white" />
                        {q.options.length > 2 && (
                          <button type="button" onClick={() => mutate((n) => { const qq = n.topics[ti].questions[qi]; qq.options.splice(oi, 1); if (qq.correctIndex >= qq.options.length) qq.correctIndex = 0; })} className="text-red-500 bg-red-500/10 p-2 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><FiTrash2 size={16} /></button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => mutate((n) => { n.topics[ti].questions[qi].options.push(''); })} className="text-xs font-extrabold text-blue-600 bg-blue-500/10 px-4 py-2 rounded-lg uppercase tracking-wider hover:bg-blue-500/20 transition-colors">+ Add Option</button>
                    
                    <div className="pt-4 border-t border-black/5 dark:border-white/5 mt-4">
                      <label className={labelCls}>Explanation (Optional)</label>
                      <textarea placeholder="Shown after the student answers..." rows="2" value={q.explanation} onChange={(e) => mutate((n) => { n.topics[ti].questions[qi].explanation = e.target.value; })} className={`${inputCls} resize-none`} />
                    </div>
                  </div>
                )}
              </div>
            ))}
            <button type="button" onClick={() => mutate((n) => { n.topics[ti].questions.push(emptyQuestion()); })} className="w-fit text-[13px] font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-5 py-3 rounded-xl hover:bg-blue-500/20 transition-colors shadow-sm">
              <FiPlus size={18} /> Add Question to Topic
            </button>
          </div>
        </div>
      ))}

      <button type="button" onClick={() => mutate((n) => { n.topics.push(emptyTopic()); })} className="w-full py-8 border-4 border-dashed border-blue-300 dark:border-blue-900 rounded-[2.5rem] text-blue-500 dark:text-blue-400 font-extrabold text-lg flex items-center justify-center gap-3 hover:bg-blue-500/10 transition-colors">
        <div className="p-3 bg-blue-500/20 rounded-full"><FiPlus size={24} /></div> Add New Topic
      </button>
    </form>
  );
};

export default AssignmentBuilder;