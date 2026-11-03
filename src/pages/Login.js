import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FiLock, FiCheckCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { isMobile } from 'react-device-detect';

const getPermanentDeviceId = () => {
  const KEY = 'dc_permanent_device_id';
  let deviceId = localStorage.getItem(KEY) || localStorage.getItem('deviceId');

  if (!deviceId) {
    const escapedKey = KEY.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + escapedKey + '=([^;]*)'));
    if (match) {
      try {
        deviceId = decodeURIComponent(match[1]);
      } catch {
        deviceId = match[1];
      }
    }
  }

  if (!deviceId) {
    const mobileDevice = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const platform = (navigator.platform || 'unknown').replace(/[^a-zA-Z0-9]/g, '');
    const cores = navigator.hardwareConcurrency || '4';
    const randomPart = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

    deviceId = [
      mobileDevice ? 'MOB' : 'DESK',
      platform,
      cores,
      randomPart
    ].join('-');
  }

  localStorage.setItem(KEY, deviceId);
  localStorage.setItem('deviceId', deviceId);

  const cookieValue = encodeURIComponent(deviceId);
  const tenYearsInSeconds = 60 * 60 * 24 * 365 * 10;
  document.cookie = `${KEY}=${cookieValue}; max-age=${tenYearsInSeconds}; path=/; SameSite=Lax`;

  return deviceId;
};

const Login = () => {
  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const [view, setView] = useState('login');
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const validateLoginInput = (formData) => {
    const errors = {};
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.password || formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    return errors;
  };
const handleLogin = async (e) => {
    e.preventDefault();
    const validationErrors = validateLoginInput(form);
    if (Object.keys(validationErrors).length > 0) {
      setError(Object.values(validationErrors).join(' '));
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const deviceId = getPermanentDeviceId();
      const sanitizedPayload = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        deviceId,
        deviceType: isMobile ? 'mobile' : 'desktop'
      };

      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/login`, sanitizedPayload);

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('userId', res.data.userId);

      // 1. Determine their default fallback route based on role
      const role = res.data.role;
      let defaultRoute = '/';
      if (role === 'admin' || role === 'superadmin') defaultRoute = '/admin';
      else if (role === 'trainer') defaultRoute = '/trainer';
      else if (role === 'promotional') defaultRoute = '/promo-dashboard';
      else if (role === 'campus_student') defaultRoute = '/campus-portal';

      // 2. Check if we have a saved page in the stack, or if they were redirected here
      const lastVisited = localStorage.getItem('lastVisitedPage');

      // 3. Navigate them to the last page, OR their default dashboard
      if (lastVisited && lastVisited !== '/login' && lastVisited !== '/') {
        navigate(lastVisited);
      } else {
        navigate(defaultRoute);
      }

    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      if (errorMessage.includes('pending')) {
        setIsPending(true);
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
};
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!resetEmail.trim()) {
      setError('Please enter your registered email.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/forgot-password`, {
        email: resetEmail.trim()
      });
      setSuccess(res.data.message);
      setView('verify-otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/verify-otp`, {
        email: resetEmail.trim(),
        otp
      });
      setSuccess(res.data.message);
      setView('reset-password');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword.trim()) {
      setError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/reset-password`, {
        email: resetEmail.trim().toLowerCase(),
        otp,
        newPassword
      });
      setSuccess(res.data.message);
      setView('login');
      setForm({ ...form, password: '' });
      setResetEmail('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#f6f8fd] dark:bg-slate-900">
      {/* Light Color Lifter Gradient Blobs */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-blue-400/30 dark:bg-blue-600/20 blur-[140px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-indigo-400/30 dark:bg-indigo-600/20 blur-[140px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-[420px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/60 dark:border-slate-700/60 rounded-[2.5rem] p-10 md:p-12 shadow-[0_8px_40px_rgba(0,0,0,0.06)] relative z-10">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 text-blue-600 dark:text-blue-400 rounded-[1.5rem] flex items-center justify-center border border-white dark:border-slate-700 shadow-sm shadow-blue-500/10">
              <FiLock size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
            Destination Career
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
            {view === 'login' && 'Welcome back! Please enter your details.'}
            {view === 'request-otp' && 'Enter your email to receive an OTP.'}
            {view === 'verify-otp' && 'Enter the 6-digit OTP sent to your email.'}
            {view === 'reset-password' && 'Create a new secure password.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold shadow-sm animate-fade-in text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 text-green-700 dark:text-green-400 text-sm font-bold shadow-sm flex items-center justify-center gap-2 animate-fade-in">
            <FiCheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest pl-1">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="Enter your email"
                className="w-full p-4 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white shadow-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest pl-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  placeholder="Enter your password"
                  className="w-full p-4 pr-12 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white shadow-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[18px] text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-white dark:bg-slate-950 pl-2"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  setView('request-otp');
                  clearMessages();
                }}
                className="text-[13px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline transition-all pr-1"
              >
                Forgot Password?
              </button>
            </div>

            {isPending && (
              <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl text-sm font-bold text-amber-800 dark:text-amber-500 shadow-sm text-center">
                Your account is currently pending approval.
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white py-4 rounded-2xl font-extrabold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 mt-2 text-[15px]"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Signing In...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <p className="text-center text-[13px] font-medium text-gray-500 dark:text-gray-400 pt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 dark:text-blue-400 font-extrabold hover:underline">
                Register
              </Link>
            </p>
          </form>
        )}

        {view === 'request-otp' && (
          <form onSubmit={handleRequestOTP} className="space-y-6">
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest pl-1">
                Account Email
              </label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                placeholder="Enter your registered email"
                className="w-full p-4 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white shadow-sm font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white py-4 rounded-2xl font-extrabold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 text-[15px]"
            >
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </button>

            <button
              type="button"
              onClick={() => {
                setView('login');
                clearMessages();
              }}
              className="w-full text-[13px] font-extrabold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mt-4"
            >
              Back to Login
            </button>
          </form>
        )}

        {view === 'verify-otp' && (
          <form onSubmit={handleVerifyOTP} className="space-y-8">
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest text-center">
                Enter 6-digit OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                placeholder="------"
                className="w-full p-4 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white shadow-sm text-center tracking-[1em] font-extrabold text-3xl h-20"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white py-4 rounded-2xl font-extrabold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 text-[15px]"
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="flex justify-between items-center px-2">
              <button
                type="button"
                onClick={() => {
                  setView('request-otp');
                  setOtp('');
                  clearMessages();
                }}
                className="text-[13px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Resend OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  clearMessages();
                }}
                className="text-[13px] font-extrabold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {view === 'reset-password' && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="relative">
              <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest pl-1">
                New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Enter a new strong password"
                className="w-full p-4 pr-12 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white shadow-sm font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[40px] text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-white dark:bg-slate-950 pl-2"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>

            <div className="relative">
              <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest pl-1">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Re-enter your new password"
                className="w-full p-4 pr-12 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white shadow-sm font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:opacity-60 text-white py-4 rounded-2xl font-extrabold shadow-lg shadow-green-500/30 transition-all flex items-center justify-center gap-2 mt-4 text-[15px]"
            >
              {isLoading ? 'Resetting...' : 'Save New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;