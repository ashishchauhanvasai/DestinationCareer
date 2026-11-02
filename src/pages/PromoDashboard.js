import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiClock, FiX, FiCopy, FiTarget, FiArrowLeft, FiEdit3, FiCode, FiList, FiTrash2, FiPower, FiCheckCircle } from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const inputCls = 'apple-input';
const labelCls = 'block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider pl-1';

const PromoDashboard = () => {
  const [view, setView] = useState('list'); 
  const [drives, setDrives] = useState([]);
  const [subs, setSubs] = useState([]);
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [proctorLogs, setProctorLogs] = useState(null);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [loading, setLoading] = useState(true);

  const [resources, setResources] = useState({ assignments: [], problems: [] });
  const [assignForm, setAssignForm] = useState({ selectedAssignmentIds: [], selectedProblemIds: [] });

  useEffect(() => { fetchDrives(); }, []);

  const fetchDrives = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/drives`, cfg());
      setDrives(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const [form, setForm] = useState({
    collegeName: '',
    driveCode: '',
    scheduledTestTime: '',
    durationMinutes: 60,
    cutoffPercentage: 70
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    let formattedDate = '';
    if (form.scheduledTestTime) {
      const localDate = new Date(form.scheduledTestTime);
      formattedDate = localDate.toISOString();
    }
    const payload = { 
      ...form, 
      driveCode: form.driveCode.toUpperCase().replace(/\s+/g, '-'),
      scheduledTestTime: formattedDate
    };
    try {
      const res = await axios.post(`${API}/drives`, payload, cfg());
      setDrives([res.data.drive || res.data, ...drives]); 
      alert('College Drive Created Successfully!');
      setForm({ collegeName: '', driveCode: '', durationMinutes: 60, cutoffPercentage: 70, scheduledTestTime: '' });
      setView('list');
    } catch (err) { alert(err.response?.data?.message || 'Failed to create drive.'); }
  };

  const deleteDrive = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this drive and all its student submissions?")) return;
    try {
      await axios.delete(`${API}/drives/${id}`, cfg());
      setDrives(drives.filter(d => d._id !== id));
    } catch (err) { alert('Failed to delete'); }
  };

  const toggleStatus = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Change drive status?")) return;
    try {
      await axios.put(`${API}/drives/${id}/status`, {}, cfg());
      setDrives(drives.map(d => d._id === id ? { ...d, isActive: !d.isActive } : d));
    } catch (err) { alert('Failed to update status'); }
  };

  const openAssignModal = async (e, drive) => {
    e.stopPropagation();
    setSelectedDrive(drive);
    setAssignForm({
      selectedAssignmentIds: drive.selectedAssignmentIds?.map(a => typeof a === 'object' ? a._id : a) || [],
      selectedProblemIds: drive.selectedProblemIds?.map(p => typeof p === 'object' ? p._id : p) || []
    });
    setView('assign');
    try {
      const res = await axios.get(`${API}/promo/resources`, cfg());
      setResources(res.data);
    } catch (err) { alert('Failed to load questions'); }
  };

  const saveAssignedQuestions = async () => {
    try {
      await axios.put(`${API}/drives/${selectedDrive._id}/questions`, assignForm, cfg());
      alert('Questions Assigned Successfully!');
      setView('list');
      fetchDrives();
    } catch (err) { alert('Failed to assign questions'); }
  };

  const toggleSelection = (type, id) => {
    setAssignForm(prev => {
      const arr = prev[type];
      const newArr = arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];
      return { ...prev, [type]: newArr };
    });
  };

  const openSubmissions = async (drive) => {
    setSelectedDrive(drive);
    setView('submissions');
    try {
      const res = await axios.get(`${API}/drives/${drive._id}/submissions`, cfg());
      setSubs(res.data);
    } catch (err) { alert("Could not load submissions"); }
  };

  const openRegisteredStudents = async (drive) => {
    setSelectedDrive(drive);
    setView('registeredStudents');
    try {
      const res = await axios.get(`${API}/drives/${drive._id}/students`, cfg());
      setRegisteredStudents(res.data);
    } catch (err) { alert("Could not load registered students"); }
  };

  const deleteCampusStudent = async (studentId) => {
    if (!window.confirm("Delete this student permanently from the drive?")) return;
    try {
      await axios.delete(`${API}/drives/${selectedDrive._id}/students/${studentId}`, cfg());
      setRegisteredStudents(registeredStudents.filter(s => s._id !== studentId));
    } catch (err) { alert("Failed to delete student"); }
  };

  const viewProctorLogs = async (studentId, studentName) => {
    try {
      const res = await axios.get(`${API}/drives/${selectedDrive._id}/proctor/${studentId}`, cfg());
      setProctorLogs({ name: studentName, images: res.data });
    } catch(err) {
      alert("Failed to load proctor images");
    }
  };

  const copyLink = (e, code) => {
    e.stopPropagation();
    const link = `${window.location.origin}/drive-register/${code}`;
    navigator.clipboard.writeText(link);
    alert('Link Copied: ' + link);
  };

  const ongoingDrives = drives.filter(d => d.isActive);
  const completedDrives = drives.filter(d => !d.isActive);

  if (loading) return <div className="h-[50vh] flex items-center justify-center text-lg font-bold text-gray-500">Loading Dashboard...</div>;

  const DriveCard = ({ d }) => (
    <div className="glass-panel p-8 rounded-[2rem] flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300 group shadow-lg">
      <div>
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-extrabold text-2xl text-gray-900 dark:text-white leading-tight tracking-tight group-hover:text-blue-600 transition-colors">{d.collegeName}</h3>
          <div className="flex gap-2 shrink-0">
            <button onClick={(e) => openAssignModal(e, d)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-500/20" title="Assign Questions"><FiEdit3 size={14} /></button>
            <button onClick={(e) => deleteDrive(e, d._id)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-red-500/20" title="Delete Drive"><FiTrash2 size={14} /></button>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mb-6">
          <span className="font-mono text-xs font-extrabold bg-blue-500/10 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/20 uppercase tracking-wider shadow-sm">{d.driveCode}</span>
          <button onClick={(e) => copyLink(e, d.driveCode)} className="p-2 text-gray-500 hover:text-blue-600 bg-black/5 dark:bg-white/10 hover:bg-black/10 rounded-lg transition-colors" title="Copy Link"><FiCopy size={16} /></button>
          <button onClick={(e) => toggleStatus(e, d._id)} className="p-2 text-gray-500 hover:text-green-600 bg-black/5 dark:bg-white/10 hover:bg-black/10 rounded-lg transition-colors ml-auto" title="Start/Stop Drive">
            <FiPower size={18} className={d.isActive ? 'text-green-500' : 'text-red-500'} />
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-8">
          {d.scheduledTestTime && (
            <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-md font-extrabold text-purple-700 dark:text-purple-400 flex items-center gap-1.5 uppercase tracking-wider shadow-sm">
              <FiClock size={12} /> {new Date(d.scheduledTestTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
            </span>
          )}
          <span className="text-[10px] bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 px-2.5 py-1 rounded-md font-extrabold text-gray-600 dark:text-gray-300 uppercase tracking-wider shadow-sm">{d.durationMinutes} Mins</span>
          <span className="text-[10px] bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-md font-extrabold text-green-700 dark:text-green-400 uppercase tracking-wider shadow-sm">Cutoff {d.cutoffPercentage}%</span>
        </div>
      </div>

      <div className="bg-white/40 dark:bg-slate-900/40 rounded-[1.5rem] p-4 grid grid-cols-3 gap-3 mb-6 border border-white/50 dark:border-slate-700/50 shadow-sm text-center">
        <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl">
          <p className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Reg</p>
          <p className="text-xl font-extrabold text-gray-900 dark:text-white leading-none">{d.totalRegistered || 0}</p>
        </div>
        <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-green-500/20">
          <p className="text-[9px] font-extrabold text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">Pass</p>
          <p className="text-xl font-extrabold text-green-600 dark:text-green-400 leading-none">{d.totalSelected || 0}</p>
        </div>
        <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-red-500/20">
          <p className="text-[9px] font-extrabold text-red-500 dark:text-red-400 uppercase tracking-widest mb-1">Fail</p>
          <p className="text-xl font-extrabold text-red-500 dark:text-red-400 leading-none">{d.totalRejected || 0}</p>
        </div>
      </div>

      <div className="flex gap-4 mt-auto">
        <button onClick={() => openRegisteredStudents(d)} className="flex-1 py-3 glass-button text-blue-600 dark:text-blue-400 rounded-xl text-[11px] font-extrabold uppercase tracking-wider">
          Registrations
        </button>
        <button onClick={() => openSubmissions(d)} className="flex-1 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl text-[11px] font-extrabold uppercase tracking-wider shadow-lg shadow-gray-900/30 hover:scale-[0.98] transition-transform">
          Results
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-4 px-2 sm:px-4">
      {view === 'list' && (
        <div className="glass-panel rounded-[2rem] p-8 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center border border-teal-500/20 shadow-sm">
               <FiTarget size={28} />
             </div>
             <div>
               <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Campus Drive Dashboard</h1>
               <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm font-medium">Manage college visits, test links, and assign questions.</p>
             </div>
          </div>
          <button onClick={() => setView('create')} className="w-full md:w-auto bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white px-8 py-4 rounded-xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/30 transition-all hover:scale-[0.98] text-[15px]">
            <FiPlus size={20} /> Create New Drive
          </button>
        </div>
      )}

      {view === 'create' && (
        <form onSubmit={handleCreate} className="glass-panel p-8 md:p-10 rounded-[2.5rem] space-y-8 max-w-4xl mx-auto animate-fade-in">
          <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-5">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Create College Drive</h2>
            <button type="button" onClick={() => setView('list')} className="w-10 h-10 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full flex items-center justify-center transition-colors text-gray-500 dark:text-gray-300">
              <FiX size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className={labelCls}>College Name</label><input required placeholder="e.g. VIT Pune" value={form.collegeName} onChange={e => setForm({...form, collegeName: e.target.value})} className={inputCls} /></div>
            <div><label className={labelCls}>Drive Link Code</label><input required placeholder="e.g. VIT-2026" value={form.driveCode} onChange={e => setForm({...form, driveCode: e.target.value.toUpperCase().replace(/\s+/g, '-')})} className={`${inputCls} font-mono uppercase tracking-wider`} /></div>
            <div><label className={labelCls}>Scheduled Start Time</label><input required type="datetime-local" value={form.scheduledTestTime} onChange={e => setForm({...form, scheduledTestTime: e.target.value})} className={inputCls} /></div>
            <div><label className={labelCls}>Test Duration (Mins)</label><input type="number" min="10" required value={form.durationMinutes} onChange={e => setForm({...form, durationMinutes: Number(e.target.value)})} className={inputCls} /></div>
            <div><label className={labelCls}>Cutoff Percentage</label><input type="number" min="1" max="100" required value={form.cutoffPercentage} onChange={e => setForm({...form, cutoffPercentage: Number(e.target.value)})} className={inputCls} /></div>
          </div>
          
          <div className="flex justify-end pt-6 border-t border-black/5 dark:border-white/5 mt-4">
            <button type="submit" className="w-full md:w-auto px-10 py-4 font-extrabold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:scale-[0.98] shadow-lg shadow-blue-500/30 transition-transform text-[15px]">
              Publish Drive Link
            </button>
          </div>
        </form>
      )}

      {view === 'assign' && (
        <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] space-y-8 max-w-5xl mx-auto animate-fade-in">
          <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-5">
            <div>
               <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Assign Questions</h2>
               <p className="text-sm font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 w-fit mt-3 uppercase tracking-wider">{selectedDrive.collegeName}</p>
            </div>
            <button onClick={() => setView('list')} className="w-10 h-10 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full flex items-center justify-center transition-colors text-gray-500 dark:text-gray-300">
              <FiX size={20}/>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/40 dark:bg-slate-900/40 rounded-[2rem] border border-white/50 dark:border-slate-700/50 shadow-sm p-6">
              <h3 className="font-extrabold text-blue-800 dark:text-blue-300 flex items-center gap-3 mb-5 text-lg">
                 <div className="p-2 bg-blue-500/20 rounded-xl"><FiList size={20}/></div> MCQ Assignments
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                {resources.assignments.map(a => (
                  <label key={a._id} className="flex items-center gap-4 p-4 border border-black/5 dark:border-white/5 rounded-2xl cursor-pointer bg-white dark:bg-slate-800 transition hover:border-blue-300 dark:hover:border-blue-500/50 shadow-sm">
                    <input type="checkbox" className="w-5 h-5 accent-blue-600 rounded cursor-pointer" checked={assignForm.selectedAssignmentIds.includes(a._id)} onChange={() => toggleSelection('selectedAssignmentIds', a._id)} />
                    <span className="font-bold text-gray-900 dark:text-white text-sm">{a.title}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="bg-white/40 dark:bg-slate-900/40 rounded-[2rem] border border-white/50 dark:border-slate-700/50 shadow-sm p-6">
              <h3 className="font-extrabold text-purple-800 dark:text-purple-300 flex items-center gap-3 mb-5 text-lg">
                 <div className="p-2 bg-purple-500/20 rounded-xl"><FiCode size={20}/></div> Coding Problems
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                {resources.problems.map(p => (
                  <label key={p._id} className="flex items-center gap-4 p-4 border border-black/5 dark:border-white/5 rounded-2xl cursor-pointer bg-white dark:bg-slate-800 transition hover:border-purple-300 dark:hover:border-purple-500/50 shadow-sm">
                    <input type="checkbox" className="w-5 h-5 accent-purple-600 rounded cursor-pointer" checked={assignForm.selectedProblemIds.includes(p._id)} onChange={() => toggleSelection('selectedProblemIds', p._id)} />
                    <span className="font-bold text-gray-900 dark:text-white text-sm">{p.title}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-6 border-t border-black/5 dark:border-white/5 mt-4">
            <button onClick={saveAssignedQuestions} className="w-full md:w-auto px-10 py-4 font-extrabold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:scale-[0.98] shadow-lg shadow-blue-500/30 transition-transform text-[15px]">
              Save Test Questions
            </button>
          </div>
        </div>
      )}

      {view === 'list' && (
        <div className="space-y-12">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-3 tracking-tight border-b border-black/5 dark:border-white/5 pb-4">
              <FiTarget className="text-blue-500"/> Ongoing Drives
            </h2>
            {ongoingDrives.length === 0 ? <p className="text-gray-500 font-medium bg-black/5 dark:bg-white/5 p-6 rounded-2xl text-center">No active drives right now.</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {ongoingDrives.map(d => <DriveCard key={d._id} d={d} />)}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-3 tracking-tight border-b border-black/5 dark:border-white/5 pb-4 opacity-70">
              <FiCheckCircle className="text-green-500"/> Completed Drives
            </h2>
            {completedDrives.length === 0 ? <p className="text-gray-500 font-medium bg-black/5 dark:bg-white/5 p-6 rounded-2xl text-center">No completed drives yet.</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-80 hover:opacity-100 transition-opacity">
                {completedDrives.map(d => <DriveCard key={d._id} d={d} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submissions & Registration Views follow the same structure as AdminApplications table wrapping */}
      {view === 'submissions' && selectedDrive && (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
          <button onClick={() => setView('list')} className="glass-button px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-extrabold text-gray-600 dark:text-gray-300 w-fit transition-all">
            <FiArrowLeft /> Back to Drives
          </button>
          
          <div className="glass-panel p-8 rounded-[2.5rem] flex flex-wrap justify-between items-center gap-6">
             <div>
               <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{selectedDrive.collegeName} Results</h2>
               <p className="text-[11px] font-extrabold bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg uppercase tracking-wider w-fit mt-3">Cutoff: {selectedDrive.cutoffPercentage}%</p>
             </div>
             <div className="flex gap-6 bg-white/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm">
               <div className="text-center px-4"><p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Appeared</p><p className="text-3xl font-extrabold text-gray-900 dark:text-white">{subs.length}</p></div>
               <div className="text-center border-l border-black/10 dark:border-white/10 pl-8 pr-4"><p className="text-[10px] font-extrabold text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">Selected</p><p className="text-3xl font-extrabold text-green-600 dark:text-green-400">{subs.filter(s => s.status === 'Selected').length}</p></div>
             </div>
          </div>
          
          <div className="glass-panel rounded-[2rem] overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-black/5 dark:bg-white/5 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-black/5 dark:border-white/5">
                  <tr>
                    <th className="p-6">Student Details</th>
                    <th className="p-6">Contact & Location</th>
                    <th className="p-6 text-center">Score</th>
                    <th className="p-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {subs.length === 0 ? <tr><td colSpan="4" className="p-16 text-center text-gray-500 dark:text-gray-400 font-medium text-lg">No submissions yet.</td></tr> : (
                    subs.map(s => (
                      <tr key={s._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                        <td className="p-6 flex items-center gap-4">
                          <img src={s.student?.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="dp" className="w-12 h-12 rounded-[1rem] border-2 border-white/60 shadow-sm object-cover bg-white"/>
                          <div>
                            <p className="font-extrabold text-base text-gray-900 dark:text-white">{s.student?.name}</p>
                            <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-1">{s.student?.highestQualification} ({s.student?.passingYear}) • {s.student?.percentage}%</p>
                          </div>
                        </td>
                        <td className="p-6">
                          <p className="font-extrabold text-gray-800 dark:text-gray-200">{s.student?.contactNumber}</p>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{s.student?.email}</p>
                        </td>
                        <td className="p-6 text-center">
                          <p className="font-extrabold text-lg text-gray-900 dark:text-white">{s.totalScore} <span className="text-xs font-medium text-gray-500">/ {s.maxScore}</span></p>
                          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-extrabold uppercase mt-1 tracking-wider">{s.percentage}%</p>
                        </td>
                        <td className="p-6 text-center flex flex-col items-center gap-3">
                          <span className={`px-4 py-1.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider shadow-sm border ${s.status === 'Selected' ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'}`}>
                            {s.status}
                          </span>
                          <button
                            onClick={() => viewProctorLogs(s.student?._id, s.student?.name)}
                            className="glass-button text-[10px] text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                          >
                            Proctor Logs
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {view === 'registeredStudents' && selectedDrive && (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
          <button onClick={() => setView('list')} className="glass-button px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-extrabold text-gray-600 dark:text-gray-300 w-fit transition-all">
            <FiArrowLeft /> Back to Drives
          </button>
          
          <div className="glass-panel p-8 rounded-[2.5rem] flex flex-wrap justify-between items-center gap-6">
             <div>
               <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{selectedDrive.collegeName} Registrations</h2>
               <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">All students who filled the intake form.</p>
             </div>
             <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm text-center px-8">
               <p className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Total Registered</p>
               <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{registeredStudents.length}</p>
             </div>
          </div>
          
          <div className="glass-panel rounded-[2rem] overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-black/5 dark:bg-white/5 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-black/5 dark:border-white/5">
                  <tr>
                    <th className="p-6">Student Details</th>
                    <th className="p-6">Contact Info</th>
                    <th className="p-6">Academic Background</th>
                    <th className="p-6">Docs & Address</th>
                    <th className="p-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {registeredStudents.length === 0 ? <tr><td colSpan="5" className="p-16 text-center text-gray-500 dark:text-gray-400 font-medium text-lg">No students registered yet.</td></tr> : (
                    registeredStudents.map(s => (
                      <tr key={s._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                        <td className="p-6 flex items-center gap-4">
                          <img src={s.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="dp" className="w-14 h-14 rounded-[1rem] border-2 border-white/60 shadow-sm object-cover bg-white"/>
                          <div>
                            <p className="font-extrabold text-base text-gray-900 dark:text-white mb-1.5">{s.name}</p>
                            <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm border ${s.status === 'approved' ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20'}`}>
                              {s.status === 'approved' ? 'Active' : s.status}
                            </span>
                          </div>
                        </td>
                        <td className="p-6">
                          <p className="font-extrabold text-gray-800 dark:text-gray-200">{s.contactNumber}</p>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{s.email}</p>
                        </td>
                        <td className="p-6 space-y-1.5">
                          <p className="font-extrabold text-gray-900 dark:text-white text-sm">{s.highestQualification} {s.branch ? <span className="text-gray-500 font-medium">- {s.branch}</span> : ''}</p>
                          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Year: {s.yearOfStudy} | Passout: {s.passingYear} | Degree: <strong className="text-gray-700 dark:text-gray-300">{s.percentage}%</strong></p>
                          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">10th: <strong className="text-gray-700 dark:text-gray-300">{s.tenthPercentage}%</strong> | 12th: <strong className="text-gray-700 dark:text-gray-300">{s.twelfthPercentage}%</strong></p>
                        </td>
                        <td className="p-6">
                          <p className="text-[11px] text-gray-600 dark:text-gray-400 font-mono mb-1"><b className="font-extrabold text-gray-800 dark:text-gray-200 font-sans">PAN:</b> {s.panCard || 'N/A'}</p>
                          <p className="text-[11px] text-gray-600 dark:text-gray-400 font-mono mb-2"><b className="font-extrabold text-gray-800 dark:text-gray-200 font-sans">UIDAI:</b> {s.aadharNumber || 'N/A'}</p>
                          <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 truncate w-48 bg-black/5 dark:bg-white/5 p-2 rounded-lg border border-black/5 dark:border-white/5" title={s.address}>{s.address}</p>
                        </td>
                        <td className="p-6 text-center">
                          <button onClick={() => deleteCampusStudent(s._id)} className="w-10 h-10 rounded-xl flex items-center justify-center text-red-500 dark:text-red-400 bg-red-500/10 hover:bg-red-600 hover:text-white border border-red-500/20 transition-all shadow-sm opacity-0 group-hover:opacity-100" title="Delete Student">
                            <FiTrash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PROCTOR LOGS MODAL (Frosted Glass) */}
      {proctorLogs && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-8 rounded-[2rem] max-w-4xl w-full max-h-[90vh] overflow-y-auto relative custom-scrollbar shadow-2xl">
            <button
              onClick={() => setProctorLogs(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-red-500 bg-black/5 dark:bg-white/10 p-2.5 rounded-full transition-colors"
            >
              <FiX size={20}/>
            </button>

            <h2 className="text-2xl font-extrabold mb-6 text-gray-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-4 tracking-tight">
              Proctor Logs: <span className="text-blue-600 dark:text-blue-400">{proctorLogs.name}</span>
            </h2>

            {proctorLogs.images.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 py-16 text-center text-lg font-medium">
                No images captured during this test session.
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {proctorLogs.images.map((log, i) => (
                  <div key={i} className="bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700/50 rounded-[1.5rem] p-3 text-center shadow-sm hover:shadow-md transition-shadow">
                    <img
                      src={log.image}
                      alt="Proctor Snapshot"
                      className="rounded-xl w-full h-auto object-cover mb-3 border border-black/5 dark:border-white/5 shadow-inner"
                    />
                    <p className="text-[10px] font-extrabold text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-900 inline-block px-3 py-1.5 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 uppercase tracking-wider">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoDashboard;