import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const diffColor = { Easy: 'text-green-600 bg-green-50', Medium: 'text-yellow-600 bg-yellow-50', Hard: 'text-red-600 bg-red-50' };
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const Tests = () => {
  const [problems, setProblems] = useState([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    axios.get('http://localhost:5000/api/problems', cfg()).then((r) => setProblems(r.data)).catch((e) => console.error(e));
  }, []);

  const earned = problems.reduce((a, p) => a + (p.bestScore || 0), 0);
  const available = problems.reduce((a, p) => a + p.points, 0);
  const solved = problems.filter((p) => p.bestScore === p.points).length;
  const visible = problems.filter((p) => filter === 'All' || p.difficulty === filter);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Coding Tests</h1>
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6 grid grid-cols-3 divide-x">
        <div className="px-4"><p className="text-xs text-gray-500 font-semibold uppercase">Marks earned</p><p className="text-2xl font-bold">{earned} / {available}</p></div>
        <div className="px-4"><p className="text-xs text-gray-500 font-semibold uppercase">Fully solved</p><p className="text-2xl font-bold">{solved} / {problems.length}</p></div>
        <div className="px-4"><p className="text-xs text-gray-500 font-semibold uppercase">Attempted</p><p className="text-2xl font-bold">{problems.filter((p) => p.attempts > 0).length}</p></div>
      </div>
      <div className="flex gap-2 mb-4">
        {['All', 'Easy', 'Medium', 'Hard'].map((d) => (
          <button key={d} onClick={() => setFilter(d)} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${filter === d ? 'bg-white shadow-sm border text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}>{d}</button>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border divide-y">
        {visible.length === 0 && <p className="p-8 text-center text-gray-500">No questions yet.</p>}
        {visible.map((p) => (
          <Link key={p._id} to={`/tests/${p.slug}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
            <div>
              <p className="font-semibold text-gray-900">{p.title}</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${diffColor[p.difficulty]}`}>{p.difficulty}</span>
            </div>
            <div className="text-right text-sm">
              <p className={p.bestScore === p.points ? 'text-green-600 font-bold' : 'text-gray-700 font-semibold'}>{p.bestScore === null ? 'Not attempted' : `${p.bestScore} / ${p.points}`}</p>
              {p.attempts > 0 && <p className="text-xs text-gray-400">{p.attempts} attempt(s)</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
export default Tests;