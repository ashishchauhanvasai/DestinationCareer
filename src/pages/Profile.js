import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiUser,
  FiBriefcase,
  FiAward,
  FiCheckCircle,
  FiLock,
  FiUpload
} from "react-icons/fi";

// =========================================================
// NEW COMPONENT: PROFILE PICTURE UPLOADER
// =========================================================
const ProfilePicUpload = ({ currentPicUrl, onUploadSuccess }) => {
  const [image, setImage] = useState(currentPicUrl || '');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setImage(currentPicUrl);
  }, [currentPicUrl]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // File size check (Max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64String = reader.result;
      setImage(base64String); // Show preview instantly
      
      try {
        setUploading(true);
        await axios.put(`${process.env.REACT_APP_API_URL}/api/users/profile-pic`, 
          { base64Image: base64String }, 
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        alert('Profile picture updated!');
        if (onUploadSuccess) onUploadSuccess(base64String);
      } catch (err) {
        alert('Failed to upload picture');
        // Revert to old image if failed
        setImage(currentPicUrl);
      } finally {
        setUploading(false);
      }
    };
  };

  return (
    <div className="flex flex-col items-center sm:items-start gap-3">
      <img 
        src={image || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
        alt="Profile" 
        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-blue-100 shadow-md bg-white"
      />
      <label className="cursor-pointer bg-blue-50 text-blue-600 border border-blue-200 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-blue-100 transition flex items-center gap-2">
        <FiUpload />
        {uploading ? 'Uploading...' : 'Change Photo'}
        <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleImageChange} disabled={uploading} />
      </label>
    </div>
  );
};


// =========================================================
// MAIN PROFILE PAGE
// =========================================================
const Profile = () => {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    profilePic: "", // NEW FIELD IN STATE
    employabilityScore: 0,
    highestQualification: "",
    passingYear: "",
    percentage: "",
    backlogs: 0,
    educationGap: 0,
    readyForRelocation: false,
    skillsAcquired: "",
    profileLocked: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // =========================================================
  // FETCH PROFILE
  // =========================================================
  useEffect(() => {
    if (role !== "admin") {
      const fetchProfile = async () => {
        try {
          const res = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/users/profile`,
            config
          );
          setProfile((prev) => ({
            ...prev,
            ...res.data,
          }));
        } catch (err) {
          console.error("Failed to load profile:", err);
        }
      };
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================================================
  // HANDLE INPUT CHANGE
  // =========================================================
  const handleChange = (field, value) => {
    if (profile.profileLocked) return;
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  // =========================================================
  // SAVE PROFILE
  // =========================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (profile.profileLocked) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/users/profile`,
        profile,
        config
      );

      setSaveSuccess(true);
      setProfile((prev) => ({ ...prev, profileLocked: true }));

      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert(err.response?.data?.message || "Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // =========================================================
  // ADMIN ACCESS RESTRICTION
  // =========================================================
  if (role === "admin") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <FiLock className="text-red-600 dark:text-red-400" size={30} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Access Restricted</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Administrators do not require academic profiles. This section is
            strictly for students to use with the Smart Matching Engine.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // PROFILE PAGE
  // =========================================================
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">

        {/* =====================================================
            PAGE HEADER & PROFILE PICTURE
            ===================================================== */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            
            {/* NEW: Profile Picture Uploader */}
            <ProfilePicUpload 
              currentPicUrl={profile.profilePic} 
              onUploadSuccess={(newPicUrl) => setProfile(prev => ({...prev, profilePic: newPicUrl}))} 
            />

            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                My Academic Profile
              </h1>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mt-1">
                {profile.name || "Student"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                <FiUser /> {profile.email}
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            EMPLOYABILITY SCORE
            ===================================================== */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <FiAward className="text-yellow-600 dark:text-yellow-400" size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Employability Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile.employabilityScore} / 100</p>
            </div>
          </div>
          <div className="w-full h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(Math.max(profile.employabilityScore || 0, 0), 100)}%` }}
            />
          </div>
        </div>

        {/* =====================================================
            PROFILE FORM
            ===================================================== */}
        <form onSubmit={handleSubmit}>

          {profile.profileLocked && (
            <div className="mb-6 p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
              <div className="flex items-start gap-3">
                <FiLock className="text-amber-600 dark:text-amber-400 mt-1 shrink-0" size={22} />
                <div>
                  <h3 className="font-bold text-amber-800 dark:text-amber-300">Profile Locked</h3>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                    You have already submitted your eligibility details.
                    For smart matching integrity, changes can now only be made by an Administrator.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FiBriefcase className="text-blue-600 dark:text-blue-400" size={21} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Eligibility Details</h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Fill this out accurately. This data is used to automatically match you with eligible job openings.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Highest Qualification</label>
                <input
                  type="text"
                  value={profile.highestQualification}
                  onChange={(e) => handleChange("highestQualification", e.target.value)}
                  disabled={profile.profileLocked}
                  placeholder="e.g. B.Tech"
                  className={`w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${profile.profileLocked ? "opacity-60 cursor-not-allowed bg-gray-100 dark:bg-slate-600" : ""}`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Passing Year</label>
                <input
                  type="number"
                  value={profile.passingYear}
                  onChange={(e) => handleChange("passingYear", e.target.value)}
                  disabled={profile.profileLocked}
                  placeholder="e.g. 2026"
                  className={`w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${profile.profileLocked ? "opacity-60 cursor-not-allowed bg-gray-100 dark:bg-slate-600" : ""}`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Overall Percentage / CGPA</label>
                <input
                  type="text"
                  value={profile.percentage}
                  onChange={(e) => handleChange("percentage", e.target.value)}
                  disabled={profile.profileLocked}
                  placeholder="e.g. 75.50"
                  className={`w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${profile.profileLocked ? "opacity-60 cursor-not-allowed bg-gray-100 dark:bg-slate-600" : ""}`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Active Backlogs</label>
                <input
                  type="number"
                  min="0"
                  value={profile.backlogs}
                  onChange={(e) => handleChange("backlogs", parseInt(e.target.value, 10) || 0)}
                  disabled={profile.profileLocked}
                  placeholder="0"
                  className={`w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${profile.profileLocked ? "opacity-60 cursor-not-allowed bg-gray-100 dark:bg-slate-600" : ""}`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Gap in Education (Years)</label>
                <input
                  type="number"
                  min="0"
                  value={profile.educationGap}
                  onChange={(e) => handleChange("educationGap", parseInt(e.target.value, 10) || 0)}
                  disabled={profile.profileLocked}
                  placeholder="0"
                  className={`w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${profile.profileLocked ? "opacity-60 cursor-not-allowed bg-gray-100 dark:bg-slate-600" : ""}`}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Technical Skills (Comma separated)</label>
                <input
                  type="text"
                  value={profile.skillsAcquired}
                  onChange={(e) => handleChange("skillsAcquired", e.target.value)}
                  disabled={profile.profileLocked}
                  placeholder="Java, SQL, React, Node.js"
                  className={`w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${profile.profileLocked ? "opacity-60 cursor-not-allowed bg-gray-100 dark:bg-slate-600" : ""}`}
                />
              </div>
            </div>

            <div className="mt-6">
              <label className={`flex items-center gap-3 ${profile.profileLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
                <input
                  type="checkbox"
                  checked={profile.readyForRelocation}
                  onChange={(e) => handleChange("readyForRelocation", e.target.checked)}
                  disabled={profile.profileLocked}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all disabled:opacity-60"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">I am ready to relocate for work</span>
              </label>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
              {saveSuccess && (
                <div className="mb-5 flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <FiCheckCircle className="text-green-600 dark:text-green-400 shrink-0" size={22} />
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">Profile saved successfully and locked!</p>
                </div>
              )}

              {!profile.profileLocked && (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                >
                  {isSaving ? "Saving Data..." : "Save Profile Details"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile; 