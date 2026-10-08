// Save as: src/components/ApplyJobForm.js
import React, { useState } from 'react';
import axios from 'axios';
import { FiX, FiUploadCloud } from 'react-icons/fi';

const API = process.env.REACT_APP_API_URL;
const MAX_RESUME = 2 * 1024 * 1024; // 2 MB

const inputStyles =
  'w-full p-2 border rounded text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors';

// Shrinks the photo to a 400x500 passport-style JPEG (~100 KB) before upload,
// so it uses very little MongoDB space.
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
        headers: { Authorization: `Bearer ${token}` } // axios sets the multipart header itself
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between p-6 border-b dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Apply for {job.title}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {job.jobId}. You cannot edit these details after you submit.
            </p>
          </div>
          <button onClick={onClose} type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <FiX size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Email</label>
            <input type="email" value={form.email} onChange={setField('email')} className={inputStyles} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Contact number</label>
              <input type="tel" inputMode="numeric" maxLength={10} placeholder="10 digits" value={form.phone} onChange={setField('phone')} className={inputStyles} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Parent's contact number</label>
              <input type="tel" inputMode="numeric" maxLength={10} placeholder="10 digits" value={form.parentPhone} onChange={setField('parentPhone')} className={inputStyles} required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">LinkedIn profile link</label>
            <input type="url" placeholder="https://www.linkedin.com/in/your-name" value={form.linkedin} onChange={setField('linkedin')} className={inputStyles} required />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">GitHub profile link</label>
            <input type="url" placeholder="https://github.com/your-username" value={form.github} onChange={setField('github')} className={inputStyles} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-4 text-center">
              <label className="cursor-pointer text-sm font-bold text-gray-600 dark:text-gray-300 flex flex-col items-center gap-2">
                <FiUploadCloud size={24} className="text-blue-500" />
                Passport-size photo
                <span className="text-[11px] font-normal text-gray-400">JPG or PNG</span>
                <input type="file" accept="image/jpeg,image/png" onChange={handlePhoto} className="hidden" />
              </label>
              {photoPreview && (
                <img src={photoPreview} alt="Your photo" className="w-20 h-24 object-cover rounded border dark:border-slate-600 mx-auto mt-3" />
              )}
            </div>

            <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-4 text-center">
              <label className="cursor-pointer text-sm font-bold text-gray-600 dark:text-gray-300 flex flex-col items-center gap-2">
                <FiUploadCloud size={24} className="text-blue-500" />
                Resume
                <span className="text-[11px] font-normal text-gray-400">PDF, up to 2 MB</span>
                <input type="file" accept="application/pdf" onChange={handleResume} className="hidden" />
              </label>
              {resume && <p className="text-xs text-gray-600 dark:text-gray-300 mt-3 break-all">{resume.name}</p>}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-lg p-3">
              <p className="font-bold">{error}</p>
              {reasons.length > 0 && (
                <ul className="mt-2 space-y-1 list-disc list-inside text-xs">
                  {reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2 rounded-lg font-bold border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-6 py-2 rounded-lg font-bold bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white">
              {submitting ? 'Submitting...' : 'Submit application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyJobForm;