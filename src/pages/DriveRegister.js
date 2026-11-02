import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import { FiCheckCircle, FiCalendar, FiClock } from "react-icons/fi";

const API = `${process.env.REACT_APP_API_URL}/api`;

const inputCls = "apple-input";
const labelCls = "block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1";

const DriveRegister = () => {
  const { driveCode } = useParams();
  const [driveInfo, setDriveInfo] = useState(null);
  const [loadingDrive, setLoadingDrive] = useState(true);
  const [driveError, setDriveError] = useState("");

  const [form, setForm] = useState({
    name: "", email: "", password: "", contactNumber: "", aadharNumber: "",
    panCard: "", address: "", tenthPercentage: "", twelfthPercentage: "",
    stream: "", branch: "", yearOfStudy: "", highestQualification: "",
    passingYear: "", percentage: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchDriveInfo = async () => {
      try {
        const res = await axios.get(`${API}/drives/${driveCode}/public-info`);
        if (isMounted) setDriveInfo(res.data);
      } catch (err) {
        if (isMounted) setDriveError(err.response?.data?.message || "Invalid or expired Campus Drive link.");
      } finally {
        if (isMounted) setLoadingDrive(false);
      }
    };
    fetchDriveInfo();
    return () => { isMounted = false; };
  }, [driveCode]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\d{10}$/.test(form.contactNumber.trim())) { setError("Please enter a valid 10-digit contact number."); return; }
    if (!/^\d{12}$/.test(form.aadharNumber.trim())) { setError("Please enter a valid 12-digit Aadhaar number."); return; }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.panCard.trim().toUpperCase())) { setError("Please enter a valid PAN card number."); return; }

    const tenth = Number(form.tenthPercentage);
    const twelfth = Number(form.twelfthPercentage);
    const degree = Number(form.percentage);

    if (
      !Number.isFinite(tenth) || tenth < 0 || tenth > 100 ||
      !Number.isFinite(twelfth) || twelfth < 0 || twelfth > 100 ||
      !Number.isFinite(degree) || degree < 0 || degree > 100
    ) {
      setError("Please enter valid academic percentages between 0 and 100.");
      return;
    }

    const currentYear = new Date().getFullYear();
    const passingYear = Number(form.passingYear);

    if (!Number.isInteger(passingYear) || passingYear < 1950 || passingYear > currentYear + 10) {
      setError("Please enter a valid passing year.");
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      await axios.post(`${API}/drives/${driveCode}/register`, {
        ...form,
        contactNumber: form.contactNumber.trim(),
        aadharNumber: form.aadharNumber.trim(),
        panCard: form.panCard.trim().toUpperCase(),
        address: form.address.trim(),
        tenthPercentage: tenth,
        twelfthPercentage: twelfth,
        percentage: degree,
        passingYear,
        stream: form.stream.trim(),
        branch: form.branch.trim(),
        highestQualification: form.highestQualification.trim(),
      });
      setRegistered(true);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDrive) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#f1f5f9] dark:bg-slate-900">
        <div className="glass-panel p-10 rounded-[2.5rem] flex flex-col items-center gap-4 animate-pulse">
           <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
           <p className="text-lg font-extrabold text-gray-800 dark:text-gray-200">Loading Drive Details...</p>
        </div>
      </div>
    );
  }

  if (driveError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#f1f5f9] dark:bg-slate-900">
        <div className="glass-panel p-12 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center border-white/60 animate-fade-in">
          <h2 className="text-2xl font-extrabold text-red-600 dark:text-red-400 mb-4 tracking-tight">Link Unavailable</h2>
          <p className="text-gray-600 dark:text-gray-300 font-medium mb-8 leading-relaxed">{driveError}</p>
          <Link to="/login" className="glass-button w-full block text-center text-blue-600 dark:text-blue-400 font-extrabold py-3.5 rounded-xl transition-all shadow-sm">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#f1f5f9] dark:bg-slate-900">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="glass-panel p-12 rounded-[2.5rem] shadow-2xl max-w-lg w-full text-center border-white/60 relative z-10 animate-fade-in">
          <div className="w-24 h-24 bg-gradient-to-br from-teal-400 to-teal-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-500/30 border-4 border-white/50">
            <FiCheckCircle size={44} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">Registration Submitted!</h2>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
            You have registered for the <strong className="text-gray-900 dark:text-white">{driveInfo?.collegeName}</strong> Campus Drive. Once the promotional team approves your registration, you will be able to log in to the test portal.
          </p>
          <Link to="/login" className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-extrabold py-4 rounded-xl block shadow-lg shadow-teal-500/30 hover:scale-[0.98] transition-transform text-[15px]">
            Go to Login Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden bg-[#f1f5f9] dark:bg-slate-900">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/20 blur-[140px] rounded-full pointer-events-none fixed"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[140px] rounded-full pointer-events-none fixed"></div>

      <div className="max-w-2xl w-full glass-panel rounded-[2.5rem] shadow-2xl border-white/60 relative z-10 overflow-hidden animate-fade-in">
        
        {/* CAMPUS DRIVE HEADER */}
        <div className="bg-gradient-to-br from-teal-500 to-blue-600 p-8 md:p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          
          <span className="text-[10px] uppercase tracking-widest bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-lg font-extrabold border border-white/30 shadow-sm inline-block mb-3 relative z-10">
            Campus Recruitment Drive
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight relative z-10">{driveInfo?.collegeName}</h1>
          
          <div className="flex flex-wrap gap-3 mt-5 text-[11px] font-extrabold uppercase tracking-wider relative z-10">
            <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/10">
              <FiCalendar /> Scheduled: {driveInfo?.scheduledTestTime ? new Date(driveInfo.scheduledTestTime).toLocaleString("en-IN") : "Not specified"}
            </span>
            <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/10">
              <FiClock /> Duration: {driveInfo?.durationMinutes} mins
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-6">
          {error && (
            <div role="alert" className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm font-bold shadow-sm flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0"></div> {error}
            </div>
          )}

          <div>
            <label className={labelCls}>Full Name *</label>
            <input required value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Enter your full name" autoComplete="name" className={inputCls} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Email ID *</label>
              <input required type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="you@example.com" autoComplete="email" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Contact Number *</label>
              <input required type="tel" inputMode="numeric" maxLength={10} value={form.contactNumber} onChange={(e) => handleChange("contactNumber", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile number" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Aadhaar Card Number *</label>
              <input required type="password" inputMode="numeric" maxLength={12} autoComplete="off" value={form.aadharNumber} onChange={(e) => handleChange("aadharNumber", e.target.value.replace(/\D/g, "").slice(0, 12))} placeholder="12-digit Aadhaar number" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>PAN Card Number *</label>
              <input required type="text" maxLength={10} autoComplete="off" value={form.panCard} onChange={(e) => handleChange("panCard", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="ABCDE1234F" className={`${inputCls} uppercase`} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Full Residential Address *</label>
            <textarea required value={form.address} onChange={(e) => handleChange("address", e.target.value)} placeholder="House No, Street, City, State" className={`${inputCls} resize-none`} rows={2} />
          </div>

          <div className="pt-4 border-t border-black/5 dark:border-white/5 mt-6 mb-4">
             <h3 className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight">Academic Background</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div><label className={labelCls}>10th Percentage *</label><input required type="number" min="0" max="100" step="0.1" value={form.tenthPercentage} onChange={(e) => handleChange("tenthPercentage", e.target.value)} placeholder="%" className={inputCls} /></div>
            <div><label className={labelCls}>12th / Diploma Percentage *</label><input required type="number" min="0" max="100" step="0.1" value={form.twelfthPercentage} onChange={(e) => handleChange("twelfthPercentage", e.target.value)} placeholder="%" className={inputCls} /></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div><label className={labelCls}>Stream *</label><input required value={form.stream} onChange={(e) => handleChange("stream", e.target.value)} placeholder="e.g. B.Tech" className={inputCls} /></div>
            <div><label className={labelCls}>Branch *</label><input required value={form.branch} onChange={(e) => handleChange("branch", e.target.value)} placeholder="e.g. CSE / IT" className={inputCls} /></div>
            
            <div>
              <label className={labelCls}>Current Year *</label>
              <select required value={form.yearOfStudy} onChange={(e) => handleChange("yearOfStudy", e.target.value)} className={`${inputCls} cursor-pointer`}>
                <option value="">Select</option><option value="1st Year">1st Year</option><option value="2nd Year">2nd Year</option><option value="3rd Year">3rd Year</option><option value="4th Year / Final">4th Year / Final</option><option value="Graduated">Graduated</option>
              </select>
            </div>
            <div><label className={labelCls}>Degree % / CGPA *</label><input required type="number" min="0" max="100" step="0.1" value={form.percentage} onChange={(e) => handleChange("percentage", e.target.value)} placeholder="75" className={inputCls} /></div>
          </div>

          <div className="pt-2">
            <label className={labelCls}>Passout Year *</label>
            <input required type="number" min="1950" max={new Date().getFullYear() + 10} value={form.passingYear} onChange={(e) => handleChange("passingYear", e.target.value)} placeholder="e.g. 2026" className={inputCls} />
          </div>

          <div className="pt-6 border-t border-black/5 dark:border-white/5 mt-4">
            <label className={labelCls}>Create Password *</label>
            <input required type="password" minLength={6} value={form.password} onChange={(e) => handleChange("password", e.target.value)} placeholder="Minimum 6 characters" autoComplete="new-password" className={inputCls} />
          </div>

          <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 disabled:opacity-60 text-white py-4 rounded-xl font-extrabold shadow-lg shadow-teal-500/30 transition-all hover:scale-[0.98] mt-6 text-[15px]">
            {submitting ? "Submitting Registration..." : "Register for Campus Drive"}
          </button>

          <p className="text-center text-[13px] font-medium text-gray-500 dark:text-gray-400 pt-6">
            Already registered?{" "}
            <Link to="/login" className="text-teal-600 dark:text-teal-400 font-extrabold hover:underline">
              Sign In here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default DriveRegister;