// import React, { useState } from 'react';
// import axios from 'axios';
// import { Link, useNavigate } from 'react-router-dom';
// import { FiLock } from 'react-icons/fi';

// const Login = () => {
//   const [form, setForm] = useState({ email: '', password: '' });
//   const [error, setError] = useState('');
//   const [isPending, setIsPending] = useState(false);
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setIsPending(false);
    
//     try {
//       const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/login`, form);
      
//       // If approved, store credentials
//       localStorage.setItem('token', res.data.token);
//       localStorage.setItem('role', res.data.role);
//       localStorage.setItem('isLoggedIn', 'true'); // Kept for your legacy components
      
//       // Route based on role
//      if (res.data.role === 'admin' || res.data.role === 'superadmin') {
//   navigate('/admin');
// } else if (res.data.role === 'trainer') {
//   navigate('/trainer');
// } else {
//   navigate('/');
// }
//     } catch (err) {
//       const errorMessage = err.response?.data?.message || 'Login failed';
      
//       // Check if the specific error is because the account is pending approval
//       if (err.response?.status === 403 && errorMessage.toLowerCase().includes('pending')) {
//         setIsPending(true); 
//       }
      
//       setError(errorMessage);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
//       <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border p-8">
//         <div className="text-center mb-8">
//           <h1 className="text-3xl font-bold text-blue-600 mb-2">Destination Career</h1>
//           <p className="text-gray-500">Welcome back! Please enter your details.</p>
//         </div>
//         {error && (
//           <div className={`p-4 rounded-lg mb-6 flex items-start gap-3 text-sm font-medium border ${
//             isPending 
//               ? 'bg-orange-50 text-orange-800 border-orange-200' 
//               : 'bg-red-50 text-red-700 border-red-200'
//           }`}>
//              <FiLock className="mt-0.5 shrink-0" size={18} />
//              <span>{error}</span>
//           </div>
//         )}
//         <form onSubmit={handleSubmit} className="space-y-5">
//           <div>
//             <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
//             <input 
//               type="email" 
//               required 
//               value={form.email} 
//               onChange={(e) => setForm({...form, email: e.target.value})} 
//               className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
//             <input 
//               type="password" 
//               required 
//               value={form.password} 
//               onChange={(e) => setForm({...form, password: e.target.value})} 
//               className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
//             />
//           </div>
//           <button 
//             type="submit" 
//             className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors mt-2"
//           >
//             Sign In
//           </button>
//         </form>

//         <p className="text-center text-sm text-gray-500 mt-6">
//           Don't have an account? <Link to="/register" className="font-bold text-blue-600 hover:underline">Register</Link>
//         </p>
//       </div>
//     </div>
//   );
// };
// export default Login;

import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FiLock, FiCheckCircle } from 'react-icons/fi';

const Login = () => {
  // -----------------------------
  // LOGIN STATE
  // -----------------------------
  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  // -----------------------------
  // FORGOT PASSWORD STATE
  // -----------------------------
  const [view, setView] = useState('login');
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // -----------------------------
  // UI STATE
  // -----------------------------
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // =========================================================
  // STANDARD LOGIN
  // =========================================================
  // --- 1. Standard Login Handler ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setIsPending(false); setIsLoading(true);
    
    // --- NEW: Generate or retrieve a unique Device ID ---
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      // Create a random unique ID for this browser and save it permanently
      deviceId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('deviceId', deviceId);
    }
    
    try {
      // Send the deviceId along with email and password
      const payload = { ...form, deviceId };
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/login`, payload);
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('isLoggedIn', 'true');
      
      if (res.data.role === 'admin' || res.data.role === 'superadmin') {
        navigate('/admin');
      } else if (res.data.role === 'trainer') {
        navigate('/trainer');
      } else {
        navigate('/');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      // If pending registration OR pending device approval
      if (err.response?.status === 403 && (errorMessage.toLowerCase().includes('pending') || errorMessage.toLowerCase().includes('device'))) {
        setIsPending(true); 
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================
  // REQUEST OTP
  // =========================================================
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
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/forgot-password`,
        {
          email: resetEmail.trim()
        }
      );

      setSuccess(res.data.message);
      setView('verify-otp');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to send OTP'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================
  // VERIFY OTP
  // =========================================================
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
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/verify-otp`,
        {
          email: resetEmail.trim(),
          otp
        }
      );

      setSuccess(res.data.message);
      setView('reset-password');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Invalid OTP'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================
  // RESET PASSWORD
  // =========================================================
  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!newPassword.trim()) {
      setError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/reset-password`,
        {
          email: resetEmail.trim(),
          otp,
          newPassword
        }
      );

      setSuccess(res.data.message);

      setView('login');

      setForm({
        ...form,
        password: ''
      });

      setResetEmail('');
      setOtp('');
      setNewPassword('');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to reset password'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================
  // COMMON VIEW RESET
  // =========================================================
  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  // =========================================================
  // UI
  // =========================================================
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        {/* HEADER */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <FiLock size={26} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-800">
            Destination Career
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            {view === 'login' &&
              'Welcome back! Please enter your details.'}

            {view === 'request-otp' &&
              'Enter your email to receive an OTP.'}

            {view === 'verify-otp' &&
              'Enter the 6-digit OTP sent to your email.'}

            {view === 'reset-password' &&
              'Create a new secure password.'}
          </p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
            <FiCheckCircle />
            <span>{success}</span>
          </div>
        )}

        {/* =====================================================
            LOGIN
        ====================================================== */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5">

            {/* EMAIL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>

              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value
                  })
                }
                required
                placeholder="Enter your email"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>

              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value
                  })
                }
                required
                placeholder="Enter your password"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* FORGOT PASSWORD */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setView('request-otp');
                  clearMessages();
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {/* PENDING MESSAGE */}
            {isPending && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                Your account is currently pending approval.
              </div>
            )}

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 rounded-lg font-semibold transition"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>

            {/* REGISTER */}
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-blue-600 font-semibold hover:underline"
              >
                Register
              </Link>
            </p>
          </form>
        )}

        {/* =====================================================
            REQUEST OTP
        ====================================================== */}
        {view === 'request-otp' && (
          <form
            onSubmit={handleRequestOTP}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Email
              </label>

              <input
                type="email"
                value={resetEmail}
                onChange={(e) =>
                  setResetEmail(e.target.value)
                }
                required
                placeholder="Enter your registered email"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 rounded-lg font-semibold transition"
            >
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </button>

            <button
              type="button"
              onClick={() => {
                setView('login');
                clearMessages();
              }}
              className="w-full text-sm font-semibold text-gray-500 hover:text-gray-700"
            >
              Back to Login
            </button>
          </form>
        )}

        {/* =====================================================
            VERIFY OTP
        ====================================================== */}
        {view === 'verify-otp' && (
          <form
            onSubmit={handleVerifyOTP}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter 6-digit OTP
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) =>
                  setOtp(
                    e.target.value
                      .replace(/\D/g, '')
                      .slice(0, 6)
                  )
                }
                required
                placeholder="------"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-[0.5em] font-bold text-xl"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 rounded-lg font-semibold transition"
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setView('request-otp');
                  setOtp('');
                  clearMessages();
                }}
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                Resend OTP
              </button>

              <button
                type="button"
                onClick={() => {
                  setView('login');
                  clearMessages();
                }}
                className="text-sm font-semibold text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* =====================================================
            RESET PASSWORD
        ====================================================== */}
        {view === 'reset-password' && (
          <form
            onSubmit={handleResetPassword}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>

              <input
                type="password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                required
                minLength={6}
                placeholder="Enter a new strong password"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white py-3 rounded-lg font-semibold transition"
            >
              {isLoading
                ? 'Resetting...'
                : 'Save New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
