import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { FiClock, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

// Full-screen toggle helper functions
const enterFullScreen = () => {
  const elem = document.documentElement;
  if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
  else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen().catch(() => {});
  else if (elem.msRequestFullscreen) elem.msRequestFullscreen().catch(() => {});
};

const exitFullScreen = () => {
  if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
  }
};

const DriveTest = () => {
  const { driveCode } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [driveData, setDriveData] = useState(null);
  
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [result, setResult] = useState(null);
  
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: selectedIndex }
  
  // Anti-cheat state
  const [warnings, setWarnings] = useState(0);
  const MAX_WARNINGS = 3;
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(0);

  // Refs for event listeners to access latest state
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

  // 1. Fetch Drive Details
  useEffect(() => {
    const fetchDrive = async () => {
      try {
        const res = await axios.get(`${API}/drives/${driveCode}`);
        setDriveData(res.data);
        setQuestions(res.data.questions || []);
        setTimeLeft(res.data.durationMinutes * 60);
      } catch (err) {
        alert(err.response?.data?.message || 'Invalid or closed Drive Link');
        navigate('/login');
      }
      setLoading(false);
    };
    fetchDrive();
  }, [driveCode, navigate]);

  // 2. Timer Countdown logic
  useEffect(() => {
    let timer;
    if (testStarted && !testCompleted && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (testStarted && !testCompleted && timeLeft === 0) {
      submitTest("Time's Up!");
    }
    return () => clearInterval(timer);
  }, [testStarted, testCompleted, timeLeft]);

  // 3. Submit Test Function
  const submitTest = useCallback(async (reason = "Submitted Successfully") => {
    if (testCompletedRef.current) return;
    setTestCompleted(true);
    setTestStarted(false);
    exitFullScreen();

    // Format answers for backend
    const formattedAnswers = Object.keys(answersRef.current).map(qId => ({
      questionId: qId,
      selectedIndex: answersRef.current[qId]
    }));

    try {
      const res = await axios.post(`${API}/drives/${driveDataRef.current.driveId}/submit`, {
        answers: formattedAnswers
      }, cfg());
      setResult({ ...res.data, reason });
    } catch (err) {
      setResult({ error: true, message: err.response?.data?.message || 'Failed to submit test' });
    }
  }, []);

  // 4. ANTI-CHEAT: Full Screen Change & Window Blur
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!testStartedRef.current || testCompletedRef.current) return;

      if (document.visibilityState === 'hidden' || !document.fullscreenElement) {
        let newWarnings = warningsRef.current + 1;
        setWarnings(newWarnings);

        if (newWarnings >= MAX_WARNINGS) {
          alert(`Warning ${newWarnings}/${MAX_WARNINGS}: Test is now auto-submitting due to malpractice.`);
          submitTest("Auto-submitted due to Malpractice (Tab switch/Minimize)");
        } else {
          alert(`Warning ${newWarnings}/${MAX_WARNINGS}: Do NOT minimize the window, switch tabs, or exit full screen. On warning 3, your test will auto-submit.`);
          // Force back to full screen if they just exited it
          if (!document.fullscreenElement) enterFullScreen();
        }
      }
    };

    const handleWindowBlur = () => {
      if (!testStartedRef.current || testCompletedRef.current) return;
      // Triggers if they open a separate desktop window over the browser
      handleVisibilityChange();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [submitTest]);

  // Handlers
  const startTest = () => {
    enterFullScreen();
    setTestStarted(true);
  };

  const selectOption = (qId, optionIndex) => {
    setAnswers(prev => ({ ...prev, [qId]: optionIndex }));
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- RENDER STATES ---

  if (loading) return <div className="p-10 text-center font-bold text-gray-500">Loading Test Environment...</div>;

  if (testCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border">
          {result?.error ? (
            <>
              <FiAlertTriangle className="text-red-500 text-5xl mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Submission Error</h2>
              <p className="text-gray-600">{result.message}</p>
            </>
          ) : (
            <>
              <FiCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Test Submitted!</h2>
              <p className="text-sm font-bold text-blue-600 mb-4">{result?.reason}</p>
              
              <div className="bg-gray-50 p-4 rounded-xl border mt-4">
                <p className="text-sm text-gray-500 uppercase font-bold mb-1">Your Score</p>
                <p className="text-3xl font-bold text-gray-900">{result?.percentage}%</p>
              </div>

              <div className={`mt-6 p-3 rounded-lg font-bold ${result?.status === 'Selected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                Result Status: {result?.status}
              </div>
            </>
          )}
          <button onClick={() => navigate('/login')} className="mt-8 text-sm font-bold text-gray-500 hover:text-gray-800">Return to Login</button>
        </div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border max-w-xl w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{driveData.collegeName} - Hiring Drive</h1>
          <p className="text-gray-500 mb-6 text-sm">Please read the instructions carefully before starting.</p>
          
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6 space-y-3">
            <p className="flex items-center gap-2 text-sm font-bold text-blue-900">
              <FiClock /> Duration: {driveData.durationMinutes} Minutes
            </p>
            <p className="text-sm text-blue-800 font-semibold">Total Questions: {questions.length}</p>
          </div>

          <div className="bg-red-50 border border-red-100 p-4 rounded-xl mb-8">
            <h3 className="text-red-800 font-bold mb-2 flex items-center gap-2"><FiAlertTriangle /> STRICT WARNING</h3>
            <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
              <li>This test will open in Full Screen mode.</li>
              <li>Do NOT minimize the browser or switch tabs.</li>
              <li>Do NOT press Esc to exit full screen.</li>
              <li><strong>You have 3 warnings. On the 3rd warning, your test will be auto-submitted and locked.</strong></li>
            </ul>
          </div>

          <button onClick={startTest} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-md">
            I Understand, Start Test
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col select-none">
      {/* TEST HEADER */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <h1 className="font-bold text-lg text-gray-800 hidden md:block">{driveData.collegeName}</h1>
        
        <div className="flex items-center gap-6">
          <div className="bg-red-50 border border-red-200 px-3 py-1 rounded-lg">
            <p className="text-xs font-bold text-red-600">Warnings: {warnings}/{MAX_WARNINGS}</p>
          </div>
          
          <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-2 rounded-lg border ${timeLeft < 300 ? 'bg-red-600 text-white border-red-700 animate-pulse' : 'bg-gray-100 text-gray-800'}`}>
            <FiClock /> {formatTime(timeLeft)}
          </div>
          
          <button onClick={() => { if(window.confirm('Are you sure you want to submit? You cannot change answers after this.')) submitTest("Manual Submission"); }} className="bg-green-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-green-700 shadow-sm">
            Submit Test
          </button>
        </div>
      </header>

      {/* TEST BODY */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-7xl mx-auto w-full p-4 gap-6">
        
        {/* Left: Question Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border p-6 overflow-y-auto">
          <div className="flex justify-between items-center border-b pb-3 mb-5">
            <h2 className="text-lg font-bold text-gray-500 uppercase tracking-widest">Question {currentIdx + 1} of {questions.length}</h2>
            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{currentQ?.marks || 1} Mark(s)</span>
          </div>

          <div className="prose max-w-none text-gray-800 mb-6">
            <ReactMarkdown>{currentQ?.text}</ReactMarkdown>
          </div>

          {currentQ?.images?.map(imgId => (
             <img key={imgId} src={`${API}/assignment-images/${imgId}`} alt="Question visual" className="max-w-full rounded-lg border mb-6 max-h-64 object-contain" />
          ))}

          <div className="space-y-3">
            {currentQ?.options?.map((opt, oIdx) => {
              const isSelected = answers[currentQ._id] === oIdx;
              return (
                <button
                  key={oIdx}
                  onClick={() => selectOption(currentQ._id, oIdx)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all font-semibold ${isSelected ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'}`}
                >
                  <span className="inline-block w-6 text-gray-400 mr-2">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between mt-8 pt-4 border-t">
            <button onClick={() => setCurrentIdx(p => Math.max(0, p - 1))} disabled={currentIdx === 0} className="px-6 py-2 rounded-lg font-bold border disabled:opacity-30 hover:bg-gray-50">Previous</button>
            <button onClick={() => setCurrentIdx(p => Math.min(questions.length - 1, p + 1))} disabled={currentIdx === questions.length - 1} className="px-6 py-2 rounded-lg font-bold border disabled:opacity-30 hover:bg-gray-50">Next</button>
          </div>
        </div>

        {/* Right: Question Palette Grid */}
        <div className="w-full md:w-72 shrink-0 bg-white rounded-2xl shadow-sm border p-5 h-fit flex flex-col">
          <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Question Palette</h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, i) => {
              const isAttempted = answers[q._id] !== undefined;
              const isCurrent = i === currentIdx;
              return (
                <button
                  key={q._id}
                  onClick={() => setCurrentIdx(i)}
                  className={`h-10 rounded-lg font-bold text-sm border-2 flex items-center justify-center transition-all ${isCurrent ? 'ring-2 ring-offset-2 ring-blue-500' : ''} ${isAttempted ? 'bg-green-500 border-green-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-6 pt-4 border-t flex flex-col gap-2 text-xs font-semibold text-gray-500">
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded border border-green-600"></div> Attempted</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-white rounded border-2 border-gray-200"></div> Unattempted</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border-2 border-blue-500 ring-2 ring-offset-1 ring-blue-500/30"></div> Current Question</div>
          </div>
        </div>
        
      </main>
    </div>
  );
};

export default DriveTest;