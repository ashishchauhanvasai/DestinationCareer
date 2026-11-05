import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiXCircle,
  FiMapPin,
  FiDollarSign,
  FiCalendar,
  FiBriefcase,
  FiAlertCircle,
} from "react-icons/fi";
import ApplyJobForm from "../components/ApplyJobForm";

const JobDetails = () => {
  const { id } = useParams();

  const [job, setJob] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Application states
  const [showApply, setShowApply] = useState(false);
  const [application, setApplication] = useState(null);

  const [eligibility, setEligibility] = useState({
    isEligible: false,
    reasons: [],
  });

  const token = localStorage.getItem("token");

  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [jobRes, profileRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/jobs/${id}`, config),
          axios.get(`${process.env.REACT_APP_API_URL}/api/users/profile`, config),
        ]);

        const jobData = jobRes.data;
        const profileData = profileRes.data;

        setJob(jobData);
        setProfile(profileData);

        // Check whether the current student has already applied
        try {
          const appRes = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/jobs/${id}/my-application`,
            config
          );
          setApplication(appRes.data);
        } catch (e) {
          setApplication(null);
        }

        checkEligibility(jobData, profileData);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load data", err);
        setLoading(false);
      }
    };

    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const checkEligibility = (j, p) => {
    let reasons = [];
    let eligible = true;

    if (!p.highestQualification || !p.highestQualification.toLowerCase().includes(j.reqQualification.toLowerCase())) {
      eligible = false;
      reasons.push(`Qualification mismatch. Required: ${j.reqQualification}, Yours: ${p.highestQualification || "Not provided"}`);
    }

    if (String(p.passingYear) !== String(j.reqPassingYear)) {
      eligible = false;
      reasons.push(`Passing year mismatch. Required: ${j.reqPassingYear}, Yours: ${p.passingYear || "Not provided"}`);
    }

    if (p.percentage < j.reqMinPercentage) {
      eligible = false;
      reasons.push(`Percentage too low. Required: ${j.reqMinPercentage}%, Yours: ${p.percentage || 0}%`);
    }

    if (p.backlogs > j.reqMaxBacklogs) {
      eligible = false;
      reasons.push(`Too many active backlogs. Allowed: ${j.reqMaxBacklogs}, Yours: ${p.backlogs || 0}`);
    }

    if (p.educationGap > j.reqMaxEducationGap) {
      eligible = false;
      reasons.push(`Education gap too large. Allowed: ${j.reqMaxEducationGap} years, Yours: ${p.educationGap || 0} years`);
    }

    setEligibility({ isEligible: eligible, reasons });
  };

  const handleApply = () => setShowApply(true);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="glass-panel bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-slate-700 animate-pulse">
          <div className="text-blue-600 dark:text-blue-400 font-extrabold text-lg flex items-center gap-4">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            Loading Smart Matching Engine...
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="glass-panel bg-white dark:bg-slate-900 p-10 md:p-12 rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-slate-700 text-center max-w-sm w-full">
          <p className="text-gray-500 dark:text-gray-400 font-bold text-xl mb-6">Job not found.</p>
          <Link to="/jobs" className="glass-button inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-extrabold px-6 py-3 rounded-xl border border-gray-300 dark:border-slate-600 shadow-sm">
            <FiArrowLeft /> Back to Job Board
          </Link>
        </div>
      </div>
    );
  }

  const isExpired = new Date(job.lastDateToApply) < new Date();
  const isAdmin = profile?.role === "admin" || localStorage.getItem("role") === "admin";

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 pb-12 animate-fade-in">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* APPLY JOB MODAL */}
        {showApply && (
          <ApplyJobForm
            job={job}
            profile={profile}
            onClose={() => setShowApply(false)}
            onApplied={(a) => {
              setApplication(a);
              setShowApply(false);
            }}
          />
        )}

        {/* Back Button */}
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 text-[13px] font-extrabold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-100 dark:bg-slate-800 px-5 py-2.5 rounded-xl transition-colors w-fit shadow-sm border border-gray-200 dark:border-slate-700 mb-2"
        >
          <FiArrowLeft size={16} /> Back to Job Board
        </Link>

        {/* MATCHING ENGINE PANEL - HIDDEN FOR ADMINS */}
        {!isAdmin && (
          <div
            className={`glass-panel p-6 md:p-8 rounded-[2.5rem] border shadow-sm ${
              eligibility.isEligible
                ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50"
                : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50"
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-5">
              {eligibility.isEligible ? (
                <div className="w-12 h-12 rounded-[1rem] bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 shadow-sm border border-green-200 dark:border-green-800">
                  <FiCheckCircle className="text-green-600 dark:text-green-400" size={24} />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-[1rem] bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0 shadow-sm border border-red-200 dark:border-red-800">
                  <FiXCircle className="text-red-600 dark:text-red-400" size={24} />
                </div>
              )}

              <div className="flex-1 w-full">
                <h2 className={`text-xl md:text-2xl font-black tracking-tight mb-2 sm:pt-2 ${eligibility.isEligible ? "text-green-800 dark:text-green-400" : "text-red-800 dark:text-red-400"}`}>
                  {eligibility.isEligible ? "You are Eligible for this Job!" : "You do not meet the eligibility criteria."}
                </h2>

                {!eligibility.isEligible && (
                  <div className="mt-5 bg-white dark:bg-slate-900 p-5 md:p-6 rounded-[1.5rem] border border-red-200 dark:border-red-900/50 shadow-sm">
                    <h3 className="font-extrabold text-[15px] text-red-800 dark:text-red-400 mb-4 flex items-center gap-2">
                      <FiAlertCircle size={18} /> Reasons for ineligibility:
                    </h3>
                    <ul className="space-y-3">
                      {eligibility.reasons.map((reason, index) => (
                        <li key={index} className="text-[13px] font-bold text-red-700 dark:text-red-300 flex items-start gap-2.5">
                          <span className="mt-0.5 opacity-60">•</span>
                          <span className="leading-snug">{reason}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to="/profile" className="inline-block mt-5 text-[13px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline">
                      Click here to update your profile if this data is incorrect.
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* JOB DETAILS CARD */}
        <div className="glass-panel bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm border border-gray-200 dark:border-slate-700">
          
          {/* Header */}
          <div className="p-6 md:p-10 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-lg tracking-wider shadow-sm uppercase">
                {job.jobId}
              </span>
              {isExpired ? (
                <span className="text-[10px] font-extrabold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg tracking-wider shadow-sm uppercase">
                  Closed
                </span>
              ) : (
                <span className="text-[10px] font-extrabold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-3 py-1.5 rounded-lg tracking-wider shadow-sm uppercase">
                  Active
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight leading-tight">
              {job.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-[15px] leading-relaxed font-medium">
              {job.companyAbout}
            </p>
          </div>

          {/* Quick Info Grid */}
          <div className="p-6 md:p-10 border-b border-gray-200 dark:border-slate-700">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[
                { icon: FiCalendar, label: "Apply Before", value: new Date(job.lastDateToApply).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'}), color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" },
                { icon: FiMapPin, label: "Location", value: job.location, color: "text-green-500 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" },
                { icon: FiDollarSign, label: "Salary", value: job.salary, color: "text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800" },
                { icon: FiBriefcase, label: "Process", value: job.hiringProcess, color: "text-purple-500 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800" },
                { icon: FiClock, label: "Interview", value: job.interviewDate, color: "text-orange-500 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800" }
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 dark:bg-slate-800/80 p-4 md:p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg border ${item.color}`}><item.icon size={12} /></span> {item.label}
                  </p>
                  <p className="font-extrabold text-[15px] text-gray-900 dark:text-white truncate" title={item.value}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="p-6 md:p-10 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              Job Description
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line font-medium text-[15px]">
              {job.description}
            </p>
          </div>

          {/* Skills */}
          <div className="p-6 md:p-10 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
            <h3 className="text-lg md:text-xl font-extrabold text-gray-900 dark:text-white mb-5 tracking-tight">
              Required Skills
            </h3>
            <div className="flex flex-wrap gap-3">
              {job.reqSkills && job.reqSkills.split(",").map((skill, i) => (
                <span key={i} className="bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-slate-700 px-4 py-2 rounded-xl text-[13px] font-extrabold shadow-sm">
                  {skill.trim()}
                </span>
              ))}
            </div>
          </div>

          {/* Application Action Button */}
          <div className="p-6 md:p-10 flex flex-col md:flex-row justify-end gap-4 bg-gray-50 dark:bg-slate-800/80 rounded-b-[2.5rem]">
            {isAdmin ? (
              <button disabled className="bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 px-8 py-4 rounded-xl font-extrabold cursor-not-allowed border border-gray-200 dark:border-slate-700 w-full md:w-auto shadow-sm">
                Admins Cannot Apply for Jobs
              </button>
            ) : application ? (
              <button disabled className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-8 py-4 rounded-xl font-extrabold cursor-not-allowed border border-blue-200 dark:border-blue-800 flex items-center justify-center gap-2 w-full md:w-auto shadow-sm uppercase tracking-wider text-sm">
                <FiCheckCircle size={18}/> Applied · {application.status}
              </button>
            ) : isExpired ? (
              <button disabled className="bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 px-8 py-4 rounded-xl font-extrabold cursor-not-allowed border border-gray-200 dark:border-slate-700 w-full md:w-auto shadow-sm">
                Job Application Closed
              </button>
            ) : eligibility.isEligible ? (
              <button onClick={handleApply} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-12 py-4 rounded-xl font-extrabold transition-transform hover:scale-[0.98] shadow-lg shadow-green-500/30 text-[15px] w-full md:w-auto">
                Apply Now
              </button>
            ) : (
              <button disabled className="bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 px-8 py-4 rounded-xl font-extrabold cursor-not-allowed border border-gray-200 dark:border-slate-700 w-full md:w-auto shadow-sm">
                Not Eligible to Apply
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;