import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiShield, FiCheckCircle } from 'react-icons/fi';

const Register = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });

  const [status, setStatus] = useState({
    type: '',
    message: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateRegisterInput = (formData) => {
    const errors = {};
    if (!formData.name || formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, number, and special character.';
    }
    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (status.message) {
      setStatus({ type: '', message: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    const validationErrors = validateRegisterInput(form);
    if (Object.keys(validationErrors).length > 0) {
      setStatus({ type: 'error', message: Object.values(validationErrors).join(' ') });
      return;
    }

    setIsLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const sanitizedForm = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role
      };

      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/register`, sanitizedForm);

      setStatus({ type: 'success', message: res.data.message || 'Registration successful!' });
      setTimeout(() => navigate('/login'), 3000);

    } catch (err) {
      setStatus({
        type: 'error',
        message: err.response?.data?.message || 'Registration failed. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#f6f8fd] dark:bg-slate-900">
      {/* Light Color Lifter Gradient Blobs */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-blue-400/30 dark:bg-blue-600/20 blur-[140px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-indigo-400/30 dark:bg-indigo-600/20 blur-[140px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-[480px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/60 dark:border-slate-700/60 rounded-[2.5rem] p-10 md:p-12 shadow-[0_8px_40px_rgba(0,0,0,0.06)] relative z-10">

        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-600 dark:text-blue-400 mb-3 tracking-tight">
            Destination Career
          </h1>
          <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">
            Create your account to get started
          </p>
        </div>

        {status.message && (
          <div
            className={`p-4 rounded-2xl mb-8 flex items-center justify-center gap-3 font-bold text-sm shadow-sm animate-fade-in ${
              status.type === 'success'
                ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-500/20'
                : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-500/20'
            }`}
          >
            {status.type === 'success' && <FiCheckCircle size={20} className="shrink-0" />}
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-4 mb-2">
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, role: 'student' }))}
              className={`p-5 rounded-2xl flex flex-col items-center gap-3 transition-all duration-300 ${
                form.role === 'student'
                  ? 'bg-blue-50 dark:bg-blue-500/10 border-2 border-blue-500/50 text-blue-700 dark:text-blue-400 shadow-sm'
                  : 'bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-700'
              }`}
            >
              <FiUser size={28} />
              <span className="font-extrabold text-[11px] uppercase tracking-widest">Student</span>
            </button>

            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, role: 'admin' }))}
              className={`p-5 rounded-2xl flex flex-col items-center gap-3 transition-all duration-300 ${
                form.role === 'admin'
                  ? 'bg-red-50 dark:bg-red-500/10 border-2 border-red-500/50 text-red-700 dark:text-red-400 shadow-sm'
                  : 'bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-700'
              }`}
            >
              <FiShield size={28} />
              <span className="font-extrabold text-[11px] uppercase tracking-widest">Admin</span>
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest pl-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              required
              autoComplete="name"
              maxLength={100}
              value={form.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              className="w-full p-4 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white shadow-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest pl-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              maxLength={254}
              value={form.email}
              onChange={handleInputChange}
              placeholder="Enter your email address"
              className="w-full p-4 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white shadow-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest pl-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              autoComplete="new-password"
              maxLength={128}
              value={form.password}
              onChange={handleInputChange}
              placeholder="Create a strong password"
              className="w-full p-4 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white shadow-sm font-medium"
            />
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-2.5 leading-relaxed pl-1">
              Minimum 8 characters with uppercase, lowercase, number and special character.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white py-4 rounded-2xl font-extrabold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 mt-8 text-[15px]"
          >
            {isLoading ? 'Creating Account...' : 'Request Account'}
          </button>
        </form>

        <p className="text-center text-[13px] font-medium text-gray-600 dark:text-gray-400 mt-8">
          Already have an account?{' '}
          <Link to="/login" className="font-extrabold text-blue-600 dark:text-blue-400 hover:underline">
            Log in
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Register;