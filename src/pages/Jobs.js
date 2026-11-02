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
      .catch((err) => console.error("Error fetching jobs:", err));
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

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl backdrop-blur-md border border-blue-500/20 shadow-sm">
          <FiBriefcase className="text-blue-600 dark:text-blue-400" size={26} />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Job Board</h1>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        {/* Tabs */}
        <div className="flex gap-4 overflow-x-auto custom-scrollbar">
          {["Technical"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 relative whitespace-nowrap ${
                activeTab === tab
                  ? "bg-white/60 dark:bg-slate-800/60 text-blue-600 dark:text-blue-400 shadow-sm border border-white/50 dark:border-slate-700/50 backdrop-blur-md"
                  : "text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Apple-style Search Bar */}
        <div className="relative w-full md:w-96">
          <FiSearch
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by Job Title or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="apple-input pl-11 shadow-sm"
          />
        </div>
      </div>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <div className="glass-panel text-center py-16 rounded-[2rem]">
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
            No active jobs found for this category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredJobs.map((job) => {
            const expired = isExpired(job.lastDateToApply);

            return (
              <div
                key={job._id}
                className="glass-panel p-8 rounded-[2.5rem] flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 group"
              >
                <div>
                  {/* Job ID and Status */}
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-xs font-extrabold text-blue-700 dark:text-blue-300 bg-blue-500/10 dark:bg-blue-400/10 px-3 py-1.5 rounded-lg border border-blue-500/20 tracking-wider">
                      {job.jobId}
                    </span>

                    <span
                      className={`text-[11px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5 uppercase tracking-wider border ${
                        expired
                          ? "text-red-700 dark:text-red-300 bg-red-500/10 border-red-500/20"
                          : "text-green-700 dark:text-green-300 bg-green-500/10 border-green-500/20"
                      }`}
                    >
                      <FiClock size={12} />{" "}
                      {expired ? "Closed" : "Active"}
                    </span>
                  </div>

                  {/* Job Title */}
                  <h3 className="font-extrabold text-2xl text-gray-900 dark:text-white mb-8 tracking-tight truncate" title={job.title}>
                    {job.title}
                  </h3>

                  {/* Job Information Grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                    <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/10">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold flex items-center gap-1.5 mb-1 uppercase tracking-wider">
                        <FiMapPin className="text-blue-500" /> Location
                      </p>
                      <p className="font-bold text-gray-900 dark:text-white truncate" title={job.location}>
                        {job.location}
                      </p>
                    </div>

                    <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/10">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold flex items-center gap-1.5 mb-1 uppercase tracking-wider">
                        <FiDollarSign className="text-green-500" /> Salary
                      </p>
                      <p className="font-bold text-gray-900 dark:text-white truncate" title={job.salary}>
                        {job.salary}
                      </p>
                    </div>

                    <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/10">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold flex items-center gap-1.5 mb-1 uppercase tracking-wider">
                        <FiBookOpen className="text-purple-500" /> Qual.
                      </p>
                      <p className="font-bold text-gray-900 dark:text-white truncate" title={job.reqQualification}>
                        {job.reqQualification}
                      </p>
                    </div>

                    <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/10">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold flex items-center gap-1.5 mb-1 uppercase tracking-wider">
                        <FiCalendar className="text-orange-500" /> Batch
                      </p>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {job.reqPassingYear}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-6 border-t border-black/5 dark:border-white/5 flex justify-between items-center mt-auto">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Apply by
                    </span>
                    <strong className="text-sm text-gray-900 dark:text-white">
                      {new Date(job.lastDateToApply).toLocaleDateString()}
                    </strong>
                  </div>

                  <Link
                    to={`/jobs/${job._id}`}
                    className="glass-button bg-blue-600/90 hover:bg-blue-600 dark:bg-blue-600 border-none text-white px-6 py-2.5 rounded-xl text-sm font-extrabold shadow-md shadow-blue-500/20"
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