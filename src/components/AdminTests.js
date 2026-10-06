// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import ReactMarkdown from 'react-markdown';
// import {
//   FiTrash2, FiEdit, FiPlus, FiX, FiUploadCloud, FiDownload,
//   FiCheckCircle, FiAlertTriangle, FiSearch,
// } from 'react-icons/fi';
// import { parseProblemMd, downloadSampleMd } from '../utils/parseProblemMd';

// const API = `${process.env.REACT_APP_API_URL}/api/problems`;
// const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

// const LANGS = [
//   { id: 'java', label: 'Java' },
//   { id: 'python', label: 'Python' },
//   { id: 'javascript', label: 'JavaScript' },
//   { id: 'cpp', label: 'C++' },
//   { id: 'c', label: 'C' },
//   { id: 'csharp', label: 'C#' },
// ];

// const DEFAULT_STARTER = {
//   java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // write your solution\n    }\n}`,
//   python: `# write your solution\n`,
//   javascript: `const lines = require('fs').readFileSync(0, 'utf8').split('\\n');\n// write your solution\n`,
//   cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    // write your solution\n    return 0;\n}`,
//   c: `#include <stdio.h>\nint main() {\n    // write your solution\n    return 0;\n}`,
//   csharp: `using System;\nclass Program {\n    static void Main() {\n        // write your solution\n    }\n}`,
// };

// const diffColor = { Easy: 'text-green-700 bg-green-50', Medium: 'text-yellow-700 bg-yellow-50', Hard: 'text-red-700 bg-red-50' };

// const inputCls = 'w-full p-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400';
// const labelCls = 'block text-xs font-semibold text-gray-500 mb-1';
// const MD_CLASS =
//   'text-sm text-gray-800 leading-relaxed [&_p]:mb-3 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:font-bold [&_h3]:mt-3 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1 [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-gray-50 [&_pre]:border [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0';

// const emptyTestCase = () => ({ input: '', expectedOutput: '', isSample: true });

// // ---- function-style questions (student writes only the method, like LeetCode) ----
// // the types a function can use (same names as the backend)
// const TYPES = ['int', 'long', 'double', 'boolean', 'String', 'int[]', 'long[]', 'double[]', 'boolean[]', 'String[]', 'int[][]'];
// const emptyParam = () => ({ name: '', type: 'int' });
// const NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
// // "int[] twoSum(int[] nums, int target)"  -> shown as a live preview
// const signatureText = (f) => `${f.returnType} ${f.functionName || 'functionName'}(${(f.params || []).map((p) => `${p.type} ${p.name || 'param'}`).join(', ')})`;
// // starter code that is missing/empty falls back to the default template
// const mergeStarter = (sc) => LANGS.reduce((acc, l) => { acc[l.id] = (sc && sc[l.id]) || DEFAULT_STARTER[l.id]; return acc; }, {});
// // returns an error message, or null when the signature is fine
// const checkSignature = (f) => {
//   if (!NAME_RE.test(f.functionName.trim())) return 'Enter a valid function name (letters, digits and _ only), for example twoSum.';
//   const seen = new Set();
//   for (const p of f.params) {
//     const n = p.name.trim();
//     if (!NAME_RE.test(n)) return `Parameter name "${p.name}" is not valid. Use letters, digits and _ only.`;
//     if (seen.has(n)) return `Parameter "${n}" is used twice.`;
//     seen.add(n);
//   }
//   return null;
// };

// const emptyForm = () => ({
//   title: '', difficulty: 'Easy', points: 100, timeLimit: 2,
//   statementMd: '', testCases: [emptyTestCase()], starterCode: { ...DEFAULT_STARTER },
//   mode: 'function', functionName: '', returnType: 'int[]', params: [emptyParam()],
// });

// // parsed .md -> the same shape the builder form / POST /api/problems uses
// const toPayload = (p) => ({
//   title: p.title,
//   difficulty: p.difficulty,
//   points: p.points,
//   timeLimit: p.timeLimit,
//   statementMd: p.statementMd,
//   testCases: p.testCases,
//   starterCode: { ...DEFAULT_STARTER, ...p.starterCode },
//   mode: p.mode || 'stdin',
//   functionName: p.functionName || '',
//   returnType: p.returnType || 'int',
//   params: p.params || [],
// });

// const AdminTests = () => {
//   const [view, setView] = useState('list'); // 'list' | 'builder' | 'submissions'
//   const [problems, setProblems] = useState([]);
//   const [subs, setSubs] = useState([]);
//   const [search, setSearch] = useState('');   // submissions search
//   const [qSearch, setQSearch] = useState(''); // questions search
//   const [viewingCode, setViewingCode] = useState(null);

//   const [editingId, setEditingId] = useState(null);
//   const [form, setForm] = useState(emptyForm());
//   const [activeLangTab, setActiveLangTab] = useState('java');
//   const [stmtTab, setStmtTab] = useState('write'); // 'write' | 'preview'

//   const [imported, setImported] = useState(null); // parsed .md waiting for confirmation
//   const [dragOver, setDragOver] = useState(false);

//   const loadProblems = async () => {
//     try { setProblems((await axios.get(API, cfg())).data); } catch (e) { console.error(e); }
//   };
//   const loadSubs = async () => {
//     try { setSubs((await axios.get(`${API}/admin/submissions`, cfg())).data); } catch (e) { console.error(e); }
//   };
//   useEffect(() => { loadProblems(); loadSubs(); }, []);

//   const mutate = (fn) => setForm((prev) => { const n = JSON.parse(JSON.stringify(prev)); fn(n); return n; });

//   const openBuilder = (nextForm, id = null) => {
//     setEditingId(id);
//     setForm(nextForm);
//     setActiveLangTab('java');
//     setStmtTab('write');
//     setView('builder');
//   };

//   const startCreate = () => openBuilder(emptyForm());

//   const startEdit = async (id) => {
//     try {
//       const r = await axios.get(`${API}/admin/${id}`, cfg());
//       const p = r.data;
//       openBuilder({
//         title: p.title, difficulty: p.difficulty, points: p.points, timeLimit: p.timeLimit,
//         statementMd: p.statementMd, testCases: p.testCases.length ? p.testCases : [emptyTestCase()],
//         starterCode: mergeStarter(p.starterCode),
//         mode: p.mode || 'stdin',
//         functionName: p.functionName || '',
//         returnType: p.returnType || 'int[]',
//         params: p.params && p.params.length ? p.params.map((x) => ({ name: x.name, type: x.type })) : [emptyParam()],
//       }, id);
//     } catch { alert('Could not load question'); }
//   };

//   const save = async (e) => {
//     e.preventDefault();
//     if (!form.statementMd.trim()) {
//       setStmtTab('write');
//       return alert('Please write the problem statement.');
//     }
//     if (!form.testCases.some((t) => t.isSample)) {
//       return alert('At least one test case must be marked "Visible to students" so they have a sample to see.');
//     }
//     if (form.mode === 'function') {
//       const problem = checkSignature(form);
//       if (problem) return alert(problem);
//     }
//     const payload = {
//       ...form, points: Number(form.points), timeLimit: Number(form.timeLimit),
//       functionName: form.functionName.trim(),
//       params: form.params.map((x) => ({ name: x.name.trim(), type: x.type })),
//     };
//     try {
//       if (editingId) await axios.put(`${API}/${editingId}`, payload, cfg());
//       else await axios.post(API, payload, cfg());
//       setView('list');
//       loadProblems();
//     } catch (err) { alert(err.response?.data?.message || 'Failed to save question'); }
//   };

//   const del = async (id) => {
//     if (!window.confirm('Delete this question? Existing submissions for it will remain in the submissions table.')) return;
//     await axios.delete(`${API}/${id}`, cfg());
//     loadProblems();
//   };

//   // ---------------- Markdown import ----------------
//   const readMdFile = (f) => {
//     if (!f) return;
//     if (!/\.(md|markdown|txt)$/i.test(f.name)) return alert('Please choose a .md file.');
//     const reader = new FileReader();
//     reader.onload = () => {
//       const parsed = parseProblemMd(String(reader.result), f.name.replace(/\.[^.]+$/, ''));
//       setImported({ ...parsed, fileName: f.name });
//     };
//     reader.readAsText(f);
//   };
//   const onPick = (e) => { readMdFile(e.target.files[0]); e.target.value = ''; };
//   const onDrop = (e) => { e.preventDefault(); setDragOver(false); readMdFile(e.dataTransfer.files[0]); };

//   const saveImported = async () => {
//     if (!imported.testCases.length) return alert('No valid test cases were found. Use "Edit in form" to add them.');
//     try {
//       await axios.post(API, toPayload(imported), cfg());
//       setImported(null);
//       loadProblems();
//     } catch (err) { alert(err.response?.data?.message || 'Import failed'); }
//   };

//   const editImported = () => {
//     const payload = toPayload(imported);
//     if (!payload.testCases.length) payload.testCases = [emptyTestCase()];
//     setImported(null);
//     openBuilder(payload);
//   };

//   const shownProblems = problems.filter((p) => p.title.toLowerCase().includes(qSearch.toLowerCase()));
//   const shownSubs = subs.filter((s) => `${s.user?.name} ${s.user?.email} ${s.problem?.title}`.toLowerCase().includes(search.toLowerCase()));

//   // ---------------- BUILDER VIEW ----------------
//   if (view === 'builder') {
//     const customized = (id) => form.starterCode[id] !== DEFAULT_STARTER[id];

//     return (
//       <form onSubmit={save} className="max-w-4xl space-y-5">
//         <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Question' : 'Add Question'}</h2>

//         {/* Question type */}
//         <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-3">
//           <h3 className="font-bold text-gray-800">Question Type</h3>
//           <div className="grid sm:grid-cols-2 gap-3">
//             {[
//               { id: 'function', title: 'Write a function', text: 'Students write only the method. The tests call it automatically, like LeetCode.' },
//               { id: 'stdin', title: 'Write a full program', text: 'Students write the whole program: read the input and print the output.' },
//             ].map((o) => (
//               <button key={o.id} type="button" onClick={() => setForm({ ...form, mode: o.id })} className={`text-left p-4 rounded-xl border-2 ${form.mode === o.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
//                 <p className="font-bold text-gray-800">{o.title}</p>
//                 <p className="text-xs text-gray-500 mt-1">{o.text}</p>
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Basic information */}
//         <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
//           <h3 className="font-bold text-gray-800">Basic Information</h3>
//           <div>
//             <label className={labelCls}>Question title</label>
//             <input required placeholder="e.g. Two Sum" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={`${inputCls} font-semibold`} />
//           </div>
//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//             <div>
//               <label className={labelCls}>Difficulty</label>
//               <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className={inputCls}>
//                 <option>Easy</option><option>Medium</option><option>Hard</option>
//               </select>
//             </div>
//             <div>
//               <label className={labelCls}>Marks</label>
//               <input type="number" min="1" value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} className={inputCls} />
//             </div>
//             <div>
//               <label className={labelCls}>Time limit (seconds)</label>
//               <input type="number" min="1" step="any" value={form.timeLimit} onChange={(e) => setForm({ ...form, timeLimit: e.target.value })} className={inputCls} />
//             </div>
//           </div>
//         </div>

//         {/* Function signature (function questions only) */}
//         {form.mode === 'function' && (
//           <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
//             <div>
//               <h3 className="font-bold text-gray-800">Function Signature</h3>
//               <p className="text-xs text-gray-500 mt-0.5">The student's starter code, and the code that calls their function, are generated from this.</p>
//             </div>
//             <div className="grid sm:grid-cols-2 gap-4">
//               <div>
//                 <label className={labelCls}>Function name</label>
//                 <input required placeholder="e.g. twoSum" value={form.functionName} onChange={(e) => setForm({ ...form, functionName: e.target.value })} className={`${inputCls} font-mono`} />
//               </div>
//               <div>
//                 <label className={labelCls}>Return type</label>
//                 <select value={form.returnType} onChange={(e) => setForm({ ...form, returnType: e.target.value })} className={inputCls}>
//                   {TYPES.map((t) => <option key={t}>{t}</option>)}
//                 </select>
//               </div>
//             </div>
//             <div>
//               <label className={labelCls}>Parameters (in the order they are passed)</label>
//               <div className="space-y-2">
//                 {form.params.map((p, i) => (
//                   <div key={i} className="grid grid-cols-[1fr_9rem_auto] gap-2 items-center">
//                     <input required placeholder="name, e.g. nums" value={p.name} onChange={(e) => mutate((n) => { n.params[i].name = e.target.value; })} className={`${inputCls} font-mono`} />
//                     <select value={p.type} onChange={(e) => mutate((n) => { n.params[i].type = e.target.value; })} className={inputCls}>
//                       {TYPES.map((t) => <option key={t}>{t}</option>)}
//                     </select>
//                     <button type="button" title="Remove parameter" onClick={() => mutate((n) => { n.params.splice(i, 1); })} className="text-red-500 hover:text-red-700 p-2"><FiTrash2 size={16} /></button>
//                   </div>
//                 ))}
//               </div>
//               <button type="button" onClick={() => mutate((n) => { n.params.push(emptyParam()); })} className="mt-2 text-sm font-bold text-blue-600 flex items-center gap-1 hover:underline">
//                 <FiPlus /> Add Parameter
//               </button>
//             </div>
//             <div>
//               <p className={labelCls}>Students will see</p>
//               <pre className="bg-gray-900 text-gray-100 text-sm rounded-lg p-3 overflow-x-auto">{signatureText(form)}</pre>
//             </div>
//           </div>
//         )}

//         {/* Problem statement */}
//         <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-3">
//           <div className="flex justify-between items-center">
//             <h3 className="font-bold text-gray-800">Problem Statement</h3>
//             <div className="flex rounded-lg border overflow-hidden text-xs font-semibold">
//               {['write', 'preview'].map((t) => (
//                 <button key={t} type="button" onClick={() => setStmtTab(t)} className={`px-3 py-1.5 capitalize ${stmtTab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>{t}</button>
//               ))}
//             </div>
//           </div>
//           <textarea
//             rows="8"
//             placeholder="Describe the problem, input format, output format, constraints. Markdown is supported."
//             value={form.statementMd}
//             onChange={(e) => setForm({ ...form, statementMd: e.target.value })}
//             className={`${inputCls} font-mono ${stmtTab === 'write' ? '' : 'hidden'}`}
//           />
//           {stmtTab === 'preview' && (
//             <div className={`min-h-[180px] p-4 border rounded-lg bg-gray-50 ${MD_CLASS}`}>
//               <ReactMarkdown>{form.statementMd || '_Nothing to preview yet._'}</ReactMarkdown>
//             </div>
//           )}
//         </div>

//         {/* Test cases */}
//         <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-3">
//           <div>
//             <h3 className="font-bold text-gray-800">Test Cases</h3>
//             <p className="text-xs text-gray-500 mt-0.5">Visible cases are shown to students as examples. Hidden cases are used only for scoring.</p>
//             {form.mode === 'function' && (
//               <p className="text-xs text-gray-500 mt-1">
//                 <b>Input:</b> one value per parameter ({form.params.map((p) => `${p.name || '?'}: ${p.type}`).join(', ') || 'none'}), in that order, one per line. Writing <code>nums = [1,2]</code> also works. Put text in "quotes".{' '}
//                 <b>Expected output:</b> the returned value, for example <code>[0,1]</code>, <code>true</code> or <code>"abc"</code>.
//               </p>
//             )}
//           </div>

//           <div className="hidden md:grid grid-cols-[1fr_1fr_7rem] gap-3 px-3 text-xs font-semibold text-gray-400">
//             <span>Input</span><span>Expected output</span><span className="text-center">Visible</span>
//           </div>

//           {form.testCases.map((tc, i) => (
//             <div key={i} className="grid md:grid-cols-[1fr_1fr_7rem] gap-3 items-start bg-gray-50 border rounded-xl p-3">
//               <textarea required rows="2" placeholder={form.mode === 'function' ? 'e.g. nums = [2,7,11,15]\ntarget = 9' : 'Input'} value={tc.input} onChange={(e) => mutate((n) => { n.testCases[i].input = e.target.value; })} className={`${inputCls} font-mono`} />
//               <textarea required rows="2" placeholder={form.mode === 'function' ? 'e.g. [0,1]' : 'Expected output'} value={tc.expectedOutput} onChange={(e) => mutate((n) => { n.testCases[i].expectedOutput = e.target.value; })} className={`${inputCls} font-mono`} />
//               <div className="flex md:flex-col items-center justify-between md:justify-start gap-3 md:pt-2">
//                 <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
//                   <input type="checkbox" checked={tc.isSample} onChange={(e) => mutate((n) => { n.testCases[i].isSample = e.target.checked; })} />
//                   Visible
//                 </label>
//                 {form.testCases.length > 1 && (
//                   <button type="button" title="Remove test case" onClick={() => mutate((n) => { n.testCases.splice(i, 1); })} className="text-red-500 hover:text-red-700"><FiTrash2 size={16} /></button>
//                 )}
//               </div>
//             </div>
//           ))}

//           <button type="button" onClick={() => mutate((n) => { n.testCases.push(emptyTestCase()); })} className="text-sm font-bold text-blue-600 flex items-center gap-1 hover:underline">
//             <FiPlus /> Add Test Case
//           </button>
//         </div>

//         {/* Starter code (full-program questions only) */}
//         {form.mode === 'stdin' ? (
//         <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-3">
//           <div className="flex justify-between items-start gap-4">
//             <div>
//               <h3 className="font-bold text-gray-800">Starter Code <span className="text-xs font-normal text-gray-400">(optional)</span></h3>
//               <p className="text-xs text-gray-500 mt-0.5">Pre-fills the student's editor. A dot marks languages you've changed from the default.</p>
//             </div>
//             <button type="button" onClick={() => mutate((n) => { n.starterCode[activeLangTab] = DEFAULT_STARTER[activeLangTab]; })} className="text-xs font-semibold text-gray-500 hover:text-gray-800 whitespace-nowrap">Reset this language</button>
//           </div>
//           <div className="flex gap-1 border-b overflow-x-auto">
//             {LANGS.map((l) => (
//               <button key={l.id} type="button" onClick={() => setActiveLangTab(l.id)} className={`px-3 py-2 text-sm font-semibold whitespace-nowrap border-b-2 flex items-center gap-1 ${activeLangTab === l.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
//                 {l.label}
//                 {customized(l.id) && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
//               </button>
//             ))}
//           </div>
//           <textarea rows="10" spellCheck={false} value={form.starterCode[activeLangTab]} onChange={(e) => mutate((n) => { n.starterCode[activeLangTab] = e.target.value; })} className="w-full p-3 border rounded-lg text-sm font-mono bg-gray-900 text-gray-100" />
//         </div>
//         ) : (
//           <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl p-4">
//             <p className="font-bold text-sm">Starter code is automatic</p>
//             <p className="text-xs mt-1">Students get a ready template for Java, Python, JavaScript, C++ and C# built from the signature above. The code that calls their function is added for them when they click Run or Submit. C is not available for function questions.</p>
//           </div>
//         )}

//         <div className="sticky bottom-0 -mx-1 px-1 py-3 bg-gray-50/90 backdrop-blur border-t flex justify-end gap-3">
//           <button type="button" onClick={() => setView('list')} className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 font-bold hover:bg-white">Cancel</button>
//           <button type="submit" className="px-5 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700">{editingId ? 'Save Changes' : 'Save Question'}</button>
//         </div>
//       </form>
//     );
//   }

//   // ---------------- LIST / SUBMISSIONS VIEW ----------------
//   return (
//     <div className="space-y-6">
//       <div>
//         <h2 className="text-2xl font-bold text-gray-800">Coding Tests</h2>
//         <p className="text-sm text-gray-500 mt-1">Manage your coding problems and submissions</p>
//       </div>

//       <div className="flex gap-2">
//         <button onClick={() => setView('list')} className={`px-4 py-2 rounded-lg text-sm font-bold ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>Questions</button>
//         <button onClick={() => setView('submissions')} className={`px-4 py-2 rounded-lg text-sm font-bold ${view === 'submissions' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>Submissions</button>
//       </div>

//       {view === 'list' && (
//         <div className="space-y-6">
//           <div className="flex justify-between items-center gap-4">
//             <div className="relative w-full max-w-xs">
//               <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//               <input value={qSearch} onChange={(e) => setQSearch(e.target.value)} placeholder="Search questions" className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200" />
//             </div>
//             <button onClick={startCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 whitespace-nowrap"><FiPlus size={18} /> Add Question</button>
//           </div>

