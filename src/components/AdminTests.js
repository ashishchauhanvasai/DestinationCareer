import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import {
  FiTrash2, FiEdit, FiPlus, FiX, FiUploadCloud, FiDownload,
  FiCheckCircle, FiAlertTriangle, FiSearch, FiArrowLeft, FiCode
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

const diffColor = { 
  Easy: 'text-green-700 dark:text-green-400 bg-green-500/10 border-green-500/20', 
  Medium: 'text-yellow-700 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20', 
  Hard: 'text-red-700 dark:text-red-400 bg-red-500/10 border-red-500/20' 
};

const inputCls = 'apple-input';
const labelCls = 'block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1';
const MD_CLASS =
  'text-sm text-gray-800 dark:text-gray-200 leading-relaxed [&_p]:mb-3 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:font-bold [&_h3]:mt-3 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1 [&_code]:bg-black/5 dark:[&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_pre]:bg-black/5 dark:[&_pre]:bg-slate-900/50 [&_pre]:border [&_pre]:border-black/5 dark:[&_pre]:border-white/10 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0';

const emptyTestCase = (isSample = true) => ({ input: '', expectedOutput: '', isSample });

const TYPES = ['int', 'long', 'double', 'boolean', 'String', 'int[]', 'long[]', 'double[]', 'boolean[]', 'String[]', 'int[][]'];
const emptyParam = () => ({ name: '', type: 'int' });
const NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
const signatureText = (f) => `${f.returnType} ${f.functionName || 'functionName'}(${(f.params || []).map((p) => `${p.type} ${p.name || 'param'}`).join(', ')})`;
const mergeStarter = (sc) => LANGS.reduce((acc, l) => { acc[l.id] = (sc && sc[l.id]) || DEFAULT_STARTER[l.id]; return acc; }, {});

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

const toPayload = (p) => ({
  title: p.title, difficulty: p.difficulty, points: p.points, timeLimit: p.timeLimit,
  statementMd: p.statementMd, testCases: p.testCases, starterCode: { ...DEFAULT_STARTER, ...p.starterCode },
  mode: p.mode || 'stdin', functionName: p.functionName || '', returnType: p.returnType || 'int', params: p.params || [],
});

const AdminTests = () => {
  const [view, setView] = useState('list'); 
  const [problems, setProblems] = useState([]);
  const [subs, setSubs] = useState([]);
  const [search, setSearch] = useState('');   
  const [qSearch, setQSearch] = useState(''); 
  const [batchFilter, setBatchFilter] = useState('All'); 
  const [selectedStudent, setSelectedStudent] = useState(null); 
  const [viewingCode, setViewingCode] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [activeLangTab, setActiveLangTab] = useState('java');
  const [stmtTab, setStmtTab] = useState('write'); 

  const [imported, setImported] = useState(null); 
  const [dragOver, setDragOver] = useState(false);

  const loadProblems = async () => { try { setProblems((await axios.get(API, cfg())).data); } catch (e) { console.error(e); } };
  const loadSubs = async () => { try { setSubs((await axios.get(`${API}/admin/submissions`, cfg())).data); } catch (e) { console.error(e); } };
  
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
    if (!form.statementMd.trim()) { setStmtTab('write'); return alert('Please write the problem statement.'); }
    if (!form.testCases.some((t) => t.isSample)) return alert('At least one test case must be marked "Visible to students".');
    
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
    if (!window.confirm('Delete this question? Existing submissions will remain.')) return;
    await axios.delete(`${API}/${id}`, cfg());
    loadProblems();
  };

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
    if (!imported.testCases.length) return alert('No valid test cases were found.');
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
  const totalQuestionsCount = problems.length;
  const totalAvailablePoints = problems.reduce((acc, p) => acc + (Number(p.points) || 0), 0);
  const allBatches = ["All", ...new Set(subs.flatMap(s => (s.studentBatches && s.studentBatches.length > 0) ? s.studentBatches : ["Unassigned"]))];

  const shownSubs = subs.filter((s) => {
    const studentBatchList = (s.studentBatches && s.studentBatches.length > 0) ? s.studentBatches : ["Unassigned"];
    const matchesBatch = batchFilter === "All" || studentBatchList.includes(batchFilter);
    const matchesSearch = `${s.user?.name || ''} ${s.user?.email || ''} ${s.problem?.title || ''}`.toLowerCase().includes(search.toLowerCase());
    return matchesBatch && matchesSearch;
  });

  const studentCardsData = React.useMemo(() => {
    if (batchFilter === 'All') return [];
    const map = {};

    subs.forEach((s) => {
      const studentBatchList = (s.studentBatches && s.studentBatches.length > 0) ? s.studentBatches : ["Unassigned"];
      if (!studentBatchList.includes(batchFilter)) return;

      const uId = s.user?._id || s.user?.email || 'unknown';
      if (!map[uId]) {
        map[uId] = {
          userId: uId, user: s.user || { name: 'Unknown Student', email: '' },
          batches: studentBatchList, submissions: [], bestScoresByProblem: {}, 
        };
      }
      map[uId].submissions.push(s);

      if (s.problem?._id) {
        const pId = s.problem._id;
        const prevBest = map[uId].bestScoresByProblem[pId] ?? 0;
        if ((s.score || 0) > prevBest) {
          map[uId].bestScoresByProblem[pId] = s.score || 0;
        } else if (map[uId].bestScoresByProblem[pId] === undefined) {
          map[uId].bestScoresByProblem[pId] = s.score || 0;
        }
      }
    });

    return Object.values(map)
      .map((item) => {
        const attendedCount = Object.keys(item.bestScoresByProblem).length;
        const earnedMarks = Object.values(item.bestScoresByProblem).reduce((a, b) => a + b, 0);
        return { ...item, attendedCount, earnedMarks };
      })
      .filter((item) => `${item.user?.name || ''} ${item.user?.email || ''}`.toLowerCase().includes(search.toLowerCase()));
  }, [subs, batchFilter, search]);

  // ---------------- BUILDER VIEW ----------------
  if (view === 'builder') {
    const customized = (id) => form.starterCode[id] !== DEFAULT_STARTER[id];
    const visibleCount = form.testCases.filter((t) => t.isSample).length;
    const hiddenCount = form.testCases.length - visibleCount;

    return (
      <form onSubmit={save} className="max-w-4xl mx-auto space-y-8 pb-10">
        <div className="flex items-center justify-between mb-2 border-b border-black/5 dark:border-white/5 pb-4">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{editingId ? 'Edit Question' : 'Add Question'}</h2>
        </div>

        {/* Question type */}
        <div className="glass-panel p-8 rounded-[2rem] shadow-sm border-white/60">
          <h3 className="font-extrabold text-xl text-gray-900 dark:text-white mb-6">Question Type</h3>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { id: 'function', title: 'Write a function', text: 'Students write only the method. The tests call it automatically, like LeetCode.' },
              { id: 'stdin', title: 'Write a full program', text: 'Students write the whole program: read the input and print the output.' },
            ].map((o) => (
              <button key={o.id} type="button" onClick={() => setForm({ ...form, mode: o.id })} className={`text-left p-6 rounded-2xl border-2 transition-all ${form.mode === o.id ? 'border-blue-500 bg-blue-500/10 shadow-sm' : 'border-gray-200 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 bg-white/40 dark:bg-slate-800/40'}`}>
                <p className="font-extrabold text-gray-900 dark:text-white text-lg">{o.title}</p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{o.text}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Basic information */}
        <div className="glass-panel p-8 rounded-[2rem] shadow-sm border-white/60 space-y-5">
          <h3 className="font-extrabold text-xl text-gray-900 dark:text-white">Basic Information</h3>
          <div>
            <label className={labelCls}>Question title</label>
            <input required placeholder="e.g. Two Sum" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={`${inputCls} font-bold text-lg`} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className={labelCls}>Difficulty</label>
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className={`${inputCls} cursor-pointer`}>
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

        {/* Function signature */}
        {form.mode === 'function' && (
          <div className="glass-panel p-8 rounded-[2rem] shadow-sm border-white/60 space-y-6">
            <div>
              <h3 className="font-extrabold text-xl text-gray-900 dark:text-white">Function Signature</h3>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">The student's starter code, and the code that calls their function, are generated from this.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Function name</label>
                <input required placeholder="e.g. twoSum" value={form.functionName} onChange={(e) => setForm({ ...form, functionName: e.target.value })} className={`${inputCls} font-mono`} />
              </div>
              <div>
                <label className={labelCls}>Return type</label>
                <select value={form.returnType} onChange={(e) => setForm({ ...form, returnType: e.target.value })} className={`${inputCls} cursor-pointer`}>
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Parameters (in the order they are passed)</label>
              <div className="space-y-3 bg-black/5 dark:bg-white/5 p-5 rounded-2xl border border-black/5 dark:border-white/5">
                {form.params.map((p, i) => (
                  <div key={i} className="grid grid-cols-[1fr_9rem_auto] gap-3 items-center">
                    <input required placeholder="name, e.g. nums" value={p.name} onChange={(e) => mutate((n) => { n.params[i].name = e.target.value; })} className={`${inputCls} font-mono`} />
                    <select value={p.type} onChange={(e) => mutate((n) => { n.params[i].type = e.target.value; })} className={`${inputCls} cursor-pointer`}>
                      {TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <button type="button" title="Remove parameter" onClick={() => mutate((n) => { n.params.splice(i, 1); })} className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center border border-red-500/20"><FiTrash2 size={16} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => mutate((n) => { n.params.push(emptyParam()); })} className="mt-4 text-[13px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl flex items-center gap-2 hover:opacity-80 transition-opacity w-fit">
                  <FiPlus /> Add Parameter
                </button>
              </div>
            </div>
            <div>
              <p className={labelCls}>Students will see</p>
              <pre className="bg-slate-900 text-gray-100 text-sm rounded-xl p-4 overflow-x-auto shadow-inner border border-slate-700/50">{signatureText(form)}</pre>
            </div>
          </div>
        )}

        {/* Problem statement */}
        <div className="glass-panel p-8 rounded-[2rem] shadow-sm border-white/60 space-y-5">
          <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-4">
            <h3 className="font-extrabold text-xl text-gray-900 dark:text-white">Problem Statement</h3>
            <div className="flex rounded-xl bg-black/5 dark:bg-white/5 p-1 border border-black/5 dark:border-white/5 shadow-inner">
              {['write', 'preview'].map((t) => (
                <button key={t} type="button" onClick={() => setStmtTab(t)} className={`px-4 py-1.5 capitalize text-xs font-extrabold rounded-lg transition-colors ${stmtTab === t ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}>{t}</button>
              ))}
            </div>
          </div>
          <textarea
            rows="10"
            placeholder="Describe the problem, input format, output format, constraints. Markdown is supported."
            value={form.statementMd}
            onChange={(e) => setForm({ ...form, statementMd: e.target.value })}
            className={`${inputCls} font-mono resize-none ${stmtTab === 'write' ? '' : 'hidden'}`}
          />
          {stmtTab === 'preview' && (
            <div className={`min-h-[220px] p-6 border border-gray-200 dark:border-slate-700 rounded-2xl bg-white/50 dark:bg-slate-900/50 shadow-inner ${MD_CLASS}`}>
              <ReactMarkdown>{form.statementMd || '_Nothing to preview yet._'}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Test cases */}
        <div className="glass-panel p-8 rounded-[2rem] shadow-sm border-white/60 space-y-6">
          <div>
            <h3 className="font-extrabold text-xl text-gray-900 dark:text-white">Test Cases</h3>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">Visible cases are shown to students as examples. Hidden cases are used only for scoring: students never see their input, expected output or their own output for them.</p>
            <div className="flex gap-3 mt-4">
              <span className="bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider">{visibleCount} visible</span>
              <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider">{hiddenCount} hidden</span>
            </div>
            {hiddenCount === 0 && <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-2 flex items-center gap-1.5"><FiAlertTriangle/> Tip: Add hidden edge cases so students cannot hardcode the solution.</p>}
            
            {form.mode === 'function' && (
              <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/5 mt-5 text-xs font-medium text-gray-600 dark:text-gray-300 leading-relaxed">
                <b>Input:</b> one value per parameter ({form.params.map((p) => `${p.name || '?'}: ${p.type}`).join(', ') || 'none'}), in that order, one per line. Writing <code>nums = [1,2]</code> also works. Put text in "quotes".<br/>
                <b>Expected output:</b> the returned value, e.g. <code>[0,1]</code>, <code>true</code> or <code>"abc"</code>.
              </div>
            )}
          </div>

          <div className="hidden md:grid grid-cols-[1fr_1fr_7rem] gap-4 px-4 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            <span>Input</span><span>Expected output</span><span className="text-center">Visibility</span>
          </div>

          {form.testCases.map((tc, i) => (
            <div key={i} className={`grid md:grid-cols-[1fr_1fr_7rem] gap-4 items-start border rounded-2xl p-4 transition-colors ${tc.isSample ? 'bg-white/60 dark:bg-slate-800/60 border-white/50 dark:border-slate-700' : 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20'}`}>
              <textarea required rows="3" placeholder={form.mode === 'function' ? 'e.g. nums = [2,7,11,15]\ntarget = 9' : 'Input'} value={tc.input} onChange={(e) => mutate((n) => { n.testCases[i].input = e.target.value; })} className={`${inputCls} font-mono resize-none`} />
              <textarea required rows="3" placeholder={form.mode === 'function' ? 'e.g. [0,1]' : 'Expected output'} value={tc.expectedOutput} onChange={(e) => mutate((n) => { n.testCases[i].expectedOutput = e.target.value; })} className={`${inputCls} font-mono resize-none`} />
              <div className="flex md:flex-col items-center justify-between md:justify-start gap-4 md:pt-2">
                <label className="flex items-center gap-2 cursor-pointer relative">
                  <input type="checkbox" className="sr-only peer" checked={tc.isSample} onChange={(e) => mutate((n) => { n.testCases[i].isSample = e.target.checked; })} />
                  <div className="w-10 h-5 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
                  <span className="text-[10px] font-extrabold uppercase text-gray-500 dark:text-gray-400">{tc.isSample ? 'Visible' : 'Hidden'}</span>
                </label>
                {form.testCases.length > 1 && (
                  <button type="button" title="Remove test case" onClick={() => mutate((n) => { n.testCases.splice(i, 1); })} className="w-8 h-8 bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white rounded-lg flex items-center justify-center border border-red-500/20 transition-colors"><FiTrash2 size={14} /></button>
                )}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-4 pt-4 border-t border-black/5 dark:border-white/5">
            <button type="button" onClick={() => mutate((n) => { n.testCases.push(emptyTestCase(true)); })} className="text-[13px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-500/20 transition-colors shadow-sm">
              <FiPlus /> Add Visible Example
            </button>
            <button type="button" onClick={() => mutate((n) => { n.testCases.push(emptyTestCase(false)); })} className="text-[13px] font-extrabold text-amber-700 dark:text-amber-500 bg-amber-500/10 border border-amber-500/20 px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-amber-500/20 transition-colors shadow-sm">
              <FiPlus /> Add Hidden Case
            </button>
          </div>
        </div>

        {form.mode === 'stdin' ? (
          <div className="glass-panel p-8 rounded-[2rem] shadow-sm border-white/60 space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="font-extrabold text-xl text-gray-900 dark:text-white">Starter Code <span className="text-sm font-medium text-gray-500">(optional)</span></h3>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">Pre-fills the student's editor. A dot marks customized languages.</p>
              </div>
              <button type="button" onClick={() => mutate((n) => { n.starterCode[activeLangTab] = DEFAULT_STARTER[activeLangTab]; })} className="glass-button text-[11px] font-extrabold text-gray-600 dark:text-gray-300 uppercase tracking-wider px-4 py-2 rounded-lg transition-colors whitespace-nowrap">Reset language</button>
            </div>
            
            <div className="flex gap-2 border-b border-black/5 dark:border-white/5 overflow-x-auto pb-2">
              {LANGS.map((l) => (
                <button key={l.id} type="button" onClick={() => setActiveLangTab(l.id)} className={`px-5 py-2.5 text-sm font-extrabold rounded-xl whitespace-nowrap flex items-center gap-2 transition-all ${activeLangTab === l.id ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-black/5 dark:border-white/5' : 'text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                  {l.label}
                  {customized(l.id) && <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" />}
                </button>
              ))}
            </div>
            <textarea rows="12" spellCheck={false} value={form.starterCode[activeLangTab]} onChange={(e) => mutate((n) => { n.starterCode[activeLangTab] = e.target.value; })} className="w-full p-5 border border-slate-700/50 rounded-2xl text-[13px] font-mono bg-slate-900 text-gray-100 shadow-inner resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
          </div>
        ) : (
          <div className="bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-300 rounded-[2rem] p-8 shadow-sm">
            <p className="font-extrabold text-lg flex items-center gap-2"><FiCode/> Starter code is automatic</p>
            <p className="text-sm font-medium mt-2 leading-relaxed">Students get a ready template for Java, Python and JavaScript built from the signature above. The hidden code that calls their function with every test case is added for them when they click Run or Submit.</p>
          </div>
        )}

        <div className="sticky bottom-4 mx-auto max-w-4xl glass-panel p-4 rounded-2xl shadow-2xl flex justify-end gap-4 z-50">
          <button type="button" onClick={() => setView('list')} className="glass-button px-8 py-3 rounded-xl text-gray-700 dark:text-gray-300 font-extrabold text-[15px]">Cancel</button>
          <button type="submit" className="px-10 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold shadow-lg shadow-blue-500/30 hover:scale-[0.98] transition-transform text-[15px]">{editingId ? 'Save Changes' : 'Save Question'}</button>
        </div>
      </form>
    );
  }

  // ---------------- LIST / SUBMISSIONS VIEW ----------------
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl backdrop-blur-md border border-blue-500/20 shadow-sm">
          <FiCode className="text-blue-600 dark:text-blue-400" size={26} />
        </div>
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Coding Tests</h2>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Manage your coding problems and submissions.</p>
        </div>
      </div>

      <div className="glass-panel rounded-[2rem] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex bg-black/5 dark:bg-white/5 p-1.5 rounded-2xl shadow-inner border border-black/5 dark:border-white/5 w-fit">
          <button onClick={() => setView('list')} className={`px-6 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-300 ${view === 'list' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-white/50 dark:border-slate-700/50 backdrop-blur-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>Questions</button>
          <button onClick={() => setView('submissions')} className={`px-6 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-300 ${view === 'submissions' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-white/50 dark:border-slate-700/50 backdrop-blur-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>Submissions</button>
        </div>
      </div>

      {view === 'list' && (
        <div className="space-y-8 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="relative w-full md:w-96">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input value={qSearch} onChange={(e) => setQSearch(e.target.value)} placeholder="Search questions..." className="apple-input pl-11 shadow-sm" />
            </div>
            <button onClick={startCreate} className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3.5 rounded-xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all hover:scale-[0.98] text-[15px]">
              <FiPlus size={20} /> Add Question
            </button>
          </div>

          <div className="glass-panel rounded-[2rem] overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-black/5 dark:border-white/5 font-extrabold text-gray-900 dark:text-white text-lg bg-white/20 dark:bg-slate-800/20">
              Questions <span className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-lg ml-2">{shownProblems.length}</span>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-black/5 dark:bg-white/5 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-black/5 dark:border-white/5">
                  <tr><th className="p-5">Title</th><th className="p-5">Difficulty</th><th className="p-5 text-center">Marks</th><th className="p-5">Test Cases</th><th className="p-5 text-center">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5 text-sm">
                  {shownProblems.length === 0 && (
                    <tr><td colSpan="5" className="p-16 text-center text-gray-500 font-medium text-lg">{problems.length === 0 ? 'No questions yet. Add one, or import a Markdown file below.' : 'No questions match your search.'}</td></tr>
                  )}
                  {shownProblems.map((p) => (
                    <tr key={p._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                      <td className="p-5 font-extrabold text-gray-900 dark:text-white text-base">{p.title}</td>
                      <td className="p-5"><span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm border ${diffColor[p.difficulty] || ''}`}>{p.difficulty}</span></td>
                      <td className="p-5 text-center font-extrabold text-gray-800 dark:text-gray-200">{p.points}</td>
                      <td className="p-5 text-xs font-medium text-gray-600 dark:text-gray-300">
                        {p.testCaseCount !== undefined ? (
                          <div className="flex items-center gap-2">
                             <span className="bg-green-500/10 text-green-700 dark:text-green-400 px-2 py-1 rounded border border-green-500/20 font-bold">{p.testCaseCount - (p.hiddenCount||0)} Vis</span>
                             {p.hiddenCount ? <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-1 rounded border border-amber-500/20 font-bold">{p.hiddenCount} Hid</span> : null}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="p-5">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => startEdit(p._id)} title="Edit" className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 bg-blue-500/10 hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-500/20"><FiEdit size={16} /></button>
                          <button onClick={() => del(p._id)} title="Delete" className="w-10 h-10 rounded-xl flex items-center justify-center text-red-500 bg-red-500/10 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-500/20 opacity-0 group-hover:opacity-100"><FiTrash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-8 md:p-10 space-y-6 shadow-sm border-white/60">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-black/5 dark:border-white/5 pb-4">
              <div>
                <h3 className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight">Import from Markdown</h3>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Drag a prepared .md file to auto-generate the question.</p>
              </div>
              <button type="button" onClick={downloadSampleMd} className="glass-button px-5 py-2.5 rounded-xl text-xs font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-2 whitespace-nowrap shadow-sm"><FiDownload size={14} /> Sample .md</button>
            </div>

            {!imported && (
              <label
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`border-4 border-dashed rounded-[2rem] p-16 text-center cursor-pointer flex flex-col items-center gap-4 transition-all duration-300 ${dragOver ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' : 'border-gray-300 dark:border-slate-600 hover:bg-black/5 dark:hover:bg-white/5 bg-white/40 dark:bg-slate-800/40'}`}
              >
                <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-2 shadow-inner"><FiUploadCloud size={40} className="text-blue-600 dark:text-blue-400" /></div>
                <span className="font-extrabold text-2xl text-gray-800 dark:text-gray-200">Drag and drop a .md file here</span>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">or click to browse</span>
                <input type="file" accept=".md,.markdown,text/markdown,text/plain" className="hidden" onChange={onPick} />
              </label>
            )}

            {imported && (
              <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-[2rem] p-8 space-y-6 shadow-inner animate-fade-in">
                <div className="flex justify-between items-center border-b border-black/10 dark:border-white/10 pb-4">
                  <h4 className="font-extrabold text-xl text-gray-800 dark:text-gray-200">Preview: {imported.fileName}</h4>
                  <button type="button" onClick={() => setImported(null)} className="p-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full transition-colors" title="Discard"><FiX size={20} className="text-gray-500" /></button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                  <div className="col-span-2 bg-white/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm"><p className={labelCls}>Title</p><p className="font-extrabold text-lg text-gray-900 dark:text-white">{imported.title}</p></div>
                  <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm"><p className={labelCls}>Difficulty</p><span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider border shadow-sm mt-1 inline-block ${diffColor[imported.difficulty]}`}>{imported.difficulty}</span></div>
                  <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm"><p className={labelCls}>Marks / Time limit</p><p className="font-extrabold text-lg text-gray-900 dark:text-white">{imported.points} <span className="text-sm text-gray-500">/ {imported.timeLimit}s</span></p></div>
                </div>

                <div>
                  <p className={labelCls}>Problem statement</p>
                  <div className={`max-h-60 overflow-y-auto p-6 border border-white/50 dark:border-slate-700/50 rounded-2xl bg-white/70 dark:bg-slate-900/70 shadow-inner custom-scrollbar ${MD_CLASS}`}>
                    <ReactMarkdown>{imported.statementMd || '_Empty_'}</ReactMarkdown>
                  </div>
                </div>

                <div className="text-sm bg-white/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm">
                  <p className={labelCls}>Test cases</p>
                  {imported.testCases.length ? (
                    <p className="flex items-center gap-2 text-green-700 dark:text-green-400 font-extrabold">
                      <FiCheckCircle size={18} /> {imported.testCases.length} parsed successfully
                      <span className="text-[10px] bg-green-500/10 px-2 py-1 rounded border border-green-500/20 uppercase ml-2">{imported.testCases.filter((t) => t.isSample).length} vis, {imported.testCases.filter((t) => !t.isSample).length} hid</span>
                    </p>
                  ) : (
                    <p className="text-red-600 font-extrabold flex items-center gap-2"><FiAlertTriangle/> None found</p>
                  )}
                </div>

                {imported.warnings.length > 0 && (
                  <ul className="text-xs text-amber-800 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-2">
                    {imported.warnings.map((w, i) => <li key={i} className="flex gap-2 font-bold"><FiAlertTriangle className="mt-0.5 shrink-0" size={14}/>{w}</li>)}
                  </ul>
                )}

                <div className="flex justify-end gap-4 pt-4">
                  <button type="button" onClick={() => setImported(null)} className="glass-button px-6 py-3 rounded-xl font-extrabold text-gray-700 dark:text-gray-300">Cancel</button>
                  <button type="button" onClick={editImported} className="glass-button border-blue-500/30 text-blue-600 dark:text-blue-400 px-6 py-3 rounded-xl font-extrabold">Edit in Form</button>
                  <button type="button" onClick={saveImported} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-extrabold shadow-lg shadow-blue-500/30 hover:scale-[0.98] transition-transform">Save Directly</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- SUBMISSIONS VIEW ---------------- */}
      {view === 'submissions' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="glass-panel p-6 rounded-[2rem] flex flex-wrap justify-between items-center gap-6 shadow-sm">
            <div className="flex items-center gap-4">
              {selectedStudent ? (
                <button onClick={() => setSelectedStudent(null)} className="glass-button flex items-center gap-2 text-sm font-extrabold text-blue-600 dark:text-blue-400 px-5 py-2.5 rounded-xl">
                  <FiArrowLeft /> Back to {batchFilter}
                </button>
              ) : (
                <span className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight pl-2">
                  {batchFilter === 'All' ? `All Submissions (${shownSubs.length})` : `${batchFilter} Students (${studentCardsData.length})`}
                </span>
              )}
            </div>

            <div className="flex gap-4 w-full md:w-auto">
              <select value={batchFilter} onChange={(e) => { setBatchFilter(e.target.value); setSelectedStudent(null); }} className="apple-input cursor-pointer py-2.5 font-bold">
                {allBatches.map(b => <option key={b} value={b}>{b === 'All' ? 'All Batches (Table View)' : b}</option>)}
              </select>
              <div className="relative flex-1 md:w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={batchFilter !== 'All' && !selectedStudent ? "Search student..." : "Search..."} className="apple-input pl-10 py-2.5" />
              </div>
            </div>
          </div>

          {batchFilter !== 'All' && !selectedStudent && (
            <div>
              {studentCardsData.length === 0 ? (
                <div className="glass-panel p-16 rounded-[2rem] text-center text-gray-500 dark:text-gray-400 font-medium text-lg">No students found in <b>{batchFilter}</b>.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {studentCardsData.map((st) => (
                    <div key={st.userId} onClick={() => setSelectedStudent(st)} className="glass-panel p-6 rounded-[2rem] cursor-pointer hover:-translate-y-1.5 transition-all duration-300 shadow-sm hover:shadow-lg flex flex-col justify-between group">
                      <div className="flex items-center gap-4 mb-6">
                        <img src={st.user?.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="DP" className="w-14 h-14 rounded-[1rem] object-cover border-2 border-white/60 shadow-sm bg-white" />
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-lg text-gray-900 dark:text-white truncate">{st.user?.name}</p>
                          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate mb-1.5">{st.user?.email}</p>
                          <span className="text-[9px] font-extrabold text-blue-700 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md uppercase tracking-wider border border-blue-500/20">{batchFilter}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-auto">
                        <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 text-center border border-black/5 dark:border-white/5">
                          <p className="text-[10px] uppercase font-extrabold tracking-widest text-gray-500 dark:text-gray-400 mb-1">Attended</p>
                          <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{st.attendedCount} <span className="text-xs font-medium text-gray-500">/ {totalQuestionsCount}</span></p>
                        </div>
                        <div className="bg-green-500/5 dark:bg-green-500/10 rounded-2xl p-4 text-center border border-green-500/10">
                          <p className="text-[10px] uppercase font-extrabold tracking-widest text-green-700 dark:text-green-400 mb-1">Marks</p>
                          <p className="text-2xl font-extrabold text-green-600 dark:text-green-400">{st.earnedMarks} <span className="text-xs font-medium text-green-700/50 dark:text-green-400/50">/ {totalAvailablePoints}</span></p>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider pt-4 border-t border-black/5 dark:border-white/5">
                        <span>{st.submissions.length} Attempts</span>
                        <span className="group-hover:underline flex items-center gap-1">Details &rarr;</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {batchFilter !== 'All' && selectedStudent && (
            <div className="space-y-6">
              <div className="glass-panel p-8 rounded-[2rem] flex flex-wrap items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center gap-5">
                  <img src={selectedStudent.user?.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="DP" className="w-20 h-20 rounded-[1.5rem] object-cover border-4 border-white shadow-md bg-white" />
                  <div>
                    <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{selectedStudent.user?.name}</h3>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 mb-2">{selectedStudent.user?.email}</p>
                    <div className="flex gap-2 flex-wrap">
                      {selectedStudent.batches.map(b => <span key={b} className="text-[10px] font-extrabold text-blue-700 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">{b}</span>)}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 md:gap-8 bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/5 dark:border-white/5 text-center">
                  <div className="px-2"><p className="text-[10px] uppercase font-extrabold tracking-widest text-gray-500 dark:text-gray-400 mb-1">Attended</p><p className="text-2xl font-extrabold text-gray-900 dark:text-white">{selectedStudent.attendedCount} <span className="text-sm font-medium text-gray-500">/ {totalQuestionsCount}</span></p></div>
                  <div className="border-l border-black/10 dark:border-white/10 px-2 md:pl-8"><p className="text-[10px] uppercase font-extrabold tracking-widest text-green-700 dark:text-green-400 mb-1">Marks</p><p className="text-2xl font-extrabold text-green-600 dark:text-green-400">{selectedStudent.earnedMarks} <span className="text-sm font-medium text-green-700/50">/ {totalAvailablePoints}</span></p></div>
                  <div className="border-l border-black/10 dark:border-white/10 px-2 md:pl-8"><p className="text-[10px] uppercase font-extrabold tracking-widest text-blue-600 dark:text-blue-400 mb-1">Attempts</p><p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{selectedStudent.submissions.length}</p></div>
                </div>
              </div>

              <div className="glass-panel rounded-[2rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-black/5 dark:bg-white/5 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-black/5 dark:border-white/5">
                      <tr><th className="p-5">Question</th><th className="p-5 text-center">Lang</th><th className="p-5 text-center">Attempt</th><th className="p-5 text-center">Verdict</th><th className="p-5 text-center">Passed</th><th className="p-5 text-center">Marks</th><th className="p-5">Date</th><th className="p-5 text-right">Code</th></tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {selectedStudent.submissions.filter((s) => (s.problem?.title || '').toLowerCase().includes(search.toLowerCase())).length === 0 && <tr><td colSpan="8" className="p-10 text-center text-gray-500 font-medium">No submissions match.</td></tr>}
                      {selectedStudent.submissions
                        .filter((s) => (s.problem?.title || '').toLowerCase().includes(search.toLowerCase()))
                        .map((s) => (
                          <tr key={s._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <td className="p-5 font-extrabold text-gray-900 dark:text-white text-base">{s.problem?.title || 'Deleted Question'}</td>
                            <td className="p-5 text-center font-bold text-gray-600 dark:text-gray-300">{s.language}</td>
                            <td className="p-5 text-center"><span className="text-[10px] font-extrabold bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 px-2.5 py-1 rounded-md">#{s.attemptNumber || 1}</span></td>
                            <td className="p-5 text-center"><span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider border shadow-sm ${s.verdict === 'Accepted' ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'}`}>{s.verdict}</span></td>
                            <td className="p-5 text-center font-extrabold text-gray-900 dark:text-white">{s.passed} <span className="text-xs text-gray-500 font-medium">/ {s.total}</span></td>
                            <td className="p-5 text-center font-extrabold text-green-600 dark:text-green-400">{s.score} <span className="text-xs text-green-700/50 font-medium">/ {s.problem?.points}</span></td>
                            <td className="p-5 text-xs font-medium text-gray-500 dark:text-gray-400">{new Date(s.createdAt).toLocaleString()}</td>
                            <td className="p-5 text-right"><button onClick={() => setViewingCode(s)} className="glass-button text-[10px] text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-wider px-4 py-2 rounded-lg transition-all hover:bg-blue-600 hover:text-white">View</button></td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {batchFilter === 'All' && (
            <div className="glass-panel rounded-[2rem] overflow-hidden shadow-sm">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-black/5 dark:bg-white/5 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-black/5 dark:border-white/5">
                    <tr>
                      <th className="p-5">Student</th>
                      <th className="p-5 text-blue-600 dark:text-blue-400">Batch</th>
                      <th className="p-5">Question</th>
                      <th className="p-5 text-center">Lang</th>
                      <th className="p-5 text-center">Verdict</th>
                      <th className="p-5 text-center">Marks</th>
                      <th className="p-5">Date</th>
                      <th className="p-5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {shownSubs.length === 0 && <tr><td colSpan="8" className="p-16 text-center text-gray-500 dark:text-gray-400 font-medium text-lg">No submissions match.</td></tr>}
                    {shownSubs.map((s) => (
                      <tr key={s._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                        <td className="p-5">
                          <p className="font-extrabold text-gray-900 dark:text-white text-base">{s.user?.name}</p>
                          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">{s.user?.email}</p>
                        </td>
                        <td className="p-5">
                          <span className="text-[9px] font-extrabold text-blue-700 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-md uppercase tracking-wider shadow-sm">
                            {s.studentBatches && s.studentBatches.length > 0 ? s.studentBatches.join(", ") : "Unassigned"}
                          </span>
                        </td>
                        <td className="p-5 font-extrabold text-gray-800 dark:text-gray-200">{s.problem?.title}</td>
                        <td className="p-5 text-center font-bold text-gray-600 dark:text-gray-400">{s.language}</td>
                        <td className="p-5 text-center">
                          <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider border shadow-sm inline-block ${s.verdict === 'Accepted' ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'}`}>
                            {s.verdict}
                          </span>
                        </td>
                        <td className="p-5 text-center font-extrabold text-gray-900 dark:text-white">{s.score} <span className="text-xs text-gray-500 font-medium">/ {s.problem?.points}</span></td>
                        <td className="p-5 text-xs font-medium text-gray-500 dark:text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</td>
                        <td className="p-5 text-right">
                          <button onClick={() => setViewingCode(s)} className="glass-button text-[10px] text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-wider px-4 py-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:bg-blue-600 hover:text-white">View Code</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CODE VIEW MODAL (Frosted Glass) */}
      {viewingCode && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingCode(null)}>
          <div className="glass-panel p-8 rounded-[2.5rem] max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl relative animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewingCode(null)} className="absolute top-6 right-6 p-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full transition-colors"><FiX size={20} className="text-gray-500 dark:text-gray-300" /></button>
            
            <div className="mb-6 border-b border-black/5 dark:border-white/5 pb-5 pr-10">
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-2">
                {viewingCode.user?.name} <span className="text-gray-400 mx-2">—</span> {viewingCode.problem?.title}
              </h3>
              <div className="flex flex-wrap gap-2 text-[10px] font-extrabold uppercase tracking-wider">
                <span className="bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-md">{viewingCode.language}</span>
                <span className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-md">Attempt #{viewingCode.attemptNumber || 1}</span>
                <span className={`${viewingCode.verdict === 'Accepted' ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'} px-2.5 py-1 rounded-md border`}>{viewingCode.verdict}</span>
                <span className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-md">{viewingCode.passed}/{viewingCode.total} passed</span>
                <span className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-md">{viewingCode.score} marks</span>
              </div>
            </div>
            
            <pre className="flex-1 bg-slate-900 text-gray-100 p-6 rounded-[1.5rem] text-[13px] font-mono overflow-auto whitespace-pre shadow-inner border border-slate-700/50 custom-scrollbar">{viewingCode.code}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTests;