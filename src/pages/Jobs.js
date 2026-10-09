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
      job.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      job.jobId
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  // Helper function to check if a job is expired
  const isExpired = (lastDate) => {
    return new Date(lastDate) < new Date();
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FiBriefcase className="text-blue-600" /> Job Board
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-6 overflow-x-auto">
        {[
          "Technical"
        ].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 font-medium text-sm transition-colors whitespace-nowrap relative ${
              activeTab === tab
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab}

            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <FiSearch
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={18}
        />

        <input
          type="text"
          placeholder="Search by Job Title or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-md bg-white shadow-sm"
        />
      </div>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 font-medium">
            No active jobs found for this category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => {
            const expired = isExpired(job.lastDateToApply);

            return (
              <div
                key={job._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Job ID and Status */}
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-1 rounded tracking-wider">
                      {job.jobId}
                    </span>

                    <span
                      className={`text-xs font-bold px-2 py-1 rounded flex items-center gap-1 uppercase tracking-wider ${
                        expired
                          ? "text-red-600 bg-red-50"
                          : "text-green-600 bg-green-50"
                      }`}
                    >
                      <FiClock size={12} />{" "}
                      {expired ? "Closed" : "Active"}
                    </span>
                  </div>

                  {/* Job Title */}
                  <h3 className="font-bold text-xl text-gray-900 mb-6 truncate">
                    {job.title}
                  </h3>

                  {/* Job Information */}
                  <div className="grid grid-cols-2 gap-y-6 text-sm mb-6">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mb-1 uppercase tracking-wider">
                        <FiMapPin /> Location
                      </p>

                      <p className="font-bold text-gray-800 truncate">
                        {job.location}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mb-1 uppercase tracking-wider">
                        <FiDollarSign /> Salary
                      </p>

                      <p className="font-bold text-gray-800 truncate">
                        {job.salary}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mb-1 uppercase tracking-wider">
                        <FiBookOpen /> Qualification
                      </p>

                      <p className="font-bold text-gray-800 truncate">
                        {job.reqQualification}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mb-1 uppercase tracking-wider">
                        <FiCalendar /> Passing Year
                      </p>

                      <p className="font-bold text-gray-800">
                        {job.reqPassingYear}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-5 border-t border-gray-100 flex justify-between items-center mt-2">
                  <span className="text-[11px] font-medium text-gray-500">
                    Apply by:{" "}
                    <strong className="text-gray-800">
                      {new Date(
                        job.lastDateToApply
                      ).toLocaleDateString()}
                    </strong>
                  </span>

                  {/* Routes to JobDetails page where the matching engine lives */}
                  <Link
                    to={`/jobs/${job._id}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
                  >
                    Know more →
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