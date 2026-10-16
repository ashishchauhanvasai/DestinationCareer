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
  FiUserPlus
} from "react-icons/fi";

const API = `${process.env.REACT_APP_API_URL}/api`;

const cfg = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
    <div className="p-3 bg-blue-50 rounded-xl">
      <Icon className="text-blue-600 text-xl" />
    </div>
    <div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
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
  const [movingStudent, setMovingStudent] = useState(null); // Used for both Single & Bulk move

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

  // =========================================================
  // NAYA: CREATE STAFF ACCOUNT STATE
  // =========================================================
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'promotional' // Default to Promotional
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
      // Clear selections when tab/search changes
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

  // =========================================================
  // NAYA: CHANGE ROLE & CREATE STAFF API CALLS
  // =========================================================
  const handleRoleChange = async (id, newRole) => {
    if (!window.confirm(`Change this user's role to ${newRole.toUpperCase()}?`)) return;
    try {
      await axios.put(`${API}/users/${id}/role`, { role: newRole }, cfg());
      loadUsers();
      alert("Role updated successfully!");
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/users/admin-create`, createForm, cfg());
      alert(`${createForm.role.toUpperCase()} account created successfully! They can login now.`);
      setCreateForm({ name: '', email: '', password: '', role: 'promotional' });
      setShowCreateForm(false);
      loadUsers();
      loadStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create account. Email might already exist.');
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

  // SINGLE DEVICE APPROVAL
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

  // =========================================================
  // BULK ACTIONS LOGIC
  // =========================================================
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

  // SINGLE & BULK BATCH MOVE
  const confirmMoveBatch = async () => {
    const newBatchId = document.getElementById('new-batch-select').value;
    if (!newBatchId) {
      alert("Please select a new batch from the dropdown.");
      return;
    }

    try {
      // Determine if it's a single move or bulk move based on movingStudent state
      if (movingStudent === "BULK") {
        await axios.put(`${API}/staff/batches/bulk-change-student`, {
          studentIds: selectedUserIds,
          oldBatchId: "IGNORE", // Backend uses bulk logic to delete old
          newBatchId
        }, cfg());
        alert(`${selectedUserIds.length} students have been successfully moved!`);
        setSelectedUserIds([]);
      } else {
        // SINGLE MOVE
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
    <div className="space-y-6">
      
      {/* NAYA: TITLE & CREATE ACCOUNT BUTTON */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manage Users</h2>
          <p className="text-sm text-gray-500 mt-1">View, delete, or change roles of registered users.</p>
        </div>
        
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition"
        >
          <FiUserPlus size={18} /> Create Staff Account
        </button>
      </div>

      {/* NAYA: CREATE STAFF ACCOUNT FORM */}
      {showCreateForm && (
        <form onSubmit={handleCreateStaff} className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Create Direct Account</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
              <input required type="text" value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-200" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email ID</label>
              <input required type="email" value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-200" placeholder="john@example.com" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
              <input required type="text" value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-200" placeholder="Set a password" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assign Role</label>
              <select value={createForm.role} onChange={e => setCreateForm({...createForm, role: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-200 bg-white font-bold text-blue-700">
                <option value="promotional">Promo Team</option>
                <option value="trainer">Trainer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-sm">
              Create & Approve Account
            </button>
          </div>
        </form>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FiUsers} label="Total Students" value={stats.students ?? 0} />
          <StatCard icon={FiBriefcase} label="Total Trainers" value={stats.trainers ?? 0} />
          <StatCard icon={FiShield} label="Total Admins" value={stats.admins ?? 0} />
          <StatCard icon={FiClock} label="Pending Users" value={stats.pending ?? 0} />
        </div>
      )}

      {/* Tabs + Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex gap-2 flex-wrap">
            {[
              { v: "student", l: "Students" },
              { v: "trainer", l: "Trainers" },
              { v: "promotional", l: "Promo Team" }, // <--- NAYA TAB
              { v: "admin", l: "Admins" },
            ].map((t) => (
              <button
                key={t.v}
                onClick={() => setTab(t.v)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                  tab === t.v
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t.l}
              </button>
            ))}
          </div>

          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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

      {/* BULK ACTIONS BAR */}
      {tab === "student" && selectedUserIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center justify-between shadow-sm animate-pulse">
          <span className="text-blue-800 font-bold text-sm">
            {selectedUserIds.length} student(s) selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setMovingStudent("BULK")}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition"
            >
              Move Selected to Batch
            </button>
            <button
              onClick={handleBulkApproveDevices}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition"
            >
              Approve Devices
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b">
              <tr>
                {/* BULK SELECT HEADER */}
                {tab === "student" && (
                  <th className="px-5 py-3 w-10">
                    <input
                      type="checkbox"
                      className="w-4 h-4 cursor-pointer accent-blue-600 rounded"
                      checked={users.length > 0 && selectedUserIds.length === users.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                )}
                <th className="text-left px-5 py-3 font-bold text-gray-600">User</th>
                <th className="text-left px-5 py-3 font-bold text-gray-600">Email</th>
                {tab === "student" && <th className="text-left px-5 py-3 font-bold text-gray-600">Profile</th>}
                <th className="text-left px-5 py-3 font-bold text-gray-600">Status</th>
                <th className="text-center px-5 py-3 font-bold text-gray-600">Role</th> {/* <--- NAYA COLUMN */}
                <th className="text-right px-5 py-3 font-bold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={tab === "student" ? 7 : 5} className="text-center py-10 text-gray-500">
                    No {tab}s found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    
                    {/* BULK SELECT ROW */}
                    {tab === "student" && (
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          className="w-4 h-4 cursor-pointer accent-blue-600 rounded"
                          checked={selectedUserIds.includes(u._id)}
                          onChange={() => handleSelectUser(u._id)}
                        />
                      </td>
                    )}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={u.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                          alt="DP" 
                          className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm bg-white"
                        />
                        <div className="font-semibold text-gray-800">{u.name}</div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-gray-600">{u.email}</td>

                    {tab === "student" && (
                      <td className="px-5 py-4">
                        {u.profileLocked ? (
                          <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-xs font-bold">
                            <FiLock /> Locked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-bold">
                            <FiUnlock /> Editable
                          </span>
                        )}
                      </td>
                    )}

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                          u.status === "approved"
                            ? "bg-green-50 text-green-600"
                            : u.status === "pending"
                            ? "bg-yellow-50 text-yellow-600"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {u.status || "N/A"}
                      </span>
                    </td>

                    {/* NAYA: ROLE DROPDOWN (Admin can change role directly) */}
                    <td className="px-5 py-4 text-center">
                      {u.role === 'superadmin' ? (
                        <span className="font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded text-xs">Super Admin</span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className={`p-1 border rounded-lg text-xs font-bold outline-none cursor-pointer ${
                            u.role === 'admin' ? 'bg-red-50 text-red-700 border-red-200' :
                            u.role === 'promotional' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            u.role === 'trainer' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          <option value="student">Student</option>
                          <option value="trainer">Trainer</option>
                          <option value="promotional">Promo Team</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {tab === "student" && (
                          <>
                            <button
                              onClick={() => setMovingStudent(u)}
                              className="text-orange-600 hover:text-orange-800 bg-orange-50 px-3 py-1.5 rounded text-xs font-bold border border-orange-200 transition"
                              title="Move to another batch"
                            >
                              Change Batch
                            </button>

                            <button
                              onClick={() => openEditModal(u)}
                              className="text-blue-500 hover:text-blue-700 p-2 bg-blue-50 rounded"
                              title="Edit Student Profile"
                            >
                              <FiEdit />
                            </button>

                            {(u.desktopChangeRequested || u.mobileChangeRequested) && (
                              <button
                                onClick={() => handleApproveDevice(u._id)}
                                className="text-white bg-purple-600 hover:bg-purple-700 px-3 py-1.5 text-xs font-bold rounded shadow-sm"
                                title="Approve New Device Login"
                              >
                                Approve {u.desktopChangeRequested && u.mobileChangeRequested ? "Devices" : u.desktopChangeRequested ? "Desktop" : "Mobile"}
                              </button>
                            )}
                          </>
                        )}
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

      {/* MOVE BATCH MODAL (Handles Single & Bulk) */}
      {movingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            
            <div className="relative p-6 border-b">
              <button
                onClick={() => setMovingStudent(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2"
              >
                <FiX />
              </button>
              <h2 className="text-xl font-bold text-gray-800">
                {movingStudent === "BULK" ? "Bulk Move Students" : "Change Student Batch"}
              </h2>
              
              <div className="flex items-center gap-3 mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                {movingStudent === "BULK" ? (
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full">
                    <FiUsers size={24} />
                  </div>
                ) : (
                  <img src={movingStudent.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="dp" className="w-12 h-12 rounded-full object-cover shadow-sm bg-white border border-gray-200" />
                )}
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Moving</p>
                  <p className="font-bold text-gray-800">
                    {movingStudent === "BULK" ? `${selectedUserIds.length} Selected Students` : movingStudent.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select New Batch
                </label>
                <select id="new-batch-select" className="w-full p-3 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Choose a Batch --</option>
                  {batches.map((b) => (
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
                  Confirm Move
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

      {/* EDIT PROFILE MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="relative p-6 border-b">
              <button
                onClick={() => setEditingStudent(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2"
              >
                <FiX />
              </button>
              <h2 className="text-xl font-bold text-gray-800">Edit Student Profile</h2>
              
              <div className="flex items-center gap-4 mt-4 mb-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <img src={editingStudent.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="dp" className="w-16 h-16 rounded-full object-cover shadow-sm bg-white border border-gray-200" />
                <div>
                  <h3 className="font-bold text-gray-800">{editingStudent.name}</h3>
                  <p className="text-sm text-gray-500">{editingStudent.email}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Highest Qualification</label>
                <input
                  type="text"
                  value={profileForm.highestQualification}
                  onChange={(e) => setProfileForm({ ...profileForm, highestQualification: e.target.value })}
                  className="w-full p-2 border rounded bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Passing Year</label>
                <input
                  type="text"
                  value={profileForm.passingYear}
                  onChange={(e) => setProfileForm({ ...profileForm, passingYear: e.target.value })}
                  className="w-full p-2 border rounded bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Percentage / CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  value={profileForm.percentage}
                  onChange={(e) => setProfileForm({ ...profileForm, percentage: e.target.value })}
                  className="w-full p-2 border rounded bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Backlogs</label>
                <input
                  type="number"
                  value={profileForm.backlogs}
                  onChange={(e) => setProfileForm({ ...profileForm, backlogs: e.target.value })}
                  className="w-full p-2 border rounded bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Education Gap (Yrs)</label>
                <input
                  type="number"
                  value={profileForm.educationGap}
                  onChange={(e) => setProfileForm({ ...profileForm, educationGap: e.target.value })}
                  className="w-full p-2 border rounded bg-gray-50"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={profileForm.readyForRelocation}
                  onChange={(e) => setProfileForm({ ...profileForm, readyForRelocation: e.target.checked })}
                  className="w-4 h-4 cursor-pointer"
                />
                <label className="text-sm font-semibold text-gray-700">Ready for Relocation</label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Skills (Comma separated)</label>
                <input
                  type="text"
                  value={profileForm.skillsAcquired}
                  onChange={(e) => setProfileForm({ ...profileForm, skillsAcquired: e.target.value })}
                  className="w-full p-2 border rounded bg-gray-50"
                  placeholder="Java, SQL, React, HTML"
                />
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-800">Profile Lock Status</div>
                    <p className="text-xs text-gray-500 mt-1">Turn this off if the student needs to edit their profile again.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={profileForm.profileLocked}
                    onChange={(e) => setProfileForm({ ...profileForm, profileLocked: e.target.checked })}
                    className="w-5 h-5 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
                <button type="button" onClick={() => setEditingStudent(null)} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-300 transition-colors">
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