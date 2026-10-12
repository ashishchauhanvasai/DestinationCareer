// // Save as: src/components/StaffBatchTracker.js   (NEW file)
// // Used by the admin ("Students by Batch" tab) and by trainers ("My Students" page).
// // The server decides what each role can see: admin sees all batches, a trainer only his own.
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { FiArrowLeft, FiUsers, FiClock, FiStar, FiChevronDown, FiChevronUp } from 'react-icons/fi';

// const API = `${process.env.REACT_APP_API_URL}/api`;
// const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

// const fmtDay = (d) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
// const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

// const card = 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl';
// const muted = 'text-gray-500 dark:text-gray-400';

// const Stat = ({ label, value }) => (
//   <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
//     <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
//     <p className="text-[11px] uppercase font-semibold text-gray-500 dark:text-gray-400 mt-1">{label}</p>
//   </div>
// );

// const Scores = ({ t, c, co }) => (
//   <span className="text-xs">
//     Technical <b>{t}</b> | Communication <b>{c}</b> | Coding <b>{co}</b>
//   </span>
// );

// const BackButton = ({ onClick, children }) => (
//   <button type="button" onClick={onClick} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600">
//     <FiArrowLeft /> {children}
//   </button>
// );

// const StaffBatchTracker = ({ title }) => {
//   const isAdmin = ['admin', 'superadmin'].includes(localStorage.getItem('role'));

//   const [list, setList] = useState({ batches: [], unassignedCount: null });
//   const [loading, setLoading] = useState(true);
//   const [batch, setBatch] = useState(null); // the batch that is open
//   const [tab, setTab] = useState('students');
//   const [students, setStudents] = useState(null);
//   const [mocks, setMocks] = useState(null);
//   const [openRound, setOpenRound] = useState(null);
//   const [studentView, setStudentView] = useState(null); // { loading: true } | { data }

//   useEffect(() => {
//     axios
//       .get(`${API}/staff/batches`, cfg())
//       .then((r) => setList(r.data))
//       .catch((e) => console.error(e))
//       .finally(() => setLoading(false));
//   }, []);

//   const openBatch = async (b) => {
//     setBatch(b);
//     setTab('students');
//     setStudents(null);
//     setMocks(null);
//     setOpenRound(null);
//     try {
//       const r = await axios.get(`${API}/staff/batches/${b._id}/students`, cfg());
//       setStudents(r.data);
//     } catch (err) {
//       alert(err.response?.data?.message || 'Could not load the students');
//     }
//   };

//   const showMocks = async () => {
//     setTab('mocks');
//     if (mocks) return;
//     try {
//       setMocks((await axios.get(`${API}/staff/batches/${batch._id}/mocks`, cfg())).data);
//     } catch (err) {
//       alert(err.response?.data?.message || 'Could not load the mock history');
//     }
//   };

//   const openStudent = async (id) => {
//     setStudentView({ loading: true });
//     try {
//       setStudentView({ data: (await axios.get(`${API}/staff/students/${id}/history`, cfg())).data });
//     } catch (err) {
//       setStudentView(null);
//       alert(err.response?.data?.message || 'Could not load the student');
//     }
//   };

//   const heading = title ? <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{title}</h1> : null;

//   // ------------------------------------------------------------------ STUDENT PAGE
//   if (studentView) {
//     if (studentView.loading) return <p className={`p-8 text-center ${muted}`}>Loading student...</p>;
//     const d = studentView.data;
//     const s = d.student;
//     const totalAttended = d.batches.reduce((n, b) => n + b.attended, 0);

//     return (
//       <div className="space-y-6">
//         {heading}
//         <BackButton onClick={() => setStudentView(null)}>Back to {batch ? batch.subject : 'batches'}</BackButton>

//         <div className={`${card} p-6`}>
//           <h2 className="text-xl font-bold text-gray-900 dark:text-white">{s.name}</h2>
//           <p className={`text-sm ${muted}`}>{s.email}</p>
//           <p className={`text-xs mt-2 ${muted}`}>
//             {s.highestQualification || '-'} ({s.passingYear || '-'}), {s.percentage ?? '-'}%, backlogs {s.backlogs ?? 0}, gap {s.educationGap ?? 0} yrs
//           </p>
//           {s.skillsAcquired && <p className={`text-xs ${muted}`}>Skills: {s.skillsAcquired}</p>}
//           {!isAdmin && <p className={`text-xs mt-2 ${muted}`}>Attendance and mock details below are for your batches only.</p>}
//         </div>

//         <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//           <Stat label="Batches" value={d.batches.length} />
//           <Stat label="Classes attended" value={totalAttended} />
//           <Stat label="Assignments attempted" value={`${d.assignments.summary.attempted} / ${d.assignments.summary.assigned}`} />
//           <Stat label="Assignment marks" value={`${d.assignments.summary.marks} / ${d.assignments.summary.totalMarks}`} />
//           <Stat label="Mocks" value={d.mocks.count} />
//           <Stat label="Avg technical" value={d.mocks.avgTechnical} />
//           <Stat label="Avg communication" value={d.mocks.avgCommunication} />
//           <Stat label="Avg coding" value={d.mocks.avgCoding} />
//         </div>

//         <div className={`${card} overflow-x-auto`}>
//           <div className="p-4 border-b dark:border-slate-700 font-bold text-gray-900 dark:text-white">Batches</div>
//           <table className="w-full text-left text-sm">
//             <thead className={`${muted} border-b dark:border-slate-700`}>
//               <tr><th className="p-3">Batch</th><th className="p-3">Trainer</th><th className="p-3">Joined</th><th className="p-3">Attendance</th></tr>
//             </thead>
//             <tbody className="divide-y dark:divide-slate-700 text-gray-800 dark:text-gray-200">
//               {d.batches.length === 0 && <tr><td colSpan="4" className={`p-6 text-center ${muted}`}>Not in any batch yet. A student joins a batch when they scan attendance.</td></tr>}
//               {d.batches.map((b) => (
//                 <tr key={b._id}>
//                   <td className="p-3 font-semibold">{b.subject} <span className="text-xs text-gray-400">({b.batchCode})</span></td>
//                   <td className="p-3">{b.trainerName}</td>
//                   <td className="p-3">{fmtDate(b.joinedAt)}</td>
//                   <td className="p-3">{b.attended} / {b.totalClasses} classes</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         <div className={`${card} overflow-x-auto`}>
//           <div className="p-4 border-b dark:border-slate-700 font-bold text-gray-900 dark:text-white">Assignments</div>
//           <table className="w-full text-left text-sm">
//             <thead className={`${muted} border-b dark:border-slate-700`}>
//               <tr><th className="p-3">Assignment</th><th className="p-3">Answered</th><th className="p-3">Marks</th><th className="p-3">Status</th></tr>
//             </thead>
//             <tbody className="divide-y dark:divide-slate-700 text-gray-800 dark:text-gray-200">
//               {d.assignments.list.length === 0 && <tr><td colSpan="4" className={`p-6 text-center ${muted}`}>No assignments yet.</td></tr>}
//               {d.assignments.list.map((a) => {
//                 const done = a.totalQuestions > 0 && a.answered >= a.totalQuestions;
//                 return (
//                   <tr key={a._id}>
//                     <td className="p-3 font-semibold">{a.title} <span className="text-xs text-gray-400">({a.level})</span></td>
//                     <td className="p-3">{a.answered} / {a.totalQuestions}</td>
//                     <td className="p-3">{a.marks} / {a.totalMarks}</td>
//                     <td className="p-3 text-xs font-bold">
//                       {done ? <span className="text-green-600">Completed</span> : a.answered > 0 ? <span className="text-yellow-600">In progress</span> : <span className="text-gray-400">Not started</span>}
//                       {a.pending > 0 && <span className="ml-2 text-orange-500">{a.pending} awaiting review</span>}
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>

