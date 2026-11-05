import React, { useState } from 'react';
import axios from 'axios';
import { FiUploadCloud, FiCheckCircle } from 'react-icons/fi';

const inputCls = "apple-input w-full";
const labelCls = "block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1";

const UploadVideo = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [video, setVideo] = useState(null);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('video', video);

    try {
      const token = localStorage.getItem('token'); 
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/upload-video`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      setMessage(res.data.message || 'Video uploaded successfully!');
    } catch (err) {
      setMessage('Error uploading video');
      console.error(err);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 animate-fade-in relative overflow-hidden bg-gray-50 dark:bg-[#0f172a]">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[140px] rounded-full pointer-events-none fixed"></div>
      
      <div className="glass-panel bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-8 md:p-12 rounded-[2.5rem] shadow-xl max-w-lg w-full relative z-10">
        <div className="text-center mb-8 border-b border-gray-200 dark:border-slate-700 pb-6">
          <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-[1.2rem] flex items-center justify-center mx-auto mb-4 border border-gray-200 dark:border-slate-700 shadow-sm">
             <FiUploadCloud size={28} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">Upload Video Course</h2>
          <p className="text-[13px] font-medium text-gray-500 mt-1">Add new content directly to the platform.</p>
        </div>

        {message && (
          <div className={`mb-8 p-4 rounded-[1rem] border text-[13px] font-extrabold shadow-sm flex items-center justify-center gap-2 animate-fade-in ${message.includes('Error') ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'}`}>
            {!message.includes('Error') && <FiCheckCircle size={18}/>} {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={labelCls}>Video Title</label>
            <input type="text" placeholder="e.g. Introduction to React" onChange={e => setTitle(e.target.value)} required className={`${inputCls} font-black text-[15px]`} />
          </div>
          
          <div>
            <label className={labelCls}>Description</label>
            <input type="text" placeholder="What will students learn?" onChange={e => setDescription(e.target.value)} required className={`${inputCls} font-medium text-[15px]`} />
          </div>

          <div>
            <label className={labelCls}>Video File</label>
            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-inner">
               <input type="file" onChange={e => setVideo(e.target.files[0])} required className="text-[13px] text-gray-600 dark:text-gray-300 w-full file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[11px] file:font-extrabold file:uppercase file:tracking-wider file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-colors cursor-pointer shadow-sm" />
            </div>
          </div>
          
          <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-transform hover:scale-[0.98] text-[15px] mt-6">
            Upload Video
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadVideo;