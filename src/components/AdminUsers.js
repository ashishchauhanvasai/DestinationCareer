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
  <div className="glass-panel rounded-[2rem] p-6 flex flex-col md:flex-row items-center md:items-start gap-4 hover:-translate-y-1 transition-all duration-300 shadow-sm border border-gray-200 dark:border-slate-700 text-center md:text-left">
    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-sm shrink-0">
      <Icon className="text-blue-600 dark:text-blue-400 text-2xl" />
    </div>
    <div className="w-full">
      <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">{value}</div>
      <div className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{label}</div>
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
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl border border-blue-500/20 shadow-sm shrink-0">
            <FiUsers className="text-blue-600 dark:text-blue-400" size={28} />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Manage Users</h2>
            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mt-1 opacity-90">View, edit, or manage registered user accounts globally.</p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 animate-fade-in">
          <StatCard icon={FiUsers} label="Total Students" value={stats.students ?? 0} />
          <StatCard icon={FiBriefcase} label="Total Trainers" value={stats.trainers ?? 0} />
          <StatCard icon={FiShield} label="Total Admins" value={stats.admins ?? 0} />
          <StatCard icon={FiClock} label="Pending Users" value={stats.pending ?? 0} />
        </div>
      )}

      {/* Tabs + Search */}
      <div className="glass-panel rounded-[2.5rem] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="flex bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl shadow-inner border border-gray-200 dark:border-slate-700 overflow-x-auto custom-scrollbar w-full lg:w-fit">
          {[
            { v: "student", l: "Students" },
            { v: "trainer", l: "Trainers" },
            { v: "promotional", l: "Promo Team" },
            { v: "admin", l: "Admins" },
          ].map((t) => (
            <button
              key={t.v}
              onClick={() => setTab(t.v)}
              className={`flex-1 lg:flex-none px-6 py-3 rounded-xl text-sm font-extrabold transition-all duration-300 whitespace-nowrap text-center ${
                tab === t.v
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md border border-gray-200 dark:border-slate-600"
                  : "text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-96 shrink-0">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="apple-input pl-11 shadow-sm font-bold text-[15px] py-3.5"
          />
        </div>
      </div>

      {/* BULK ACTIONS BAR */}
      {selectedUserIds.length > 0 && (
        <div className="glass-panel p-5 md:p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between shadow-lg border-blue-500/30 dark:border-blue-400/30 gap-5 animate-fade-in bg-blue-50 dark:bg-blue-900/20">
          <span className="text-blue-800 dark:text-blue-300 font-extrabold text-[15px] pl-2 tracking-tight">
            {selectedUserIds.length} user(s) selected
          </span>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full md:w-auto">
            <button
              onClick={handleBulkApprove}
              className="w-full sm:w-auto flex-1 sm:flex-none bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl text-xs font-extrabold shadow-md hover:scale-[0.98] transition-transform text-center"
            >
              Approve Accounts
            </button>
            
            {tab === "student" && (
              <>
                <button
                  onClick={() => setMovingStudent("BULK")}
                  className="w-full sm:w-auto flex-1 sm:flex-none bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl text-xs font-extrabold shadow-md hover:scale-[0.98] transition-transform text-center"
                >
                  Move Selected to Batch
                </button>
                <button
                  onClick={handleBulkApproveDevices}
                  className="w-full sm:w-auto flex-1 sm:flex-none bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white px-6 py-3 rounded-xl text-xs font-extrabold shadow-md hover:scale-[0.98] transition-transform text-center"
                >
                  Approve Devices
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="glass-panel rounded-[2.5rem] overflow-hidden shadow-sm">
        {users.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400 font-bold text-xl">
            No {tab}s found.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            {/* The block md:table structure ensures mobile layout becomes stacked cards instead of a squished table */}
            <table className="w-full text-sm block md:table text-left whitespace-nowrap">
              <thead className="hidden md:table-header-group bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-5 w-10">
                    <input
                      type="checkbox"
                      className="w-4 h-4 cursor-pointer accent-blue-600 rounded"
                      checked={users.length > 0 && selectedUserIds.length === users.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-5 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest">User & Email</th>
                  {tab === "student" && <th className="px-6 py-5 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">Profile</th>}
                  <th className="px-6 py-5 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-5 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">Role</th>
                  <th className="px-6 py-5 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="block md:table-row-group divide-y divide-gray-200 dark:divide-slate-700">
                {users.map((u) => (
                  <tr key={u._id} className="block md:table-row hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group p-4 md:p-0">
                    
                    <td className="px-2 md:px-6 py-2 md:py-5 flex items-center md:table-cell align-middle">
                      <input
                        type="checkbox"
                        className="w-4 h-4 cursor-pointer accent-blue-600 rounded mt-1 md:mt-0"
                        checked={selectedUserIds.includes(u._id)}
                        onChange={() => handleSelectUser(u._id)}
                      />
                    </td>

                    <td className="px-2 md:px-6 py-2 md:py-5 flex flex-col md:table-cell align-middle">
                      <div className="flex items-center gap-4">
                        <img 
                          src={u.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                          alt="DP" 
                          className="w-12 h-12 rounded-2xl object-cover border border-gray-200 dark:border-slate-700 shadow-sm bg-white shrink-0"
                        />
                        <div className="min-w-0">
                           <div className="font-extrabold text-gray-900 dark:text-white text-[15px] truncate">{u.name}</div>
                           <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-1 truncate">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {tab === "student" && (
                      <td className="px-2 md:px-6 py-2 md:py-5 flex items-center justify-between md:table-cell align-middle text-center">
                        <span className="md:hidden text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Profile:</span>
                        {u.profileLocked ? (
                          <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                            <FiLock size={12} /> Locked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-3 py-1.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                            <FiUnlock size={12} /> Editable
                          </span>
                        )}
                      </td>
                    )}

                    <td className="px-2 md:px-6 py-2 md:py-5 flex items-center justify-between md:table-cell align-middle text-center">
                      <span className="md:hidden text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Status:</span>
                      <span
                        className={`inline-flex px-3 py-1.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider shadow-sm border ${
                          u.status === "approved"
                            ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                            : u.status === "pending"
                            ? "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
                            : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
                        }`}
                      >
                        {u.status || "N/A"}
                      </span>
                    </td>

                    <td className="px-2 md:px-6 py-2 md:py-5 flex items-center justify-between md:table-cell align-middle text-center">
                      <span className="md:hidden text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Role:</span>
                      <span className={`px-3 py-1.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border shadow-sm ${
                        u.role === 'superadmin' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800' :
                        u.role === 'admin' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' :
                        u.role === 'promotional' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' :
                        u.role === 'trainer' ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800' :
                        'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700'
                      }`}>
                        {u.role === 'promotional' ? 'Promo Team' : u.role}
                      </span>
                    </td>

                    <td className="px-2 md:px-6 py-3 md:py-5 align-middle border-t border-gray-200 dark:border-slate-700 md:border-none mt-3 md:mt-0">
                      <div className="flex flex-wrap items-center justify-start md:justify-end gap-3">
                        {tab === "student" && (
                          <>
                            <button
                              onClick={() => setMovingStudent(u)}
                              className="flex-1 md:flex-none text-orange-600 dark:text-orange-400 hover:text-white bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-500 px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border border-orange-200 dark:border-orange-800 transition-all shadow-sm text-center"
                              title="Move to another batch"
                            >
                              Batch
                            </button>

                            <button
                              onClick={() => openEditModal(u)}
                              className="w-full md:w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-600 hover:text-white border border-blue-200 dark:border-blue-800 transition-all shadow-sm shrink-0"
                              title="Edit Student Profile"
                            >
                              <FiEdit size={16} />
                            </button>

                            {(u.desktopChangeRequested || u.mobileChangeRequested) && (
                              <button
                                onClick={() => handleApproveDevice(u._id)}
                                className="w-full md:w-auto text-white bg-gradient-to-br from-purple-500 to-fuchsia-600 hover:from-purple-400 hover:to-fuchsia-500 px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider rounded-xl shadow-md transition-all text-center"
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
                            className="w-full md:w-10 h-10 rounded-xl flex items-center justify-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-500 hover:text-white border border-red-200 dark:border-red-800 transition-all shadow-sm md:opacity-0 md:group-hover:opacity-100 shrink-0"
                            title="Remove user"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MOVE BATCH MODAL */}
      {movingStudent && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-panel rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden relative">
            <div className="p-8 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80">
              <button onClick={() => setMovingStudent(null)} className="absolute top-6 right-6 text-gray-500 hover:text-gray-700 bg-gray-200 dark:bg-slate-700 p-2.5 rounded-full border border-gray-300 dark:border-slate-600 shadow-sm transition-colors"><FiX size={18} /></button>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {movingStudent === "BULK" ? "Bulk Move Students" : "Change Student Batch"}
              </h2>
              
              <div className="flex items-center gap-5 mt-6 p-5 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-sm">
                {movingStudent === "BULK" ? (
                  <div className="flex items-center justify-center w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-200 dark:border-blue-800 shrink-0"><FiUsers size={32} /></div>
                ) : (
                  <img src={movingStudent.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="dp" className="w-16 h-16 rounded-2xl object-cover shadow-sm bg-white border border-gray-200 shrink-0" />
                )}
                <div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-widest mb-1">Moving</p>
                  <p className="font-black text-xl text-gray-900 dark:text-white leading-tight">{movingStudent === "BULK" ? `${selectedUserIds.length} Selected Students` : movingStudent.name}</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 space-y-6 bg-white dark:bg-slate-900">
              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 pl-1">Select New Batch</label>
                <select id="new-batch-select" className="apple-input cursor-pointer font-bold">
                  <option value="">-- Choose a Batch --</option>
                  {batches.map((b) => <option key={b._id} value={b._id}>{b.subject} ({b.batchCode})</option>)}
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button onClick={() => setMovingStudent(null)} className="flex-1 glass-button py-3.5 rounded-xl font-extrabold text-gray-700 dark:text-gray-300 text-[15px] border border-gray-300 dark:border-slate-600">
                  Cancel
                </button>
                <button onClick={confirmMoveBatch} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-extrabold shadow-lg shadow-blue-500/30 hover:scale-[0.98] transition-transform text-[15px]">
                  Confirm Move
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-panel rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative">
            <div className="p-6 md:p-8 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/90 shrink-0">
              <button onClick={() => setEditingStudent(null)} className="absolute top-6 right-6 text-gray-500 hover:text-gray-700 bg-gray-200 dark:bg-slate-700 p-2.5 rounded-full border border-gray-300 dark:border-slate-600 shadow-sm transition-colors z-10"><FiX size={18} /></button>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Edit Student Profile</h2>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-5 mt-6 p-5 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-sm">
                <img src={editingStudent.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="dp" className="w-16 h-16 rounded-2xl object-cover shadow-sm bg-white border border-gray-200 shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-extrabold text-2xl text-gray-900 dark:text-white tracking-tight mb-1 truncate">{editingStudent.name}</h3>
                  <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 truncate">{editingStudent.email}</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleProfileSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar bg-white dark:bg-[#1e293b] flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div><label className="block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Highest Qual.</label><input type="text" value={profileForm.highestQualification} onChange={(e) => setProfileForm({ ...profileForm, highestQualification: e.target.value })} className="apple-input" /></div>
                <div><label className="block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Passing Year</label><input type="text" value={profileForm.passingYear} onChange={(e) => setProfileForm({ ...profileForm, passingYear: e.target.value })} className="apple-input" /></div>
                <div><label className="block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Percentage / CGPA</label><input type="number" step="0.01" value={profileForm.percentage} onChange={(e) => setProfileForm({ ...profileForm, percentage: e.target.value })} className="apple-input" /></div>
                <div><label className="block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Backlogs</label><input type="number" value={profileForm.backlogs} onChange={(e) => setProfileForm({ ...profileForm, backlogs: e.target.value })} className="apple-input" /></div>
                <div><label className="block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Education Gap (Yrs)</label><input type="number" value={profileForm.educationGap} onChange={(e) => setProfileForm({ ...profileForm, educationGap: e.target.value })} className="apple-input" /></div>
                
                <div className="flex items-center gap-3 sm:mt-6 bg-gray-50 dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm h-[52px]">
                  <input type="checkbox" checked={profileForm.readyForRelocation} onChange={(e) => setProfileForm({ ...profileForm, readyForRelocation: e.target.checked })} className="w-5 h-5 cursor-pointer accent-blue-600 rounded ml-2 shrink-0" />
                  <label className="text-[13px] font-extrabold text-gray-800 dark:text-gray-200">Ready for Relocation</label>
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Skills (Comma separated)</label>
                <input type="text" value={profileForm.skillsAcquired} onChange={(e) => setProfileForm({ ...profileForm, skillsAcquired: e.target.value })} className="apple-input" placeholder="Java, SQL, React, HTML" />
              </div>
              
              <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 shadow-sm">
                <div>
                  <div className="font-extrabold text-gray-900 dark:text-white text-base">Profile Lock Status</div>
                  <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">Turn this off if the student needs to edit their profile again.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input type="checkbox" className="sr-only peer" checked={profileForm.profileLocked} onChange={(e) => setProfileForm({ ...profileForm, profileLocked: e.target.checked })} />
                  <div className="w-14 h-7 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                </label>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-slate-700">
                <button type="button" onClick={() => setEditingStudent(null)} className="flex-1 glass-button py-3.5 rounded-xl font-extrabold text-gray-700 dark:text-gray-300 text-[15px] border border-gray-300 dark:border-slate-600 order-2 sm:order-1">Cancel</button>
                <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-extrabold hover:scale-[0.98] transition-transform shadow-lg shadow-blue-500/30 text-[15px] order-1 sm:order-2">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;