import React, { useEffect, useState } from 'react';
import './Career.css';

const Career = () => {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/jobs`)
      .then(res => res.json())
      .then(data => setJobs(data));
  }, []);

  return (
    <div className="career-container">
      <h2>Career Opportunities</h2>
      <div className="job-list">
        {jobs.map(job => (
          <div key={job.id} className="job-card">
            <h3>{job.title}</h3>
            <p><strong>Qualification:</strong> {job.qualification}</p>
            <p><strong>Description:</strong> {job.description}</p>
            <a href={job.link} target="_blank" rel="noreferrer">Apply Now</a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Career;
