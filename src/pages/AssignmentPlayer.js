import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle } from 'react-icons/fi';

const BASE = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const inputCls = "apple-input";

const QuestionCard = ({ q, index, aId, answer, onSaved }) => {
  const [sel, setSel] = useState(null);
  const [text, setText] = useState(answer?.text || '');
  const [busy, setBusy] = useState(false);
  const isMcq = q.qType === 'MCQ';
  const locked = isMcq ? Boolean(answer) : Boolean(answer?.graded);

  const submit = async () => {
    setBusy(true);
    try {
      const body = isMcq ? { selectedIndex: sel } : { text };
      const r = await axios.post(`${BASE}/assignments/${aId}/questions/${q._id}/answer`, body, cfg());
      onSaved(r.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit');
    }
    setBusy(false);
  };

  const optionStyle = (i) => {
    if (answer && isMcq) {
      if (i === answer.correctIndex) return 'border-green-500 bg-green-500/20 text-green-900 dark:text-green-300 shadow-sm';
      if (i === answer.selectedIndex) return 'border-red-400 bg-red-500/20 text-red-900 dark:text-red-300 shadow-sm';
      return 'border-black/5 dark:border-white/10 opacity-50 cursor-not-allowed';
    }
    return sel === i ? 'border-blue-500 bg-blue-500/10 text-blue-900 dark:text-blue-300 shadow-sm scale-[1.01]' : 'border-gray-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800';
  };

  return (
    <div className="glass-panel rounded-[2rem] border-white/60 p-6 md:p-8 mb-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-wrap justify-between items-center mb-5 gap-4 border-b border-black/5 dark:border-white/5 pb-4">
        <p className="text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5">
          Question {index + 1} <span className="text-blue-500 mx-1">•</span> {q.marks} Mark{q.marks === 1 ? '' : 's'}
        </p>
        {answer && (
          <span className="text-xs font-extrabold text-green-700 dark:text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 uppercase tracking-wider shadow-sm">
            <FiCheckCircle size={14} /> Attempted
          </span>
        )}
      </div>

      <p className="text-lg font-bold text-gray-900 dark:text-white whitespace-pre-wrap mb-6 leading-relaxed">{q.text}</p>

      {q.images?.length > 0 && (
        <div className="space-y-4 mb-6 bg-white/40 dark:bg-slate-900/40 p-4 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-inner">
          <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest pl-1">Attached References (Click to Enlarge)</p>
          <div className="flex flex-wrap gap-4">
            {q.images.map((id) => (
              <a key={id} href={`${BASE}/assignment-images/${id}`} target="_blank" rel="noreferrer" className="block hover:scale-105 transition-transform shadow-md rounded-xl">
                <img src={`${BASE}/assignment-images/${id}`} alt="Question diagram" className="max-w-[250px] w-full rounded-xl border border-gray-200 object-cover bg-white" />
              </a>
            ))}
          </div>
        </div>
      )}

      {isMcq ? (
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button key={i} disabled={locked} onClick={() => setSel(i)} className={`w-full text-left p-4 md:p-5 border-2 rounded-2xl text-sm font-semibold transition-all duration-300 ${optionStyle(i)}`}>
              <span className="inline-block w-6 font-extrabold opacity-60">{String.fromCharCode(65 + i)}.</span> {opt}
            </button>
          ))}
          {!answer && (
            <div className="pt-4 flex justify-end">
              <button onClick={submit} disabled={busy || sel === null} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3.5 rounded-xl font-extrabold text-sm disabled:opacity-50 shadow-lg shadow-blue-500/30 hover:scale-[0.98] transition-all">
                {busy ? 'Submitting...' : 'Submit Answer'}
              </button>
            </div>
          )}
          {answer && (
            <div className={`mt-5 p-5 rounded-2xl border shadow-sm ${answer.isCorrect ? 'bg-green-500/10 border-green-500/20 text-green-800 dark:text-green-300' : 'bg-red-500/10 border-red-500/20 text-red-800 dark:text-red-300'}`}>
              <p className="font-extrabold text-lg flex items-center gap-2">{answer.isCorrect ? <><FiCheckCircle /> Correct! (+{answer.marks} Marks)</> : 'Incorrect'}</p>
              {answer.explanation && <p className="mt-3 text-sm font-medium leading-relaxed bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-white/50 dark:border-slate-700">{answer.explanation}</p>}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <textarea rows="6" disabled={locked} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your detailed answer here..." className={`${inputCls} resize-none ${locked ? 'opacity-60 cursor-not-allowed bg-black/5 dark:bg-white/5' : ''}`} />
          {!locked && (
            <div className="flex justify-end pt-2">
              <button onClick={submit} disabled={busy || !text.trim()} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3.5 rounded-xl font-extrabold text-sm disabled:opacity-50 shadow-lg shadow-blue-500/30 hover:scale-[0.98] transition-all">
                {answer ? 'Update Answer' : 'Submit Answer'}
              </button>
            </div>
          )}
          {answer && !answer.graded && (
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-400 text-sm font-bold shadow-sm flex items-center gap-2">
              <FiCheckCircle size={18} /> Submitted — Waiting for trainer review.
            </div>
          )}
          {answer?.graded && (
            <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-300 text-sm shadow-sm">
              <p className="font-extrabold text-lg mb-2">Marks Awarded: {answer.marks} / {q.marks}</p>
              {answer.feedback && (
                <div className="mt-3 bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-white/50 dark:border-slate-700">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 mb-1">Trainer Feedback</p>
                  <p className="font-medium whitespace-pre-wrap">{answer.feedback}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AssignmentPlayer = () => {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [topicIdx, setTopicIdx] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [a, mine] = await Promise.all([
          axios.get(`${BASE}/assignments/${id}`, cfg()),
          axios.get(`${BASE}/assignments/${id}/my-answers`, cfg())
        ]);
        setAssignment(a.data);
        const map = {};
        mine.data.forEach((x) => { map[x.questionId] = x; });
        setAnswers(map);
      } catch (err) { console.error(err); }
    };
    load();
  }, [id]);

  if (!assignment) return <div className="p-16 text-center font-bold text-gray-500 text-lg animate-pulse">Loading Assignment...</div>;

  const allQ = assignment.topics.flatMap((t) => t.questions);
  const done = allQ.filter((q) => answers[q._id]).length;
  const progressPercent = allQ.length > 0 ? Math.round((done / allQ.length) * 100) : 0;
  const topic = assignment.topics[topicIdx];

  return (
    <div className="max-w-7xl mx-auto py-6 px-2 sm:px-4 lg:px-8 space-y-6">
      
      <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div>
          <Link to="/assignments" className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-extrabold mb-4 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-xl transition-colors w-fit">
            <FiArrowLeft size={16} /> Back to Assignments
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">{assignment.title}</h1>
          {assignment.description && <p className="text-gray-600 dark:text-gray-300 mt-2 font-medium leading-relaxed max-w-3xl">{assignment.description}</p>}
        </div>
        
        <div className="bg-white/50 dark:bg-slate-800/50 p-5 rounded-[1.5rem] border border-white/50 dark:border-slate-700/50 shadow-inner min-w-[200px] shrink-0">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Progress</span>
            <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">{progressPercent}%</span>
          </div>
          <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2.5 mb-2 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <p className="text-[11px] font-bold text-gray-600 dark:text-gray-300 text-right">{done} of {allQ.length} attempted</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        
        {/* SIDEBAR NAVIGATION (Glass Panel) */}
        <div className="lg:w-80 w-full shrink-0 glass-panel rounded-[2rem] p-4 h-fit sticky top-6 shadow-sm border-white/60">
          <p className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-3 mb-4 mt-2">Modules</p>
          <div className="space-y-2">
            {assignment.topics.map((t, i) => {
              const d = t.questions.filter((q) => answers[q._id]).length;
              const isActive = topicIdx === i;
              return (
                <button 
                  key={t._id || i} 
                  onClick={() => setTopicIdx(i)} 
                  className={`w-full text-left p-4 rounded-2xl transition-all duration-300 flex flex-col justify-between group ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  <p className="font-extrabold text-sm mb-1.5">{i + 1}. {t.topicName}</p>
                  <div className="flex justify-between items-center w-full">
                    <p className={`text-[10px] font-extrabold uppercase tracking-wider ${isActive ? 'text-blue-200' : 'text-gray-400'}`}>
                      {d} / {t.questions.length} Attempted
                    </p>
                    {d === t.questions.length && t.questions.length > 0 && (
                      <FiCheckCircle size={14} className={isActive ? 'text-white' : 'text-green-500'} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* QUESTIONS LIST */}
        <div className="flex-1 w-full space-y-6">
          {topic?.questions.length === 0 && (
            <div className="glass-panel p-16 rounded-[2rem] text-center text-gray-500 font-medium text-lg">
              No questions in this topic yet.
            </div>
          )}
          {topic?.questions.map((q, i) => (
            <QuestionCard
              key={q._id}
              q={q}
              index={i}
              aId={id}
              answer={answers[q._id]}
              onSaved={(a) => setAnswers((prev) => ({ ...prev, [a.questionId]: a }))}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssignmentPlayer;