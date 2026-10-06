import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const diffColor = {
  Easy: 'text-green-600 bg-green-50',
  Medium: 'text-yellow-600 bg-yellow-50',
  Hard: 'text-red-600 bg-red-50'
};

const CompanyQuestionDetail = () => {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [showAnswer, setShowAnswer] = useState({});
  const [topicFilter, setTopicFilter] = useState('All');

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/companies/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCompany(res.data);
      } catch (err) {
        console.error('Error loading company', err);
      }
    };
    fetchCompany();
  }, [id]);

  if (!company) return <div className="p-10 text-center font-bold text-gray-500">Loading...</div>;

  const topics = ['All', ...new Set(company.questions.map((q) => q.topic).filter(Boolean))];
  const questions = company.questions.filter((q) => topicFilter === 'All' || q.topic === topicFilter);

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/company-questions" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 text-sm font-medium mb-4">
        <FiArrowLeft /> Back to Companies
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-1">{company.name}</h1>
      <p className="text-sm text-gray-500 mb-6">{company.questions.length} questions</p>

      {topics.length > 2 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {topics.map((t) => (
            <button key={t} onClick={() => setTopicFilter(t)} className={`px-3 py-1 border rounded-full text-xs font-medium ${topicFilter === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {t}
            </button>
          ))}
        </div>
      )}

      {questions.length === 0 ? (
        <p className="text-gray-500">No questions added yet.</p>
      ) : ( 
        <div className="space-y-3">
          {questions.map((q, i) => {
            const open = openId === q._id;
            return (
              <div key={q._id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <button onClick={() => setOpenId(open ? null : q._id)} className="w-full p-5 flex justify-between items-center text-left">
                  <div>
                    <p className="font-bold text-gray-900">{i + 1}. {q.title}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${diffColor[q.difficulty]}`}>{q.difficulty}</span>
                      {q.topic && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{q.topic}</span>}
                    </div>
                  </div>
                  {open ? <FiChevronUp /> : <FiChevronDown />}
                </button>
                {open && (
                  <div className="px-5 pb-5 border-t pt-4 space-y-4">
                    {q.description && <p className="text-sm text-gray-700 whitespace-pre-wrap">{q.description}</p>}
                    {q.answer && (
                      <div>
                        <button onClick={() => setShowAnswer({ ...showAnswer, [q._id]: !showAnswer[q._id] })} className="text-sm font-bold text-blue-600 hover:underline">
                          {showAnswer[q._id] ? 'Hide answer' : 'Show answer'}
                        </button>
                        {showAnswer[q._id] && (
                          <pre className="mt-2 bg-gray-50 border rounded-lg p-4 text-sm whitespace-pre-wrap font-mono">{q.answer}</pre>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CompanyQuestionDetail;