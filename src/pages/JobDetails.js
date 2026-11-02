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
        <div className="glass-panel p-8 rounded-3xl animate-pulse">
          <div className="text-blue-600 dark:text-blue-400 font-extrabold text-lg flex items-center gap-3">
            <div className="w-5 h-5 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            Loading Smart Matching Engine...
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="glass-panel p-10 rounded-[2rem] text-center max-w-sm w-full">
          <p className="text-gray-500 dark:text-gray-400 font-bold text-lg mb-6">Job not found.</p>
          <Link to="/jobs" className="glass-button inline-flex items-center gap-2 text-blue-600 font-bold px-6 py-3 rounded-xl">
            <FiArrowLeft /> Back to Job Board
          </Link>
        </div>
      </div>
    );
  }

  const isExpired = new Date(job.lastDateToApply) < new Date();
  const isAdmin = profile?.role === "admin" || localStorage.getItem("role") === "admin";

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
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
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-sm mb-2 transition-colors w-fit px-4 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
        >
          <FiArrowLeft size={18} /> Back to Job Board
        </Link>

        {/* MATCHING ENGINE PANEL - HIDDEN FOR ADMINS */}
        {!isAdmin && (
          <div
            className={`glass-panel p-6 rounded-[2rem] border ${
              eligibility.isEligible
                ? "bg-green-500/10 border-green-500/20"
                : "bg-red-500/10 border-red-500/20"
            }`}
          >
            <div className="flex items-start gap-4">
              {eligibility.isEligible ? (
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 shadow-sm border border-green-500/30">
                  <FiCheckCircle className="text-green-600 dark:text-green-400" size={24} />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 shadow-sm border border-red-500/30">
                  <FiXCircle className="text-red-600 dark:text-red-400" size={24} />
                </div>
              )}

              <div>
                <h2 className={`text-xl font-extrabold tracking-tight pt-1 ${eligibility.isEligible ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"}`}>
                  {eligibility.isEligible ? "You are Eligible for this Job!" : "You do not meet the eligibility criteria."}
                </h2>

                {!eligibility.isEligible && (
                  <div className="mt-5 bg-white/40 dark:bg-black/20 p-5 rounded-2xl border border-red-500/20">
                    <h3 className="font-bold text-red-800 dark:text-red-300 mb-3 flex items-center gap-2">
                      <FiAlertCircle size={18} /> Reasons for ineligibility:
                    </h3>
                    <ul className="space-y-2.5">
                      {eligibility.reasons.map((reason, index) => (
                        <li key={index} className="text-sm font-medium text-red-700 dark:text-red-200 flex items-start gap-2">
                          <span className="mt-0.5">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to="/profile" className="inline-block mt-4 text-sm font-extrabold text-blue-600 dark:text-blue-400 hover:underline">
                      Click here to update your profile if this data is incorrect.
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* JOB DETAILS CARD */}
        <div className="glass-panel rounded-[2rem] overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="p-8 md:p-10 border-b border-black/5 dark:border-white/5 bg-white/20 dark:bg-slate-800/20">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xs font-extrabold text-blue-700 dark:text-blue-300 bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/20 px-3 py-1.5 rounded-lg tracking-wider shadow-sm">
                {job.jobId}
              </span>
              {isExpired ? (
                <span className="text-xs font-bold text-red-700 dark:text-red-300 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg shadow-sm">
                  Closed
                </span>
              ) : (
                <span className="text-xs font-bold text-green-700 dark:text-green-300 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg shadow-sm">
                  Active
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              {job.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed font-medium">
              {job.companyAbout}
            </p>
          </div>

          {/* Quick Info Grid */}
          <div className="p-8 md:p-10 border-b border-black/5 dark:border-white/5">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: FiCalendar, label: "Apply Before", value: new Date(job.lastDateToApply).toLocaleDateString(), color: "text-blue-500" },
                { icon: FiMapPin, label: "Location", value: job.location, color: "text-green-500" },
                { icon: FiDollarSign, label: "Salary", value: job.salary, color: "text-yellow-500" },
                { icon: FiBriefcase, label: "Process", value: job.hiringProcess, color: "text-purple-500" },
                { icon: FiClock, label: "Interview", value: job.interviewDate, color: "text-orange-500" }
              ].map((item, i) => (
                <div key={i} className="bg-white/40 dark:bg-slate-900/40 p-4 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <item.icon className={item.color} size={14} /> {item.label}
                  </p>
                  <p className="font-bold text-gray-900 dark:text-white truncate" title={item.value}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="p-8 md:p-10 border-b border-black/5 dark:border-white/5">
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              Job Description
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line font-medium">
              {job.description}
            </p>
          </div>

          {/* Skills */}
          <div className="p-8 md:p-10 border-b border-black/5 dark:border-white/5 bg-white/10 dark:bg-slate-800/10">
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-5 tracking-tight">
              Required Skills
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {job.reqSkills && job.reqSkills.split(",").map((skill, i) => (
                <span key={i} className="bg-blue-600/10 dark:bg-blue-400/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
                  {skill.trim()}
                </span>
              ))}
            </div>
          </div>

          {/* Application Action Button */}
          <div className="p-8 md:p-10 flex justify-end bg-gray-50/30 dark:bg-slate-900/30 rounded-b-[2rem]">
            {isAdmin ? (
              <button disabled className="bg-gray-400/20 text-gray-600 dark:text-gray-400 px-8 py-3.5 rounded-xl font-extrabold cursor-not-allowed border border-gray-400/20">
                Admins Cannot Apply for Jobs
              </button>
            ) : application ? (
              <button disabled className="bg-blue-600/20 text-blue-700 dark:text-blue-400 px-8 py-3.5 rounded-xl font-extrabold cursor-not-allowed border border-blue-500/20 flex items-center gap-2">
                <FiCheckCircle /> Applied · {application.status}
              </button>
            ) : isExpired ? (
              <button disabled className="bg-gray-400/20 text-gray-600 dark:text-gray-400 px-8 py-3.5 rounded-xl font-extrabold cursor-not-allowed border border-gray-400/20">
                Job Application Closed
              </button>
            ) : eligibility.isEligible ? (
              <button onClick={handleApply} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white px-10 py-4 rounded-xl font-extrabold transition-all shadow-lg shadow-green-500/30 text-lg">
                Apply Now
              </button>
            ) : (
              <button disabled className="bg-gray-400/20 text-gray-600 dark:text-gray-400 px-8 py-3.5 rounded-xl font-extrabold cursor-not-allowed border border-gray-400/20">
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