import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  FiVideo, FiPlus, FiShare2, FiEdit, FiTrash2, FiClock,
  FiUser, FiUsers, FiCheckCircle, FiPlay, FiX
} from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api/online-classes`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const toLocalInputString = (dateObj) => {
  const d = new Date(dateObj);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const inputCls = "apple-input";
const labelCls = "block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1";

const OnlineClassesManager = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const isAdmin = ['admin', 'superadmin', 'trainer'].includes(role?.toLowerCase());

  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [form, setForm] = useState({
    title: '', batchCode: '', subject: '', trainerId: '', scheduledTime: '', durationMinutes: 60
  });

  const [viewingAttendance, setViewingAttendance] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchClasses = async () => {
    try {
      const res = await axios.get(API, cfg());
      setClasses(res.data.classes || []);
      setTrainers(res.data.trainers || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClasses(); }, []);

  const openCreateModal = () => {
    setEditingClass(null);
    setForm({
      title: '', batchCode: `LIVE-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: '', trainerId: '', scheduledTime: toLocalInputString(Date.now() + 3600000), durationMinutes: 60
    });
    setShowModal(true);
  };

  const openEditModal = (cls) => {
    setEditingClass(cls);
    const localIso = cls.scheduledTime ? toLocalInputString(cls.scheduledTime) : '';
    setForm({
      title: cls.title, batchCode: cls.batchCode, subject: cls.subject,
      trainerId: cls.trainer?._id || '', scheduledTime: localIso, durationMinutes: cls.durationMinutes || 60
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, scheduledTime: new Date(form.scheduledTime).toISOString() };
      if (editingClass) {
        const res = await axios.put(`${API}/${editingClass._id}`, payload, cfg());
        setClasses(classes.map(c => c._id === editingClass._id ? res.data : c));
      } else {
        const res = await axios.post(API, payload, cfg());
        setClasses([res.data, ...classes]);
      }
      setShowModal(false);
    } catch (err) { alert(err.response?.data?.message || 'Failed to save online class'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this online batch/class?')) return;
    try {
      await axios.delete(`${API}/${id}`, cfg());
      setClasses(classes.filter(c => c._id !== id));
    } catch (err) { alert('Failed to delete class'); }
  };

  const copyClassLink = (batchCode) => {
    const link = `${window.location.origin}/live-class/${batchCode}`;
    navigator.clipboard.writeText(link);
    setCopiedId(batchCode);
    setTimeout(() => setCopiedId(null), 2500);
  };

  if (loading) return <div className="p-20 text-center text-gray-500 font-extrabold text-xl animate-pulse">Loading Online Classes...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl border border-blue-500/20 shadow-sm shrink-0">
            <FiVideo className="text-blue-600 dark:text-blue-400" size={28} />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Online Live Batches</h2>
            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mt-1">
              {isAdmin ? 'Create batches, manage schedules, and share join links.' : 'View assigned online classes and launch live sessions.'}
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3.5 rounded-xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-transform hover:scale-[0.98] text-[15px] w-full md:w-auto"
          >
            <FiPlus size={20} /> Create Online Batch
          </button>
        )}
      </div>

      {classes.length === 0 ? (
        <div className="glass-panel rounded-[2.5rem] p-16 text-center text-gray-500 dark:text-gray-400 font-bold text-xl shadow-sm">
          {isAdmin ? 'No online batches created yet. Click "Create Online Batch" to start.' : 'No online classes assigned to you yet.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {classes.map((cls) => {
            const isCopied = copiedId === cls.batchCode;
            return (
              <div key={cls._id} className="glass-panel p-6 md:p-8 rounded-[2.5rem] flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300 shadow-sm hover:shadow-lg group">
                <div>
                  <div className="flex justify-between items-start gap-4 mb-6">
                    <span className="text-[10px] font-extrabold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-md tracking-wider shadow-sm uppercase">
                      {cls.batchCode}
                    </span>
                    <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-md uppercase tracking-wider shadow-sm border ${cls.status === 'live' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 animate-pulse' :
                        cls.status === 'ended' ? 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700' : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                      }`}>
                      {cls.status === 'live' ? '● Live Now' : cls.status}
                    </span>
                  </div>

                  <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2.5 tracking-tight leading-snug group-hover:text-blue-600 transition-colors">{cls.title}</h3>
                  <p className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-6">{cls.subject}</p>

                  <div className="space-y-3 text-[13px] font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-800/80 p-5 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400"><FiUser size={16} /> Trainer:</span>
                      <span className="font-extrabold text-gray-900 dark:text-white text-right">
                        {cls.trainer ? cls.trainer.name : <span className="text-amber-500">Not Assigned Yet</span>}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400"><FiClock size={16} /> Timing:</span>
                      <span className="font-extrabold text-gray-900 dark:text-white text-right">
                        {new Date(cls.scheduledTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} ({cls.durationMinutes}m)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400"><FiUsers size={16} /> Attendance:</span>
                      <button type="button" onClick={() => setViewingAttendance(cls)} className="font-extrabold text-blue-600 dark:text-blue-400 hover:underline text-right">
                        {cls.attendance?.length || 0} Joined
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <button
                      onClick={() => navigate(`/live-class/${cls.batchCode}`)}
                      className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3.5 px-4 rounded-xl text-[13px] font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-transform hover:scale-[0.98] w-full"
                    >
                      <FiPlay size={16} /> {isAdmin ? 'Join / Monitor' : 'Start Live Class'}
                    </button>

                    <button
                      onClick={() => copyClassLink(cls.batchCode)}
                      className={`flex-1 sm:w-auto rounded-xl text-[13px] py-3.5 font-extrabold border flex items-center justify-center gap-2 transition-all shadow-sm w-full ${isCopied ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' : 'glass-button text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-600'
                        }`}
                      title="Copy Student Join Link"
                    >
                      {isCopied ? <FiCheckCircle size={16} /> : <FiShare2 size={16} />} 
                      <span className="sm:hidden">Share Link</span>
                    </button>
                  </div>

                  {isAdmin && (
                    <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-800/80 p-2 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                      <button onClick={() => openEditModal(cls)} className="flex-1 text-[11px] font-extrabold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors py-2">
                        <FiEdit size={14} /> Edit
                      </button>
                      <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-2"></div>
                      <button onClick={() => handleDelete(cls._id)} className="flex-1 text-[11px] font-extrabold text-gray-600 dark:text-gray-400 hover:text-red-500 uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors py-2">
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

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <form onSubmit={handleSave} className="glass-panel p-6 md:p-8 rounded-[2.5rem] max-w-xl w-full space-y-6 shadow-2xl relative">
            <button type="button" onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors border border-gray-200 dark:border-slate-600 shadow-sm z-10">
              <FiX size={18} className="text-gray-600 dark:text-gray-300" />
            </button>
            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-5 tracking-tight pr-10">
              {editingClass ? 'Update Trainer & Class Timings' : 'Create New Online Batch'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div>
                <label className={labelCls}>Batch Code *</label>
                <input required disabled={!!editingClass} value={form.batchCode} onChange={(e) => setForm({ ...form, batchCode: e.target.value.toUpperCase() })} placeholder="e.g. JAVA-BATCH-1" className={`${inputCls} font-mono font-bold ${!!editingClass ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-slate-800' : ''}`} />
              </div>
              <div>
                <label className={labelCls}>Subject *</label>
                <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Core Java & DSA" className={`${inputCls} font-bold`} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Class / Topic Title *</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. OOPs Concepts & Live Coding" className={`${inputCls} font-bold text-[15px]`} />
            </div>

            <div>
              <label className={labelCls}>Assign Trainer (Can select later)</label>
              <select value={form.trainerId} onChange={(e) => setForm({ ...form, trainerId: e.target.value })} className={`${inputCls} cursor-pointer font-bold`}>
                <option value="">-- Select Trainer Later --</option>
                {trainers.map((t) => <option key={t._id} value={t._id}>{t.name} ({t.email})</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Class Date & Time *</label>
                <input required type="datetime-local" value={form.scheduledTime} onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })} className={`${inputCls} font-bold`} />
              </div>
              <div>
                <label className={labelCls}>Duration (Minutes) *</label>
                <input required type="number" min="15" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} className={`${inputCls} font-bold`} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-slate-700">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 glass-button py-3.5 rounded-xl font-extrabold text-gray-700 dark:text-gray-300 text-[15px] border border-gray-300 dark:border-slate-600 order-2 sm:order-1">
                Cancel
              </button>
              <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-extrabold shadow-lg shadow-blue-500/30 hover:scale-[0.98] transition-transform text-[15px] order-1 sm:order-2">
                {editingClass ? 'Save Changes' : 'Create Batch'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ATTENDANCE MODAL */}
      {viewingAttendance && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewingAttendance(null)}>
          <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative bg-gray-50 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewingAttendance(null)} className="absolute top-6 right-6 p-2.5 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded-full transition-colors border border-gray-300 dark:border-slate-600 shadow-sm z-10">
              <FiX size={18} className="text-gray-600 dark:text-gray-300" />
            </button>
            <div className="border-b border-gray-200 dark:border-slate-700 pb-5 mb-4 pr-10 shrink-0">
              <h3 className="font-extrabold text-2xl md:text-3xl text-gray-900 dark:text-white tracking-tight leading-snug mb-3">{viewingAttendance.title}</h3>
              <p className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-md w-fit border border-blue-200 dark:border-blue-800 shadow-sm">Total Joined: {viewingAttendance.attendance?.length || 0}</p>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 -mx-2 px-2 pb-2">
              {(!viewingAttendance.attendance || viewingAttendance.attendance.length === 0) ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-20 text-lg font-bold">No students have joined this class yet.</p>
              ) : (
                <div className="bg-white dark:bg-[#1e293b] rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-inner overflow-hidden">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 dark:bg-slate-800 text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-200 dark:border-slate-700">
                      <tr><th className="py-4 px-5">Student</th><th className="py-4 px-5">First Joined</th><th className="py-4 px-5">Last Active</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
                      {viewingAttendance.attendance.map((a, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-4 px-5">
                            <p className="font-extrabold text-gray-900 dark:text-white text-[15px]">{a.name}</p>
                            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">{a.email}</p>
                          </td>
                          <td className="py-4 px-5 text-[13px] font-bold text-gray-600 dark:text-gray-300">{new Date(a.firstJoinedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                          <td className="py-4 px-5 text-[13px] font-bold text-gray-600 dark:text-gray-300">{new Date(a.lastSeenAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineClassesManager;