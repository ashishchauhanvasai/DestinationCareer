
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

  // Validate registration input
  const validateRegisterInput = (formData) => {
    const errors = {};

    // Name validation
    if (!formData.name || formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    // Email validation
    if (
      !formData.email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      errors.email = 'Please enter a valid email address.';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)
    ) {
      errors.password =
        'Password must contain uppercase, lowercase, number, and special character.';
    }

    return errors;
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear previous status messages
    if (status.message) {
      setStatus({
        type: '',
        message: ''
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoading) return;

    // Validate input
    const validationErrors = validateRegisterInput(form);

    if (Object.keys(validationErrors).length > 0) {
      setStatus({
        type: 'error',
        message: Object.values(validationErrors).join(' ')
      });
      return;
    }

    setIsLoading(true);

    setStatus({
      type: '',
      message: ''
    });

    try {
      // Sanitize input
      const sanitizedForm = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role
      };

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/register`,
        sanitizedForm
      );

      setStatus({
        type: 'success',
        message: res.data.message || 'Registration successful!'
      });

      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);

    } catch (err) {
      setStatus({
        type: 'error',
        message:
          err.response?.data?.message || 'Registration failed. Please try again.'
      });

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border p-8">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            Destination Career
          </h1>
          <p className="text-gray-500">
            Create your account to get started
          </p>
        </div>

        {/* Status Message */}
        {status.message && (
          <div
            className={`p-4 rounded-lg mb-6 flex items-start gap-2 font-medium text-sm ${
              status.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {status.type === 'success' && (
              <FiCheckCircle size={18} className="mt-0.5" />
            )}

            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-4 mb-6">

            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, role: 'student' }))}
              className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${
                form.role === 'student'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-50'
              }`}
            >
              <FiUser size={24} />
              <span className="font-bold text-sm">Student</span>
            </button>

            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, role: 'admin' }))}
              className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${
                form.role === 'admin'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-50'
              }`}
            >
              <FiShield size={24} />
              <span className="font-bold text-sm">Admin</span>
            </button>

          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
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
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
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
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
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
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <p className="text-xs text-gray-500 mt-2">
              Minimum 8 characters with uppercase, lowercase, number and special character.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 text-white font-bold rounded-lg transition-colors mt-4 ${
              isLoading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Creating Account...' : 'Request Account'}
          </button>

        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-bold text-blue-600 hover:underline"
          >
            Log in
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Register;
