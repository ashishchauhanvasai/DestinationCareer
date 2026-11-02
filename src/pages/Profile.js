import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiUser,
  FiBriefcase,
  FiAward,
  FiCheckCircle,
  FiLock,
  FiUpload,
} from "react-icons/fi";

// Shared Glass Input Styles
const inputStyles = "w-full p-3.5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 outline-none transition-all text-gray-900 dark:text-white shadow-sm font-medium";
const labelStyles = "block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider";

// =========================================================
// PROFILE PICTURE UPLOADER (Glassmorphism)
// =========================================================
const ProfilePicUpload = ({ currentPicUrl, onUploadSuccess }) => {
  const [image, setImage] = useState(currentPicUrl || "");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setImage(currentPicUrl || "");
  }, [currentPicUrl]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File size should be less than 2MB");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64String = reader.result;

      try {
        setUploading(true);
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/users/profile-pic`,
          { base64Image: base64String },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );

        setImage(base64String);
        if (onUploadSuccess) onUploadSuccess(base64String);
        alert("Profile picture updated!");
      } catch (err) {
        console.error("Failed to upload picture:", err);
        alert(err.response?.data?.message || "Failed to upload picture");
        setImage(currentPicUrl || "");
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    };
    reader.onerror = () => {
      alert("Failed to read the selected image.");
      e.target.value = "";
    };
  };

  return (
    <div className="flex flex-col items-center sm:items-start gap-4">
      <div className="relative group">
        <img
          src={image || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
          alt="Profile"
          className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white/60 dark:border-slate-700/60 shadow-xl"
        />
        <div className="absolute inset-0 rounded-full bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </div>

      <label className="cursor-pointer glass-button text-blue-600 dark:text-blue-400 px-5 py-2.5 rounded-full text-xs font-extrabold flex items-center justify-center gap-2 w-full sm:w-auto">
        <FiUpload size={16} />
        {uploading ? "Uploading..." : "Change Photo"}
        <input
          type="file"
          accept="image/png, image/jpeg"
          className="hidden"
          onChange={handleImageChange}
          disabled={uploading}
        />
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
    profilePic: "",
    employabilityScore: 0,
    contactNumber: "",
    address: "",
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
  const isPromo = role === "promotional";

  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  useEffect(() => {
    if (role === "admin") return;

    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/profile`, config);
        setProfile((prev) => ({
          ...prev,
          ...res.data,
          contactNumber: res.data.contactNumber || "",
          address: res.data.address || "",
          skillsAcquired: Array.isArray(res.data.skillsAcquired)
            ? res.data.skillsAcquired.join(", ")
            : res.data.skillsAcquired || "",
        }));
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field, value) => {
    // If the profile is locked, only skills can be modified
    if (profile.profileLocked && field !== "skillsAcquired") {
      return;
    }

    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      let payload;
      if (profile.profileLocked && !isPromo) {
        // Locked students can update only their Technical Skills.
        payload = {
          skillsAcquired: profile.skillsAcquired,
        };
      } else if (isPromo) {
        payload = {
          contactNumber: profile.contactNumber,
          address: profile.address,
          skillsAcquired: profile.skillsAcquired,
        };
      } else {
        payload = { ...profile };
      }

      await axios.put(`${process.env.REACT_APP_API_URL}/api/users/profile`, payload, config);

      setSaveSuccess(true);
      
      if (!isPromo && !profile.profileLocked) {
        setProfile((prev) => ({
          ...prev,
          profileLocked: true,
        }));
      }

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert(err.response?.data?.message || "Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ADMIN RESTRICTED VIEW (Glassmorphism)
  if (role === "admin") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="glass-panel p-10 rounded-[2rem] max-w-lg w-full text-center flex flex-col items-center">
          <div className="w-20 h-20 mb-6 rounded-full bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center border border-red-500/20">
            <FiLock className="text-red-500 dark:text-red-400" size={36} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">
            Access Restricted
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
            Administrators do not require academic profiles. This section is strictly for students to use with the Smart Matching Engine.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 pb-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* PAGE HEADER & PROFILE PIC (Glass Panel) */}
        <div className="glass-panel p-8 md:p-10 rounded-[2rem] flex flex-col sm:flex-row items-center gap-8">
          <ProfilePicUpload
            currentPicUrl={profile.profilePic}
            onUploadSuccess={(newPicUrl) => setProfile((prev) => ({ ...prev, profilePic: newPicUrl }))}
          />
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1">
              {isPromo ? "My Profile" : "My Academic Profile"}
            </h1>
            <p className="text-xl font-bold text-gray-700 dark:text-gray-200">
              {profile.name || "User"}
            </p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-3 flex items-center justify-center sm:justify-start gap-2 bg-black/5 dark:bg-white/5 w-fit px-4 py-1.5 rounded-full border border-black/5 dark:border-white/5 mx-auto sm:mx-0">
              <FiUser size={14} />
              {profile.email}
            </p>
          </div>
        </div>

        {/* EMPLOYABILITY SCORE (Students Only) */}
        {!isPromo && (
          <div className="glass-panel p-8 rounded-[2rem]">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 dark:bg-yellow-500/20 flex items-center justify-center border border-yellow-500/20">
                <FiAward className="text-yellow-600 dark:text-yellow-400" size={24} />
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
                  Employability Score
                </p>
                <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  {profile.employabilityScore} <span className="text-base text-gray-400">/ 100</span>
                </p>
              </div>
            </div>

            <div className="w-full bg-black/5 dark:bg-white/5 rounded-full h-3 overflow-hidden backdrop-blur-sm border border-black/5 dark:border-white/5">
              <div
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(Math.max(profile.employabilityScore || 0, 0), 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* PROFILE FORM (Glass Panel) */}
        <form onSubmit={handleSubmit}>
          {/* Locked Status Indicator */}
          {profile.profileLocked && (
            <div className="mb-6 p-6 glass-panel rounded-[1.5rem] bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
                  <FiLock className="text-amber-600 dark:text-amber-400" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-amber-800 dark:text-amber-400 mb-1">
                    Profile Locked
                  </h3>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-500 leading-relaxed">
                    {isPromo
                      ? "Your core profile details are locked. However, you can still update your Technical Skills below."
                      : "Your eligibility details are locked. However, you can still update your Technical Skills below."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="glass-panel p-8 rounded-[2rem]">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 dark:bg-blue-400/10 flex items-center justify-center border border-blue-500/20">
                <FiBriefcase className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Profile Details
              </h2>
            </div>

            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-8 px-1">
              {isPromo
                ? "Update your contact information and technical skills."
                : "Fill in your eligibility details accurately. This data is used to match you with suitable job openings."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* PROMOTIONAL FIELDS */}
              {isPromo && (
                <>
                  <div>
                    <label className={labelStyles}>Contact Number</label>
                    <input
                      type="text"
                      value={profile.contactNumber || ""}
                      onChange={(e) => handleChange("contactNumber", e.target.value)}
                      placeholder="Phone Number"
                      className={inputStyles}
                    />
                  </div>
                  <div>
                    <label className={labelStyles}>Address</label>
                    <input
                      type="text"
                      value={profile.address || ""}
                      onChange={(e) => handleChange("address", e.target.value)}
                      placeholder="Full Address"
                      className={inputStyles}
                    />
                  </div>
                </>
              )}

              {/* STUDENT FIELDS */}
              {!isPromo && (
                <>
                  <div>
                    <label className={labelStyles}>Highest Qualification</label>
                    <input
                      type="text"
                      value={profile.highestQualification || ""}
                      onChange={(e) => handleChange("highestQualification", e.target.value)}
                      placeholder="e.g. B.Tech"
                      disabled={profile.profileLocked}
                      className={`${inputStyles} ${profile.profileLocked ? 'opacity-60 cursor-not-allowed bg-black/5' : ''}`}
                    />
                  </div>
                  <div>
                    <label className={labelStyles}>Passing Year</label>
                    <input
                      type="number"
                      value={profile.passingYear || ""}
                      onChange={(e) => handleChange("passingYear", e.target.value)}
                      placeholder="e.g. 2026"
                      disabled={profile.profileLocked}
                      className={`${inputStyles} ${profile.profileLocked ? 'opacity-60 cursor-not-allowed bg-black/5' : ''}`}
                    />
                  </div>
                  <div>
                    <label className={labelStyles}>Overall Percentage / CGPA</label>
                    <input
                      type="text"
                      value={profile.percentage || ""}
                      onChange={(e) => handleChange("percentage", e.target.value)}
                      placeholder="e.g. 75.50"
                      disabled={profile.profileLocked}
                      className={`${inputStyles} ${profile.profileLocked ? 'opacity-60 cursor-not-allowed bg-black/5' : ''}`}
                    />
                  </div>
                  <div>
                    <label className={labelStyles}>Active Backlogs</label>
                    <input
                      type="number"
                      min="0"
                      value={profile.backlogs ?? 0}
                      onChange={(e) => handleChange("backlogs", parseInt(e.target.value, 10) || 0)}
                      placeholder="0"
                      disabled={profile.profileLocked}
                      className={`${inputStyles} ${profile.profileLocked ? 'opacity-60 cursor-not-allowed bg-black/5' : ''}`}
                    />
                  </div>
                  <div>
                    <label className={labelStyles}>Gap in Education (Years)</label>
                    <input
                      type="number"
                      min="0"
                      value={profile.educationGap ?? 0}
                      onChange={(e) => handleChange("educationGap", parseInt(e.target.value, 10) || 0)}
                      placeholder="0"
                      disabled={profile.profileLocked}
                      className={`${inputStyles} ${profile.profileLocked ? 'opacity-60 cursor-not-allowed bg-black/5' : ''}`}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 flex items-center mt-2">
                    <label className={`flex items-center gap-3 cursor-pointer group ${profile.profileLocked ? 'opacity-60 cursor-not-allowed' : ''}`}>
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={!!profile.readyForRelocation}
                          onChange={(e) => handleChange("readyForRelocation", e.target.checked)}
                          disabled={profile.profileLocked}
                          className="peer appearance-none w-6 h-6 border-2 border-gray-300 dark:border-slate-600 rounded-lg checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer disabled:cursor-not-allowed"
                        />
                        <FiCheckCircle className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" size={16} />
                      </div>
                      <span className={`text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors ${!profile.profileLocked && 'group-hover:text-blue-600'}`}>
                        I am ready to relocate for work
                      </span>
                    </label>
                  </div>
                </>
              )}

              {/* SHARED FIELD (Skills are always editable) */}
              <div className="col-span-1 md:col-span-2 mt-2">
                <label className={labelStyles}>Technical Skills (Comma separated)</label>
                <input
                  type="text"
                  value={profile.skillsAcquired || ""}
                  onChange={(e) => handleChange("skillsAcquired", e.target.value)}
                  placeholder="Java, React, SQL..."
                  className={inputStyles}
                />
              </div>
            </div>

            {/* FOOTER / SUBMIT */}
            <div className="mt-8 pt-8 border-t border-black/5 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1">
                {saveSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 rounded-xl backdrop-blur-md w-fit animate-fade-in">
                    <FiCheckCircle size={18} />
                    <p className="text-sm font-bold">
                      {isPromo ? "Profile saved successfully!" 
                       : profile.profileLocked ? "Technical skills saved successfully!" 
                       : "Profile saved successfully and locked!"}
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3.5 rounded-xl font-extrabold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-60 transition-all"
              >
                {isSaving ? "Saving Data..." : "Save Profile Details"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;