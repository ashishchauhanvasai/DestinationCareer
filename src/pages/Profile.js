
// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import {
//   FiUser,
//   FiBriefcase,
//   FiAward,
//   FiCheckCircle,
//   FiLock,
// } from "react-icons/fi";

// const Profile = () => {
//   const [profile, setProfile] = useState({
//     name: "",
//     email: "",
//     employabilityScore: 0,
//     highestQualification: "",
//     passingYear: "",
//     percentage: "",
//     backlogs: 0,
//     educationGap: 0,
//     readyForRelocation: false,
//     skillsAcquired: "",
//   });

//   const [isSaving, setIsSaving] = useState(false);
//   const [saveSuccess, setSaveSuccess] = useState(false);

//   const token = localStorage.getItem("token");
//   const role = localStorage.getItem("role");

//   const config = {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   };

//   useEffect(() => {
//     // Only fetch profile data if the user is NOT an admin
//     if (role !== "admin") {
//       const fetchProfile = async () => {
//         try {
//           const res = await axios.get(
//             "http://localhost:5000/api/users/profile",
//             config
//           );

//           setProfile((prev) => ({
//             ...prev,
//             ...res.data,
//           }));
//         } catch (err) {
//           console.error("Failed to load profile", err);
//         }
//       };

//       fetchProfile();
//     }

//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     setIsSaving(true);
//     setSaveSuccess(false);

//     try {
//       await axios.put(
//         "http://localhost:5000/api/users/profile",
//         profile,
//         config
//       );

//       setSaveSuccess(true);

//       setTimeout(() => {
//         setSaveSuccess(false);
//       }, 3000);
//     } catch (err) {
//       console.error("Failed to save profile", err);
//     }

//     setIsSaving(false);
//   };

//   // BLOCK ADMIN ACCESS TO THE PROFILE PAGE
//   if (role === "admin") {
//     return (
//       <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4">
//         <div className="max-w-lg w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 text-center">
//           <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
//             <FiLock
//               size={30}
//               className="text-red-600 dark:text-red-400"
//             />
//           </div>

//           <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
//             Access Restricted
//           </h1>

//           <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
//             Administrators do not require academic profiles.
//             This section is strictly for students to use with
//             the Smart Matching Engine.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-4xl mx-auto">

//         {/* Page Header */}
//         <div className="mb-6">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
//               <FiUser
//                 size={22}
//                 className="text-blue-600 dark:text-blue-400"
//               />
//             </div>

//             <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
//               My Academic Profile
//             </h1>
//           </div>

//           <div className="ml-14">
//             <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
//               {profile.name}
//             </h2>

//             <p className="text-sm text-gray-500 dark:text-gray-400">
//               {profile.email}
//             </p>
//           </div>
//         </div>

//         {/* Employability Score */}
//         <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
//           <div className="flex items-center gap-3">
//             <FiAward
//               size={24}
//               className="text-blue-600 dark:text-blue-400"
//             />

//             <div>
//               <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
//                 Employability Score
//               </p>

//               <p className="text-2xl font-bold text-gray-900 dark:text-white">
//                 {profile.employabilityScore} / 100
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Profile Form */}
//         <form
//           onSubmit={handleSubmit}
//           className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden"
//         >
//           <div className="p-6 sm:p-8">

//             {/* Eligibility Details */}
//             <div className="mb-8">
//               <div className="flex items-center gap-3 mb-2">
//                 <FiBriefcase
//                   size={22}
//                   className="text-blue-600 dark:text-blue-400"
//                 />

//                 <h2 className="text-xl font-bold text-gray-900 dark:text-white">
//                   Eligibility Details
//                 </h2>
//               </div>

//               <p className="text-sm text-gray-500 dark:text-gray-400">
//                 Fill this out accurately. This data is used to
//                 automatically match you with eligible job
//                 openings.
//               </p>
//             </div>

//             {/* Fields */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

//               {/* Highest Qualification */}
//               <div>
//                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
//                   Highest Qualification
//                 </label>

//                 <input
//                   type="text"
//                   value={profile.highestQualification}
//                   onChange={(e) =>
//                     setProfile({
//                       ...profile,
//                       highestQualification:
//                         e.target.value,
//                     })
//                   }
//                   className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
//                   placeholder="e.g. B.Tech"
//                 />
//               </div>

//               {/* Passing Year */}
//               <div>
//                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
//                   Passing Year
//                 </label>

//                 <input
//                   type="text"
//                   value={profile.passingYear}
//                   onChange={(e) =>
//                     setProfile({
//                       ...profile,
//                       passingYear: e.target.value,
//                     })
//                   }
//                   className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
//                   placeholder="e.g. 2026"
//                 />
//               </div>

//               {/* Percentage */}
//               <div>
//                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
//                   Overall Percentage / CGPA
//                 </label>

//                 <input
//                   type="number"
//                   step="0.01"
//                   value={profile.percentage}
//                   onChange={(e) =>
//                     setProfile({
//                       ...profile,
//                       percentage: e.target.value,
//                     })
//                   }
//                   className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
//                   placeholder="e.g. 75.50"
//                 />
//               </div>

