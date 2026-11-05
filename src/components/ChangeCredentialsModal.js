import React, { useState } from 'react';
import axios from 'axios';
import { FiX } from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const inputCls = "apple-input";
const labelCls = "block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1";

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
    <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] max-w-sm w-full shadow-2xl relative bg-white dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-6 right-6 p-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors border border-gray-200 dark:border-slate-600 shadow-sm shrink-0">
          <FiX size={18} className="text-gray-600 dark:text-gray-300" />
        </button>
        
        <h2 className="font-extrabold text-2xl text-gray-900 dark:text-white tracking-tight mb-8">Change Login Details</h2>
        
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className={labelCls}>Current Password</label>
            <input required type="password" placeholder="Verify it's you" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>New Email <span className="opacity-60 lowercase font-medium">(optional)</span></label>
            <input type="email" placeholder="Leave blank to keep current" value={form.newEmail} onChange={(e) => setForm({ ...form, newEmail: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>New Password <span className="opacity-60 lowercase font-medium">(optional)</span></label>
            <input type="password" placeholder="Create a new password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} className={inputCls} />
          </div>
          
          {form.newPassword && (
            <div className="animate-fade-in">
              <label className={labelCls}>Confirm New Password</label>
              <input type="password" placeholder="Re-type new password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className={inputCls} />
            </div>
          )}
          
          <button disabled={busy} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 mt-2 rounded-xl font-extrabold text-[15px] shadow-lg shadow-blue-500/30 disabled:opacity-60 transition-transform hover:scale-[0.98] flex items-center justify-center">
            {busy ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </form>
        
        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-6 leading-relaxed text-center px-4">
          You will be logged out immediately after saving your new credentials.
        </p>
      </div>
    </div>
  );
};

export default ChangeCredentialsModal;