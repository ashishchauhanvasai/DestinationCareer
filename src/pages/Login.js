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

      if (res.data.role === 'admin' || res.data.role === 'superadmin') {
        navigate('/admin');
      } else if (res.data.role === 'trainer') {
        navigate('/trainer');
      } else if (res.data.role === 'promotional') {
        navigate('/promo-dashboard');
      } else if (res.data.role === 'campus_student') {
        navigate('/campus-portal');
      } else {
        navigate('/');
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
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background elements for Login screen */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 dark:bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 dark:bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 bg-blue-600/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-sm backdrop-blur-md">
              <FiLock size={28} />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Destination Career
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">
            {view === 'login' && 'Welcome back! Please enter your details.'}
            {view === 'request-otp' && 'Enter your email to receive an OTP.'}
            {view === 'verify-otp' && 'Enter the 6-digit OTP sent to your email.'}
            {view === 'reset-password' && 'Create a new secure password.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm font-bold shadow-sm animate-fade-in">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-sm font-bold shadow-sm flex items-center gap-2 animate-fade-in">
            <FiCheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="Enter your email"
                className="apple-input"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  placeholder="Enter your password"
                  className="apple-input pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[14px] text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
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
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline transition-all"
              >
                Forgot Password?
              </button>
            </div>

            {isPending && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-sm font-bold text-yellow-700 dark:text-yellow-500 shadow-sm">
                Your account is currently pending approval.
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white py-3.5 rounded-xl font-extrabold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 mt-4"
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

            <p className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 pt-2">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 dark:text-blue-400 font-extrabold hover:underline">
                Register
              </Link>
            </p>
          </form>
        )}

        {view === 'request-otp' && (
          <form onSubmit={handleRequestOTP} className="space-y-5">
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                Account Email
              </label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                placeholder="Enter your registered email"
                className="apple-input"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white py-3.5 rounded-xl font-extrabold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </button>

            <button
              type="button"
              onClick={() => {
                setView('login');
                clearMessages();
              }}
              className="w-full text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Back to Login
            </button>
          </form>
        )}

        {view === 'verify-otp' && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
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
                className="apple-input text-center tracking-[1em] font-extrabold text-2xl h-16"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white py-3.5 rounded-xl font-extrabold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setView('request-otp');
                  setOtp('');
                  clearMessages();
                }}
                className="text-sm font-extrabold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Resend OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  clearMessages();
                }}
                className="text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {view === 'reset-password' && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="relative">
              <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Enter a new strong password"
                className="apple-input pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[38px] text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>

            <div className="relative">
              <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Re-enter your new password"
                className="apple-input pr-12"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:opacity-60 text-white py-3.5 rounded-xl font-extrabold shadow-lg shadow-green-500/30 transition-all flex items-center justify-center gap-2 mt-4"
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