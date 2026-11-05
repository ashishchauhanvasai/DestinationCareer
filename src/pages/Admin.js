import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import AdminCompanies from '../components/AdminCompanies';
import AdminAssignments from '../components/AdminAssignments';
import AdminTests from '../components/AdminTests';
import AdminBatches from '../components/AdminBatches';
import AdminApplications from '../components/AdminApplications';
import StaffBatchTracker from '../components/StaffBatchTracker';
import AdminUsers from '../components/AdminUsers';
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
          setTestForm({ ...testForm, imageUrl: reader.result });
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
      setJobs([res.data, ...jobs]);
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

  const inputStyles = "apple-input";
  const labelStyles = "block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-widest pl-1";

  return (
    <div className="min-h-screen pb-12 pt-4 px-2 sm:px-4 lg:px-6 space-y-8 animate-fade-in">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Admin Control Panel
          </h1>
          <p className="text-[13px] font-extrabold text-gray-500 dark:text-gray-400 mt-2 bg-gray-100 dark:bg-slate-800 w-fit px-4 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 shadow-sm">
            Currently managing: <strong className="text-blue-600 dark:text-blue-400 uppercase tracking-widest">{activeTab}</strong>
          </p>
        </div>

        {/* Courses */}
        {activeTab === 'Courses' && (
          <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                All Courses
              </h2>
              <Link
                to="/add-course"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl font-extrabold flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-transform hover:scale-[0.98] text-[13px] uppercase tracking-wider"
              >
                <FiPlus size={16} />
                <span className="hidden sm:inline">Add Course</span>
              </Link>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-[2rem] border border-gray-200 dark:border-slate-700 shadow-inner flex-1 overflow-hidden">
              {courses.length === 0 ? (
                <div className="text-center py-20 text-gray-500 dark:text-gray-400 font-bold text-lg">
                  No courses available.
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-slate-700 text-[11px] text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-widest bg-gray-100 dark:bg-slate-800/80">
                        <th className="p-6">Course Title</th>
                        <th className="p-6">Topics / Videos</th>
                        <th className="p-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                      {courses.map((c) => {
                        const totalVideos = c.topics?.reduce((acc, t) => acc + (t.videos?.length || 0), 0) || 0;
                        return (
                          <tr key={c._id} className="hover:bg-white dark:hover:bg-slate-800 transition-colors group">
                            <td className="p-6">
                              <div className="font-extrabold text-[15px] text-gray-900 dark:text-white">
                                {c.subjectTitle}
                              </div>
                            </td>
                            <td className="p-6 text-[13px] font-bold text-gray-600 dark:text-gray-400">
                              {c.topics?.length || 0} topics • {totalVideos} videos
                            </td>
                            <td className="p-6">
                              <div className="flex justify-end gap-3">
                                <Link
                                  to={`/edit-course/${c._id}`}
                                  className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 bg-white dark:bg-slate-900 hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-gray-200 dark:border-slate-700"
                                  title="Edit Course"
                                >
                                  <FiEdit size={16} />
                                </Link>
                                <button
                                  onClick={() => handleDelete('courses', c._id)}
                                  className="w-10 h-10 rounded-xl flex items-center justify-center text-red-500 bg-white dark:bg-slate-900 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-gray-200 dark:border-slate-700"
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
          </div>
        )}

        {/* Testimonials */}
        {activeTab === 'Testimonials' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <form
              onSubmit={handleTestSubmit}
              className={`glass-panel p-6 md:p-8 rounded-[2.5rem] space-y-5 lg:col-span-1 h-fit transition-all duration-300 shadow-sm ${
                editingTestId ? 'ring-2 ring-blue-500/50 shadow-blue-500/20' : ''
              }`}
            >
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-slate-700 pb-4 mb-4">
                <h3 className="font-extrabold text-2xl text-gray-900 dark:text-white tracking-tight">
                  {editingTestId ? 'Edit Testimonial' : 'Add Testimonial'}
                </h3>
                {editingTestId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTestId(null);
                      setTestForm({ studentName: '', company: '', message: '', imageUrl: '', education: '', passoutYear: '', collegeName: '', role: '', salaryPackage: '' });
                    }}
                    className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 transition-all border border-gray-200 dark:border-slate-700 shadow-sm"
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>

              <div><label className={labelStyles}>Student Name</label><input type="text" placeholder="John Doe" required value={testForm.studentName} onChange={(e) => setTestForm({ ...testForm, studentName: e.target.value })} className={inputStyles} /></div>
              <div><label className={labelStyles}>Company</label><input type="text" placeholder="TCS" required value={testForm.company} onChange={(e) => setTestForm({ ...testForm, company: e.target.value })} className={inputStyles} /></div>
              <div><label className={labelStyles}>Role</label><input type="text" placeholder="Software Engineer" value={testForm.role} onChange={(e) => setTestForm({ ...testForm, role: e.target.value })} className={inputStyles} /></div>
              <div><label className={labelStyles}>Salary Package</label><input type="text" placeholder="e.g. 12 LPA" value={testForm.salaryPackage} onChange={(e) => setTestForm({ ...testForm, salaryPackage: e.target.value })} className={inputStyles} /></div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyles}>Education</label><input type="text" placeholder="B.Tech" value={testForm.education} onChange={(e) => setTestForm({ ...testForm, education: e.target.value })} className={inputStyles} /></div>
                <div><label className={labelStyles}>Passout Year</label><input type="text" placeholder="2026" value={testForm.passoutYear} onChange={(e) => setTestForm({ ...testForm, passoutYear: e.target.value })} className={inputStyles} /></div>
              </div>

              <div><label className={labelStyles}>College Name</label><input type="text" placeholder="Institute of Tech" value={testForm.collegeName} onChange={(e) => setTestForm({ ...testForm, collegeName: e.target.value })} className={inputStyles} /></div>

              <div className="bg-gray-50 dark:bg-slate-800/80 border border-dashed border-gray-300 dark:border-slate-600 rounded-[1.5rem] p-6 text-center hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors shadow-inner">
                <label className="cursor-pointer text-[13px] font-extrabold text-gray-700 dark:text-gray-300 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-[1rem] bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center shadow-sm">
                    <FiUploadCloud size={24} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  Upload Profile Picture
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'test')} className="hidden" />
                </label>
              </div>

              {testForm.imageUrl && (
                <img src={testForm.imageUrl} alt="Preview" className="w-24 h-24 object-cover rounded-[1.5rem] border-2 border-gray-200 dark:border-slate-700 shadow-md mx-auto bg-white" />
              )}

              <div><label className={labelStyles}>Testimonial Message</label><textarea placeholder="Share their success story..." required value={testForm.message} onChange={(e) => setTestForm({ ...testForm, message: e.target.value })} className={`${inputStyles} h-32 resize-none leading-relaxed`} /></div>

              <button type="submit" className={`w-full text-white py-4 rounded-xl font-extrabold shadow-lg transition-transform hover:scale-[0.98] text-[15px] ${editingTestId ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/30' : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30'}`}>
                {editingTestId ? 'Update Testimonial' : 'Publish Testimonial'}
              </button>
            </form>

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 content-start">
              {testimonials.map((t) => (
                <div key={t._id} className="glass-panel p-6 md:p-8 rounded-[2.5rem] flex flex-col hover:-translate-y-1 transition-all duration-300 shadow-sm border border-gray-200 dark:border-slate-700">
                  <div className="flex items-center gap-5 mb-5">
                    <img src={t.imageUrl || 'https://via.placeholder.com/50'} alt="" className="w-16 h-16 rounded-[1rem] object-cover border border-gray-200 dark:border-slate-700 shadow-sm shrink-0 bg-white" />
                    <div className="min-w-0 pr-2">
                      <h4 className="font-extrabold text-xl text-gray-900 dark:text-white truncate tracking-tight">{t.studentName}</h4>
                      <p className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 uppercase tracking-widest mt-1 truncate bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded shadow-sm inline-block">
                        {t.role ? `${t.role} @ ` : ''}{t.company}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-slate-800/80 rounded-[1.5rem] p-4 mb-5 space-y-2 border border-gray-200 dark:border-slate-700 shadow-inner">
                    {t.salaryPackage && <p className="text-[11px] font-extrabold text-green-700 dark:text-green-400 flex justify-between uppercase tracking-widest"><span>Package</span> <span>{t.salaryPackage}</span></p>}
                    {(t.education || t.passoutYear) && <p className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 flex justify-between uppercase tracking-widest"><span>Edu</span> <span>{t.education} {t.passoutYear}</span></p>}
                  </div>

                  <div className="mt-auto pt-5 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
                    <button onClick={() => loadTestForEdit(t)} className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-gray-200 dark:border-slate-700">
                      <FiEdit size={16} />
                    </button>
                    <button onClick={() => handleDelete('testimonials', t._id)} className="w-10 h-10 rounded-xl flex items-center justify-center text-red-500 bg-white dark:bg-slate-900 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-gray-200 dark:border-slate-700">
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
          <div className="glass-panel p-8 md:p-12 rounded-[2.5rem] max-w-2xl mx-auto text-center shadow-sm">
            <h2 className="text-3xl font-extrabold mb-2 text-gray-900 dark:text-white tracking-tight">Update Dashboard Banner</h2>
            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-8 opacity-90">Upload a high-quality, wide image (e.g., 1200x300 pixels).</p>

            <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800/50 rounded-[2rem] p-16 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors shadow-inner">
              <label className="cursor-pointer flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shadow-sm border border-blue-200 dark:border-blue-800">
                  <FiUploadCloud size={40} className="text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight mt-2">Click to Upload New Banner</span>
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
          <div className="glass-panel rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="p-6 md:p-8 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Pending Registrations</h2>
            </div>

            {pendingUsers.length === 0 ? (
              <p className="p-20 text-center text-gray-500 dark:text-gray-400 font-bold text-xl">No pending accounts to approve.</p>
            ) : (
              <div className="overflow-x-auto custom-scrollbar bg-white dark:bg-[#1e293b]">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 text-[11px] font-extrabold uppercase tracking-widest border-b border-gray-200 dark:border-slate-700">
                    <tr>
                      <th className="p-6">Name</th>
                      <th className="p-6">Email</th>
                      <th className="p-6">Role</th>
                      <th className="p-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
                    {pendingUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-6 font-extrabold text-gray-900 dark:text-white text-[15px]">{user.name}</td>
                        <td className="p-6 text-[13px] font-bold text-gray-600 dark:text-gray-400">{user.email}</td>
                        <td className="p-6">
                          <span className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm">
                            {user.role}
                          </span>
                        </td>
                        <td className="p-6">
                          <div className="flex justify-center gap-3">
                            <button
                              onClick={async () => {
                                await axios.put(`${process.env.REACT_APP_API_URL}/api/users/${user._id}/status`, { status: 'approved' }, config);
                                setPendingUsers(pendingUsers.filter(u => u._id !== user._id));
                              }}
                              className="bg-green-50 dark:bg-green-900/30 hover:bg-green-600 text-green-700 dark:text-green-400 hover:text-white border border-green-200 dark:border-green-800 px-5 py-2.5 rounded-xl font-extrabold text-[11px] uppercase tracking-wider transition-all shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={async () => {
                                await axios.put(`${process.env.REACT_APP_API_URL}/api/users/${user._id}/status`, { status: 'rejected' }, config);
                                setPendingUsers(pendingUsers.filter(u => u._id !== user._id));
                              }}
                              className="bg-red-50 dark:bg-red-900/30 hover:bg-red-500 text-red-700 dark:text-red-400 hover:text-white border border-red-200 dark:border-red-800 px-5 py-2.5 rounded-xl font-extrabold text-[11px] uppercase tracking-wider transition-all shadow-sm"
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
            <form onSubmit={handleJobSubmit} className="glass-panel p-6 md:p-8 rounded-[2.5rem] lg:col-span-2 space-y-6 h-fit shadow-sm border border-gray-200 dark:border-slate-700">
              <h3 className="font-extrabold text-2xl text-gray-900 dark:text-white mb-2 border-b border-gray-200 dark:border-slate-700 pb-5 tracking-tight">
                Post a New Job Opportunity
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div><label className={labelStyles}>Job ID</label><input type="text" placeholder="e.g. TCS-01" required value={jobForm.jobId} onChange={(e) => setJobForm({ ...jobForm, jobId: e.target.value })} className={`${inputStyles} font-extrabold uppercase`} /></div>
                <div><label className={labelStyles}>Job Title</label><input type="text" placeholder="e.g. Software Engineer" required value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} className={inputStyles} /></div>
                
                <div className="md:col-span-2">
                  <label className={labelStyles}>Company About Section</label>
                  <textarea placeholder="Brief about the company..." rows="3" value={jobForm.companyAbout} onChange={(e) => setJobForm({ ...jobForm, companyAbout: e.target.value })} className={`${inputStyles} resize-none leading-relaxed`} />
                </div>
                
                <div className="md:col-span-2">
                  <label className={labelStyles}>Job Description</label>
                  <textarea placeholder="Roles and responsibilities..." rows="4" required value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} className={`${inputStyles} resize-none leading-relaxed`} />
                </div>

                <div><label className={labelStyles}>Location</label><input type="text" placeholder="Pune, India" required value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} className={inputStyles} /></div>
                <div><label className={labelStyles}>Salary</label><input type="text" placeholder="e.g. 5 LPA" value={jobForm.salary} onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })} className={inputStyles} /></div>
                
                <div>
                  <label className={labelStyles}>Hiring Process</label>
                  <select value={jobForm.hiringProcess} onChange={(e) => setJobForm({ ...jobForm, hiringProcess: e.target.value })} className={`${inputStyles} cursor-pointer font-bold`}>
                    <option>Online</option><option>Offline</option><option>Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className={labelStyles}>Last Date to Apply</label>
                  <input type="date" required value={jobForm.lastDateToApply} onChange={(e) => setJobForm({ ...jobForm, lastDateToApply: e.target.value })} className={inputStyles} />
                </div>

                <div><label className={labelStyles}>Interview Date</label><input type="text" placeholder="e.g. 15 Oct 2026" value={jobForm.interviewDate} onChange={(e) => setJobForm({ ...jobForm, interviewDate: e.target.value })} className={inputStyles} /></div>
                <div><label className={labelStyles}>Interview Location</label><input type="text" placeholder="e.g. Office / Zoom" value={jobForm.interviewLocation} onChange={(e) => setJobForm({ ...jobForm, interviewLocation: e.target.value })} className={inputStyles} /></div>

                <div className="md:col-span-2 mt-8 mb-4 border-t border-gray-200 dark:border-slate-700 pt-8">
                  <h4 className="font-extrabold text-xl text-blue-600 dark:text-blue-400 tracking-tight mb-2">
                    Smart Matching Criteria
                  </h4>
                  <p className="text-xs font-medium text-gray-500 mb-2">Used to automatically filter applications.</p>
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

              <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold py-4 rounded-xl mt-8 transition-transform hover:scale-[0.98] shadow-lg shadow-blue-500/30 text-[15px]">
                Post Job Opportunity
              </button>
            </form>

            <div className="lg:col-span-1 space-y-6 max-h-[1200px] overflow-y-auto custom-scrollbar pr-2">
              <div className="sticky top-0 bg-gray-50/90 dark:bg-[#0f172a]/90 backdrop-blur-md z-10 py-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center px-2">
                <h3 className="font-extrabold text-2xl text-gray-900 dark:text-white tracking-tight">Active Jobs</h3>
                <button onClick={() => setSearchParams({ tab: 'Applications' })} className="glass-button bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-extrabold py-2 px-4 rounded-lg shadow-sm border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
                  Apps →
                </button>
              </div>

              {jobs.length === 0 && <p className="text-gray-500 font-bold text-lg text-center py-20">No jobs posted yet.</p>}

              {jobs.map((j) => (
                <div key={j._id} className="glass-panel p-6 md:p-8 rounded-[2rem] relative group hover:-translate-y-1 transition-all duration-300 shadow-sm">
                  <button onClick={() => handleDelete('jobs', j._id)} className="absolute top-6 right-6 w-9 h-9 rounded-xl flex items-center justify-center text-red-500 bg-red-50 dark:bg-red-900/30 hover:bg-red-500 hover:text-white transition-all opacity-100 xl:opacity-0 xl:group-hover:opacity-100 shadow-sm border border-red-200 dark:border-red-800">
                    <FiTrash2 size={16} />
                  </button>

                  <span className="text-[10px] font-extrabold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-md tracking-wider uppercase mb-4 inline-block shadow-sm">
                    {j.jobId}
                  </span>

                  <h4 className="font-extrabold text-xl pr-10 text-gray-900 dark:text-white leading-tight mb-2 tracking-tight">
                    {j.title}
                  </h4>
                  <p className="text-[13px] font-bold text-gray-500 dark:text-gray-400 mb-5 leading-snug">
                    {j.location} • {j.salary}
                  </p>

                  <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 text-[11px] font-extrabold text-gray-600 dark:text-gray-300 space-y-2 tracking-wider uppercase shadow-inner">
                    <p className="flex justify-between"><span>Req:</span> <span className="text-gray-900 dark:text-white">{j.reqQualification} ({j.reqPassingYear})</span></p>
                    <p className="flex justify-between"><span>Score:</span> <span className="text-gray-900 dark:text-white">{j.reqEmployabilityScore}</span></p>
                    <p className="flex justify-between"><span>Marks:</span> <span className="text-gray-900 dark:text-white">{j.reqMinPercentage}%</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Student Profiles Edit Tab */}
        {activeTab === 'Student Profiles' && (
          <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] shadow-sm">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8 tracking-tight">
              Manage Student Profiles
            </h2>

            {editingStudentId ? (
              <form onSubmit={handleStudentProfileSubmit} className="space-y-6 bg-gray-50 dark:bg-slate-800/80 p-6 md:p-8 rounded-[2.5rem] border border-gray-200 dark:border-slate-700 shadow-inner mb-10 animate-fade-in">
                <h3 className="font-extrabold text-2xl text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-5 mb-2 tracking-tight">
                  Edit Student Profile
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div><label className={labelStyles}>Highest Qualification</label><input type="text" value={studentProfileForm.highestQualification} onChange={(e) => setStudentProfileForm({ ...studentProfileForm, highestQualification: e.target.value })} className={inputStyles} /></div>
                  <div><label className={labelStyles}>Passing Year</label><input type="text" value={studentProfileForm.passingYear} onChange={(e) => setStudentProfileForm({ ...studentProfileForm, passingYear: e.target.value })} className={inputStyles} /></div>
                  <div><label className={labelStyles}>Percentage / CGPA</label><input type="number" step="0.01" value={studentProfileForm.percentage} onChange={(e) => setStudentProfileForm({ ...studentProfileForm, percentage: e.target.value })} className={inputStyles} /></div>
                  <div><label className={labelStyles}>Backlogs</label><input type="number" value={studentProfileForm.backlogs} onChange={(e) => setStudentProfileForm({ ...studentProfileForm, backlogs: e.target.value })} className={inputStyles} /></div>
                  <div><label className={labelStyles}>Education Gap (Yrs)</label><input type="number" value={studentProfileForm.educationGap} onChange={(e) => setStudentProfileForm({ ...studentProfileForm, educationGap: e.target.value })} className={inputStyles} /></div>
                  <div><label className={labelStyles}>Skills (Comma separated)</label><input type="text" value={studentProfileForm.skillsAcquired} onChange={(e) => setStudentProfileForm({ ...studentProfileForm, skillsAcquired: e.target.value })} className={inputStyles} placeholder="Java, SQL, React" /></div>
                </div>

                <div className="mt-6 p-6 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                  <div>
                    <h4 className="font-extrabold text-gray-900 dark:text-white text-lg">Profile Lock Status</h4>
                    <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mt-1">Unlocking allows the student to edit their profile details.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={studentProfileForm.profileLocked} onChange={(e) => setStudentProfileForm({ ...studentProfileForm, profileLocked: e.target.checked })} />
                    <div className="w-14 h-7 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-slate-700">
                  <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3.5 rounded-xl font-extrabold transition-transform hover:scale-[0.98] shadow-lg shadow-blue-500/30 text-[15px] order-1 sm:order-2">
                    Save Profile
                  </button>
                  <button type="button" onClick={() => setEditingStudentId(null)} className="flex-1 glass-button text-gray-700 dark:text-gray-300 px-8 py-3.5 rounded-xl font-extrabold transition-all border border-gray-300 dark:border-slate-600 text-[15px] order-2 sm:order-1">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.length === 0 && <p className="text-gray-500 font-bold text-xl col-span-3 text-center py-16">No students found.</p>}
                
                {students.map((s) => (
                  <div key={s._id} className="glass-panel p-6 md:p-8 rounded-[2.5rem] flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 shadow-sm border border-gray-200 dark:border-slate-700">
                    <div>
                      <div className="flex justify-between items-start mb-4 gap-4">
                        <h4 className="font-extrabold text-xl text-gray-900 dark:text-white truncate tracking-tight" title={s.name}>{s.name}</h4>
                        {s.profileLocked ? (
                          <span className="flex items-center gap-1.5 text-[10px] bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 px-2.5 py-1.5 rounded-md font-extrabold uppercase tracking-wider shrink-0 shadow-sm">
                            <FiLock size={12}/> Locked
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[10px] bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 px-2.5 py-1.5 rounded-md font-extrabold uppercase tracking-wider shrink-0 shadow-sm">
                            <FiUnlock size={12}/> Editable
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-6 truncate bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 px-3 py-1.5 rounded-lg inline-block">{s.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setEditingStudentId(s._id);
                        setStudentProfileForm({ ...s });
                      }}
                      className="w-full glass-button border border-gray-300 dark:border-slate-600 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white py-3 rounded-xl text-[13px] font-extrabold flex items-center justify-center gap-2 transition-all shadow-sm"
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