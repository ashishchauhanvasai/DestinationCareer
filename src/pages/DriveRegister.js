import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import {
  FiCheckCircle,
  FiCalendar,
  FiClock,
} from "react-icons/fi";

const API = `${process.env.REACT_APP_API_URL}/api`;

const DriveRegister = () => {
  const { driveCode } = useParams();

  const [driveInfo, setDriveInfo] = useState(null);
  const [loadingDrive, setLoadingDrive] = useState(true);
  const [driveError, setDriveError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    contactNumber: "",
    aadharNumber: "",
    panCard: "",
    address: "",
    tenthPercentage: "",
    twelfthPercentage: "",
    stream: "",
    branch: "",
    yearOfStudy: "",
    highestQualification: "",
    passingYear: "",
    percentage: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);

  // =========================================================
  // FETCH PUBLIC CAMPUS DRIVE INFORMATION
  // =========================================================
  useEffect(() => {
    let isMounted = true;

    const fetchDriveInfo = async () => {
      try {
        const res = await axios.get(
          `${API}/drives/${driveCode}/public-info`
        );

        if (isMounted) {
          setDriveInfo(res.data);
        }
      } catch (err) {
        if (isMounted) {
          setDriveError(
            err.response?.data?.message ||
              "Invalid or expired Campus Drive link."
          );
        }
      } finally {
        if (isMounted) {
          setLoadingDrive(false);
        }
      }
    };

    fetchDriveInfo();

    return () => {
      isMounted = false;
    };
  }, [driveCode]);

  // =========================================================
  // HANDLE INPUT CHANGES
  // =========================================================
  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // =========================================================
  // SUBMIT REGISTRATION
  // =========================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // Validate contact number.
    if (!/^\d{10}$/.test(form.contactNumber.trim())) {
      setError("Please enter a valid 10-digit contact number.");
      return;
    }

    // Validate Aadhaar number.
    if (!/^\d{12}$/.test(form.aadharNumber.trim())) {
      setError("Please enter a valid 12-digit Aadhaar number.");
      return;
    }

    // Validate PAN format.
    if (
      !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.panCard.trim().toUpperCase())
    ) {
      setError("Please enter a valid PAN card number.");
      return;
    }

    // Validate academic percentages.
    const tenth = Number(form.tenthPercentage);
    const twelfth = Number(form.twelfthPercentage);
    const degree = Number(form.percentage);

    if (
      !Number.isFinite(tenth) ||
      tenth < 0 ||
      tenth > 100 ||
      !Number.isFinite(twelfth) ||
      twelfth < 0 ||
      twelfth > 100 ||
      !Number.isFinite(degree) ||
      degree < 0 ||
      degree > 100
    ) {
      setError(
        "Please enter valid academic percentages between 0 and 100."
      );
      return;
    }

    const currentYear = new Date().getFullYear();
    const passingYear = Number(form.passingYear);

    if (
      !Number.isInteger(passingYear) ||
      passingYear < 1950 ||
      passingYear > currentYear + 10
    ) {
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
        yearOfStudy: form.yearOfStudy,
        highestQualification: form.highestQualification.trim(),
      });

      setRegistered(true);
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // LOADING STATE
  // =========================================================
  if (loadingDrive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-gray-600 font-semibold">
          Loading Campus Drive details...
        </p>
      </div>
    );
  }

  // =========================================================
  // INVALID OR EXPIRED DRIVE LINK
  // =========================================================
  if (driveError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center border">
          <h2 className="text-xl font-bold text-red-600 mb-2">
            Link Unavailable
          </h2>

          <p className="text-gray-600 text-sm mb-6">
            {driveError}
          </p>

          <Link
            to="/login"
            className="text-blue-600 font-semibold hover:underline"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================
  // REGISTRATION SUCCESS
  // =========================================================
  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center border">
          <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle size={34} />
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Registration Submitted!
          </h2>

          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            You have registered for the{" "}
            <strong>{driveInfo?.collegeName}</strong> Campus Drive.
            Once the promotional team approves your registration,
            you will be able to log in to the test portal.
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

  // =========================================================
  // REGISTRATION FORM
  // =========================================================
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center py-10 px-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border">

        {/* CAMPUS DRIVE HEADER */}
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 p-6 text-white">
          <span className="text-xs uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full font-bold">
            Campus Recruitment Drive
          </span>

          <h1 className="text-2xl font-extrabold mt-2">
            {driveInfo?.collegeName}
          </h1>

          <div className="flex flex-wrap gap-4 mt-3 text-xs text-teal-50">
            <span className="flex items-center gap-1">
              <FiCalendar />
              Scheduled:{" "}
              {driveInfo?.scheduledTestTime
                ? new Date(
                    driveInfo.scheduledTestTime
                  ).toLocaleString("en-IN")
                : "Not specified"}
            </span>

            <span className="flex items-center gap-1">
              <FiClock />
              Duration: {driveInfo?.durationMinutes} mins
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* ERROR MESSAGE */}
          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
            >
              {error}
            </div>
          )}

          {/* FULL NAME */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
              Full Name *
            </label>

            <input
              required
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter your full name"
              autoComplete="name"
              className="w-full p-2.5 border rounded-lg text-sm"
            />
          </div>

          {/* EMAIL AND CONTACT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                Email ID *
              </label>

              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full p-2.5 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                Contact Number *
              </label>

              <input
                required
                type="tel"
                inputMode="numeric"
                maxLength={10}
                pattern="[0-9]{10}"
                value={form.contactNumber}
                onChange={(e) =>
                  handleChange(
                    "contactNumber",
                    e.target.value.replace(/\D/g, "").slice(0, 10)
                  )
                }
                placeholder="10-digit mobile number"
                autoComplete="tel"
                className="w-full p-2.5 border rounded-lg text-sm"
              />
            </div>
          </div>

          {/* AADHAAR AND PAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                Aadhaar Card Number *
              </label>

              <input
                required
                type="password"
                inputMode="numeric"
                maxLength={12}
                pattern="[0-9]{12}"
                autoComplete="off"
                value={form.aadharNumber}
                onChange={(e) =>
                  handleChange(
                    "aadharNumber",
                    e.target.value.replace(/\D/g, "").slice(0, 12)
                  )
                }
                placeholder="12-digit Aadhaar number"
                className="w-full p-2.5 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                PAN Card Number *
              </label>

              <input
                required
                type="text"
                maxLength={10}
                autoComplete="off"
                value={form.panCard}
                onChange={(e) =>
                  handleChange(
                    "panCard",
                    e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                  )
                }
                pattern="[A-Z]{5}[0-9]{4}[A-Z]"
                title="Enter a valid PAN, for example ABCDE1234F"
                placeholder="ABCDE1234F"
                className="w-full p-2.5 border rounded-lg text-sm uppercase"
              />
            </div>
          </div>

          {/* RESIDENTIAL ADDRESS */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
              Full Residential Address *
            </label>

            <textarea
              required
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="House No, Street, City, State"
              autoComplete="street-address"
              className="w-full p-2.5 border rounded-lg text-sm"
              rows={2}
            />
          </div>

          {/* ACADEMIC BACKGROUND */}
          <h3 className="font-bold text-gray-700 text-sm border-b pb-1 pt-2">
            Academic Background
          </h3>

          {/* 10TH AND 12TH */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                10th Percentage *
              </label>

              <input
                required
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.tenthPercentage}
                onChange={(e) =>
                  handleChange("tenthPercentage", e.target.value)
                }
                placeholder="%"
                className="w-full p-2.5 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                12th / Diploma Percentage *
              </label>

              <input
                required
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.twelfthPercentage}
                onChange={(e) =>
                  handleChange("twelfthPercentage", e.target.value)
                }
                placeholder="%"
                className="w-full p-2.5 border rounded-lg text-sm"
              />
            </div>
          </div>

          {/* STREAM, BRANCH, YEAR, DEGREE PERCENTAGE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                Stream *
              </label>

              <input
                required
                value={form.stream}
                onChange={(e) => handleChange("stream", e.target.value)}
                placeholder="e.g. B.Tech"
                className="w-full p-2.5 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                Branch *
              </label>

              <input
                required
                value={form.branch}
                onChange={(e) => handleChange("branch", e.target.value)}
                placeholder="e.g. CSE / IT"
                className="w-full p-2.5 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                Current Year *
              </label>

              <select
                required
                value={form.yearOfStudy}
                onChange={(e) =>
                  handleChange("yearOfStudy", e.target.value)
                }
                className="w-full p-2.5 border rounded-lg text-sm bg-white"
              >
                <option value="">Select</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year / Final">4th Year / Final</option>
                <option value="Graduated">Graduated</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                Degree % / CGPA *
              </label>

              <input
                required
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.percentage}
                onChange={(e) => handleChange("percentage", e.target.value)}
                placeholder="75"
                className="w-full p-2.5 border rounded-lg text-sm"
              />
            </div>
          </div>

          {/* PASSING YEAR */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
              Passout Year *
            </label>

            <input
              required
              type="number"
              min="1950"
              max={new Date().getFullYear() + 10}
              value={form.passingYear}
              onChange={(e) => {
                handleChange("passingYear", e.target.value);
              }}
              placeholder="e.g. 2026"
              className="w-full p-2.5 border rounded-lg text-sm"
            />
          </div>

          {/* CREATE PASSWORD */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
              Create Password *
            </label>

            <input
              required
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              placeholder="Minimum 6 characters"
              autoComplete="new-password"
              className="w-full p-2.5 border rounded-lg text-sm"
            />
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white py-3 rounded-xl font-bold transition mt-2"
          >
            {submitting
              ? "Submitting Registration..."
              : "Register for Campus Drive"}
          </button>

          <p className="text-center text-xs text-gray-500 pt-2">
            Already registered?{" "}
            <Link
              to="/login"
              className="text-teal-600 font-bold hover:underline"
            >
              Sign In here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default DriveRegister;
