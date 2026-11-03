import React, { useState } from 'react';
import axios from 'axios';
import { FiUploadCloud, FiCheckCircle } from 'react-icons/fi';

const inputCls = "apple-input";
const labelCls = "block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1";

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
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 animate-fade-in relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[140px] rounded-full pointer-events-none fixed"></div>
      
      <div className="glass-panel p-10 md:p-12 rounded-[2.5rem] shadow-2xl max-w-lg w-full border-white/60 relative z-10">
        <div className="text-center mb-8 border-b border-black/5 dark:border-white/5 pb-6">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20 shadow-sm">
             <FiUploadCloud size={28} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Upload Video Course</h2>
          <p className="text-sm font-medium text-gray-500 mt-2">Add new content directly to the platform.</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-2xl border text-sm font-bold shadow-sm flex items-center justify-center gap-2 animate-fade-in ${message.includes('Error') ? 'bg-red-500/10 border-red-500/20 text-red-700' : 'bg-green-500/10 border-green-500/20 text-green-700'}`}>
            {!message.includes('Error') && <FiCheckCircle size={18}/>} {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={labelCls}>Video Title</label>
            <input type="text" placeholder="e.g. Introduction to React" onChange={e => setTitle(e.target.value)} required className={`${inputCls} font-bold`} />
          </div>
          
          <div>
            <label className={labelCls}>Description</label>
            <input type="text" placeholder="What will students learn?" onChange={e => setDescription(e.target.value)} required className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Video File</label>
            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-inner">
               <input type="file" onChange={e => setVideo(e.target.files[0])} required className="text-sm text-gray-600 dark:text-gray-300 w-full file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:uppercase file:tracking-wider file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all cursor-pointer" />
            </div>
          </div>
          
          <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-transform hover:scale-[0.98] text-[15px] mt-4">
            Upload Video
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadVideo;