import React, { useState } from 'react';
import axios from 'axios';
import { FiX } from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const ChangeCredentialsModal = ({ onClose }) => {
  const [form, setForm] = useState({ currentPassword: '', newEmail: '', newPassword: '', confirmPassword: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      return alert('New password and confirmation do not match');
    }
    setBusy(true);
    try {
      const body = { currentPassword: form.currentPassword };
      if (form.newEmail) body.newEmail = form.newEmail;
      if (form.newPassword) body.newPassword = form.newPassword;
      await axios.put(`${API}/users/me/credentials`, body, cfg());
      alert('Credentials updated. Please log in again with your new details.');
      localStorage.removeItem('token')
      window.location.href = '/login';
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update credentials');
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] max-w-sm w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full transition-colors">
          <FiX size={20} className="text-gray-500 dark:text-gray-300" />
        </button>
        
        <h2 className="font-extrabold text-2xl text-gray-900 dark:text-white tracking-tight mb-6">Change Login Details</h2>
        
        <form onSubmit={submit} className="space-y-4">
          <input required type="password" placeholder="Current password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} className="apple-input font-medium" />
          <input type="email" placeholder="New email (optional)" value={form.newEmail} onChange={(e) => setForm({ ...form, newEmail: e.target.value })} className="apple-input font-medium" />
          <input type="password" placeholder="New password (optional)" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} className="apple-input font-medium" />
          {form.newPassword && (
            <input type="password" placeholder="Confirm new password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="apple-input font-medium animate-fade-in" />
          )}
          <button disabled={busy} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3.5 mt-2 rounded-xl font-extrabold text-[15px] shadow-lg shadow-blue-500/30 disabled:opacity-60 transition-all hover:scale-[0.98]">
            {busy ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
        
        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-6 leading-relaxed text-center px-2">
          Leave email/password blank to keep them unchanged. You'll be logged out after saving.
        </p>
      </div>
    </div>
  );
};

export default ChangeCredentialsModal;