import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
    if (videoId) {
      fetchDoubts();
    } else {
      setDoubts([]);
      setLoading(false);
    }
  }, [videoId]);

  // Fetch doubts for the current video
  const fetchDoubts = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/doubts/${videoId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setDoubts(res.data);
    } catch (err) {
      console.error('Error loading doubts:', err);
      setError('Failed to load discussions.');
    } finally {
      setLoading(false);
    }
  };

  // Ask a new question
  const handleAskQuestion = async (e) => {
    e.preventDefault();

    if (!newQuestion.trim()) {
      return;
    }

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/doubts`,
        {
          videoId,
          question: newQuestion.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setDoubts((prevDoubts) => [res.data, ...prevDoubts]);
      setNewQuestion('');
      setError('');
    } catch (err) {
      console.error('Error posting question:', err);
      alert('Failed to post question.');
    }
  };

  // Reply to a doubt
  const handleReply = async (e, doubtId) => {
    e.preventDefault();

    const text = replyInputs[doubtId];

    if (!text || !text.trim()) {
      return;
    }

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/doubts/${doubtId}/reply`,
        {
          replyText: text.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setDoubts((prevDoubts) =>
        prevDoubts.map((doubt) =>
          doubt._id === doubtId ? res.data : doubt
        )
      );

      setReplyInputs((prevInputs) => ({
        ...prevInputs,
        [doubtId]: ''
      }));
    } catch (err) {
      console.error('Error posting reply:', err);
      alert('Failed to post reply.');
    }
  };

  // Mark / unmark reply as correct
  const handleMarkCorrect = async (
    doubtId,
    replyId,
    currentStatus
  ) => {
    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/doubts/${doubtId}/replies/${replyId}/correct`,
        {
          isCorrect: !currentStatus
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setDoubts((prevDoubts) =>
        prevDoubts.map((doubt) =>
          doubt._id === doubtId ? res.data : doubt
        )
      );
    } catch (err) {
      console.error('Error marking reply:', err);
      alert('Failed to mark reply as correct.');
    }
  };

  // No video selected
  if (!videoId) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="mt-6 p-6 text-center text-gray-500">
        Loading discussions...
      </div>
    );
  }

  return (
    <div className="mt-8 bg-white border border-gray-200 rounded-xl shadow-sm p-5">

      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800">
          Class Discussion & Doubts
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Ask questions, discuss the topic, and learn together.
        </p>
      </div>

      {/* Ask New Doubt */}
      <form
        onSubmit={handleAskQuestion}
        className="flex gap-2 mb-5"
      >
        <input
          type="text"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Got a doubt about this topic? Ask here..."
          className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          disabled={!newQuestion.trim()}
          className="px-5 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Ask
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {/* Doubts */}
      {doubts.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
          No doubts asked yet. Be the first to start the discussion!
        </div>
      ) : (
        <div className="space-y-5">

          {doubts.map((doubt) => (
            <div
              key={doubt._id}
              className="border border-gray-200 rounded-xl p-4 bg-gray-50"
            >

              {/* Question Header */}
              <div className="flex items-start justify-between gap-3 mb-3">

                <div>
                  <div className="flex items-center gap-2 flex-wrap">

                    <span className="font-semibold text-gray-800">
                      {doubt.user?.name || 'Student'}
                    </span>

                    {doubt.user?.role && (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600 capitalize">
                        {doubt.user.role}
                      </span>
                    )}

                    {doubt.isResolved && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-semibold">
                        Resolved
                      </span>
                    )}

                  </div>
                </div>

              </div>

              {/* Question */}
              <div className="mb-4">
                <p className="text-gray-800 leading-relaxed">
                  {doubt.question}
                </p>
              </div>

              {/* Replies */}
              {doubt.replies && doubt.replies.length > 0 && (
                <div className="space-y-3 mb-4">

                  {doubt.replies.map((reply) => (
                    <div
                      key={reply._id}
                      className={`p-3 rounded-lg border ${
                        reply.isCorrect
                          ? 'bg-green-50 border-green-300'
                          : 'bg-white border-gray-200'
                      }`}
                    >

                      {/* Reply Header */}
                      <div className="flex items-center justify-between gap-2 mb-2">

                        <div className="flex items-center gap-2 flex-wrap">

                          <span className="font-semibold text-sm text-gray-800">
                            {reply.user?.name || 'User'}
                          </span>

                          {reply.user?.role &&
                            reply.user.role !== 'student' && (
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 capitalize">
                                {reply.user.role}
                              </span>
                            )}

                          {reply.isCorrect && (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-600 text-white font-semibold">
                              ✓ Verified Answer
                            </span>
                          )}

                        </div>

                        {/* Trainer/Admin Validation */}
                        {isStaff && (
                          <button
                            type="button"
                            onClick={() =>
                              handleMarkCorrect(
                                doubt._id,
                                reply._id,
                                reply.isCorrect
                              )
                            }
                            className={`text-xs px-3 py-1 border rounded font-bold transition-colors ${
                              reply.isCorrect
                                ? 'bg-green-600 text-white border-green-600 hover:bg-green-700'
                                : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {reply.isCorrect
                              ? 'Unmark'
                              : 'Mark as Correct'}
                          </button>
                        )}

                      </div>

                      {/* Reply Text */}
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {reply.replyText}
                      </p>

                    </div>
                  ))}

                </div>
              )}

              {/* Reply Input */}
              <form
                onSubmit={(e) => handleReply(e, doubt._id)}
                className="flex gap-2 mt-3 pt-3 border-t border-gray-200"
              >
                <input
                  type="text"
                  value={replyInputs[doubt._id] || ''}
                  onChange={(e) =>
                    setReplyInputs((prevInputs) => ({
                      ...prevInputs,
                      [doubt._id]: e.target.value
                    }))
                  }
                  placeholder="Write a reply..."
                  className="flex-1 p-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />

                <button
                  type="submit"
                  disabled={!replyInputs[doubt._id]?.trim()}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
