import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle } from 'react-icons/fi';

const BASE = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

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
      if (i === answer.correctIndex) return 'border-green-500 bg-green-50';
      if (i === answer.selectedIndex) return 'border-red-400 bg-red-50';
      return 'border-gray-200';
    }
    return sel === i ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50';
  };

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex justify-between items-start mb-3">
        <p className="text-xs font-bold text-gray-400 uppercase">Question {index + 1} • {q.marks} mark{q.marks === 1 ? '' : 's'}</p>
        {answer && <span className="text-xs font-bold text-green-600 flex items-center gap-1"><FiCheckCircle /> Attempted</span>}
      </div>

      <p className="text-gray-900 whitespace-pre-wrap mb-4">{q.text}</p>

      {q.images?.length > 0 && (
        <div className="space-y-3 mb-4">
          {q.images.map((id) => (
            <a key={id} href={`${BASE}/assignment-images/${id}`} target="_blank" rel="noreferrer">
              <img src={`${BASE}/assignment-images/${id}`} alt="Question diagram" className="max-w-full rounded-lg border" />
            </a>
          ))}
          <p className="text-xs text-gray-400">Click an image to open it full size.</p>
        </div>
      )}

      {isMcq ? (
        <div className="space-y-2">
          {q.options.map((opt, i) => (
            <button key={i} disabled={locked} onClick={() => setSel(i)} className={`w-full text-left p-3 border rounded-lg text-sm transition-colors ${optionStyle(i)}`}>
              {opt}
            </button>
          ))}
          {!answer && (
            <button onClick={submit} disabled={busy || sel === null} className="mt-2 bg-blue-600 text-white px-5 py-2 rounded-lg font-bold text-sm disabled:opacity-50">Submit answer</button>
          )}
          {answer && (
            <div className={`mt-2 p-3 rounded-lg text-sm ${answer.isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <p className="font-bold">{answer.isCorrect ? `Correct! +${answer.marks}` : 'Incorrect'}</p>
              {answer.explanation && <p className="mt-1 whitespace-pre-wrap">{answer.explanation}</p>}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <textarea rows="6" disabled={locked} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write your answer here..." className="w-full p-3 border rounded-lg text-sm disabled:bg-gray-50" />
          {!locked && (
            <button onClick={submit} disabled={busy || !text.trim()} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold text-sm disabled:opacity-50">
              {answer ? 'Update answer' : 'Submit answer'}
            </button>
          )}
          {answer && !answer.graded && <p className="text-sm text-orange-600 font-medium">Submitted — waiting for the trainer to review.</p>}
          {answer?.graded && (
            <div className="p-3 rounded-lg bg-blue-50 text-blue-900 text-sm">
              <p className="font-bold">Marks: {answer.marks} / {q.marks}</p>
              {answer.feedback && <p className="mt-1 whitespace-pre-wrap">Trainer feedback: {answer.feedback}</p>}
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

  if (!assignment) return <div className="p-10 text-center font-bold text-gray-500">Loading...</div>;

  const allQ = assignment.topics.flatMap((t) => t.questions);
  const done = allQ.filter((q) => answers[q._id]).length;
  const topic = assignment.topics[topicIdx];

  return (
    <div className="max-w-6xl mx-auto">
      <Link to="/assignments" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 text-sm mb-3"><FiArrowLeft /> Back to assignments</Link>
      <h1 className="text-3xl font-bold text-gray-900">{assignment.title}</h1>
      {assignment.description && <p className="text-gray-600 mt-1">{assignment.description}</p>}
      <p className="text-sm text-gray-500 mt-2 mb-6">{done} of {allQ.length} questions attempted</p>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 shrink-0 bg-white rounded-2xl border shadow-sm p-2 h-fit">
          {assignment.topics.map((t, i) => {
            const d = t.questions.filter((q) => answers[q._id]).length;
            return (
              <button key={t._id || i} onClick={() => setTopicIdx(i)} className={`w-full text-left p-3 rounded-xl text-sm mb-1 ${topicIdx === i ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}>
                <p>{i + 1}. {t.topicName}</p>
                <p className="text-xs text-gray-400 font-normal">{d} / {t.questions.length} attempted</p>
              </button>
            );
          })}
        </div>

        <div className="flex-1 space-y-5">
          {topic?.questions.length === 0 && <p className="text-gray-500">No questions in this topic yet.</p>}
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