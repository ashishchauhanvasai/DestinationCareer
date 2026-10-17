// Save as: src/pages/DriveRegister.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { FiCheckCircle, FiCalendar, FiClock, FiAward } from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api`;

const DriveRegister = () => {
  const { driveCode } = useParams();
  const [driveInfo, setDriveInfo] = useState(null);
  const [loadingDrive, setLoadingDrive] = useState(true);
  const [driveError, setDriveError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    contactNumber: '',
    highestQualification: '',
    passingYear: '',
    percentage: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    axios
      .get(`${API}/drives/${driveCode}/public-info`)
      .then((res) => setDriveInfo(res.data))
      .catch((err) =>
        setDriveError(
          err.response?.data?.message || 'Invalid or expired Campus Drive link.'
        )
      )
      .finally(() => setLoadingDrive(false));
  }, [driveCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await axios.post(`${API}/drives/${driveCode}/register`, {
        ...form,
        percentage: form.percentage ? Number(form.percentage) : null
      });
      setRegistered(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDrive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-gray-600 font-semibold">Loading Campus Drive details...</p>
      </div>
    );
  }

  if (driveError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center border">
          <h2 className="text-xl font-bold text-red-600 mb-2">Link Unavailable</h2>
          <p className="text-gray-600 text-sm mb-6">{driveError}</p>
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center border">
          <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle size={34} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Submitted!</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            You have registered for the <strong>{driveInfo.collegeName}</strong> Campus Drive.
            Once the promotional team approves your registration, you will be able to log in to the test portal.
          </p>
          <Link
            to="/login"
            className="inline-block w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold transition"
          >
            Go to Login Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center py-10 px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl overflow-hidden border">
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 p-6 text-white">
          <span className="text-xs uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full font-bold">
            Campus Recruitment Drive
          </span>
          <h1 className="text-2xl font-extrabold mt-2">{driveInfo.collegeName}</h1>
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-teal-50">
            <span className="flex items-center gap-1">
              <FiCalendar /> Scheduled:{' '}
              {new Date(driveInfo.scheduledTestTime).toLocaleString('en-IN')}
            </span>
            <span className="flex items-center gap-1">
              <FiClock /> Duration: {driveInfo.durationMinutes} mins
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Full Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter your full name"
              className="w-full p-2.5 border rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Email ID *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full p-2.5 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Contact Number *</label>
              <input
                required
                value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                placeholder="10-digit mobile number"
                className="w-full p-2.5 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Qualification *</label>
              <input
                required
                value={form.highestQualification}
                onChange={(e) => setForm({ ...form, highestQualification: e.target.value })}
                placeholder="e.g. B.Tech / BCA"
                className="w-full p-2.5 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Passing Year *</label>
              <input
                required
                value={form.passingYear}
                onChange={(e) => setForm({ ...form, passingYear: e.target.value })}
                placeholder="e.g. 2026"
                className="w-full p-2.5 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">CGPA / % *</label>
              <input
                required
                type="number"
                step="0.01"
                value={form.percentage}
                onChange={(e) => setForm({ ...form, percentage: e.target.value })}
                placeholder="e.g. 75"
                className="w-full p-2.5 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Create Password *</label>
            <input
              required
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Minimum 6 characters"
              className="w-full p-2.5 border rounded-lg text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white py-3 rounded-xl font-bold transition mt-2"
          >
            {submitting ? 'Submitting Registration...' : 'Register for Campus Drive'}
          </button>

          <p className="text-center text-xs text-gray-500 pt-2">
            Already registered?{' '}
            <Link to="/login" className="text-teal-600 font-bold hover:underline">
              Sign In here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default DriveRegister;