import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const diffColor = {
  Easy: 'text-green-700 dark:text-green-400 bg-green-500/10 border-green-500/20',
  Medium: 'text-yellow-700 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  Hard: 'text-red-700 dark:text-red-400 bg-red-500/10 border-red-500/20'
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
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/companies/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCompany(res.data);
      } catch (err) {
        console.error('Error loading company', err);
      }
    };
    fetchCompany();
  }, [id]);

  if (!company) return <div className="p-16 text-center font-extrabold text-gray-500 text-lg animate-pulse">Loading Company Data...</div>;

  const topics = ['All', ...new Set(company.questions.map((q) => q.topic).filter(Boolean))];
  const questions = company.questions.filter((q) => topicFilter === 'All' || q.topic === topicFilter);

  return (
    <div className="max-w-5xl mx-auto py-6 px-2 sm:px-4 lg:px-8 space-y-8 animate-fade-in">
      
      <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] shadow-sm border-white/60">
        <Link to="/company-questions" className="inline-flex items-center gap-2 text-sm font-extrabold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-xl transition-colors w-fit mb-6 shadow-sm border border-black/5 dark:border-white/5">
          <FiArrowLeft size={16} /> Back to Companies
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-black/5 dark:border-white/5 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{company.name}</h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">{company.questions.length} total interview questions</p>
          </div>
        </div>

        {topics.length > 2 && (
          <div className="flex flex-wrap gap-3 mt-6 bg-white/40 dark:bg-slate-900/40 p-4 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-inner">
            <span className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest self-center mr-2">Filter Topics</span>
            {topics.map((t) => (
              <button key={t} onClick={() => setTopicFilter(t)} className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-300 shadow-sm border ${topicFilter === t ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-white/50 dark:border-slate-700/50 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {questions.length === 0 ? (
        <div className="glass-panel p-16 rounded-[2rem] text-center font-bold text-gray-500 text-lg shadow-sm border-white/60">
          No questions added for this topic yet.
        </div>
      ) : ( 
        <div className="space-y-4 pb-12">
          {questions.map((q, i) => {
            const open = openId === q._id;
            return (
              <div key={q._id} className="glass-panel rounded-[2rem] shadow-sm border-white/60 transition-all hover:shadow-md">
                <button onClick={() => setOpenId(open ? null : q._id)} className="w-full p-6 md:p-8 flex justify-between items-center text-left group">
                  <div className="pr-4">
                    <p className="font-extrabold text-lg text-gray-900 dark:text-white tracking-tight leading-snug group-hover:text-blue-600 transition-colors">
                      <span className="text-gray-400 mr-2">{i + 1}.</span>{q.title}
                    </p>
                    <div className="flex gap-2.5 mt-3 flex-wrap">
                      <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider border shadow-sm ${diffColor[q.difficulty]}`}>{q.difficulty}</span>
                      {q.topic && <span className="text-[10px] font-extrabold text-gray-600 dark:text-gray-300 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 px-3 py-1.5 rounded-lg shadow-sm uppercase tracking-wider">{q.topic}</span>}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-black/10 dark:group-hover:bg-white/20 transition-colors text-gray-500 dark:text-gray-300">
                    {open ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                  </div>
                </button>
                
                {open && (
                  <div className="px-6 md:px-8 pb-8 pt-4 border-t border-black/5 dark:border-white/5">
                    {q.description && (
                       <div className="bg-white/50 dark:bg-slate-800/50 p-5 rounded-[1.5rem] border border-white/50 dark:border-slate-700/50 shadow-inner mb-5">
                         <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Description</p>
                         <p className="text-sm font-medium text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{q.description}</p>
                       </div>
                    )}
                    {q.answer && (
                      <div className="mt-4">
                        <button onClick={() => setShowAnswer({ ...showAnswer, [q._id]: !showAnswer[q._id] })} className="glass-button px-5 py-2.5 rounded-xl text-xs font-extrabold text-blue-600 dark:text-blue-400 transition-all">
                          {showAnswer[q._id] ? 'Hide Solution' : 'Reveal Solution'}
                        </button>
                        {showAnswer[q._id] && (
                          <div className="mt-4 bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-inner overflow-x-auto custom-scrollbar">
                            <pre className="text-[13px] font-mono whitespace-pre-wrap text-gray-100 leading-relaxed">{q.answer}</pre>
                          </div>
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