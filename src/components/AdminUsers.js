// // import React, { useState, useEffect, useCallback } from 'react';
// // import axios from 'axios';
// // import { FiTrash2, FiSearch, FiUsers, FiShield, FiBriefcase, FiClock } from 'react-icons/fi';

// // const API = 'http://localhost:5000/api';
// // const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

// // const StatCard = ({ icon: Icon, label, value }) => (
// //   <div className="bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4">
// //     <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><Icon size={20} /></div>
// //     <div>
// //       <p className="text-2xl font-bold text-gray-900">{value}</p>
// //       <p className="text-xs text-gray-500 font-semibold uppercase">{label}</p>
// //     </div>
// //   </div>
// // );

// // const AdminUsers = () => {
// //   const [stats, setStats] = useState(null);
// //   const [tab, setTab] = useState('student');
// //   const [search, setSearch] = useState('');
// //   const [users, setUsers] = useState([]);

// //   useEffect(() => {
// //     axios.get(`${API}/users/stats`, cfg()).then((r) => setStats(r.data)).catch((e) => console.error(e));
// //   }, []);

// //   const loadUsers = useCallback(async () => {
// //     try {
// //       const r = await axios.get(`${API}/users`, { ...cfg(), params: { role: tab, search: search || undefined } });
// //       setUsers(r.data);
// //     } catch (e) { console.error(e); }
// //   }, [tab, search]);

// //   useEffect(() => {
// //     const t = setTimeout(loadUsers, 300); // debounce search
// //     return () => clearTimeout(t);
// //   }, [loadUsers]);

// //   const del = async (u) => {
// //     if (!window.confirm(`Remove ${u.name} (${u.email})? This cannot be undone.`)) return;
// //     try {
// //       await axios.delete(`${API}/users/${u._id}`, cfg());
// //       loadUsers();
// //       const s = await axios.get(`${API}/users/stats`, cfg());
// //       setStats(s.data);
// //     } catch (err) { alert(err.response?.data?.message || 'Failed to remove user'); }
// //   };

// //   return (
// //     <div className="space-y-6">
// //       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
// //         <StatCard icon={FiUsers} label="Students" value={stats?.students ?? '—'} />
// //         <StatCard icon={FiBriefcase} label="Trainers" value={stats?.trainers ?? '—'} />
// //         <StatCard icon={FiShield} label="Admins" value={stats?.admins ?? '—'} />
// //         <StatCard icon={FiClock} label="Pending Approvals" value={stats?.pending ?? '—'} />
// //       </div>

// //       <div className="bg-white rounded-2xl border shadow-sm">
// //         <div className="flex items-center justify-between p-4 border-b flex-wrap gap-3">
// //           <div className="flex gap-2">
// //             {[{ v: 'student', l: 'Students' }, { v: 'trainer', l: 'Trainers' }, { v: 'admin', l: 'Admins' }].map((t) => (
// //               <button key={t.v} onClick={() => setTab(t.v)} className={`px-4 py-1.5 rounded-lg text-sm font-bold ${tab === t.v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
// //                 {t.l}
// //               </button>
// //             ))}
// //           </div>
// //           <div className="relative">
// //             <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
// //             <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email" className="pl-9 pr-3 py-2 border rounded-lg text-sm w-64" />
// //           </div>
// //         </div>

// //         <div className="divide-y">
// //           {users.length === 0 && <p className="p-8 text-center text-gray-500 text-sm">No {tab}s found.</p>}
// //           {users.map((u) => (
// //             <div key={u._id} className="p-4 flex justify-between items-center">
// //               <div>
// //                 <p className="font-semibold text-sm">{u.name}</p>
// //                 <p className="text-xs text-gray-500">{u.email}</p>
// //               </div>
// //               <div className="flex items-center gap-3">
// //                 <span className={`text-xs font-bold px-2 py-0.5 rounded ${u.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-700'}`}>{u.status}</span>
// //                 <button onClick={() => del(u)} className="text-red-500 hover:text-red-700 p-2" title="Remove user">
// //                   <FiTrash2 size={18} />
// //                 </button>
// //               </div>
// //             </div>
// //           ))}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };
// // export default AdminUsers;

// import React, { useState, useEffect, useCallback } from 'react';
// import axios from 'axios';
// import {
//   FiTrash2,
//   FiSearch,
//   FiUsers,
//   FiShield,
//   FiBriefcase,
//   FiClock,
//   FiEdit,
//   FiLock,
//   FiUnlock,
//   FiX
// } from 'react-icons/fi';

// const API = 'http://localhost:5000/api';

// const cfg = () => ({
//   headers: {
//     Authorization: `Bearer ${localStorage.getItem('token')}`
//   }
// });

// const StatCard = ({ icon: Icon, label, value }) => (
//   <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4">
//     <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
//       <Icon size={22} />
//     </div>

//     <div>
//       <div className="text-2xl font-bold text-gray-800">{value}</div>
//       <div className="text-sm text-gray-500">{label}</div>
//     </div>
//   </div>
// );

// const AdminUsers = () => {
//   const [stats, setStats] = useState(null);
//   const [tab, setTab] = useState('student');
//   const [search, setSearch] = useState('');
//   const [users, setUsers] = useState([]);

//   // Modal State for Editing Profile
//   const [editingStudent, setEditingStudent] = useState(null);

//   const [profileForm, setProfileForm] = useState({
//     highestQualification: '',
//     passingYear: '',
//     percentage: 0,
//     backlogs: 0,
//     educationGap: 0,
//     readyForRelocation: false,
//     skillsAcquired: '',
//     profileLocked: false
//   });

//   useEffect(() => {
//     axios
//       .get(`${API}/users/stats`, cfg())
//       .then((r) => setStats(r.data))
//       .catch((e) => console.error(e));
//   }, []);

//   const loadUsers = useCallback(async () => {
//     try {
//       const r = await axios.get(`${API}/users`, {
//         ...cfg(),
//         params: {
//           role: tab,
//           search: search || undefined
//         }
//       });

//       setUsers(r.data);
//     } catch (e) {
//       console.error(e);
//     }
//   }, [tab, search]);

//   useEffect(() => {
//     const t = setTimeout(loadUsers, 300);

//     // debounce search
//     return () => clearTimeout(t);
//   }, [loadUsers]);

//   const del = async (u) => {
//     if (
//       !window.confirm(
//         `Remove ${u.name} (${u.email})? This cannot be undone.`
//       )
//     ) {
//       return;
//     }

//     try {
//       await axios.delete(`${API}/users/${u._id}`, cfg());

//       loadUsers();

//       const s = await axios.get(`${API}/users/stats`, cfg());
//       setStats(s.data);
//     } catch (err) {
//       alert(err.response?.data?.message || 'Failed to remove user');
//     }
//   };

//   // Open Edit Modal & Populate Data
//   const openEditModal = (user) => {
//     setEditingStudent(user);

//     setProfileForm({
//       highestQualification: user.highestQualification || '',
//       passingYear: user.passingYear || '',
//       percentage: user.percentage || 0,
//       backlogs: user.backlogs || 0,
//       educationGap: user.educationGap || 0,
//       readyForRelocation: user.readyForRelocation || false,
//       skillsAcquired: user.skillsAcquired || '',
//       profileLocked: user.profileLocked || false
//     });
//   };

//   // Submit Profile Edits
//   const handleProfileSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       const res = await axios.put(
//         `${API}/users/${editingStudent._id}/admin-edit-profile`,
//         profileForm,
//         cfg()
//       );

//       alert('Student profile updated successfully!');

//       // Update the user list locally so we don't have to refetch
//       setUsers(
//         users.map((u) =>
//           u._id === editingStudent._id ? res.data : u
//         )
//       );

//       setEditingStudent(null);
//     } catch (err) {
//       alert(
//         err.response?.data?.message || 'Failed to update profile'
//       );
//     }
//   };

//   return (
//     <div className="space-y-6">

//       {/* Stats */}
//       {stats && (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//           <StatCard
//             icon={FiUsers}
//             label="Total Students"
//             value={stats.students ?? 0}
//           />

//           <StatCard
//             icon={FiBriefcase}
//             label="Total Trainers"
//             value={stats.trainers ?? 0}
//           />

//           <StatCard
//             icon={FiShield}
//             label="Total Admins"
//             value={stats.admins ?? 0}
//           />

//           <StatCard
//             icon={FiClock}
//             label="Pending Users"
//             value={stats.pending ?? 0}
//           />
//         </div>
//       )}

//       {/* Tabs */}
//       <div className="flex flex-wrap gap-2">
//         {[
//           { v: 'student', l: 'Students' },
//           { v: 'trainer', l: 'Trainers' },
//           { v: 'admin', l: 'Admins' }
//         ].map((t) => (
//           <button
//             key={t.v}
//             onClick={() => setTab(t.v)}
//             className={`px-4 py-1.5 rounded-lg text-sm font-bold ${
//               tab === t.v
//                 ? 'bg-blue-600 text-white'
//                 : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//             }`}
//           >
//             {t.l}
//           </button>
//         ))}
//       </div>

//       {/* Search */}
//       <div className="relative">
//         <FiSearch
//           className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
//           size={18}
//         />

//         <input
//           type="text"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           placeholder="Search by name or email"
//           className="pl-9 pr-3 py-2 border rounded-lg text-sm w-64"
//         />
//       </div>

//       {/* Users List */}
//       <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
//         {users.length === 0 ? (
//           <div className="p-8 text-center text-gray-500">
//             No {tab}s found.
//           </div>
//         ) : (
//           <div className="divide-y">
//             {users.map((u) => (
//               <div
//                 key={u._id}
//                 className="p-4 flex items-center justify-between gap-4"
//               >
//                 <div className="flex items-center gap-4 min-w-0">
//                   <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
//                     {u.name?.charAt(0)?.toUpperCase() || 'U'}
//                   </div>

//                   <div className="min-w-0">
//                     <h3 className="font-bold text-gray-800">
//                       {u.name}
//                     </h3>

//                     <p className="text-sm text-gray-500 truncate">
//                       {u.email}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-3">

//                   {/* Show Profile Lock Status ONLY on the Students tab */}
//                   {tab === 'student' &&
//                     (u.profileLocked ? (
//                       <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold">
//                         <FiLock size={13} />
//                         Locked
//                       </span>
//                     ) : (
//                       <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">
//                         <FiUnlock size={13} />
//                         Editable
//                       </span>
//                     ))}

//                   <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-bold uppercase">
//                     {u.status}
//                   </span>

//                   {/* Show Edit Button ONLY on the Students tab */}
//                   {tab === 'student' && (
//                     <button
//                       onClick={() => openEditModal(u)}
//                       className="text-blue-500 hover:text-blue-700 p-2"
//                       title="Edit Student Profile"
//                     >
//                       <FiEdit size={18} />
//                     </button>
//                   )}

//                   <button
//                     onClick={() => del(u)}
//                     className="text-red-500 hover:text-red-700 p-2"
//                     title="Remove user"
//                   >
//                     <FiTrash2 size={18} />
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* --- EDIT PROFILE MODAL --- */}
//       {editingStudent && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
//           <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">

//             <button
//               onClick={() => setEditingStudent(null)}
//               className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2"
//             >
//               <FiX size={22} />
//             </button>

//             <h2 className="text-xl font-bold text-gray-800 mb-1">
//               Edit Student Profile
//             </h2>

//             <p className="text-sm text-gray-500 mb-6">
//               Editing details for {editingStudent.name}
//             </p>

//             <form onSubmit={handleProfileSubmit} className="space-y-4">

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

//                 <div>
//                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
//                     Highest Qualification
//                   </label>

//                   <input
//                     type="text"
//                     value={profileForm.highestQualification}
//                     onChange={(e) =>
//                       setProfileForm({
//                         ...profileForm,
//                         highestQualification: e.target.value
//                       })
//                     }
//                     className="w-full p-2 border rounded bg-gray-50"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
//                     Passing Year
//                   </label>

//                   <input
//                     type="text"
//                     value={profileForm.passingYear}
//                     onChange={(e) =>
//                       setProfileForm({
//                         ...profileForm,
//                         passingYear: e.target.value
//                       })
//                     }
//                     className="w-full p-2 border rounded bg-gray-50"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
//                     Percentage / CGPA
//                   </label>

//                   <input
//                     type="number"
//                     step="0.01"
//                     value={profileForm.percentage}
//                     onChange={(e) =>
//                       setProfileForm({
//                         ...profileForm,
//                         percentage: e.target.value
//                       })
//                     }
//                     className="w-full p-2 border rounded bg-gray-50"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
//                     Backlogs
//                   </label>

//                   <input
//                     type="number"
//                     value={profileForm.backlogs}
//                     onChange={(e) =>
//                       setProfileForm({
//                         ...profileForm,
//                         backlogs: e.target.value
//                       })
//                     }
//                     className="w-full p-2 border rounded bg-gray-50"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
//                     Education Gap (Yrs)
//                   </label>

//                   <input
//                     type="number"
//                     value={profileForm.educationGap}
//                     onChange={(e) =>
//                       setProfileForm({
//                         ...profileForm,
//                         educationGap: e.target.value
//                       })
//                     }
//                     className="w-full p-2 border rounded bg-gray-50"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
//                     Skills (Comma separated)
//                   </label>

//                   <input
//                     type="text"
//                     value={profileForm.skillsAcquired}
//                     onChange={(e) =>
//                       setProfileForm({
//                         ...profileForm,
//                         skillsAcquired: e.target.value
//                       })
//                     }
//                     className="w-full p-2 border rounded bg-gray-50"
//                   />
//                 </div>

//               </div>

//               {/* Ready for Relocation */}
//               <div className="p-4 bg-gray-50 rounded-lg border">
//                 <label className="flex items-center gap-3 cursor-pointer">
//                   <input
//                     type="checkbox"
//                     checked={profileForm.readyForRelocation}
//                     onChange={(e) =>
//                       setProfileForm({
//                         ...profileForm,
//                         readyForRelocation: e.target.checked
//                       })
//                     }
//                     className="w-4 h-4"
//                   />

//                   <span className="font-bold text-gray-700">
//                     Ready for Relocation
//                   </span>
//                 </label>
//               </div>

//               {/* Profile Lock Toggle inside Modal */}
//               <div className="p-4 bg-gray-50 rounded-lg border flex items-center justify-between">
//                 <div>
//                   <h4 className="font-bold text-gray-700">
//                     Profile Lock Status
//                   </h4>

//                   <p className="text-xs text-gray-500">
//                     Turn this off if the student needs to edit their profile again.
//                   </p>
//                 </div>

//                 <label className="relative inline-flex items-center cursor-pointer">
//                   <input
//                     type="checkbox"
//                     className="sr-only peer"
//                     checked={profileForm.profileLocked}
//                     onChange={(e) =>
//                       setProfileForm({
//                         ...profileForm,
//                         profileLocked: e.target.checked
//                       })
//                     }
//                   />

//                   <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//                 </label>
//               </div>

//               {/* Buttons */}
//               <div className="flex gap-3 pt-4 border-t">
//                 <button
//                   type="submit"
//                   className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
//                 >
//                   Save Changes
//                 </button>

//                 <button
//                   type="button"
//                   onClick={() => setEditingStudent(null)}
//                   className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-300 transition-colors"
//                 >
//                   Cancel
//                 </button>
//               </div>

//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AdminUsers;


import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  FiTrash2,
  FiSearch,
  FiUsers,
  FiShield,
  FiBriefcase,
  FiClock,
  FiEdit,
  FiLock,
  FiUnlock,
  FiX
} from 'react-icons/fi';

const API = 'http://localhost:5000/api';

const cfg = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
});

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
    <div className="p-3 bg-blue-50 rounded-xl">
      <Icon className="text-blue-600 text-xl" />
    </div>

    <div>
      <div className="text-2xl font-bold text-gray-800">
        {value}
      </div>

      <div className="text-sm text-gray-500">
        {label}
      </div>
    </div>
  </div>
);

const AdminUsers = () => {
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('student');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);

  // Modal State for Editing Profile
  const [editingStudent, setEditingStudent] = useState(null);

  const [profileForm, setProfileForm] = useState({
    highestQualification: '',
    passingYear: '',
    percentage: 0,
    backlogs: 0,
    educationGap: 0,
    readyForRelocation: false,
    skillsAcquired: '',
    profileLocked: false
  });

  // Load statistics
  const loadStats = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/users/stats`, cfg());
      setStats(r.data);
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Load users
  const loadUsers = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/users`, {
        ...cfg(),
        params: {
          role: tab,
          search: search || undefined
        }
      });

      setUsers(r.data);
    } catch (e) {
      console.error('Failed to load users:', e);
    }
  }, [tab, search]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadUsers();
    }, 300);

    return () => clearTimeout(t);
  }, [loadUsers]);

  // Delete user
  const del = async (u) => {
    if (
      !window.confirm(
        `Remove ${u.name} (${u.email})? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await axios.delete(`${API}/users/${u._id}`, cfg());

      await loadUsers();
      await loadStats();
    } catch (err) {
      alert(
        err.response?.data?.message ||
        'Failed to remove user'
      );
    }
  };

  // Open Edit Profile Modal
  const openEditModal = (user) => {
    setEditingStudent(user);

    setProfileForm({
      highestQualification: user.highestQualification || '',
      passingYear: user.passingYear || '',
      percentage: user.percentage || 0,
      backlogs: user.backlogs || 0,
      educationGap: user.educationGap || 0,
      readyForRelocation: user.readyForRelocation || false,
      skillsAcquired: user.skillsAcquired || '',
      profileLocked: user.profileLocked || false
    });
  };

  // Save Student Profile
  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.put(
        `${API}/users/${editingStudent._id}/admin-edit-profile`,
        profileForm,
        cfg()
      );

      alert('Student profile updated successfully!');

      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u._id === editingStudent._id ? res.data : u
        )
      );

      setEditingStudent(null);
    } catch (err) {
      alert(
        err.response?.data?.message ||
        'Failed to update profile'
      );
    }
  };

  // ---------------------------------------------------------
  // NEW: Approve Device Handler
  // ---------------------------------------------------------
  const handleApproveDevice = async (userId) => {
    if (
      !window.confirm(
        "Approve this new device? The student's old device will be logged out instantly."
      )
    ) {
      return;
    }

    try {
      await axios.put(
        `${API}/users/${userId}/approve-device`,
        {},
        cfg()
      );

      alert('Device approved successfully!');

      // Refresh users so the Approve Device button disappears
      await loadUsers();
    } catch (err) {
      console.error('Device approval error:', err);

      alert(
        err.response?.data?.message ||
        'Failed to approve device'
      );
    }
  };

  return (
    <div className="space-y-6">

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          <StatCard
            icon={FiUsers}
            label="Total Students"
            value={stats.students ?? 0}
          />

          <StatCard
            icon={FiBriefcase}
            label="Total Trainers"
            value={stats.trainers ?? 0}
          />

          <StatCard
            icon={FiShield}
            label="Total Admins"
            value={stats.admins ?? 0}
          />

          <StatCard
            icon={FiClock}
            label="Pending Users"
            value={stats.pending ?? 0}
          />

        </div>
      )}

      {/* Tabs + Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          {/* Tabs */}
          <div className="flex gap-2">

            {[
              { v: 'student', l: 'Students' },
              { v: 'trainer', l: 'Trainers' },
              { v: 'admin', l: 'Admins' }
            ].map((t) => (
              <button
                key={t.v}
                onClick={() => setTab(t.v)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                  tab === t.v
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.l}
              </button>
            ))}

          </div>

          {/* Search */}
          <div className="relative">

            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="pl-9 pr-3 py-2 border rounded-lg text-sm w-64"
            />

          </div>

        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-50 border-b">

              <tr>
                <th className="text-left px-5 py-3 font-bold text-gray-600">
                  Name
                </th>

                <th className="text-left px-5 py-3 font-bold text-gray-600">
                  Email
                </th>

                {tab === 'student' && (
                  <th className="text-left px-5 py-3 font-bold text-gray-600">
                    Profile
                  </th>
                )}

                <th className="text-left px-5 py-3 font-bold text-gray-600">
                  Status
                </th>

                <th className="text-right px-5 py-3 font-bold text-gray-600">
                  Actions
                </th>
              </tr>

            </thead>

            <tbody className="divide-y">

              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={tab === 'student' ? 5 : 4}
                    className="text-center py-10 text-gray-500"
                  >
                    No {tab}s found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u._id}
                    className="hover:bg-gray-50 transition-colors"
                  >

                    {/* Name */}
                    <td className="px-5 py-4">

                      <div className="font-semibold text-gray-800">
                        {u.name}
                      </div>

                    </td>

                    {/* Email */}
                    <td className="px-5 py-4 text-gray-600">
                      {u.email}
                    </td>

                    {/* Student Profile */}
                    {tab === 'student' && (
                      <td className="px-5 py-4">

                        {u.profileLocked ? (
                          <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-xs font-bold">
                            <FiLock />
                            Locked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-bold">
                            <FiUnlock />
                            Editable
                          </span>
                        )}

                      </td>
                    )}

                    {/* Status */}
                    <td className="px-5 py-4">

                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                          u.status === 'approved'
                            ? 'bg-green-50 text-green-600'
                            : u.status === 'pending'
                            ? 'bg-yellow-50 text-yellow-600'
                            : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {u.status || 'N/A'}
                      </span>

                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">

                      <div className="flex items-center justify-end gap-2">

                        {/* Student Edit */}
                        {tab === 'student' && (
                          <>
                            <button
                              onClick={() => openEditModal(u)}
                              className="text-blue-500 hover:text-blue-700 p-2 bg-blue-50 rounded"
                              title="Edit Student Profile"
                            >
                              <FiEdit />
                            </button>

                            {/* NEW: Approve Device Button */}
                            {u.deviceChangeRequested && (
                              <button
                                onClick={() =>
                                  handleApproveDevice(u._id)
                                }
                                className="text-white bg-purple-600 hover:bg-purple-700 px-3 py-1.5 text-xs font-bold rounded animate-pulse shadow-sm"
                                title="Approve New Device Login"
                              >
                                Approve Device
                              </button>
                            )}
                          </>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => del(u)}
                          className="text-red-500 hover:text-red-700 p-2"
                          title="Remove user"
                        >
                          <FiTrash2 />
                        </button>

                      </div>

                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* ---------------------------------------------------------
          EDIT PROFILE MODAL
      --------------------------------------------------------- */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="relative p-6 border-b">

              <button
                onClick={() => setEditingStudent(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2"
              >
                <FiX />
              </button>

              <h2 className="text-xl font-bold text-gray-800">
                Edit Student Profile
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Editing details for {editingStudent.name}
              </p>

            </div>

            {/* Form */}
            <form
              onSubmit={handleProfileSubmit}
              className="p-6 space-y-4"
            >

              {/* Highest Qualification */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Highest Qualification
                </label>

                <input
                  type="text"
                  value={profileForm.highestQualification}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      highestQualification: e.target.value
                    })
                  }
                  className="w-full p-2 border rounded bg-gray-50"
                />
              </div>

              {/* Passing Year */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Passing Year
                </label>

                <input
                  type="text"
                  value={profileForm.passingYear}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      passingYear: e.target.value
                    })
                  }
                  className="w-full p-2 border rounded bg-gray-50"
                />
              </div>

              {/* Percentage */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Percentage / CGPA
                </label>

                <input
                  type="number"
                  value={profileForm.percentage}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      percentage: e.target.value
                    })
                  }
                  className="w-full p-2 border rounded bg-gray-50"
                />
              </div>

              {/* Backlogs */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Backlogs
                </label>

                <input
                  type="number"
                  value={profileForm.backlogs}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      backlogs: e.target.value
                    })
                  }
                  className="w-full p-2 border rounded bg-gray-50"
                />
              </div>

              {/* Education Gap */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Education Gap (Yrs)
                </label>

                <input
                  type="number"
                  value={profileForm.educationGap}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      educationGap: e.target.value
                    })
                  }
                  className="w-full p-2 border rounded bg-gray-50"
                />
              </div>

              {/* Ready For Relocation */}
              <div className="flex items-center gap-3">

                <input
                  type="checkbox"
                  checked={profileForm.readyForRelocation}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      readyForRelocation: e.target.checked
                    })
                  }
                  className="w-4 h-4"
                />

                <label className="text-sm font-semibold text-gray-700">
                  Ready for Relocation
                </label>

              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Skills (Comma separated)
                </label>

                <input
                  type="text"
                  value={profileForm.skillsAcquired}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      skillsAcquired: e.target.value
                    })
                  }
                  className="w-full p-2 border rounded bg-gray-50"
                  placeholder="Java, SQL, React, HTML"
                />
              </div>

              {/* Profile Lock */}
              <div className="border rounded-lg p-4 bg-gray-50">

                <div className="flex items-center justify-between">

                  <div>
                    <div className="font-semibold text-gray-800">
                      Profile Lock Status
                    </div>

                    <p className="text-xs text-gray-500 mt-1">
                      Turn this off if the student needs to edit their profile again.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={profileForm.profileLocked}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        profileLocked: e.target.checked
                      })
                    }
                    className="w-5 h-5"
                  />

                </div>

              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">

                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>

                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};

export default AdminUsers;
