import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import {
  FiArrowLeft, FiChevronLeft, FiChevronRight, FiRotateCcw, FiPlay, FiSend, FiMaximize2, FiMinimize2
} from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api/problems`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const draftKey = (p) => `tc_draft_${p.slug}_${p.mode || 'stdin'}_${p.functionName || ''}_${p.returnType || ''}_${(p.params || []).map((x) => x.type).join('-')}`;

const LANGS = [
  { id: 'java', label: 'Java', monaco: 'java' },
  { id: 'python', label: 'Python', monaco: 'python' },
  { id: 'javascript', label: 'JavaScript', monaco: 'javascript' },
];
const STARTER = {
  java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // write your solution\n    }\n}`,
  python: `# write your solution\n`,
  javascript: `const lines = require('fs').readFileSync(0, 'utf8').split('\\n');\n// write your solution\n`,
};

const diffColor = { Easy: 'text-green-700 bg-green-500/10 border-green-500/20', Medium: 'text-yellow-700 bg-yellow-500/10 border-yellow-500/20', Hard: 'text-red-700 bg-red-500/10 border-red-500/20' };

const MD_CLASS =
  'text-sm text-gray-800 dark:text-gray-200 leading-relaxed [&_p]:mb-3 [&_h1]:text-xl [&_h1]:font-extrabold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-extrabold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:font-extrabold [&_h3]:mt-4 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1 [&_code]:bg-black/5 dark:[&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_pre]:bg-black/5 dark:[&_pre]:bg-white/5 [&_pre]:border [&_pre]:border-black/5 dark:[&_pre]:border-white/10 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0';

const pillCls = (p, active) => {
  if (active) return 'bg-blue-600 text-white border-blue-600 shadow-md';
  if (p.bestScore !== null && p.bestScore === p.points) return 'bg-green-500/10 text-green-700 border-green-500/20';
  if (p.attempts > 0) return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
  return 'glass-button text-gray-600 border-transparent';
};

const MIN_FONT = 10;
const MAX_FONT = 28;

