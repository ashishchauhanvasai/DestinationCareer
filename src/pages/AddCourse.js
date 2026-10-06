  import React, { useState, useEffect } from 'react';
  import axios from 'axios';
  import { useParams, useNavigate } from 'react-router-dom';
  import { FiPlus, FiSave } from 'react-icons/fi';

  const emptyVideo = () => ({ videoTitle: '', description: '', youtubeUrl: '' });
  const emptyTopic = () => ({ topicName: '', videos: [emptyVideo()] });
  const emptyCourse = () => ({ subjectTitle: '', description: '', topics: [emptyTopic()] });

  const AddCourse = () => {
    const { id } = useParams(); // Catches the ID if we are in Edit Mode
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    const [course, setCourse] = useState(emptyCourse());

    // If in Edit Mode, fetch the existing data and populate the form
    useEffect(() => {
      if (isEditMode) {
        const fetchCourseData = async () => {
          try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/courses/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const data = res.data;
            setCourse({
              ...data,
              topics: (data.topics || []).map((t) => ({
                ...t,
                videos: t.videos || []
              }))
            });
          } catch (err) {
            console.error('Error fetching course for edit', err);
            alert('Could not load course data');
          }
        };
        fetchCourseData();
      }
    }, [id, isEditMode]);

    const handleSubjectChange = (e) => {
      setCourse({ ...course, [e.target.name]: e.target.value });
    };

    const addTopic = () => {
      setCourse({ ...course, topics: [...course.topics, emptyTopic()] });
    };

    // Add a new video to an existing (or new) topic
    const addVideo = (topicIndex) => {
      const newTopics = course.topics.map((t, i) =>
        i === topicIndex ? { ...t, videos: [...t.videos, emptyVideo()] } : t
      );
      setCourse({ ...course, topics: newTopics });
    };

    const updateVideo = (topicIndex, videoIndex, field, value) => {
      const newTopics = course.topics.map((t, i) =>
        i !== topicIndex
          ? t
          : {
              ...t,
              videos: t.videos.map((v, j) => (j === videoIndex ? { ...v, [field]: value } : v))
            }
      );
      setCourse({ ...course, topics: newTopics });
    };

    const updateTopic = (topicIndex, value) => {
      const newTopics = course.topics.map((t, i) =>
        i === topicIndex ? { ...t, topicName: value } : t
      );
      setCourse({ ...course, topics: newTopics });
    };

    // Delete a specific video from a topic
    const removeVideo = (topicIndex, videoIndex) => {
      if (!window.confirm('Remove this video?')) return;
      const newTopics = course.topics.map((t, i) =>
        i === topicIndex ? { ...t, videos: t.videos.filter((_, j) => j !== videoIndex) } : t
      );
      setCourse({ ...course, topics: newTopics });
    };

    // Delete a whole topic
    const removeTopic = (topicIndex) => {
      if (!window.confirm('Remove this entire topic and all its videos?')) return;
      setCourse({ ...course, topics: course.topics.filter((_, i) => i !== topicIndex) });
    };

    // Save or Update Database
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const token = localStorage.getItem('token');

        if (isEditMode) {
          await axios.put(`${process.env.REACT_APP_API_URL}/api/courses/${id}`, course, {
            headers: { Authorization: `Bearer ${token}` }
          });
          alert('Curriculum Updated successfully!');
          navigate('/admin');
        } else {
          await axios.post(`${process.env.REACT_APP_API_URL}/api/courses`, course, {
            headers: { Authorization: `Bearer ${token}` }
          });
          alert('New Curriculum Saved successfully!');
          setCourse(emptyCourse());
        }
      } catch (err) {
        alert('Failed to save course.');
      }
    };

    return (
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Edit Curriculum' : 'Curriculum Builder'}
          </h1>
          <div className="flex gap-3">
            {isEditMode && (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="px-6 py-2 rounded-lg font-bold border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"
            >
              <FiSave /> {isEditMode ? 'Update Changes' : 'Save Curriculum to DB'}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border mb-8">
          <h2 className="font-bold text-lg mb-4">1. Subject Details</h2>
          <input type="text" name="subjectTitle" value={course.subjectTitle} onChange={handleSubjectChange} placeholder="Subject Title (e.g. Advanced Java)" className="w-full p-3 border rounded-lg mb-4 bg-gray-50 font-bold text-lg" required />
          <textarea name="description" value={course.description} onChange={handleSubjectChange} placeholder="Subject Description" className="w-full p-3 border rounded-lg bg-gray-50" required />
        </div>

        {course.topics.map((topic, tIndex) => (
          <div key={topic._id || tIndex} className="bg-white p-6 rounded-2xl shadow-sm border mb-6 border-l-4 border-l-blue-500 relative">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-md text-blue-800">Topic {tIndex + 1}</h2>
              <button onClick={() => removeTopic(tIndex)} type="button" className="text-xs text-red-500 hover:underline">Remove Topic</button>
            </div>
            <input type="text" value={topic.topicName} onChange={(e) => updateTopic(tIndex, e.target.value)} placeholder="Topic Name" className="w-full p-3 border rounded-lg mb-6 bg-blue-50/50 font-bold" required />
            <div className="pl-6 border-l-2 border-gray-200 space-y-4">
              {topic.videos.map((video, vIndex) => (
                <div key={video._id || vIndex} className="bg-gray-50 p-4 rounded-xl border relative">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Video {vIndex + 1}</span>
                    <button onClick={() => removeVideo(tIndex, vIndex)} type="button" className="text-xs text-red-500 hover:underline">Remove Video</button>
                  </div>
                  <input type="text" value={video.videoTitle} onChange={(e) => updateVideo(tIndex, vIndex, 'videoTitle', e.target.value)} placeholder="Video Title" className="w-full p-2 border rounded mb-2 text-sm" required />
                  <input type="url" value={video.youtubeUrl} onChange={(e) => updateVideo(tIndex, vIndex, 'youtubeUrl', e.target.value)} placeholder="YouTube Unlisted Link" className="w-full p-2 border rounded mb-2 text-sm" required />
                  <textarea value={video.description} onChange={(e) => updateVideo(tIndex, vIndex, 'description', e.target.value)} placeholder="Video Description" className="w-full p-2 border rounded text-sm" rows="2" />
                </div>
              ))}
              <button type="button" onClick={() => addVideo(tIndex)} className="text-sm font-bold text-blue-600 flex items-center gap-1 hover:underline">
                <FiPlus /> Add another video to this topic
              </button>
            </div>
          </div>
        ))}

        <button type="button" onClick={addTopic} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
          <FiPlus size={20} /> Add New Topic Module
        </button>
      </form>
    );
  };

  export default AddCourse;