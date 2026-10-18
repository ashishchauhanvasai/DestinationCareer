import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { FiClock, FiAlertTriangle, FiCheckCircle, FiUploadCloud, FiXCircle } from 'react-icons/fi';

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
    contactNumber: '', aadharNumber: '', address: '' 
  });
  const [registering, setRegistering] = useState(false);

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

  const answersRef = useRef(answers);
  const testStartedRef = useRef(testStarted);
  const testCompletedRef = useRef(testCompleted);
  const warningsRef = useRef(warnings);
  const driveDataRef = useRef(driveData);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { testStartedRef.current = testStarted; }, [testStarted]);
  useEffect(() => { testCompletedRef.current = testCompleted; }, [testCompleted]);
  useEffect(() => { warningsRef.current = warnings; }, [warnings]);
  useEffect(() => { driveDataRef.current = driveData; }, [driveData]);

  useEffect(() => {
    const fetchDrive = async () => {
      try {
        const res = await axios.get(`${API}/drives/${driveCode}`);
        setDriveData(res.data);
        setQuestions(res.data.questions || []);
        setTimeLeft(res.data.durationMinutes * 60);
      } catch (err) {
        alert('Invalid or closed Drive Link');
        navigate('/login');
      }
      setLoading(false);
    };
    fetchDrive();
  }, [driveCode, navigate]);

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
      localStorage.setItem('role', 'student');
      setToken(res.data.token);
    } catch (err) { alert(err.response?.data?.message || 'Registration failed'); }
    setRegistering(false);
  };

  const submitTest = useCallback(async (reason = "Submitted Successfully") => {
    if (testCompletedRef.current) return;
    setTestCompleted(true);
    setTestStarted(false);
    exitFullScreen();

    const formattedAnswers = Object.keys(answersRef.current).map(qId => ({
      questionId: qId, selectedIndex: answersRef.current[qId]
    }));

    try {
      const res = await axios.post(`${API}/drives/${driveDataRef.current.driveId}/submit`, { answers: formattedAnswers }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
      setResult({ ...res.data, reason });
      // Remove token to force login next time
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

  if (loading) return <div className="p-10 text-center font-bold text-gray-500">Loading...</div>;

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <form onSubmit={handleRegister} className="bg-white p-8 rounded-2xl shadow-lg max-w-2xl mx-auto border">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">{driveData.collegeName}</h2>
          <p className="text-center text-gray-500 mb-6 text-sm font-semibold uppercase tracking-wider border-b pb-4">Official Intake Form</p>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left side: Photo & Credentials */}
            <div className="flex flex-col items-center space-y-4 w-full md:w-1/3 border-r pr-0 md:pr-4">
              <label className="cursor-pointer flex flex-col items-center">
                {regForm.profilePic ? (
                  <img src={regForm.profilePic} alt="DP" className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 shadow-sm" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-50 border-2 border-dashed border-blue-300 flex flex-col items-center justify-center text-blue-500 hover:bg-blue-100 transition">
                    <FiUploadCloud size={28} />
                    <span className="text-[10px] mt-1 font-bold">Upload Photo</span>
                  </div>
                )}
                <input type="file" accept="image/*" required className="hidden" onChange={handleImageUpload} />
              </label>
              
              <input required type="text" placeholder="Full Name" value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm" />
              <input required type="email" placeholder="Email ID" value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm" />
              <input required type="password" placeholder="Set Password" value={regForm.password} onChange={e => setRegForm({...regForm, password: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm" />
            </div>

            {/* Right side: Academic & Personal Info */}
            <div className="w-full md:w-2/3 space-y-4">
              <h3 className="font-bold text-gray-700 text-sm border-b pb-1">Personal Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <input required type="text" placeholder="Contact Number" value={regForm.contactNumber} onChange={e => setRegForm({...regForm, contactNumber: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm" />
                <input required type="text" placeholder="Aadhar Number" value={regForm.aadharNumber} onChange={e => setRegForm({...regForm, aadharNumber: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm" />
              </div>
              <textarea required placeholder="Full Residential Address" value={regForm.address} onChange={e => setRegForm({...regForm, address: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm" rows="2" />

              <h3 className="font-bold text-gray-700 text-sm border-b pb-1 mt-4">Academic Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <input required type="text" placeholder="Degree (e.g. B.Tech)" value={regForm.highestQualification} onChange={e => setRegForm({...regForm, highestQualification: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm" />
                <input required type="number" placeholder="Passing Year" value={regForm.passingYear} onChange={e => setRegForm({...regForm, passingYear: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm" />
              </div>
              <input required type="number" step="0.1" placeholder="Overall Percentage / CGPA" value={regForm.percentage} onChange={e => setRegForm({...regForm, percentage: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm" />
            </div>
          </div>

          <button type="submit" disabled={registering} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl mt-8 hover:bg-blue-700 shadow-md">
            {registering ? 'Creating Profile...' : 'Submit Profile & Go To Test'}
          </button>
        </form>
      </div>
    );
  }

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


  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border max-w-xl w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{driveData.collegeName} Test</h1>
          <p className="text-gray-500 mb-6 text-sm">Please read the instructions carefully before starting.</p>
          <div className="bg-blue-50 border rounded-xl p-5 mb-6 space-y-3 font-bold text-blue-900 text-sm">
            <p><FiClock className="inline mr-2" /> Duration: {driveData.durationMinutes} Minutes</p>
            <p>Total Questions: {questions.length}</p>
          </div>
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-8">
            <h3 className="text-red-800 font-bold mb-2 flex items-center gap-2"><FiAlertTriangle /> STRICT WARNING</h3>
            <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
              <li>This test requires Full Screen mode.</li>
              <li>Do NOT switch tabs or minimize.</li>
              <li>On the 3rd warning, your test will auto-submit.</li>
            </ul>
          </div>
          <button onClick={() => { enterFullScreen(); setTestStarted(true); }} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700">Start Test</button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col select-none">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 shadow-sm">
        <h1 className="font-bold text-lg text-gray-800 hidden md:block">{driveData.collegeName}</h1>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">Warnings: {warnings}/3</span>
          <div className="flex items-center gap-2 font-mono text-xl font-bold px-4 py-2 rounded-lg bg-gray-100"><FiClock /> {formatTime(timeLeft)}</div>
          <button onClick={() => window.confirm('Submit test?') && submitTest("Manual Submission")} className="bg-green-600 text-white px-5 py-2 rounded-lg font-bold">Submit</button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-4 gap-6 overflow-hidden">
        <div className="flex-1 bg-white rounded-2xl shadow-sm border p-6 overflow-y-auto">
          <div className="flex justify-between items-center border-b pb-3 mb-5">
            <h2 className="text-lg font-bold text-gray-500 uppercase tracking-widest">Question {currentIdx + 1} of {questions.length}</h2>
          </div>
          <div className="prose text-gray-800 mb-6"><ReactMarkdown>{currentQ?.text}</ReactMarkdown></div>
          <div className="space-y-3">
            {currentQ?.options?.map((opt, oIdx) => (
              <button key={oIdx} onClick={() => setAnswers(prev => ({ ...prev, [currentQ._id]: oIdx }))} className={`w-full text-left p-4 rounded-xl border-2 font-semibold ${answers[currentQ._id] === oIdx ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-gray-200 text-gray-700'}`}>
                {String.fromCharCode(65 + oIdx)}. {opt}
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-8 pt-4 border-t">
            <button onClick={() => setCurrentIdx(p => p - 1)} disabled={currentIdx === 0} className="px-6 py-2 border rounded-lg font-bold disabled:opacity-30">Previous</button>
            <button onClick={() => setCurrentIdx(p => p + 1)} disabled={currentIdx === questions.length - 1} className="px-6 py-2 border rounded-lg font-bold disabled:opacity-30">Next</button>
          </div>
        </div>

        <div className="w-full md:w-72 bg-white rounded-2xl shadow-sm border p-5 flex flex-col h-fit">
          <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Palette</h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, i) => (
              <button key={q._id} onClick={() => setCurrentIdx(i)} className={`h-10 rounded-lg font-bold text-sm border-2 ${i === currentIdx ? 'ring-2 ring-blue-500' : ''} ${answers[q._id] !== undefined ? 'bg-green-500 text-white border-green-600' : 'border-gray-200 text-gray-600'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DriveTest;