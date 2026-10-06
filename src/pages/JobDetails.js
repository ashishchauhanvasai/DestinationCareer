
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

const JobDetails = () => {
  const { id } = useParams();

  const [job, setJob] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [eligibility, setEligibility] = useState({
    isEligible: false,
    reasons: [],
  });

  const token = localStorage.getItem("token");

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [jobRes, profileRes] = await Promise.all([
          axios.get(
            `http://localhost:5000/api/jobs/${id}`,
            config
          ),
          axios.get(
            `http://localhost:5000/api/users/profile`,
            config
          ),
        ]);

        const jobData = jobRes.data;
        const profileData = profileRes.data;

        setJob(jobData);
        setProfile(profileData);

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

    if (
      !p.highestQualification ||
      !p.highestQualification
        .toLowerCase()
        .includes(j.reqQualification.toLowerCase())
    ) {
      eligible = false;

      reasons.push(
        `Qualification mismatch. Required: ${j.reqQualification}, Yours: ${
          p.highestQualification || "Not provided"
        }`
      );
    }

    if (String(p.passingYear) !== String(j.reqPassingYear)) {
      eligible = false;

      reasons.push(
        `Passing year mismatch. Required: ${j.reqPassingYear}, Yours: ${
          p.passingYear || "Not provided"
        }`
      );
    }

    if (p.percentage < j.reqMinPercentage) {
      eligible = false;

      reasons.push(
        `Percentage too low. Required: ${j.reqMinPercentage}%, Yours: ${
          p.percentage || 0
        }%`
      );
    }

    if (p.employabilityScore < j.reqEmployabilityScore) {
      eligible = false;

      reasons.push(
        `Employability score too low. Required: ${j.reqEmployabilityScore}, Yours: ${
          p.employabilityScore || 0
        }`
      );
    }

    if (p.backlogs > j.reqMaxBacklogs) {
      eligible = false;

      reasons.push(
        `Too many active backlogs. Allowed: ${j.reqMaxBacklogs}, Yours: ${
          p.backlogs || 0
        }`
      );
    }

    if (p.educationGap > j.reqMaxEducationGap) {
      eligible = false;

      reasons.push(
        `Education gap too large. Allowed: ${j.reqMaxEducationGap} years, Yours: ${
          p.educationGap || 0
        } years`
      );
    }

    setEligibility({
      isEligible: eligible,
      reasons,
    });
  };

  const handleApply = () => {
    alert(
      "Application submitted successfully! HR will contact you soon."
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-blue-600 font-bold text-lg">
          Loading Smart Matching Engine...
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 font-medium text-lg">
            Job not found.
          </p>

          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 mt-4 text-blue-600 font-bold hover:text-blue-800"
          >
            <FiArrowLeft />
            Back to Job Board
          </Link>
        </div>
      </div>
    );
  }

  const isExpired =
    new Date(job.lastDateToApply) < new Date();

  // 1. THIS IS THE NEW ADMIN CHECK
  const isAdmin =
    profile?.role === "admin" ||
    localStorage.getItem("role") === "admin";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Back to Job Board */}
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium text-sm mb-6"
        >
          <FiArrowLeft size={18} />
          Back to Job Board
        </Link>

        {/* 2. MATCHING ENGINE PANEL - NOW HIDDEN IF USER IS ADMIN */}
        {!isAdmin && (
          <div
            className={`rounded-2xl border p-6 mb-6 ${
              eligibility.isEligible
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-start gap-4">
              {eligibility.isEligible ? (
                <FiCheckCircle
                  className="text-green-600 mt-1 flex-shrink-0"
                  size={28}
                />
              ) : (
                <FiXCircle
                  className="text-red-600 mt-1 flex-shrink-0"
                  size={28}
                />
              )}

              <div>
                <h2
                  className={`text-xl font-bold ${
                    eligibility.isEligible
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  {eligibility.isEligible
                    ? "You are Eligible for this Job!"
                    : "You do not meet the eligibility criteria."}
                </h2>

                {!eligibility.isEligible && (
                  <div className="mt-4">
                    <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                      <FiAlertCircle size={18} />
                      Reasons for ineligibility:
                    </h3>

                    <ul className="space-y-2">
                      {eligibility.reasons.map(
                        (reason, index) => (
                          <li
                            key={index}
                            className="text-sm text-red-700 flex items-start gap-2"
                          >
                            <span>•</span>
                            <span>{reason}</span>
                          </li>
                        )
                      )}
                    </ul>

                    <Link
                      to="/profile"
                      className="inline-block mt-4 text-sm font-bold text-blue-600 hover:text-blue-800 underline"
                    >
                      Click here to update your profile if this
                      data is incorrect.
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* JOB DETAILS CARD */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

          {/* Job Header */}
          <div className="p-6 sm:p-8 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded tracking-wider">
                {job.jobId}
              </span>

              {isExpired ? (
                <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded">
                  Closed
                </span>
              ) : (
                <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded">
                  Active
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {job.title}
            </h1>

            <p className="text-gray-600 leading-relaxed">
              {job.companyAbout}
            </p>
          </div>

          {/* Job Information */}
          <div className="p-6 sm:p-8 border-b border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                  Apply Before
                </p>

                <p className="font-bold text-gray-800 flex items-center gap-2">
                  <FiCalendar className="text-blue-500" />
                  {new Date(
                    job.lastDateToApply
                  ).toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                  Location
                </p>

                <p className="font-bold text-gray-800 flex items-center gap-2">
                  <FiMapPin className="text-blue-500" />
                  {job.location}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                  Salary
                </p>

                <p className="font-bold text-gray-800 flex items-center gap-2">
                  <FiDollarSign className="text-green-500" />
                  {job.salary}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                  Process
                </p>

                <p className="font-bold text-gray-800 flex items-center gap-2">
                  <FiBriefcase className="text-purple-500" />
                  {job.hiringProcess}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                  Interview
                </p>

                <p className="font-bold text-gray-800">
                  {job.interviewDate}
                </p>
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div className="p-6 sm:p-8 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Job Description
            </h3>

            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </div>

          {/* Required Skills */}
          <div className="p-6 sm:p-8 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Required Skills
            </h3>

            <div className="flex flex-wrap gap-2">
              {job.reqSkills &&
                job.reqSkills
                  .split(",")
                  .map((skill, i) => (
                    <span
                      key={i}
                      className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium"
                    >
                      {skill.trim()}
                    </span>
                  ))}
            </div>
          </div>

          {/* APPLICATION ACTION - MODIFIED FOR ADMINS */}
          <div className="p-6 sm:p-8 flex justify-end">
            {isAdmin ? (
              <button
                disabled
                className="bg-gray-300 text-gray-600 px-6 py-3 rounded-xl font-bold cursor-not-allowed"
              >
                Admins Cannot Apply for Jobs
              </button>
            ) : isExpired ? (
              <button
                disabled
                className="bg-gray-300 text-gray-600 px-6 py-3 rounded-xl font-bold cursor-not-allowed"
              >
                Job Application Closed
              </button>
            ) : eligibility.isEligible ? (
              <button
                onClick={handleApply}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-sm"
              >
                Apply Now
              </button>
            ) : (
              <button
                disabled
                className="bg-gray-300 text-gray-600 px-8 py-3 rounded-xl font-bold cursor-not-allowed"
              >
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
