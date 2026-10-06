import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiAward, FiCode, FiMessageCircle, FiTarget } from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const StatBox = ({ icon: Icon, label, value }) => (
  <div className="bg-gray-50 rounded-xl p-3 text-center">
    <Icon className="mx-auto text-blue-500 mb-1" size={18} />
    <p className="text-lg font-bold text-gray-900">{value}</p>
    <p className="text-[10px] text-gray-500 uppercase font-semibold">{label}</p>
  </div>
);

const MockRatings = () => {
  const [groups, setGroups] = useState([]);
  const [openIdx, setOpenIdx] = useState(null);

  useEffect(() => {
    axios.get(`${API}/mock-ratings/mine`, cfg()).then((r) => setGroups(r.data)).catch((e) => console.error(e));
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Mock Ratings</h1>
      {groups.length === 0 ? (
        <p className="text-gray-500">No mock ratings yet. Your trainer will add these after each mock round.</p>
      ) : (
        <div className="space-y-6">
          {groups.map((g, i) => (
            <div key={i} className="bg-white rounded-2xl border shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{g.batch?.subject}</h3>
                  <p className="text-xs text-gray-400">{g.batch?.batchCode}</p>
                </div>
                <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="text-sm font-bold text-blue-600 hover:underline">
                  {openIdx === i ? 'Hide details' : 'View all mocks'}
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <StatBox icon={FiTarget} label="Mocks Attended" value={g.mocksAttended} />
                <StatBox icon={FiCode} label="Coding" value={`${g.avgCoding} / 10`} />
                <StatBox icon={FiAward} label="Technical" value={`${g.avgTechnical} / 10`} />
                <StatBox icon={FiMessageCircle} label="Communication" value={`${g.avgCommunication} / 10`} />
              </div>
              {openIdx === i && (
                <div className="mt-4 pt-4 border-t divide-y">
                  {g.mocks.map((m, j) => (
                    <div key={j} className="py-3 text-sm">
                      <p className="text-xs text-gray-400 mb-1">{new Date(m.date).toLocaleDateString()}</p>
                      <p>Technical: <b>{m.technicalRating}/10</b> • Communication: <b>{m.communicationRating}/10</b> • Coding: <b>{m.codingRating}/10</b></p>
                      {m.remarks && <p className="text-gray-500 italic mt-1">"{m.remarks}"</p>}
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