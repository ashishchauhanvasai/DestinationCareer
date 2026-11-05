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
const labelCls = "block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1";

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
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
          {isEdit ? 'Edit Assignment' : 'Assignment Builder'}
        </h1>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <button type="button" onClick={() => navigate(home)} className="glass-button px-6 py-3.5 rounded-xl font-extrabold text-gray-700 dark:text-gray-300 text-[15px] transition-all hover:scale-[0.98] border border-gray-300 dark:border-slate-600">
            Cancel
          </button>
          <button type="submit" disabled={uploading} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white px-8 py-3.5 rounded-xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 text-[15px] transition-transform hover:scale-[0.98]">
            <FiSave size={18} /> {uploading ? 'Uploading image...' : 'Save Assignment'}
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 md:p-10 rounded-[2.5rem] shadow-sm space-y-5">
        <h2 className="font-extrabold text-2xl text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-5 tracking-tight">1. Assignment Details</h2>
        <div>
          <label className={labelCls}>Assignment Title</label>
          <input required placeholder="e.g. Java OOP Assignment" value={a.title} onChange={(e) => mutate((n) => { n.title = e.target.value; })} className={`${inputCls} font-extrabold text-[15px]`} />
        </div>
        <div>
          <label className={labelCls}>Difficulty Level</label>
          <select value={a.level} onChange={(e) => mutate((n) => { n.level = e.target.value; })} className={`${inputCls} cursor-pointer`}>
            <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Description (Optional)</label>
          <textarea placeholder="Short description..." value={a.description} onChange={(e) => mutate((n) => { n.description = e.target.value; })} className={`${inputCls} resize-none h-24 leading-relaxed`} />
        </div>
      </div>

      {/* WHO CAN SEE IT */}
      <div className="glass-panel p-6 md:p-10 rounded-[2.5rem] shadow-sm space-y-6">
        <h2 className="font-extrabold text-2xl text-gray-900 dark:text-white tracking-tight border-b border-gray-200 dark:border-slate-700 pb-5">2. Visibility & Access</h2>

        {!isTrainer && (
          <div className="flex flex-col sm:flex-row gap-4 p-5 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
            <label className="flex flex-1 items-center gap-3 text-[13px] font-extrabold cursor-pointer group bg-white dark:bg-slate-900 p-4 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-sm">
              <input type="radio" name="audience" checked={a.audience === 'everyone'} onChange={() => mutate((n) => { n.audience = 'everyone'; })} className="w-5 h-5 accent-blue-600 shrink-0" />
              <span className="text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">Everyone <span className="text-gray-500 font-medium">(all students)</span></span>
            </label>
            <label className="flex flex-1 items-center gap-3 text-[13px] font-extrabold cursor-pointer group bg-white dark:bg-slate-900 p-4 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-sm">
              <input type="radio" name="audience" checked={a.audience === 'batches'} onChange={() => mutate((n) => { n.audience = 'batches'; })} className="w-5 h-5 accent-blue-600 shrink-0" />
              <span className="text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">Only selected batches</span>
            </label>
          </div>
        )}

        {showBatchPicker && (
          <div className="animate-fade-in">
            <p className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mb-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 p-3 rounded-xl uppercase tracking-wider leading-relaxed shadow-sm">
              {isTrainer
                ? 'Only students of the batches you tick will see this assignment. A student joins a batch when they scan attendance.'
                : 'Only students of the ticked batches will see it. A student joins a batch when they scan attendance.'}
            </p>
            {batchList.length === 0 ? (
              <p className="text-[15px] font-bold text-gray-500 dark:text-gray-400 p-8 text-center bg-gray-50 dark:bg-slate-800 rounded-2xl shadow-inner border border-gray-200 dark:border-slate-700">
                {isTrainer ? 'No batches are assigned to you yet.' : 'No batches created yet.'}
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {batchList.map((b) => (
                  <label key={b._id} className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer transition-all duration-300 shadow-sm border ${a.batches.includes(String(b._id)) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'}`}>
                    <input type="checkbox" className="mt-1 w-5 h-5 accent-blue-600 rounded shrink-0" checked={a.batches.includes(String(b._id))} onChange={() => toggleBatch(String(b._id))} />
                    <div className="min-w-0 pr-2">
                      <p className="font-extrabold text-gray-900 dark:text-white truncate text-[15px]">{b.subject}</p>
                      <p className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 uppercase tracking-wider mt-1">{b.batchCode}</p>
                      {!isTrainer && b.trainerName && <p className="text-[10px] font-medium text-gray-500 mt-1 truncate uppercase tracking-widest">Trainer: {b.trainerName}</p>}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {a.topics.map((t, ti) => (
        <div key={t._id || ti} className="glass-panel p-6 md:p-10 rounded-[2.5rem] shadow-sm relative transition-all duration-300 group overflow-hidden">
          {/* Blue decorative left border */}
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-500 shadow-[2px_0_10px_rgba(59,130,246,0.5)]"></div>
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pl-2 border-b border-gray-200 dark:border-slate-700 pb-5">
            <h2 className="font-extrabold text-2xl text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
               <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-lg text-sm uppercase tracking-wider shadow-sm">Topic {ti + 1}</span>
            </h2>
            <button type="button" onClick={() => window.confirm('Remove this topic and all its questions?') && mutate((n) => { n.topics.splice(ti, 1); })} className="w-full sm:w-auto text-[11px] font-extrabold text-red-600 dark:text-red-400 hover:text-white bg-red-50 dark:bg-red-900/30 hover:bg-red-500 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800 transition-all uppercase tracking-wider shadow-sm">
              Remove Topic
            </button>
          </div>
          
          <div className="mb-8 pl-2">
            <label className={labelCls}>Topic Name</label>
            <input required placeholder="e.g. Inheritance" value={t.topicName} onChange={(e) => mutate((n) => { n.topics[ti].topicName = e.target.value; })} className={`${inputCls} font-extrabold text-[15px]`} />
          </div>

          <div className="pl-4 md:pl-8 border-l-2 border-gray-200 dark:border-slate-700 space-y-6">
            {t.questions.map((q, qi) => (
              <div key={q._id || qi} className="bg-gray-50 dark:bg-slate-800 p-6 md:p-8 rounded-[2rem] border border-gray-200 dark:border-slate-700 shadow-sm space-y-6 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-slate-700 pb-5">
                  <span className="text-[11px] font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-widest bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">Question {qi + 1}</span>
                  <button type="button" onClick={() => window.confirm('Remove this question?') && mutate((n) => { n.topics[ti].questions.splice(qi, 1); })} className="text-[11px] font-extrabold text-red-500 hover:text-red-700 uppercase tracking-wider">Remove Question</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <input type="number" min="0" value={q.marks} onChange={(e) => mutate((n) => { n.topics[ti].questions[qi].marks = Number(e.target.value); })} className={`${inputCls} w-28 text-center font-black text-lg`} />
                      <span className="text-sm font-extrabold text-gray-500">Marks</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Question Text</label>
                  <textarea required placeholder="Write your question here..." rows="4" value={q.text} onChange={(e) => mutate((n) => { n.topics[ti].questions[qi].text = e.target.value; })} className={`${inputCls} resize-none leading-relaxed text-[13px]`} />
                </div>

                {/* Images */}
                <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-sm">
                  <label className={labelCls}>Attached Images</label>
                  <div className="flex flex-wrap gap-4 mb-4 mt-3">
                    {q.images.map((imgId) => (
                      <div key={imgId} className="relative group">
                        <img src={`${BASE}/assignment-images/${imgId}`} alt="" className="h-32 rounded-xl border border-gray-200 dark:border-slate-700 bg-white shadow-sm object-cover" />
                        <button type="button" onClick={() => mutate((n) => { n.topics[ti].questions[qi].images = n.topics[ti].questions[qi].images.filter((x) => x !== imgId); })} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"><FiX size={16} /></button>
                      </div>
                    ))}
                  </div>
                  <label className="inline-flex items-center justify-center gap-2 text-[11px] font-extrabold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-5 py-3 rounded-xl cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors uppercase tracking-wider shadow-sm mt-2 w-full sm:w-auto">
                    <FiImage size={18} /> Add Diagram / Screenshot
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { uploadImages(ti, qi, e.target.files); e.target.value = ''; }} />
                  </label>
                </div>

                {/* MCQ options */}
                {q.qType === 'MCQ' && (
                  <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
                    <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-slate-700 pb-3 mb-2">MCQ Options (Select the correct one)</p>
                    {q.options.map((opt, oi) => (   
                      <div key={oi} className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border transition-colors shadow-sm ${q.correctIndex === oi ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800'}`}>
                        <div className="flex items-center gap-4 w-full">
                          <input type="radio" name={`correct-${ti}-${qi}`} className="w-5 h-5 accent-green-600 shrink-0" checked={q.correctIndex === oi} onChange={() => mutate((n) => { n.topics[ti].questions[qi].correctIndex = oi; })} />
                          <input value={opt} placeholder={`Option ${oi + 1}`} onChange={(e) => mutate((n) => { n.topics[ti].questions[qi].options[oi] = e.target.value; })} className="flex-1 bg-transparent border-none focus:outline-none text-[15px] font-bold text-gray-900 dark:text-white" />
                        </div>
                        {q.options.length > 2 && (
                          <button type="button" onClick={() => mutate((n) => { const qq = n.topics[ti].questions[qi]; qq.options.splice(oi, 1); if (qq.correctIndex >= qq.options.length) qq.correctIndex = 0; })} className="text-red-500 bg-red-50 dark:bg-red-900/30 p-2.5 rounded-xl hover:bg-red-500 hover:text-white transition-colors border border-red-200 dark:border-red-800 sm:w-auto w-full flex justify-center"><FiTrash2 size={16} /></button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => mutate((n) => { n.topics[ti].questions[qi].options.push(''); })} className="text-[11px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-5 py-3 rounded-xl uppercase tracking-wider hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-200 dark:border-blue-800 shadow-sm mt-2 w-full sm:w-auto">+ Add Option</button>
                    
                    <div className="pt-6 border-t border-gray-200 dark:border-slate-700 mt-6">
                      <label className={labelCls}>Explanation (Optional)</label>
                      <textarea placeholder="Shown after the student answers..." rows="3" value={q.explanation} onChange={(e) => mutate((n) => { n.topics[ti].questions[qi].explanation = e.target.value; })} className={`${inputCls} resize-none leading-relaxed text-[13px]`} />
                    </div>
                  </div>
                )}
              </div>
            ))}
            <button type="button" onClick={() => mutate((n) => { n.topics[ti].questions.push(emptyQuestion()); })} className="w-full sm:w-fit text-[13px] font-extrabold text-blue-700 dark:text-blue-400 flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-6 py-3.5 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors shadow-sm">
              <FiPlus size={18} /> Add Question to Topic
            </button>
          </div>
        </div>
      ))}

      <button type="button" onClick={() => mutate((n) => { n.topics.push(emptyTopic()); })} className="w-full py-10 border-2 border-dashed border-blue-300 dark:border-blue-900 rounded-[2.5rem] text-blue-600 dark:text-blue-400 font-extrabold text-xl flex flex-col md:flex-row items-center justify-center gap-4 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors shadow-sm group">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full group-hover:scale-110 transition-transform"><FiPlus size={28} /></div> Add New Topic
      </button>
    </form>
  );
};

export default AssignmentBuilder;