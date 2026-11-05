import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  FiMapPin,
  FiDollarSign,
  FiBookOpen,
  FiCalendar,
  FiSearch,
  FiClock,
  FiBriefcase,
} from "react-icons/fi";

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState("Technical");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setJobs(res.data))
      .catch((err) => console.error("Error fetching jobs:", err))
      .finally(() => setLoading(false));
  }, []);

  // Filter jobs based on search input
  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.jobId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to check if a job is expired
  const isExpired = (lastDate) => {
    return new Date(lastDate) < new Date();
  };

  if (loading) return <div className="h-[50vh] flex items-center justify-center font-bold text-gray-500 animate-pulse text-lg">Loading jobs...</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8 animate-fade-in pb-12 px-4 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3.5 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl border border-blue-500/20 shadow-sm shrink-0">
          <FiBriefcase className="text-blue-600 dark:text-blue-400" size={28} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Job Board</h1>
          <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mt-1 opacity-90">Find and apply for active opportunities.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 dark:border-slate-700 pb-3 overflow-x-auto custom-scrollbar w-full md:w-auto">
          {["Technical"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl font-extrabold text-[13px] transition-all duration-300 relative whitespace-nowrap shadow-sm border ${
                activeTab === tab
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-gray-200 dark:border-slate-700"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 border-transparent"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Apple-style Search Bar */}
        <div className="relative w-full md:w-96 shrink-0">
          <FiSearch
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by Job Title or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="apple-input pl-11 py-3.5 font-bold text-[15px] shadow-sm"
          />
        </div>
      </div>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <div className="glass-panel text-center py-20 rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <p className="text-gray-500 dark:text-gray-400 font-bold text-xl">
            No active jobs found matching your search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredJobs.map((job) => {
            const expired = isExpired(job.lastDateToApply);

            return (
              <div
                key={job._id}
                className="glass-panel p-6 md:p-8 rounded-[2.5rem] flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300 group shadow-sm hover:shadow-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <div>
                  {/* Job ID and Status */}
                  <div className="flex justify-between items-start gap-4 mb-6">
                    <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 tracking-widest uppercase shadow-sm shrink-0">
                      {job.jobId}
                    </span>

                    <span
                      className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5 uppercase tracking-wider border shadow-sm shrink-0 ${
                        expired
                          ? "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800"
                          : "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
                      }`}
                    >
                      <FiClock size={12} />{" "}
                      {expired ? "Closed" : "Active"}
                    </span>
                  </div>

                  {/* Job Title */}
                  <h3 className="font-extrabold text-2xl text-gray-900 dark:text-white mb-8 tracking-tight leading-tight line-clamp-2" title={job.title}>
                    {job.title}
                  </h3>

                  {/* Job Information Grid */}
                  <div className="grid grid-cols-2 gap-4 text-[13px] mb-8">
                    <div className="bg-gray-50 dark:bg-slate-800/80 p-4 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-extrabold flex items-center gap-1.5 mb-2 uppercase tracking-widest">
                        <FiMapPin className="text-blue-500" size={14} /> Location
                      </p>
                      <p className="font-black text-gray-900 dark:text-white truncate" title={job.location}>
                        {job.location}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-800/80 p-4 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-extrabold flex items-center gap-1.5 mb-2 uppercase tracking-widest">
                        <FiDollarSign className="text-green-500" size={14} /> Salary
                      </p>
                      <p className="font-black text-gray-900 dark:text-white truncate" title={job.salary}>
                        {job.salary}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-800/80 p-4 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-extrabold flex items-center gap-1.5 mb-2 uppercase tracking-widest">
                        <FiBookOpen className="text-purple-500" size={14} /> Qual.
                      </p>
                      <p className="font-black text-gray-900 dark:text-white truncate" title={job.reqQualification}>
                        {job.reqQualification}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-800/80 p-4 rounded-[1.5rem] border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-extrabold flex items-center gap-1.5 mb-2 uppercase tracking-widest">
                        <FiCalendar className="text-orange-500" size={14} /> Batch
                      </p>
                      <p className="font-black text-gray-900 dark:text-white">
                        {job.reqPassingYear}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-6 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center mt-auto">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-0.5">
                      Apply by
                    </span>
                    <strong className="text-[13px] font-black text-gray-900 dark:text-white">
                      {new Date(job.lastDateToApply).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})}
                    </strong>
                  </div>

                  <Link
                    to={`/jobs/${job._id}`}
                    className="glass-button bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-600 hover:text-white border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-6 py-3.5 rounded-xl text-[11px] font-extrabold shadow-sm transition-all uppercase tracking-wider"
                  >
                    Details →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Jobs;