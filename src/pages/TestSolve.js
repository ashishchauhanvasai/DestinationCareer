// import React, { useState, useEffect, useCallback } from 'react';
// import axios from 'axios';
// import { useParams, useNavigate, Link } from 'react-router-dom';
// import Editor from '@monaco-editor/react';
// import ReactMarkdown from 'react-markdown';
// import { FiArrowLeft, FiChevronLeft, FiChevronRight, FiRotateCcw, FiPlay, FiSend } from 'react-icons/fi';

// const API = 'http://localhost:5000/api/problems';
// const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
// // the key includes the question type + signature: if the admin changes it, old drafts are not reused
// const draftKey = (p) => `tc_draft_${p.slug}_${p.mode || 'stdin'}_${p.functionName || ''}_${p.returnType || ''}_${(p.params || []).map((x) => x.type).join('-')}`;

// const LANGS = [
//   { id: 'java', label: 'Java', monaco: 'java' },
//   { id: 'python', label: 'Python', monaco: 'python' },
//   { id: 'javascript', label: 'JavaScript', monaco: 'javascript' },
//   { id: 'cpp', label: 'C++', monaco: 'cpp' },
//   { id: 'c', label: 'C', monaco: 'c' },
//   { id: 'csharp', label: 'C#', monaco: 'csharp' },
// ];
// const STARTER = {
//   java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // write your solution\n    }\n}`,
//   python: `# write your solution\n`,
//   javascript: `const lines = require('fs').readFileSync(0, 'utf8').split('\\n');\n// write your solution\n`,
//   cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    // write your solution\n    return 0;\n}`,
//   c: `#include <stdio.h>\nint main() {\n    // write your solution\n    return 0;\n}`,
//   csharp: `using System;\nclass Program {\n    static void Main() {\n        // write your solution\n    }\n}`,
// };

// const diffColor = { Easy: 'text-green-700 bg-green-50', Medium: 'text-yellow-700 bg-yellow-50', Hard: 'text-red-700 bg-red-50' };

// const MD_CLASS =
//   'text-sm text-gray-800 leading-relaxed [&_p]:mb-3 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1 [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_code]:text-[13px] [&_pre]:bg-gray-50 [&_pre]:border [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0';

// const pillCls = (p, active) => {
//   if (active) return 'bg-blue-600 text-white border-blue-600';
//   if (p.bestScore !== null && p.bestScore === p.points) return 'bg-green-100 text-green-700 border-green-300';
//   if (p.attempts > 0) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
//   return 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50';
// };

// const TestSolve = () => {
//   const { slug } = useParams();
//   const navigate = useNavigate();

//   const [problem, setProblem] = useState(null);
//   const [problems, setProblems] = useState([]); // list used for Previous / Next + question pills
//   const [lang, setLang] = useState(LANGS[0]);
//   const [codes, setCodes] = useState(STARTER);
//   const [runResults, setRunResults] = useState(null);
//   const [submitResult, setSubmitResult] = useState(null);
//   const [busy, setBusy] = useState(false);

//   const loadList = useCallback(() => {
//     axios.get(API, cfg()).then((r) => setProblems(r.data)).catch(() => {});
//   }, []);
//   useEffect(() => { loadList(); }, [loadList]);

//   useEffect(() => {
//     setProblem(null);
//     setRunResults(null);
//     setSubmitResult(null);
//     axios.get(`${API}/${slug}`, cfg()).then((r) => {
//       const sc = r.data.starterCode || {};
//       let saved = {};
//       try { saved = JSON.parse(localStorage.getItem(draftKey(r.data)) || '{}'); } catch (e) { saved = {}; }
//       // student's unfinished draft wins, then the question's starter code, then the generic default
//       setCodes(LANGS.reduce((acc, l) => {
//         acc[l.id] = saved[l.id] ?? (sc[l.id] || STARTER[l.id]);
//         return acc;
//       }, {}));
//       setLang((cur) => (r.data.mode === 'function' && cur.id === 'c' ? LANGS[0] : cur));
//       setProblem(r.data);
//     }).catch(() => alert('Could not load question'));
//   }, [slug]);

//   const onCodeChange = (v) => {
//     const next = { ...codes, [lang.id]: v || '' };
//     setCodes(next);
//     try { localStorage.setItem(draftKey(problem), JSON.stringify(next)); } catch (e) { /* storage full or blocked */ }
//   };

//   const resetCode = () => {
//     if (!window.confirm(`Reset your ${lang.label} code to the starting template?`)) return;
//     const fresh = (problem.starterCode && problem.starterCode[lang.id]) || STARTER[lang.id];
//     onCodeChange(fresh);
//   };

//   const call = async (kind) => {
//     setBusy(true); setRunResults(null); setSubmitResult(null);
//     try {
//       const r = await axios.post(`${API}/${slug}/${kind}`, { code: codes[lang.id], language: lang.id }, cfg());
//       if (kind === 'run') setRunResults(r.data);
//       else { setSubmitResult(r.data); loadList(); } // refresh best score / attempts
//     } catch (err) { alert(err.response?.data?.message || 'Something went wrong'); }
//     setBusy(false);
//   };

//   const idx = problems.findIndex((p) => p.slug === slug);
//   const prev = idx > 0 ? problems[idx - 1] : null;
//   const next = idx >= 0 && idx < problems.length - 1 ? problems[idx + 1] : null;
//   const meta = idx >= 0 ? problems[idx] : null;
//   const go = (p) => p && navigate(`/tests/${p.slug}`);

//   if (!problem) return <div className="p-10 text-center font-bold text-gray-500">Loading...</div>;

//   const samples = problem.testCases || [];
//   const isFn = problem.mode === 'function';
//   // function questions work in Java, Python, JavaScript, C++ and C# (not C)
//   const langs = isFn ? LANGS.filter((l) => l.id !== 'c') : LANGS;

//   return (
//     <div>
//       {/* Top bar: back + question navigation */}
//       <div className="flex items-center justify-between gap-3 mb-3">
//         <Link to="/tests" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 text-sm whitespace-nowrap"><FiArrowLeft /> Back to questions</Link>

//         {idx >= 0 && (
//           <div className="flex items-center gap-2 min-w-0">
//             <button onClick={() => go(prev)} disabled={!prev} title="Previous question" className="p-1.5 rounded-lg border bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"><FiChevronLeft /></button>
//             <div className="flex gap-1 overflow-x-auto max-w-[45vw] py-0.5">
//               {problems.map((p, i) => (
//                 <button key={p._id} onClick={() => go(p)} title={p.title} className={`min-w-[2rem] h-8 px-2 rounded-lg border text-xs font-bold ${pillCls(p, p.slug === slug)}`}>{i + 1}</button>
//               ))}
//             </div>
//             <button onClick={() => go(next)} disabled={!next} title="Next question" className="p-1.5 rounded-lg border bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"><FiChevronRight /></button>
//             <span className="text-sm font-semibold text-gray-600 whitespace-nowrap hidden sm:inline">Question {idx + 1}/{problems.length}</span>
//           </div>
//         )}
//       </div>

//       <div className="grid lg:grid-cols-2 gap-4 lg:h-[calc(100vh-9rem)]">
//         {/* LEFT: problem */}
//         <div className="bg-white rounded-2xl border p-6 overflow-y-auto max-h-[75vh] lg:max-h-none lg:h-full">
//           <h1 className="text-2xl font-bold mb-2">{problem.title}</h1>
//           <div className="flex flex-wrap items-center gap-2 mb-5 text-xs">
//             <span className={`font-bold px-2 py-0.5 rounded ${diffColor[problem.difficulty] || 'bg-gray-100 text-gray-600'}`}>{problem.difficulty}</span>
//             <span className="text-gray-500">{problem.points} marks</span>
//             <span className="text-gray-300">|</span>
//             <span className="text-gray-500">{problem.timeLimit}s time limit</span>
//             {meta && (
//               <>
//                 <span className="text-gray-300">|</span>
//                 {meta.bestScore !== null && meta.bestScore === meta.points
//                   ? <span className="font-bold text-green-600">Solved</span>
//                   : meta.attempts > 0
//                     ? <span className="font-semibold text-yellow-700">Attempted - best {meta.bestScore ?? 0}/{meta.points}</span>
//                     : <span className="text-gray-400">Not attempted</span>}
//               </>
//             )}
//           </div>