//         <div className={`${card}`}>
//           <div className="p-4 border-b dark:border-slate-700 font-bold text-gray-900 dark:text-white">Mock rating history ({d.mocks.count})</div>
//           <div className="divide-y dark:divide-slate-700">
//             {d.mocks.list.length === 0 && <p className={`p-6 text-center text-sm ${muted}`}>No mock ratings yet.</p>}
//             {d.mocks.list.map((m) => (
//               <div key={m._id} className="p-4 text-sm text-gray-800 dark:text-gray-200">
//                 <p className="font-semibold">
//                   {fmtDate(m.date)} <span className="text-xs text-gray-400">{m.subject} ({m.batchCode}){m.trainerName ? `, by ${m.trainerName}` : ''}</span>
//                 </p>
//                 <Scores t={`${m.technicalRating}/10`} c={`${m.communicationRating}/10`} co={`${m.codingRating}/10`} />
//                 {m.remarks && <p className={`text-xs italic mt-1 ${muted}`}>"{m.remarks}"</p>}
//               </div>
//             ))}
//           </div>
//         </div>

//         <div className={`${card}`}>
//           <div className="p-4 border-b dark:border-slate-700 font-bold text-gray-900 dark:text-white">Attendance history ({d.attendance.length})</div>
//           <div className="divide-y dark:divide-slate-700 max-h-72 overflow-y-auto">
//             {d.attendance.length === 0 && <p className={`p-6 text-center text-sm ${muted}`}>No attendance marked yet.</p>}
//             {d.attendance.map((a, i) => (
//               <div key={i} className="p-3 flex justify-between text-sm text-gray-800 dark:text-gray-200">
//                 <span>{a.subject} <span className="text-xs text-gray-400">({a.batchCode})</span></span>
//                 <span className={muted}>{a.date}, {new Date(a.markedAt).toLocaleTimeString()}</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // ------------------------------------------------------------------ ONE BATCH
//   if (batch) {
//     const isUnassigned = batch._id === 'unassigned';
//     return (
//       <div className="space-y-4">
//         {heading}
//         <BackButton onClick={() => setBatch(null)}>Back to all batches</BackButton>

//         <div className={`${card} p-6`}>
//           <h2 className="text-xl font-bold text-gray-900 dark:text-white">{batch.subject}</h2>
//           <p className={`text-xs ${muted}`}>
//             {batch.batchCode}
//             {batch.trainerName ? `, trainer ${batch.trainerName}` : ''}
//           </p>
//           {!isUnassigned && (
//             <div className="flex gap-2 mt-4">
//               {[['students', 'Students'], ['mocks', 'Mock history']].map(([key, label]) => (
//                 <button
//                   key={key}
//                   type="button"
//                   onClick={() => (key === 'mocks' ? showMocks() : setTab('students'))}
//                   className={`px-4 py-2 rounded-lg text-sm font-bold ${
//                     tab === key ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
//                   }`}
//                 >
//                   {label}
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>

