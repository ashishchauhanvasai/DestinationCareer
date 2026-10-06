import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiShield, FiCheckCircle } from 'react-icons/fi';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/register', form);
      setStatus({ type: 'success', message: res.data.message });
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Registration failed' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Destination Career</h1>
          <p className="text-gray-500">Create your account to get started</p>
        </div>

        {status.message && (
          <div className={`p-4 rounded-lg mb-6 flex items-start gap-2 font-medium text-sm ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {status.type === 'success' && <FiCheckCircle size={18} className="mt-0.5" />}
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button type="button" onClick={() => setForm({...form, role: 'student'})} className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${form.role === 'student' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}>
              <FiUser size={24} />
              <span className="font-bold text-sm">Student</span>
            </button>
            <button type="button" onClick={() => setForm({...form, role: 'admin'})} className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${form.role === 'admin' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}>
              <FiShield size={24} />
              <span className="font-bold text-sm">Admin</span>
            </button>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
            <input type="password" required value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors mt-4">
            Request Account
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link to="/login" className="font-bold text-blue-600 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;