//               {/* Backlogs */}
//               <div>
//                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
//                   Active Backlogs
//                 </label>

//                 <input
//                   type="number"
//                   min="0"
//                   value={profile.backlogs}
//                   onChange={(e) =>
//                     setProfile({
//                       ...profile,
//                       backlogs:
//                         parseInt(e.target.value) || 0,
//                     })
//                   }
//                   className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
//                   placeholder="0"
//                 />
//               </div>

//               {/* Education Gap */}
//               <div>
//                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
//                   Gap in Education (Years)
//                 </label>

//                 <input
//                   type="number"
//                   min="0"
//                   value={profile.educationGap}
//                   onChange={(e) =>
//                     setProfile({
//                       ...profile,
//                       educationGap:
//                         parseInt(e.target.value) || 0,
//                     })
//                   }
//                   className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
//                   placeholder="0"
//                 />
//               </div>

//               {/* Relocation */}
//               <div className="md:col-span-2">
//                 <label className="flex items-center gap-3 cursor-pointer">
//                   <input
//                     type="checkbox"
//                     checked={profile.readyForRelocation}
//                     onChange={(e) =>
//                       setProfile({
//                         ...profile,
//                         readyForRelocation:
//                           e.target.checked,
//                       })
//                     }
//                     className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all"
//                   />

//                   <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
//                     I am ready to relocate for work
//                   </span>
//                 </label>
//               </div>

//               {/* Skills */}
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
//                   Technical Skills (Comma separated)
//                 </label>

//                 <input
//                   type="text"
//                   value={profile.skillsAcquired}
//                   onChange={(e) =>
//                     setProfile({
//                       ...profile,
//                       skillsAcquired: e.target.value,
//                     })
//                   }
//                   className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
//                   placeholder="Java, SQL, React, Node.js"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Save Section */}
//           <div className="bg-gray-50 dark:bg-slate-900/50 p-6 border-t border-gray-100 dark:border-slate-700 flex flex-col-reverse sm:flex-row justify-between items-center gap-4">

//             <div className="h-6">
//               {saveSuccess && (
//                 <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-2">
//                   <FiCheckCircle size={18} />
//                   Profile saved successfully!
//                 </span>
//               )}
//             </div>

//             <button
//               type="submit"
//               disabled={isSaving}
//               className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
//             >
//               {isSaving
//                 ? "Saving Data..."
//                 : "Save Profile Details"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default Profile;




import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiUser,
  FiBriefcase,
  FiAward,
  FiCheckCircle,
  FiLock,
} from "react-icons/fi";

const Profile = () => {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
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
    // Admin does not need an academic profile
    if (role !== "admin") {
      const fetchProfile = async () => {
        try {
          const res = await axios.get(
            "http://localhost:5000/api/users/profile",
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
    // Do not allow changes after profile is locked
    if (profile.profileLocked) {
      return;
    }

    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };


  // =========================================================
  // SAVE PROFILE
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent submission if already locked
    if (profile.profileLocked) {
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await axios.put(
        "http://localhost:5000/api/users/profile",
        profile,
        config
      );

      // Show success message
      setSaveSuccess(true);

      // Lock profile immediately after successful save
      setProfile((prev) => ({
        ...prev,
        profileLocked: true,
      }));

      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Failed to save profile:", err);

      alert(
        err.response?.data?.message ||
          "Failed to save profile. Please try again."
      );
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
            <FiLock
              className="text-red-600 dark:text-red-400"
              size={30}
            />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Access Restricted
          </h2>

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
            PAGE HEADER
            ===================================================== */}

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div className="flex items-center gap-4">

              <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FiUser
                  className="text-blue-600 dark:text-blue-400"
                  size={28}
                />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  My Academic Profile
                </h1>

                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mt-1">
                  {profile.name || "Student"}
                </p>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {profile.email}
                </p>
              </div>

            </div>

          </div>

        </div>


        {/* =====================================================
            EMPLOYABILITY SCORE
            ===================================================== */}

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">

          <div className="flex items-center gap-3 mb-4">

            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <FiAward
                className="text-yellow-600 dark:text-yellow-400"
                size={22}
              />
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Employability Score
              </p>

              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.employabilityScore} / 100
              </p>
            </div>

          </div>

          <div className="w-full h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  Math.max(profile.employabilityScore || 0, 0),
                  100
                )}%`,
              }}
            />
          </div>

        </div>


        {/* =====================================================
            PROFILE FORM
            ===================================================== */}

        <form onSubmit={handleSubmit}>

          {/* ===================================================
              LOCK WARNING
              =================================================== */}

          {profile.profileLocked && (
            <div className="mb-6 p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">

              <div className="flex items-start gap-3">

                <FiLock
                  className="text-amber-600 dark:text-amber-400 mt-1 shrink-0"
                  size={22}
                />

                <div>

                  <h3 className="font-bold text-amber-800 dark:text-amber-300">
                    Profile Locked
                  </h3>

                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                    You have already submitted your eligibility details.
                    For smart matching integrity, changes can now only be
                    made by an Administrator.
                  </p>

                </div>

              </div>

            </div>
          )}


          {/* ===================================================
              ELIGIBILITY DETAILS
              =================================================== */}

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">

            <div className="flex items-center gap-3 mb-2">

              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FiBriefcase
                  className="text-blue-600 dark:text-blue-400"
                  size={21}
                />
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Eligibility Details
              </h2>

            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Fill this out accurately. This data is used to automatically
              match you with eligible job openings.
            </p>


            {/* =================================================
                FORM FIELDS
                ================================================= */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Highest Qualification */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Highest Qualification
                </label>

                <input
                  type="text"
                  value={profile.highestQualification}
                  onChange={(e) =>
                    handleChange(
                      "highestQualification",
                      e.target.value
                    )
                  }
                  disabled={profile.profileLocked}
                  placeholder="e.g. B.Tech"
                  className={`w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${
                    profile.profileLocked
                      ? "opacity-60 cursor-not-allowed bg-gray-100 dark:bg-slate-600"
                      : ""
                  }`}
                />
              </div>


              {/* Passing Year */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Passing Year
                </label>

                <input
                  type="number"
                  value={profile.passingYear}
                  onChange={(e) =>
                    handleChange("passingYear", e.target.value)
                  }
                  disabled={profile.profileLocked}
                  placeholder="e.g. 2026"
                  className={`w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${
                    profile.profileLocked
                      ? "opacity-60 cursor-not-allowed bg-gray-100 dark:bg-slate-600"
                      : ""
                  }`}
                />
              </div>


              {/* Percentage */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Overall Percentage / CGPA
                </label>

                <input
                  type="text"
                  value={profile.percentage}
                  onChange={(e) =>
                    handleChange("percentage", e.target.value)
                  }
                  disabled={profile.profileLocked}
                  placeholder="e.g. 75.50"
                  className={`w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${
                    profile.profileLocked
                      ? "opacity-60 cursor-not-allowed bg-gray-100 dark:bg-slate-600"
                      : ""
                  }`}
                />
              </div>


              {/* Backlogs */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Active Backlogs
                </label>

                <input
                  type="number"
                  min="0"
                  value={profile.backlogs}
                  onChange={(e) =>
                    handleChange(
                      "backlogs",
                      parseInt(e.target.value, 10) || 0
                    )
                  }
                  disabled={profile.profileLocked}
                  placeholder="0"
                  className={`w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${
                    profile.profileLocked
                      ? "opacity-60 cursor-not-allowed bg-gray-100 dark:bg-slate-600"
                      : ""
                  }`}
                />
              </div>


              {/* Education Gap */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Gap in Education (Years)
                </label>

                <input
                  type="number"
                  min="0"
                  value={profile.educationGap}
                  onChange={(e) =>
                    handleChange(
                      "educationGap",
                      parseInt(e.target.value, 10) || 0
                    )
                  }
                  disabled={profile.profileLocked}
                  placeholder="0"
                  className={`w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${
                    profile.profileLocked
                      ? "opacity-60 cursor-not-allowed bg-gray-100 dark:bg-slate-600"
                      : ""
                  }`}
                />
              </div>


              {/* Technical Skills */}
              <div className="md:col-span-2">

                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Technical Skills (Comma separated)
                </label>

                <input
                  type="text"
                  value={profile.skillsAcquired}
                  onChange={(e) =>
                    handleChange(
                      "skillsAcquired",
                      e.target.value
                    )
                  }
                  disabled={profile.profileLocked}
                  placeholder="Java, SQL, React, Node.js"
                  className={`w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${
                    profile.profileLocked
                      ? "opacity-60 cursor-not-allowed bg-gray-100 dark:bg-slate-600"
                      : ""
                  }`}
                />

              </div>

            </div>


            {/* =================================================
                RELOCATION
                ================================================= */}

            <div className="mt-6">

              <label
                className={`flex items-center gap-3 ${
                  profile.profileLocked
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer"
                }`}
              >

                <input
                  type="checkbox"
                  checked={profile.readyForRelocation}
                  onChange={(e) =>
                    handleChange(
                      "readyForRelocation",
                      e.target.checked
                    )
                  }
                  disabled={profile.profileLocked}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all disabled:opacity-60"
                />

                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  I am ready to relocate for work
                </span>

              </label>

            </div>


            {/* =================================================
                SAVE SECTION
                ================================================= */}

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">

              {/* Success Message */}
              {saveSuccess && (
                <div className="mb-5 flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">

                  <FiCheckCircle
                    className="text-green-600 dark:text-green-400 shrink-0"
                    size={22}
                  />

                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                    Profile saved successfully and locked!
                  </p>

                </div>
              )}


              {/* Save Button */}
              {!profile.profileLocked && (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                >
                  {isSaving
                    ? "Saving Data..."
                    : "Save Profile Details"}
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
