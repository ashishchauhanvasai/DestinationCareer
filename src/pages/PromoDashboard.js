import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiClock, FiCheckCircle, FiX, FiUsers, FiLink, FiCopy, FiTarget, FiArrowLeft } from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const inputCls = 'w-full p-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400';
const labelCls = 'block text-xs font-semibold text-gray-500 mb-1 uppercase';

const PromoDashboard = () => {
  const [view, setView] = useState('list'); // 'list' | 'create' | 'submissions'
  const [drives, setDrives] = useState([]);
  const [assignments, setAssignments] = useState([]); // Pre-uploaded assignments
  const [subs, setSubs] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    collegeName: '',
    driveCode: '',
    durationMinutes: 60,
    cutoffPercentage: 70,
    selectedAssignmentIds: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [drRes, asgnRes] = await Promise.all([
        axios.get(`${API}/drives`, cfg()),
        axios.get(`${API}/assignments`, cfg()) // Fetching all existing assignments
      ]);
      setDrives(drRes.data);
      // Filter out assignments that have 0 questions
      setAssignments(asgnRes.data.filter(a => a.questions > 0));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (form.selectedAssignmentIds.length === 0) {
      return alert("Please select at least one assignment for the MCQ test.");
    }
    
    // Automatically convert drive code to uppercase and remove spaces
    const payload = {
      ...form,
      driveCode: form.driveCode.toUpperCase().replace(/\s+/g, '-')
    };

    try {
      await axios.post(`${API}/drives`, payload, cfg());
      alert('College Drive Created Successfully!');
      setForm({ collegeName: '', driveCode: '', durationMinutes: 60, cutoffPercentage: 70, selectedAssignmentIds: [] });
      setView('list');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create drive. Make sure Drive Code is unique.');
    }
  };

  const toggleAssignment = (id) => {
    setForm(prev => {
      const arr = prev.selectedAssignmentIds.includes(id)
        ? prev.selectedAssignmentIds.filter(x => x !== id)
        : [...prev.selectedAssignmentIds, id];
      return { ...prev, selectedAssignmentIds: arr };
    });
  };

  const openSubmissions = async (drive) => {
    setSelectedDrive(drive);
    setView('submissions');
    setSubs([]);
    try {
      const res = await axios.get(`${API}/drives/${drive._id}/submissions`, cfg());
      setSubs(res.data);
    } catch (err) {
      alert("Could not load submissions");
    }
  };

  const copyLink = (code) => {
    const link = `${window.location.origin}/drive/${code}`;
    navigator.clipboard.writeText(link);
    alert('Student Registration Link Copied: ' + link);
  };

  if (loading) return <div className="p-10 text-center font-bold text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Campus Drive Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage college visits, test links, and select top students.</p>
        </div>
        {view === 'list' && (
          <button 
            onClick={() => setView('create')} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2"
          >
            <FiPlus size={18} /> Create New Drive
          </button>
        )}
      </div>

      {/* VIEW: CREATE DRIVE */}
      {view === 'create' && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-lg font-bold text-gray-800">New College Drive Setup</h2>
            <button type="button" onClick={() => setView('list')} className="text-gray-400 hover:text-gray-600 p-2"><FiX size={20}/></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>College / Event Name</label>
              <input required placeholder="e.g. VIT Pune Campus Drive" value={form.collegeName} onChange={e => setForm({...form, collegeName: e.target.value})} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Unique Drive Code (For Link)</label>
              <input required placeholder="e.g. VIT-2026" value={form.driveCode} onChange={e => setForm({...form, driveCode: e.target.value.toUpperCase().replace(/\s+/g, '-')})} className={`${inputCls} font-mono uppercase`} />
            </div>
            <div>
              <label className={labelCls}>Test Duration (Minutes)</label>
              <input type="number" min="10" required value={form.durationMinutes} onChange={e => setForm({...form, durationMinutes: Number(e.target.value)})} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Cutoff Percentage (%)</label>
              <input type="number" min="1" max="100" required value={form.cutoffPercentage} onChange={e => setForm({...form, cutoffPercentage: Number(e.target.value)})} className={inputCls} />
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-800 mb-2">Select MCQ Question Banks</h3>
            <p className="text-xs text-gray-500 mb-3">Choose the pre-uploaded assignments. Only MCQ questions from these assignments will be shown in the drive test.</p>
            
            {assignments.length === 0 ? (
              <p className="text-sm text-red-500 bg-red-50 p-4 rounded-lg border border-red-200">No assignments found in the database. Please tell the trainer/admin to upload assignments first.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                {assignments.map(a => (
                  <label key={a._id} className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition ${form.selectedAssignmentIds.includes(a._id) ? 'border-blue-500 bg-blue-50' : 'bg-white hover:bg-gray-100'}`}>
                    <input type="checkbox" className="mt-1 accent-blue-600" checked={form.selectedAssignmentIds.includes(a._id)} onChange={() => toggleAssignment(a._id)} />
                    <div>
                      <p className="font-bold text-sm text-gray-800">{a.title}</p>
                      <p className="text-[10px] text-gray-500">{a.questions} Total Questions • {a.level}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setView('list')} className="px-5 py-2 font-bold text-gray-600 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-5 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save & Generate Link</button>
          </div>
        </form>
      )}

      {/* VIEW: LIST DRIVES */}
      {view === 'list' && (
        <div>
          {drives.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
              <FiTarget size={40} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-lg font-bold text-gray-600">No College Drives Yet</h2>
              <p className="text-sm text-gray-400 mt-1">Click "Create New Drive" to start your first campus hiring event.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {drives.map(d => (
                <div key={d._id} className="bg-white rounded-2xl shadow-sm border p-5 hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-lg text-gray-900 leading-tight">{d.collegeName}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${d.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {d.isActive ? 'ACTIVE' : 'CLOSED'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <span className="font-mono text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                        {d.driveCode}
                      </span>
                      <button onClick={() => copyLink(d.driveCode)} className="text-gray-400 hover:text-blue-600 p-1" title="Copy Student Link">
                        <FiCopy />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <FiClock className="mx-auto text-gray-400 mb-1" />
                        <p className="text-xs font-bold text-gray-800">{d.durationMinutes} mins</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <FiCheckCircle className="mx-auto text-green-500 mb-1" />
                        <p className="text-xs font-bold text-gray-800">Cutoff {d.cutoffPercentage}%</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => openSubmissions(d)}
                    className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800 flex items-center justify-center gap-2"
                  >
                    <FiUsers /> View Results
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: SUBMISSIONS (RESULTS) */}
      {view === 'submissions' && selectedDrive && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => setView('list')} className="text-blue-600 hover:underline flex items-center gap-1 text-sm font-bold">
              <FiArrowLeft /> Back to Drives
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-6 flex flex-wrap justify-between items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{selectedDrive.collegeName} Results</h2>
              <p className="text-sm text-gray-500">Code: <span className="font-mono">{selectedDrive.driveCode}</span> • Cutoff: {selectedDrive.cutoffPercentage}%</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Total Appeared</p>
                <p className="text-2xl font-bold text-gray-800">{subs.length}</p>
              </div>
              <div className="text-center border-l pl-4">
                <p className="text-[10px] font-bold text-green-600 uppercase">Selected</p>
                <p className="text-2xl font-bold text-green-600">{subs.filter(s => s.status === 'Selected').length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 border-b">
                <tr>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4 text-center">Score</th>
                  <th className="p-4 text-center">Percentage</th>
                  <th className="p-4 text-center">Warnings</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subs.length === 0 ? (
                  <tr><td colSpan="6" className="p-8 text-center text-gray-500">No students have submitted the test yet.</td></tr>
                ) : (
                  subs.map(s => (
                    <tr key={s._id} className="hover:bg-gray-50">
                      <td className="p-4 font-bold text-gray-800">
                        {s.student?.name}
                        {s.student?.highestQualification && <span className="block text-[10px] text-gray-400 font-normal">{s.student.highestQualification} ({s.student.passingYear})</span>}
                      </td>
                      <td className="p-4 text-gray-600">{s.student?.email}</td>
                      <td className="p-4 text-center font-bold text-gray-700">{s.totalScore} / {s.maxScore}</td>
                      <td className="p-4 text-center font-bold">{s.percentage}%</td>
                      <td className="p-4 text-center">
                        {s.warningsCount > 0 
                          ? <span className="text-red-500 font-bold bg-red-50 px-2 py-1 rounded">{s.warningsCount} strikes</span> 
                          : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${s.status === 'Selected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default PromoDashboard;