//         {tab === 'students' && (
//           <div className={`${card} overflow-x-auto`}>
//             {!students ? (
//               <p className={`p-8 text-center ${muted}`}>Loading students...</p>
//             ) : (
//               <table className="w-full text-left text-sm">
//                 <thead className={`${muted} border-b dark:border-slate-700`}>
//                   <tr>
//                     <th className="p-3">Student</th>
//                     {!isUnassigned && <th className="p-3">Attendance</th>}
//                     <th className="p-3">Assignments</th>
//                     {!isUnassigned && <th className="p-3">Mocks</th>}
//                     <th className="p-3" />
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y dark:divide-slate-700 text-gray-800 dark:text-gray-200">
//                   {students.students.length === 0 && (
//                     <tr><td colSpan="5" className={`p-8 text-center ${muted}`}>
//                       {isUnassigned ? 'Every student is in a batch.' : 'No students yet. They appear here after scanning attendance for this batch.'}
//                     </td></tr>
//                   )}
//                   {students.students.map((s) => (
//                     <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
//                       <td className="p-3">
//                         <div className="font-semibold">{s.name}</div>
//                         <div className="text-xs text-gray-400">{s.email}</div>
//                       </td>
//                       {!isUnassigned && <td className="p-3">{s.attended} / {students.totalClasses}</td>}
//                       <td className="p-3">
//                         {s.assignmentsAnswered} answered, {s.assignmentMarks} marks
//                         {s.assignmentsPending > 0 && <span className="text-orange-500 text-xs"> ({s.assignmentsPending} pending)</span>}
//                       </td>
//                       {!isUnassigned && (
//                         <td className="p-3">
//                           {s.mocks === 0 ? <span className="text-gray-400">None</span> : (
//                             <>
//                               {s.mocks} mock{s.mocks > 1 ? 's' : ''}
//                               <div><Scores t={s.avgTechnical} c={s.avgCommunication} co={s.avgCoding} /></div>
//                             </>
//                           )}
//                         </td>
//                       )}
//                       <td className="p-3 text-right">
//                         <button type="button" onClick={() => openStudent(s._id)} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
//                           Full history
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             )}
//           </div>
//         )}

//         {tab === 'mocks' && (
//           <div className="space-y-3">
//             {!mocks ? (
//               <p className={`p-8 text-center ${muted}`}>Loading mock history...</p>
//             ) : (
//               <>
//                 <p className="text-sm font-bold text-gray-900 dark:text-white">Mocks taken: {mocks.totalMocks}</p>
//                 {mocks.rounds.length === 0 && <p className={`p-8 text-center ${muted}`}>No mock ratings have been given for this batch yet.</p>}
//                 {mocks.rounds.map((r, i) => {
//                   const open = openRound === i;
//                   return (
//                     <div key={r.date} className={`${card} p-4`}>
//                       <button type="button" onClick={() => setOpenRound(open ? null : i)} className="w-full flex items-center justify-between gap-3 text-left">
//                         <div>
//                           <p className="font-bold text-gray-900 dark:text-white">Mock {mocks.totalMocks - i}: {fmtDay(r.date)}</p>
//                           <p className={`text-xs ${muted}`}>{r.count} rating{r.count > 1 ? 's' : ''} given</p>
//                         </div>
//                         <div className="flex items-center gap-3 text-gray-800 dark:text-gray-200">
//                           <Scores t={r.avgTechnical} c={r.avgCommunication} co={r.avgCoding} />
//                           {open ? <FiChevronUp /> : <FiChevronDown />}
//                         </div>
//                       </button>
//                       {open && (
//                         <div className="mt-3 divide-y dark:divide-slate-700">
//                           {r.ratings.map((x) => (
//                             <div key={x._id} className="py-2 text-sm text-gray-800 dark:text-gray-200">
//                               <p className="font-semibold">{x.studentName} <span className="text-xs text-gray-400">{x.studentEmail}</span></p>
//                               <Scores t={`${x.technicalRating}/10`} c={`${x.communicationRating}/10`} co={`${x.codingRating}/10`} />
//                               {x.remarks && <p className={`text-xs italic mt-1 ${muted}`}>"{x.remarks}"</p>}
//                             </div>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}
//               </>
//             )}
//           </div>
//         )}
//       </div>
//     );
//   }

//   // ------------------------------------------------------------------ ALL BATCHES
//   if (loading) return <p className={`p-8 text-center ${muted}`}>Loading batches...</p>;

