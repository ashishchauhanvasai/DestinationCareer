import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPlus, FiSave, FiBookOpen, FiVideo, FiTrash2 } from 'react-icons/fi';

const emptyVideo = () => ({ videoTitle: '', description: '', youtubeUrl: '' });
const emptyTopic = () => ({ topicName: '', videos: [emptyVideo()] });
const emptyCourse = () => ({ subjectTitle: '', description: '', topics: [emptyTopic()] });

const AddCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [course, setCourse] = useState(emptyCourse());

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

  const removeVideo = (topicIndex, videoIndex) => {
    if (!window.confirm('Remove this video?')) return;
    const newTopics = course.topics.map((t, i) =>
      i === topicIndex ? { ...t, videos: t.videos.filter((_, j) => j !== videoIndex) } : t
    );
    setCourse({ ...course, topics: newTopics });
  };

  const removeTopic = (topicIndex) => {
    if (!window.confirm('Remove this entire topic and all its videos?')) return;
    setCourse({ ...course, topics: course.topics.filter((_, i) => i !== topicIndex) });
  };

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
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto py-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl backdrop-blur-md border border-blue-500/20 shadow-sm">
            <FiBookOpen className="text-blue-600 dark:text-blue-400" size={26} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {isEditMode ? 'Edit Curriculum' : 'Curriculum Builder'}
            </h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Design your course structure and add video modules.</p>
          </div>
        </div>
        <div className="flex gap-3 shrink-0">
          {isEditMode && (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="glass-button px-6 py-3 rounded-xl font-extrabold text-gray-700 dark:text-gray-300 transition-all text-[15px]"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3 rounded-xl font-extrabold flex items-center gap-2 shadow-lg shadow-blue-500/30 hover:scale-[0.98] transition-all text-[15px]"
          >
            <FiSave size={18} /> {isEditMode ? 'Update Changes' : 'Save Curriculum'}
          </button>
        </div>
      </div>

      <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] shadow-lg border-white/60">
        <h2 className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight mb-6">1. Subject Details</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Subject Title</label>
            <input type="text" name="subjectTitle" value={course.subjectTitle} onChange={handleSubjectChange} placeholder="e.g. Advanced Java" className="apple-input font-bold text-lg" required />
          </div>
          <div>
            <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Course Description</label>
            <textarea name="description" value={course.description} onChange={handleSubjectChange} placeholder="What will students learn?" className="apple-input resize-none h-32" required />
          </div>
        </div>
      </div>

      {course.topics.map((topic, tIndex) => (
        <div key={topic._id || tIndex} className="glass-panel p-8 md:p-10 rounded-[2.5rem] shadow-md border-l-8 border-l-blue-500 relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-extrabold text-xl text-blue-600 dark:text-blue-400 tracking-tight flex items-center gap-2">
               <span className="bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-lg text-sm">Topic {tIndex + 1}</span>
            </h2>
            <button onClick={() => removeTopic(tIndex)} type="button" className="text-xs font-extrabold text-red-500 hover:text-red-700 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 transition-colors uppercase tracking-wider shadow-sm flex items-center gap-1.5">
              <FiTrash2 size={14} /> Remove Topic
            </button>
          </div>
          
          <div className="mb-8">
            <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Topic Name</label>
            <input type="text" value={topic.topicName} onChange={(e) => updateTopic(tIndex, e.target.value)} placeholder="e.g. Object Oriented Programming" className="apple-input font-bold" required />
          </div>
          
          <div className="pl-2 md:pl-6 border-l-2 border-black/5 dark:border-white/10 space-y-6">
            {topic.videos.map((video, vIndex) => (
              <div key={video._id || vIndex} className="bg-black/5 dark:bg-white/5 p-6 rounded-[1.5rem] border border-black/5 dark:border-white/5 shadow-inner relative">
                <div className="flex justify-between items-center mb-5">
                  <span className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="p-1.5 bg-gray-200 dark:bg-slate-700 rounded-lg"><FiVideo size={14} /></div> Video {vIndex + 1}
                  </span>
                  <button onClick={() => removeVideo(tIndex, vIndex)} type="button" className="text-red-500 hover:text-red-600 bg-red-500/10 p-2 rounded-lg transition-colors" title="Remove Video">
                    <FiTrash2 size={16} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <input type="text" value={video.videoTitle} onChange={(e) => updateVideo(tIndex, vIndex, 'videoTitle', e.target.value)} placeholder="Video Title" className="apple-input" required />
                  <input type="url" value={video.youtubeUrl} onChange={(e) => updateVideo(tIndex, vIndex, 'youtubeUrl', e.target.value)} placeholder="YouTube Unlisted Link" className="apple-input font-mono text-xs" required />
                  <textarea value={video.description} onChange={(e) => updateVideo(tIndex, vIndex, 'description', e.target.value)} placeholder="Video Description" className="apple-input resize-none" rows="2" />
                </div>
              </div>
            ))}
            
            <button type="button" onClick={() => addVideo(tIndex)} className="text-[13px] font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-2 hover:opacity-70 transition-opacity bg-blue-500/10 px-4 py-2.5 rounded-xl border border-blue-500/20 shadow-sm w-fit">
              <FiPlus size={16} /> Add Video to Topic
            </button>
          </div>
        </div>
      ))}

      <button type="button" onClick={addTopic} className="w-full py-8 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-[2rem] text-gray-500 dark:text-gray-400 font-extrabold text-lg flex items-center justify-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
        <div className="p-2 bg-gray-200 dark:bg-slate-700 rounded-full"><FiPlus size={24} /></div> Add New Topic Module
      </button>
    </form>
  );
};

export default AddCourse;