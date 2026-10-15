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

const card = 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl';
const muted = 'text-gray-500 dark:text-gray-400';

const Stat = ({ label, value }) => (
  <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
    <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
    <p className="text-[11px] uppercase font-semibold text-gray-500 dark:text-gray-400 mt-1">{label}</p>
  </div>
);

const Scores = ({ t, c, co }) => (
  <span className="text-xs">
    Tech <b>{t}</b> | Comm <b>{c}</b> | Code <b>{co}</b>
  </span>
);

const BackButton = ({ onClick, children }) => (
  <button type="button" onClick={onClick} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600">
    <FiArrowLeft /> {children}
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
  
  // CALENDAR (MATRIX) STATE
  const [matrixData, setMatrixData] = useState(null);
  
  const [openRound, setOpenRound] = useState(null);
  const [studentView, setStudentView] = useState(null);

  // =========================================
  // NEW: ASSIGN / MOVE BATCH & BULK SELECTION STATE
  // =========================================
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [movingStudent, setMovingStudent] = useState(null); // student object or "BULK"
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

  // Reload current batch students + batch counts
  const refreshCurrentBatch = async () => {
    fetchBatchList();
    if (batch) {
      try {
        const r = await axios.get(`${API}/staff/batches/${batch._id}/students`, cfg());
        setStudents(r.data);
        setSelectedStudentIds([]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const showMocks = async () => {
    setTab('mocks');
    if (mocks) return;
    try {
      setMocks((await axios.get(`${API}/staff/batches/${batch._id}/mocks`, cfg())).data);
    } catch (err) { alert('Could not load the mock history'); }
  };

  // FETCH ATTENDANCE MATRIX
  const showMatrix = async () => {
    setTab('matrix');
    if (matrixData) return;
    try {
      const res = await axios.get(`${API}/staff/batches/${batch._id}/attendance-matrix`, cfg());
      setMatrixData(res.data);
    } catch (err) { 
      alert('Could not load attendance calendar. Make sure backend matrix APIs are deployed.'); 
    }
  };

  // TOGGLE MANUAL ATTENDANCE CHECKBOX
  const toggleAttendance = async (sessionId, studentId, isCurrentlyPresent) => {
    const isPresent = !isCurrentlyPresent;
    
    setMatrixData(prev => {
      const newMap = { ...prev.attMap };
      if (isPresent) newMap[`${studentId}_${sessionId}`] = true;
      else delete newMap[`${studentId}_${sessionId}`];
      return { ...prev, attMap: newMap };
    });

    try {
      await axios.post(`${API}/staff/batches/${batch._id}/attendance/toggle`, {
        sessionId, studentId, isPresent
      }, cfg());
    } catch (err) {
      alert("Failed to save attendance. Please refresh the page.");
    }
  };

  const openStudent = async (id) => {
    setStudentView({ loading: true });
    try {
      setStudentView({ data: (await axios.get(`${API}/staff/students/${id}/history`, cfg())).data });
    } catch (err) {
      setStudentView(null);
      alert('Could not load the student');
    }
  };

  // =========================================
  // NEW: DELETE STUDENT HANDLER
  // =========================================
  const handleDeleteStudent = async (s) => {
    if (!window.confirm(`Remove ${s.name} (${s.email}) permanently? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/users/${s._id}`, cfg());
      alert(`${s.name} has been deleted.`);
      await refreshCurrentBatch();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete student');
    }
  };

  // =========================================
  // NEW: SELECT CHECKBOX HANDLERS
  // =========================================
  const handleSelectAll = (e) => {
    if (!students?.students) return;
    if (e.target.checked) {
      setSelectedStudentIds(students.students.map((s) => s._id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // =========================================
  // NEW: CONFIRM ASSIGN / MOVE TO ONGOING BATCH
  // =========================================
  const confirmMoveBatch = async () => {
    if (!targetBatchId) {
      alert('Please select an ongoing batch from the dropdown.');
      return;
    }

    const oldBatchId = (!batch || batch._id === 'unassigned')
      ? '000000000000000000000000'
      : batch._id;

    try {
      if (movingStudent === 'BULK') {
        await axios.put(`${API}/staff/batches/bulk-change-student`, {
          studentIds: selectedStudentIds,
          oldBatchId,
          newBatchId: targetBatchId
        }, cfg());
        alert(`Successfully assigned ${selectedStudentIds.length} student(s) to the batch!`);
      } else {
        await axios.put(`${API}/staff/batches/change-student`, {
          studentId: movingStudent._id,
          oldBatchId,
          newBatchId: targetBatchId
        }, cfg());
        alert(`${movingStudent.name} has been added to the batch!`);
      }

      setMovingStudent(null);
      setTargetBatchId('');
      await refreshCurrentBatch();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign student(s) to batch');
    }
  };

  const heading = title ? <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{title}</h1> : null;

  // ------------------------------------------------------------------ STUDENT PAGE
  if (studentView) {
    if (studentView.loading) return <p className={`p-8 text-center ${muted}`}>Loading student...</p>;
    const d = studentView.data;
    const s = d.student;
    const totalAttended = d.batches.reduce((n, b) => n + b.attended, 0);

    return (
      <div className="space-y-6">
        {heading}
        <BackButton onClick={() => setStudentView(null)}>Back to {batch ? batch.subject : 'batches'}</BackButton>

        {/* Student Profile Card (with Profile Pic) */}
        <div className={`${card} p-6 flex items-center justify-between gap-5 flex-wrap`}>
          <div className="flex items-center gap-5">
            <img 
              src={s.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
              alt="DP" 
              className="w-20 h-20 rounded-full object-cover border-2 border-blue-500 shadow-sm bg-white"
            />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{s.name}</h2>
              <p className={`text-sm ${muted}`}>{s.email}</p>
              <p className={`text-xs mt-2 ${muted}`}>
                {s.highestQualification || '-'} ({s.passingYear || '-'}), {s.percentage ?? '-'}%, backlogs {s.backlogs ?? 0}, gap {s.educationGap ?? 0} yrs
              </p>
              {s.skillsAcquired && <p className={`text-xs ${muted}`}>Skills: {s.skillsAcquired}</p>}
              {!isAdmin && <p className={`text-xs mt-2 ${muted}`}>Attendance and mock details below are for your batches only.</p>}
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={async () => {
                if (!window.confirm(`Delete ${s.name} permanently?`)) return;
                try {
                  await axios.delete(`${API}/users/${s._id}`, cfg());
                  setStudentView(null);
                  await refreshCurrentBatch();
                } catch (e) {
                  alert(e.response?.data?.message || 'Failed to delete student');
                }
              }}
              className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <FiTrash2 /> Delete Student
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Batches" value={d.batches.length} />
          <Stat label="Classes attended" value={totalAttended} />
          <Stat label="Assignment marks" value={`${d.assignments.summary.marks} / ${d.assignments.summary.totalMarks}`} />
          <Stat label="Mocks" value={d.mocks.count} />
        </div>

        {/* Batches Table */}
        <div className={`${card} overflow-x-auto`}>
          <div className="p-4 border-b dark:border-slate-700 font-bold text-gray-900 dark:text-white">Batches</div>
          <table className="w-full text-left text-sm">
            <thead className={`${muted} border-b dark:border-slate-700`}>
              <tr><th className="p-3">Batch</th><th className="p-3">Trainer</th><th className="p-3">Joined</th><th className="p-3">Attendance</th></tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-700 text-gray-800 dark:text-gray-200">
              {d.batches.length === 0 && <tr><td colSpan="4" className={`p-6 text-center ${muted}`}>Not in any batch yet.</td></tr>}
              {d.batches.map((b) => (
                <tr key={b._id}>
                  <td className="p-3 font-semibold">{b.subject} <span className="text-xs text-gray-400">({b.batchCode})</span></td>
                  <td className="p-3">{b.trainerName}</td>
                  <td className="p-3">{fmtDate(b.joinedAt)}</td>
                  <td className="p-3">{b.attended} / {b.totalClasses} classes</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Assignments Table */}
        <div className={`${card} overflow-x-auto`}>
          <div className="p-4 border-b dark:border-slate-700 font-bold text-gray-900 dark:text-white">Assignments</div>
          <table className="w-full text-left text-sm">
            <thead className={`${muted} border-b dark:border-slate-700`}>
              <tr><th className="p-3">Assignment</th><th className="p-3">Answered</th><th className="p-3">Marks</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-700 text-gray-800 dark:text-gray-200">
              {d.assignments.list.length === 0 && <tr><td colSpan="4" className={`p-6 text-center ${muted}`}>No assignments yet.</td></tr>}
              {d.assignments.list.map((a) => {
                const done = a.totalQuestions > 0 && a.answered >= a.totalQuestions;
                return (
                  <tr key={a._id}>
                    <td className="p-3 font-semibold">{a.title} <span className="text-xs text-gray-400">({a.level})</span></td>
                    <td className="p-3">{a.answered} / {a.totalQuestions}</td>
                    <td className="p-3">{a.marks} / {a.totalMarks}</td>
                    <td className="p-3 text-xs font-bold">
                      {done ? <span className="text-green-600">Completed</span> : a.answered > 0 ? <span className="text-yellow-600">In progress</span> : <span className="text-gray-400">Not started</span>}
                      {a.pending > 0 && <span className="ml-2 text-orange-500">{a.pending} awaiting review</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------ ONE BATCH
  if (batch) {
    const isUnassigned = batch._id === 'unassigned';
    return (
      <div className="space-y-4">
        {heading}
        <BackButton onClick={() => setBatch(null)}>Back to all batches</BackButton>

        <div className={`${card} p-6`}>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{batch.subject}</h2>
          <p className={`text-xs ${muted}`}>{batch.batchCode}</p>
          
          {!isUnassigned && (
            <div className="flex gap-2 mt-4 flex-wrap">
              <button
                onClick={() => setTab('students')}
                className={`px-4 py-2 rounded-lg text-sm font-bold ${tab === 'students' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Students List
              </button>
              
              <button
                onClick={showMatrix}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${tab === 'matrix' ? 'bg-green-600 text-white shadow-md' : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'}`}
              >
                <FiCheckSquare /> Attendance Calendar
              </button>

              <button
                onClick={showMocks}
                className={`px-4 py-2 rounded-lg text-sm font-bold ${tab === 'mocks' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Mock history
              </button>
            </div>
          )}
        </div>

        {/* BULK ACTION BAR FOR ADMIN */}
        {isAdmin && tab === 'students' && selectedStudentIds.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex items-center justify-between shadow-sm">
            <span className="text-blue-800 font-bold text-sm">
              {selectedStudentIds.length} student(s) selected
            </span>
            <button
              onClick={() => {
                setTargetBatchId('');
                setMovingStudent('BULK');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm transition"
            >
              {isUnassigned ? 'Assign Selected to Batch' : 'Move Selected to Another Batch'}
            </button>
          </div>
        )}

        {/* 1. STUDENTS TAB */}
        {tab === 'students' && (
          <div className={`${card} overflow-x-auto`}>
            {!students ? (
              <p className={`p-8 text-center ${muted}`}>Loading students...</p>
            ) : students.students.length === 0 ? (
              <p className={`p-8 text-center ${muted}`}>No students in this list.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className={`${muted} border-b dark:border-slate-700`}>
                  <tr>
                    {isAdmin && (
                      <th className="p-3 w-10">
                        <input
                          type="checkbox"
                          className="w-4 h-4 cursor-pointer accent-blue-600 rounded"
                          checked={students.students.length > 0 && selectedStudentIds.length === students.students.length}
                          onChange={handleSelectAll}
                        />
                      </th>
                    )}
                    <th className="p-3">Student</th>
                    {!isUnassigned && <th className="p-3">Attendance</th>}
                    <th className="p-3">Assignments</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-700">
                  {students.students.map((s) => (
                    <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      {isAdmin && (
                        <td className="p-3">
                          <input
                            type="checkbox"
                            className="w-4 h-4 cursor-pointer accent-blue-600 rounded"
                            checked={selectedStudentIds.includes(s._id)}
                            onChange={() => handleSelectOne(s._id)}
                          />
                        </td>
                      )}
                      <td className="p-3 flex items-center gap-3">
                        <img 
                          src={s.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                          alt="DP" 
                          className="w-10 h-10 rounded-full object-cover border border-gray-300 bg-white"
                        />
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{s.name}</div>
                          <div className="text-xs text-gray-400">{s.email}</div>
                        </div>
                      </td>
                      {!isUnassigned && <td className="p-3 font-bold text-gray-800 dark:text-gray-200">{s.attended} / {students.totalClasses}</td>}
                      <td className="p-3 text-gray-800 dark:text-gray-200">
                        {s.assignmentsAnswered} answered
                        {s.assignmentsPending > 0 && <span className="text-orange-500 text-xs ml-1">({s.assignmentsPending} pending)</span>}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openStudent(s._id)} className="text-blue-600 font-bold hover:underline text-xs px-2 py-1">
                            Full history
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                onClick={() => {
                                  setTargetBatchId('');
                                  setMovingStudent(s);
                                }}
                                className="bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                              >
                                {isUnassigned ? 'Assign Batch' : 'Change Batch'}
                              </button>

                              <button
                                onClick={() => handleDeleteStudent(s)}
                                className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition"
                                title="Delete Student"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 2. ATTENDANCE CALENDAR MATRIX TAB */}
        {tab === 'matrix' && (
          <div className={`${card} overflow-hidden`}>
            {!matrixData ? (
              <p className={`p-8 text-center ${muted}`}>Loading calendar grid...</p>
            ) : matrixData.sessions.length === 0 ? (
              <p className={`p-8 text-center ${muted}`}>No sessions (classes) have been held yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-3 font-bold text-gray-700 sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Student</th>
                      <th className="p-3 font-bold text-blue-600 text-center bg-blue-50 border-r">Total %</th>
                      {matrixData.sessions.map((sess, idx) => (
                        <th key={sess._id} className="p-3 font-semibold text-gray-600 text-center border-r" title={sess.date}>
                          <div>S{idx + 1}</div>
                          <div className="text-[10px] text-gray-400 font-normal">{fmtDay(sess.date)}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {matrixData.students.map(s => {
                      const totalSess = matrixData.sessions.length;
                      let presentCount = 0;
                      matrixData.sessions.forEach(sess => {
                        if (matrixData.attMap[`${s._id}_${sess._id}`]) presentCount++;
                      });
                      const percentage = totalSess > 0 ? Math.round((presentCount / totalSess) * 100) : 0;

                      return (
                        <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-3 sticky left-0 bg-white border-r flex items-center gap-2 w-56 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            <img src={s.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-8 h-8 rounded-full object-cover border border-gray-200" alt="dp" />
                            <div className="truncate">
                              <p className="font-semibold text-gray-800 truncate">{s.name}</p>
                              <p className="text-[10px] text-gray-400 truncate">{s.email}</p>
                            </div>
                          </td>
                          
                          <td className="p-3 text-center font-bold bg-blue-50/30 border-r">
                            <span className={percentage >= 75 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                              {percentage}%
                            </span>
                            <div className="text-[10px] text-gray-500">{presentCount}/{totalSess}</div>
                          </td>

                          {matrixData.sessions.map(sess => {
                            const isPresent = !!matrixData.attMap[`${s._id}_${sess._id}`];
                            return (
                              <td key={sess._id} className="p-3 text-center border-r hover:bg-gray-100 transition">
                                <input
                                  type="checkbox"
                                  className="w-5 h-5 cursor-pointer accent-green-600 rounded"
                                  checked={isPresent}
                                  onChange={() => toggleAttendance(sess._id, s._id, isPresent)}
                                  title={`Mark ${isPresent ? 'Absent' : 'Present'} for ${s.name} on ${fmtDay(sess.date)}`}
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
          <div className="space-y-3">
            {!mocks ? (
              <p className={`p-8 text-center ${muted}`}>Loading mock history...</p>
            ) : (
              <>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Mocks taken: {mocks.totalMocks}</p>
                {mocks.rounds.length === 0 && <p className={`p-8 text-center ${muted}`}>No mock ratings have been given for this batch yet.</p>}
                {mocks.rounds.map((r, i) => {
                  const open = openRound === i;
                  return (
                    <div key={r.date} className={`${card} p-4`}>
                      <button type="button" onClick={() => setOpenRound(open ? null : i)} className="w-full flex items-center justify-between gap-3 text-left">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">Mock {mocks.totalMocks - i}: {fmtDay(r.date)}</p>
                          <p className={`text-xs ${muted}`}>{r.count} rating{r.count > 1 ? 's' : ''} given</p>
                        </div>
                        <div className="flex items-center gap-3 text-gray-800 dark:text-gray-200">
                          <Scores t={r.avgTechnical} c={r.avgCommunication} co={r.avgCoding} />
                          {open ? <FiChevronUp /> : <FiChevronDown />}
                        </div>
                      </button>
                      {open && (
                        <div className="mt-3 divide-y dark:divide-slate-700">
                          {r.ratings.map((x) => (
                            <div key={x._id} className="py-2 text-sm text-gray-800 dark:text-gray-200">
                              <p className="font-semibold">{x.studentName} <span className="text-xs text-gray-400">{x.studentEmail}</span></p>
                              <Scores t={`${x.technicalRating}/10`} c={`${x.communicationRating}/10`} co={`${x.codingRating}/10`} />
                              {x.remarks && <p className={`text-xs italic mt-1 ${muted}`}>"{x.remarks}"</p>}
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

        {/* ASSIGN / MOVE BATCH MODAL */}
        {movingStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md">
              <div className="relative p-6 border-b dark:border-slate-700">
                <button
                  onClick={() => setMovingStudent(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2"
                >
                  <FiX />
                </button>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {isUnassigned ? 'Assign to Ongoing Batch' : 'Move Student Batch'}
                </h2>

                <div className="flex items-center gap-3 mt-4 p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700">
                  {movingStudent === 'BULK' ? (
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full">
                      <FiUsers size={24} />
                    </div>
                  ) : (
                    <img
                      src={movingStudent.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                      alt="dp"
                      className="w-12 h-12 rounded-full object-cover shadow-sm bg-white border border-gray-200"
                    />
                  )}
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Selected</p>
                    <p className="font-bold text-gray-800 dark:text-white">
                      {movingStudent === 'BULK' ? `${selectedStudentIds.length} Students` : movingStudent.name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Select Ongoing Batch
                  </label>
                  <select
                    value={targetBatchId}
                    onChange={(e) => setTargetBatchId(e.target.value)}
                    className="w-full p-3 border dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose a Batch --</option>
                    {list.batches
                      .filter((b) => b._id !== batch._id)
                      .map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.subject} ({b.batchCode})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={confirmMoveBatch}
                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setMovingStudent(null)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2.5 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ------------------------------------------------------------------ ALL BATCHES
  if (loading) return <p className={`p-8 text-center ${muted}`}>Loading batches...</p>;

  return (
    <div className="space-y-4">
      {heading}
      <p className={`text-sm ${muted}`}>
        {isAdmin
          ? 'All batches. Students appear in a batch after they scan attendance or when you assign them manually.'
          : 'Your batches. Open one to see its students and mock history.'}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isAdmin && list.unassignedCount > 0 && (
          <button
            type="button"
            onClick={() => openBatch({ _id: 'unassigned', subject: 'Students not in any batch yet', batchCode: 'Unassigned' })}
            className="text-left rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-600 p-5 hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            <p className="font-bold text-gray-900 dark:text-white">Not in any batch yet</p>
            <p className={`text-xs ${muted} mt-1`}>Click to assign these students to ongoing batches or remove them.</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-3">{list.unassignedCount}</p>
          </button>
        )}

        {list.batches.length === 0 && <p className={muted}>No batches yet.</p>}
        {list.batches.map((b) => (
          <button key={b._id} type="button" onClick={() => openBatch(b)} className={`${card} p-5 text-left hover:shadow-md transition-shadow`}>
            <p className="font-bold text-lg text-gray-900 dark:text-white">{b.subject}</p>
            <p className={`text-xs ${muted}`}>{b.batchCode}{isAdmin && b.trainerName ? `, trainer ${b.trainerName}` : ''}</p>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div><FiUsers className="mx-auto text-blue-500" /><p className="font-bold text-gray-900 dark:text-white">{b.studentCount}</p><p className="text-[10px] uppercase text-gray-400">Students</p></div>
              <div><FiClock className="mx-auto text-blue-500" /><p className="font-bold text-gray-900 dark:text-white">{b.classesTaken}</p><p className="text-[10px] uppercase text-gray-400">Classes</p></div>
              <div><FiStar className="mx-auto text-blue-500" /><p className="font-bold text-gray-900 dark:text-white">{b.mocksTaken}</p><p className="text-[10px] uppercase text-gray-400">Mocks</p></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StaffBatchTracker;