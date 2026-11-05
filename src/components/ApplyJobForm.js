import React, { useState } from 'react';
import axios from 'axios';
import { FiX, FiUploadCloud } from 'react-icons/fi';

const API = process.env.REACT_APP_API_URL;
const MAX_RESUME = 2 * 1024 * 1024; // 2 MB

const inputCls = "apple-input";
const labelCls = "block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1";

// Shrinks the photo to a 400x500 passport-style JPEG (~100 KB) before upload
const compressPhoto = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const W = 400;
      const H = 500;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      const scale = Math.max(W / img.width, H / img.height); // fill the frame, centered
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Could not process the photo'))),
        'image/jpeg',
        0.85
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This file is not a valid image'));
    };
    img.src = url;
  });

const urlOn = (value, domain) => {
  try {
    const u = new URL(value);
    return ['http:', 'https:'].includes(u.protocol) && (u.hostname === domain || u.hostname.endsWith('.' + domain));
  } catch {
    return false;
  }
};

const ApplyJobForm = ({ job, profile, onClose, onApplied }) => {
  const [form, setForm] = useState({
    email: profile?.email || '',
    phone: '',
    parentPhone: '',
    linkedin: '',
    github: ''
  });
  const [photoBlob, setPhotoBlob] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [resume, setResume] = useState(null);
  const [error, setError] = useState('');
  const [reasons, setReasons] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    if (!/^image\/(jpeg|png)$/.test(file.type)) {
      setError('Photo must be a JPG or PNG image.');
      return;
    }
    try {
      const blob = await compressPhoto(file);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoBlob(blob);
      setPhotoPreview(URL.createObjectURL(blob));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResume = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    if (file.type !== 'application/pdf') {
      setError('Resume must be a PDF file.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_RESUME) {
      setError('Resume must be smaller than 2 MB.');
      e.target.value = '';
      return;
    }
    setResume(file);
  };

  const validate = () => {
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Enter a valid email address.';
    if (!/^\d{10}$/.test(form.phone)) return 'Contact number must be 10 digits.';
    if (!/^\d{10}$/.test(form.parentPhone)) return "Parent's contact number must be 10 digits.";
    if (!urlOn(form.linkedin, 'linkedin.com')) return 'Enter a valid LinkedIn profile link (https://linkedin.com/in/...).';
    if (!urlOn(form.github, 'github.com')) return 'Enter a valid GitHub profile link (https://github.com/...).';
    if (!photoBlob) return 'Upload your passport-size photo.';
    if (!resume) return 'Upload your resume (PDF).';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setReasons([]);
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v.trim()));
      fd.append('photo', photoBlob, 'photo.jpg');
      fd.append('resume', resume);

      const token = localStorage.getItem('token');
      const res = await axios.post(`${API}/api/jobs/${job._id}/apply`, fd, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data.message);
      onApplied(res.data.application);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit your application. Try again.');
      setReasons(err.response?.data?.reasons || []);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-2xl relative flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 md:p-8 bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700 shrink-0">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Apply for {job.title}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">{job.jobId}</span>
              <p className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest hidden sm:block">Details cannot be edited post-submission.</p>
            </div>
          </div>
          <button onClick={onClose} type="button" className="p-2.5 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded-full transition-colors border border-gray-300 dark:border-slate-600 shadow-sm shrink-0">
            <FiX size={18} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-[#1e293b]">
          <div>
            <label className={labelCls}>Email Address</label>
            <input type="email" value={form.email} onChange={setField('email')} className={inputCls} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Contact number</label>
              <input type="tel" inputMode="numeric" maxLength={10} placeholder="10 digits" value={form.phone} onChange={setField('phone')} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Parent's contact number</label>
              <input type="tel" inputMode="numeric" maxLength={10} placeholder="10 digits" value={form.parentPhone} onChange={setField('parentPhone')} className={inputCls} required />
            </div>
          </div>

          <div>
            <label className={labelCls}>LinkedIn Profile Link</label>
            <input type="url" placeholder="https://www.linkedin.com/in/your-name" value={form.linkedin} onChange={setField('linkedin')} className={inputCls} required />
          </div>

          <div>
            <label className={labelCls}>GitHub Profile Link</label>
            <input type="url" placeholder="https://github.com/your-username" value={form.github} onChange={setField('github')} className={inputCls} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-[1.5rem] p-5 text-center bg-gray-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group">
              <label className="cursor-pointer flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:scale-105 transition-transform shadow-sm">
                  <FiUploadCloud size={24} />
                </div>
                <div>
                  <span className="block text-sm font-extrabold text-gray-700 dark:text-gray-300">Passport Photo</span>
                  <span className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest">JPG or PNG</span>
                </div>
                <input type="file" accept="image/jpeg,image/png" onChange={handlePhoto} className="hidden" />
              </label>
              {photoPreview && (
                <img src={photoPreview} alt="Your photo" className="w-20 h-24 object-cover rounded-xl border border-gray-200 dark:border-slate-600 mx-auto mt-4 shadow-sm" />
              )}
            </div>

            <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-[1.5rem] p-5 text-center bg-gray-50 dark:bg-slate-800/50 hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors group">
              <label className="cursor-pointer flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center border border-green-500/20 group-hover:scale-105 transition-transform shadow-sm">
                  <FiUploadCloud size={24} />
                </div>
                <div>
                  <span className="block text-sm font-extrabold text-gray-700 dark:text-gray-300">Resume / CV</span>
                  <span className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest">PDF, max 2MB</span>
                </div>
                <input type="file" accept="application/pdf" onChange={handleResume} className="hidden" />
              </label>
              {resume && <p className="text-xs font-bold text-green-600 dark:text-green-400 mt-4 break-all bg-green-500/10 py-1.5 px-3 rounded-lg border border-green-500/20 shadow-sm inline-block">{resume.name}</p>}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-[1rem] p-4 shadow-sm">
              <p className="font-extrabold text-sm">{error}</p>
              {reasons.length > 0 && (
                <ul className="mt-2 space-y-1.5 text-xs font-bold pl-4 list-disc marker:text-red-500">
                  {reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200 dark:border-slate-700">
            <button type="button" onClick={onClose} className="flex-1 glass-button py-3.5 rounded-xl font-extrabold text-gray-700 dark:text-gray-300 text-[15px] border border-gray-300 dark:border-slate-600">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-60 text-white py-3.5 rounded-xl font-extrabold shadow-lg shadow-green-500/30 hover:scale-[0.98] transition-transform text-[15px]">
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyJobForm;