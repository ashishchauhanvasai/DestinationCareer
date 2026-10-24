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
const MD_CLASS = 'text-sm text-gray-800 leading-relaxed [&_p]:mb-3 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1 [&_code]:bg-gray-100 [&_code]:px-2 [&_code]:rounded [&_pre]:bg-gray-50 [&_pre]:border [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0';

// Universal Fullscreen Enforcer (Mobile Safari/Chrome supported)
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

// Shuffler
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
  const videoRef = useRef(null); // Hidden Webcam

  // Deep State Refs to avoid dependency loops in event listeners
  const mcqAnswersRef = useRef(mcqAnswers);
  const codeAnswersRef = useRef(codeAnswers);
  const codesRef = useRef(codes);
  const testStartedRef = useRef(testStarted);
  const testCompletedRef = useRef(testCompleted);
  const warningsRef = useRef(warnings);
  const driveDataRef = useRef(driveData);
  const startTimeRef = useRef(null);

  // THE ULTIMATE INFINITE LOOP BLOCKER
  const isSubmittingRef = useRef(false);
  const warningLockRef = useRef(false); // Prevents duplicate anti-cheat warnings

  useEffect(() => { mcqAnswersRef.current = mcqAnswers; }, [mcqAnswers]);
  useEffect(() => { codeAnswersRef.current = codeAnswers; }, [codeAnswers]);
  useEffect(() => { codesRef.current = codes; }, [codes]);
  useEffect(() => { testStartedRef.current = testStarted; }, [testStarted]);
  useEffect(() => { testCompletedRef.current = testCompleted; }, [testCompleted]);
  useEffect(() => { warningsRef.current = warnings; }, [warnings]);
  useEffect(() => { driveDataRef.current = driveData; }, [driveData]);

  // =========================================================================
  // FIXED: submitTest moved ABOVE the useEffects that reference it!
  // =========================================================================
  const submitTest = useCallback(async (reason = "Submitted Successfully") => {
    if (isSubmittingRef.current || testCompletedRef.current) return;

    // LOCK DOWN: Prevent loops
    isSubmittingRef.current = true;
    testCompletedRef.current = true;
    setTestCompleted(true);
    setTestStarted(false);

    exitFullScreen();

    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }

    const timeTakenSeconds = startTimeRef.current
      ? Math.round((Date.now() - startTimeRef.current) / 1000)
      : 0;

    const formattedAnswers = problems.map(q => {
      if (q.options) {
        return { questionId: q._id, selectedIndex: mcqAnswersRef.current[q._id] };
      }

      const codeData = q._id === problems[currentIdx]?._id
        ? codesRef.current
        : (codeAnswersRef.current[q._id] || {});

      return {
        questionId: q._id,
        code: codeData[lang.id] || '',
        language: lang.id
      };
    }).filter(Boolean);

    try {
      await axios.post(
        `${API}/drives/${driveDataRef.current.driveId}/submit`,
        {
          answers: formattedAnswers,
          timeTakenSeconds,
          warningsCount: warningsRef.current,
          autoSubmitted: reason !== "Manual Submission"
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setResult({ reason });
      localStorage.removeItem('token');
    } catch (err) {
      setResult({
        error: true,
        message: err.response?.data?.message || 'Failed to submit test'
      });
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
          const res = await axios.get(`${API}/campus/my-drive`, {
            headers: { Authorization: `Bearer ${token}` }
          });

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

    if (testStarted && !testCompleted && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (testStarted && !testCompleted && timeLeft === 0) {
      submitTest("Time's Up!");
    }

    return () => clearInterval(timer);
  }, [testStarted, testCompleted, timeLeft, submitTest]);

  // PROCTORING: Auto Capture Webcam Image every 10 mins
  useEffect(() => {
    if (!testStarted || testCompleted) return;

    const captureAndSend = async () => {
      if (!videoRef.current || !videoRef.current.srcObject) return;

      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const imageBase64 = canvas.toDataURL('image/jpeg', 0.5);

      try {
        await axios.post(
          `${API}/drives/${driveDataRef.current.driveId}/proctor`,
          { image: imageBase64 },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
      } catch (e) {
        console.error("Proctor capture failed");
      }
    };

    captureAndSend();
    const interval = setInterval(captureAndSend, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [testStarted, testCompleted]);

  // ANTI-CHEAT & MALPRACTICE LOOP FIX
  useEffect(() => {
    const handleVisibilityChange = () => {
      // 1. Stop immediately if test is already submitting or finished
      if (isSubmittingRef.current || testCompletedRef.current || !testStartedRef.current) return;

      // 2. Prevent simultaneous events (e.g., tab switch fires multiple events at once)
      if (warningLockRef.current) return;

      const isFullscreenSupported = document.fullscreenEnabled || document.webkitFullscreenEnabled;
      const isNotFullscreen = isFullscreenSupported && !document.fullscreenElement && !document.webkitFullscreenElement;

      if (document.visibilityState === 'hidden' || isNotFullscreen) {
        // 3. LOCK the warning system immediately
        warningLockRef.current = true;

        let newWarnings = warningsRef.current + 1;
        warningsRef.current = newWarnings;
        setWarnings(newWarnings);

        if (newWarnings >= 3) {
          // FIRE SUBMIT FIRST to instantly engage the isSubmittingRef lock
          submitTest("Auto-submitted due to Malpractice");

          // Delay the alert slightly so React can lock the test state BEFORE the browser freezes
          setTimeout(() => {
            alert("⚠️ MALPRACTICE LIMIT EXCEEDED (3/3)! Your test has been auto-submitted.");
          }, 100);
        } else {
          // Delay the warning alert
          setTimeout(() => {
            alert(`⚠️ WARNING ${newWarnings}/3: Do NOT minimize the window, switch tabs, or exit full screen.`);

            // Unlock only AFTER they click OK, so they don't get double-warned
            warningLockRef.current = false;
          }, 100);
        }
      }
    };

    const blockEvent = (e) => {
      const el = editorWrapperRef.current;
      if (el && el.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();
      }
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
        e.preventDefault();
        e.stopPropagation();
        alert("Copy, Paste, and Cut are disabled during tests!");
      }
    });
  };

  // 🚀 SPEED BOOST: Compress 5MB+ phone photos down to ~15KB (300x300px JPEG)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
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
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    }

    setRegistering(false);
  };

  const handleDriveLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);

    try {
      const res = await axios.post(`${API}/login`, {
        ...loginForm,
        deviceId: 'CAMPUS-PORTAL',
        deviceType: 'desktop'
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      setToken(res.data.token);
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }

    setLoggingIn(false);
  };

  const startTest = () => {
    enterFullScreen();
    startTimeRef.current = Date.now();

    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(e => alert("Please allow camera access for proctoring to start the test safely."));

    if (problems[0] && !problems[0].options) {
      const initialSc = problems[0].starterCode || {};

      setCodes(LANGS.reduce((acc, l) => {
        acc[l.id] = initialSc[l.id] || STARTER[l.id];
        return acc;
      }, {}));
    }

    setTestStarted(true);
  };

  const goToQuestion = (index) => {
    const q = problems[index];

    if (!q.options) {
      const sc = q.starterCode || {};
      const defaultCodes = LANGS.reduce((acc, l) => {
        acc[l.id] = sc[l.id] || STARTER[l.id];
        return acc;
      }, {});

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
    setBusy(true);
    setRunResults(null);

    const q = problems[currentIdx];

    try {
      const r = await axios.post(
        `${API}/problems/${q.slug}/run`,
        { code: codes[lang.id], language: lang.id },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setRunResults(r.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Execution failed');
    }

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
    if (!checkAllAttempted()) {
      alert("Not finished, please attend all questions.");
    } else if (window.confirm("Are you sure you want to finish the test?")) {
      submitTest("Manual Submission");
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) return <div className="p-10 text-center font-bold text-gray-500">Loading...</div>;
  if (!driveData) return null;

  // 1. REGISTRATION & LOGIN SCREEN
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4 flex items-center justify-center">
        {isLoginMode ? (
          <form onSubmit={handleDriveLogin} className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">{driveData.collegeName}</h2>
            <p className="text-center text-gray-500 mb-6 text-sm font-semibold uppercase tracking-wider border-b pb-4">Test Portal Login</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Email ID</label>
                <input
                  required
                  type="email"
                  value={loginForm.email}
                  onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full p-3 border rounded-lg bg-gray-50 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Password</label>
                <input
                  required
                  type="password"
                  value={loginForm.password}
                  onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Enter your password"
                  className="w-full p-3 border rounded-lg bg-gray-50 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl mt-6 hover:bg-blue-700 shadow-md transition-colors"
            >
              {loggingIn ? 'Authenticating...' : 'Login to Portal'}
            </button>

            <p className="text-center text-xs text-gray-500 pt-4">
              Not registered yet?{' '}
              <button type="button" onClick={() => setIsLoginMode(false)} className="text-blue-600 font-bold hover:underline">
                Register Here
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="bg-white p-6 md:p-8 rounded-2xl shadow-lg max-w-4xl w-full border">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">{driveData.collegeName}</h2>
            <p className="text-center text-gray-500 mb-6 text-sm font-semibold uppercase tracking-wider border-b pb-4">Campus Drive Registration</p>

            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex flex-col items-center space-y-4 w-full md:w-1/3 border-r-0 md:border-r pr-0 md:pr-4">
                <label className="cursor-pointer flex flex-col items-center">
                  {regForm.profilePic ? (
                    <img src={regForm.profilePic} alt="DP" className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-blue-100 shadow-sm" />
                  ) : (
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-blue-50 border-2 border-dashed border-blue-300 flex flex-col items-center justify-center text-blue-500 hover:bg-blue-100 transition">
                      <FiUploadCloud size={28} />
                      <span className="text-[10px] md:text-xs mt-2 font-bold">Upload Photo *</span>
                    </div>
                  )}

                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>

                <input
                  required
                  type="text"
                  placeholder="Full Name *"
                  value={regForm.name}
                  onChange={e => setRegForm({ ...regForm, name: e.target.value })}
                  className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm"
                />

                <input
                  required
                  type="email"
                  placeholder="Email ID *"
                  value={regForm.email}
                  onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                  className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm"
                />

                <input
                  required
                  type="password"
                  placeholder="Set Password *"
                  minLength={6}
                  value={regForm.password}
                  onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                  className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm"
                />
              </div>

              <div className="w-full md:w-2/3 space-y-4">
                <h3 className="font-bold text-gray-700 text-sm border-b pb-1">Personal Details</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    required
                    type="text"
                    placeholder="Contact Number *"
                    value={regForm.contactNumber}
                    onChange={e => setRegForm({ ...regForm, contactNumber: e.target.value })}
                    className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm"
                  />

                  <textarea
                    required
                    placeholder="Full Residential Address *"
                    value={regForm.address}
                    onChange={e => setRegForm({ ...regForm, address: e.target.value })}
                    className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm"
                    rows="1"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    required
                    type="text"
                    placeholder="Aadhar Number *"
                    value={regForm.aadharNumber}
                    onChange={e => setRegForm({ ...regForm, aadharNumber: e.target.value })}
                    className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm"
                  />

                  <input
                    required
                    type="text"
                    placeholder="PAN Card No. *"
                    value={regForm.panCard || ''}
                    onChange={e => setRegForm({ ...regForm, panCard: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm uppercase"
                  />
                </div>

                <h3 className="font-bold text-gray-700 text-sm border-b pb-1 mt-4">Academic Details</h3>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    required
                    type="number"
                    step="0.1"
                    placeholder="10th Percentage *"
                    value={regForm.tenthPercentage || ''}
                    onChange={e => setRegForm({ ...regForm, tenthPercentage: e.target.value })}
                    className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm"
                  />

                  <input
                    required
                    type="number"
                    step="0.1"
                    placeholder="12th / Diploma Percentage *"
                    value={regForm.twelfthPercentage || ''}
                    onChange={e => setRegForm({ ...regForm, twelfthPercentage: e.target.value })}
                    className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <input
                    required
                    type="text"
                    placeholder="Degree (B.Tech) *"
                    value={regForm.highestQualification}
                    onChange={e => setRegForm({ ...regForm, highestQualification: e.target.value })}
                    className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm"
                  />

                  <input
                    required
                    type="text"
                    placeholder="Branch (CSE) *"
                    value={regForm.branch || ''}
                    onChange={e => setRegForm({ ...regForm, branch: e.target.value })}
                    className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm"
                  />

                  <select
                    required
                    value={regForm.yearOfStudy || ''}
                    onChange={e => setRegForm({ ...regForm, yearOfStudy: e.target.value })}
                    className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm"
                  >
                    <option value="">Current Year *</option>
                    <option>1st Year</option>
                    <option>2nd Year</option>
                    <option>3rd Year</option>
                    <option>4th Year / Final</option>
                    <option>Graduated</option>
                  </select>

                  <input
                    required
                    type="number"
                    placeholder="Passout Year *"
                    value={regForm.passingYear}
                    onChange={e => setRegForm({ ...regForm, passingYear: e.target.value })}
                    className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm"
                  />
                </div>

                <div>
                  <input
                    required
                    type="number"
                    step="0.1"
                    placeholder="Degree Overall % / CGPA *"
                    value={regForm.percentage}
                    onChange={e => setRegForm({ ...regForm, percentage: e.target.value })}
                    className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={registering}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl mt-8 hover:bg-blue-700 shadow-md transition-colors"
            >
              {registering ? 'Validating...' : 'Proceed for Assessment'}
            </button>

            <p className="text-center text-xs text-gray-500 pt-4">
              Already registered?{' '}
              <button type="button" onClick={() => setIsLoginMode(true)} className="text-blue-600 font-bold hover:underline">
                Login Here
              </button>
            </p>
          </form>
        )}
      </div>
    );
  }

  // 2. BLIND THANK YOU SCREEN
  if (testCompleted && result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border p-10 text-center">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle size={50} />
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Test Submitted Successfully!</h1>
          <p className="text-gray-600 text-sm leading-relaxed mb-8">
            Thank you for participating. Your responses have been recorded and sent to the recruitment team securely.
          </p>

          <button
            onClick={() => {
              // FIXED: Do NOT call localStorage.clear() or it deletes dc_permanent_device_id!
              localStorage.removeItem('token');
              localStorage.removeItem('role');
              localStorage.removeItem('isLoggedIn');
              navigate('/login');
            }}
            className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-md"
          >
            Close Session
          </button>
        </div>
      </div>
    );
  }

  const isLiveNow = driveData.isActive && nowTime >= new Date(driveData.scheduledTestTime).getTime();

  // 3. LOBBY SCREEN
  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <video ref={videoRef} autoPlay playsInline muted className="hidden" />

        <div className="bg-white p-8 rounded-3xl shadow-xl border max-w-xl w-full space-y-6">
          <div className="border-b pb-4">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-blue-700">Upcoming Assessment</span>
            <h2 className="text-2xl font-extrabold text-gray-800 mt-2">{driveData.collegeName} — Recruitment Test</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border text-sm">
            <div>
              <p className="text-xs text-gray-500">Scheduled Date & Time</p>
              <p className="font-bold text-gray-800">{new Date(driveData.scheduledTestTime).toLocaleString('en-IN')}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Duration</p>
              <p className="font-bold text-gray-800">{driveData.durationMinutes} Minutes</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5 text-sm"><FiAlertTriangle /> Strict Proctoring Rules:</p>

            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Camera access is required. Snapshots are taken periodically.</li>
              <li>Do not switch tabs, minimize the browser, or open other applications.</li>
              <li>On the <strong>3rd warning</strong>, your test will be <strong>auto-submitted</strong> immediately.</li>
            </ul>
          </div>

          {isLiveNow ? (
            <button
              onClick={startTest}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 shadow-lg transition"
            >
              <FiPlay /> Start Assessment Now
            </button>
          ) : (
            <div className="text-center p-4 bg-slate-100 rounded-2xl border">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Test will unlock automatically</p>

              <p className="text-lg font-extrabold text-slate-800 flex items-center justify-center gap-2 mt-2">
                <FiClock className="text-blue-600" />
                {Math.max(0, Math.ceil((new Date(driveData.scheduledTestTime).getTime() - nowTime) / 60000))} minutes remaining
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4. ACTIVE TEST INTERFACE
  const currentQ = problems[currentIdx];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col select-none overflow-hidden h-screen">
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />

      <header className="bg-white border-b px-4 md:px-6 py-4 flex justify-between items-center shadow-sm z-20 shrink-0">
        <h1 className="font-bold text-lg text-gray-800 hidden md:block">{driveData.collegeName} Assessment</h1>

        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-end">
          <span className={`text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg border ${warnings > 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            Warnings: {warnings}/3
          </span>

          <div className="flex items-center gap-1 md:gap-2 font-mono text-lg md:text-xl font-bold px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-slate-900 text-white shadow-inner">
            <FiClock /> {formatTime(timeLeft)}
          </div>

          <button
            onClick={handleFinishAttempt}
            className="bg-green-600 hover:bg-green-700 text-white px-4 md:px-5 py-2 rounded-lg font-bold transition flex items-center gap-2 shadow-sm text-sm"
          >
            <span className="hidden md:inline">Submit</span> <FiSend className="md:hidden" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-4 gap-6 min-h-0 overflow-y-auto lg:overflow-hidden">
        {currentQ?.options ? (
          <div className="flex-1 bg-white rounded-2xl shadow-sm border p-6 overflow-y-auto min-h-[50vh]">
            <div className="flex justify-between items-center border-b pb-3 mb-5">
              <h2 className="text-base md:text-lg font-bold text-gray-500 uppercase tracking-widest">
                Question {currentIdx + 1} of {problems.length}
              </h2>

              <span className="text-xs md:text-sm font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-200">
                {currentQ?.marks || 1} Marks
              </span>
            </div>

            <div className="prose prose-sm md:prose-base text-gray-800 mb-6">
              <ReactMarkdown>{currentQ?.text}</ReactMarkdown>
            </div>

            {currentQ?.images && currentQ.images.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-6">
                {currentQ.images.map((imgId) => (
                  <img
                    key={imgId}
                    src={`${API}/assignment-images/${imgId}`}
                    alt="question"
                    className="max-h-56 w-auto rounded-lg border"
                  />
                ))}
              </div>
            )}

            <div className="space-y-3">
              {currentQ?.options?.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  onClick={() => setMcqAnswers(prev => ({ ...prev, [currentQ._id]: oIdx }))}
                  className={`w-full text-left p-4 rounded-xl border-2 font-semibold transition ${mcqAnswers[currentQ._id] === oIdx ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                >
                  {String.fromCharCode(65 + oIdx)}. {opt}
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-8 pt-4 border-t">
              <button
                onClick={() => goToQuestion(currentIdx - 1)}
                disabled={currentIdx === 0}
                className="px-5 md:px-6 py-2 border rounded-lg font-bold disabled:opacity-30 hover:bg-gray-50 transition text-sm"
              >
                Previous
              </button>

              {currentIdx === problems.length - 1 ? (
                <button
                  onClick={handleFinishAttempt}
                  className="px-5 md:px-6 py-2 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm text-sm"
                >
                  Finish Test
                </button>
              ) : (
                <button
                  onClick={() => goToQuestion(currentIdx + 1)}
                  className="px-5 md:px-6 py-2 border rounded-lg font-bold hover:bg-gray-50 transition text-sm"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className={`bg-white rounded-2xl border shadow-sm p-5 md:p-6 overflow-y-auto min-h-[40vh] lg:min-h-0 ${expanded ? 'hidden' : 'w-full lg:w-1/2'}`}>
              <div className="flex justify-between items-center border-b pb-3 mb-5">
                <h2 className="text-base md:text-lg font-bold text-gray-500 uppercase tracking-widest">
                  Question {currentIdx + 1} of {problems.length}
                </h2>

                <span className="text-xs md:text-sm font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-200">
                  {currentQ?.points || 10} Marks
                </span>
              </div>

              <h1 className="text-xl md:text-2xl font-bold mb-4 text-gray-900">
                {currentQ?.title || "Coding Problem"}
              </h1>

              <div className={MD_CLASS}>
                <ReactMarkdown>{currentQ?.statementMd || currentQ?.text || "No description provided."}</ReactMarkdown>
              </div>

              {(currentQ?.testCases || []).filter(t => t.isSample).map((t, i) => (
                <div key={i} className="mt-6 text-sm border-t pt-4">
                  <p className="font-bold mb-2 text-gray-800">Example {i + 1}</p>

                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Input</p>
                  <pre className="bg-gray-50 p-3 rounded-lg border border-gray-200 whitespace-pre-wrap mb-3 font-mono text-gray-800">{t.input}</pre>

                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Output</p>
                  <pre className="bg-gray-50 p-3 rounded-lg border border-gray-200 whitespace-pre-wrap font-mono text-gray-800">{t.expectedOutput}</pre>
                </div>
              ))}
            </div>

            <div className={`flex flex-col gap-3 min-h-[50vh] lg:min-h-0 h-full ${expanded ? 'w-full' : 'w-full lg:w-1/2'}`}>
              <div className="flex items-center justify-between gap-2 flex-wrap bg-white p-2 rounded-xl border shadow-sm">
                <select
                  value={lang.id}
                  onChange={(e) => setLang(LANGS.find((l) => l.id === e.target.value))}
                  className="p-2 border rounded-lg w-full md:w-44 bg-gray-50 font-bold text-sm outline-none"
                >
                  {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>

                <div className="flex items-center justify-between w-full md:w-auto gap-2">
                  <div className="hidden lg:flex items-center border rounded-lg bg-gray-50 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => changeFont(-1)}
                      disabled={fontSize <= MIN_FONT}
                      className="px-2.5 py-1 text-sm font-bold text-gray-600 hover:bg-gray-200 disabled:opacity-40"
                    >
                      A-
                    </button>

                    <span className="px-1 text-xs text-gray-500 w-8 text-center">{fontSize}</span>

                    <button
                      type="button"
                      onClick={() => changeFont(1)}
                      disabled={fontSize >= MAX_FONT}
                      className="px-2.5 py-1 text-sm font-bold text-gray-600 hover:bg-gray-200 disabled:opacity-40"
                    >
                      A+
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="hidden lg:flex text-xs font-semibold text-gray-600 hover:text-gray-900 border rounded-lg bg-gray-50 px-2.5 py-1.5 items-center gap-1 hover:bg-gray-200"
                  >
                    {expanded ? <><FiMinimize2 /> Split Screen</> : <><FiMaximize2 /> Maximize</>}
                  </button>

                  <button
                    onClick={resetCode}
                    className="text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 ml-auto md:ml-0"
                  >
                    <FiRotateCcw /> Reset
                  </button>
                </div>
              </div>

              <div ref={editorWrapperRef} className="flex-1 border rounded-xl overflow-hidden shadow-sm min-h-[300px]">
                <Editor
                  height="100%"
                  language={lang.monaco}
                  value={codes[lang.id]}
                  onChange={onCodeChange}
                  theme="vs-dark"
                  onMount={handleEditorMount}
                  options={{
                    minimap: { enabled: false },
                    fontSize,
                    mouseWheelZoom: true,
                    automaticLayout: true,
                    contextmenu: false
                  }}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border shadow-sm">
                <button
                  onClick={runCode}
                  disabled={busy}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg border-2 border-gray-300 bg-white font-bold hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2 transition text-gray-700 text-sm"
                >
                  <FiPlay size={16} className="text-blue-500" /> {busy ? 'Running...' : 'Run Examples'}
                </button>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => goToQuestion(currentIdx - 1)}
                    disabled={currentIdx === 0}
                    className="flex-1 sm:flex-none px-6 py-2.5 border rounded-lg font-bold disabled:opacity-30 hover:bg-gray-50 transition text-sm"
                  >
                    Previous
                  </button>

                  {currentIdx === problems.length - 1 ? (
                    <button
                      onClick={handleFinishAttempt}
                      className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm text-sm"
                    >
                      Finish Test
                    </button>
                  ) : (
                    <button
                      onClick={() => goToQuestion(currentIdx + 1)}
                      className="flex-1 sm:flex-none px-6 py-2.5 border rounded-lg font-bold hover:bg-gray-50 transition text-sm"
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>

              <div
                onPointerDown={startDrag}
                title="Drag up or down to resize"
                className="hidden lg:flex h-3 -my-2.5 cursor-row-resize items-center justify-center touch-none select-none z-10 relative"
              >
                <div className="w-16 h-1 rounded-full bg-gray-300 hover:bg-blue-500 transition-colors" />
              </div>

              <div
                className="border rounded-xl bg-slate-900 p-4 overflow-y-auto shrink-0 space-y-2 shadow-inner min-h-[150px] lg:min-h-0"
                style={{ height: window.innerWidth >= 1024 ? resultH : 'auto' }}
              >
                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-slate-700 pb-2 mb-3">Console Output</p>

                {busy && <p className="text-xs md:text-sm text-blue-400 animate-pulse font-mono">Executing code on server...</p>}

                {!busy && !runResults && (
                  <p className="text-xs md:text-sm text-gray-500 font-mono">Click "Run Examples" to see output here.</p>
                )}

                {runResults && runResults.map((r, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border font-mono text-xs md:text-sm ${r.accepted ? 'bg-green-900/20 border-green-500/50' : 'bg-red-900/20 border-red-500/50'}`}
                  >
                    <p className={`font-bold ${r.accepted ? 'text-green-400' : 'text-red-400'}`}>
                      Example {i + 1}: {r.status}
                    </p>

                    {r.input !== undefined && (
                      <div className="mt-3 space-y-2">
                        <p className="text-gray-400 text-[10px] md:text-xs uppercase">Input</p>
                        <pre className="bg-black/40 border border-slate-700 rounded p-2 text-gray-300 whitespace-pre-wrap">{r.input}</pre>

                        {!r.stderr && (
                          <>
                            <p className="text-gray-400 text-[10px] md:text-xs uppercase">Your Output</p>
                            <pre className="bg-black/40 border border-slate-700 rounded p-2 text-gray-300 whitespace-pre-wrap">{r.stdout}</pre>
                          </>
                        )}

                        {!r.accepted && !r.stderr && (
                          <>
                            <p className="text-gray-400 text-[10px] md:text-xs uppercase">Expected</p>
                            <pre className="bg-black/40 border border-slate-700 rounded p-2 text-gray-300 whitespace-pre-wrap">{r.expected}</pre>
                          </>
                        )}
                      </div>
                    )}

                    {r.printed ? (
                      <div className="mt-3">
                        <p className="text-gray-400 text-[10px] md:text-xs uppercase">StdOut</p>
                        <pre className="bg-black/40 border border-slate-700 rounded p-2 text-gray-300 whitespace-pre-wrap">{r.printed}</pre>
                      </div>
                    ) : null}

                    {r.stderr && (
                      <pre className="text-red-400 text-[10px] md:text-xs mt-3 bg-red-900/20 p-2 rounded whitespace-pre-wrap border border-red-900/50">
                        {r.stderr}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className={`w-full lg:w-72 bg-white rounded-2xl shadow-sm border p-5 flex flex-col h-fit shrink-0 ${expanded && !currentQ?.options ? 'hidden' : ''}`}>
          <h3 className="font-bold text-gray-800 mb-4 border-b pb-2 text-sm md:text-base">Question Palette</h3>

          <div className="grid grid-cols-5 gap-2">
            {problems.map((q, i) => (
              <button
                key={q._id}
                onClick={() => goToQuestion(i)}
                className={`h-10 rounded-lg font-bold text-xs md:text-sm border-2 transition ${i === currentIdx ? 'ring-2 ring-blue-500' : ''} ${isAnswered(q) ? 'bg-green-500 text-white border-green-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <p className="text-[10px] md:text-xs text-center text-gray-400 mt-4">Green = Attempted</p>
        </div>
      </main>
    </div>
  );
};

export default DriveTest;