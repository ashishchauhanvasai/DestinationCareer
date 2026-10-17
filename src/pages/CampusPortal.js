// Save as: src/pages/CampusPortal.js
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

  // Re-fetch automatically when countdown hits zero so questions load
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

  // Start the Test
  const startTest = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    setTimeLeft((drive.durationMinutes || 60) * 60);
    startTimeRef.current = Date.now();
    setTestStarted(true);
  };

  // Submit Test Handler (Blind submission)
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

  // Timer Effect during active test
  useEffect(() => {
    if (!testStarted) return;
    if (timeLeft <= 0) {
      submitTest(true, warningsRef.current);
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [testStarted, timeLeft]);

  // 3-Strike Anti-Cheat / Malpractice Detection (Tab Switch / Window Blur)
  useEffect(() => {
    if (!testStarted) return;

    const handleViolation = () => {
      warningsRef.current += 1;
      const currentW = warningsRef.current;
      setWarnings(currentW);

      if (currentW >= 3) {
        alert(
          '⚠️ MALPRACTICE LIMIT EXCEEDED (3/3)! Your test is being auto-submitted immediately.'
        );
        submitTest(true, currentW);
      } else {
        alert(
          `⚠️ WARNING ${currentW}/3: Tab switching or leaving the test window is strictly prohibited! On the 3rd warning, your test will be auto-submitted.`
        );
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) handleViolation();
    };
    const onBlur = () => {
      handleViolation();
    };

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
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <p className="text-lg font-semibold animate-pulse">Loading Campus Assessment Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Minimal Header (No Main Portal Navigation) */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-lg font-extrabold tracking-wide text-teal-400">
            Destination Career — Campus Assessment Portal
          </h1>
          {drive?.collegeName && (
            <p className="text-xs text-slate-300">{drive.collegeName}</p>
          )}
        </div>
        {!testStarted && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-slate-800 hover:bg-red-600 px-4 py-2 rounded-lg text-xs font-bold transition"
          >
            <FiLogOut /> Sign Out
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        {error ? (
          <div className="bg-white p-8 rounded-2xl shadow border max-w-md w-full text-center">
            <p className="text-red-600 font-bold mb-2">{error}</p>
            <button
              onClick={handleLogout}
              className="mt-4 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold"
            >
              Back to Login
            </button>
          </div>
        ) : submittedMsg ? (
          /* BLIND THANK YOU SCREEN AFTER TEST COMPLETION */
          <div className="bg-white p-10 rounded-3xl shadow-xl border max-w-lg w-full text-center space-y-4">
            <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto">
              <FiCheckCircle size={44} />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-800">
              Thank You for Completing the Test!
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              {submittedMsg}
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border text-xs text-gray-500">
              Your responses have been securely recorded and sent to the promotional team for evaluation.
            </div>
            <button
              onClick={handleLogout}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold transition mt-4"
            >
              Sign Out Safely
            </button>
          </div>
        ) : !testStarted ? (
          /* UPCOMING TEST / START TEST LOBBY */
          <div className="bg-white p-8 rounded-3xl shadow-xl border max-w-xl w-full space-y-6">
            <div className="border-b pb-4">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-teal-50 text-teal-700">
                Upcoming Assessment
              </span>
              <h2 className="text-2xl font-extrabold text-gray-800 mt-2">
                {drive.collegeName} — Recruitment Test
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border text-sm">
              <div>
                <p className="text-xs text-gray-500">Scheduled Date & Time</p>
                <p className="font-bold text-gray-800">
                  {new Date(drive.scheduledTestTime).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Duration</p>
                <p className="font-bold text-gray-800">{drive.durationMinutes} Minutes</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-sm">
                <FiAlertTriangle /> Strict Proctoring & Anti-Malpractice Rules:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Do not switch tabs, minimize the browser, or open other applications.</li>
                <li>Each tab switch triggers a malpractice warning.</li>
                <li>On the <strong>3rd warning</strong>, your test will be <strong>auto-submitted</strong> immediately.</li>
                <li>Results will be communicated via email after evaluation.</li>
              </ul>
            </div>

            {drive.isTestLive ? (
              <button
                onClick={startTest}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 shadow-lg transition"
              >
                <FiPlay /> Start Assessment Now
              </button>
            ) : (
              <div className="text-center p-4 bg-slate-100 rounded-2xl">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">
                  Test will unlock automatically at the scheduled time
                </p>
                <p className="text-lg font-extrabold text-slate-800 flex items-center justify-center gap-2">
                  <FiClock className="text-teal-600" />
                  {Math.max(
                    0,
                    Math.ceil(
                      (new Date(drive.scheduledTestTime).getTime() - nowTime) / 60000
                    )
                  )}{' '}
                  minutes remaining
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ACTIVE TEST INTERFACE */
          <div className="max-w-4xl w-full space-y-6 select-none">
            {/* Sticky Status Bar */}
            <div className="sticky top-2 z-20 bg-white p-4 rounded-2xl shadow-lg border flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-gray-800">{drive.collegeName} Test</h3>
                <p className="text-xs text-gray-500">
                  Answered: {Object.keys(answers).length} / {drive.questions?.length || 0}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                    warnings > 0
                      ? 'bg-red-100 text-red-700 border border-red-300'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <FiAlertTriangle /> Warnings: {warnings} / 3
                </span>

                <span className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-mono font-bold text-sm flex items-center gap-2">
                  <FiClock /> {formatTimer(timeLeft)}
                </span>

                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to submit your test?')) {
                      submitTest(false, warningsRef.current);
                    }
                  }}
                  disabled={submitting}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl font-bold text-sm transition"
                >
                  {submitting ? 'Submitting...' : 'Submit Test'}
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {(drive.questions || []).map((q, idx) => (
                <div key={q._id} className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <p className="font-bold text-gray-800 text-sm sm:text-base">
                      Q{idx + 1}. {q.text}
                    </p>
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded shrink-0">
                      {q.marks || 1} Mark(s)
                    </span>
                  </div>

                  {q.images && q.images.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {q.images.map((imgId) => (
                        <img
                          key={imgId}
                          src={`${API}/assignment-images/${imgId}`}
                          alt="question"
                          className="max-h-56 rounded-lg border"
                        />
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-2.5">
                    {(q.options || []).map((opt, oIdx) => {
                      const selected = answers[q._id] === oIdx;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => setAnswers({ ...answers, [q._id]: oIdx })}
                          className={`text-left p-3.5 rounded-xl border text-sm font-medium transition flex items-center gap-3 ${
                            selected
                              ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold'
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                              selected
                                ? 'bg-teal-600 text-white border-teal-600'
                                : 'border-gray-300 text-gray-500'
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span>{opt}</span>
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