//   return (
//     <div className="space-y-4">
//       {heading}
//       <p className={`text-sm ${muted}`}>
//         {isAdmin
//           ? 'All batches. Students appear in a batch after they scan attendance for it.'
//           : 'Your batches. Open one to see its students and mock history.'}
//       </p>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//         {isAdmin && list.unassignedCount > 0 && (
//           <button
//             type="button"
//             onClick={() => openBatch({ _id: 'unassigned', subject: 'Students not in any batch yet', batchCode: 'Unassigned' })}
//             className="text-left rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-600 p-5 hover:bg-gray-50 dark:hover:bg-slate-800"
//           >
//             <p className="font-bold text-gray-900 dark:text-white">Not in any batch yet</p>
//             <p className={`text-xs ${muted} mt-1`}>These students have not scanned attendance yet.</p>
//             <p className="text-2xl font-bold text-gray-900 dark:text-white mt-3">{list.unassignedCount}</p>
//           </button>
//         )}

//         {list.batches.length === 0 && <p className={muted}>No batches yet.</p>}
//         {list.batches.map((b) => (
//           <button key={b._id} type="button" onClick={() => openBatch(b)} className={`${card} p-5 text-left hover:shadow-md transition-shadow`}>
//             <p className="font-bold text-lg text-gray-900 dark:text-white">{b.subject}</p>
//             <p className={`text-xs ${muted}`}>{b.batchCode}{isAdmin && b.trainerName ? `, trainer ${b.trainerName}` : ''}</p>
//             <div className="grid grid-cols-3 gap-2 mt-4 text-center">
//               <div><FiUsers className="mx-auto text-blue-500" /><p className="font-bold text-gray-900 dark:text-white">{b.studentCount}</p><p className="text-[10px] uppercase text-gray-400">Students</p></div>
//               <div><FiClock className="mx-auto text-blue-500" /><p className="font-bold text-gray-900 dark:text-white">{b.classesTaken}</p><p className="text-[10px] uppercase text-gray-400">Classes</p></div>
//               <div><FiStar className="mx-auto text-blue-500" /><p className="font-bold text-gray-900 dark:text-white">{b.mocksTaken}</p><p className="text-[10px] uppercase text-gray-400">Mocks</p></div>
//             </div>
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default StaffBatchTracker;