//           <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
//             <div className="px-4 py-3 border-b bg-gray-50 font-bold text-gray-800">Questions ({shownProblems.length})</div>
//             <table className="w-full text-left">
//               <thead className="text-gray-500 text-sm border-b">
//                 <tr><th className="p-4">Title</th><th className="p-4">Difficulty</th><th className="p-4">Marks</th><th className="p-4">Test Cases</th><th className="p-4 text-center">Actions</th></tr>
//               </thead>
//               <tbody className="divide-y">
//                 {shownProblems.length === 0 && (
//                   <tr><td colSpan="5" className="p-8 text-center text-gray-500">{problems.length === 0 ? 'No questions yet. Add one, or import a Markdown file below.' : 'No questions match your search.'}</td></tr>
//                 )}
//                 {shownProblems.map((p) => (
//                   <tr key={p._id}>
//                     <td className="p-4 font-semibold text-gray-800">{p.title}</td>
//                     <td className="p-4"><span className={`text-xs font-bold px-2 py-0.5 rounded ${diffColor[p.difficulty] || ''}`}>{p.difficulty}</span></td>
//                     <td className="p-4">{p.points}</td>
//                     <td className="p-4 text-sm text-gray-500">{p.testCases ? p.testCases.length : '—'}</td>
//                     <td className="p-4">
//                       <div className="flex justify-center gap-2">
//                         <button onClick={() => startEdit(p._id)} title="Edit" className="text-blue-500 hover:text-blue-700 p-2"><FiEdit size={18} /></button>
//                         <button onClick={() => del(p._id)} title="Delete" className="text-red-500 hover:text-red-700 p-2"><FiTrash2 size={18} /></button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           {/* Markdown import */}
//           <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
//             <div className="flex justify-between items-start gap-4">
//               <div>
//                 <h3 className="font-bold text-gray-800">Import Question from Markdown</h3>
//                 <p className="text-xs text-gray-500 mt-0.5">Title, statement, difficulty, marks, time limit, test cases and the function signature (or starter code) are filled in automatically. You'll see a preview before anything is saved.</p>
//               </div>
//               <button type="button" onClick={downloadSampleMd} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 whitespace-nowrap"><FiDownload /> Download sample .md</button>
//             </div>

//             {!imported && (
//               <label
//                 onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
//                 onDragLeave={() => setDragOver(false)}
//                 onDrop={onDrop}
//                 className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer flex flex-col items-center gap-2 transition-colors ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
//               >
//                 <FiUploadCloud size={28} className="text-blue-500" />
//                 <span className="font-bold text-gray-700">Drag and drop a .md file here</span>
//                 <span className="text-xs text-gray-400">or</span>
//                 <span className="px-4 py-2 rounded-lg bg-gray-800 text-white text-sm font-bold">Choose Markdown File</span>
//                 <input type="file" accept=".md,.markdown,text/markdown,text/plain" className="hidden" onChange={onPick} />
//               </label>
//             )}

//             {imported && (
//               <div className="space-y-4 border rounded-xl p-4 bg-gray-50">
//                 <div className="flex justify-between items-center">
//                   <h4 className="font-bold text-gray-800">Question Preview <span className="text-xs font-normal text-gray-400">from {imported.fileName}</span></h4>
//                   <button type="button" onClick={() => setImported(null)} className="text-gray-400 hover:text-gray-600" title="Discard"><FiX size={20} /></button>
//                 </div>

//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
//                   <div className="col-span-2"><p className={labelCls}>Title</p><p className="font-semibold">{imported.title}</p></div>
//                   <div><p className={labelCls}>Difficulty</p><span className={`text-xs font-bold px-2 py-0.5 rounded ${diffColor[imported.difficulty]}`}>{imported.difficulty}</span></div>
//                   <div><p className={labelCls}>Marks / Time limit</p><p className="font-semibold">{imported.points} / {imported.timeLimit}s</p></div>
//                 </div>

//                 <div>
//                   <p className={labelCls}>Problem statement</p>
//                   <div className={`max-h-44 overflow-y-auto p-3 border rounded-lg bg-white ${MD_CLASS}`}>
//                     <ReactMarkdown>{imported.statementMd || '_Empty_'}</ReactMarkdown>
//                   </div>
//                 </div>

//                 <div className="text-sm">
//                   <p className={labelCls}>Test cases</p>
//                   {imported.testCases.length ? (
//                     <p className="flex items-center gap-1.5 text-green-700 font-semibold">
//                       <FiCheckCircle /> {imported.testCases.length} found
//                       <span className="text-gray-500 font-normal">({imported.testCases.filter((t) => t.isSample).length} visible, {imported.testCases.filter((t) => !t.isSample).length} hidden)</span>
//                     </p>
//                   ) : (
//                     <p className="text-red-600 font-semibold">None found</p>
//                   )}
//                 </div>

//                 <div>
//                   <p className={labelCls}>Question type</p>
//                   {imported.mode === 'function' ? (
//                     <div className="space-y-1">
//                       <p className="text-sm font-semibold">Function <span className="text-xs font-normal text-gray-500">(starter code is generated automatically)</span></p>
//                       <pre className="bg-gray-900 text-gray-100 text-sm rounded-lg p-2 overflow-x-auto">{signatureText(imported)}</pre>
//                     </div>
//                   ) : (
//                     <p className="text-sm font-semibold">Full program <span className="text-xs font-normal text-gray-500">(reads input, prints output)</span></p>
//                   )}
//                 </div>

//                 {imported.mode === 'stdin' && (
//                   <div>
//                     <p className={labelCls}>Starter code</p>
//                     <div className="flex flex-wrap gap-2">
//                       {LANGS.map((l) => (
//                         imported.starterCode[l.id]
//                           ? <span key={l.id} className="text-xs font-bold px-2 py-1 rounded bg-green-50 text-green-700">{l.label} ✓</span>
//                           : <span key={l.id} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-500">{l.label} (default)</span>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 {imported.warnings.length > 0 && (
//                   <ul className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
//                     {imported.warnings.map((w, i) => <li key={i} className="flex gap-2"><FiAlertTriangle className="mt-0.5 shrink-0" />{w}</li>)}
//                   </ul>
//                 )}