//           <div className={MD_CLASS}><ReactMarkdown>{problem.statementMd}</ReactMarkdown></div>

//           {samples.map((t, i) => (
//             <div key={i} className="mt-5 text-sm">
//               <p className="font-bold mb-1">Example {i + 1}</p>
//               <p className="text-xs text-gray-500">Input</p>
//               <pre className="bg-gray-50 p-2 rounded border whitespace-pre-wrap mb-2">{t.input}</pre>
//               <p className="text-xs text-gray-500">Output</p>
//               <pre className="bg-gray-50 p-2 rounded border whitespace-pre-wrap">{t.expectedOutput}</pre>
//             </div>
//           ))}
//         </div>

//         {/* RIGHT: editor + results */}
//         <div className="flex flex-col gap-3 min-h-0 h-[85vh] lg:h-full">
//           <div className="flex items-center justify-between">
//             <select value={lang.id} onChange={(e) => setLang(LANGS.find((l) => l.id === e.target.value))} className="p-2 border rounded-lg w-44 bg-white text-sm">
//               {langs.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
//             </select>
//             <button onClick={resetCode} className="text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-1"><FiRotateCcw /> Reset code</button>
//           </div>

//           <div className="flex-1 min-h-[220px] border rounded-xl overflow-hidden">
//             <Editor
//               height="100%"
//               language={lang.monaco}
//               value={codes[lang.id]}
//               onChange={onCodeChange}
//               theme="vs-dark"
//               options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true, scrollBeyondLastLine: false }}
//             />
//           </div>

//           <div className="flex items-center gap-3">
//             <button onClick={() => call('run')} disabled={busy} className="px-5 py-2 rounded-lg border bg-white font-bold hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"><FiPlay size={14} /> Run Samples</button>
//             <button onClick={() => call('submit')} disabled={busy} className="px-5 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"><FiSend size={14} /> {busy ? 'Running...' : 'Submit'}</button>
//             {isFn
//               ? <p className="text-xs text-gray-500">Write your code inside the function. The tests call it for you, so no <b>main</b> or input reading is needed.</p>
//               : lang.id === 'java' && <p className="text-xs text-gray-500">Keep the class name <b>Main</b> for Java.</p>}
//           </div>

//           <div className="border rounded-xl bg-white p-3 overflow-y-auto h-56 shrink-0 space-y-2">
//             <p className="text-xs font-semibold text-gray-500">Result</p>
//             {busy && <p className="text-sm text-gray-500">Running your code...</p>}
//             {!busy && !runResults && !submitResult && <p className="text-sm text-gray-400">Run your code against the examples, or submit it to be scored on all test cases.</p>}

//             {runResults && runResults.map((r, i) => (
//               <div key={i} className={`p-3 rounded-lg border text-sm ${r.accepted ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
//                 <p className="font-bold">Example {i + 1}: {r.status}</p>
//                 {isFn && r.input !== undefined && (
//                   <div className="mt-2 text-xs space-y-1">
//                     <p className="text-gray-500">Input</p>
//                     <pre className="bg-white/70 border rounded p-2 whitespace-pre-wrap">{r.input}</pre>
//                     {!r.stderr && <><p className="text-gray-500">Your output</p><pre className="bg-white/70 border rounded p-2 whitespace-pre-wrap">{r.stdout}</pre></>}
//                     {!r.accepted && !r.stderr && <><p className="text-gray-500">Expected</p><pre className="bg-white/70 border rounded p-2 whitespace-pre-wrap">{r.expected}</pre></>}
//                   </div>
//                 )}
//                 {r.printed ? <div className="mt-2 text-xs"><p className="text-gray-500">Printed by your code</p><pre className="bg-white/70 border rounded p-2 whitespace-pre-wrap">{r.printed}</pre></div> : null}
//                 {r.stderr && <pre className="text-xs mt-2 whitespace-pre-wrap">{r.stderr}</pre>}
//                 {!isFn && !r.accepted && !r.stderr && <pre className="text-xs mt-1 whitespace-pre-wrap">{`Expected:\n${r.expected}\n\nYour output:\n${r.stdout}`}</pre>}
//               </div>
//             ))}

//             {submitResult && (
//               <div className={`p-4 rounded-lg border ${submitResult.verdict === 'Accepted' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
//                 <p className="font-bold text-lg">{submitResult.verdict}</p>
//                 <p className="text-sm">Passed {submitResult.passed}/{submitResult.total} test cases • Marks {submitResult.score}/{submitResult.points}</p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
// export default TestSolve;

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import { FiArrowLeft, FiChevronLeft, FiChevronRight, FiRotateCcw, FiPlay, FiSend } from 'react-icons/fi';

const API = 'http://localhost:5000/api/problems';
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
// the key includes the question type + signature: if the admin changes it, old drafts are not reused
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

const diffColor = { Easy: 'text-green-700 bg-green-50', Medium: 'text-yellow-700 bg-yellow-50', Hard: 'text-red-700 bg-red-50' };

const MD_CLASS =
  'text-sm text-gray-800 leading-relaxed [&_p]:mb-3 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1 [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_code]:text-[13px] [&_pre]:bg-gray-50 [&_pre]:border [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0';

const pillCls = (p, active) => {
  if (active) return 'bg-blue-600 text-white border-blue-600';
  if (p.bestScore !== null && p.bestScore === p.points) return 'bg-green-100 text-green-700 border-green-300';
  if (p.attempts > 0) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
  return 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50';
};

