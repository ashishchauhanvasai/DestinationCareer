import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiAward, FiCode, FiMessageCircle, FiTarget, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const StatBox = ({ icon: Icon, label, value }) => (
  <div className="bg-white/40 dark:bg-slate-900/40 border border-white/50 dark:border-slate-700/50 rounded-[1.5rem] p-4 text-center shadow-sm flex flex-col items-center justify-center hover:scale-[1.02] transition-transform">
    <div className="w-10 h-10 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-2 shadow-inner border border-blue-500/20">
      <Icon size={18} />
    </div>
    <p className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white leading-none mb-1">{value}</p>
    <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase font-extrabold tracking-widest">{label}</p>
  </div>
);

const MockRatings = () => {
  const [groups, setGroups] = useState([]);
  const [openIdx, setOpenIdx] = useState(null);

  useEffect(() => {
    axios.get(`${API}/mock-ratings/mine`, cfg()).then((r) => setGroups(r.data)).catch((e) => console.error(e));
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-yellow-500/10 dark:bg-yellow-500/20 rounded-2xl backdrop-blur-md border border-yellow-500/20 shadow-sm">
          <FiStar className="text-yellow-600 dark:text-yellow-400" size={26} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Mock Ratings</h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Review your performance across interview rounds.</p>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="glass-panel p-16 rounded-[2.5rem] text-center shadow-sm border-white/60">
          <p className="text-gray-500 dark:text-gray-400 font-bold text-lg">No mock ratings yet. Your trainer will add these after each mock round.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((g, i) => (
            <div key={i} className="glass-panel rounded-[2.5rem] p-6 md:p-8 shadow-lg border-white/60 transition-all hover:shadow-xl group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-black/5 dark:border-white/5 pb-4">
                <div>
                  <h3 className="font-extrabold text-2xl text-gray-900 dark:text-white tracking-tight">{g.batch?.subject}</h3>
                  <p className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 w-fit mt-2 shadow-sm">
                    {g.batch?.batchCode}
                  </p>
                </div>
                <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="glass-button px-5 py-2.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2">
                  {openIdx === i ? <><FiChevronUp size={16}/> Hide Details</> : <><FiChevronDown size={16}/> View All Mocks</>}
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox icon={FiTarget} label="Mocks Attended" value={g.mocksAttended} />
                <StatBox icon={FiCode} label="Coding" value={`${g.avgCoding}`} />
                <StatBox icon={FiAward} label="Technical" value={`${g.avgTechnical}`} />
                <StatBox icon={FiMessageCircle} label="Communication" value={`${g.avgCommunication}`} />
              </div>

              {openIdx === i && (
                <div className="mt-8 pt-4 border-t border-black/5 dark:border-white/5 space-y-4">
                  {g.mocks.map((m, j) => (
                    <div key={j} className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 p-5 md:p-6 rounded-[1.5rem] shadow-inner flex flex-col md:flex-row justify-between gap-4 transition-colors hover:bg-black/10 dark:hover:bg-white/10">
                      <div>
                        <p className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 bg-white/50 dark:bg-slate-800/50 px-3 py-1 rounded-md w-fit shadow-sm">
                          {new Date(m.date).toLocaleDateString()}
                        </p>
                        <div className="flex gap-3 flex-wrap">
                          <span className="bg-blue-500/10 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-500/20">Technical: {m.technicalRating}/10</span>
                          <span className="bg-purple-500/10 text-purple-700 dark:text-purple-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-purple-500/20">Comms: {m.communicationRating}/10</span>
                          <span className="bg-green-500/10 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-green-500/20">Coding: {m.codingRating}/10</span>
                        </div>
                      </div>
                      {m.remarks && (
                        <div className="md:w-1/3 md:text-right flex flex-col justify-center">
                          <p className="text-[10px] uppercase font-extrabold tracking-widest text-gray-400 mb-1">Trainer Remarks</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium italic leading-relaxed">"{m.remarks}"</p>
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