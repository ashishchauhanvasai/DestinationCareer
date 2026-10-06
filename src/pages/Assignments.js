import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';

const levelColor = {
  Beginner: 'text-green-600 bg-green-50',
  Intermediate: 'text-yellow-600 bg-yellow-50',
  Advanced: 'text-red-600 bg-red-50'
};

const Assignments = () => {
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/assignments`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then((r) => setItems(r.data)).catch((e) => console.error(e));
  }, []);

  const totalQ = items.reduce((s, a) => s + a.questions, 0);
  const doneQ = items.reduce((s, a) => s + a.answered, 0);
  const totalMarks = items.reduce((s, a) => s + a.totalMarks, 0);
  const earned = items.reduce((s, a) => s + a.marks, 0);
  const finished = items.filter((a) => a.questions > 0 && a.answered >= a.questions).length;
  const overall = totalQ ? Math.round((doneQ / totalQ) * 100) : 0;

  const visible = items.filter((a) => {
    const complete = a.questions > 0 && a.answered >= a.questions;
    if (activeTab === 'In progress' && (complete || a.answered === 0)) return false;
    if (activeTab === 'Completed' && !complete) return false;
    return a.title.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Assignments</h1>

      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8 grid grid-cols-1 md:grid-cols-5 gap-6 divide-x divide-gray-100">
        <div className="px-4 md:col-span-2">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Overall progress</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{overall}%</p>
          <p className="text-sm text-gray-600">{doneQ} of {totalQ} questions attempted</p>
          <p className="text-xs text-gray-400 mt-1">Across {items.length} assignments</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3"><div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${overall}%` }}></div></div>
        </div>
        <div className="px-4"><p className="text-xs font-semibold text-gray-500 uppercase mb-2">Assignments done</p><p className="text-2xl font-bold text-gray-900">{finished} / {items.length}</p></div>
        <div className="px-4"><p className="text-xs font-semibold text-gray-500 uppercase mb-2">Questions attempted</p><p className="text-2xl font-bold text-gray-900">{doneQ}</p></div>
        <div className="px-4"><p className="text-xs font-semibold text-gray-500 uppercase mb-2">Marks earned</p><p className="text-2xl font-bold text-gray-900">{earned} / {totalMarks}</p></div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          {['All', 'In progress', 'Completed'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-white shadow-sm border text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}>{tab}</button>
          ))}
        </div>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder="Search assignments" className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500 w-64" />
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-gray-500">No assignments found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((a) => {
            const progress = a.questions ? Math.round((a.answered / a.questions) * 100) : 0;
            const complete = a.questions > 0 && a.answered >= a.questions;
            return (
              <Link key={a._id} to={`/assignments/${a._id}`} className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition-shadow block">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-gray-900 text-lg">{a.title}</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${levelColor[a.level]}`}>{a.level}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6 text-center divide-x divide-gray-100">
                  <div><p className="text-xs text-gray-400 mb-1">Topics</p><p className="font-bold text-gray-900">{a.modules}</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">Questions</p><p className="font-bold text-gray-900">{a.questions}</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">Marks</p><p className="font-bold text-gray-900 text-sm">{a.marks} / {a.totalMarks}</p></div>
                </div>
                {complete ? (
                  <div className="pt-4 border-t text-sm font-medium text-green-600 flex justify-between">
                    <span>✓ Completed</span>
                    <span className="text-gray-500">{a.pending > 0 ? `${a.pending} awaiting review` : 'All graded'}</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between text-sm font-bold text-gray-900 mb-2"><span>Progress</span><span>{progress}%</span></div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2"><div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div></div>
                    <div className="flex justify-between text-xs text-gray-500"><span>{a.answered} attempted</span><span>{a.questions - a.answered} remaining</span></div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Assignments;