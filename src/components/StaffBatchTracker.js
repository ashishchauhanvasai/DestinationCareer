import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiArrowLeft,
  FiUsers,
  FiClock,
  FiStar,
  FiChevronDown,
  FiChevronUp,
  FiCheckSquare,
  FiTrash2,
  FiX
} from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const fmtDay = (d) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

const muted = 'text-gray-500 dark:text-gray-400 font-medium';

const Stat = ({ label, value }) => (
  <div className="bg-black/5 dark:bg-white/5 rounded-[1.5rem] border border-black/5 dark:border-white/5 p-5 text-center">
    <p className="text-3xl font-extrabold text-gray-900 dark:text-white leading-none">{value}</p>
    <p className="text-[10px] uppercase font-extrabold tracking-widest text-gray-500 dark:text-gray-400 mt-2">{label}</p>
  </div>
);

const Scores = ({ t, c, co }) => (
  <span className="text-[11px] font-extrabold tracking-wider bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-black/5 dark:border-white/5">
    Tech <span className="text-blue-600">{t}</span> <span className="text-gray-300 mx-1">|</span> Comm <span className="text-purple-600">{c}</span> <span className="text-gray-300 mx-1">|</span> Code <span className="text-green-600">{co}</span>
  </span>
);

const BackButton = ({ onClick, children }) => (
  <button type="button" onClick={onClick} className="flex items-center gap-2 text-sm font-extrabold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-white/40 dark:bg-slate-900/40 backdrop-blur-md px-4 py-2 rounded-xl w-fit shadow-sm border border-white/50 dark:border-slate-700/50">
    <FiArrowLeft size={16} /> {children}
  </button>
);

