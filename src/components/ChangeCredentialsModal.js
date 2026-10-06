import React, { useState } from 'react';
import axios from 'axios';
import { FiX } from 'react-icons/fi';

const API = 'http://localhost:5000/api';
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
      localStorage.clear();
      window.location.href = '/login';
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update credentials');
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <p className="font-bold text-lg">Change Login Details</p>
          <button onClick={onClose}><FiX size={20} className="text-gray-400" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input required type="password" placeholder="Current password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} className="w-full p-2 border rounded text-sm" />
          <input type="email" placeholder="New email (optional)" value={form.newEmail} onChange={(e) => setForm({ ...form, newEmail: e.target.value })} className="w-full p-2 border rounded text-sm" />
          <input type="password" placeholder="New password (optional)" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} className="w-full p-2 border rounded text-sm" />
          {form.newPassword && (
            <input type="password" placeholder="Confirm new password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="w-full p-2 border rounded text-sm" />
          )}
          <button disabled={busy} className="w-full bg-blue-600 text-white py-2 rounded font-bold text-sm disabled:opacity-50">{busy ? 'Saving...' : 'Save Changes'}</button>
        </form>
        <p className="text-xs text-gray-400 mt-3">Leave email/password blank to keep them unchanged. You'll be logged out after saving.</p>
      </div>
    </div>
  );
};
export default ChangeCredentialsModal;