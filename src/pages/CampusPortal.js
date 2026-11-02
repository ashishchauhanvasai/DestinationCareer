import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiAlertTriangle, FiCheckCircle, FiLogOut, FiPlay } from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const CampusPortal = () => {
  const navigate = useNavigate();
  const [drive, setDrive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Test State
  const [testStarted, setTestStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [warnings, setWarnings] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submittedMsg, setSubmittedMsg] = useState('');

  // Countdown to scheduled start
  const [nowTime, setNowTime] = useState(Date.now());
  const startTimeRef = useRef(null);
  const warningsRef = useRef(0);

  const loadDrive = async () => {
    try {
      const res = await axios.get(`${API}/campus/my-drive`, cfg());
      setDrive(res.data);
      if (res.data.alreadySubmitted) {
        setSubmittedMsg(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load Campus Portal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrive();
    const tick = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (
      drive &&
      !drive.alreadySubmitted &&
      !drive.isTestLive &&
      drive.scheduledTestTime &&
      nowTime >= new Date(drive.scheduledTestTime).getTime()
    ) {
      loadDrive();
    }
  }, [nowTime, drive]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const startTest = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    setTimeLeft((drive.durationMinutes || 60) * 60);
    startTimeRef.current = Date.now();
    setTestStarted(true);
  };

  const submitTest = async (isAuto = false, finalWarnings = warningsRef.current) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const timeTakenSeconds = startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current) / 1000)
        : 0;

      const formattedAnswers = Object.entries(answers).map(([questionId, selectedIndex]) => ({
        questionId,
        selectedIndex
      }));

      const res = await axios.post(
        `${API}/drives/${drive.driveId}/submit`,
        {
          answers: formattedAnswers,
          timeTakenSeconds,
          warningsCount: finalWarnings,
          autoSubmitted: isAuto
        },
        cfg()
      );

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setTestStarted(false);
      setSubmittedMsg(
        res.data.message ||
          'Thank you for completing the test! We will update your result soon through your email.'
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting test.');
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!testStarted) return;
    if (timeLeft <= 0) {
      submitTest(true, warningsRef.current);
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [testStarted, timeLeft]);

  useEffect(() => {
    if (!testStarted) return;

    const handleViolation = () => {
      warningsRef.current += 1;
      const currentW = warningsRef.current;
      setWarnings(currentW);

      if (currentW >= 3) {
        alert('⚠️ MALPRACTICE LIMIT EXCEEDED (3/3)! Your test is being auto-submitted immediately.');
        submitTest(true, currentW);
      } else {
        alert(`⚠️ WARNING ${currentW}/3: Tab switching or leaving the test window is strictly prohibited! On the 3rd warning, your test will be auto-submitted.`);
      }
    };

    const onVisibilityChange = () => { if (document.hidden) handleViolation(); };
    const onBlur = () => { handleViolation(); };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
    };
  }, [testStarted, answers]);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="glass-panel p-10 rounded-[2.5rem] flex flex-col items-center gap-4 animate-pulse">
           <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
           <p className="text-lg font-extrabold text-gray-800 dark:text-gray-200">Loading Assessment Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#f1f5f9] dark:bg-slate-900">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 dark:bg-teal-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Minimal Header */}
      <header className="glass-panel m-4 rounded-[2rem] px-8 py-4 flex items-center justify-between shadow-sm z-20">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-teal-600 dark:text-teal-400">
            Destination Career
          </h1>
          {drive?.collegeName && (
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{drive.collegeName}</p>
          )}
        </div>
        {!testStarted && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-600 text-red-600 hover:text-white px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all border border-red-500/20"
          >
            <FiLogOut size={16} /> Sign Out
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 z-10 w-full overflow-y-auto custom-scrollbar pb-10">
        {error ? (
          <div className="glass-panel p-10 rounded-[2.5rem] shadow-xl max-w-md w-full text-center border-white/60">
            <div className="w-16 h-16 bg-red-500/10 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20"><FiAlertTriangle size={28} /></div>
            <p className="text-red-600 font-extrabold text-xl mb-6">{error}</p>
            <button onClick={handleLogout} className="w-full glass-button text-gray-800 dark:text-gray-200 px-6 py-3 rounded-xl text-sm font-extrabold">
              Back to Login
            </button>
          </div>
        ) : submittedMsg ? (
          /* BLIND THANK YOU SCREEN */
          <div className="glass-panel p-12 rounded-[2.5rem] shadow-2xl max-w-lg w-full text-center border-white/60 animate-fade-in">
            <div className="w-24 h-24 bg-teal-500/10 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-teal-500/20">
              <FiCheckCircle size={44} />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              Test Completed
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-8 font-medium">
              {submittedMsg}
            </p>
            <div className="bg-black/5 dark:bg-white/5 p-5 rounded-2xl border border-black/5 dark:border-white/5 text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-8 shadow-inner">
              Your responses are securely recorded and pending evaluation.
            </div>
            <button onClick={handleLogout} className="w-full bg-gradient-to-r from-gray-800 to-gray-900 text-white py-4 rounded-xl font-extrabold shadow-lg hover:scale-[0.98] transition-transform text-[15px]">
              Sign Out Safely
            </button>
          </div>
        ) : !testStarted ? (
          /* UPCOMING TEST LOBBY */
          <div className="glass-panel p-10 rounded-[2.5rem] shadow-2xl max-w-xl w-full border-white/60 animate-fade-in">
            <div className="border-b border-black/5 dark:border-white/5 pb-6 mb-6 text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-4 py-2 rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 shadow-sm inline-block mb-4">
                Upcoming Assessment
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
                {drive.collegeName} Recruitment Test
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-5 mb-8">
              <div className="bg-black/5 dark:bg-white/5 p-5 rounded-2xl text-center border border-black/5 dark:border-white/5 shadow-inner">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-widest mb-1.5">Scheduled</p>
                <p className="font-extrabold text-gray-900 dark:text-white text-base">{new Date(drive.scheduledTestTime).toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-black/5 dark:bg-white/5 p-5 rounded-2xl text-center border border-black/5 dark:border-white/5 shadow-inner">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-widest mb-1.5">Duration</p>
                <p className="font-extrabold text-gray-900 dark:text-white text-base">{drive.durationMinutes} Minutes</p>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-xs text-amber-900 dark:text-amber-400 space-y-3 mb-8 shadow-sm">
              <p className="font-extrabold flex items-center gap-2 text-sm uppercase tracking-wider">
                <FiAlertTriangle size={18} /> Anti-Malpractice Rules
              </p>
              <ul className="list-disc list-inside space-y-2 font-medium leading-relaxed opacity-90 pl-1">
                <li>Do not switch tabs, minimize the browser, or open other applications.</li>
                <li>Each tab switch triggers a malpractice warning.</li>
                <li>On the <strong>3rd warning</strong>, your test will be <strong>auto-submitted</strong> immediately.</li>
              </ul>
            </div>

            {drive.isTestLive ? (
              <button onClick={startTest} className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white py-4 rounded-xl font-extrabold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-teal-500/30 transition-all hover:scale-[0.98]">
                <FiPlay size={18} /> Start Assessment Now
              </button>
            ) : (
              <div className="text-center p-6 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 shadow-inner">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-extrabold mb-3">
                  Test unlocks automatically
                </p>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center justify-center gap-3">
                  <FiClock className="text-teal-600 dark:text-teal-400" />
                  {Math.max(0, Math.ceil((new Date(drive.scheduledTestTime).getTime() - nowTime) / 60000))} mins remaining
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ACTIVE TEST INTERFACE */
          <div className="max-w-4xl w-full flex flex-col min-h-0 h-full animate-fade-in">
            {/* Sticky Status Bar */}
            <div className="glass-panel p-5 rounded-[2rem] shadow-md border-white/60 flex flex-wrap items-center justify-between gap-4 sticky top-4 z-50 mb-8">
              <div>
                <h3 className="font-extrabold text-gray-900 dark:text-white tracking-tight text-lg">{drive.collegeName} Test</h3>
                <p className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">
                  Answered: <span className="text-blue-600 dark:text-blue-400">{Object.keys(answers).length}</span> / {drive.questions?.length || 0}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <span className={`px-4 py-2 rounded-xl text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-sm border ${warnings > 0 ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 animate-pulse' : 'bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-black/5 dark:border-white/5'}`}>
                  <FiAlertTriangle /> Warnings {warnings}/3
                </span>
                <span className="px-5 py-2.5 rounded-xl bg-gray-900 text-white font-mono font-bold text-lg flex items-center gap-2 shadow-inner border border-gray-700">
                  <FiClock className="text-teal-400" /> {formatTimer(timeLeft)}
                </span>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to submit your test?')) {
                      submitTest(false, warningsRef.current);
                    }
                  }}
                  disabled={submitting}
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-8 py-3 rounded-xl font-extrabold text-sm transition-transform shadow-lg shadow-teal-500/30 hover:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                >
                  {submitting ? 'Submitting...' : 'Submit Test'}
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-6 pb-20">
              {(drive.questions || []).map((q, idx) => (
                <div key={q._id} className="glass-panel p-8 md:p-10 rounded-[2.5rem] shadow-sm border-white/60">
                  <div className="flex justify-between items-start gap-4 mb-6 border-b border-black/5 dark:border-white/5 pb-4">
                    <p className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight leading-relaxed">
                      <span className="text-gray-400 mr-1">Q{idx + 1}.</span> {q.text}
                    </p>
                    <span className="text-[11px] font-extrabold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg shrink-0 shadow-sm uppercase tracking-wider">
                      {q.marks || 1} Mark(s)
                    </span>
                  </div>

                  {q.images && q.images.length > 0 && (
                    <div className="flex flex-wrap gap-4 mb-8 bg-white/40 dark:bg-slate-800/40 p-4 rounded-[1.5rem] shadow-inner border border-white/50 dark:border-slate-700/50">
                      {q.images.map((imgId) => (
                        <img key={imgId} src={`${API}/assignment-images/${imgId}`} alt="question" className="max-h-56 rounded-xl border border-gray-200 shadow-sm bg-white" />
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3.5">
                    {(q.options || []).map((opt, oIdx) => {
                      const selected = answers[q._id] === oIdx;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => setAnswers({ ...answers, [q._id]: oIdx })}
                          className={`text-left p-4 md:p-5 rounded-[1.2rem] border-2 text-sm font-bold transition-all flex items-center gap-4 ${
                            selected
                              ? 'border-teal-500 bg-teal-500/10 text-teal-900 dark:text-teal-300 shadow-sm'
                              : 'border-white/50 dark:border-slate-700/50 hover:bg-white/60 dark:hover:bg-slate-800/60 text-gray-700 dark:text-gray-200'
                          }`}
                        >
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold border-2 shrink-0 transition-colors ${
                              selected
                                ? 'bg-teal-500 border-teal-500 text-white'
                                : 'border-gray-300 dark:border-slate-600 text-gray-500'
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="leading-snug">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CampusPortal;