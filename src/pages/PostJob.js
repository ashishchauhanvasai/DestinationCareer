import React, { useState } from 'react';
import './PostJob.css';

const PostJob = () => {
  const [job, setJob] = useState({
    title: '',
    qualification: '',
    description: '',
    link: ''
  });

  const handleChange = (e) => {
    setJob({ ...job, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(job)
    });

    const data = await res.json();
    alert(data.message);
    if (res.ok) setJob({ title: '', qualification: '', description: '', link: '' });
  };

  return (
    <div className="postjob-container">
      <h2>Post a New Job</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="title" placeholder="Job Title" value={job.title} onChange={handleChange} required />
        <input type="text" name="qualification" placeholder="Required Qualification" value={job.qualification} onChange={handleChange} required />
        <textarea name="description" placeholder="Job Description" value={job.description} onChange={handleChange} required />
        <input type="url" name="link" placeholder="Apply Link (URL)" value={job.link} onChange={handleChange} required />
        <button type="submit">Post Job</button>
      </form>
    </div>
  );
};

export default PostJob;
