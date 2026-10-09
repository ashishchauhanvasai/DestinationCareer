import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import AdminCompanies from "../components/AdminCompanies";
import AdminAssignments from "../components/AdminAssignments";
import AdminTests from "../components/AdminTests";
import AdminBatches from "../components/AdminBatches";
import AdminAttendance from "../components/AdminAttendance";
import AdminApplications from "../components/AdminApplications";
import AdminUsers from "../components/AdminUsers";

import {
  FiTrash2,
  FiPlus,
  FiEdit,
  FiX,
  FiUploadCloud,
  FiLock,
  FiUnlock,
} from "react-icons/fi";

const Admin = () => {
  // FIX 1: Added setSearchParams here so we can change the URL tab
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "Courses";

  const [courses, setCourses] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [performers, setPerformers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [jobs, setJobs] = useState([]);

  const [students, setStudents] = useState([]);
  const [editingStudentId, setEditingStudentId] = useState(null);

  const [studentProfileForm, setStudentProfileForm] = useState({
    highestQualification: "",
    passingYear: "",
    percentage: 0,
    backlogs: 0,
    educationGap: 0,
    readyForRelocation: false,
    skillsAcquired: "",
    profileLocked: false,
  });

  const [testForm, setTestForm] = useState({
    studentName: "",
    company: "",
    message: "",
    imageUrl: "",
    education: "",
    passoutYear: "",
    collegeName: "",
    role: "",
    salaryPackage: "",
  });

  const [perfForm, setPerfForm] = useState({
    category: "Java",
    studentName: "",
    imageUrl: "",
    metric: "",
  });

  const [jobForm, setJobForm] = useState({
    jobId: "",
    title: "",
    companyAbout: "",
    description: "",
    location: "",
    salary: "",
    hiringProcess: "Online",
    interviewDate: "",
    interviewLocation: "",
    lastDateToApply: "",
    reqEmployabilityScore: 0,
    reqQualification: "",
    reqPassingYear: "",
    reqMinPercentage: 0,
    reqMaxBacklogs: 0,
    reqMaxEducationGap: 0,
    reqSkills: "",
  });

  const [editingTestId, setEditingTestId] = useState(null);
  const [editingPerfId, setEditingPerfId] = useState(null);

  const token = localStorage.getItem("token");

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [crsRes, testRes, perfRes, pendingRes, jobsRes, studentsRes] =
        await Promise.all([
          axios
            .get(`${process.env.REACT_APP_API_URL}/api/courses`, config)
            .catch(() => ({ data: [] })),

          axios
            .get(`${process.env.REACT_APP_API_URL}/api/testimonials`)
            .catch(() => ({ data: [] })),

          axios
            .get(`${process.env.REACT_APP_API_URL}/api/performers`)
            .catch(() => ({ data: [] })),

          axios
            .get(`${process.env.REACT_APP_API_URL}/api/users/pending`, config)
            .catch(() => ({ data: [] })),

          axios
            .get(`${process.env.REACT_APP_API_URL}/api/jobs`, config)
            .catch(() => ({ data: [] })),

          axios
            .get(
              `${process.env.REACT_APP_API_URL}/api/users?role=student`,
              config,
            )
            .catch(() => ({ data: [] })),
        ]);

      setCourses(crsRes.data);
      setTestimonials(testRes.data);
      setPerformers(perfRes.data);
      setPendingUsers(pendingRes.data);
      setJobs(jobsRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm("Are you sure you want to delete this?")) return;

    await axios.delete(
      `${process.env.REACT_APP_API_URL}/api/${type}/${id}`,
      config,
    );

    fetchData();
  };

  const handleImageUpload = (e, formType) => {
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        if (formType === "test") {
          setTestForm({
            ...testForm,
            imageUrl: reader.result,
          });
        } else {
          setPerfForm({
            ...perfForm,
            imageUrl: reader.result,
          });
        }
      };

      reader.readAsDataURL(file);
    }
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();

    if (editingTestId) {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/testimonials/${editingTestId}`,
        testForm,
        config,
      );
    } else {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/testimonials`,
        testForm,
        config,
      );
    }

    setTestForm({
      studentName: "",
      company: "",
      message: "",
      imageUrl: "",
      education: "",
      passoutYear: "",
      collegeName: "",
      role: "",
      salaryPackage: "",
    });

    setEditingTestId(null);
    fetchData();
  };

  const loadTestForEdit = (t) => {
    setTestForm({
      studentName: t.studentName,
      company: t.company,
      message: t.message,
      imageUrl: t.imageUrl,
      education: t.education || "",
      passoutYear: t.passoutYear || "",
      collegeName: t.collegeName || "",
      role: t.role || "",
      salaryPackage: t.salaryPackage || "",
    });

    setEditingTestId(t._id);
  };

  const handlePerfSubmit = async (e) => {
    e.preventDefault();

    if (editingPerfId) {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/performers/${editingPerfId}`,
        perfForm,
        config,
      );
    } else {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/performers`,
        perfForm,
        config,
      );
    }

    setPerfForm({
      category: "Java",
      studentName: "",
      imageUrl: "",
      metric: "",
    });

    setEditingPerfId(null);
    fetchData();
  };

  const loadPerfForEdit = (p) => {
    setPerfForm({
      category: p.category,
      studentName: p.studentName,
      imageUrl: p.imageUrl,
      metric: p.metric,
    });

    setEditingPerfId(p._id);
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/jobs`,
        jobForm,
        config,
      );

      setJobForm({
        jobId: "",
        title: "",
        companyAbout: "",
        description: "",
        location: "",
        salary: "",
        hiringProcess: "Online",
        interviewDate: "",
        interviewLocation: "",
        lastDateToApply: "",
        reqEmployabilityScore: 0,
        reqQualification: "",
        reqPassingYear: "",
        reqMinPercentage: 0,
        reqMaxBacklogs: 0,
        reqMaxEducationGap: 0,
        reqSkills: "",
      });

      fetchData();
      alert("Job Posted Successfully!");
    } catch (err) {
      alert("Error posting job. Ensure Job ID is unique.");
    }
  };

  const handleStudentProfileSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/users/${editingStudentId}/admin-edit-profile`,
        studentProfileForm,
        config,
      );

      alert("Student profile updated successfully!");

      setEditingStudentId(null);
      fetchData();
    } catch (err) {
      alert("Failed to update student profile.");
    }
  };

  // Helper styles for dark mode inputs
  const inputStyles =
    "w-full p-2 border rounded text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 md:p-6 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Admin Control Panel
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage {activeTab}
          </p>
        </div>

        {/* Courses */}
        {activeTab === "Courses" && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border dark:border-slate-700 p-6 transition-colors">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                All Courses
              </h2>

              <Link
                to="/add-course"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
              >
                <FiPlus size={18} />
                Add Course
              </Link>
            </div>

            {courses.length === 0 ? (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                No courses available.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b dark:border-slate-700 text-sm text-gray-500 dark:text-gray-400">
                      <th className="p-4">Course Title</th>
                      <th className="p-4">Topics / Videos</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {courses.map((c) => {
                      const totalVideos =
                        c.topics?.reduce(
                          (acc, t) => acc + (t.videos?.length || 0),
                          0,
                        ) || 0;

                      return (
                        <tr
                          key={c._id}
                          className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <td className="p-4">
                            <div className="font-bold text-gray-800 dark:text-white">
                              {c.subjectTitle}
                            </div>
                          </td>

                          <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                            {c.topics?.length || 0} topics • {totalVideos}{" "}
                            videos
                          </td>

                          <td className="p-4">
                            <div className="flex justify-end gap-2">
                              <Link
                                to={`/edit-course/${c._id}`}
                                className="text-blue-500 hover:text-blue-400 p-2"
                                title="Edit Course"
                              >
                                <FiEdit size={18} />
                              </Link>

                              <button
                                onClick={() => handleDelete("courses", c._id)}
                                className="text-red-500 hover:text-red-400 p-2"
                                title="Delete Course"
                              >
                                <FiTrash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Testimonials */}
        {activeTab === "Testimonials" && (
          <div className="grid lg:grid-cols-3 gap-6">
            <form
              onSubmit={handleTestSubmit}
              className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border dark:border-slate-700 space-y-4 transition-colors ${
                editingTestId
                  ? "border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900"
                  : ""
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                  {editingTestId ? "Edit Testimonial" : "Add Testimonial"}
                </h3>

                {editingTestId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTestId(null);
                      setTestForm({
                        studentName: "",
                        company: "",
                        message: "",
                        imageUrl: "",
                        education: "",
                        passoutYear: "",
                        collegeName: "",
                        role: "",
                        salaryPackage: "",
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <FiX size={20} />
                  </button>
                )}
              </div>

              <input
                type="text"
                placeholder="Student Name"
                required
                value={testForm.studentName}
                onChange={(e) =>
                  setTestForm({
                    ...testForm,
                    studentName: e.target.value,
                  })
                }
                className={inputStyles}
              />

              <input
                type="text"
                placeholder="Company"
                required
                value={testForm.company}
                onChange={(e) =>
                  setTestForm({
                    ...testForm,
                    company: e.target.value,
                  })
                }
                className={inputStyles}
              />

              <input
                type="text"
                placeholder="Role"
                value={testForm.role}
                onChange={(e) =>
                  setTestForm({
                    ...testForm,
                    role: e.target.value,
                  })
                }
                className={inputStyles}
              />

              <input
                type="text"
                placeholder="Salary Package"
                value={testForm.salaryPackage}
                onChange={(e) =>
                  setTestForm({
                    ...testForm,
                    salaryPackage: e.target.value,
                  })
                }
                className={inputStyles}
              />

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Education"
                  value={testForm.education}
                  onChange={(e) =>
                    setTestForm({
                      ...testForm,
                      education: e.target.value,
                    })
                  }
                  className={`${inputStyles} w-1/2`}
                />

                <input
                  type="text"
                  placeholder="Passout Year"
                  value={testForm.passoutYear}
                  onChange={(e) =>
                    setTestForm({
                      ...testForm,
                      passoutYear: e.target.value,
                    })
                  }
                  className={`${inputStyles} w-1/2`}
                />
              </div>

              <input
                type="text"
                placeholder="College Name"
                value={testForm.collegeName}
                onChange={(e) =>
                  setTestForm({
                    ...testForm,
                    collegeName: e.target.value,
                  })
                }
                className={inputStyles}
              />

              <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-4 text-center hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                <label className="cursor-pointer text-sm font-bold text-gray-600 dark:text-gray-300 flex flex-col items-center gap-2">
                  <FiUploadCloud size={24} className="text-blue-500" />
                  Upload Profile Picture
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "test")}
                    className="hidden"
                  />
                </label>
              </div>

              {testForm.imageUrl && (
                <img
                  src={testForm.imageUrl}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-full border dark:border-slate-600 shadow-sm mx-auto"
                />
              )}

              <textarea
                placeholder="Testimonial Message"
                required
                value={testForm.message}
                onChange={(e) =>
                  setTestForm({
                    ...testForm,
                    message: e.target.value,
                  })
                }
                className={`${inputStyles} h-24`}
              />

              <button
                type="submit"
                className={`w-full text-white p-2 rounded font-bold transition-colors ${
                  editingTestId
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {editingTestId ? "Update Data" : "Save to Database"}
              </button>
            </form>

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {testimonials.map((t) => (
                <div
                  key={t._id}
                  className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 flex gap-4 transition-colors"
                >
                  <img
                    src={t.imageUrl || "https://via.placeholder.com/50"}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-slate-600 bg-gray-100 dark:bg-slate-700"
                  />

                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-gray-800 dark:text-white">
                      {t.studentName}
                    </h4>

                    <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                      {t.role ? `${t.role} @ ` : ""}
                      {t.company}
                    </p>

                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
                      {t.salaryPackage && <p>💰 {t.salaryPackage}</p>}

                      {(t.education || t.passoutYear) && (
                        <p>
                          🎓 {t.education} {t.passoutYear}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => loadTestForEdit(t)}
                      className="text-blue-500 hover:text-blue-400 p-1"
                    >
                      <FiEdit size={18} />
                    </button>

                    <button
                      onClick={() => handleDelete("testimonials", t._id)}
                      className="text-red-500 hover:text-red-400 p-1"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performers */}
        {activeTab === "Performers" && (
          <div className="grid md:grid-cols-3 gap-6">
            <form
              onSubmit={handlePerfSubmit}
              className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border dark:border-slate-700 col-span-1 space-y-4 transition-colors ${
                editingPerfId
                  ? "border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900"
                  : ""
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                  {editingPerfId ? "Edit Performer" : "Set Top Performer"}
                </h3>

                {editingPerfId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPerfId(null);
                      setPerfForm({
                        category: "Java",
                        studentName: "",
                        imageUrl: "",
                        metric: "",
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <FiX size={20} />
                  </button>
                )}
              </div>

              <select
                value={perfForm.category}
                onChange={(e) =>
                  setPerfForm({
                    ...perfForm,
                    category: e.target.value,
                  })
                }
                className={inputStyles}
              >
                <option>Java</option>
                <option>Python</option>
                <option>Data Analytics</option>
                <option>Frontend</option>
              </select>

              <input
                type="text"
                placeholder="Student Name"
                required
                value={perfForm.studentName}
                onChange={(e) =>
                  setPerfForm({
                    ...perfForm,
                    studentName: e.target.value,
                  })
                }
                className={inputStyles}
              />

              <input
                type="text"
                placeholder="Metric (e.g. '98% Score')"
                required
                value={perfForm.metric}
                onChange={(e) =>
                  setPerfForm({
                    ...perfForm,
                    metric: e.target.value,
                  })
                }
                className={inputStyles}
              />

              <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-4 text-center hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                <label className="cursor-pointer text-sm font-bold text-gray-600 dark:text-gray-300 flex flex-col items-center gap-2">
                  <FiUploadCloud size={24} className="text-blue-500" />
                  Upload Profile Picture
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "perf")}
                    className="hidden"
                  />
                </label>
              </div>

              {perfForm.imageUrl && (
                <img
                  src={perfForm.imageUrl}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-full border dark:border-slate-600 shadow-sm mx-auto"
                />
              )}

              <button
                type="submit"
                className={`w-full text-white p-2 rounded font-bold transition-colors ${
                  editingPerfId
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {editingPerfId ? "Update Data" : "Save to Database"}
              </button>
            </form>

            <div className="col-span-2 grid grid-cols-2 gap-4">
              {performers.map((p) => (
                <div
                  key={p._id}
                  className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 flex justify-between items-center transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={p.imageUrl || "https://via.placeholder.com/50"}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-slate-600 bg-gray-100 dark:bg-slate-700"
                    />

                    <div>
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">
                        {p.category}
                      </p>

                      <h4 className="font-bold text-sm text-gray-800 dark:text-white">
                        {p.studentName}
                      </h4>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => loadPerfForEdit(p)}
                      className="text-blue-500 hover:text-blue-400 p-2"
                    >
                      <FiEdit size={18} />
                    </button>

                    <button
                      onClick={() => handleDelete("performers", p._id)}
                      className="text-red-500 hover:text-red-400 p-2"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Banner */}
        {activeTab === "Banner" && (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border dark:border-slate-700 max-w-2xl mx-auto mt-4 transition-colors">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
              Update Dashboard Banner
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Upload a high-quality, wide image (e.g., 1200x300 pixels).
            </p>

            <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
              <label className="cursor-pointer flex flex-col items-center gap-3">
                <FiUploadCloud size={32} className="text-blue-500" />

                <span className="font-bold text-gray-700 dark:text-gray-300">
                  Click to Upload New Banner
                </span>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];

                    if (file) {
                      const reader = new FileReader();

                      reader.onloadend = async () => {
                        try {
                          await axios.post(
                            `${process.env.REACT_APP_API_URL}/api/banner`,
                            { imageUrl: reader.result },
                            config,
                          );

                          alert("Banner updated successfully!");
                        } catch (err) {
                          alert("Failed to upload banner.");
                        }
                      };

                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        )}

       {/* Approvals */}
        {activeTab === "Approvals" && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border dark:border-slate-700 overflow-hidden mt-4 transition-colors">
            <div className="p-4 border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
              <h2 className="font-bold text-gray-800 dark:text-white">
                Pending Registrations
              </h2>
            </div>

            {pendingUsers.length === 0 ? (
              <p className="p-8 text-center text-gray-500 dark:text-gray-400 font-medium">
                No pending accounts to approve.
              </p>
            ) : (
              /* FIX: Added this scrollable wrapper */
              <div className="overflow-x-auto w-full custom-scrollbar">
                {/* FIX: Added whitespace-nowrap so text doesn't squish */ }
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-sm border-b dark:border-slate-700">
                    <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {pendingUsers.map((user) => (
                      <tr
                        key={user._id}
                        className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <td className="p-4 font-bold text-gray-800 dark:text-gray-200">
                          {user.name}
                        </td>

                        <td className="p-4 text-gray-600 dark:text-gray-400">
                          {user.email}
                        </td>

                        <td className="p-4">
                          <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs font-bold px-2 py-1 rounded uppercase">
                            {user.role}
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-3">
                            <button
                              onClick={async () => {
                                await axios.put(
                                  `${process.env.REACT_APP_API_URL}/api/users/${user._id}/status`,
                                  { status: "approved" },
                                  config,
                                );

                                fetchData();
                              }}
                              className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 px-3 py-1 rounded font-bold text-sm transition-colors"
                            >
                              Approve
                            </button>

                            <button
                              onClick={async () => {
                                await axios.put(
                                  `${process.env.REACT_APP_API_URL}/api/users/${user._id}/status`,
                                  { status: "rejected" },
                                  config,
                                );

                                fetchData();
                              }}
                              className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 px-3 py-1 rounded font-bold text-sm transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Jobs */}
        {activeTab === "Jobs" && (
          <div className="grid lg:grid-cols-3 gap-6">
            <form
              onSubmit={handleJobSubmit}
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border dark:border-slate-700 lg:col-span-2 space-y-4 transition-colors"
            >
              <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4 border-b dark:border-slate-700 pb-2">
                Post a New Job Opening
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Job ID (e.g. TCS-01)"
                  required
                  value={jobForm.jobId}
                  onChange={(e) =>
                    setJobForm({
                      ...jobForm,
                      jobId: e.target.value,
                    })
                  }
                  className={inputStyles}
                />

                <input
                  type="text"
                  placeholder="Job Title"
                  required
                  value={jobForm.title}
                  onChange={(e) =>
                    setJobForm({
                      ...jobForm,
                      title: e.target.value,
                    })
                  }
                  className={inputStyles}
                />

                <div className="md:col-span-2">
                  <textarea
                    placeholder="Company About Section"
                    rows="2"
                    value={jobForm.companyAbout}
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        companyAbout: e.target.value,
                      })
                    }
                    className={inputStyles}
                  />
                </div>

                <div className="md:col-span-2">
                  <textarea
                    placeholder="Job Description (or link to document)"
                    rows="2"
                    required
                    value={jobForm.description}
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        description: e.target.value,
                      })
                    }
                    className={inputStyles}
                  />
                </div>

                <input
                  type="text"
                  placeholder="Location"
                  required
                  value={jobForm.location}
                  onChange={(e) =>
                    setJobForm({
                      ...jobForm,
                      location: e.target.value,
                    })
                  }
                  className={inputStyles}
                />

                <input
                  type="text"
                  placeholder="Salary"
                  value={jobForm.salary}
                  onChange={(e) =>
                    setJobForm({
                      ...jobForm,
                      salary: e.target.value,
                    })
                  }
                  className={inputStyles}
                />

                <select
                  value={jobForm.hiringProcess}
                  onChange={(e) =>
                    setJobForm({
                      ...jobForm,
                      hiringProcess: e.target.value,
                    })
                  }
                  className={inputStyles}
                >
                  <option>Online</option>
                  <option>Offline</option>
                  <option>Hybrid</option>
                </select>

                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                    Last Date to Apply
                  </label>

                  <input
                    type="date"
                    required
                    value={jobForm.lastDateToApply}
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        lastDateToApply: e.target.value,
                      })
                    }
                    className={inputStyles}
                  />
                </div>

                <input
                  type="text"
                  placeholder="Interview Date (e.g. 15 Oct 2026)"
                  value={jobForm.interviewDate}
                  onChange={(e) =>
                    setJobForm({
                      ...jobForm,
                      interviewDate: e.target.value,
                    })
                  }
                  className={inputStyles}
                />

                <input
                  type="text"
                  placeholder="Interview Location"
                  value={jobForm.interviewLocation}
                  onChange={(e) =>
                    setJobForm({
                      ...jobForm,
                      interviewLocation: e.target.value,
                    })
                  }
                  className={inputStyles}
                />

                <div className="md:col-span-2 mt-4 mb-2">
                  <h4 className="font-bold text-gray-700 dark:text-gray-300 border-b dark:border-slate-700 pb-1">
                    Eligibility Criteria (For Smart Matching)
                  </h4>
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                    Req Qualification
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. B.Tech"
                    required
                    value={jobForm.reqQualification}
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        reqQualification: e.target.value,
                      })
                    }
                    className={`${inputStyles} bg-blue-50 dark:bg-blue-900/20`}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                    Req Passing Year
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. 2026"
                    required
                    value={jobForm.reqPassingYear}
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        reqPassingYear: e.target.value,
                      })
                    }
                    className={`${inputStyles} bg-blue-50 dark:bg-blue-900/20`}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                    Min Percentage (%)
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    required
                    value={jobForm.reqMinPercentage}
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        reqMinPercentage: e.target.value,
                      })
                    }
                    className={`${inputStyles} bg-blue-50 dark:bg-blue-900/20`}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                    Min Employability Score
                  </label>

                  <input
                    type="number"
                    required
                    value={jobForm.reqEmployabilityScore}
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        reqEmployabilityScore: e.target.value,
                      })
                    }
                    className={`${inputStyles} bg-blue-50 dark:bg-blue-900/20`}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                    Max Active Backlogs
                  </label>

                  <input
                    type="number"
                    required
                    value={jobForm.reqMaxBacklogs}
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        reqMaxBacklogs: e.target.value,
                      })
                    }
                    className={`${inputStyles} bg-blue-50 dark:bg-blue-900/20`}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                    Max Education Gap (Years)
                  </label>

                  <input
                    type="number"
                    required
                    value={jobForm.reqMaxEducationGap}
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        reqMaxEducationGap: e.target.value,
                      })
                    }
                    className={`${inputStyles} bg-blue-50 dark:bg-blue-900/20`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                    Required Skills (Comma Separated)
                  </label>

                  <input
                    type="text"
                    placeholder="React, Node.js, Java"
                    value={jobForm.reqSkills}
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        reqSkills: e.target.value,
                      })
                    }
                    className={`${inputStyles} bg-blue-50 dark:bg-blue-900/20`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-bold p-3 rounded mt-4 hover:bg-blue-700 transition-colors"
              >
                Post Job Opportunity
              </button>
            </form>


            <div className="lg:col-span-1 space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
              
              {/* UPDATED HEADER: Single button next to the title */}
              <div className="sticky top-0 bg-gray-50 dark:bg-slate-900 z-10 pt-2 pb-2 border-b dark:border-slate-700 mb-4 transition-colors flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                  Active Jobs
                </h3>
                <button
                  onClick={() => setSearchParams({ tab: "Applications" })}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 dark:text-blue-400 text-xs font-bold py-1.5 px-3 rounded transition-colors"
                >
                  View Applications →
                </button>
              </div>

              {jobs.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No jobs posted yet.
                </p>
              ) : null}

              {jobs.map((j) => (
                <div
                  key={j._id}
                  className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 relative shadow-sm hover:shadow-md transition-all flex flex-col"
                >
                  <button
                    onClick={() => handleDelete("jobs", j._id)}
                    className="absolute top-3 right-3 text-red-500 hover:text-red-400 bg-red-50 dark:bg-red-900/20 p-1.5 rounded"
                  >
                    <FiTrash2 size={16} />
                  </button>

                  <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2 py-0.5 rounded w-fit">
                    {j.jobId}
                  </span>

                  <h4 className="font-bold text-sm mt-2 pr-8 text-gray-800 dark:text-gray-200">
                    {j.title}
                  </h4>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {j.location} • {j.salary}
                  </p>

                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 text-[10px] text-gray-500 dark:text-gray-400 space-y-1">
                    <p>
                      🎓 <span className="font-bold">Req:</span>{" "}
                      {j.reqQualification} ({j.reqPassingYear})
                    </p>

                    <p>
                      📊 <span className="font-bold">Score:</span>{" "}
                      {j.reqEmployabilityScore} |{" "}
                      <span className="font-bold">%</span>: {j.reqMinPercentage}
                    </p>
                  </div>
                  {/* The redundant button has been removed from here */}
                </div>
              ))}
            </div>

            
          </div>
        )}
        
        {/* Student Profiles Edit Tab */}
        {activeTab === "Student Profiles" && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border dark:border-slate-700 p-6 transition-colors">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
              Manage Student Profiles
            </h2>

            {editingStudentId ? (
              <form
                onSubmit={handleStudentProfileSubmit}
                className="space-y-4 bg-gray-50 dark:bg-slate-800/50 p-6 rounded-xl border border-gray-200 dark:border-slate-700 transition-colors"
              >
                <h3 className="font-bold text-lg text-gray-800 dark:text-white border-b dark:border-slate-700 pb-2">
                  Edit Student Profile & Lock Status
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                      Highest Qualification
                    </label>

                    <input
                      type="text"
                      value={studentProfileForm.highestQualification}
                      onChange={(e) =>
                        setStudentProfileForm({
                          ...studentProfileForm,
                          highestQualification: e.target.value,
                        })
                      }
                      className={inputStyles}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                      Passing Year
                    </label>

                    <input
                      type="text"
                      value={studentProfileForm.passingYear}
                      onChange={(e) =>
                        setStudentProfileForm({
                          ...studentProfileForm,
                          passingYear: e.target.value,
                        })
                      }
                      className={inputStyles}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                      Percentage / CGPA
                    </label>

                    <input
                      type="number"
                      step="0.01"
                      value={studentProfileForm.percentage}
                      onChange={(e) =>
                        setStudentProfileForm({
                          ...studentProfileForm,
                          percentage: e.target.value,
                        })
                      }
                      className={inputStyles}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                      Backlogs
                    </label>

                    <input
                      type="number"
                      value={studentProfileForm.backlogs}
                      onChange={(e) =>
                        setStudentProfileForm({
                          ...studentProfileForm,
                          backlogs: e.target.value,
                        })
                      }
                      className={inputStyles}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                      Education Gap (Yrs)
                    </label>

                    <input
                      type="number"
                      value={studentProfileForm.educationGap}
                      onChange={(e) =>
                        setStudentProfileForm({
                          ...studentProfileForm,
                          educationGap: e.target.value,
                        })
                      }
                      className={inputStyles}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                      Skills (Comma separated)
                    </label>

                    <input
                      type="text"
                      value={studentProfileForm.skillsAcquired}
                      onChange={(e) =>
                        setStudentProfileForm({
                          ...studentProfileForm,
                          skillsAcquired: e.target.value,
                        })
                      }
                      className={inputStyles}
                    />
                  </div>
                </div>

                <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded border dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-700 dark:text-gray-200">
                      Profile Lock Status
                    </h4>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Unlocking will allow the student to edit their profile
                      again.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={studentProfileForm.profileLocked}
                      onChange={(e) =>
                        setStudentProfileForm({
                          ...studentProfileForm,
                          profileLocked: e.target.checked,
                        })
                      }
                    />

                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t dark:border-slate-700">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 transition-colors"
                  >
                    Save Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingStudentId(null)}
                    className="bg-gray-400 dark:bg-slate-600 text-white px-6 py-2 rounded font-bold hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map((s) => (
                  <div
                    key={s._id}
                    className="p-4 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex flex-col justify-between transition-colors"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-800 dark:text-white">
                          {s.name}
                        </h4>

                        {s.profileLocked ? (
                          <span className="flex items-center gap-1 text-[10px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded font-bold">
                            <FiLock /> Locked
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded font-bold">
                            <FiUnlock /> Unlocked
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {s.email}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setEditingStudentId(s._id);
                        setStudentProfileForm({
                          ...s,
                        });
                      }}
                      className="mt-3 w-full border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 py-1.5 rounded text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <FiEdit size={14} />
                      Edit Profile
                    </button>
                  </div>
                ))}

                {students.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No students found.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Existing Components */}
        {activeTab === "Company Questions" && <AdminCompanies />}

        {activeTab === "Assignments" && <AdminAssignments />}

        {activeTab === "Batches" && <AdminBatches />}

        {activeTab === "Attendance Reports" && <AdminAttendance />}

        {activeTab === "Manage Users" && <AdminUsers />}

        {activeTab === "Applications" && <AdminApplications />}

        {activeTab === "Coding Tests" && <AdminTests />}

      </div>
    </div>
  );
};

export default Admin;