const TestSolve = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [problems, setProblems] = useState([]); // list used for Previous / Next + question pills
  const [lang, setLang] = useState(LANGS[0]);
  const [codes, setCodes] = useState(STARTER);
  const [runResults, setRunResults] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [busy, setBusy] = useState(false);

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
      // student's unfinished draft wins, then the question's starter code, then the generic default
      setCodes(LANGS.reduce((acc, l) => {
        acc[l.id] = saved[l.id] ?? (sc[l.id] || STARTER[l.id]);
        return acc;
      }, {}));
      setProblem(r.data);
    }).catch(() => alert('Could not load question'));
  }, [slug]);

  const onCodeChange = (v) => {
    const next = { ...codes, [lang.id]: v || '' };
    setCodes(next);
    try { localStorage.setItem(draftKey(problem), JSON.stringify(next)); } catch (e) { /* storage full or blocked */ }
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
      else { setSubmitResult(r.data); loadList(); } // refresh best score / attempts
    } catch (err) { alert(err.response?.data?.message || 'Something went wrong'); }
    setBusy(false);
  };

  const idx = problems.findIndex((p) => p.slug === slug);
  const prev = idx > 0 ? problems[idx - 1] : null;
  const next = idx >= 0 && idx < problems.length - 1 ? problems[idx + 1] : null;
  const meta = idx >= 0 ? problems[idx] : null;
  const go = (p) => p && navigate(`/tests/${p.slug}`);

  if (!problem) return <div className="p-10 text-center font-bold text-gray-500">Loading...</div>;

  const samples = problem.testCases || [];
  const isFn = problem.mode === 'function';
  // the first test case the student failed (hidden ones only come with a status, never with data)
  const firstFail = submitResult && submitResult.cases ? submitResult.cases.find((c) => !c.accepted) : null;

  return (
    <div>
      {/* Top bar: back + question navigation */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <Link to="/tests" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 text-sm whitespace-nowrap"><FiArrowLeft /> Back to questions</Link>

        {idx >= 0 && (
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => go(prev)} disabled={!prev} title="Previous question" className="p-1.5 rounded-lg border bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"><FiChevronLeft /></button>
            <div className="flex gap-1 overflow-x-auto max-w-[45vw] py-0.5">
              {problems.map((p, i) => (
                <button key={p._id} onClick={() => go(p)} title={p.title} className={`min-w-[2rem] h-8 px-2 rounded-lg border text-xs font-bold ${pillCls(p, p.slug === slug)}`}>{i + 1}</button>
              ))}
            </div>
            <button onClick={() => go(next)} disabled={!next} title="Next question" className="p-1.5 rounded-lg border bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"><FiChevronRight /></button>
            <span className="text-sm font-semibold text-gray-600 whitespace-nowrap hidden sm:inline">Question {idx + 1}/{problems.length}</span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 lg:h-[calc(100vh-9rem)]">
        {/* LEFT: problem */}
        <div className="bg-white rounded-2xl border p-6 overflow-y-auto max-h-[75vh] lg:max-h-none lg:h-full">
          <h1 className="text-2xl font-bold mb-2">{problem.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mb-5 text-xs">
            <span className={`font-bold px-2 py-0.5 rounded ${diffColor[problem.difficulty] || 'bg-gray-100 text-gray-600'}`}>{problem.difficulty}</span>
            <span className="text-gray-500">{problem.points} marks</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">{problem.timeLimit}s time limit</span>
            {meta && (
              <>
                <span className="text-gray-300">|</span>
                {meta.bestScore !== null && meta.bestScore === meta.points
                  ? <span className="font-bold text-green-600">Solved</span>
                  : meta.attempts > 0
                    ? <span className="font-semibold text-yellow-700">Attempted - best {meta.bestScore ?? 0}/{meta.points}</span>
                    : <span className="text-gray-400">Not attempted</span>}
              </>
            )}
          </div>

          <div className={MD_CLASS}><ReactMarkdown>{problem.statementMd}</ReactMarkdown></div>

          {samples.map((t, i) => (
            <div key={i} className="mt-5 text-sm">
              <p className="font-bold mb-1">Example {i + 1}</p>
              <p className="text-xs text-gray-500">Input</p>
              <pre className="bg-gray-50 p-2 rounded border whitespace-pre-wrap mb-2">{t.input}</pre>
              <p className="text-xs text-gray-500">Output</p>
              <pre className="bg-gray-50 p-2 rounded border whitespace-pre-wrap">{t.expectedOutput}</pre>
            </div>
          ))}
        </div>

        {/* RIGHT: editor + results */}
        <div className="flex flex-col gap-3 min-h-0 h-[85vh] lg:h-full">
          <div className="flex items-center justify-between">
            <select value={lang.id} onChange={(e) => setLang(LANGS.find((l) => l.id === e.target.value))} className="p-2 border rounded-lg w-44 bg-white text-sm">
              {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
            <button onClick={resetCode} className="text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-1"><FiRotateCcw /> Reset code</button>
          </div>

          <div className="flex-1 min-h-[220px] border rounded-xl overflow-hidden">
            <Editor
              height="100%"
              language={lang.monaco}
              value={codes[lang.id]}
              onChange={onCodeChange}
              theme="vs-dark"
              options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true, scrollBeyondLastLine: false }}
            />
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => call('run')} disabled={busy} className="px-5 py-2 rounded-lg border bg-white font-bold hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"><FiPlay size={14} /> Run Samples</button>
            <button onClick={() => call('submit')} disabled={busy} className="px-5 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"><FiSend size={14} /> {busy ? 'Running...' : 'Submit'}</button>
            {isFn
              ? <p className="text-xs text-gray-500">Write your code inside the function. The tests call it for you, so no <b>main</b> or input reading is needed.</p>
              : lang.id === 'java' && <p className="text-xs text-gray-500">Keep the class name <b>Main</b> for Java.</p>}
          </div>

          <div className="border rounded-xl bg-white p-3 overflow-y-auto h-56 shrink-0 space-y-2">
            <p className="text-xs font-semibold text-gray-500">Result</p>
            {busy && <p className="text-sm text-gray-500">Running your code...</p>}
            {!busy && !runResults && !submitResult && <p className="text-sm text-gray-400">Run your code against the examples, or submit it to be scored on all test cases.</p>}

            {runResults && runResults.map((r, i) => (
              <div key={i} className={`p-3 rounded-lg border text-sm ${r.accepted ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <p className="font-bold">Example {i + 1}: {r.status}</p>
                {isFn && r.input !== undefined && (
                  <div className="mt-2 text-xs space-y-1">
                    <p className="text-gray-500">Input</p>
                    <pre className="bg-white/70 border rounded p-2 whitespace-pre-wrap">{r.input}</pre>
                    {!r.stderr && <><p className="text-gray-500">Your output</p><pre className="bg-white/70 border rounded p-2 whitespace-pre-wrap">{r.stdout}</pre></>}
                    {!r.accepted && !r.stderr && <><p className="text-gray-500">Expected</p><pre className="bg-white/70 border rounded p-2 whitespace-pre-wrap">{r.expected}</pre></>}
                  </div>
                )}
                {r.printed ? <div className="mt-2 text-xs"><p className="text-gray-500">Printed by your code</p><pre className="bg-white/70 border rounded p-2 whitespace-pre-wrap">{r.printed}</pre></div> : null}
                {r.stderr && <pre className="text-xs mt-2 whitespace-pre-wrap">{r.stderr}</pre>}
                {!isFn && !r.accepted && !r.stderr && <pre className="text-xs mt-1 whitespace-pre-wrap">{`Expected:\n${r.expected}\n\nYour output:\n${r.stdout}`}</pre>}
              </div>
            ))}

            {submitResult && (
              <div className={`p-4 rounded-lg border ${submitResult.verdict === 'Accepted' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <p className="font-bold text-lg">{submitResult.verdict}</p>
                <p className="text-sm">Passed {submitResult.passed}/{submitResult.total} test cases • Marks {submitResult.score}/{submitResult.points}</p>

                {submitResult.cases && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {submitResult.cases.map((c) => (
                      <span key={c.n} title={c.hidden ? 'Hidden test case' : 'Visible example'} className={`text-xs font-bold px-2 py-1 rounded border ${c.accepted ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
                        Test {c.n}{c.hidden ? ' (hidden)' : ''} {c.accepted ? '✓' : '✗'}
                      </span>
                    ))}
                  </div>
                )}

                {submitResult.compileError && <pre className="text-xs mt-3 whitespace-pre-wrap">{submitResult.compileError}</pre>}

                {!submitResult.compileError && firstFail && (firstFail.hidden ? (
                  <div className="mt-3 text-sm">
                    <p className="font-semibold">Test {firstFail.n} (hidden): {firstFail.status}</p>
                    <p className="text-xs text-gray-600 mt-1">The input and expected output of hidden test cases are not shown. Think about edge cases such as empty input, duplicates, negative numbers and very large values.</p>
                  </div>
                ) : (
                  <div className="mt-3 text-xs space-y-1">
                    <p className="font-semibold text-sm">Test {firstFail.n}: {firstFail.status}</p>
                    {firstFail.stderr ? <pre className="whitespace-pre-wrap">{firstFail.stderr}</pre> : (
                      <>
                        {isFn && <><p className="text-gray-500">Input</p><pre className="bg-white/70 border rounded p-2 whitespace-pre-wrap">{firstFail.input}</pre></>}
                        <p className="text-gray-500">Your output</p>
                        <pre className="bg-white/70 border rounded p-2 whitespace-pre-wrap">{firstFail.stdout}</pre>
                        <p className="text-gray-500">Expected</p>
                        <pre className="bg-white/70 border rounded p-2 whitespace-pre-wrap">{firstFail.expected}</pre>
                      </>
                    )}
                    {firstFail.printed ? <><p className="text-gray-500">Printed by your code</p><pre className="bg-white/70 border rounded p-2 whitespace-pre-wrap">{firstFail.printed}</pre></> : null}
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