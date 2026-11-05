import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiAward, FiCode, FiMessageCircle, FiTarget, FiChevronDown, FiChevronUp, FiStar } from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const StatBox = ({ icon: Icon, label, value }) => (
  <div className="bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-[1.5rem] p-5 text-center shadow-sm flex flex-col items-center justify-center hover:-translate-y-1 transition-transform">
    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-3 shadow-sm border border-blue-200 dark:border-blue-800">
      <Icon size={18} />
    </div>
    <p className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white leading-none mb-1.5">{value}</p>
    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-extrabold tracking-widest">{label}</p>
  </div>
);

const MockRatings = () => {
  const [groups, setGroups] = useState([]);
  const [openIdx, setOpenIdx] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/mock-ratings/mine`, cfg())
      .then((r) => setGroups(r.data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-[50vh] flex items-center justify-center font-bold text-gray-500 animate-pulse text-lg">Loading your ratings...</div>;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-fade-in pb-12">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3.5 bg-yellow-50 dark:bg-yellow-900/30 rounded-2xl border border-yellow-200 dark:border-yellow-800 shadow-sm shrink-0">
          <FiStar className="text-yellow-600 dark:text-yellow-500" size={28} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Mock Ratings</h1>
          <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mt-1">Review your performance across interview rounds.</p>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="glass-panel p-20 rounded-[2.5rem] text-center shadow-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <p className="text-gray-500 dark:text-gray-400 font-bold text-xl">No mock ratings yet. Your trainer will add these after each mock round.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((g, i) => (
            <div key={i} className="glass-panel rounded-[2.5rem] p-6 md:p-8 shadow-sm hover:shadow-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 transition-shadow group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-6 border-b border-gray-200 dark:border-slate-700 pb-5">
                <div className="min-w-0 pr-2">
                  <h3 className="font-extrabold text-2xl text-gray-900 dark:text-white tracking-tight truncate leading-tight">{g.batch?.subject}</h3>
                  <p className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 w-fit mt-2.5 shadow-sm">
                    {g.batch?.batchCode}
                  </p>
                </div>
                <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="glass-button px-5 py-3 rounded-xl text-[11px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center justify-center gap-2 border border-gray-200 dark:border-slate-700 shadow-sm transition-all bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 w-full md:w-auto shrink-0">
                  {openIdx === i ? <><FiChevronUp size={16}/> Hide Details</> : <><FiChevronDown size={16}/> View All Mocks</>}
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
                <StatBox icon={FiTarget} label="Mocks Attended" value={g.mocksAttended} />
                <StatBox icon={FiCode} label="Coding" value={`${g.avgCoding}`} />
                <StatBox icon={FiAward} label="Technical" value={`${g.avgTechnical}`} />
                <StatBox icon={FiMessageCircle} label="Communication" value={`${g.avgCommunication}`} />
              </div>

              {openIdx === i && (
                <div className="mt-8 pt-5 border-t border-gray-200 dark:border-slate-700 space-y-4">
                  {g.mocks.map((m, j) => (
                    <div key={j} className="bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 p-5 md:p-6 rounded-[1.5rem] shadow-sm flex flex-col md:flex-row justify-between gap-5 transition-colors hover:border-blue-300 dark:hover:border-blue-700">
                      <div className="flex-1">
                        <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 px-3 py-1.5 rounded-lg w-fit shadow-sm">
                          {new Date(m.date).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})}
                        </p>
                        <div className="flex gap-3 flex-wrap">
                          <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3.5 py-2 rounded-xl text-[13px] font-extrabold border border-blue-200 dark:border-blue-800 shadow-sm">Tech: {m.technicalRating}/10</span>
                          <span className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3.5 py-2 rounded-xl text-[13px] font-extrabold border border-purple-200 dark:border-purple-800 shadow-sm">Comms: {m.communicationRating}/10</span>
                          <span className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3.5 py-2 rounded-xl text-[13px] font-extrabold border border-green-200 dark:border-green-800 shadow-sm">Code: {m.codingRating}/10</span>
                        </div>
                      </div>
                      {m.remarks && (
                        <div className="md:w-1/3 md:text-right flex flex-col justify-center border-t md:border-t-0 md:border-l border-gray-200 dark:border-slate-700 pt-4 md:pt-0 md:pl-5 mt-2 md:mt-0">
                          <p className="text-[10px] uppercase font-extrabold tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">Trainer Remarks</p>
                          <p className="text-[13px] text-gray-800 dark:text-gray-200 font-medium italic leading-relaxed">"{m.remarks}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default MockRatings;