//                 <div className="flex justify-end gap-3">
//                   <button type="button" onClick={() => setImported(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 font-bold hover:bg-white">Cancel</button>
//                   <button type="button" onClick={editImported} className="px-4 py-2 rounded-lg border border-blue-600 text-blue-600 font-bold hover:bg-blue-50">Edit in form</button>
//                   <button type="button" onClick={saveImported} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700">Save Question</button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {view === 'submissions' && (
//         <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
//           <div className="p-4 border-b bg-gray-50 flex justify-between items-center gap-4">
//             <span className="font-bold">Student Submissions ({shownSubs.length})</span>
//             <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student or question" className="p-2 border rounded text-sm w-64" />
//           </div>
//           <table className="w-full text-left text-sm">
//             <thead className="text-gray-500 border-b"><tr><th className="p-3">Student</th><th className="p-3">Question</th><th className="p-3">Lang</th><th className="p-3">Verdict</th><th className="p-3">Passed</th><th className="p-3">Marks</th><th className="p-3">Date</th><th className="p-3"></th></tr></thead>
//             <tbody className="divide-y">
//               {shownSubs.map((s) => (
//                 <tr key={s._id}>
//                   <td className="p-3">{s.user?.name}<br /><span className="text-xs text-gray-400">{s.user?.email}</span></td>
//                   <td className="p-3">{s.problem?.title}</td>
//                   <td className="p-3">{s.language}</td>
//                   <td className={`p-3 font-bold ${s.verdict === 'Accepted' ? 'text-green-600' : 'text-red-500'}`}>{s.verdict}</td>
//                   <td className="p-3">{s.passed}/{s.total}</td>
//                   <td className="p-3">{s.score}/{s.problem?.points}</td>
//                   <td className="p-3 text-gray-500">{new Date(s.createdAt).toLocaleString()}</td>
//                   <td className="p-3"><button onClick={() => setViewingCode(s)} className="text-blue-600 font-bold hover:underline">View code</button></td>
//                 </tr>
//               ))}
//               {shownSubs.length === 0 && <tr><td colSpan="8" className="p-8 text-center text-gray-500">No submissions yet.</td></tr>}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {viewingCode && (
//         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewingCode(null)}>
//           <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
//             <div className="flex justify-between items-center mb-3">
//               <div>
//                 <p className="font-bold">{viewingCode.user?.name} — {viewingCode.problem?.title}</p>
//                 <p className="text-xs text-gray-500">{viewingCode.language} • {viewingCode.verdict} • {viewingCode.passed}/{viewingCode.total} passed • {viewingCode.score} marks</p>
//               </div>
//               <button onClick={() => setViewingCode(null)} className="text-gray-400"><FiX size={22} /></button>
//             </div>
//             <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre">{viewingCode.code}</pre>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
// export default AdminTests;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import {
  FiTrash2, FiEdit, FiPlus, FiX, FiUploadCloud, FiDownload,
  FiCheckCircle, FiAlertTriangle, FiSearch,
} from 'react-icons/fi';
import { parseProblemMd, downloadSampleMd } from '../utils/parseProblemMd';

const API = `${process.env.REACT_APP_API_URL}/api/problems`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const LANGS = [
  { id: 'java', label: 'Java' },
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
];

const DEFAULT_STARTER = {
  java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // write your solution\n    }\n}`,
  python: `# write your solution\n`,
  javascript: `const lines = require('fs').readFileSync(0, 'utf8').split('\\n');\n// write your solution\n`,
};

const diffColor = { Easy: 'text-green-700 bg-green-50', Medium: 'text-yellow-700 bg-yellow-50', Hard: 'text-red-700 bg-red-50' };

const inputCls = 'w-full p-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400';
const labelCls = 'block text-xs font-semibold text-gray-500 mb-1';
const MD_CLASS =
  'text-sm text-gray-800 leading-relaxed [&_p]:mb-3 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:font-bold [&_h3]:mt-3 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1 [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-gray-50 [&_pre]:border [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0';

// isSample = true  -> VISIBLE example shown to students      isSample = false -> HIDDEN test case (scoring only)
const emptyTestCase = (isSample = true) => ({ input: '', expectedOutput: '', isSample });

// ---- function-style questions (student writes only the method, like LeetCode) ----
// the types a function can use (same names as the backend)
const TYPES = ['int', 'long', 'double', 'boolean', 'String', 'int[]', 'long[]', 'double[]', 'boolean[]', 'String[]', 'int[][]'];
const emptyParam = () => ({ name: '', type: 'int' });
const NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
// "int[] twoSum(int[] nums, int target)"  -> shown as a live preview
const signatureText = (f) => `${f.returnType} ${f.functionName || 'functionName'}(${(f.params || []).map((p) => `${p.type} ${p.name || 'param'}`).join(', ')})`;
// starter code that is missing/empty falls back to the default template
const mergeStarter = (sc) => LANGS.reduce((acc, l) => { acc[l.id] = (sc && sc[l.id]) || DEFAULT_STARTER[l.id]; return acc; }, {});
// returns an error message, or null when the signature is fine
const checkSignature = (f) => {
  if (!NAME_RE.test(f.functionName.trim())) return 'Enter a valid function name (letters, digits and _ only), for example twoSum.';
  const seen = new Set();
  for (const p of f.params) {
    const n = p.name.trim();
    if (!NAME_RE.test(n)) return `Parameter name "${p.name}" is not valid. Use letters, digits and _ only.`;
    if (seen.has(n)) return `Parameter "${n}" is used twice.`;
    seen.add(n);
  }
  return null;
};

const emptyForm = () => ({
  title: '', difficulty: 'Easy', points: 100, timeLimit: 2,
  statementMd: '', testCases: [emptyTestCase()], starterCode: { ...DEFAULT_STARTER },
  mode: 'function', functionName: '', returnType: 'int[]', params: [emptyParam()],
});

// parsed .md -> the same shape the builder form / POST /api/problems uses
const toPayload = (p) => ({
  title: p.title,
  difficulty: p.difficulty,
  points: p.points,
  timeLimit: p.timeLimit,
  statementMd: p.statementMd,
  testCases: p.testCases,
  starterCode: { ...DEFAULT_STARTER, ...p.starterCode },
  mode: p.mode || 'stdin',
  functionName: p.functionName || '',
  returnType: p.returnType || 'int',
  params: p.params || [],
});

const AdminTests = () => {
  const [view, setView] = useState('list'); // 'list' | 'builder' | 'submissions'
  const [problems, setProblems] = useState([]);
  const [subs, setSubs] = useState([]);
  const [search, setSearch] = useState('');   // submissions search
  const [qSearch, setQSearch] = useState(''); // questions search
  const [viewingCode, setViewingCode] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [activeLangTab, setActiveLangTab] = useState('java');
  const [stmtTab, setStmtTab] = useState('write'); // 'write' | 'preview'

  const [imported, setImported] = useState(null); // parsed .md waiting for confirmation
  const [dragOver, setDragOver] = useState(false);

  const loadProblems = async () => {
    try { setProblems((await axios.get(API, cfg())).data); } catch (e) { console.error(e); }
  };
  const loadSubs = async () => {
    try { setSubs((await axios.get(`${API}/admin/submissions`, cfg())).data); } catch (e) { console.error(e); }
  };
  useEffect(() => { loadProblems(); loadSubs(); }, []);

  const mutate = (fn) => setForm((prev) => { const n = JSON.parse(JSON.stringify(prev)); fn(n); return n; });

  const openBuilder = (nextForm, id = null) => {
    setEditingId(id);
    setForm(nextForm);
    setActiveLangTab('java');
    setStmtTab('write');
    setView('builder');
  };

  const startCreate = () => openBuilder(emptyForm());

  const startEdit = async (id) => {
    try {
      const r = await axios.get(`${API}/admin/${id}`, cfg());
      const p = r.data;
      openBuilder({
        title: p.title, difficulty: p.difficulty, points: p.points, timeLimit: p.timeLimit,
        statementMd: p.statementMd, testCases: p.testCases.length ? p.testCases : [emptyTestCase()],
        starterCode: mergeStarter(p.starterCode),
        mode: p.mode || 'stdin',
        functionName: p.functionName || '',
        returnType: p.returnType || 'int[]',
        params: p.params && p.params.length ? p.params.map((x) => ({ name: x.name, type: x.type })) : [emptyParam()],
      }, id);
    } catch { alert('Could not load question'); }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.statementMd.trim()) {
      setStmtTab('write');
      return alert('Please write the problem statement.');
    }
    if (!form.testCases.some((t) => t.isSample)) {
      return alert('At least one test case must be marked "Visible to students" so they have a sample to see.');
    }
    if (form.mode === 'function') {
      const problem = checkSignature(form);
      if (problem) return alert(problem);
    }
    const payload = {
      ...form, points: Number(form.points), timeLimit: Number(form.timeLimit),
      functionName: form.functionName.trim(),
      params: form.params.map((x) => ({ name: x.name.trim(), type: x.type })),
    };
    try {
      if (editingId) await axios.put(`${API}/${editingId}`, payload, cfg());
      else await axios.post(API, payload, cfg());
      setView('list');
      loadProblems();
    } catch (err) { alert(err.response?.data?.message || 'Failed to save question'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this question? Existing submissions for it will remain in the submissions table.')) return;
    await axios.delete(`${API}/${id}`, cfg());
    loadProblems();
  };

  // ---------------- Markdown import ----------------
  const readMdFile = (f) => {
    if (!f) return;
    if (!/\.(md|markdown|txt)$/i.test(f.name)) return alert('Please choose a .md file.');
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseProblemMd(String(reader.result), f.name.replace(/\.[^.]+$/, ''));
      setImported({ ...parsed, fileName: f.name });
    };
    reader.readAsText(f);
  };
  const onPick = (e) => { readMdFile(e.target.files[0]); e.target.value = ''; };
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); readMdFile(e.dataTransfer.files[0]); };

  const saveImported = async () => {
    if (!imported.testCases.length) return alert('No valid test cases were found. Use "Edit in form" to add them.');
    try {
      await axios.post(API, toPayload(imported), cfg());
      setImported(null);
      loadProblems();
    } catch (err) { alert(err.response?.data?.message || 'Import failed'); }
  };

  const editImported = () => {
    const payload = toPayload(imported);
    if (!payload.testCases.length) payload.testCases = [emptyTestCase()];
    setImported(null);
    openBuilder(payload);
  };

  const shownProblems = problems.filter((p) => p.title.toLowerCase().includes(qSearch.toLowerCase()));
  const shownSubs = subs.filter((s) => `${s.user?.name} ${s.user?.email} ${s.problem?.title}`.toLowerCase().includes(search.toLowerCase()));

  // ---------------- BUILDER VIEW ----------------
  if (view === 'builder') {
    const customized = (id) => form.starterCode[id] !== DEFAULT_STARTER[id];
    const visibleCount = form.testCases.filter((t) => t.isSample).length;
    const hiddenCount = form.testCases.length - visibleCount;

    return (
      <form onSubmit={save} className="max-w-4xl space-y-5">
        <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Question' : 'Add Question'}</h2>

        {/* Question type */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-3">
          <h3 className="font-bold text-gray-800">Question Type</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { id: 'function', title: 'Write a function', text: 'Students write only the method. The tests call it automatically, like LeetCode.' },
              { id: 'stdin', title: 'Write a full program', text: 'Students write the whole program: read the input and print the output.' },
            ].map((o) => (
              <button key={o.id} type="button" onClick={() => setForm({ ...form, mode: o.id })} className={`text-left p-4 rounded-xl border-2 ${form.mode === o.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <p className="font-bold text-gray-800">{o.title}</p>
                <p className="text-xs text-gray-500 mt-1">{o.text}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Basic information */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
          <h3 className="font-bold text-gray-800">Basic Information</h3>
          <div>
            <label className={labelCls}>Question title</label>
            <input required placeholder="e.g. Two Sum" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={`${inputCls} font-semibold`} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Difficulty</label>
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className={inputCls}>
                <option>Easy</option><option>Medium</option><option>Hard</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Marks</label>
              <input type="number" min="1" value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Time limit (seconds)</label>
              <input type="number" min="1" step="any" value={form.timeLimit} onChange={(e) => setForm({ ...form, timeLimit: e.target.value })} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Function signature (function questions only) */}
        {form.mode === 'function' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
            <div>
              <h3 className="font-bold text-gray-800">Function Signature</h3>
              <p className="text-xs text-gray-500 mt-0.5">The student's starter code, and the code that calls their function, are generated from this.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Function name</label>
                <input required placeholder="e.g. twoSum" value={form.functionName} onChange={(e) => setForm({ ...form, functionName: e.target.value })} className={`${inputCls} font-mono`} />
              </div>
              <div>
                <label className={labelCls}>Return type</label>
                <select value={form.returnType} onChange={(e) => setForm({ ...form, returnType: e.target.value })} className={inputCls}>
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Parameters (in the order they are passed)</label>
              <div className="space-y-2">
                {form.params.map((p, i) => (
                  <div key={i} className="grid grid-cols-[1fr_9rem_auto] gap-2 items-center">
                    <input required placeholder="name, e.g. nums" value={p.name} onChange={(e) => mutate((n) => { n.params[i].name = e.target.value; })} className={`${inputCls} font-mono`} />
                    <select value={p.type} onChange={(e) => mutate((n) => { n.params[i].type = e.target.value; })} className={inputCls}>
                      {TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <button type="button" title="Remove parameter" onClick={() => mutate((n) => { n.params.splice(i, 1); })} className="text-red-500 hover:text-red-700 p-2"><FiTrash2 size={16} /></button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => mutate((n) => { n.params.push(emptyParam()); })} className="mt-2 text-sm font-bold text-blue-600 flex items-center gap-1 hover:underline">
                <FiPlus /> Add Parameter
              </button>
            </div>
            <div>
              <p className={labelCls}>Students will see</p>
              <pre className="bg-gray-900 text-gray-100 text-sm rounded-lg p-3 overflow-x-auto">{signatureText(form)}</pre>
            </div>
          </div>
        )}

        {/* Problem statement */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Problem Statement</h3>
            <div className="flex rounded-lg border overflow-hidden text-xs font-semibold">
              {['write', 'preview'].map((t) => (
                <button key={t} type="button" onClick={() => setStmtTab(t)} className={`px-3 py-1.5 capitalize ${stmtTab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>{t}</button>
              ))}
            </div>
          </div>
          <textarea
            rows="8"
            placeholder="Describe the problem, input format, output format, constraints. Markdown is supported."
            value={form.statementMd}
            onChange={(e) => setForm({ ...form, statementMd: e.target.value })}
            className={`${inputCls} font-mono ${stmtTab === 'write' ? '' : 'hidden'}`}
          />
          {stmtTab === 'preview' && (
            <div className={`min-h-[180px] p-4 border rounded-lg bg-gray-50 ${MD_CLASS}`}>
              <ReactMarkdown>{form.statementMd || '_Nothing to preview yet._'}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Test cases */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-3">
          <div>
            <h3 className="font-bold text-gray-800">Test Cases</h3>
            <p className="text-xs text-gray-500 mt-0.5">Visible cases are shown to students as examples. Hidden cases are used only for scoring: students never see their input, expected output or their own output for them.</p>
            <p className="text-xs mt-1 font-semibold">
              <span className="text-green-700">{visibleCount} visible example{visibleCount === 1 ? '' : 's'}</span>
              {' · '}
              <span className="text-amber-700">{hiddenCount} hidden test case{hiddenCount === 1 ? '' : 's'}</span>
              {hiddenCount === 0 && <span className="text-gray-500 font-normal"> - tip: add hidden cases (edge cases, big inputs) so students cannot pass by only matching the examples.</span>}
            </p>
            {form.mode === 'function' && (
              <p className="text-xs text-gray-500 mt-1">
                <b>Input:</b> one value per parameter ({form.params.map((p) => `${p.name || '?'}: ${p.type}`).join(', ') || 'none'}), in that order, one per line. Writing <code>nums = [1,2]</code> also works. Put text in "quotes".{' '}
                <b>Expected output:</b> the returned value, for example <code>[0,1]</code>, <code>true</code> or <code>"abc"</code>.
              </p>
            )}
          </div>

          <div className="hidden md:grid grid-cols-[1fr_1fr_7rem] gap-3 px-3 text-xs font-semibold text-gray-400">
            <span>Input</span><span>Expected output</span><span className="text-center">Shown to students?</span>
          </div>

          {form.testCases.map((tc, i) => (
            <div key={i} className={`grid md:grid-cols-[1fr_1fr_7rem] gap-3 items-start border rounded-xl p-3 ${tc.isSample ? 'bg-gray-50' : 'bg-amber-50 border-amber-200'}`}>
              <textarea required rows="2" placeholder={form.mode === 'function' ? 'e.g. nums = [2,7,11,15]\ntarget = 9' : 'Input'} value={tc.input} onChange={(e) => mutate((n) => { n.testCases[i].input = e.target.value; })} className={`${inputCls} font-mono`} />
              <textarea required rows="2" placeholder={form.mode === 'function' ? 'e.g. [0,1]' : 'Expected output'} value={tc.expectedOutput} onChange={(e) => mutate((n) => { n.testCases[i].expectedOutput = e.target.value; })} className={`${inputCls} font-mono`} />
              <div className="flex md:flex-col items-center justify-between md:justify-start gap-3 md:pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                  <input type="checkbox" checked={tc.isSample} onChange={(e) => mutate((n) => { n.testCases[i].isSample = e.target.checked; })} />
                  {tc.isSample ? 'Visible' : 'Hidden'}
                </label>
                {form.testCases.length > 1 && (
                  <button type="button" title="Remove test case" onClick={() => mutate((n) => { n.testCases.splice(i, 1); })} className="text-red-500 hover:text-red-700"><FiTrash2 size={16} /></button>
                )}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-5">
            <button type="button" onClick={() => mutate((n) => { n.testCases.push(emptyTestCase(true)); })} className="text-sm font-bold text-blue-600 flex items-center gap-1 hover:underline">
              <FiPlus /> Add Visible Example
            </button>
            <button type="button" onClick={() => mutate((n) => { n.testCases.push(emptyTestCase(false)); })} className="text-sm font-bold text-amber-700 flex items-center gap-1 hover:underline">
              <FiPlus /> Add Hidden Test Case
            </button>
          </div>
        </div>

        {/* Starter code (full-program questions only) */}
        {form.mode === 'stdin' ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-3">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="font-bold text-gray-800">Starter Code <span className="text-xs font-normal text-gray-400">(optional)</span></h3>
              <p className="text-xs text-gray-500 mt-0.5">Pre-fills the student's editor. A dot marks languages you've changed from the default.</p>
            </div>
            <button type="button" onClick={() => mutate((n) => { n.starterCode[activeLangTab] = DEFAULT_STARTER[activeLangTab]; })} className="text-xs font-semibold text-gray-500 hover:text-gray-800 whitespace-nowrap">Reset this language</button>
          </div>
          <div className="flex gap-1 border-b overflow-x-auto">
            {LANGS.map((l) => (
              <button key={l.id} type="button" onClick={() => setActiveLangTab(l.id)} className={`px-3 py-2 text-sm font-semibold whitespace-nowrap border-b-2 flex items-center gap-1 ${activeLangTab === l.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {l.label}
                {customized(l.id) && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
              </button>
            ))}
          </div>
          <textarea rows="10" spellCheck={false} value={form.starterCode[activeLangTab]} onChange={(e) => mutate((n) => { n.starterCode[activeLangTab] = e.target.value; })} className="w-full p-3 border rounded-lg text-sm font-mono bg-gray-900 text-gray-100" />
        </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl p-4">
            <p className="font-bold text-sm">Starter code is automatic</p>
            <p className="text-xs mt-1">Students get a ready template for Java, Python and JavaScript built from the signature above. The hidden code that calls their function with every test case is added for them when they click Run or Submit.</p>
          </div>
        )}

        <div className="sticky bottom-0 -mx-1 px-1 py-3 bg-gray-50/90 backdrop-blur border-t flex justify-end gap-3">
          <button type="button" onClick={() => setView('list')} className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 font-bold hover:bg-white">Cancel</button>
          <button type="submit" className="px-5 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700">{editingId ? 'Save Changes' : 'Save Question'}</button>
        </div>
      </form>
    );
  }

  // ---------------- LIST / SUBMISSIONS VIEW ----------------
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Coding Tests</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your coding problems and submissions</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setView('list')} className={`px-4 py-2 rounded-lg text-sm font-bold ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>Questions</button>
        <button onClick={() => setView('submissions')} className={`px-4 py-2 rounded-lg text-sm font-bold ${view === 'submissions' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>Submissions</button>
      </div>

      {view === 'list' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center gap-4">
            <div className="relative w-full max-w-xs">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={qSearch} onChange={(e) => setQSearch(e.target.value)} placeholder="Search questions" className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <button onClick={startCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 whitespace-nowrap"><FiPlus size={18} /> Add Question</button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 font-bold text-gray-800">Questions ({shownProblems.length})</div>
            <table className="w-full text-left">
              <thead className="text-gray-500 text-sm border-b">
                <tr><th className="p-4">Title</th><th className="p-4">Difficulty</th><th className="p-4">Marks</th><th className="p-4">Test Cases</th><th className="p-4 text-center">Actions</th></tr>
              </thead>
              <tbody className="divide-y">
                {shownProblems.length === 0 && (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-500">{problems.length === 0 ? 'No questions yet. Add one, or import a Markdown file below.' : 'No questions match your search.'}</td></tr>
                )}
                {shownProblems.map((p) => (
                  <tr key={p._id}>
                    <td className="p-4 font-semibold text-gray-800">{p.title}</td>
                    <td className="p-4"><span className={`text-xs font-bold px-2 py-0.5 rounded ${diffColor[p.difficulty] || ''}`}>{p.difficulty}</span></td>
                    <td className="p-4">{p.points}</td>
                    <td className="p-4 text-sm text-gray-500">{p.testCaseCount !== undefined ? <>{p.testCaseCount}{p.hiddenCount ? <span className="text-amber-700"> ({p.hiddenCount} hidden)</span> : null}</> : '—'}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => startEdit(p._id)} title="Edit" className="text-blue-500 hover:text-blue-700 p-2"><FiEdit size={18} /></button>
                        <button onClick={() => del(p._id)} title="Delete" className="text-red-500 hover:text-red-700 p-2"><FiTrash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Markdown import */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="font-bold text-gray-800">Import Question from Markdown</h3>
                <p className="text-xs text-gray-500 mt-0.5">Title, statement, difficulty, marks, time limit, test cases and the function signature (or starter code) are filled in automatically. You'll see a preview before anything is saved.</p>
              </div>
              <button type="button" onClick={downloadSampleMd} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 whitespace-nowrap"><FiDownload /> Download sample .md</button>
            </div>

            {!imported && (
              <label
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer flex flex-col items-center gap-2 transition-colors ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
              >
                <FiUploadCloud size={28} className="text-blue-500" />
                <span className="font-bold text-gray-700">Drag and drop a .md file here</span>
                <span className="text-xs text-gray-400">or</span>
                <span className="px-4 py-2 rounded-lg bg-gray-800 text-white text-sm font-bold">Choose Markdown File</span>
                <input type="file" accept=".md,.markdown,text/markdown,text/plain" className="hidden" onChange={onPick} />
              </label>
            )}

            {imported && (
              <div className="space-y-4 border rounded-xl p-4 bg-gray-50">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-gray-800">Question Preview <span className="text-xs font-normal text-gray-400">from {imported.fileName}</span></h4>
                  <button type="button" onClick={() => setImported(null)} className="text-gray-400 hover:text-gray-600" title="Discard"><FiX size={20} /></button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="col-span-2"><p className={labelCls}>Title</p><p className="font-semibold">{imported.title}</p></div>
                  <div><p className={labelCls}>Difficulty</p><span className={`text-xs font-bold px-2 py-0.5 rounded ${diffColor[imported.difficulty]}`}>{imported.difficulty}</span></div>
                  <div><p className={labelCls}>Marks / Time limit</p><p className="font-semibold">{imported.points} / {imported.timeLimit}s</p></div>
                </div>

                <div>
                  <p className={labelCls}>Problem statement</p>
                  <div className={`max-h-44 overflow-y-auto p-3 border rounded-lg bg-white ${MD_CLASS}`}>
                    <ReactMarkdown>{imported.statementMd || '_Empty_'}</ReactMarkdown>
                  </div>
                </div>

                <div className="text-sm">
                  <p className={labelCls}>Test cases</p>
                  {imported.testCases.length ? (
                    <p className="flex items-center gap-1.5 text-green-700 font-semibold">
                      <FiCheckCircle /> {imported.testCases.length} found
                      <span className="text-gray-500 font-normal">({imported.testCases.filter((t) => t.isSample).length} visible, {imported.testCases.filter((t) => !t.isSample).length} hidden)</span>
                    </p>
                  ) : (
                    <p className="text-red-600 font-semibold">None found</p>
                  )}
                </div>

                <div>
                  <p className={labelCls}>Question type</p>
                  {imported.mode === 'function' ? (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Function <span className="text-xs font-normal text-gray-500">(starter code is generated automatically)</span></p>
                      <pre className="bg-gray-900 text-gray-100 text-sm rounded-lg p-2 overflow-x-auto">{signatureText(imported)}</pre>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold">Full program <span className="text-xs font-normal text-gray-500">(reads input, prints output)</span></p>
                  )}
                </div>

                {imported.mode === 'stdin' && (
                  <div>
                    <p className={labelCls}>Starter code</p>
                    <div className="flex flex-wrap gap-2">
                      {LANGS.map((l) => (
                        imported.starterCode[l.id]
                          ? <span key={l.id} className="text-xs font-bold px-2 py-1 rounded bg-green-50 text-green-700">{l.label} ✓</span>
                          : <span key={l.id} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-500">{l.label} (default)</span>
                      ))}
                    </div>
                  </div>
                )}

                {imported.warnings.length > 0 && (
                  <ul className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
                    {imported.warnings.map((w, i) => <li key={i} className="flex gap-2"><FiAlertTriangle className="mt-0.5 shrink-0" />{w}</li>)}
                  </ul>
                )}

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setImported(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 font-bold hover:bg-white">Cancel</button>
                  <button type="button" onClick={editImported} className="px-4 py-2 rounded-lg border border-blue-600 text-blue-600 font-bold hover:bg-blue-50">Edit in form</button>
                  <button type="button" onClick={saveImported} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700">Save Question</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'submissions' && (
        <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center gap-4">
            <span className="font-bold">Student Submissions ({shownSubs.length})</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student or question" className="p-2 border rounded text-sm w-64" />
          </div>
          <table className="w-full text-left text-sm">
            <thead className="text-gray-500 border-b"><tr><th className="p-3">Student</th><th className="p-3">Question</th><th className="p-3">Lang</th><th className="p-3">Verdict</th><th className="p-3">Passed</th><th className="p-3">Marks</th><th className="p-3">Date</th><th className="p-3"></th></tr></thead>
            <tbody className="divide-y">
              {shownSubs.map((s) => (
                <tr key={s._id}>
                  <td className="p-3">{s.user?.name}<br /><span className="text-xs text-gray-400">{s.user?.email}</span></td>
                  <td className="p-3">{s.problem?.title}</td>
                  <td className="p-3">{s.language}</td>
                  <td className={`p-3 font-bold ${s.verdict === 'Accepted' ? 'text-green-600' : 'text-red-500'}`}>{s.verdict}</td>
                  <td className="p-3">{s.passed}/{s.total}</td>
                  <td className="p-3">{s.score}/{s.problem?.points}</td>
                  <td className="p-3 text-gray-500">{new Date(s.createdAt).toLocaleString()}</td>
                  <td className="p-3"><button onClick={() => setViewingCode(s)} className="text-blue-600 font-bold hover:underline">View code</button></td>
                </tr>
              ))}
              {shownSubs.length === 0 && <tr><td colSpan="8" className="p-8 text-center text-gray-500">No submissions yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {viewingCode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewingCode(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="font-bold">{viewingCode.user?.name} — {viewingCode.problem?.title}</p>
                <p className="text-xs text-gray-500">{viewingCode.language} • {viewingCode.verdict} • {viewingCode.passed}/{viewingCode.total} passed • {viewingCode.score} marks</p>
              </div>
              <button onClick={() => setViewingCode(null)} className="text-gray-400"><FiX size={22} /></button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre">{viewingCode.code}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminTests;