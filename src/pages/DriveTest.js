import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { FiClock, FiAlertTriangle, FiCheckCircle, FiUploadCloud, FiXCircle, FiPlay } from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api`;

const enterFullScreen = () => {
  const elem = document.documentElement;
  if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
};
const exitFullScreen = () => {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
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
  // NEW STATE FOR LOGIN TOGGLE
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loggingIn, setLoggingIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [driveData, setDriveData] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [result, setResult] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [warnings, setWarnings] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  // Time tracker for the waiting lobby
  const [nowTime, setNowTime] = useState(Date.now());

  const answersRef = useRef(answers);
  const testStartedRef = useRef(testStarted);
  const testCompletedRef = useRef(testCompleted);
  const warningsRef = useRef(warnings);
  const driveDataRef = useRef(driveData);
  const startTimeRef = useRef(null);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { testStartedRef.current = testStarted; }, [testStarted]);
  useEffect(() => { testCompletedRef.current = testCompleted; }, [testCompleted]);
  useEffect(() => { warningsRef.current = warnings; }, [warnings]);
  useEffect(() => { driveDataRef.current = driveData; }, [driveData]);

  // Handle ticking clock for lobby
  useEffect(() => {
    const tick = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Securely Fetch Drive & Questions
  useEffect(() => {
    const fetchDriveData = async () => {
      try {
        if (!token) {
          // Public Fetch: For Registration Form Only
          const res = await axios.get(`${API}/drives/${driveCode}/public-info`);
          setDriveData(res.data);
          setLoading(false);
        } else {
          // Secure Fetch: Get Questions using the token
          const res = await axios.get(`${API}/campus/my-drive`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (res.data.alreadySubmitted) {
            setResult({ reason: res.data.message, status: 'Completed' });
            setTestCompleted(true);
          } else {
            setDriveData(res.data);
            setQuestions(res.data.questions || []);
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

  // Active Test Timer
  useEffect(() => {
    let timer;
    if (testStarted && !testCompleted && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (testStarted && !testCompleted && timeLeft === 0) {
      submitTest("Time's Up!");
    }
    return () => clearInterval(timer);
  }, [testStarted, testCompleted, timeLeft]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setRegForm({ ...regForm, profilePic: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegistering(true);
    try {
      const res = await axios.post(`${API}/drives/${driveCode}/register`, regForm);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', 'campus_student');
      setToken(res.data.token); // Triggers the secure fetch automatically
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
      setToken(res.data.token); // Triggers secure fetch automatically
    } catch (err) { 
      alert(err.response?.data?.message || 'Login failed. Please check your credentials.'); 
    }
    setLoggingIn(false);
  };



  const startTest = () => {
    enterFullScreen();
    startTimeRef.current = Date.now();
    setTestStarted(true);
  };

  const submitTest = useCallback(async (reason = "Submitted Successfully") => {
    if (testCompletedRef.current) return;
    setTestCompleted(true);
    setTestStarted(false);
    exitFullScreen();

    const timeTakenSeconds = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0;
    const formattedAnswers = Object.keys(answersRef.current).map(qId => ({
      questionId: qId, selectedIndex: answersRef.current[qId]
    }));

    try {
      // Use driveId from the secure fetch
      await axios.post(`${API}/drives/${driveDataRef.current.driveId}/submit`, 
        { 
          answers: formattedAnswers,
          timeTakenSeconds,
          warningsCount: warningsRef.current,
          autoSubmitted: reason !== "Manual Submission" 
        }, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      
      setResult({ reason });
      localStorage.removeItem('token'); 
    } catch (err) {
      setResult({ error: true, message: err.response?.data?.message || 'Failed to submit test' });
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!testStartedRef.current || testCompletedRef.current) return;
      if (document.visibilityState === 'hidden' || !document.fullscreenElement) {
        let newWarnings = warningsRef.current + 1;
        setWarnings(newWarnings);
        if (newWarnings >= 3) {
          alert("Warning 3/3: Test is auto-submitting due to malpractice.");
          submitTest("Auto-submitted due to Malpractice");
        } else {
          alert(`Warning ${newWarnings}/3: Do NOT minimize the window or exit full screen.`);
          if (!document.fullscreenElement) enterFullScreen();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleVisibilityChange);
    };
  }, [submitTest]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Loading Secure Portal...</div>;
  if (!driveData) return null;

  // 1. REGISTRATION & LOGIN SCREEN
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        
        {isLoginMode ? (
          /* DIRECT LOGIN FORM */
          <form onSubmit={handleDriveLogin} className="bg-white p-8 rounded-2xl shadow-lg max-w-md mx-auto border mt-10">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">{driveData.collegeName}</h2>
            <p className="text-center text-gray-500 mb-6 text-sm font-semibold uppercase tracking-wider border-b pb-4">Test Portal Login</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Email ID</label>
                <input required type="email" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} placeholder="you@example.com" className="w-full p-3 border rounded-lg bg-gray-50 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Password</label>
                <input required type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} placeholder="Enter your password" className="w-full p-3 border rounded-lg bg-gray-50 text-sm" />
              </div>
            </div>

            <button type="submit" disabled={loggingIn} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl mt-6 hover:bg-blue-700 shadow-md transition-colors">
              {loggingIn ? 'Authenticating...' : 'Login to Portal'}
            </button>

            <p className="text-center text-xs text-gray-500 pt-4">
              Not registered yet? <button type="button" onClick={() => setIsLoginMode(false)} className="text-blue-600 font-bold hover:underline">Register Here</button>
            </p>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegister} className="bg-white p-8 rounded-2xl shadow-lg max-w-4xl mx-auto border">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">{driveData.collegeName}</h2>
            <p className="text-center text-gray-500 mb-6 text-sm font-semibold uppercase tracking-wider border-b pb-4">Campus Drive Registration Form</p>
            
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex flex-col items-center space-y-4 w-full md:w-1/3 border-r pr-0 md:pr-4">
                <label className="cursor-pointer flex flex-col items-center">
                  {regForm.profilePic ? (
                    <img src={regForm.profilePic} alt="DP" className="w-32 h-32 rounded-full object-cover border-4 border-blue-100 shadow-sm" />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-blue-50 border-2 border-dashed border-blue-300 flex flex-col items-center justify-center text-blue-500 hover:bg-blue-100 transition">
                      <FiUploadCloud size={32} />
                      <span className="text-xs mt-2 font-bold">Upload Photo *</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                
                <input required type="text" placeholder="Full Name *" value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm" />
                <input required type="email" placeholder="Email ID *" value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm" />
                <input required type="password" placeholder="Set Password *" minLength={6} value={regForm.password} onChange={e => setRegForm({...regForm, password: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm" />
              </div>

              <div className="w-full md:w-2/3 space-y-4">
                <h3 className="font-bold text-gray-700 text-sm border-b pb-1">Personal Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input required type="text" placeholder="Contact Number *" value={regForm.contactNumber} onChange={e => setRegForm({...regForm, contactNumber: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm" />
                  <textarea required placeholder="Full Residential Address *" value={regForm.address} onChange={e => setRegForm({...regForm, address: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm" rows="1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input required type="text" placeholder="Aadhar Number *" value={regForm.aadharNumber} onChange={e => setRegForm({...regForm, aadharNumber: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm" />
                  <input required type="text" placeholder="PAN Card No. *" value={regForm.panCard || ''} onChange={e => setRegForm({...regForm, panCard: e.target.value.toUpperCase()})} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm uppercase" />
                </div>

                <h3 className="font-bold text-gray-700 text-sm border-b pb-1 mt-4">Academic Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input required type="number" step="0.1" placeholder="10th Percentage *" value={regForm.tenthPercentage || ''} onChange={e => setRegForm({...regForm, tenthPercentage: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm" />
                  <input required type="number" step="0.1" placeholder="12th / Diploma Percentage *" value={regForm.twelfthPercentage || ''} onChange={e => setRegForm({...regForm, twelfthPercentage: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <input required type="text" placeholder="Degree (e.g. B.Tech) *" value={regForm.highestQualification} onChange={e => setRegForm({...regForm, highestQualification: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm" />
                  <input required type="text" placeholder="Branch (e.g. CSE) *" value={regForm.branch || ''} onChange={e => setRegForm({...regForm, branch: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm" />
                  <select required value={regForm.yearOfStudy || ''} onChange={e => setRegForm({...regForm, yearOfStudy: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm">
                    <option value="">Current Year *</option>
                    <option>1st Year</option>
                    <option>2nd Year</option>
                    <option>3rd Year</option>
                    <option>4th Year / Final</option>
                    <option>Graduated</option>
                  </select>
                  <input required type="number" placeholder="Passout Year *" value={regForm.passingYear} onChange={e => setRegForm({...regForm, passingYear: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm" />
                </div>
                
                <div>
                  <input required type="number" step="0.1" placeholder="Current Degree Overall % / CGPA *" value={regForm.percentage} onChange={e => setRegForm({...regForm, percentage: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={registering} className="w-full bg-teal-600 text-white font-bold py-3.5 rounded-xl mt-8 hover:bg-teal-700 shadow-md transition-colors">
              {registering ? 'Validating Profile...' : 'Register & Proceed for Assessment'}
            </button>
            <p className="text-center text-xs text-gray-500 pt-4">
              Already registered? <button type="button" onClick={() => setIsLoginMode(true)} className="text-teal-600 font-bold hover:underline">Login Here</button>
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
            You will be notified regarding the next steps via email.
          </p>
          <button 
            onClick={() => {
              localStorage.clear();
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

  // Calculate live status dynamically
  const isLiveNow = driveData.isActive && nowTime >= new Date(driveData.scheduledTestTime).getTime();

  // 3. LOBBY SCREEN (Waiting or Ready)
  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border max-w-xl w-full space-y-6">
          <div className="border-b pb-4">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-blue-700">
              Upcoming Assessment
            </span>
            <h2 className="text-2xl font-extrabold text-gray-800 mt-2">
              {driveData.collegeName} — Recruitment Test
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border text-sm">
            <div>
              <p className="text-xs text-gray-500">Scheduled Date & Time</p>
              <p className="font-bold text-gray-800">
                {new Date(driveData.scheduledTestTime).toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Duration</p>
              <p className="font-bold text-gray-800">{driveData.durationMinutes} Minutes</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5 text-sm">
              <FiAlertTriangle /> Strict Proctoring & Anti-Malpractice Rules:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Do not switch tabs, minimize the browser, or open other applications.</li>
              <li>Each tab switch triggers a malpractice warning.</li>
              <li>On the <strong>3rd warning</strong>, your test will be <strong>auto-submitted</strong> immediately.</li>
              <li>Results will be communicated via email after evaluation.</li>
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
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">
                Test will unlock automatically at the scheduled time
              </p>
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
  const currentQ = questions[currentIdx];
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col select-none">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 shadow-sm z-20">
        <h1 className="font-bold text-lg text-gray-800 hidden md:block">{driveData.collegeName} Assessment</h1>
        <div className="flex items-center gap-4">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${warnings > 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            Warnings: {warnings}/3
          </span>
          <div className="flex items-center gap-2 font-mono text-xl font-bold px-4 py-2 rounded-lg bg-slate-900 text-white shadow-inner">
            <FiClock /> {formatTime(timeLeft)}
          </div>
          <button 
  onClick={() => {
    if (Object.keys(answers).length < questions.length) {
      alert("Not finished, please attend all questions.");
    } else {
      if (window.confirm('Are you sure you want to submit your test?')) {
        submitTest("Manual Submission");
      }
    }
  }} 
  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-bold transition"
>
  Submit
</button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-4 gap-6 overflow-hidden">
        <div className="flex-1 bg-white rounded-2xl shadow-sm border p-6 overflow-y-auto">
          <div className="flex justify-between items-center border-b pb-3 mb-5">
            <h2 className="text-lg font-bold text-gray-500 uppercase tracking-widest">Question {currentIdx + 1} of {questions.length}</h2>
          </div>
          <div className="prose text-gray-800 mb-6"><ReactMarkdown>{currentQ?.text}</ReactMarkdown></div>
          
          {currentQ?.images && currentQ.images.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-6">
              {currentQ.images.map((imgId) => (
                <img key={imgId} src={`${API}/assignment-images/${imgId}`} alt="question" className="max-h-56 rounded-lg border" />
              ))}
            </div>
          )}

          <div className="space-y-3">
            {currentQ?.options?.map((opt, oIdx) => (
              <button key={oIdx} onClick={() => setAnswers(prev => ({ ...prev, [currentQ._id]: oIdx }))} className={`w-full text-left p-4 rounded-xl border-2 font-semibold transition ${answers[currentQ._id] === oIdx ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                {String.fromCharCode(65 + oIdx)}. {opt}
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-8 pt-4 border-t">
            <button 
              onClick={() => setCurrentIdx(p => p - 1)} 
              disabled={currentIdx === 0} 
              className="px-6 py-2 border rounded-lg font-bold disabled:opacity-30 hover:bg-gray-50 transition"
            >
              Previous
            </button>
            
            {currentIdx === questions.length - 1 ? (
              <button 
                onClick={() => {
                  if (Object.keys(answers).length < questions.length) {
                    alert("Not finished, please attend all questions.");
                  } else {
                    if (window.confirm("Are you sure you want to submit your test?")) {
                      submitTest("Manual Submission");
                    }
                  }
                }} 
                className="px-6 py-2 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
              >
                Finish Test
              </button>
            ) : (
              <button 
                onClick={() => setCurrentIdx(p => p + 1)} 
                className="px-6 py-2 border rounded-lg font-bold hover:bg-gray-50 transition"
              >
                Next
              </button>
            )}
          </div>
        </div>

        <div className="w-full md:w-72 bg-white rounded-2xl shadow-sm border p-5 flex flex-col h-fit">
          <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Question Palette</h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, i) => (
              <button key={q._id} onClick={() => setCurrentIdx(i)} className={`h-10 rounded-lg font-bold text-sm border-2 transition ${i === currentIdx ? 'ring-2 ring-blue-500' : ''} ${answers[q._id] !== undefined ? 'bg-green-500 text-white border-green-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {i + 1}
              </button>
            ))}
          </div>
          <p className="text-xs text-center text-gray-400 mt-4">Green = Answered</p>
        </div>
      </main>
    </div>
  );
};

export default DriveTest;