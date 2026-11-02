import React, { useState, useEffect, useCallback, useRef }from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import {
  FiClock, FiAlertTriangle, FiCheckCircle, FiUploadCloud, FiPlay, FiMaximize2, FiMinimize2, FiRotateCcw, FiSend
} from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api`;

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

const MIN_FONT = 10;
const MAX_FONT = 28;
const MD_CLASS = 'text-sm text-gray-800 dark:text-gray-200 leading-relaxed [&_p]:mb-3 [&_h1]:text-xl [&_h1]:font-extrabold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-extrabold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:font-extrabold [&_h3]:mt-4 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1 [&_code]:bg-black/5 dark:[&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_pre]:bg-black/5 dark:[&_pre]:bg-white/5 [&_pre]:border [&_pre]:border-black/5 dark:[&_pre]:border-white/10 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0';

const inputCls = "apple-input";

const enterFullScreen = () => {
  const elem = document.documentElement;
  if (elem.requestFullscreen) { elem.requestFullscreen().catch(() => {}); }
  else if (elem.webkitRequestFullscreen) { elem.webkitRequestFullscreen().catch(() => {}); }
  else if (elem.msRequestFullscreen) { elem.msRequestFullscreen().catch(() => {}); }
};

const exitFullScreen = () => {
  if (document.exitFullscreen && document.fullscreenElement) { document.exitFullscreen().catch(() => {}); }
  else if (document.webkitExitFullscreen && document.webkitFullscreenElement) { document.webkitExitFullscreen().catch(() => {}); }
};

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const DriveTest = () => {
  const { driveCode } = useParams();
  const navigate = useNavigate();

  const [token, setToken] = useState(localStorage.getItem('token'));

  const [regForm, setRegForm] = useState({
    name: '', email: '', password: '', highestQualification: '', passingYear: '', percentage: '', profilePic: '',
    contactNumber: '', aadharNumber: '', address: '', stream: '', branch: '', yearOfStudy: '', tenthPercentage: '', twelfthPercentage: '', panCard: ''
  });
  const [registering, setRegistering] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loggingIn, setLoggingIn] = useState(false);

  const [loading, setLoading] = useState(true);
  const [driveData, setDriveData] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [result, setResult] = useState(null);

  const [problems, setProblems] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  const [mcqAnswers, setMcqAnswers] = useState({});
  const [codeAnswers, setCodeAnswers] = useState({});
  const [lang, setLang] = useState(LANGS[0]);
  const [codes, setCodes] = useState(STARTER);
  const [runResults, setRunResults] = useState(null);

  const [warnings, setWarnings] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [nowTime, setNowTime] = useState(Date.now());
  const [fontSize, setFontSize] = useState(14);
  const [expanded, setExpanded] = useState(false);
  const [resultH, setResultH] = useState(224);
  const [busy, setBusy] = useState(false);

  const dragRef = useRef(null);
  const editorWrapperRef = useRef(null);
  const videoRef = useRef(null); 

  const mcqAnswersRef = useRef(mcqAnswers);
  const codeAnswersRef = useRef(codeAnswers);
  const codesRef = useRef(codes);
  const testStartedRef = useRef(testStarted);
  const testCompletedRef = useRef(testCompleted);
  const warningsRef = useRef(warnings);
  const driveDataRef = useRef(driveData);
  const startTimeRef = useRef(null);

  const isSubmittingRef = useRef(false);
  const warningLockRef = useRef(false);

  useEffect(() => { mcqAnswersRef.current = mcqAnswers; }, [mcqAnswers]);
  useEffect(() => { codeAnswersRef.current = codeAnswers; }, [codeAnswers]);
  useEffect(() => { codesRef.current = codes; }, [codes]);
  useEffect(() => { testStartedRef.current = testStarted; }, [testStarted]);
  useEffect(() => { testCompletedRef.current = testCompleted; }, [testCompleted]);
  useEffect(() => { warningsRef.current = warnings; }, [warnings]);
  useEffect(() => { driveDataRef.current = driveData; }, [driveData]);

  const submitTest = useCallback(async (reason = "Submitted Successfully") => {
    if (isSubmittingRef.current || testCompletedRef.current) return;
    isSubmittingRef.current = true;
    testCompletedRef.current = true;
    setTestCompleted(true);
    setTestStarted(false);
    exitFullScreen();

    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }

    const timeTakenSeconds = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0;
    const formattedAnswers = problems.map(q => {
      if (q.options) return { questionId: q._id, selectedIndex: mcqAnswersRef.current[q._id] };
      const codeData = q._id === problems[currentIdx]?._id ? codesRef.current : (codeAnswersRef.current[q._id] || {});
      return { questionId: q._id, code: codeData[lang.id] || '', language: lang.id };
    }).filter(Boolean);

    try {
      await axios.post(
        `${API}/drives/${driveDataRef.current.driveId}/submit`,
        { answers: formattedAnswers, timeTakenSeconds, warningsCount: warningsRef.current, autoSubmitted: reason !== "Manual Submission" },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setResult({ reason });
      localStorage.removeItem('token');
    } catch (err) {
      setResult({ error: true, message: err.response?.data?.message || 'Failed to submit test' });
    }
  }, [lang, problems, currentIdx]);

  useEffect(() => {
    const tick = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const fetchDriveData = async () => {
      try {
        if (!token) {
          const res = await axios.get(`${API}/drives/${driveCode}/public-info`);
          setDriveData(res.data);
          setLoading(false);
        } else {
          const res = await axios.get(`${API}/campus/my-drive`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.data.alreadySubmitted) {
            setResult({ reason: res.data.message, status: 'Completed' });
            setTestCompleted(true);
          } else {
            setDriveData(res.data);
            setProblems(shuffleArray(res.data.questions || []));
            setTimeLeft((res.data.durationMinutes || 60) * 60);
          }
          setLoading(false);
        }
      } catch (err) {
        alert('Invalid or closed Campus Drive Link.');
        navigate('/login');
      }
    };
    fetchDriveData();
  }, [driveCode, token, navigate]);

  useEffect(() => {
    let timer;
    if (testStarted && !testCompleted && timeLeft > 0) timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    else if (testStarted && !testCompleted && timeLeft === 0) submitTest("Time's Up!");
    return () => clearInterval(timer);
  }, [testStarted, testCompleted, timeLeft, submitTest]);

  useEffect(() => {
    if (!testStarted || testCompleted) return;
    const captureAndSend = async () => {
      if (!videoRef.current || !videoRef.current.srcObject) return;
      const canvas = document.createElement('canvas');
      canvas.width = 640; canvas.height = 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.5);
      try {
        await axios.post(`${API}/drives/${driveDataRef.current.driveId}/proctor`, { image: imageBase64 }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      } catch (e) { console.error("Proctor capture failed"); }
    };
    captureAndSend();
    const interval = setInterval(captureAndSend, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [testStarted, testCompleted]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (isSubmittingRef.current || testCompletedRef.current || !testStartedRef.current) return;
      if (warningLockRef.current) return;
      const isFullscreenSupported = document.fullscreenEnabled || document.webkitFullscreenEnabled;
      const isNotFullscreen = isFullscreenSupported && !document.fullscreenElement && !document.webkitFullscreenElement;

      if (document.visibilityState === 'hidden' || isNotFullscreen) {
        warningLockRef.current = true;
        let newWarnings = warningsRef.current + 1;
        warningsRef.current = newWarnings;
        setWarnings(newWarnings);

        if (newWarnings >= 3) {
          submitTest("Auto-submitted due to Malpractice");
          setTimeout(() => alert("⚠️ MALPRACTICE LIMIT EXCEEDED (3/3)! Your test has been auto-submitted."), 100);
        } else {
          setTimeout(() => {
            alert(`⚠️ WARNING ${newWarnings}/3: Do NOT minimize the window, switch tabs, or exit full screen.`);
            warningLockRef.current = false;
          }, 100);
        }
      }
    };

    const blockEvent = (e) => {
      const el = editorWrapperRef.current;
      if (el && el.contains(e.target)) { e.preventDefault(); e.stopPropagation(); }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleVisibilityChange);
    document.addEventListener('webkitfullscreenchange', handleVisibilityChange);
    document.addEventListener('paste', blockEvent, true);
    document.addEventListener('copy', blockEvent, true);
    document.addEventListener('cut', blockEvent, true);
    document.addEventListener('drop', blockEvent, true);
    document.addEventListener('contextmenu', blockEvent, true);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleVisibilityChange);
      document.removeEventListener('webkitfullscreenchange', handleVisibilityChange);
      document.removeEventListener('paste', blockEvent, true);
      document.removeEventListener('copy', blockEvent, true);
      document.removeEventListener('cut', blockEvent, true);
      document.removeEventListener('drop', blockEvent, true);
      document.removeEventListener('contextmenu', blockEvent, true);
    };
  }, [submitTest]);

  const handleEditorMount = (editor, monaco) => {
    editor.onKeyDown((e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (isCtrlOrCmd && (e.keyCode === monaco.KeyCode.KeyC || e.keyCode === monaco.KeyCode.KeyV || e.keyCode === monaco.KeyCode.KeyX)) {
        e.preventDefault(); e.stopPropagation(); alert("Copy, Paste, and Cut are disabled during tests!");
      }
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300;
        let width = img.width, height = img.height;
        if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } 
        else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setRegForm((prev) => ({ ...prev, profilePic: compressedBase64 }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regForm.profilePic) return alert("Please upload a profile photo before proceeding.");
    setRegistering(true);
    try {
      const res = await axios.post(`${API}/drives/${driveCode}/register`, regForm);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', 'campus_student');
      setToken(res.data.token);
    } catch (err) { alert(err.response?.data?.message || 'Registration failed'); }
    setRegistering(false);
  };

  const handleDriveLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      const res = await axios.post(`${API}/login`, { ...loginForm, deviceId: 'CAMPUS-PORTAL', deviceType: 'desktop' });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      setToken(res.data.token);
    } catch (err) { alert(err.response?.data?.message || 'Login failed. Please check your credentials.'); }
    setLoggingIn(false);
  };

  const startTest = () => {
    enterFullScreen();
    startTimeRef.current = Date.now();
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
      .catch(e => alert("Please allow camera access for proctoring to start the test safely."));
    if (problems[0] && !problems[0].options) {
      const initialSc = problems[0].starterCode || {};
      setCodes(LANGS.reduce((acc, l) => { acc[l.id] = initialSc[l.id] || STARTER[l.id]; return acc; }, {}));
    }
    setTestStarted(true);
  };

  const goToQuestion = (index) => {
    const q = problems[index];
    if (!q.options) {
      const sc = q.starterCode || {};
      const defaultCodes = LANGS.reduce((acc, l) => { acc[l.id] = sc[l.id] || STARTER[l.id]; return acc; }, {});
      setCodes(codeAnswers[q._id] || defaultCodes);
    }
    setCurrentIdx(index);
    setRunResults(null);
  };

  const onCodeChange = (v) => {
    const newCodes = { ...codes, [lang.id]: v || '' };
    setCodes(newCodes);
    setCodeAnswers(prev => ({ ...prev, [problems[currentIdx]._id]: newCodes }));
  };

  const resetCode = () => {
    if (!window.confirm(`Reset your ${lang.label} code to the starting template?`)) return;
    const q = problems[currentIdx];
    const fresh = (q.starterCode && q.starterCode[lang.id]) || STARTER[lang.id];
    onCodeChange(fresh);
  };

  const changeFont = (delta) => setFontSize((s) => Math.min(MAX_FONT, Math.max(MIN_FONT, s + delta)));

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

  const runCode = async () => {
    setBusy(true); setRunResults(null);
    const q = problems[currentIdx];
    try {
      const r = await axios.post(`${API}/problems/${q.slug}/run`, { code: codes[lang.id], language: lang.id }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setRunResults(r.data);
    } catch (err) { alert(err.response?.data?.message || 'Execution failed'); }
    setBusy(false);
  };

  const checkAllAttempted = () => {
    for (let q of problems) {
      if (q.options) {
        if (mcqAnswers[q._id] === undefined) return false;
      } else {
        const ans = q._id === problems[currentIdx]._id ? codes : codeAnswers[q._id];
        if (!ans) return false;
        const sc = q.starterCode || {};
        const isTouched = LANGS.some(l => ans[l.id] && ans[l.id] !== (sc[l.id] || STARTER[l.id]));
        if (!isTouched) return false;
      }
    }
    return true;
  };

  const isAnswered = (q) => {
    if (q.options) return mcqAnswers[q._id] !== undefined;
    const ans = q._id === problems[currentIdx]?._id ? codes : codeAnswers[q._id];
    if (!ans) return false;
    const sc = q.starterCode || {};
    return LANGS.some(l => ans[l.id] && ans[l.id] !== (sc[l.id] || STARTER[l.id]));
  };

  const handleFinishAttempt = () => {
    if (!checkAllAttempted()) { alert("Not finished, please attend all questions."); } 
    else if (window.confirm("Are you sure you want to finish the test?")) { submitTest("Manual Submission"); }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-extrabold text-xl animate-pulse">Loading Test Environment...</div>;
  if (!driveData) return null;

  // 1. REGISTRATION & LOGIN SCREEN (Glassmorphism)
  if (!token) {
    return (
      <div className="min-h-screen py-10 px-4 flex items-center justify-center relative overflow-hidden bg-[#f1f5f9] dark:bg-slate-900">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>

        {isLoginMode ? (
          <form onSubmit={handleDriveLogin} className="glass-panel p-10 md:p-12 rounded-[2.5rem] shadow-2xl max-w-md w-full relative z-10 animate-fade-in border-white/60">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center mb-1 tracking-tight">{driveData.collegeName}</h2>
            <p className="text-center text-blue-600 dark:text-blue-400 mb-8 text-[11px] font-extrabold uppercase tracking-widest border-b border-black/5 dark:border-white/5 pb-4">Test Portal Login</p>

            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Email ID</label>
                <input required type="email" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} placeholder="you@example.com" className="apple-input bg-white/60 dark:bg-slate-900/60" />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Password</label>
                <input required type="password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="Enter your password" className="apple-input bg-white/60 dark:bg-slate-900/60" />
              </div>
            </div>

            <button type="submit" disabled={loggingIn} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold py-4 rounded-xl mt-8 shadow-lg shadow-blue-500/30 hover:scale-[0.98] transition-all text-[15px]">
              {loggingIn ? 'Authenticating...' : 'Login to Portal'}
            </button>
            <p className="text-center text-xs font-bold text-gray-500 mt-6">Not registered? <button type="button" onClick={() => setIsLoginMode(false)} className="text-blue-600 hover:underline">Register Here</button></p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="glass-panel p-8 md:p-12 rounded-[2.5rem] shadow-2xl max-w-5xl w-full relative z-10 animate-fade-in border-white/60">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center mb-1 tracking-tight">{driveData.collegeName}</h2>
            <p className="text-center text-blue-600 dark:text-blue-400 mb-8 text-[11px] font-extrabold uppercase tracking-widest border-b border-black/5 dark:border-white/5 pb-4">Campus Drive Registration</p>

            <div className="flex flex-col md:flex-row gap-10">
              <div className="flex flex-col items-center space-y-5 w-full md:w-1/3 border-r-0 md:border-r border-black/5 dark:border-white/5 pr-0 md:pr-6">
                <label className="cursor-pointer flex flex-col items-center">
                  {regForm.profilePic ? (
                    <img src={regForm.profilePic} alt="DP" className="w-28 h-28 md:w-32 md:h-32 rounded-[1.5rem] object-cover border-4 border-white/60 shadow-lg bg-white" />
                  ) : (
                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-[1.5rem] bg-blue-500/10 border-2 border-dashed border-blue-500/30 flex flex-col items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all shadow-inner">
                      <FiUploadCloud size={32} />
                      <span className="text-[10px] uppercase font-extrabold tracking-widest mt-2">Upload Photo</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                <div className="w-full space-y-4 pt-2">
                   <input required type="text" placeholder="Full Name *" value={regForm.name} onChange={e => setRegForm({ ...regForm, name: e.target.value })} className={inputCls} />
                   <input required type="email" placeholder="Email ID *" value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} className={inputCls} />
                   <input required type="password" placeholder="Set Password *" minLength={6} value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })} className={inputCls} />
                </div>
              </div>

              <div className="w-full md:w-2/3 space-y-5">
                <h3 className="font-extrabold text-gray-800 dark:text-gray-200 text-sm border-b border-black/5 dark:border-white/5 pb-2">Personal Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input required type="text" placeholder="Contact Number *" value={regForm.contactNumber} onChange={e => setRegForm({ ...regForm, contactNumber: e.target.value })} className={inputCls} />
                  <textarea required placeholder="Full Residential Address *" value={regForm.address} onChange={e => setRegForm({ ...regForm, address: e.target.value })} className={`${inputCls} resize-none`} rows="1" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input required type="text" placeholder="Aadhar Number *" value={regForm.aadharNumber} onChange={e => setRegForm({ ...regForm, aadharNumber: e.target.value })} className={inputCls} />
                  <input required type="text" placeholder="PAN Card No. *" value={regForm.panCard || ''} onChange={e => setRegForm({ ...regForm, panCard: e.target.value.toUpperCase() })} className={`${inputCls} uppercase`} />
                </div>

                <h3 className="font-extrabold text-gray-800 dark:text-gray-200 text-sm border-b border-black/5 dark:border-white/5 pb-2 mt-6">Academic Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input required type="number" step="0.1" placeholder="10th % *" value={regForm.tenthPercentage || ''} onChange={e => setRegForm({ ...regForm, tenthPercentage: e.target.value })} className={inputCls} />
                  <input required type="number" step="0.1" placeholder="12th/Diploma % *" value={regForm.twelfthPercentage || ''} onChange={e => setRegForm({ ...regForm, twelfthPercentage: e.target.value })} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <input required type="text" placeholder="Degree (B.Tech) *" value={regForm.highestQualification} onChange={e => setRegForm({ ...regForm, highestQualification: e.target.value })} className={inputCls} />
                  <input required type="text" placeholder="Branch (CSE) *" value={regForm.branch || ''} onChange={e => setRegForm({ ...regForm, branch: e.target.value })} className={inputCls} />
                  <select required value={regForm.yearOfStudy || ''} onChange={e => setRegForm({ ...regForm, yearOfStudy: e.target.value })} className={`${inputCls} cursor-pointer`}>
                    <option value="">Current Year *</option><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year / Final</option><option>Graduated</option>
                  </select>
                  <input required type="number" placeholder="Passout Year *" value={regForm.passingYear} onChange={e => setRegForm({ ...regForm, passingYear: e.target.value })} className={inputCls} />
                </div>
                <div><input required type="number" step="0.1" placeholder="Degree Overall % / CGPA *" value={regForm.percentage} onChange={e => setRegForm({ ...regForm, percentage: e.target.value })} className={inputCls} /></div>
              </div>
            </div>

            <button type="submit" disabled={registering} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold py-4 rounded-xl mt-10 shadow-lg shadow-blue-500/30 hover:scale-[0.99] transition-transform text-[15px] disabled:opacity-60">
              {registering ? 'Validating...' : 'Proceed for Assessment'}
            </button>
            <p className="text-center text-[11px] uppercase tracking-widest font-extrabold text-gray-500 mt-5">Already registered? <button type="button" onClick={() => setIsLoginMode(true)} className="text-blue-600 hover:underline">Login Here</button></p>
          </form>
        )}
      </div>
    );
  }

  // 2. BLIND THANK YOU SCREEN
  if (testCompleted && result) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] dark:bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-green-500/5 blur-3xl pointer-events-none"></div>
        <div className="glass-panel max-w-lg w-full rounded-[2.5rem] shadow-2xl border-white/60 p-12 text-center relative z-10 animate-fade-in">
          <div className="w-24 h-24 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20 shadow-inner">
            <FiCheckCircle size={50} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">Test Submitted Successfully!</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm font-medium leading-relaxed mb-10">
            Thank you for participating. Your responses have been recorded and sent to the recruitment team securely.
          </p>
          <button
            onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('role'); localStorage.removeItem('isLoggedIn'); navigate('/login'); }}
            className="w-full py-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white font-extrabold rounded-xl shadow-lg hover:scale-[0.98] transition-transform text-[15px]"
          >
            Close Session Safely
          </button>
        </div>
      </div>
    );
  }

  const isLiveNow = driveData.isActive && nowTime >= new Date(driveData.scheduledTestTime).getTime();

  // 3. LOBBY SCREEN
  if (!testStarted) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] dark:bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted className="hidden" />
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[140px] rounded-full pointer-events-none"></div>

        <div className="glass-panel p-10 md:p-12 rounded-[2.5rem] shadow-2xl border-white/60 max-w-xl w-full relative z-10 animate-fade-in">
          <div className="border-b border-black/5 dark:border-white/5 pb-6 mb-8 text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-4 py-2 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400 shadow-sm inline-block mb-4 border border-blue-500/20">Upcoming Assessment</span>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">{driveData.collegeName} Recruitment Test</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
            <div className="bg-black/5 dark:bg-white/5 p-5 rounded-[1.5rem] text-center border border-black/5 dark:border-white/5 shadow-inner">
              <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Scheduled Time</p>
              <p className="font-extrabold text-gray-900 dark:text-white text-base">{new Date(driveData.scheduledTestTime).toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-black/5 dark:bg-white/5 p-5 rounded-[1.5rem] text-center border border-black/5 dark:border-white/5 shadow-inner">
              <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Duration</p>
              <p className="font-extrabold text-gray-900 dark:text-white text-base">{driveData.durationMinutes} Minutes</p>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-sm text-amber-900 dark:text-amber-400 mb-8 shadow-sm">
            <p className="font-extrabold flex items-center gap-2 mb-3 tracking-wide uppercase text-[11px]"><FiAlertTriangle size={18} /> Strict Proctoring Rules:</p>
            <ul className="list-disc list-inside space-y-2 font-medium opacity-90 pl-1 leading-relaxed text-xs">
              <li>Camera access is required. Snapshots are taken periodically.</li>
              <li>Do not switch tabs, minimize the browser, or open other apps.</li>
              <li>On the <strong>3rd warning</strong>, your test will be <strong>auto-submitted</strong> immediately.</li>
            </ul>
          </div>

          {isLiveNow ? (
            <button onClick={startTest} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all hover:scale-[0.98] text-[15px]">
              <FiPlay size={18} /> Start Assessment Now
            </button>
          ) : (
            <div className="text-center p-6 bg-black/5 dark:bg-white/5 rounded-2xl shadow-inner border border-black/5 dark:border-white/5">
              <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Test unlocks automatically</p>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center justify-center gap-3">
                <FiClock className="text-blue-600 dark:text-blue-400" />
                {Math.max(0, Math.ceil((new Date(driveData.scheduledTestTime).getTime() - nowTime) / 60000))} mins remaining
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4. ACTIVE TEST INTERFACE (Liquid Glass)
  const currentQ = problems[currentIdx];

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f5f9] dark:bg-slate-900 select-none overflow-hidden h-[100dvh] relative">
      <div className="absolute inset-0 bg-blue-500/5 blur-3xl pointer-events-none"></div>
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />

      <header className="glass-panel mx-4 mt-4 rounded-2xl px-6 py-4 flex justify-between items-center shadow-sm z-20 shrink-0 border-white/60">
        <h1 className="font-extrabold text-lg text-gray-900 dark:text-white hidden md:block tracking-tight">{driveData.collegeName} Assessment</h1>
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg border uppercase tracking-wider shadow-sm ${warnings > 0 ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 animate-pulse' : 'bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-black/5 dark:border-white/10'}`}>
            Warnings: {warnings}/3
          </span>
          <div className="flex items-center gap-2 font-mono text-xl font-extrabold px-4 py-2 rounded-lg bg-gray-900 text-white shadow-inner border border-gray-700">
            <FiClock className="text-blue-400" /> {formatTime(timeLeft)}
          </div>
          <button onClick={handleFinishAttempt} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white px-6 py-2.5 rounded-xl font-extrabold transition-transform shadow-lg shadow-green-500/30 flex items-center gap-2 text-[13px] hover:scale-[0.98]">
            <span className="hidden md:inline">Submit Test</span> <FiSend size={14} className="md:hidden" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row max-w-[1600px] mx-auto w-full p-4 gap-6 min-h-0 overflow-y-auto lg:overflow-hidden relative z-10">
        {currentQ?.options ? (
          <div className="flex-1 glass-panel rounded-[2rem] p-8 md:p-10 overflow-y-auto min-h-[50vh] shadow-sm border-white/60">
            <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-5 mb-6">
              <h2 className="text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest bg-black/5 dark:bg-white/5 px-4 py-2 rounded-lg border border-black/5 dark:border-white/5">
                Question {currentIdx + 1} of {problems.length}
              </h2>
              <span className="text-[11px] font-extrabold bg-blue-500/10 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/20 uppercase tracking-wider shadow-sm">
                {currentQ?.marks || 1} Marks
              </span>
            </div>

            <div className={`prose prose-sm md:prose-base mb-8 ${MD_CLASS}`}>
              <ReactMarkdown>{currentQ?.text}</ReactMarkdown>
            </div>

            {currentQ?.images && currentQ.images.length > 0 && (
              <div className="flex flex-wrap gap-4 mb-8 bg-white/40 dark:bg-slate-800/40 p-4 rounded-[1.5rem] shadow-inner border border-white/50 dark:border-slate-700/50">
                {currentQ.images.map((imgId) => (
                  <img key={imgId} src={`${API}/assignment-images/${imgId}`} alt="question" className="max-h-56 w-auto rounded-xl border border-gray-200 shadow-sm bg-white" />
                ))}
              </div>
            )}

            <div className="space-y-3.5">
              {currentQ?.options?.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  onClick={() => setMcqAnswers(prev => ({ ...prev, [currentQ._id]: oIdx }))}
                  className={`w-full text-left p-5 rounded-[1.5rem] border-2 font-bold transition-all text-sm flex items-center gap-4 ${mcqAnswers[currentQ._id] === oIdx ? 'border-blue-600 bg-blue-500/10 text-blue-900 dark:text-blue-300 shadow-sm' : 'border-white/60 dark:border-slate-700/60 bg-white/40 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 hover:shadow-sm'}`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold border-2 shrink-0 transition-colors ${mcqAnswers[currentQ._id] === oIdx ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 dark:border-slate-600 text-gray-500'}`}>
                     {String.fromCharCode(65 + oIdx)}
                  </span>
                  <span className="leading-relaxed">{opt}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-10 pt-6 border-t border-black/5 dark:border-white/5">
              <button onClick={() => goToQuestion(currentIdx - 1)} disabled={currentIdx === 0} className="glass-button px-6 py-3 rounded-xl font-extrabold text-sm disabled:opacity-30">Previous</button>
              {currentIdx === problems.length - 1 ? (
                <button onClick={handleFinishAttempt} className="px-8 py-3 rounded-xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:scale-[0.98] transition-transform text-sm">Finish Test</button>
              ) : (
                <button onClick={() => goToQuestion(currentIdx + 1)} className="glass-button px-8 py-3 rounded-xl font-extrabold text-sm text-blue-700 dark:text-blue-400">Next</button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className={`glass-panel p-6 md:p-8 rounded-[2rem] shadow-sm border-white/60 overflow-y-auto min-h-[40vh] lg:min-h-0 ${expanded ? 'hidden' : 'w-full lg:w-1/2'}`}>
              <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-4 mb-6">
                <span className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg">Question {currentIdx + 1} of {problems.length}</span>
                <span className="text-[10px] font-extrabold bg-blue-500/10 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm border border-blue-500/20">{currentQ?.points || 10} Marks</span>
              </div>
              <h1 className="text-2xl font-extrabold mb-5 text-gray-900 dark:text-white tracking-tight">{currentQ?.title || "Coding Problem"}</h1>
              <div className={MD_CLASS}>
                <ReactMarkdown>{currentQ?.statementMd || currentQ?.text || "No description provided."}</ReactMarkdown>
              </div>
              {(currentQ?.testCases || []).filter(t => t.isSample).map((t, i) => (
                <div key={i} className="mt-8 text-sm border-t border-black/5 dark:border-white/5 pt-5">
                  <p className="font-extrabold mb-3 text-gray-800 dark:text-gray-200 text-base tracking-tight">Example {i + 1}</p>
                  <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Input</p>
                  <pre className="bg-black/5 dark:bg-slate-900/50 p-4 rounded-2xl border border-black/5 dark:border-slate-700/50 whitespace-pre-wrap mb-4 font-mono text-gray-800 dark:text-gray-200 text-[13px] shadow-inner">{t.input}</pre>
                  <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Output</p>
                  <pre className="bg-black/5 dark:bg-slate-900/50 p-4 rounded-2xl border border-black/5 dark:border-slate-700/50 whitespace-pre-wrap font-mono text-gray-800 dark:text-gray-200 text-[13px] shadow-inner">{t.expectedOutput}</pre>
                </div>
              ))}
            </div>

            <div className={`flex flex-col gap-4 min-h-[50vh] lg:min-h-0 h-full ${expanded ? 'w-full' : 'w-full lg:w-1/2'}`}>
              <div className="glass-panel p-2 rounded-2xl shadow-sm border-white/60 flex items-center justify-between gap-2 flex-wrap shrink-0">
                <select value={lang.id} onChange={(e) => setLang(LANGS.find((l) => l.id === e.target.value))} className="apple-input w-full md:w-48 py-2 text-[13px] font-bold cursor-pointer">
                  {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>

                <div className="flex items-center gap-3 w-full md:w-auto ml-auto">
                  <div className="hidden lg:flex items-center bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 p-1 shadow-inner">
                    <button type="button" onClick={() => changeFont(-1)} disabled={fontSize <= MIN_FONT} className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg disabled:opacity-40 transition-colors font-extrabold text-sm w-8 h-8 flex items-center justify-center">A-</button>
                    <span className="text-[11px] font-extrabold text-gray-500 w-6 text-center">{fontSize}</span>
                    <button type="button" onClick={() => changeFont(1)} disabled={fontSize >= MAX_FONT} className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg disabled:opacity-40 transition-colors font-extrabold text-sm w-8 h-8 flex items-center justify-center">A+</button>
                  </div>
                  <button type="button" onClick={() => setExpanded((v) => !v)} className="hidden lg:flex glass-button text-[11px] font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl items-center gap-1.5">
                    {expanded ? <><FiMinimize2 size={14}/> Split</> : <><FiMaximize2 size={14}/> Maximize</>}
                  </button>
                  <button onClick={resetCode} className="glass-button text-[11px] font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400 px-4 py-2.5 rounded-xl flex items-center gap-1.5 border-red-500/20 bg-red-500/5 hover:bg-red-500/10">
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
                  options={{ minimap: { enabled: false }, fontSize, mouseWheelZoom: true, automaticLayout: true, contextmenu: false, scrollBeyondLastLine: false }}
                />
              </div>

              <div className="glass-panel p-3 rounded-2xl shadow-sm border-white/60 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <button onClick={runCode} disabled={busy} className="w-full sm:w-auto bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-black/10 dark:border-white/20 text-gray-800 dark:text-white px-6 py-3 rounded-xl font-extrabold disabled:opacity-50 flex items-center justify-center gap-2 transition-all text-sm shadow-sm">
                  <FiPlay size={16} className="text-blue-500" /> {busy ? 'Running...' : 'Run Examples'}
                </button>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button onClick={() => goToQuestion(currentIdx - 1)} disabled={currentIdx === 0} className="flex-1 sm:flex-none glass-button px-6 py-3 rounded-xl font-extrabold text-sm disabled:opacity-30 text-gray-700 dark:text-gray-300">Previous</button>
                  {currentIdx === problems.length - 1 ? (
                    <button onClick={handleFinishAttempt} className="flex-1 sm:flex-none px-8 py-3 rounded-xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:scale-[0.98] transition-transform text-sm">Finish Test</button>
                  ) : (
                    <button onClick={() => goToQuestion(currentIdx + 1)} className="flex-1 sm:flex-none glass-button px-6 py-3 rounded-xl font-extrabold text-sm text-blue-700 dark:text-blue-400">Next</button>
                  )}
                </div>
              </div>

              <div onPointerDown={startDrag} title="Drag up or down to resize" className="hidden lg:flex h-4 -my-3 cursor-row-resize items-center justify-center touch-none select-none z-10 relative">
                <div className="w-20 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 hover:bg-blue-500 transition-colors shadow-sm" />
              </div>

              <div className="glass-panel p-5 rounded-[1.5rem] overflow-y-auto shrink-0 space-y-4 shadow-sm border-white/60 custom-scrollbar min-h-[150px] lg:min-h-0" style={{ height: window.innerWidth >= 1024 ? resultH : 'auto' }}>
                <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-black/5 dark:border-white/5 pb-2 mb-1">Console Output</p>
                {busy && <p className="text-sm text-blue-600 dark:text-blue-400 animate-pulse font-mono font-bold pl-1">Executing code on server...</p>}
                {!busy && !runResults && <p className="text-sm text-gray-500 dark:text-gray-400 font-mono font-medium pl-1">Click "Run Examples" to see output here.</p>}

                {runResults && runResults.map((r, i) => (
                  <div key={i} className={`p-5 rounded-2xl border font-mono text-[13px] shadow-sm ${r.accepted ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    <p className={`font-extrabold text-sm mb-3 tracking-tight ${r.accepted ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>Example {i + 1}: {r.status}</p>
                    {r.input !== undefined && (
                      <div className="space-y-3">
                        <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold tracking-wider">Input</p>
                        <pre className="bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-slate-700/50 rounded-xl p-3 text-gray-800 dark:text-gray-200 whitespace-pre-wrap shadow-inner">{r.input}</pre>
                        {!r.stderr && (
                          <>
                            <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold tracking-wider">Your Output</p>
                            <pre className="bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-slate-700/50 rounded-xl p-3 text-gray-800 dark:text-gray-200 whitespace-pre-wrap shadow-inner">{r.stdout}</pre>
                          </>
                        )}
                        {!r.accepted && !r.stderr && (
                          <>
                            <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold tracking-wider">Expected</p>
                            <pre className="bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-slate-700/50 rounded-xl p-3 text-gray-800 dark:text-gray-200 whitespace-pre-wrap shadow-inner">{r.expected}</pre>
                          </>
                        )}
                      </div>
                    )}
                    {r.printed ? (
                      <div className="mt-4">
                        <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">StdOut</p>
                        <pre className="bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-slate-700/50 rounded-xl p-3 text-gray-800 dark:text-gray-200 whitespace-pre-wrap shadow-inner">{r.printed}</pre>
                      </div>
                    ) : null}
                    {r.stderr && (
                      <pre className="text-red-700 dark:text-red-400 text-xs mt-4 bg-red-500/10 p-3 rounded-xl whitespace-pre-wrap border border-red-500/20 font-bold leading-relaxed">{r.stderr}</pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className={`w-full lg:w-72 glass-panel p-6 rounded-[2rem] shadow-sm border-white/60 flex flex-col h-fit shrink-0 ${expanded && !currentQ?.options ? 'hidden' : ''}`}>
          <h3 className="font-extrabold text-gray-800 dark:text-gray-200 mb-5 border-b border-black/5 dark:border-white/5 pb-3 text-sm md:text-base tracking-tight">Question Palette</h3>
          <div className="grid grid-cols-5 gap-2.5">
            {problems.map((q, i) => (
              <button
                key={q._id}
                onClick={() => goToQuestion(i)}
                className={`h-11 rounded-[10px] font-extrabold text-[13px] border-2 transition-all shadow-sm ${i === currentIdx ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#f1f5f9] dark:ring-offset-slate-900' : ''} ${isAnswered(q) ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white border-transparent' : 'glass-button text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-800'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <p className="text-[10px] md:text-xs font-bold text-center text-gray-400 mt-6 uppercase tracking-wider bg-black/5 dark:bg-white/5 py-2 rounded-xl">Green = Attempted</p>
        </div>
      </main>
    </div>
  );
};

export default DriveTest;