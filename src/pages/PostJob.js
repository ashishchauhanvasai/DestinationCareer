import React, { useState } from 'react';
import { FiBriefcase, FiPlus, FiLink, FiCheckCircle } from 'react-icons/fi';

const inputCls = "apple-input";
const labelCls = "block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1";

const PostJob = () => {
  const [job, setJob] = useState({
    title: '',
    qualification: '',
    description: '',
    link: ''
  });
  
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setJob({ ...job, [e.target.name]: e.target.value });
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(job)
    });

    const data = await res.json();
    
    if (res.ok) {
      setSuccess(data.message || 'Job posted successfully!');
      setJob({ title: '', qualification: '', description: '', link: '' });
    } else {
      alert(data.message || 'Failed to post job');
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 flex items-start justify-center animate-fade-in relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[140px] rounded-full pointer-events-none fixed"></div>
      
      <div className="max-w-2xl w-full glass-panel p-10 md:p-12 rounded-[2.5rem] shadow-2xl border-white/60 relative z-10 mt-8">
        <div className="flex flex-col items-center text-center mb-10 border-b border-black/5 dark:border-white/5 pb-8">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-sm mb-4">
             <FiBriefcase size={28} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Post a New Job</h2>
          <p className="text-sm font-medium text-gray-500 mt-2">Publish an external job opportunity for students.</p>
        </div>
        
        {success && (
          <div className="mb-8 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-sm font-bold shadow-sm flex items-center justify-center gap-2 animate-fade-in">
            <FiCheckCircle size={20} /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={labelCls}>Job Title *</label>
            <input type="text" name="title" placeholder="e.g. Frontend Developer" value={job.title} onChange={handleChange} required className={`${inputCls} font-bold text-lg`} />
          </div>
          
          <div>
            <label className={labelCls}>Required Qualification *</label>
            <input type="text" name="qualification" placeholder="e.g. B.Tech CS, 2026 Batch" value={job.qualification} onChange={handleChange} required className={inputCls} />
          </div>
          
          <div>
            <label className={labelCls}>Job Description *</label>
            <textarea name="description" placeholder="Provide roles, responsibilities, and criteria..." value={job.description} onChange={handleChange} required rows="4" className={`${inputCls} resize-none`} />
          </div>
          
          <div>
            <label className={labelCls}>External Apply Link (URL) *</label>
            <div className="relative">
              <FiLink className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="url" name="link" placeholder="https://careers.company.com/apply" value={job.link} onChange={handleChange} required className={`${inputCls} pl-11`} />
            </div>
          </div>
          
          <button type="submit" className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-transform hover:scale-[0.98] text-[15px] flex items-center justify-center gap-2">
            <FiPlus size={20} /> Publish Job Post
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostJob;