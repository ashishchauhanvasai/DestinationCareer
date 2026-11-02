import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
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
  FiX,
  FiCheckCircle
} from "react-icons/fi";

const API = `${process.env.REACT_APP_API_URL}/api`;

const cfg = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// Upgraded Glass StatCard
const StatCard = ({ icon: Icon, label, value }) => (
  <div className="glass-panel rounded-[1.5rem] p-6 flex items-center gap-5 hover:-translate-y-1 transition-all duration-300">
    <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-inner">
      <Icon className="text-blue-600 dark:text-blue-400 text-2xl" />
    </div>
    <div>
      <div className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{value}</div>
      <div className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">{label}</div>
    </div>
  </div>
);

const AdminUsers = () => {
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState("student");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  
  // BULK SELECTION STATE
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Batches for the dropdown
  const [batches, setBatches] = useState([]);

  // Modals State
  const [editingStudent, setEditingStudent] = useState(null);
  const [movingStudent, setMovingStudent] = useState(null); 

  const [profileForm, setProfileForm] = useState({
    highestQualification: "",
    passingYear: "",
    percentage: 0,
    backlogs: 0,
    educationGap: 0,
    readyForRelocation: false,
    skillsAcquired: "",
    profileLocked: false,
  });

  const loadStats = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/users/stats`, cfg());
      setStats(r.data);
    } catch (e) {
      console.error("Failed to load stats:", e);
    }
  }, []);

  const loadBatches = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/batches`, cfg());
      setBatches(r.data);
    } catch (e) {
      console.error("Failed to load batches:", e);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadBatches();
  }, [loadStats, loadBatches]);

  const loadUsers = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/users`, {
        ...cfg(),
        params: {
          role: tab,
          search: search || undefined,
        },
      });
      setUsers(r.data);
      setSelectedUserIds([]);
    } catch (e) {
      console.error("Failed to load users:", e);
    }
  }, [tab, search]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadUsers();
    }, 300);
    return () => clearTimeout(t);
  }, [loadUsers]);

  const del = async (u) => {
    if (!window.confirm(`Remove ${u.name} (${u.email})? This cannot be undone.`)) {
      return;
    }
    try {
      await axios.delete(`${API}/users/${u._id}`, cfg());
      await loadUsers();
      await loadStats();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove user");
    }
  };

  const openEditModal = (user) => {
    setEditingStudent(user);
    setProfileForm({
      highestQualification: user.highestQualification || "",
      passingYear: user.passingYear || "",
      percentage: user.percentage || 0,
      backlogs: user.backlogs || 0,
      educationGap: user.educationGap || 0,
      readyForRelocation: user.readyForRelocation || false,
      skillsAcquired: user.skillsAcquired || "",
      profileLocked: user.profileLocked || false,
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API}/users/${editingStudent._id}/admin-edit-profile`, profileForm, cfg());
      alert("Student profile updated successfully!");
      setUsers((prevUsers) => prevUsers.map((u) => (u._id === editingStudent._id ? res.data : u)));
      setEditingStudent(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleApproveDevice = async (userId) => {
    if (!window.confirm("Approve this new device? The student's old device will be logged out instantly.")) {
      return;
    }
    try {
      await axios.put(`${API}/users/${userId}/approve-device`, {}, cfg());
      alert("Device approved successfully!");
      await loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve device");
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUserIds(users.map((u) => u._id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectUser = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((userId) => userId !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = async () => {
    if (!window.confirm(`Approve ${selectedUserIds.length} users? Approval emails will be sent to all of them.`)) {
      return;
    }
    try {
      const response = await axios.put(
        `${API}/users/bulk-approve`,
        { userIds: selectedUserIds },
        cfg()
      );
      
      alert(`✅ Successfully approved ${response.data.approvedCount} users! Approval emails have been sent.`);
      setSelectedUserIds([]);
      await loadUsers();
      await loadStats();
    } catch (error) {
      console.error('Bulk approval failed:', error);
      alert(error.response?.data?.message || 'Failed to approve users. Please try again.');
    }
  };

  const handleBulkApproveDevices = async () => {
    if (!window.confirm(`Approve new devices for ${selectedUserIds.length} students?`)) return;
    try {
      await axios.put(`${API}/users/bulk-approve-device`, { userIds: selectedUserIds }, cfg());
      alert("Devices approved successfully!");
      setSelectedUserIds([]);
      await loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve devices in bulk");
    }
  };

  const confirmMoveBatch = async () => {
    const newBatchId = document.getElementById('new-batch-select').value;
    if (!newBatchId) {
      alert("Please select a new batch from the dropdown.");
      return;
    }

    try {
      if (movingStudent === "BULK") {
        await axios.put(`${API}/staff/batches/bulk-change-student`, {
          studentIds: selectedUserIds,
          oldBatchId: "IGNORE",
          newBatchId
        }, cfg());
        alert(`${selectedUserIds.length} students have been successfully moved!`);
        setSelectedUserIds([]);
      } else {
        const hist = await axios.get(`${API}/staff/students/${movingStudent._id}/history`, cfg());
        const currentBatches = hist.data.batches || [];
        const oldBatchId = currentBatches.length > 0 ? currentBatches[0]._id : "000000000000000000000000";

        await axios.put(`${API}/staff/batches/change-student`, {
          studentId: movingStudent._id,
          oldBatchId,
          newBatchId
        }, cfg());
        alert(`${movingStudent.name} has been successfully moved to the new batch!`);
      }
      setMovingStudent(null);
      await loadUsers();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to move student(s)");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Title */}
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl backdrop-blur-md border border-blue-500/20 shadow-sm">
          <FiUsers className="text-blue-600 dark:text-blue-400" size={26} />
        </div>
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Manage Users</h2>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">View or manage registered users.</p>
        </div>
      </div>

      {/* Statistics (Glassmorphism) */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={FiUsers} label="Total Students" value={stats.students ?? 0} />
          <StatCard icon={FiBriefcase} label="Total Trainers" value={stats.trainers ?? 0} />
          <StatCard icon={FiShield} label="Total Admins" value={stats.admins ?? 0} />
          <StatCard icon={FiClock} label="Pending Users" value={stats.pending ?? 0} />
        </div>
      )}

      {/* Tabs + Search (Glass Panel) */}
      <div className="glass-panel rounded-[2rem] p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex bg-black/5 dark:bg-white/5 p-1.5 rounded-2xl shadow-inner border border-black/5 dark:border-white/5 overflow-x-auto custom-scrollbar">
          {[
            { v: "student", l: "Students" },
            { v: "trainer", l: "Trainers" },
            { v: "promotional", l: "Promo Team" },
            { v: "admin", l: "Admins" },
          ].map((t) => (
            <button
              key={t.v}
              onClick={() => setTab(t.v)}
              className={`px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-300 whitespace-nowrap ${
                tab === t.v
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-white/50 dark:border-slate-700/50 backdrop-blur-md"
                  : "text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="apple-input pl-11 shadow-sm"
          />
        </div>
      </div>

      {/* BULK ACTIONS BAR */}
      {selectedUserIds.length > 0 && (
        <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between shadow-lg border-blue-500/30 dark:border-blue-400/30 gap-4 animate-fade-in bg-blue-50/80 dark:bg-blue-900/20">
          <span className="text-blue-800 dark:text-blue-300 font-extrabold text-sm pl-2">
            {selectedUserIds.length} user(s) selected
          </span>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleBulkApprove}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all"
            >
              Approve Accounts
            </button>
            
            {tab === "student" && (
              <>
                <button
                  onClick={() => setMovingStudent("BULK")}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all"
                >
                  Move Selected to Batch
                </button>
                <button
                  onClick={handleBulkApproveDevices}
                  className="bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all"
                >
                  Approve Devices
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Users Table (Glass Panel) */}
      <div className="glass-panel rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/5">
              <tr>
                <th className="px-6 py-4 w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4 cursor-pointer accent-blue-600 rounded"
                    checked={users.length > 0 && selectedUserIds.length === users.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="text-left px-6 py-4 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest">User</th>
                <th className="text-left px-6 py-4 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Email</th>
                {tab === "student" && <th className="text-left px-6 py-4 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Profile</th>}
                <th className="text-left px-6 py-4 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Status</th>
                <th className="text-center px-6 py-4 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Role</th>
                <th className="text-right px-6 py-4 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={tab === "student" ? 7 : 6} className="text-center py-16 text-gray-500 dark:text-gray-400 font-medium text-lg">
                    No {tab}s found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="w-4 h-4 cursor-pointer accent-blue-600 rounded"
                        checked={selectedUserIds.includes(u._id)}
                        onChange={() => handleSelectUser(u._id)}
                      />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img 
                          src={u.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                          alt="DP" 
                          className="w-10 h-10 rounded-full object-cover border-2 border-white/60 shadow-sm"
                        />
                        <div className="font-extrabold text-gray-900 dark:text-white text-base">{u.name}</div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-gray-600 dark:text-gray-300">{u.email}</td>

                    {tab === "student" && (
                      <td className="px-6 py-4">
                        {u.profileLocked ? (
                          <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                            <FiLock size={12} /> Locked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                            <FiUnlock size={12} /> Editable
                          </span>
                        )}
                      </td>
                    )}

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shadow-sm border ${
                          u.status === "approved"
                            ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                            : u.status === "pending"
                            ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                            : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                        }`}
                      >
                        {u.status || "N/A"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border shadow-sm ${
                        u.role === 'superadmin' ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20' :
                        u.role === 'admin' ? 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20' :
                        u.role === 'promotional' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20' :
                        u.role === 'trainer' ? 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20' :
                        'bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-black/5 dark:border-white/5'
                      }`}>
                        {u.role === 'promotional' ? 'Promo Team' : u.role}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2.5">
                        {tab === "student" && (
                          <>
                            <button
                              onClick={() => setMovingStudent(u)}
                              className="text-orange-600 dark:text-orange-400 hover:text-white bg-orange-500/10 hover:bg-orange-500 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border border-orange-500/20 transition-all shadow-sm"
                              title="Move to another batch"
                            >
                              Change Batch
                            </button>

                            <button
                              onClick={() => openEditModal(u)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-600 hover:text-white border border-blue-500/20 transition-all shadow-sm"
                              title="Edit Student Profile"
                            >
                              <FiEdit size={14} />
                            </button>

                            {(u.desktopChangeRequested || u.mobileChangeRequested) && (
                              <button
                                onClick={() => handleApproveDevice(u._id)}
                                className="text-white bg-gradient-to-br from-purple-500 to-fuchsia-600 hover:from-purple-400 hover:to-fuchsia-500 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-lg shadow-md transition-all"
                                title="Approve New Device Login"
                              >
                                Approve {u.desktopChangeRequested && u.mobileChangeRequested ? "Devices" : u.desktopChangeRequested ? "Desktop" : "Mobile"}
                              </button>
                            )}
                          </>
                        )}
                        {u.role !== 'superadmin' && (
                          <button
                            onClick={() => del(u)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 dark:text-red-400 bg-red-500/10 hover:bg-red-600 hover:text-white border border-red-500/20 transition-all shadow-sm opacity-0 group-hover:opacity-100"
                            title="Remove user"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOVE BATCH MODAL (Frosted Glass) */}
      {movingStudent && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-[2rem] shadow-2xl w-full max-w-md">
            <div className="relative p-8 border-b border-black/5 dark:border-white/5">
              <button onClick={() => setMovingStudent(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-black/5 p-2 rounded-full"><FiX size={18} /></button>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {movingStudent === "BULK" ? "Bulk Move Students" : "Change Student Batch"}
              </h2>
              
              <div className="flex items-center gap-4 mt-6 p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                {movingStudent === "BULK" ? (
                  <div className="flex items-center justify-center w-14 h-14 bg-blue-500/20 text-blue-600 rounded-2xl border border-blue-500/20"><FiUsers size={28} /></div>
                ) : (
                  <img src={movingStudent.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="dp" className="w-14 h-14 rounded-2xl object-cover shadow-sm bg-white border border-gray-200" />
                )}
                <div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-widest mb-0.5">Moving</p>
                  <p className="font-extrabold text-lg text-gray-900 dark:text-white">{movingStudent === "BULK" ? `${selectedUserIds.length} Selected Students` : movingStudent.name}</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Select New Batch</label>
                <select id="new-batch-select" className="apple-input cursor-pointer">
                  <option value="">-- Choose a Batch --</option>
                  {batches.map((b) => <option key={b._id} value={b._id}>{b.subject} ({b.batchCode})</option>)}
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

      {/* EDIT PROFILE MODAL (Frosted Glass) */}
      {editingStudent && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="relative p-8 border-b border-black/5 dark:border-white/5">
              <button onClick={() => setEditingStudent(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-black/5 p-2 rounded-full"><FiX size={18} /></button>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Edit Student Profile</h2>
              
              <div className="flex items-center gap-5 mt-6 mb-2 p-5 bg-black/5 dark:bg-white/5 rounded-[1.5rem] border border-black/5 dark:border-white/5">
                <img src={editingStudent.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="dp" className="w-16 h-16 rounded-2xl object-cover shadow-sm bg-white border border-gray-200" />
                <div>
                  <h3 className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight mb-0.5">{editingStudent.name}</h3>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{editingStudent.email}</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleProfileSubmit} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div><label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Highest Qual.</label><input type="text" value={profileForm.highestQualification} onChange={(e) => setProfileForm({ ...profileForm, highestQualification: e.target.value })} className="apple-input" /></div>
                <div><label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Passing Year</label><input type="text" value={profileForm.passingYear} onChange={(e) => setProfileForm({ ...profileForm, passingYear: e.target.value })} className="apple-input" /></div>
                <div><label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Percentage / CGPA</label><input type="number" step="0.01" value={profileForm.percentage} onChange={(e) => setProfileForm({ ...profileForm, percentage: e.target.value })} className="apple-input" /></div>
                <div><label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Backlogs</label><input type="number" value={profileForm.backlogs} onChange={(e) => setProfileForm({ ...profileForm, backlogs: e.target.value })} className="apple-input" /></div>
                <div><label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Education Gap (Yrs)</label><input type="number" value={profileForm.educationGap} onChange={(e) => setProfileForm({ ...profileForm, educationGap: e.target.value })} className="apple-input" /></div>
                <div className="flex items-center gap-3 mt-6 pl-2">
                  <input type="checkbox" checked={profileForm.readyForRelocation} onChange={(e) => setProfileForm({ ...profileForm, readyForRelocation: e.target.checked })} className="w-5 h-5 cursor-pointer accent-blue-600 rounded" />
                  <label className="text-sm font-extrabold text-gray-700 dark:text-gray-300">Ready for Relocation</label>
                </div>
              </div>
              
              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Skills (Comma separated)</label>
                <input type="text" value={profileForm.skillsAcquired} onChange={(e) => setProfileForm({ ...profileForm, skillsAcquired: e.target.value })} className="apple-input" placeholder="Java, SQL, React, HTML" />
              </div>
              
              <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-5 flex items-center justify-between mt-6 shadow-inner">
                <div>
                  <div className="font-extrabold text-gray-800 dark:text-gray-200 text-base">Profile Lock Status</div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">Turn this off if the student needs to edit their profile again.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={profileForm.profileLocked} onChange={(e) => setProfileForm({ ...profileForm, profileLocked: e.target.checked })} />
                  <div className="w-12 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                </label>
              </div>
              
              <div className="flex gap-4 pt-6 border-t border-black/5 dark:border-white/5">
                <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-extrabold hover:scale-[0.98] transition-transform shadow-lg shadow-blue-500/30 text-[15px]">Save Changes</button>
                <button type="button" onClick={() => setEditingStudent(null)} className="flex-1 glass-button py-3.5 rounded-xl font-extrabold text-gray-700 dark:text-gray-300 text-[15px]">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;