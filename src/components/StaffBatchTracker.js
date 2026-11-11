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
  FiX,
  FiCheckCircle,
  FiSmartphone,
  FiRotateCcw,
  FiTarget
} from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const fmtDay = (d) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

const labelCls = "block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 pl-1";
const inputCls = "apple-input w-full font-bold";

const Stat = ({ label, value }) => (
  <div className="bg-gray-50 dark:bg-slate-800/80 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 p-6 text-center shadow-sm flex flex-col justify-center items-center hover:-translate-y-1 transition-transform">
    <p className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white leading-none tracking-tight">{value}</p>
    <p className="text-[10px] uppercase font-extrabold tracking-widest text-gray-500 dark:text-gray-400 mt-3">{label}</p>
  </div>
);

const Scores = ({ t, c, co }) => (
  <span className="text-[11px] font-extrabold tracking-wider bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center gap-2.5">
    <span>Tech <span className="text-blue-600 dark:text-blue-400">{t}</span></span>
    <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">|</span> 
    <span>Comm <span className="text-purple-600 dark:text-purple-400">{c}</span></span>
    <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">|</span> 
    <span>Code <span className="text-green-600 dark:text-green-400">{co}</span></span>
  </span>
);

const BackButton = ({ onClick, children }) => (
  <button type="button" onClick={onClick} className="glass-button flex items-center gap-2 text-[13px] uppercase tracking-wider font-extrabold text-blue-600 dark:text-blue-400 px-5 py-3 rounded-xl w-fit shadow-sm border border-gray-200 dark:border-slate-700 mb-6 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
    <FiArrowLeft size={16} /> {children}
  </button>
);

const StaffBatchTracker = ({ title }) => {
  const role = localStorage.getItem('role');
  const isAdmin = ['admin', 'superadmin'].includes(role);
  const isSuperAdmin = role === 'superadmin';
  const canApproveDevice = ['admin', 'superadmin', 'trainer'].includes(role);

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

  // ✅ NEW: Super Admin / Admin: Toggle Batch Ongoing / Completed
  const handleToggleBatchStatus = async (e, targetBatch) => {
    if (e) e.stopPropagation();
    const nextStateLabel = targetBatch.isActive === false ? 'Ongoing' : 'Completed';
    if (!window.confirm(`Mark "${targetBatch.subject} (${targetBatch.batchCode})" as ${nextStateLabel}?`)) return;
    try {
      const res = await axios.put(`${API}/batches/${targetBatch._id}/status`, {}, cfg());
      const updatedIsActive = res.data.isActive;
      setList((prev) => ({
        ...prev,
        batches: prev.batches.map((item) =>
          item._id === targetBatch._id ? { ...item, isActive: updatedIsActive } : item
        )
      }));
      if (batch && batch._id === targetBatch._id) {
        setBatch((prev) => ({ ...prev, isActive: updatedIsActive }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update batch status');
    }
  };

  // ✅ NEW: Trainer / Admin / SuperAdmin: Approve Single Student Device
  const handleApproveDevice = async (s) => {
    try {
      const res = await axios.put(`${API}/users/${s._id}/approve-device`, {}, cfg());
      alert(res.data.message || `Approved new device for ${s.name}`);
      await refreshCurrentBatch();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve device');
    }
  };

  // ✅ NEW: Trainer / Admin / SuperAdmin: Bulk Approve Devices
  const handleBulkApproveDevices = async () => {
    try {
      const res = await axios.put(`${API}/users/bulk-approve-device`, { userIds: selectedStudentIds }, cfg());
      alert(res.data.message || 'Approved pending devices for selected students!');
      await refreshCurrentBatch();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to bulk approve devices');
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

  const heading = title ? <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-8 tracking-tight leading-tight">{title}</h1> : null;

  // ---------------- STUDENT PAGE ----------------
  if (studentView) {
    if (studentView.loading) return <div className="h-[50vh] flex items-center justify-center font-bold text-gray-500 animate-pulse text-lg">Loading student history...</div>;
    const d = studentView.data;
    const s = d.student;
    const totalAttended = d.batches.reduce((n, b) => n + b.attended, 0);

    return (
      <div className="space-y-8 max-w-6xl mx-auto pb-16 animate-fade-in">
        {heading}
        <BackButton onClick={() => setStudentView(null)}>Back to {batch ? batch.subject : 'batches'}</BackButton>

        <div className="glass-panel bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left min-w-0">
            <img src={s.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="DP" className="w-24 h-24 rounded-[2rem] object-cover border-2 border-gray-200 dark:border-slate-700 shadow-sm bg-white shrink-0" />
            <div className="min-w-0">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2 truncate">{s.name}</h2>
              <p className="text-[13px] font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 inline-block px-4 py-1.5 rounded-xl shadow-sm truncate">{s.email}</p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-5 text-[10px] font-extrabold uppercase tracking-widest">
                <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-3.5 py-1.5 rounded-lg shadow-sm">
                  {s.highestQualification || 'N/A'} ({s.passingYear || '-'})
                </span>
                <span className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 px-3.5 py-1.5 rounded-lg shadow-sm">
                  {s.percentage ?? '-'}%
                </span>
                <span className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 px-3.5 py-1.5 rounded-lg shadow-sm">
                  {s.backlogs ?? 0} Backlogs
                </span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => handleDeleteStudent(s)}
              className="bg-red-50 dark:bg-red-900/20 hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white border border-red-200 dark:border-red-800/50 px-6 py-4 rounded-xl text-[13px] uppercase tracking-wider font-extrabold flex items-center justify-center gap-2 transition-all shadow-sm w-full lg:w-auto shrink-0"
            >
              <FiTrash2 size={16} /> Delete Student
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Stat label="Batches" value={d.batches.length} />
          <Stat label="Classes attended" value={totalAttended} />
          <Stat label="Marks Earned" value={`${d.assignments.summary.marks}/${d.assignments.summary.totalMarks}`} />
          <Stat label="Mocks Taken" value={d.mocks.count} />
        </div>

        <div className="glass-panel bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="p-6 md:p-8 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80 font-black text-gray-900 dark:text-white text-xl tracking-tight">Batch Enrollment</div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-[15px] whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                <tr><th className="p-6">Batch</th><th className="p-6">Trainer</th><th className="p-6">Joined</th><th className="p-6">Attendance</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {d.batches.length === 0 && <tr><td colSpan="4" className="p-20 text-center text-gray-500 font-bold text-xl">Not in any batch yet.</td></tr>}
                {d.batches.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-6">
                      <p className="font-extrabold text-gray-900 dark:text-white tracking-tight">{b.subject}</p>
                      <p className="text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-lg font-extrabold uppercase mt-2 inline-block shadow-sm tracking-wider">{b.batchCode}</p>
                    </td>
                    <td className="p-6 font-extrabold text-gray-700 dark:text-gray-300">{b.trainerName}</td>
                    <td className="p-6 text-[13px] font-medium text-gray-500 dark:text-gray-400">{fmtDate(b.joinedAt)}</td>
                    <td className="p-6 font-black text-2xl text-gray-900 dark:text-white">{b.attended} <span className="text-sm text-gray-500 font-bold">/ {b.totalClasses} classes</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="p-6 md:p-8 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80 font-black text-gray-900 dark:text-white text-xl tracking-tight">Assignments</div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-[15px] whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                <tr><th className="p-6">Assignment</th><th className="p-6 text-center">Answered</th><th className="p-6 text-center">Marks</th><th className="p-6">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {d.assignments.list.length === 0 && <tr><td colSpan="4" className="p-20 text-center text-gray-500 font-bold text-xl">No assignments yet.</td></tr>}
                {d.assignments.list.map((a) => {
                  const done = a.totalQuestions > 0 && a.answered >= a.totalQuestions;
                  return (
                    <tr key={a._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-6">
                         <p className="font-extrabold text-gray-900 dark:text-white tracking-tight">{a.title}</p>
                         <p className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-3 py-1.5 rounded-lg font-extrabold uppercase mt-2 inline-block shadow-sm tracking-wider">{a.level}</p>
                      </td>
                      <td className="p-6 text-center font-black text-2xl text-gray-900 dark:text-white">{a.answered} <span className="text-sm text-gray-500 font-bold">/ {a.totalQuestions}</span></td>
                      <td className="p-6 text-center font-black text-2xl text-green-600 dark:text-green-400">{a.marks} <span className="text-sm text-green-700/50 dark:text-green-400/50 font-bold">/ {a.totalMarks}</span></td>
                      <td className="p-6">
                        {done ? <span className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 px-4 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-widest shadow-sm inline-block">Completed</span> : a.answered > 0 ? <span className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-800 px-4 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-widest shadow-sm inline-block">In Progress</span> : <span className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700 px-4 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-widest shadow-sm inline-block">Not Started</span>}
                        {a.pending > 0 && <span className="block mt-3 text-[10px] text-orange-600 dark:text-orange-400 font-extrabold uppercase tracking-widest bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 w-fit px-3 py-1.5 rounded-lg shadow-sm">{a.pending} awaiting review</span>}
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
      <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-fade-in">
        {heading}
        <BackButton onClick={() => setBatch(null)}>Back to all batches</BackButton>

        <div className="glass-panel bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 border border-gray-200 dark:border-slate-700">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">{batch.subject}</h2>
              {!isUnassigned && (
                <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-widest border shadow-sm ${
                  batch.isActive === false
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                    : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                }`}>
                  {batch.isActive === false ? 'Completed' : 'Ongoing'}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-3.5 py-1.5 rounded-lg shadow-sm">
                {batch.batchCode}
              </span>
              {isAdmin && !isUnassigned && (
                <button
                  type="button"
                  onClick={(e) => handleToggleBatchStatus(e, batch)}
                  className={`text-[11px] font-extrabold uppercase tracking-wider px-4 py-1.5 rounded-lg border shadow-sm flex items-center gap-1.5 transition-colors ${
                    batch.isActive === false
                      ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-600 hover:text-white'
                      : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-600 hover:text-white'
                  }`}
                >
                  {batch.isActive === false ? <><FiRotateCcw size={13} /> Reopen Batch</> : <><FiCheckCircle size={13} /> Mark Batch Completed</>}
                </button>
              )}
            </div>
          </div>
          
          {!isUnassigned && (
            <div className="flex flex-col sm:flex-row gap-3 bg-gray-100 dark:bg-slate-800 p-2 rounded-[1.2rem] border border-gray-200 dark:border-slate-700 shadow-inner w-full md:w-auto">
              <button
                onClick={() => setTab('students')}
                className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[13px] font-extrabold transition-all duration-300 flex items-center justify-center ${tab === 'students' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-slate-700' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-transparent'}`}
              >
                Students List
              </button>
              
              <button
                onClick={showMatrix}
                className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[13px] font-extrabold flex items-center justify-center gap-2 transition-all duration-300 ${tab === 'matrix' ? 'bg-white dark:bg-slate-900 text-green-600 dark:text-green-400 shadow-sm border border-gray-200 dark:border-slate-700' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-transparent'}`}
              >
                <FiCheckSquare size={16} /> Attendance Matrix
              </button>

              <button
                onClick={showMocks}
                className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[13px] font-extrabold transition-all duration-300 flex items-center justify-center ${tab === 'mocks' ? 'bg-white dark:bg-slate-900 text-yellow-600 dark:text-yellow-500 shadow-sm border border-gray-200 dark:border-slate-700' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-transparent'}`}
              >
                Mock History
              </button>
            </div>
          )}
        </div>

        {canApproveDevice && tab === 'students' && selectedStudentIds.length > 0 && (
          <div className="glass-panel p-6 md:p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between shadow-sm border border-blue-200 dark:border-blue-800/50 gap-6 animate-fade-in bg-blue-50 dark:bg-blue-900/20">
            <span className="text-blue-800 dark:text-blue-300 font-black text-xl tracking-tight">
              {selectedStudentIds.length} student(s) selected
            </span>
            <div className="flex flex-col sm:flex-row flex-wrap w-full md:w-auto gap-4">
              <button
                onClick={handleBulkApproveDevices}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3.5 rounded-xl text-[13px] uppercase tracking-wider font-extrabold shadow-lg shadow-emerald-500/30 hover:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                <FiSmartphone size={16} /> Approve Selected Devices
              </button>
              {isAdmin && (
                <>
                  <button
                    onClick={() => { setTargetBatchId(''); setMovingStudent('BULK'); }}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3.5 rounded-xl text-[13px] uppercase tracking-wider font-extrabold shadow-lg shadow-blue-500/30 hover:scale-[0.98] transition-transform text-center"
                  >
                    {isUnassigned ? 'Assign to Batch' : 'Move to Batch'}
                  </button>
                  <button
                    onClick={handleBulkDeleteStudents}
                    className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3.5 rounded-xl text-[13px] uppercase tracking-wider font-extrabold shadow-lg shadow-red-500/30 hover:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                  >
                    <FiTrash2 size={16} /> Delete
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* 1. STUDENTS TAB */}
        {tab === 'students' && (
          <div className="glass-panel bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-[15px] whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  <tr>
                    {canApproveDevice && (
                      <th className="p-6 w-12 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 cursor-pointer accent-blue-600 rounded"
                          checked={students?.students?.length > 0 && selectedStudentIds.length === students.students.length}
                          onChange={handleSelectAll}
                        />
                      </th>
                    )}
                    <th className="p-6">Student</th>
                    {!isUnassigned && <th className="p-6 text-center">Attendance</th>}
                    <th className="p-6 text-center">Assignments</th>
                    <th className="p-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {!students ? <tr><td colSpan="5" className="p-20 text-center text-xl font-bold text-gray-500 animate-pulse">Loading...</td></tr>
                  : students.students.length === 0 ? <tr><td colSpan="5" className="p-20 text-center text-xl font-bold text-gray-500">No students here.</td></tr>
                  : students.students.map((s) => {
                    const hasDeviceRequest = Boolean(s.desktopChangeRequested || s.mobileChangeRequested);
                    return (
                      <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                        {canApproveDevice && (
                          <td className="p-6 text-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 cursor-pointer accent-blue-600 rounded"
                              checked={selectedStudentIds.includes(s._id)}
                              onChange={() => handleSelectOne(s._id)}
                            />
                          </td>
                        )}
                        <td className="p-6 flex items-center gap-5">
                          <img 
                            src={s.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                            alt="DP" 
                            className="w-14 h-14 rounded-[1.2rem] object-cover border border-gray-200 dark:border-slate-700 shadow-sm bg-white"
                          />
                          <div>
                            <div className="font-black text-[17px] text-gray-900 dark:text-white tracking-tight mb-1 flex items-center gap-2">
                              {s.name}
                              {s.desktopChangeRequested && (
                                <span className="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                  Laptop Req
                                </span>
                              )}
                              {s.mobileChangeRequested && (
                                <span className="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                                  Mobile Req
                                </span>
                              )}
                            </div>
                            <div className="text-[13px] font-bold text-gray-500 dark:text-gray-400">{s.email}</div>
                          </div>
                        </td>
                        {!isUnassigned && (
                          <td className="p-6 text-center font-black text-gray-900 dark:text-white text-2xl">
                            {s.attended} <span className="text-sm text-gray-500 font-bold">/ {students.totalClasses}</span>
                          </td>
                        )}
                        <td className="p-6 text-center font-black text-gray-900 dark:text-white text-xl">
                          {s.assignmentsAnswered} <span className="text-sm text-gray-500 font-bold">answered</span>
                          {s.assignmentsPending > 0 && <span className="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50 px-3 py-1.5 rounded-lg text-[10px] ml-3 uppercase tracking-widest shadow-sm block sm:inline-block mt-2 sm:mt-0 w-fit mx-auto">{s.assignmentsPending} pending</span>}
                        </td>
                        <td className="p-6">
                          <div className="flex items-center justify-end gap-3">
                            {canApproveDevice && hasDeviceRequest && (
                              <button
                                onClick={() => handleApproveDevice(s)}
                                className="bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-200 dark:border-emerald-800 px-4 py-2.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-1.5"
                                title="Approve Pending Device Change"
                              >
                                <FiSmartphone size={14} /> Approve Device
                              </button>
                            )}
                            <button onClick={() => openStudent(s._id)} className="glass-button text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 font-extrabold text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-xl transition-colors border border-gray-200 dark:border-slate-700 shadow-sm">
                              History
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => { setTargetBatchId(''); setMovingStudent(s); }}
                                  className="bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-600 text-orange-600 dark:text-orange-400 hover:text-white border border-orange-200 dark:border-orange-800 px-4 py-2.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-colors shadow-sm"
                                >
                                  {isUnassigned ? 'Assign' : 'Change'}
                                </button>
                                <button
                                  onClick={() => handleDeleteStudent(s)}
                                  className="w-10 h-10 rounded-xl flex items-center justify-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-600 hover:text-white border border-red-200 dark:border-red-800 transition-colors shadow-sm opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                                  title="Delete Student"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. ATTENDANCE CALENDAR MATRIX TAB */}
        {tab === 'matrix' && (
          <div className="glass-panel bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-200 dark:border-slate-700">
            {!matrixData ? (
              <p className="p-20 text-center text-xl font-bold text-gray-500 animate-pulse">Loading calendar grid...</p>
            ) : matrixData.sessions.length === 0 ? (
              <p className="p-20 text-center text-xl font-bold text-gray-500">No sessions (classes) have been held yet.</p>
            ) : (
              <div className="overflow-x-auto custom-scrollbar bg-white dark:bg-slate-900">
                <table className="w-full text-left text-[15px] whitespace-nowrap">
                  <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                    <tr>
                      <th className="p-5 md:p-6 font-black text-gray-900 dark:text-white sticky left-0 bg-gray-50 dark:bg-slate-800 z-10 border-r border-gray-200 dark:border-slate-700 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)] uppercase tracking-widest text-[11px]">Student</th>
                      <th className="p-5 md:p-6 font-black text-blue-700 dark:text-blue-400 text-center bg-blue-50 dark:bg-blue-900/20 border-r border-blue-200 dark:border-blue-800 uppercase tracking-widest text-[11px]">Total %</th>
                      {matrixData.sessions.map((sess, idx) => (
                        <th key={sess._id} className="p-4 md:p-5 font-black text-gray-600 dark:text-gray-400 text-center border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900" title={sess.date}>
                          <div className="text-[13px] uppercase tracking-wider mb-2 text-gray-900 dark:text-white">S{idx + 1}</div>
                          <div className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">{fmtDay(sess.date)}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {matrixData.students.map(s => {
                      const totalSess = matrixData.sessions.length;
                      let presentCount = 0;
                      matrixData.sessions.forEach(sess => {
                        if (matrixData.attMap[`${s._id}_${sess._id}`]) presentCount++;
                      });
                      const percentage = totalSess > 0 ? Math.round((presentCount / totalSess) * 100) : 0;

                      return (
                        <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-5 sticky left-0 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex items-center gap-4 w-64 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)]">
                            <img src={s.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-12 h-12 rounded-[1rem] object-cover border border-gray-200 dark:border-slate-700 shadow-sm shrink-0 bg-white" alt="dp" />
                            <div className="truncate min-w-0 pr-2">
                              <p className="font-black text-[15px] text-gray-900 dark:text-white truncate tracking-tight">{s.name}</p>
                              <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate mt-1">{s.email}</p>
                            </div>
                          </td>
                          
                          <td className="p-5 text-center bg-blue-50/50 dark:bg-blue-900/10 border-r border-blue-200 dark:border-blue-900/30">
                            <div className={`text-2xl font-black mb-1.5 ${percentage >= 75 ? 'text-green-600 dark:text-green-400' : percentage >= 50 ? 'text-yellow-600 dark:text-yellow-500' : 'text-red-600 dark:text-red-400'}`}>
                              {percentage}%
                            </div>
                            <div className="text-[11px] font-extrabold text-gray-500">{presentCount}/{totalSess}</div>
                          </td>

                          {matrixData.sessions.map(sess => {
                            const isPresent = !!matrixData.attMap[`${s._id}_${sess._id}`];
                            return (
                              <td key={sess._id} className="p-5 text-center border-r border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => toggleAttendance(sess._id, s._id, isPresent)}>
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
          <div className="space-y-8 max-w-4xl mx-auto">
            {!mocks ? (
              <p className="p-20 text-center text-xl font-bold text-gray-500 animate-pulse">Loading mock history...</p>
            ) : (
              <>
                <div className="glass-panel bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] flex items-center justify-between shadow-sm border border-gray-200 dark:border-slate-700">
                  <h3 className="font-black text-gray-900 dark:text-white text-3xl tracking-tight">Recorded Mocks</h3>
                  <span className="text-[11px] font-extrabold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-4 py-2 rounded-xl shadow-sm uppercase tracking-wider">
                    {mocks.totalMocks} Total
                  </span>
                </div>
                {mocks.rounds.length === 0 && <p className="p-20 glass-panel bg-white dark:bg-slate-900 rounded-[2.5rem] text-center text-xl font-bold text-gray-500 shadow-sm border border-gray-200 dark:border-slate-700">No mock ratings have been given for this batch yet.</p>}
                
                {mocks.rounds.map((r, i) => {
                  const open = openRound === i;
                  return (
                    <div key={r.date} className="glass-panel bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-slate-700">
                      <button type="button" onClick={() => setOpenRound(open ? null : i)} className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-5 text-left group">
                        <div>
                          <p className="font-black text-2xl text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight mb-2">Mock {mocks.totalMocks - i}: {fmtDay(r.date)}</p>
                          <p className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mt-2 uppercase tracking-widest">{r.count} rating{r.count > 1 ? 's' : ''} given</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-gray-800 dark:text-gray-200 shrink-0 mt-2 sm:mt-0">
                          <Scores t={r.avgTechnical} c={r.avgCommunication} co={r.avgCoding} />
                          <div className="w-12 h-12 rounded-[1rem] bg-gray-100 dark:bg-slate-800 flex items-center justify-center transition-transform duration-300 border border-gray-200 dark:border-slate-700 shadow-sm text-gray-600 dark:text-gray-300">
                             {open ? <FiChevronUp size={22} /> : <FiChevronDown size={22} />}
                          </div>
                        </div>
                      </button>

                      {open && (
                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700 space-y-4">
                          {r.ratings.map((x) => (
                            <div key={x._id} className="p-6 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors shadow-sm">
                              <div className="min-w-0 pr-4">
                                <p className="font-black text-gray-900 dark:text-white truncate text-[17px] mb-1">{x.studentName}</p>
                                <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate mt-1">{x.studentEmail}</p>
                              </div>
                              <div className="flex flex-col md:items-end shrink-0 w-full md:w-auto mt-2 md:mt-0">
                                <Scores t={`${x.technicalRating}/10`} c={`${x.communicationRating}/10`} co={`${x.codingRating}/10`} />
                                {x.remarks && <p className="text-[13px] font-medium italic mt-4 text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-700 max-w-sm md:text-right leading-relaxed shadow-sm w-full">"{x.remarks}"</p>}
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
  if (loading) return <div className="h-[50vh] flex items-center justify-center text-xl font-bold text-gray-500 animate-pulse">Loading batches...</div>;

  const ongoingBatches = list.batches.filter((b) => b.isActive !== false);
  const completedBatches = list.batches.filter((b) => b.isActive === false);

  const renderBatchTile = (b) => {
    const isCompleted = b.isActive === false;
    return (
      <div
        key={b._id}
        onClick={() => openBatch(b)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && openBatch(b)}
        className="glass-panel bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] border border-gray-200 dark:border-slate-700 text-left hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between h-full shadow-sm hover:shadow-lg cursor-pointer"
      >
        <div>
          <div className="flex items-center justify-between gap-3 mb-5">
            <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-3.5 py-1.5 rounded-lg tracking-widest uppercase shadow-sm">
              {b.batchCode}
            </span>
            <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-widest border shadow-sm ${
              isCompleted
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700'
            }`}>
              {isCompleted ? 'Completed' : 'Ongoing'}
            </span>
          </div>

          <p className="font-black text-3xl text-gray-900 dark:text-white leading-tight tracking-tight mb-5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{b.subject}</p>
          {isAdmin && b.trainerName && (
            <p className="text-[11px] font-extrabold text-gray-600 dark:text-gray-300 flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800 w-fit px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm uppercase tracking-wider">
              <span className="text-purple-600 dark:text-purple-400">Trainer:</span> {b.trainerName}
            </p>
          )}
        </div>

        <div>
          <div className="grid grid-cols-3 gap-3 md:gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-slate-700 text-center">
            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-sm">
              <FiUsers className="mx-auto text-blue-500 mb-2.5" size={24} />
              <p className="font-black text-2xl text-gray-900 dark:text-white leading-none mb-1.5">{b.studentCount}</p>
              <p className="text-[9px] uppercase font-extrabold tracking-widest text-gray-500 dark:text-gray-400">Students</p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-sm">
              <FiClock className="mx-auto text-purple-500 mb-2.5" size={24} />
              <p className="font-black text-2xl text-gray-900 dark:text-white leading-none mb-1.5">{b.classesTaken}</p>
              <p className="text-[9px] uppercase font-extrabold tracking-widest text-gray-500 dark:text-gray-400">Classes</p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-sm">
              <FiStar className="mx-auto text-yellow-500 mb-2.5" size={24} />
              <p className="font-black text-2xl text-gray-900 dark:text-white leading-none mb-1.5">{b.mocksTaken}</p>
              <p className="text-[9px] uppercase font-extrabold tracking-widest text-gray-500 dark:text-gray-400">Mocks</p>
            </div>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={(e) => handleToggleBatchStatus(e, b)}
              className={`w-full mt-5 py-3 rounded-xl text-[11px] font-extrabold uppercase tracking-wider border shadow-sm flex items-center justify-center gap-2 transition-colors ${
                isCompleted
                  ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-600 hover:text-white'
                  : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-600 hover:text-white'
              }`}
            >
              {isCompleted ? <><FiRotateCcw size={14} /> Mark as Ongoing</> : <><FiCheckCircle size={14} /> Mark Batch Completed</>}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-16 animate-fade-in">
      {heading}

      {/* ONGOING BATCHES */}
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3 tracking-tight border-b border-gray-200 dark:border-slate-700 pb-4">
          <FiTarget className="text-blue-500" /> Ongoing Batches ({ongoingBatches.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isAdmin && list.unassignedCount > 0 && (
            <button
              type="button"
              onClick={() => openBatch({ _id: 'unassigned', subject: 'Students not in any batch yet', batchCode: 'Unassigned' })}
              className="text-left rounded-[2.5rem] border-2 border-dashed border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group flex flex-col justify-center shadow-sm p-10"
            >
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-800 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-sm"><FiUsers size={40} /></div>
              <p className="font-black text-3xl text-gray-900 dark:text-white tracking-tight leading-tight">Unassigned Students</p>
              <p className="text-[15px] font-medium text-gray-500 dark:text-gray-400 mt-3 leading-relaxed opacity-90">Click to assign these students to ongoing batches or remove them.</p>
              <p className="text-5xl font-black text-gray-900 dark:text-white mt-8">{list.unassignedCount}</p>
            </button>
          )}

          {ongoingBatches.length === 0 && (
            <div className="col-span-full glass-panel bg-white dark:bg-slate-900 p-16 rounded-[2.5rem] border border-gray-200 dark:border-slate-700 text-center shadow-sm">
              <p className="text-gray-500 dark:text-gray-400 font-bold text-xl">No ongoing batches right now.</p>
            </div>
          )}

          {ongoingBatches.map(renderBatchTile)}
        </div>
      </div>

      {/* COMPLETED BATCHES */}
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3 tracking-tight border-b border-gray-200 dark:border-slate-700 pb-4 opacity-80">
          <FiCheckCircle className="text-emerald-500" /> Completed Batches ({completedBatches.length})
        </h2>
        {completedBatches.length === 0 ? (
          <div className="glass-panel bg-white dark:bg-slate-900 p-16 rounded-[2.5rem] border border-gray-200 dark:border-slate-700 text-center shadow-sm opacity-75">
            <p className="text-gray-500 dark:text-gray-400 font-bold text-xl">No completed batches yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-85 hover:opacity-100 transition-opacity">
            {completedBatches.map(renderBatchTile)}
          </div>
        )}
      </div>

      {/* MOVE BATCH MODAL */}
      {movingStudent && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-panel bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-lg overflow-hidden relative">
            <div className="p-8 md:p-10 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80">
              <button onClick={() => setMovingStudent(null)} className="absolute top-6 right-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 bg-white dark:bg-slate-900 p-3 rounded-full border border-gray-200 dark:border-slate-700 shadow-sm transition-colors z-10"><FiX size={20} /></button>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight pr-8">
                {movingStudent === "BULK" ? "Bulk Move Students" : "Change Student Batch"}
              </h2>
              
              <div className="flex items-center gap-5 mt-6 p-5 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-sm">
                {movingStudent === "BULK" ? (
                  <div className="flex items-center justify-center w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-200 dark:border-blue-800 shrink-0 shadow-sm"><FiUsers size={32} /></div>
                ) : (
                  <img src={movingStudent.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="dp" className="w-16 h-16 rounded-2xl object-cover shadow-sm bg-white border border-gray-200 dark:border-slate-700 shrink-0" />
                )}
                <div className="min-w-0 pr-2">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-widest mb-1.5">Moving</p>
                  <p className="font-black text-xl text-gray-900 dark:text-white truncate">{movingStudent === "BULK" ? `${selectedStudentIds.length} Selected Students` : movingStudent.name}</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 md:p-10 space-y-8">
              <div>
                <label className={labelCls}>Select Target Batch</label>
                <select
                  id="new-batch-select"
                  value={targetBatchId}
                  onChange={(e) => setTargetBatchId(e.target.value)}
                  className={`${inputCls} cursor-pointer text-[15px]`}
                >
                  <option value="">-- Choose a Batch --</option>
                  {list.batches.filter((b) => b.isActive !== false && b._id !== (batch?._id || '')).map((b) => (
                    <option key={b._id} value={b._id}>{b.subject} ({b.batchCode})</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button onClick={() => setMovingStudent(null)} className="flex-1 glass-button bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 py-4 rounded-xl font-extrabold text-gray-700 dark:text-gray-300 text-[15px] border border-gray-200 dark:border-slate-700 shadow-sm order-2 sm:order-1 transition-colors">
                  Cancel
                </button>
                <button onClick={confirmMoveBatch} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-xl font-extrabold shadow-lg shadow-blue-500/30 hover:scale-[0.98] transition-transform text-[15px] order-1 sm:order-2">
                  Confirm Move
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