const StaffBatchTracker = ({ title }) => {
  const isAdmin = ['admin', 'superadmin'].includes(localStorage.getItem('role'));

  const [list, setList] = useState({ batches: [], unassignedCount: null });
  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState(null); 
  const [tab, setTab] = useState('students');
  const [students, setStudents] = useState(null);
  const [mocks, setMocks] = useState(null);
  
  const [matrixData, setMatrixData] = useState(null);
  const [openRound, setOpenRound] = useState(null);
  const [studentView, setStudentView] = useState(null);

  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [movingStudent, setMovingStudent] = useState(null); 
  const [targetBatchId, setTargetBatchId] = useState('');

  const fetchBatchList = () => {
    axios.get(`${API}/staff/batches`, cfg())
      .then((r) => setList(r.data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBatchList(); }, []);

  const openBatch = async (b) => {
    setBatch(b);
    setTab('students');
    setStudents(null);
    setMocks(null);
    setMatrixData(null);
    setOpenRound(null);
    setSelectedStudentIds([]);
    try {
      const r = await axios.get(`${API}/staff/batches/${b._id}/students`, cfg());
      setStudents(r.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not load the students');
    }
  };

  const refreshCurrentBatch = async () => {
    fetchBatchList();
    if (batch) {
      try {
        const r = await axios.get(`${API}/staff/batches/${batch._id}/students`, cfg());
        setStudents(r.data);
        setSelectedStudentIds([]);
      } catch (err) { console.error(err); }
    }
  };

  const showMocks = async () => {
    setTab('mocks');
    if (mocks) return;
    try { setMocks((await axios.get(`${API}/staff/batches/${batch._id}/mocks`, cfg())).data); } 
    catch (err) { alert('Could not load the mock history'); }
  };

  const showMatrix = async () => {
    setTab('matrix');
    if (matrixData) return;
    try { setMatrixData((await axios.get(`${API}/staff/batches/${batch._id}/attendance-matrix`, cfg())).data); } 
    catch (err) { alert('Could not load attendance calendar.'); }
  };

  const toggleAttendance = async (sessionId, studentId, isCurrentlyPresent) => {
    const isPresent = !isCurrentlyPresent;
    setMatrixData(prev => {
      const newMap = { ...prev.attMap };
      if (isPresent) newMap[`${studentId}_${sessionId}`] = true;
      else delete newMap[`${studentId}_${sessionId}`];
      return { ...prev, attMap: newMap };
    });
    try { await axios.post(`${API}/staff/batches/${batch._id}/attendance/toggle`, { sessionId, studentId, isPresent }, cfg()); } 
    catch (err) { alert("Failed to save attendance."); }
  };

  const openStudent = async (id) => {
    setStudentView({ loading: true });
    try { setStudentView({ data: (await axios.get(`${API}/staff/students/${id}/history`, cfg())).data }); } 
    catch (err) { setStudentView(null); alert('Could not load the student'); }
  };

  const handleDeleteStudent = async (s) => {
    if (!window.confirm(`Remove ${s.name} (${s.email}) permanently? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/users/${s._id}`, cfg());
      alert(`${s.name} has been deleted.`);
      await refreshCurrentBatch();
    } catch (err) { alert(err.response?.data?.message || 'Failed to delete student'); }
  };

  const handleBulkDeleteStudents = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedStudentIds.length} selected student(s)? This cannot be undone.`)) return;
    try {
      await Promise.all(selectedStudentIds.map((id) => axios.delete(`${API}/users/${id}`, cfg())));
      alert(`Successfully deleted ${selectedStudentIds.length} student(s)!`);
      await refreshCurrentBatch();
    } catch (err) { alert(err.response?.data?.message || 'Failed to delete some students'); await refreshCurrentBatch(); }
  };

  const handleSelectAll = (e) => {
    if (!students?.students) return;
    if (e.target.checked) setSelectedStudentIds(students.students.map((s) => s._id));
    else setSelectedStudentIds([]);
  };

  const handleSelectOne = (id) => {
    setSelectedStudentIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const confirmMoveBatch = async () => {
    if (!targetBatchId) return alert('Please select an ongoing batch from the dropdown.');
    const oldBatchId = (!batch || batch._id === 'unassigned') ? '000000000000000000000000' : batch._id;
    try {
      if (movingStudent === 'BULK') {
        await axios.put(`${API}/staff/batches/bulk-change-student`, { studentIds: selectedStudentIds, oldBatchId, newBatchId: targetBatchId }, cfg());
        alert(`Successfully assigned ${selectedStudentIds.length} student(s) to the batch!`);
      } else {
        await axios.put(`${API}/staff/batches/change-student`, { studentId: movingStudent._id, oldBatchId, newBatchId: targetBatchId }, cfg());
        alert(`${movingStudent.name} has been added to the batch!`);
      }
      setMovingStudent(null);
      setTargetBatchId('');
      await refreshCurrentBatch();
    } catch (err) { alert(err.response?.data?.message || 'Failed to assign student(s) to batch'); }
  };

  const heading = title ? <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">{title}</h1> : null;

  // ---------------- STUDENT PAGE ----------------
  if (studentView) {
    if (studentView.loading) return <p className={`p-10 text-center text-lg ${muted}`}>Loading student history...</p>;
    const d = studentView.data;
    const s = d.student;
    const totalAttended = d.batches.reduce((n, b) => n + b.attended, 0);

    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        {heading}
        <BackButton onClick={() => setStudentView(null)}>Back to {batch ? batch.subject : 'batches'}</BackButton>

        <div className="glass-panel p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <img src={s.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="DP" className="w-24 h-24 rounded-[1.5rem] object-cover border-4 border-white shadow-md" />
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">{s.name}</h2>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 bg-black/5 dark:bg-white/5 inline-block px-3 py-1 rounded-full">{s.email}</p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
                <span className="text-[10px] font-extrabold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
                  {s.highestQualification || 'N/A'} ({s.passingYear || '-'})
                </span>
                <span className="text-[10px] font-extrabold bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
                  {s.percentage ?? '-'}%
                </span>
                <span className="text-[10px] font-extrabold bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
                  {s.backlogs ?? 0} Backlogs
                </span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => handleDeleteStudent(s)}
              className="bg-red-500/10 hover:bg-red-600 text-red-700 hover:text-white border border-red-500/20 px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-sm shrink-0"
            >
              <FiTrash2 size={16} /> Delete Student
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Batches" value={d.batches.length} />
          <Stat label="Classes attended" value={totalAttended} />
          <Stat label="Marks Earned" value={`${d.assignments.summary.marks}/${d.assignments.summary.totalMarks}`} />
          <Stat label="Mocks Taken" value={d.mocks.count} />
        </div>

        <div className="glass-panel rounded-[2rem] overflow-hidden">
          <div className="p-5 border-b border-black/5 dark:border-white/5 bg-white/20 dark:bg-slate-800/20 font-extrabold text-gray-900 dark:text-white text-lg">Batch Enrollment</div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/5 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                <tr><th className="p-4">Batch</th><th className="p-4">Trainer</th><th className="p-4">Joined</th><th className="p-4">Attendance</th></tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {d.batches.length === 0 && <tr><td colSpan="4" className={`p-10 text-center ${muted} text-lg`}>Not in any batch yet.</td></tr>}
                {d.batches.map((b) => (
                  <tr key={b._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="font-extrabold text-base text-gray-900 dark:text-white">{b.subject}</p>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold uppercase mt-0.5">{b.batchCode}</p>
                    </td>
                    <td className="p-4 font-semibold text-gray-600 dark:text-gray-300">{b.trainerName}</td>
                    <td className="p-4 text-xs font-medium text-gray-500 dark:text-gray-400">{fmtDate(b.joinedAt)}</td>
                    <td className="p-4 font-extrabold text-gray-800 dark:text-gray-200">{b.attended} <span className="text-xs text-gray-400 font-medium">/ {b.totalClasses} classes</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel rounded-[2rem] overflow-hidden">
          <div className="p-5 border-b border-black/5 dark:border-white/5 bg-white/20 dark:bg-slate-800/20 font-extrabold text-gray-900 dark:text-white text-lg">Assignments</div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/5 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                <tr><th className="p-4">Assignment</th><th className="p-4">Answered</th><th className="p-4">Marks</th><th className="p-4">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {d.assignments.list.length === 0 && <tr><td colSpan="4" className={`p-10 text-center ${muted} text-lg`}>No assignments yet.</td></tr>}
                {d.assignments.list.map((a) => {
                  const done = a.totalQuestions > 0 && a.answered >= a.totalQuestions;
                  return (
                    <tr key={a._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="p-4">
                         <p className="font-extrabold text-base text-gray-900 dark:text-white">{a.title}</p>
                         <p className="text-[10px] text-gray-500 font-extrabold uppercase mt-0.5">{a.level}</p>
                      </td>
                      <td className="p-4 font-extrabold text-gray-800 dark:text-gray-200">{a.answered} <span className="text-xs text-gray-400 font-medium">/ {a.totalQuestions}</span></td>
                      <td className="p-4 font-extrabold text-green-600 dark:text-green-400">{a.marks} <span className="text-xs text-gray-400 font-medium">/ {a.totalMarks}</span></td>
                      <td className="p-4 text-[11px] font-extrabold uppercase tracking-wider">
                        {done ? <span className="bg-green-500/10 text-green-700 border border-green-500/20 px-2 py-1 rounded-md">Completed</span> : a.answered > 0 ? <span className="bg-yellow-500/10 text-yellow-700 border border-yellow-500/20 px-2 py-1 rounded-md">In Progress</span> : <span className="bg-gray-500/10 text-gray-500 border border-gray-500/20 px-2 py-1 rounded-md">Not Started</span>}
                        {a.pending > 0 && <span className="block mt-2 text-[9px] text-orange-500 font-bold">{a.pending} awaiting review</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- ONE BATCH DETAILS ----------------
  if (batch) {
    const isUnassigned = batch._id === 'unassigned';
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {heading}
        <BackButton onClick={() => setBatch(null)}>Back to all batches</BackButton>

        <div className="glass-panel p-8 rounded-[2rem] shadow-sm">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1">{batch.subject}</h2>
          <p className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-lg w-fit mb-6">
            {batch.batchCode}
          </p>
          
          {!isUnassigned && (
            <div className="flex gap-3 flex-wrap bg-black/5 dark:bg-white/5 p-1.5 rounded-2xl w-fit border border-black/5 dark:border-white/5 shadow-inner">
              <button
                onClick={() => setTab('students')}
                className={`px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all ${tab === 'students' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-white/50 dark:border-slate-700/50' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'}`}
              >
                Students List
              </button>
              
              <button
                onClick={showMatrix}
                className={`px-5 py-2.5 rounded-xl text-sm font-extrabold flex items-center gap-2 transition-all ${tab === 'matrix' ? 'bg-white dark:bg-slate-800 text-green-600 dark:text-green-400 shadow-sm border border-white/50 dark:border-slate-700/50' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'}`}
              >
                <FiCheckSquare size={16} /> Attendance Matrix
              </button>

              <button
                onClick={showMocks}
                className={`px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all ${tab === 'mocks' ? 'bg-white dark:bg-slate-800 text-yellow-600 dark:text-yellow-400 shadow-sm border border-white/50 dark:border-slate-700/50' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'}`}
              >
                Mock History
              </button>
            </div>
          )}
        </div>

        {isAdmin && tab === 'students' && selectedStudentIds.length > 0 && (
          <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between shadow-lg border-blue-500/30 dark:border-blue-400/30 gap-4 animate-fade-in bg-blue-50/80 dark:bg-blue-900/20">
            <span className="text-blue-800 dark:text-blue-300 font-extrabold text-sm pl-2">
              {selectedStudentIds.length} student(s) selected
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => { setTargetBatchId(''); setMovingStudent('BULK'); }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all"
              >
                {isUnassigned ? 'Assign Selected to Batch' : 'Move Selected to Batch'}
              </button>
              <button
                onClick={handleBulkDeleteStudents}
                className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
              >
                <FiTrash2 size={16} /> Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* 1. STUDENTS TAB */}
        {tab === 'students' && (
          <div className="glass-panel rounded-[2rem] overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/5 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  <tr>
                    {isAdmin && (
                      <th className="p-4 w-10">
                        <input
                          type="checkbox"
                          className="w-4 h-4 cursor-pointer accent-blue-600 rounded"
                          checked={students?.students?.length > 0 && selectedStudentIds.length === students.students.length}
                          onChange={handleSelectAll}
                        />
                      </th>
                    )}
                    <th className="p-5">Student</th>
                    {!isUnassigned && <th className="p-5">Attendance</th>}
                    <th className="p-5">Assignments</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {!students ? <tr><td colSpan="5" className={`p-10 text-center text-lg ${muted}`}>Loading...</td></tr>
                  : students.students.length === 0 ? <tr><td colSpan="5" className={`p-10 text-center text-lg ${muted}`}>No students here.</td></tr>
                  : students.students.map((s) => (
                    <tr key={s._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                      {isAdmin && (
                        <td className="p-5">
                          <input
                            type="checkbox"
                            className="w-4 h-4 cursor-pointer accent-blue-600 rounded"
                            checked={selectedStudentIds.includes(s._id)}
                            onChange={() => handleSelectOne(s._id)}
                          />
                        </td>
                      )}
                      <td className="p-5 flex items-center gap-4">
                        <img 
                          src={s.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                          alt="DP" 
                          className="w-12 h-12 rounded-[1rem] object-cover border-2 border-white/60 shadow-sm"
                        />
                        <div>
                          <div className="font-extrabold text-base text-gray-900 dark:text-white">{s.name}</div>
                          <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">{s.email}</div>
                        </div>
                      </td>
                      {!isUnassigned && (
                        <td className="p-5 font-extrabold text-gray-800 dark:text-gray-200 text-lg">
                          {s.attended} <span className="text-xs text-gray-400 font-medium">/ {students.totalClasses}</span>
                        </td>
                      )}
                      <td className="p-5 font-extrabold text-gray-800 dark:text-gray-200">
                        {s.assignmentsAnswered} <span className="text-xs text-gray-400 font-medium">answered</span>
                        {s.assignmentsPending > 0 && <span className="bg-orange-500/10 text-orange-600 border border-orange-500/20 px-2 py-1 rounded-md text-[10px] ml-2 uppercase tracking-wider">{s.assignmentsPending} pending</span>}
                      </td>
                      <td className="p-5">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => openStudent(s._id)} className="glass-button text-blue-600 dark:text-blue-400 font-extrabold text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition">
                            History
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => { setTargetBatchId(''); setMovingStudent(s); }}
                                className="bg-orange-500/10 hover:bg-orange-500 text-orange-600 hover:text-white border border-orange-500/20 px-3 py-1.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider transition-all"
                              >
                                {isUnassigned ? 'Assign' : 'Change'}
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(s)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 dark:text-red-400 bg-red-500/10 hover:bg-red-600 hover:text-white border border-red-500/20 transition-all shadow-sm opacity-0 group-hover:opacity-100"
                                title="Delete Student"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. ATTENDANCE CALENDAR MATRIX TAB */}
        {tab === 'matrix' && (
          <div className="glass-panel rounded-[2rem] overflow-hidden">
            {!matrixData ? (
              <p className={`p-10 text-center text-lg ${muted}`}>Loading calendar grid...</p>
            ) : matrixData.sessions.length === 0 ? (
              <p className={`p-10 text-center text-lg ${muted}`}>No sessions (classes) have been held yet.</p>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/5">
                    <tr>
                      <th className="p-5 font-extrabold text-gray-700 dark:text-gray-300 sticky left-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10 border-r border-black/5 dark:border-white/5 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] uppercase tracking-widest text-[11px]">Student</th>
                      <th className="p-5 font-extrabold text-blue-600 dark:text-blue-400 text-center bg-blue-500/10 border-r border-blue-500/10 uppercase tracking-widest text-[11px]">Total %</th>
                      {matrixData.sessions.map((sess, idx) => (
                        <th key={sess._id} className="p-4 font-bold text-gray-600 dark:text-gray-400 text-center border-r border-black/5 dark:border-white/5" title={sess.date}>
                          <div className="text-[11px] uppercase tracking-wider mb-1">S{idx + 1}</div>
                          <div className="text-[10px] text-gray-400 font-medium">{fmtDay(sess.date)}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {matrixData.students.map(s => {
                      const totalSess = matrixData.sessions.length;
                      let presentCount = 0;
                      matrixData.sessions.forEach(sess => {
                        if (matrixData.attMap[`${s._id}_${sess._id}`]) presentCount++;
                      });
                      const percentage = totalSess > 0 ? Math.round((presentCount / totalSess) * 100) : 0;

                      return (
                        <tr key={s._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <td className="p-4 sticky left-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-r border-black/5 dark:border-white/5 flex items-center gap-3 w-56 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            <img src={s.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-10 h-10 rounded-[10px] object-cover border border-white/60 shadow-sm" alt="dp" />
                            <div className="truncate">
                              <p className="font-extrabold text-gray-800 dark:text-white truncate">{s.name}</p>
                              <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 truncate mt-0.5">{s.email}</p>
                            </div>
                          </td>
                          
                          <td className="p-4 text-center bg-blue-500/5 border-r border-blue-500/10">
                            <div className={`text-lg font-extrabold ${percentage >= 75 ? 'text-green-600 dark:text-green-400' : percentage >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                              {percentage}%
                            </div>
                            <div className="text-[10px] font-extrabold text-gray-500">{presentCount}/{totalSess}</div>
                          </td>

                          {matrixData.sessions.map(sess => {
                            const isPresent = !!matrixData.attMap[`${s._id}_${sess._id}`];
                            return (
                              <td key={sess._id} className="p-4 text-center border-r border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer" onClick={() => toggleAttendance(sess._id, s._id, isPresent)}>
                                <input
                                  type="checkbox"
                                  className="w-5 h-5 cursor-pointer accent-green-600 rounded-md pointer-events-none"
                                  checked={isPresent}
                                  readOnly
                                  title={`Mark ${isPresent ? 'Absent' : 'Present'}`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. MOCKS TAB */}
        {tab === 'mocks' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            {!mocks ? (
              <p className={`p-10 text-center text-lg ${muted}`}>Loading mock history...</p>
            ) : (
              <>
                <div className="glass-panel p-6 rounded-[2rem] flex items-center justify-between mb-2">
                  <h3 className="font-extrabold text-gray-900 dark:text-white text-xl">Recorded Mocks</h3>
                  <span className="text-sm font-extrabold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg shadow-sm">
                    {mocks.totalMocks} Total
                  </span>
                </div>
                {mocks.rounds.length === 0 && <p className={`p-10 glass-panel rounded-[2rem] text-center text-lg ${muted}`}>No mock ratings have been given for this batch yet.</p>}
                
                {mocks.rounds.map((r, i) => {
                  const open = openRound === i;
                  return (
                    <div key={r.date} className="glass-panel p-6 rounded-[2rem] shadow-sm">
                      <button type="button" onClick={() => setOpenRound(open ? null : i)} className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 text-left group">
                        <div>
                          <p className="font-extrabold text-xl text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">Mock {mocks.totalMocks - i}: {fmtDay(r.date)}</p>
                          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">{r.count} rating{r.count > 1 ? 's' : ''} given</p>
                        </div>
                        <div className="flex items-center gap-4 text-gray-800 dark:text-gray-200 shrink-0">
                          <Scores t={r.avgTechnical} c={r.avgCommunication} co={r.avgCoding} />
                          <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center transition-transform duration-300">
                             {open ? <FiChevronUp /> : <FiChevronDown />}
                          </div>
                        </div>
                      </button>

                      {open && (
                        <div className="mt-6 pt-2 border-t border-black/5 dark:border-white/5 space-y-3">
                          {r.ratings.map((x) => (
                            <div key={x._id} className="p-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-black/10 transition-colors">
                              <div className="min-w-0">
                                <p className="font-extrabold text-gray-900 dark:text-white truncate">{x.studentName}</p>
                                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 truncate">{x.studentEmail}</p>
                              </div>
                              <div className="flex flex-col items-end shrink-0">
                                <Scores t={`${x.technicalRating}/10`} c={`${x.communicationRating}/10`} co={`${x.codingRating}/10`} />
                                {x.remarks && <p className="text-xs font-medium italic mt-2 text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-black/20 p-2 rounded-lg border border-white/50 dark:border-slate-700 max-w-sm text-right leading-relaxed">"{x.remarks}"</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // ---------------- ALL BATCHES ----------------
  if (loading) return <div className="h-[50vh] flex items-center justify-center text-lg font-bold text-gray-500">Loading batches...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {heading}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isAdmin && list.unassignedCount > 0 && (
          <button
            type="button"
            onClick={() => openBatch({ _id: 'unassigned', subject: 'Students not in any batch yet', batchCode: 'Unassigned' })}
            className="text-left rounded-[2rem] border-2 border-dashed border-gray-300 dark:border-slate-600 bg-black/5 dark:bg-white/5 p-8 hover:bg-black/10 dark:hover:bg-white/10 transition-colors group flex flex-col justify-center"
          >
            <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"><FiUsers size={28} /></div>
            <p className="font-extrabold text-xl text-gray-900 dark:text-white">Unassigned Students</p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">Click to assign these students to ongoing batches or remove them.</p>
            <p className="text-4xl font-extrabold text-gray-900 dark:text-white mt-4">{list.unassignedCount}</p>
          </button>
        )}

        {list.batches.length === 0 && <div className="col-span-3 glass-panel p-16 rounded-[2rem] text-center"><p className="text-gray-500 dark:text-gray-400 font-medium text-lg">No batches created yet.</p></div>}
        
        {list.batches.map((b) => (
          <button key={b._id} type="button" onClick={() => openBatch(b)} className="glass-panel p-8 rounded-[2rem] text-left hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between h-full shadow-lg">
            <div>
              <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg tracking-wider uppercase mb-4 inline-block shadow-sm">
                {b.batchCode}
              </span>
              <p className="font-extrabold text-2xl text-gray-900 dark:text-white leading-tight tracking-tight mb-2 group-hover:text-blue-600 transition-colors">{b.subject}</p>
              {isAdmin && b.trainerName && <p className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 bg-black/5 dark:bg-white/5 w-fit px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5"><span className="text-purple-500">Trainer:</span> {b.trainerName}</p>}
            </div>

            <div className="grid grid-cols-3 gap-3 mt-8 pt-6 border-t border-black/5 dark:border-white/5 text-center">
              <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm">
                <FiUsers className="mx-auto text-blue-500 mb-2" size={20} />
                <p className="font-extrabold text-xl text-gray-900 dark:text-white leading-none mb-1">{b.studentCount}</p>
                <p className="text-[9px] uppercase font-extrabold tracking-widest text-gray-400">Students</p>
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm">
                <FiClock className="mx-auto text-purple-500 mb-2" size={20} />
                <p className="font-extrabold text-xl text-gray-900 dark:text-white leading-none mb-1">{b.classesTaken}</p>
                <p className="text-[9px] uppercase font-extrabold tracking-widest text-gray-400">Classes</p>
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm">
                <FiStar className="mx-auto text-yellow-500 mb-2" size={20} />
                <p className="font-extrabold text-xl text-gray-900 dark:text-white leading-none mb-1">{b.mocksTaken}</p>
                <p className="text-[9px] uppercase font-extrabold tracking-widest text-gray-400">Mocks</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* MOVE BATCH MODAL (Frosted Glass) */}
      {movingStudent && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-[2.5rem] shadow-2xl w-full max-w-md">
            <div className="relative p-8 border-b border-black/5 dark:border-white/5">
              <button onClick={() => setMovingStudent(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-black/5 p-2 rounded-full"><FiX size={18} /></button>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {movingStudent === "BULK" ? "Bulk Move Students" : "Change Student Batch"}
              </h2>
              
              <div className="flex items-center gap-4 mt-6 p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 shadow-inner">
                {movingStudent === "BULK" ? (
                  <div className="flex items-center justify-center w-14 h-14 bg-blue-500/20 text-blue-600 rounded-2xl border border-blue-500/20"><FiUsers size={28} /></div>
                ) : (
                  <img src={movingStudent.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="dp" className="w-14 h-14 rounded-2xl object-cover shadow-sm bg-white border border-gray-200" />
                )}
                <div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-widest mb-0.5">Moving</p>
                  <p className="font-extrabold text-lg text-gray-900 dark:text-white">{movingStudent === "BULK" ? `${selectedStudentIds.length} Selected Students` : movingStudent.name}</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Select Target Batch</label>
                <select id="new-batch-select" className="apple-input cursor-pointer">
                  <option value="">-- Choose a Batch --</option>
                  {list.batches.filter((b) => b._id !== (batch?._id || '')).map((b) => (
                    <option key={b._id} value={b._id}>{b.subject} ({b.batchCode})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={confirmMoveBatch} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-extrabold shadow-lg shadow-blue-500/30 hover:scale-[0.98] transition-transform text-[15px]">
                  Confirm Move
                </button>
                <button onClick={() => setMovingStudent(null)} className="flex-1 glass-button py-3.5 rounded-xl font-extrabold text-gray-700 dark:text-gray-300 text-[15px]">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffBatchTracker;