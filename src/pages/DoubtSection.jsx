import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiTrash2, FiMessageCircle, FiCheckCircle, FiSend } from 'react-icons/fi';

const DoubtSection = ({ videoId }) => {
  const [doubts, setDoubts] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyInputs, setReplyInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  const isStaff = ['trainer', 'admin', 'superadmin'].includes(userRole);

  useEffect(() => {
    if (videoId) fetchDoubts();
    else { setDoubts([]); setLoading(false); }
  }, [videoId]);

  const fetchDoubts = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/doubts/${videoId}`, { headers: { Authorization: `Bearer ${token}` } });
      setDoubts(res.data);
    } catch (err) {
      console.error('Error loading doubts:', err);
      setError('Failed to load discussions.');
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/doubts`, { videoId, question: newQuestion.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      setDoubts((prevDoubts) => [res.data, ...prevDoubts]);
      setNewQuestion('');
      setError('');
    } catch (err) { alert('Failed to post question.'); }
  };

  const handleReply = async (e, doubtId) => {
    e.preventDefault();
    const text = replyInputs[doubtId];
    if (!text || !text.trim()) return;
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/doubts/${doubtId}/reply`, { replyText: text.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      setDoubts((prevDoubts) => prevDoubts.map((doubt) => (doubt._id === doubtId ? res.data : doubt)));
      setReplyInputs((prevInputs) => ({ ...prevInputs, [doubtId]: '' }));
    } catch (err) { alert('Failed to post reply.'); }
  };

  const handleMarkCorrect = async (doubtId, replyId, currentStatus) => {
    try {
      const res = await axios.put(`${process.env.REACT_APP_API_URL}/api/doubts/${doubtId}/replies/${replyId}/correct`, { isCorrect: !currentStatus }, { headers: { Authorization: `Bearer ${token}` } });
      setDoubts((prevDoubts) => prevDoubts.map((doubt) => (doubt._id === doubtId ? res.data : doubt)));
    } catch (err) { alert('Failed to mark reply as correct.'); }
  };

  const handleDeleteDoubt = async (doubtId) => {
    if (!window.confirm("Are you sure you want to delete this doubt?")) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/doubts/${doubtId}`, { headers: { Authorization: `Bearer ${token}` } });
      setDoubts(doubts.filter(doubt => doubt._id !== doubtId));
    } catch (error) { alert(error.response?.data?.message || "Failed to delete doubt"); }
  };

  if (!videoId) return null;
  if (loading) return <div className="mt-8 glass-panel p-10 rounded-[2rem] text-center text-gray-500 font-bold">Loading discussions...</div>;

  return (
    <div className="mt-10 glass-panel p-8 md:p-10 rounded-[2.5rem] shadow-sm border-white/60 animate-fade-in">
      
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-sm">
          <FiMessageCircle size={22} />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Class Discussion</h2>
          <p className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Ask questions and learn together.</p>
        </div>
      </div>

      <form onSubmit={handleAskQuestion} className="relative mb-8">
        <input
          type="text"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Got a doubt about this topic? Ask here..."
          className="apple-input pr-[110px]"
        />
        <button
          type="submit"
          disabled={!newQuestion.trim()}
          className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white px-6 rounded-lg font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2"
        >
          Ask <FiSend size={14} className="hidden sm:inline" />
        </button>
      </form>

      {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm font-bold rounded-2xl shadow-sm">{error}</div>}

      {doubts.length === 0 ? (
        <div className="bg-black/5 dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10 rounded-[2rem] p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 font-bold text-base">No doubts asked yet. Be the first to start the discussion!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {doubts.map((doubt) => (
            <div key={doubt._id} className="bg-white/50 dark:bg-slate-800/50 border border-white/50 dark:border-slate-700/50 rounded-[2rem] p-6 md:p-8 shadow-sm transition-all hover:shadow-md">
              
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-10 h-10 rounded-[1rem] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center font-extrabold text-blue-600 dark:text-blue-400 border border-white dark:border-slate-600 shadow-sm shrink-0">
                    {doubt.user?.name?.charAt(0).toUpperCase() || 'S'}
                  </div>
                  <div>
                    <span className="font-extrabold text-gray-900 dark:text-white block text-base">{doubt.user?.name || 'Student'}</span>
                    <div className="flex gap-2 mt-1">
                      {doubt.user?.role && <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 uppercase tracking-wider shadow-sm">{doubt.user.role}</span>}
                      {doubt.isResolved && <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 uppercase tracking-wider shadow-sm flex items-center gap-1"><FiCheckCircle /> Resolved</span>}
                    </div>
                  </div>
                </div>

                {isStaff && (
                  <button onClick={() => handleDeleteDoubt(doubt._id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 bg-red-500/10 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-500/20 shrink-0">
                    <FiTrash2 size={14} />
                  </button>
                )}
              </div>

              <p className="text-gray-800 dark:text-gray-200 leading-relaxed font-medium text-[15px] mb-6 pl-13 md:pl-0">{doubt.question}</p>

              {doubt.replies && doubt.replies.length > 0 && (
                <div className="space-y-4 mb-6 pl-4 md:pl-10 border-l-2 border-black/5 dark:border-white/5">
                  {doubt.replies.map((reply) => (
                    <div key={reply._id} className={`p-5 rounded-[1.5rem] border shadow-sm transition-all ${reply.isCorrect ? 'bg-green-500/5 border-green-500/20' : 'bg-white/60 dark:bg-slate-800/60 border-white/50 dark:border-slate-700/50'}`}>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-gray-900 dark:text-white">{reply.user?.name || 'User'}</span>
                          {reply.user?.role && reply.user.role !== 'student' && (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 uppercase tracking-wider">{reply.user.role}</span>
                          )}
                          {reply.isCorrect && (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-gradient-to-r from-green-500 to-emerald-600 text-white uppercase tracking-wider flex items-center gap-1 shadow-sm">
                              <FiCheckCircle /> Verified
                            </span>
                          )}
                        </div>

                        {isStaff && (
                          <button
                            type="button"
                            onClick={() => handleMarkCorrect(doubt._id, reply._id, reply.isCorrect)}
                            className={`glass-button text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all ${
                              reply.isCorrect ? 'bg-green-600 text-white border-green-500' : 'text-gray-600 dark:text-gray-300'
                            }`}
                          >
                            {reply.isCorrect ? 'Unmark' : 'Verify'}
                          </button>
                        )}
                      </div>
                      <p className="text-[14px] text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{reply.replyText}</p>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={(e) => handleReply(e, doubt._id)} className="relative">
                <input
                  type="text"
                  value={replyInputs[doubt._id] || ''}
                  onChange={(e) => setReplyInputs((prevInputs) => ({ ...prevInputs, [doubt._id]: e.target.value }))}
                  placeholder="Write a reply..."
                  className="apple-input bg-white/80 dark:bg-slate-900/80 pr-[90px]"
                />
                <button
                  type="submit"
                  disabled={!replyInputs[doubt._id]?.trim()}
                  className="absolute right-2 top-2 bottom-2 glass-button border-none bg-blue-600/90 text-white px-5 rounded-lg font-extrabold text-xs disabled:opacity-50 transition-all hover:bg-blue-600 flex items-center justify-center shadow-md"
                >
                  Reply
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoubtSection;