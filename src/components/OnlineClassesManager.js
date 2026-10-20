 import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  FiVideo, FiPlus, FiShare2, FiEdit, FiTrash2, FiClock,
  FiUser, FiUsers, FiCheckCircle, FiPlay, FiX
} from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api/online-classes`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const OnlineClassesManager = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
 const isAdmin = ['admin', 'superadmin', 'trainer'].includes(role);

  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [form, setForm] = useState({
    title: '',
    batchCode: '',
    subject: '',
    trainerId: '',
    scheduledTime: '',
    durationMinutes: 60
  });

  // Attendance Viewer Modal
  const [viewingAttendance, setViewingAttendance] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchClasses = async () => {
    try {
      const res = await axios.get(API, cfg());
      setClasses(res.data.classes || []);
      setTrainers(res.data.trainers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const openCreateModal = () => {
    setEditingClass(null);
    setForm({
      title: '',
      batchCode: `LIVE-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: '',
      trainerId: '',
      scheduledTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
      durationMinutes: 60
    });
    setShowModal(true);
  };

  const openEditModal = (cls) => {
    setEditingClass(cls);
    const localIso = cls.scheduledTime
      ? new Date(new Date(cls.scheduledTime).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      : '';
    setForm({
      title: cls.title,
      batchCode: cls.batchCode,
      subject: cls.subject,
      trainerId: cls.trainer?._id || '',
      scheduledTime: localIso,
      durationMinutes: cls.durationMinutes || 60
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await axios.put(`${API}/${editingClass._id}`, {
          ...form,
          scheduledTime: new Date(form.scheduledTime).toISOString()
        }, cfg());
      } else {
        await axios.post(API, {
          ...form,
          scheduledTime: new Date(form.scheduledTime).toISOString()
        }, cfg());
      }
      setShowModal(false);
      fetchClasses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save online class');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this online batch/class?')) return;
    try {
      await axios.delete(`${API}/${id}`, cfg());
      fetchClasses();
    } catch (err) {
      alert('Failed to delete class');
    }
  };

  const copyClassLink = (batchCode) => {
    const link = `${window.location.origin}/live-class/${batchCode}`;
    navigator.clipboard.writeText(link);
    setCopiedId(batchCode);
    setTimeout(() => setCopiedId(null), 2500);
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Loading Online Classes...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border dark:border-slate-700 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiVideo className="text-blue-600" /> Online Live Batches & Classes
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isAdmin
              ? 'Create online batches, assign/change trainers anytime, adjust timings, and share the join link.'
              : 'View your assigned online batches, copy student join links, and launch your live interactive classes.'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition"
          >
            <FiPlus size={18} /> Create Online Batch
          </button>
        )}
      </div>

      {/* Classes Grid */}
      {classes.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border p-12 text-center text-gray-500">
          {isAdmin ? 'No online batches created yet. Click "Create Online Batch" to start.' : 'No online classes assigned to you yet.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => {
            const isCopied = copiedId === cls.batchCode;
            return (
              <div key={cls._id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-5 flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {cls.batchCode}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
                      cls.status === 'live' ? 'bg-red-100 text-red-600 animate-pulse' :
                      cls.status === 'ended' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                    }`}>
                      {cls.status === 'live' ? '● Live Now' : cls.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-3">{cls.title}</h3>
                  <p className="text-xs font-semibold text-blue-600">{cls.subject}</p>

                  <div className="mt-4 space-y-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-gray-500"><FiUser /> Trainer:</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {cls.trainer ? cls.trainer.name : <span className="text-amber-600">Not Assigned Yet</span>}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-gray-500"><FiClock /> Timing:</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {new Date(cls.scheduledTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} ({cls.durationMinutes}m)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-gray-500"><FiUsers /> Attendance:</span>
                      <button
                        type="button"
                        onClick={() => setViewingAttendance(cls)}
                        className="font-bold text-blue-600 hover:underline"
                      >
                        {cls.attendance?.length || 0} Students Joined
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-5 pt-4 border-t dark:border-slate-700 space-y-2.5">
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/live-class/${cls.batchCode}`)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                    >
                      <FiPlay /> {isAdmin ? 'Join / Monitor' : 'Start Live Class'}
                    </button>

                    <button
                      onClick={() => copyClassLink(cls.batchCode)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition ${
                        isCopied
                          ? 'bg-green-50 border-green-300 text-green-700'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                      title="Copy Student Join Link"
                    >
                      {isCopied ? <><FiCheckCircle /> Copied!</> : <><FiShare2 /> Share Link</>}
                    </button>
                  </div>

                  {isAdmin && (
                    <div className="flex justify-between items-center pt-1">
                      <button
                        onClick={() => openEditModal(cls)}
                        className="text-xs font-bold text-gray-600 hover:text-blue-600 flex items-center gap-1"
                      >
                        <FiEdit size={14} /> Change Trainer / Timing
                      </button>
                      <button
                        onClick={() => handleDelete(cls._id)}
                        className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1"
                      >
                        <FiTrash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL (SUPER ADMIN) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingClass ? 'Update Trainer & Class Timings' : 'Create New Online Batch'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Batch Code *</label>
                <input
                  required
                  disabled={!!editingClass}
                  value={form.batchCode}
                  onChange={(e) => setForm({ ...form, batchCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. JAVA-BATCH-1"
                  className="w-full p-2.5 border rounded-lg text-sm font-mono bg-gray-50 disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subject *</label>
                <input
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g. Core Java & DSA"
                  className="w-full p-2.5 border rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Class / Topic Title *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. OOPs Concepts & Live Coding"
                className="w-full p-2.5 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assign Trainer (Can select/change later)</label>
              <select
                value={form.trainerId}
                onChange={(e) => setForm({ ...form, trainerId: e.target.value })}
                className="w-full p-2.5 border rounded-lg text-sm bg-white"
              >
                <option value="">-- Select Trainer Later --</option>
                {trainers.map((t) => (
                  <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Class Date & Time *</label>
                <input
                  required
                  type="datetime-local"
                  value={form.scheduledTime}
                  onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                  className="w-full p-2.5 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duration (Minutes) *</label>
                <input
                  required
                  type="number"
                  min="15"
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                  className="w-full p-2.5 border rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border text-sm font-bold text-gray-600">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700">
                {editingClass ? 'Save Changes' : 'Create Batch'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ATTENDANCE MODAL */}
      {viewingAttendance && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewingAttendance(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-900">{viewingAttendance.title} — Attendance</h3>
                <p className="text-xs text-gray-500">Total Joined: {viewingAttendance.attendance?.length || 0} Students</p>
              </div>
              <button onClick={() => setViewingAttendance(null)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>
            <div className="overflow-y-auto p-4">
              {(!viewingAttendance.attendance || viewingAttendance.attendance.length === 0) ? (
                <p className="text-center text-gray-500 py-8 text-sm">No students have joined this class yet.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="text-gray-500 border-b">
                    <tr>
                      <th className="py-2">Student</th>
                      <th className="py-2">First Joined</th>
                      <th className="py-2">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {viewingAttendance.attendance.map((a, i) => (
                      <tr key={i}>
                        <td className="py-2.5">
                          <p className="font-semibold text-gray-800">{a.name}</p>
                          <p className="text-xs text-gray-400">{a.email}</p>
                        </td>
                        <td className="py-2.5 text-xs text-gray-600">{new Date(a.firstJoinedAt).toLocaleTimeString()}</td>
                        <td className="py-2.5 text-xs text-gray-600">{new Date(a.lastSeenAt).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineClassesManager;