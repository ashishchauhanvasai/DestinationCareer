import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import AdminCompanies from '../components/AdminCompanies';
import AdminAssignments from '../components/AdminAssignments';
import AdminTests from '../components/AdminTests';
import AdminBatches from '../components/AdminBatches';
// import AdminAttendance from "../components/AdminAttendance";
import AdminApplications from '../components/AdminApplications';
import StaffBatchTracker from '../components/StaffBatchTracker';
import AdminUsers from '../components/AdminUsers';
// IMPORTING THE NEW TOP PERFORMERS COMPONENT
import TrainerPerformers from './TrainerPerformers';
import OnlineClassesManager from '../components/OnlineClassesManager';

import {
  FiTrash2,
  FiPlus,
  FiEdit,
  FiX,
  FiUploadCloud,
  FiLock,
  FiUnlock,
} from 'react-icons/fi';

const Admin = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'Courses';

  const [courses, setCourses] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [jobs, setJobs] = useState([]);

  const [students, setStudents] = useState([]);
  const [editingStudentId, setEditingStudentId] = useState(null);

  const [studentProfileForm, setStudentProfileForm] = useState({
    highestQualification: '',
    passingYear: '',
    percentage: 0,
    backlogs: 0,
    educationGap: 0,
    readyForRelocation: false,
    skillsAcquired: '',
    profileLocked: false,
  });

  const [testForm, setTestForm] = useState({
    studentName: '',
    company: '',
    message: '',
    imageUrl: '',
    education: '',
    passoutYear: '',
    collegeName: '',
    role: '',
    salaryPackage: '',
  });

  const [jobForm, setJobForm] = useState({
    jobId: '',
    title: '',
    companyAbout: '',
    description: '',
    location: '',
    salary: '',
    hiringProcess: 'Online',
    interviewDate: '',
    interviewLocation: '',
    lastDateToApply: '',
    reqEmployabilityScore: 0,
    reqQualification: '',
    reqPassingYear: '',
    reqMinPercentage: 0,
    reqMaxBacklogs: 0,
    reqMaxEducationGap: 0,
    reqSkills: '',
  });

  const [editingTestId, setEditingTestId] = useState(null);

  const token = localStorage.getItem('token');

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // 🚀 SPEED BOOST: Only fetch the data needed for the currently active tab!
  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab]);

  const fetchTabData = async (tab) => {
    try {
      if (tab === 'Courses' && courses.length === 0) {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/courses`, config);
        setCourses(res.data || []);
      } else if (tab === 'Testimonials' && testimonials.length === 0) {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/testimonials`);
        setTestimonials(res.data || []);
      } else if (tab === 'Approvals') {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/pending`, config);
        setPendingUsers(res.data || []);
      } else if (tab === 'Jobs' && jobs.length === 0) {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/jobs`, config);
        setJobs(res.data || []);
      } else if (tab === 'Student Profiles' && students.length === 0) {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/users?role=student`, config);
        setStudents(res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch tab data', error);
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/${type}/${id}`, config);
      
      // OPTIMISTIC UPDATE: Instantly remove from screen
      if (type === 'courses') setCourses(courses.filter(c => c._id !== id));
      else if (type === 'testimonials') setTestimonials(testimonials.filter(t => t._id !== id));
      else if (type === 'jobs') setJobs(jobs.filter(j => j._id !== id));
      
    } catch (err) { alert('Failed to delete'); }
  };

  const handleImageUpload = (e, formType) => {
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        if (formType === 'test') {
          setTestForm({
            ...testForm,
            imageUrl: reader.result,
          });
        }
      };

      reader.readAsDataURL(file);
    }
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTestId) {
        const res = await axios.put(`${process.env.REACT_APP_API_URL}/api/testimonials/${editingTestId}`, testForm, config);
        setTestimonials(testimonials.map(t => t._id === editingTestId ? res.data : t));
      } else {
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/testimonials`, testForm, config);
        setTestimonials([res.data, ...testimonials]);
      }
      setTestForm({ studentName: '', company: '', message: '', imageUrl: '', education: '', passoutYear: '', collegeName: '', role: '', salaryPackage: '' });
      setEditingTestId(null);
    } catch (err) { alert('Failed to save testimonial'); }
  };

  const loadTestForEdit = (t) => {
    setTestForm({
      studentName: t.studentName,
      company: t.company,
      message: t.message,
      imageUrl: t.imageUrl,
      education: t.education || '',
      passoutYear: t.passoutYear || '',
      collegeName: t.collegeName || '',
      role: t.role || '',
      salaryPackage: t.salaryPackage || '',
    });

    setEditingTestId(t._id);
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/jobs`, jobForm, config);
      setJobs([res.data, ...jobs]); // Instantly add to screen
      setJobForm({ jobId: '', title: '', companyAbout: '', description: '', location: '', salary: '', hiringProcess: 'Online', interviewDate: '', interviewLocation: '', lastDateToApply: '', reqEmployabilityScore: 0, reqQualification: '', reqPassingYear: '', reqMinPercentage: 0, reqMaxBacklogs: 0, reqMaxEducationGap: 0, reqSkills: '' });
      alert('Job Posted Successfully!');
    } catch (err) { alert('Error posting job. Ensure Job ID is unique.'); }
  };

  const handleStudentProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${process.env.REACT_APP_API_URL}/api/users/${editingStudentId}/admin-edit-profile`, studentProfileForm, config);
      setStudents(students.map(s => s._id === editingStudentId ? res.data : s));
      setEditingStudentId(null);
      alert('Student profile updated successfully!');
    } catch (err) { alert('Failed to update student profile.'); }
  };

  // Upgraded Glassmorphism Input Styles
  const inputStyles =
    'w-full p-3.5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 outline-none transition-all text-gray-900 dark:text-white shadow-sm font-medium';
  const labelStyles = "block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider";

  return (
    <div className="min-h-screen py-4 px-2 sm:px-4 lg:px-8 space-y-8">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Admin Control Panel
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2 bg-black/5 dark:bg-white/5 w-fit px-4 py-1.5 rounded-full border border-black/5 dark:border-white/5">
            Currently managing: <strong className="text-blue-600 dark:text-blue-400">{activeTab}</strong>
          </p>
        </div>

        {/* Courses */}
        {activeTab === 'Courses' && (
          <div className="glass-panel p-8 rounded-[2rem]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                All Courses
              </h2>
              <Link
                to="/add-course"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl font-extrabold flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all"
              >
                <FiPlus size={18} />
                Add Course
              </Link>
            </div>

            {courses.length === 0 ? (
              <div className="text-center py-16 bg-black/5 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5 text-gray-500 dark:text-gray-400 font-medium">
                No courses available.
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/10 text-xs text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-widest">
                      <th className="p-4">Course Title</th>
                      <th className="p-4">Topics / Videos</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {courses.map((c) => {
                      const totalVideos = c.topics?.reduce((acc, t) => acc + (t.videos?.length || 0), 0) || 0;
                      return (
                        <tr key={c._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                          <td className="p-4">
                            <div className="font-extrabold text-base text-gray-900 dark:text-white">
                              {c.subjectTitle}
                            </div>
                          </td>
                          <td className="p-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                            {c.topics?.length || 0} topics • {totalVideos} videos
                          </td>
                          <td className="p-4">
                            <div className="flex justify-end gap-3">
                              <Link
                                to={`/edit-course/${c._id}`}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-blue-600 bg-blue-500/10 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                title="Edit Course"
                              >
                                <FiEdit size={16} />
                              </Link>
                              <button
                                onClick={() => handleDelete('courses', c._id)}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-red-600 bg-red-500/10 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                title="Delete Course"
                              >
                                <FiTrash2 size={16} />
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
        {activeTab === 'Testimonials' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <form
              onSubmit={handleTestSubmit}
              className={`glass-panel p-8 rounded-[2rem] space-y-5 lg:col-span-1 h-fit transition-all duration-300 ${
                editingTestId ? 'ring-2 ring-blue-500/50 shadow-blue-500/20' : ''
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight">
                  {editingTestId ? 'Edit Testimonial' : 'Add Testimonial'}
                </h3>
                {editingTestId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTestId(null);
                      setTestForm({ studentName: '', company: '', message: '', imageUrl: '', education: '', passoutYear: '', collegeName: '', role: '', salaryPackage: '' });
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all"
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>

              <div>
                <label className={labelStyles}>Student Name</label>
                <input type="text" placeholder="John Doe" required value={testForm.studentName} onChange={(e) => setTestForm({ ...testForm, studentName: e.target.value })} className={inputStyles} />
              </div>

              <div>
                <label className={labelStyles}>Company</label>
                <input type="text" placeholder="TCS" required value={testForm.company} onChange={(e) => setTestForm({ ...testForm, company: e.target.value })} className={inputStyles} />
              </div>

              <div>
                <label className={labelStyles}>Role</label>
                <input type="text" placeholder="Software Engineer" value={testForm.role} onChange={(e) => setTestForm({ ...testForm, role: e.target.value })} className={inputStyles} />
              </div>

              <div>
                <label className={labelStyles}>Salary Package</label>
                <input type="text" placeholder="e.g. 12 LPA" value={testForm.salaryPackage} onChange={(e) => setTestForm({ ...testForm, salaryPackage: e.target.value })} className={inputStyles} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyles}>Education</label>
                  <input type="text" placeholder="B.Tech" value={testForm.education} onChange={(e) => setTestForm({ ...testForm, education: e.target.value })} className={inputStyles} />
                </div>
                <div>
                  <label className={labelStyles}>Passout Year</label>
                  <input type="text" placeholder="2026" value={testForm.passoutYear} onChange={(e) => setTestForm({ ...testForm, passoutYear: e.target.value })} className={inputStyles} />
                </div>
              </div>

              <div>
                <label className={labelStyles}>College Name</label>
                <input type="text" placeholder="College Institute of Tech" value={testForm.collegeName} onChange={(e) => setTestForm({ ...testForm, collegeName: e.target.value })} className={inputStyles} />
              </div>

              <div className="bg-black/5 dark:bg-white/5 border border-dashed border-gray-300 dark:border-slate-600 rounded-2xl p-6 text-center hover:bg-black/10 transition-colors">
                <label className="cursor-pointer text-sm font-extrabold text-gray-600 dark:text-gray-300 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <FiUploadCloud size={24} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  Upload Profile Picture
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'test')} className="hidden" />
                </label>
              </div>

              {testForm.imageUrl && (
                <img src={testForm.imageUrl} alt="Preview" className="w-24 h-24 object-cover rounded-full border-4 border-white/60 dark:border-slate-700 shadow-md mx-auto" />
              )}

              <div>
                <label className={labelStyles}>Testimonial Message</label>
                <textarea placeholder="Share their success story..." required value={testForm.message} onChange={(e) => setTestForm({ ...testForm, message: e.target.value })} className={`${inputStyles} h-28 resize-none`} />
              </div>

              <button type="submit" className={`w-full text-white py-3.5 rounded-xl font-extrabold shadow-lg transition-all ${editingTestId ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/30' : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30'}`}>
                {editingTestId ? 'Update Testimonial' : 'Publish Testimonial'}
              </button>
            </form>

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 content-start">
              {testimonials.map((t) => (
                <div key={t._id} className="glass-panel p-6 rounded-[2rem] flex flex-col hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-start gap-4 mb-4">
                    <img src={t.imageUrl || 'https://via.placeholder.com/50'} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white/60 shadow-sm shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-lg text-gray-900 dark:text-white truncate">{t.studentName}</h4>
                      <p className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider mt-0.5 truncate">
                        {t.role ? `${t.role} @ ` : ''}{t.company}
                      </p>
                    </div>
                  </div>

                  <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3 mb-4 space-y-1.5 border border-black/5 dark:border-white/5">
                    {t.salaryPackage && <p className="text-xs font-bold text-green-600 dark:text-green-400 flex justify-between"><span>Package</span> <span>{t.salaryPackage}</span></p>}
                    {(t.education || t.passoutYear) && <p className="text-xs font-medium text-gray-600 dark:text-gray-300 flex justify-between"><span>Edu</span> <span>{t.education} {t.passoutYear}</span></p>}
                  </div>

                  <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/5 flex justify-end gap-2">
                    <button onClick={() => loadTestForEdit(t)} className="w-10 h-10 rounded-full flex items-center justify-center text-blue-600 bg-blue-500/10 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                      <FiEdit size={16} />
                    </button>
                    <button onClick={() => handleDelete('testimonials', t._id)} className="w-10 h-10 rounded-full flex items-center justify-center text-red-600 bg-red-500/10 hover:bg-red-600 hover:text-white transition-all shadow-sm">
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performers */}
        {activeTab === 'Performers' && <TrainerPerformers />}

        {/* Banner */}
        {activeTab === 'Banner' && (
          <div className="glass-panel p-10 rounded-[2rem] max-w-2xl mx-auto mt-4 text-center">
            <h2 className="text-2xl font-extrabold mb-2 text-gray-900 dark:text-white tracking-tight">Update Dashboard Banner</h2>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-8">Upload a high-quality, wide image (e.g., 1200x300 pixels).</p>

            <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 bg-black/5 dark:bg-white/5 rounded-[2rem] p-12 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
              <label className="cursor-pointer flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center shadow-inner">
                  <FiUploadCloud size={32} className="text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-extrabold text-lg text-gray-800 dark:text-gray-200">Click to Upload New Banner</span>
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
                          await axios.post(`${process.env.REACT_APP_API_URL}/api/banner`, { imageUrl: reader.result }, config);
                          alert('Banner updated successfully!');
                        } catch (err) { alert('Failed to upload banner.'); }
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
        {activeTab === 'Approvals' && (
          <div className="glass-panel rounded-[2rem] overflow-hidden">
            <div className="p-6 border-b border-black/5 dark:border-white/5 bg-white/20 dark:bg-slate-800/20">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Pending Registrations</h2>
            </div>

            {pendingUsers.length === 0 ? (
              <p className="p-16 text-center text-gray-500 dark:text-gray-400 font-medium text-lg">No pending accounts to approve.</p>
            ) : (
              <div className="overflow-x-auto w-full custom-scrollbar">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-xs font-extrabold uppercase tracking-widest border-b border-black/5 dark:border-white/5">
                    <tr>
                      <th className="p-5">Name</th>
                      <th className="p-5">Email</th>
                      <th className="p-5">Role</th>
                      <th className="p-5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {pendingUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="p-5 font-bold text-gray-900 dark:text-white text-base">{user.name}</td>
                        <td className="p-5 text-sm font-medium text-gray-600 dark:text-gray-300">{user.email}</td>
                        <td className="p-5">
                          <span className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20 text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm">
                            {user.role}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="flex justify-center gap-3">
                            <button
                              onClick={async () => {
                                await axios.put(`${process.env.REACT_APP_API_URL}/api/users/${user._id}/status`, { status: 'approved' }, config);
                                setPendingUsers(pendingUsers.filter(u => u._id !== user._id));
                              }}
                              className="bg-green-500/10 hover:bg-green-600 text-green-700 hover:text-white border border-green-500/20 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={async () => {
                                await axios.put(`${process.env.REACT_APP_API_URL}/api/users/${user._id}/status`, { status: 'rejected' }, config);
                                setPendingUsers(pendingUsers.filter(u => u._id !== user._id));
                              }}
                              className="bg-red-500/10 hover:bg-red-600 text-red-700 hover:text-white border border-red-500/20 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm"
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
        {activeTab === 'Jobs' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <form onSubmit={handleJobSubmit} className="glass-panel p-8 rounded-[2rem] lg:col-span-2 space-y-5 h-fit">
              <h3 className="font-extrabold text-xl text-gray-900 dark:text-white mb-6 border-b border-black/5 dark:border-white/5 pb-4 tracking-tight">
                Post a New Job Opportunity
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className={labelStyles}>Job ID</label><input type="text" placeholder="e.g. TCS-01" required value={jobForm.jobId} onChange={(e) => setJobForm({ ...jobForm, jobId: e.target.value })} className={inputStyles} /></div>
                <div><label className={labelStyles}>Job Title</label><input type="text" placeholder="e.g. Software Engineer" required value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} className={inputStyles} /></div>
                
                <div className="md:col-span-2">
                  <label className={labelStyles}>Company About Section</label>
                  <textarea placeholder="Brief about the company..." rows="2" value={jobForm.companyAbout} onChange={(e) => setJobForm({ ...jobForm, companyAbout: e.target.value })} className={`${inputStyles} resize-none`} />
                </div>
                
                <div className="md:col-span-2">
                  <label className={labelStyles}>Job Description</label>
                  <textarea placeholder="Roles and responsibilities..." rows="3" required value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} className={`${inputStyles} resize-none`} />
                </div>

                <div><label className={labelStyles}>Location</label><input type="text" placeholder="Pune, India" required value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} className={inputStyles} /></div>
                <div><label className={labelStyles}>Salary</label><input type="text" placeholder="e.g. 5 LPA" value={jobForm.salary} onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })} className={inputStyles} /></div>
                
                <div>
                  <label className={labelStyles}>Hiring Process</label>
                  <select value={jobForm.hiringProcess} onChange={(e) => setJobForm({ ...jobForm, hiringProcess: e.target.value })} className={inputStyles}>
                    <option>Online</option><option>Offline</option><option>Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className={labelStyles}>Last Date to Apply</label>
                  <input type="date" required value={jobForm.lastDateToApply} onChange={(e) => setJobForm({ ...jobForm, lastDateToApply: e.target.value })} className={inputStyles} />
                </div>

                <div><label className={labelStyles}>Interview Date</label><input type="text" placeholder="e.g. 15 Oct 2026" value={jobForm.interviewDate} onChange={(e) => setJobForm({ ...jobForm, interviewDate: e.target.value })} className={inputStyles} /></div>
                <div><label className={labelStyles}>Interview Location</label><input type="text" placeholder="e.g. Office / Zoom" value={jobForm.interviewLocation} onChange={(e) => setJobForm({ ...jobForm, interviewLocation: e.target.value })} className={inputStyles} /></div>

                <div className="md:col-span-2 mt-6 mb-2">
                  <h4 className="font-extrabold text-blue-600 dark:text-blue-400 border-b border-blue-500/20 pb-2 tracking-tight">
                    Smart Matching Criteria
                  </h4>
                </div>

                <div><label className={labelStyles}>Req Qualification</label><input type="text" placeholder="e.g. B.Tech" required value={jobForm.reqQualification} onChange={(e) => setJobForm({ ...jobForm, reqQualification: e.target.value })} className={inputStyles} /></div>
                <div><label className={labelStyles}>Req Passing Year</label><input type="text" placeholder="e.g. 2026" required value={jobForm.reqPassingYear} onChange={(e) => setJobForm({ ...jobForm, reqPassingYear: e.target.value })} className={inputStyles} /></div>
                <div><label className={labelStyles}>Min Percentage (%)</label><input type="number" step="0.01" required value={jobForm.reqMinPercentage} onChange={(e) => setJobForm({ ...jobForm, reqMinPercentage: e.target.value })} className={inputStyles} /></div>
                <div><label className={labelStyles}>Min Employability Score</label><input type="number" required value={jobForm.reqEmployabilityScore} onChange={(e) => setJobForm({ ...jobForm, reqEmployabilityScore: e.target.value })} className={inputStyles} /></div>
                <div><label className={labelStyles}>Max Active Backlogs</label><input type="number" required value={jobForm.reqMaxBacklogs} onChange={(e) => setJobForm({ ...jobForm, reqMaxBacklogs: e.target.value })} className={inputStyles} /></div>
                <div><label className={labelStyles}>Max Education Gap (Years)</label><input type="number" required value={jobForm.reqMaxEducationGap} onChange={(e) => setJobForm({ ...jobForm, reqMaxEducationGap: e.target.value })} className={inputStyles} /></div>

                <div className="md:col-span-2">
                  <label className={labelStyles}>Required Skills (Comma Separated)</label>
                  <input type="text" placeholder="React, Node.js, Java" value={jobForm.reqSkills} onChange={(e) => setJobForm({ ...jobForm, reqSkills: e.target.value })} className={inputStyles} />
                </div>
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold py-3.5 rounded-xl mt-6 transition-all shadow-lg shadow-blue-500/30">
                Post Job Opportunity
              </button>
            </form>

            <div className="lg:col-span-1 space-y-5 max-h-[900px] overflow-y-auto custom-scrollbar pr-2">
              <div className="sticky top-0 bg-gray-50/90 dark:bg-slate-900/90 backdrop-blur z-10 py-3 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
                <h3 className="font-extrabold text-lg text-gray-900 dark:text-white tracking-tight">Active Jobs</h3>
                <button onClick={() => setSearchParams({ tab: 'Applications' })} className="glass-button bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold py-2 px-4 rounded-lg shadow-sm border border-blue-500/20">
                  View Applications →
                </button>
              </div>

              {jobs.length === 0 && <p className="text-gray-500 font-medium text-sm text-center py-10">No jobs posted yet.</p>}

              {jobs.map((j) => (
                <div key={j._id} className="glass-panel p-6 rounded-3xl relative group hover:-translate-y-1 transition-all duration-300">
                  <button onClick={() => handleDelete('jobs', j._id)} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-red-500 bg-red-500/10 hover:bg-red-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-red-500/20">
                    <FiTrash2 size={14} />
                  </button>

                  <span className="text-[10px] font-extrabold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 px-3 py-1 rounded-md tracking-wider uppercase mb-3 inline-block">
                    {j.jobId}
                  </span>

                  <h4 className="font-extrabold text-lg pr-8 text-gray-900 dark:text-white leading-snug mb-1">
                    {j.title}
                  </h4>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-4">
                    {j.location} • {j.salary}
                  </p>

                  <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5 text-[10px] font-bold text-gray-600 dark:text-gray-300 space-y-1.5 tracking-wide">
                    <p>🎓 <span className="text-gray-400 uppercase">Req:</span> {j.reqQualification} ({j.reqPassingYear})</p>
                    <p>📊 <span className="text-gray-400 uppercase">Score:</span> {j.reqEmployabilityScore} | <span className="text-gray-400 uppercase">%:</span> {j.reqMinPercentage}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Student Profiles Edit Tab */}
        {activeTab === 'Student Profiles' && (
          <div className="glass-panel p-8 rounded-[2rem]">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-8 tracking-tight">
              Manage Student Profiles
            </h2>

            {editingStudentId ? (
              <form onSubmit={handleStudentProfileSubmit} className="space-y-5 bg-black/5 dark:bg-white/5 p-8 rounded-[1.5rem] border border-black/5 dark:border-white/5 shadow-inner mb-8">
                <h3 className="font-extrabold text-lg text-gray-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-3 tracking-tight">
                  Edit Student Profile & Lock Status
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  <div><label className={labelStyles}>Highest Qualification</label><input type="text" value={studentProfileForm.highestQualification} onChange={(e) => setStudentProfileForm({ ...studentProfileForm, highestQualification: e.target.value })} className={inputStyles} /></div>
                  <div><label className={labelStyles}>Passing Year</label><input type="text" value={studentProfileForm.passingYear} onChange={(e) => setStudentProfileForm({ ...studentProfileForm, passingYear: e.target.value })} className={inputStyles} /></div>
                  <div><label className={labelStyles}>Percentage / CGPA</label><input type="number" step="0.01" value={studentProfileForm.percentage} onChange={(e) => setStudentProfileForm({ ...studentProfileForm, percentage: e.target.value })} className={inputStyles} /></div>
                  <div><label className={labelStyles}>Backlogs</label><input type="number" value={studentProfileForm.backlogs} onChange={(e) => setStudentProfileForm({ ...studentProfileForm, backlogs: e.target.value })} className={inputStyles} /></div>
                  <div><label className={labelStyles}>Education Gap (Yrs)</label><input type="number" value={studentProfileForm.educationGap} onChange={(e) => setStudentProfileForm({ ...studentProfileForm, educationGap: e.target.value })} className={inputStyles} /></div>
                  <div><label className={labelStyles}>Skills (Comma separated)</label><input type="text" value={studentProfileForm.skillsAcquired} onChange={(e) => setStudentProfileForm({ ...studentProfileForm, skillsAcquired: e.target.value })} className={inputStyles} /></div>
                </div>

                <div className="mt-4 p-5 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-white/50 dark:border-slate-700/50 flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="font-extrabold text-gray-800 dark:text-gray-200">Profile Lock Status</h4>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">Unlocking will allow the student to edit their profile again.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={studentProfileForm.profileLocked} onChange={(e) => setStudentProfileForm({ ...studentProfileForm, profileLocked: e.target.checked })} />
                    <div className="w-12 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                  </label>
                </div>

                <div className="flex gap-4 pt-5 border-t border-black/5 dark:border-white/5">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-extrabold transition-all shadow-md">
                    Save Profile
                  </button>
                  <button type="button" onClick={() => setEditingStudentId(null)} className="glass-button text-gray-700 dark:text-gray-300 px-8 py-3 rounded-xl font-bold transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.length === 0 && <p className="text-gray-500 font-medium col-span-3 text-center py-10">No students found.</p>}
                
                {students.map((s) => (
                  <div key={s._id} className="glass-panel p-6 rounded-[2rem] flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-extrabold text-lg text-gray-900 dark:text-white truncate" title={s.name}>{s.name}</h4>
                        {s.profileLocked ? (
                          <span className="flex items-center gap-1 text-[10px] bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 px-2.5 py-1 rounded-lg font-extrabold uppercase tracking-wider shrink-0 shadow-sm">
                            <FiLock /> Locked
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 px-2.5 py-1 rounded-lg font-extrabold uppercase tracking-wider shrink-0 shadow-sm">
                            <FiUnlock /> Unlocked
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-5 truncate">{s.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setEditingStudentId(s._id);
                        setStudentProfileForm({ ...s });
                      }}
                      className="w-full glass-button border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white py-2.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                      <FiEdit size={16} /> Edit Profile
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* External Component Tabs */}
        {activeTab === 'Company Questions' && <AdminCompanies />}
        {activeTab === 'Assignments' && <AdminAssignments />}
        {activeTab === 'Batches' && <AdminBatches />}
        {activeTab === 'Manage Users' && <AdminUsers />}
        {activeTab === 'Applications' && <AdminApplications />}
        {activeTab === 'Students by Batch & Attendance Reports' && <StaffBatchTracker />}
        {activeTab === 'Coding Tests' && <AdminTests />}
        {activeTab === 'online-classes' && <OnlineClassesManager />}
      </div>
    </div>
  );
};

export default Admin;