// Save as: src/components/StaffBatchTracker.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiArrowLeft, FiUsers, FiClock, FiStar, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const fmtDay = (d) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
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
    Technical <b>{t}</b> | Communication <b>{c}</b> | Coding <b>{co}</b>
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
  const [batch, setBatch] = useState(null); // the batch that is open
  const [tab, setTab] = useState('students');
  const [students, setStudents] = useState(null);
  const [mocks, setMocks] = useState(null);
  const [openRound, setOpenRound] = useState(null);
  const [studentView, setStudentView] = useState(null); // { loading: true } | { data }

  const fetchBatchList = () => {
    axios
      .get(`${API}/staff/batches`, cfg())
      .then((r) => setList(r.data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBatchList();
  }, []);

  const openBatch = async (b) => {
    setBatch(b);
    setTab('students');
    setStudents(null);
    setMocks(null);
    setOpenRound(null);
    try {
      const r = await axios.get(`${API}/staff/batches/${b._id}/students`, cfg());
      setStudents(r.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not load the students');
    }
  };

  const showMocks = async () => {
    setTab('mocks');
    if (mocks) return;
    try {
      setMocks((await axios.get(`${API}/staff/batches/${batch._id}/mocks`, cfg())).data);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not load the mock history');
    }
  };

  const openStudent = async (id) => {
    setStudentView({ loading: true });
    try {
      setStudentView({ data: (await axios.get(`${API}/staff/students/${id}/history`, cfg())).data });
    } catch (err) {
      setStudentView(null);
      alert(err.response?.data?.message || 'Could not load the student');
    }
  };

  // ==========================================
  // NEW: Move Student Function
  // ==========================================
  const handleMoveStudent = async (studentId, currentBatchId, newBatchId) => {
    if (!newBatchId) {
      alert("Please select a new batch from the dropdown.");
      return;
    }
    if (currentBatchId === newBatchId) {
      alert("Student is already in this batch.");
      return;
    }

    try {
      await axios.put(`${API}/staff/batches/change-student`, {
        studentId,
        oldBatchId: currentBatchId,
        newBatchId
      }, cfg());

      alert("Student successfully moved to the new batch!");
      
      // Refresh the current batch view so the student disappears/updates
      openBatch(batch);
      // Refresh the main batch list to update the student counts
      fetchBatchList();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to move student");
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

        <div className={`${card} p-6`}>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{s.name}</h2>
          <p className={`text-sm ${muted}`}>{s.email}</p>
          <p className={`text-xs mt-2 ${muted}`}>
            {s.highestQualification || '-'} ({s.passingYear || '-'}), {s.percentage ?? '-'}%, backlogs {s.backlogs ?? 0}, gap {s.educationGap ?? 0} yrs
          </p>
          {s.skillsAcquired && <p className={`text-xs ${muted}`}>Skills: {s.skillsAcquired}</p>}
          {!isAdmin && <p className={`text-xs mt-2 ${muted}`}>Attendance and mock details below are for your batches only.</p>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Batches" value={d.batches.length} />
          <Stat label="Classes attended" value={totalAttended} />
          <Stat label="Assignments attempted" value={`${d.assignments.summary.attempted} / ${d.assignments.summary.assigned}`} />
          <Stat label="Assignment marks" value={`${d.assignments.summary.marks} / ${d.assignments.summary.totalMarks}`} />
          <Stat label="Mocks" value={d.mocks.count} />
          <Stat label="Avg technical" value={d.mocks.avgTechnical} />
          <Stat label="Avg communication" value={d.mocks.avgCommunication} />
          <Stat label="Avg coding" value={d.mocks.avgCoding} />
        </div>

        <div className={`${card} overflow-x-auto`}>
          <div className="p-4 border-b dark:border-slate-700 font-bold text-gray-900 dark:text-white">Batches</div>
          <table className="w-full text-left text-sm">
            <thead className={`${muted} border-b dark:border-slate-700`}>
              <tr><th className="p-3">Batch</th><th className="p-3">Trainer</th><th className="p-3">Joined</th><th className="p-3">Attendance</th></tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-700 text-gray-800 dark:text-gray-200">
              {d.batches.length === 0 && <tr><td colSpan="4" className={`p-6 text-center ${muted}`}>Not in any batch yet. A student joins a batch when they scan attendance.</td></tr>}
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

        <div className={`${card}`}>
          <div className="p-4 border-b dark:border-slate-700 font-bold text-gray-900 dark:text-white">Mock rating history ({d.mocks.count})</div>
          <div className="divide-y dark:divide-slate-700">
            {d.mocks.list.length === 0 && <p className={`p-6 text-center text-sm ${muted}`}>No mock ratings yet.</p>}
            {d.mocks.list.map((m) => (
              <div key={m._id} className="p-4 text-sm text-gray-800 dark:text-gray-200">
                <p className="font-semibold">
                  {fmtDate(m.date)} <span className="text-xs text-gray-400">{m.subject} ({m.batchCode}){m.trainerName ? `, by ${m.trainerName}` : ''}</span>
                </p>
                <Scores t={`${m.technicalRating}/10`} c={`${m.communicationRating}/10`} co={`${m.codingRating}/10`} />
                {m.remarks && <p className={`text-xs italic mt-1 ${muted}`}>"{m.remarks}"</p>}
              </div>
            ))}
          </div>
        </div>

        <div className={`${card}`}>
          <div className="p-4 border-b dark:border-slate-700 font-bold text-gray-900 dark:text-white">Attendance history ({d.attendance.length})</div>
          <div className="divide-y dark:divide-slate-700 max-h-72 overflow-y-auto">
            {d.attendance.length === 0 && <p className={`p-6 text-center text-sm ${muted}`}>No attendance marked yet.</p>}
            {d.attendance.map((a, i) => (
              <div key={i} className="p-3 flex justify-between text-sm text-gray-800 dark:text-gray-200">
                <span>{a.subject} <span className="text-xs text-gray-400">({a.batchCode})</span></span>
                <span className={muted}>{a.date}, {new Date(a.markedAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
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
          <p className={`text-xs ${muted}`}>
            {batch.batchCode}
            {batch.trainerName ? `, trainer ${batch.trainerName}` : ''}
          </p>
          {!isUnassigned && (
            <div className="flex gap-2 mt-4">
              {[['students', 'Students'], ['mocks', 'Mock history']].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => (key === 'mocks' ? showMocks() : setTab('students'))}
                  className={`px-4 py-2 rounded-lg text-sm font-bold ${
                    tab === key ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {tab === 'students' && (
          <div className={`${card} overflow-x-auto`}>
            {!students ? (
              <p className={`p-8 text-center ${muted}`}>Loading students...</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className={`${muted} border-b dark:border-slate-700`}>
                  <tr>
                    <th className="p-3">Student</th>
                    {!isUnassigned && <th className="p-3">Attendance</th>}
                    <th className="p-3">Assignments</th>
                    {!isUnassigned && <th className="p-3">Mocks</th>}
                    {/* NEW: Move Batch Column for Admins */}
                    {isAdmin && <th className="p-3">Move Batch</th>}
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-700 text-gray-800 dark:text-gray-200">
                  {students.students.length === 0 && (
                    <tr><td colSpan={isAdmin ? "6" : "5"} className={`p-8 text-center ${muted}`}>
                      {isUnassigned ? 'Every student is in a batch.' : 'No students yet. They appear here after scanning attendance for this batch.'}
                    </td></tr>
                  )}
                  {students.students.map((s) => (
                    <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <td className="p-3">
                        <div className="font-semibold">{s.name}</div>
                        <div className="text-xs text-gray-400">{s.email}</div>
                      </td>
                      {!isUnassigned && <td className="p-3">{s.attended} / {students.totalClasses}</td>}
                      <td className="p-3">
                        {s.assignmentsAnswered} answered, {s.assignmentMarks} marks
                        {s.assignmentsPending > 0 && <span className="text-orange-500 text-xs"> ({s.assignmentsPending} pending)</span>}
                      </td>
                      {!isUnassigned && (
                        <td className="p-3">
                          {s.mocks === 0 ? <span className="text-gray-400">None</span> : (
                            <>
                              {s.mocks} mock{s.mocks > 1 ? 's' : ''}
                              <div><Scores t={s.avgTechnical} c={s.avgCommunication} co={s.avgCoding} /></div>
                            </>
                          )}
                        </td>
                      )}
                      
                      {/* NEW: Move Student Dropdown for Admins */}
                      {isAdmin && (
                        <td className="p-3">
                          <div className="flex flex-col gap-1 w-32">
                            <select 
                              id={`move-batch-${s._id}`}
                              defaultValue=""
                              className="p-1 border rounded text-xs bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="" disabled>Select new batch...</option>
                              {list.batches.map(b => (
                                <option key={b._id} value={b._id} disabled={!isUnassigned && batch._id === b._id}>
                                  {b.subject} ({b.batchCode})
                                </option>
                              ))}
                            </select>
                            <button 
                              onClick={() => {
                                const newBatchId = document.getElementById(`move-batch-${s._id}`).value;
                                handleMoveStudent(s._id, batch._id, newBatchId);
                              }}
                              className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-blue-700 transition"
                            >
                              Move
                            </button>
                          </div>
                        </td>
                      )}

                      <td className="p-3 text-right">
                        <button type="button" onClick={() => openStudent(s._id)} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                          Full history
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

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
          ? 'All batches. Students appear in a batch after they scan attendance for it.'
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
            <p className={`text-xs ${muted} mt-1`}>These students have not scanned attendance yet.</p>
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