const TestSolve = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [problems, setProblems] = useState([]); 
  const [lang, setLang] = useState(LANGS[0]);
  const [codes, setCodes] = useState(STARTER);
  const [runResults, setRunResults] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const [fontSize, setFontSize] = useState(() => {
    const n = Number(localStorage.getItem('tc_font_size'));
    return n >= MIN_FONT && n <= MAX_FONT ? n : 14;
  });
  const [expanded, setExpanded] = useState(false); 
  const [resultH, setResultH] = useState(224); 
  
  const dragRef = useRef(null);
  const editorWrapperRef = useRef(null); 

  const changeFont = (delta) => {
    setFontSize((s) => {
      const n = Math.min(MAX_FONT, Math.max(MIN_FONT, s + delta));
      try { localStorage.setItem('tc_font_size', String(n)); } catch (e) {}
      return n;
    });
  };

  const startDrag = (e) => {
    e.preventDefault();
    dragRef.current = { startY: e.clientY, startH: resultH };
    const move = (ev) => {
      const d = dragRef.current;
      if (!d) return;
      setResultH(Math.min(520, Math.max(80, d.startH + (d.startY - ev.clientY))));
    };
    const up = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const loadList = useCallback(() => {
    axios.get(API, cfg()).then((r) => setProblems(r.data)).catch(() => {});
  }, []);
  useEffect(() => { loadList(); }, [loadList]);

  useEffect(() => {
    setProblem(null);
    setRunResults(null);
    setSubmitResult(null);
    axios.get(`${API}/${slug}`, cfg()).then((r) => {
      const sc = r.data.starterCode || {};
      let saved = {};
      try { saved = JSON.parse(localStorage.getItem(draftKey(r.data)) || '{}'); } catch (e) { saved = {}; }
      setCodes(LANGS.reduce((acc, l) => {
        acc[l.id] = saved[l.id] ?? (sc[l.id] || STARTER[l.id]);
        return acc;
      }, {}));
      setProblem(r.data);
    }).catch(() => alert('Could not load question'));
  }, [slug]);

  useEffect(() => {
    const blockEvent = (e) => {
      const el = editorWrapperRef.current;
      if (el && el.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('paste', blockEvent, true);
    document.addEventListener('copy', blockEvent, true);
    document.addEventListener('cut', blockEvent, true);
    document.addEventListener('drop', blockEvent, true); 
    document.addEventListener('contextmenu', blockEvent, true); 

    return () => {
      document.removeEventListener('paste', blockEvent, true);
      document.removeEventListener('copy', blockEvent, true);
      document.removeEventListener('cut', blockEvent, true);
      document.removeEventListener('drop', blockEvent, true);
      document.removeEventListener('contextmenu', blockEvent, true);
    };
  }, []);

  const handleEditorMount = (editor, monaco) => {
    editor.onKeyDown((e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (isCtrlOrCmd && (e.keyCode === monaco.KeyCode.KeyC || e.keyCode === monaco.KeyCode.KeyV || e.keyCode === monaco.KeyCode.KeyX)) {
        e.preventDefault();
        e.stopPropagation();
        alert("Copy, Paste, and Cut are strictly disabled during tests!");
      }
    });
  };

  const onCodeChange = (v) => {
    const next = { ...codes, [lang.id]: v || '' };
    setCodes(next);
    try { localStorage.setItem(draftKey(problem), JSON.stringify(next)); } catch (e) {}
  };

  const resetCode = () => {
    if (!window.confirm(`Reset your ${lang.label} code to the starting template?`)) return;
    const fresh = (problem.starterCode && problem.starterCode[lang.id]) || STARTER[lang.id];
    onCodeChange(fresh);
  };

  const call = async (kind) => {
    setBusy(true); setRunResults(null); setSubmitResult(null);
    try {
      const r = await axios.post(`${API}/${slug}/${kind}`, { code: codes[lang.id], language: lang.id }, cfg());
      if (kind === 'run') setRunResults(r.data);
      else { setSubmitResult(r.data); loadList(); } 
    } catch (err) { alert(err.response?.data?.message || 'Something went wrong'); }
    setBusy(false);
  };

  const idx = problems.findIndex((p) => p.slug === slug);
  const prev = idx > 0 ? problems[idx - 1] : null;
  const next = idx >= 0 && idx < problems.length - 1 ? problems[idx + 1] : null;
  const meta = idx >= 0 ? problems[idx] : null;
  const go = (p) => p && navigate(`/tests/${p.slug}`);

  if (!problem) return <div className="p-16 text-center font-extrabold text-gray-500 text-lg animate-pulse">Loading Environment...</div>;

  const samples = problem.testCases || [];
  const isFn = problem.mode === 'function';
  const firstFail = submitResult && submitResult.cases ? submitResult.cases.find((c) => !c.accepted) : null;

  return (
    <div className="min-h-screen px-4 pb-4 animate-fade-in relative z-10 max-w-[1600px] mx-auto overflow-hidden flex flex-col h-screen">
      
      <div className="glass-panel rounded-2xl px-6 py-4 flex items-center justify-between gap-4 mb-4 shadow-sm border-white/60 shrink-0 mt-4">
        <Link to="/tests" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 text-[13px] font-extrabold uppercase tracking-wider whitespace-nowrap"><FiArrowLeft size={16} /> Back</Link>

        {idx >= 0 && (
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => go(prev)} disabled={!prev} title="Previous question" className="w-10 h-10 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 disabled:opacity-40 transition-colors"><FiChevronLeft size={20} /></button>
            <div className="flex gap-1.5 overflow-x-auto max-w-[40vw] py-1 custom-scrollbar">
              {problems.map((p, i) => (
                <button key={p._id} onClick={() => go(p)} title={p.title} className={`min-w-[2.5rem] h-10 px-2 rounded-xl border text-sm font-extrabold transition-all shadow-sm ${pillCls(p, p.slug === slug)}`}>{i + 1}</button>
              ))}
            </div>
            <button onClick={() => go(next)} disabled={!next} title="Next question" className="w-10 h-10 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 disabled:opacity-40 transition-colors"><FiChevronRight size={20}/></button>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-gray-500 ml-3 whitespace-nowrap hidden sm:inline">Q {idx + 1}/{problems.length}</span>
          </div>
        )}
      </div>

      <div className={`flex flex-col lg:flex-row gap-4 h-full min-h-0 pb-4`}>
        {!expanded && (
          <div className="glass-panel p-8 rounded-[2rem] shadow-sm border-white/60 overflow-y-auto w-full lg:w-[45%] shrink-0 custom-scrollbar">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight leading-tight">{problem.title}</h1>
            <div className="flex flex-wrap items-center gap-3 mb-6 text-[10px] font-extrabold uppercase tracking-wider">
              <span className={`px-3 py-1.5 rounded-lg border shadow-sm ${diffColor[problem.difficulty] || 'bg-gray-100 text-gray-600'}`}>{problem.difficulty}</span>
              <span className="text-gray-500 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5 shadow-sm">{problem.points} Marks</span>
              <span className="text-gray-500 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5 shadow-sm">{problem.timeLimit}s Limit</span>
              {meta && (
                <>
                  {meta.bestScore !== null && meta.bestScore === meta.points
                    ? <span className="text-green-700 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20 shadow-sm">✓ Solved</span>
                    : meta.attempts > 0
                      ? <span className="text-yellow-700 bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20 shadow-sm">Best {meta.bestScore ?? 0}/{meta.points}</span>
                      : <span className="text-gray-500 bg-black/5 px-3 py-1.5 rounded-lg">Not attempted</span>}
                </>
              )}
            </div>

            <div className={MD_CLASS}><ReactMarkdown>{problem.statementMd}</ReactMarkdown></div>

            {samples.map((t, i) => (
              <div key={i} className="mt-8 pt-5 border-t border-black/5 dark:border-white/5 text-sm">
                <p className="font-extrabold text-gray-800 dark:text-gray-200 text-base mb-3 tracking-tight">Example {i + 1}</p>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 mb-1.5 pl-1">Input</p>
                <pre className="bg-black/5 dark:bg-slate-900/50 p-4 rounded-2xl border border-black/5 dark:border-slate-700/50 shadow-inner whitespace-pre-wrap mb-4 font-mono text-gray-800 dark:text-gray-200 text-[13px]">{t.input}</pre>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 mb-1.5 pl-1">Output</p>
                <pre className="bg-black/5 dark:bg-slate-900/50 p-4 rounded-2xl border border-black/5 dark:border-slate-700/50 shadow-inner whitespace-pre-wrap font-mono text-gray-800 dark:text-gray-200 text-[13px]">{t.expectedOutput}</pre>
              </div>
            ))}
          </div>
        )}

        <div className={`flex flex-col gap-4 min-h-0 h-full ${expanded ? 'w-full' : 'w-full lg:w-[55%]'}`}>
          
          <div className="glass-panel p-2 rounded-2xl shadow-sm border-white/60 flex items-center justify-between gap-3 flex-wrap shrink-0">
            <select value={lang.id} onChange={(e) => setLang(LANGS.find((l) => l.id === e.target.value))} className="apple-input w-full md:w-48 py-2.5 font-bold cursor-pointer">
              {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>

            <div className="flex items-center gap-3 w-full md:w-auto ml-auto">
              <div className="hidden lg:flex items-center bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 p-1 shadow-inner">
                <button type="button" onClick={() => changeFont(-1)} disabled={fontSize <= MIN_FONT} className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-sm text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 transition-colors">A-</button>
                <span className="w-8 text-center text-[11px] font-extrabold text-gray-500">{fontSize}</span>
                <button type="button" onClick={() => changeFont(1)} disabled={fontSize >= MAX_FONT} className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-sm text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 transition-colors">A+</button>
              </div>
              <button type="button" onClick={() => setExpanded((v) => !v)} className="hidden lg:flex glass-button text-[11px] font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl items-center gap-1.5">
                {expanded ? <><FiMinimize2 size={14} /> Split</> : <><FiMaximize2 size={14} /> Maximize</>}
              </button>
              <button onClick={resetCode} className="glass-button text-[11px] font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400 px-4 py-2.5 rounded-xl border-red-500/20 bg-red-500/5 hover:bg-red-500/10 flex items-center gap-1.5">
                <FiRotateCcw size={14} /> Reset
              </button>
            </div>
          </div>

          <div ref={editorWrapperRef} className="flex-1 glass-panel rounded-[1.5rem] overflow-hidden shadow-inner border-white/40 min-h-[300px]">
            <Editor
              height="100%"
              language={lang.monaco}
              value={codes[lang.id]}
              onChange={onCodeChange}
              theme="vs-dark"
              onMount={handleEditorMount}
              options={{ minimap: { enabled: false }, fontSize, mouseWheelZoom: true, automaticLayout: true, scrollBeyondLastLine: false, contextmenu: false }}
            />
          </div>

          <div className="glass-panel p-3 rounded-2xl shadow-sm border-white/60 flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button onClick={() => call('run')} disabled={busy} className="w-full sm:w-auto bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-black/10 dark:border-white/20 text-gray-800 dark:text-white px-6 py-3.5 rounded-xl font-extrabold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-sm">
              <FiPlay size={16} className="text-blue-500" /> {busy ? 'Running...' : 'Run Examples'}
            </button>
            <button onClick={() => call('submit')} disabled={busy} className="w-full sm:flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/30 hover:scale-[0.98] transition-transform text-[15px] disabled:opacity-50 flex items-center justify-center gap-2">
              <FiSend size={16} /> {busy ? 'Submitting...' : 'Submit Final'}
            </button>
            <p className="hidden md:block flex-1 text-[10px] text-gray-400 font-medium leading-relaxed px-2">
              {isFn ? 'Write code inside the function. No main or I/O needed.' : lang.id === 'java' && 'Keep class name Main.'}
            </p>
          </div>

          <div onPointerDown={startDrag} title="Drag to resize" className="hidden lg:flex h-4 -my-3 cursor-row-resize items-center justify-center touch-none select-none z-10 relative">
             <div className="w-20 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 hover:bg-blue-500 transition-colors shadow-sm" />
          </div>

          <div className="glass-panel p-5 rounded-[1.5rem] overflow-y-auto shrink-0 shadow-sm border-white/60 custom-scrollbar min-h-[150px] lg:min-h-0" style={{ height: window.innerWidth >= 1024 ? resultH : 'auto' }}>
            <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-black/5 dark:border-white/5 pb-2 mb-3">Result Console</p>
            {busy && <p className="text-[13px] text-blue-600 dark:text-blue-400 animate-pulse font-mono font-bold pl-1 mt-4">Running code securely on server...</p>}
            {!busy && !runResults && !submitResult && <p className="text-[13px] text-gray-500 dark:text-gray-400 font-mono font-medium pl-1 mt-2">Ready. Run examples or submit your code.</p>}

            {runResults && runResults.map((r, i) => (
              <div key={i} className={`p-5 rounded-2xl border font-mono text-[13px] shadow-sm mb-4 ${r.accepted ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <p className={`font-extrabold text-sm mb-3 tracking-tight ${r.accepted ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>Example {i + 1}: {r.status}</p>
                {isFn && r.input !== undefined && (
                  <div className="space-y-3">
                    <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold tracking-wider">Input</p>
                    <pre className="bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-slate-700/50 rounded-xl p-3 text-gray-800 dark:text-gray-200 whitespace-pre-wrap shadow-inner">{r.input}</pre>
                    {!r.stderr && <><p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold tracking-wider">Your output</p><pre className="bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-slate-700/50 rounded-xl p-3 text-gray-800 dark:text-gray-200 whitespace-pre-wrap shadow-inner">{r.stdout}</pre></>}
                    {!r.accepted && !r.stderr && <><p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold tracking-wider">Expected</p><pre className="bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-slate-700/50 rounded-xl p-3 text-gray-800 dark:text-gray-200 whitespace-pre-wrap shadow-inner">{r.expected}</pre></>}
                  </div>
                )}
                {r.printed ? <div className="mt-4"><p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Printed by your code</p><pre className="bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-slate-700/50 rounded-xl p-3 text-gray-800 dark:text-gray-200 whitespace-pre-wrap shadow-inner">{r.printed}</pre></div> : null}
                {r.stderr && <pre className="text-red-700 dark:text-red-400 text-xs mt-4 bg-red-500/10 p-3 rounded-xl whitespace-pre-wrap border border-red-500/20 font-bold leading-relaxed">{r.stderr}</pre>}
                {!isFn && !r.accepted && !r.stderr && <pre className="text-xs mt-4 whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300 bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5">{`Expected:\n${r.expected}\n\nYour output:\n${r.stdout}`}</pre>}
              </div>
            ))}

            {submitResult && (
              <div className={`p-6 rounded-[1.5rem] border shadow-sm ${submitResult.verdict === 'Accepted' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <p className={`font-extrabold text-2xl tracking-tight mb-2 ${submitResult.verdict === 'Accepted' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{submitResult.verdict}</p>
                <p className="text-[13px] font-bold text-gray-700 dark:text-gray-300">Passed {submitResult.passed}/{submitResult.total} cases • Marks {submitResult.score}/{submitResult.points}</p>

                {submitResult.cases && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {submitResult.cases.map((c) => (
                      <span key={c.n} title={c.hidden ? 'Hidden test case' : 'Visible example'} className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg border uppercase tracking-wider shadow-sm ${c.accepted ? 'bg-green-500/20 text-green-800 dark:text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-800 dark:text-red-300 border-red-500/30'}`}>
                        Test {c.n}{c.hidden ? ' (hid)' : ''} {c.accepted ? '✓' : '✗'}
                      </span>
                    ))}
                  </div>
                )}

                {submitResult.compileError && <pre className="text-xs mt-5 whitespace-pre-wrap bg-red-500/10 text-red-700 dark:text-red-400 p-4 rounded-xl border border-red-500/20 font-mono font-bold leading-relaxed">{submitResult.compileError}</pre>}

                {!submitResult.compileError && firstFail && (firstFail.hidden ? (
                  <div className="mt-5 bg-white/40 dark:bg-slate-900/40 p-4 rounded-xl border border-white/50 shadow-sm">
                    <p className="font-extrabold text-gray-900 dark:text-white text-sm mb-1">Test {firstFail.n} (hidden): {firstFail.status}</p>
                    <p className="text-[11px] font-medium text-gray-600 dark:text-gray-400 leading-relaxed">The input and expected output of hidden cases are not shown. Think about edge cases (empty input, duplicates, negative numbers).</p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-3 font-mono text-[13px]">
                    <p className="font-extrabold text-sm text-gray-900 dark:text-white font-sans">Test {firstFail.n}: {firstFail.status}</p>
                    {firstFail.stderr ? <pre className="whitespace-pre-wrap text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">{firstFail.stderr}</pre> : (
                      <>
                        {isFn && <><p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest font-sans">Input</p><pre className="bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-slate-700/50 rounded-xl p-3 text-gray-800 dark:text-gray-200 whitespace-pre-wrap shadow-inner">{firstFail.input}</pre></>}
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest font-sans mt-2">Your output</p>
                        <pre className="bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-slate-700/50 rounded-xl p-3 text-gray-800 dark:text-gray-200 whitespace-pre-wrap shadow-inner">{firstFail.stdout}</pre>
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest font-sans mt-2">Expected</p>
                        <pre className="bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-slate-700/50 rounded-xl p-3 text-gray-800 dark:text-gray-200 whitespace-pre-wrap shadow-inner">{firstFail.expected}</pre>
                      </>
                    )}
                    {firstFail.printed ? <><p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest font-sans mt-2">Printed by your code</p><pre className="bg-white/60 border border-white/40 rounded-xl p-3 text-gray-800 whitespace-pre-wrap shadow-inner">{firstFail.printed}</pre></> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default TestSolve;