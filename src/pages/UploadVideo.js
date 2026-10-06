import React, { useState } from 'react';
import axios from 'axios';

const UploadVideo = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [video, setVideo] = useState(null);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('video', video);

    try {
      const token = localStorage.getItem('token'); // Or however you store it
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/upload-video`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      setMessage(res.data.message);
    } catch (err) {
      setMessage('Error uploading video');
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Upload Video Course</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Title" onChange={e => setTitle(e.target.value)} required />
        <input type="text" placeholder="Description" onChange={e => setDescription(e.target.value)} required />
        <input type="file" onChange={e => setVideo(e.target.files[0])} required />
        <button type="submit">Upload</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default UploadVideo;
