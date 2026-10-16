import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import { FiPlus, FiClock, FiX, FiCopy, FiTarget, FiArrowLeft, FiEdit3, FiCode, FiList, FiTrash2, FiPower } from 'react-icons/fi';
import { FiPlus, FiClock, FiX, FiCopy, FiTarget, FiArrowLeft, FiEdit3, FiCode, FiList, FiTrash2, FiPower, FiCheckCircle } from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const inputCls = 'w-full p-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400';
const labelCls = 'block text-xs font-semibold text-gray-500 mb-1 uppercase';

const PromoDashboard = () => {
  const [view, setView] = useState('list'); 
  const [drives, setDrives] = useState([]);
  const [subs, setSubs] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [loading, setLoading] = useState(true);

  const [resources, setResources] = useState({ assignments: [], problems: [] });
  const [assignForm, setAssignForm] = useState({ selectedAssignmentIds: [], selectedProblemIds: [] });

  const [form, setForm] = useState({
    collegeName: '', driveCode: '', durationMinutes: 60, cutoffPercentage: 70
  });

  useEffect(() => { fetchDrives(); }, []);

  const fetchDrives = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/drives`, cfg());
      setDrives(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const payload = { ...form, driveCode: form.driveCode.toUpperCase().replace(/\s+/g, '-') };
    try {
      await axios.post(`${API}/drives`, payload, cfg());
      alert('College Drive Created Successfully!');
      setForm({ collegeName: '', driveCode: '', durationMinutes: 60, cutoffPercentage: 70 });
      setView('list');
      fetchDrives();
    } catch (err) { alert(err.response?.data?.message || 'Failed to create drive.'); }
  };

  const deleteDrive = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this drive and all its student submissions?")) return;
    try {
      await axios.delete(`${API}/drives/${id}`, cfg());
      fetchDrives();
    } catch (err) { alert('Failed to delete'); }
  };

  const toggleStatus = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Change drive status?")) return;
    try {
      await axios.put(`${API}/drives/${id}/status`, {}, cfg());
      fetchDrives();
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

  const copyLink = (e, code) => {
    e.stopPropagation();
    const link = `${window.location.origin}/drive/${code}`;
    navigator.clipboard.writeText(link);
    alert('Link Copied: ' + link);
  };

  const ongoingDrives = drives.filter(d => d.isActive);
  const completedDrives = drives.filter(d => !d.isActive);

  if (loading) return <div className="p-10 text-center font-bold text-gray-500">Loading Dashboard...</div>;

  const DriveCard = ({ d }) => (
    <div 
      onClick={() => openSubmissions(d)}
      className="bg-white rounded-2xl shadow-sm border p-5 hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between cursor-pointer"
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-900 leading-tight">{d.collegeName}</h3>
          <button onClick={(e) => deleteDrive(e, d._id)} className="text-gray-400 hover:text-red-500 p-1 bg-gray-50 rounded"><FiTrash2 /></button>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">{d.driveCode}</span>
          <button onClick={(e) => copyLink(e, d.driveCode)} className="text-gray-400 hover:text-blue-600 p-1.5 bg-gray-50 rounded" title="Copy Link"><FiCopy /></button>
          <a onClick={e => e.stopPropagation()} href={`mailto:?subject=Campus Drive Link for ${d.collegeName}&body=Hello,%0A%0AHere is the official registration and test link for your campus drive:%0A${window.location.origin}/drive/${d.driveCode}%0A%0ABest Regards`} className="text-gray-400 hover:text-blue-600 p-1.5 bg-gray-50 rounded text-xs font-bold">Mail</a>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-[10px] bg-gray-100 px-2 py-1 rounded font-bold text-gray-600">{d.durationMinutes} Mins</span>
          <span className="text-[10px] bg-green-50 px-2 py-1 rounded font-bold text-green-700">Cutoff {d.cutoffPercentage}%</span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-2 gap-2 mb-4 border">
        <div className="text-center">
          <p className="text-[10px] font-bold text-green-600 uppercase">Selected</p>
          <p className="text-xl font-bold text-green-700">{d.totalSelected}</p>
        </div>
        <div className="text-center border-l">
          <p className="text-[10px] font-bold text-red-500 uppercase">Rejected</p>
          <p className="text-xl font-bold text-red-600">{d.totalRejected}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={(e) => openAssignModal(e, d)} className="flex-1 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 hover:bg-blue-100 flex items-center justify-center gap-2">
          <FiEdit3 /> Questions
        </button>
        <button onClick={(e) => toggleStatus(e, d._id)} className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 flex items-center justify-center gap-2">
          <FiPower /> {d.isActive ? 'End Drive' : 'Reopen'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border p-6 flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Campus Drive Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage college visits, test links, and assign questions.</p>
        </div>
        {view === 'list' && (
          <button onClick={() => setView('create')} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2">
            <FiPlus size={18} /> Create New Drive
          </button>
        )}
      </div>

      {view === 'create' && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-lg font-bold text-gray-800">Step 1: Create College Drive</h2>
            <button type="button" onClick={() => setView('list')} className="text-gray-400 hover:text-gray-600 p-2"><FiX size={20}/></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div><label className={labelCls}>College Name</label><input required placeholder="e.g. VIT Pune" value={form.collegeName} onChange={e => setForm({...form, collegeName: e.target.value})} className={inputCls} /></div>
            <div><label className={labelCls}>Drive Link Code</label><input required placeholder="e.g. VIT-2026" value={form.driveCode} onChange={e => setForm({...form, driveCode: e.target.value.toUpperCase().replace(/\s+/g, '-')})} className={`${inputCls} font-mono uppercase`} /></div>
            <div><label className={labelCls}>Test Duration (Mins)</label><input type="number" min="10" required value={form.durationMinutes} onChange={e => setForm({...form, durationMinutes: Number(e.target.value)})} className={inputCls} /></div>
            <div><label className={labelCls}>Cutoff Percentage</label><input type="number" min="1" max="100" required value={form.cutoffPercentage} onChange={e => setForm({...form, cutoffPercentage: Number(e.target.value)})} className={inputCls} /></div>
          </div>
          <div className="flex justify-end pt-4 border-t"><button type="submit" className="px-5 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700">Create Batch</button></div>
        </form>
      )}

      {view === 'assign' && (
        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div><h2 className="text-lg font-bold">Assign Questions for {selectedDrive.collegeName}</h2></div>
            <button onClick={() => setView('list')} className="text-gray-400 hover:text-gray-600"><FiX size={24}/></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-xl bg-gray-50 p-4">
              <h3 className="font-bold text-blue-800 flex items-center gap-2 mb-3 border-b border-blue-200 pb-2"><FiList /> MCQ Assignments</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {resources.assignments.map(a => (
                  <label key={a._id} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer bg-white transition hover:border-blue-300">
                    <input type="checkbox" className="mt-1" checked={assignForm.selectedAssignmentIds.includes(a._id)} onChange={() => toggleSelection('selectedAssignmentIds', a._id)} />
                    <div className="text-sm"><p className="font-bold text-gray-800">{a.title}</p></div>
                  </label>
                ))}
              </div>
            </div>
            <div className="border rounded-xl bg-gray-50 p-4">
              <h3 className="font-bold text-purple-800 flex items-center gap-2 mb-3 border-b border-purple-200 pb-2"><FiCode /> Coding Problems</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {resources.problems.map(p => (
                  <label key={p._id} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer bg-white transition hover:border-purple-300">
                    <input type="checkbox" className="mt-1" checked={assignForm.selectedProblemIds.includes(p._id)} onChange={() => toggleSelection('selectedProblemIds', p._id)} />
                    <div className="text-sm"><p className="font-bold text-gray-800">{p.title}</p></div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4"><button onClick={saveAssignedQuestions} className="px-5 py-2 font-bold text-white bg-blue-600 rounded-lg">Save Questions</button></div>
        </div>
      )}

      {view === 'list' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><FiTarget className="text-blue-500"/> Ongoing Drives</h2>
            {ongoingDrives.length === 0 ? <p className="text-gray-500 text-sm italic">No active drives right now.</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {ongoingDrives.map(d => <DriveCard key={d._id} d={d} />)}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><FiCheckCircle className="text-green-500"/> Completed Drives</h2>
            {completedDrives.length === 0 ? <p className="text-gray-500 text-sm italic">No completed drives yet.</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {completedDrives.map(d => <DriveCard key={d._id} d={d} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'submissions' && selectedDrive && (
        <div className="space-y-4">
          <button onClick={() => setView('list')} className="text-blue-600 hover:underline flex items-center gap-1 text-sm font-bold">
            <FiArrowLeft /> Back to Drives
          </button>
          
          <div className="bg-white rounded-2xl shadow-sm border p-6 flex flex-wrap justify-between items-center">
             <div>
               <h2 className="text-xl font-bold">{selectedDrive.collegeName} Results</h2>
               <p className="text-sm text-gray-500">Cutoff: {selectedDrive.cutoffPercentage}%</p>
             </div>
             <div className="flex gap-4">
               <div className="text-center"><p className="text-[10px] font-bold text-gray-400 uppercase">Appeared</p><p className="text-2xl font-bold">{subs.length}</p></div>
               <div className="text-center border-l pl-4"><p className="text-[10px] font-bold text-green-600 uppercase">Selected</p><p className="text-2xl font-bold text-green-600">{subs.filter(s => s.status === 'Selected').length}</p></div>
             </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 border-b">
                <tr>
                  <th className="p-4">Student Details</th>
                  <th className="p-4">Contact & Location</th>
                  <th className="p-4 text-center">Score</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subs.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-gray-500">No submissions yet.</td></tr> : (
                  subs.map(s => (
                    <tr key={s._id} className="hover:bg-gray-50">
                      <td className="p-4 flex items-center gap-3">
                        <img src={s.student?.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="dp" className="w-10 h-10 rounded-full border object-cover"/>
                        <div>
                          <p className="font-bold text-gray-800">{s.student?.name}</p>
                          <p className="text-[10px] text-gray-500">{s.student?.highestQualification} ({s.student?.passingYear}) • {s.student?.percentage}%</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-gray-700">{s.student?.contactNumber}</p>
                        <p className="text-xs text-gray-500">{s.student?.email}</p>
                      </td>
                      <td className="p-4 text-center">
                        <p className="font-bold text-gray-800">{s.totalScore} / {s.maxScore}</p>
                        <p className="text-[10px] text-blue-600 font-bold">{s.percentage}%</p>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${s.status === 'Selected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoDashboard;