import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPlus, FiSave, FiBookOpen, FiVideo, FiTrash2, FiX } from 'react-icons/fi';

const emptyVideo = () => ({ videoTitle: '', description: '', youtubeUrl: '' });
const emptyTopic = () => ({ topicName: '', videos: [emptyVideo()] });
const emptyCourse = () => ({ subjectTitle: '', description: '', topics: [emptyTopic()] });

const labelCls = "block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 pl-1";
const inputCls = "apple-input";

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
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto py-8 space-y-8 animate-fade-in pb-16">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl border border-blue-500/20 shadow-sm shrink-0">
            <FiBookOpen className="text-blue-600 dark:text-blue-400" size={28} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
              {isEditMode ? 'Edit Curriculum' : 'Curriculum Builder'}
            </h1>
            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mt-1 opacity-90">Design your course structure and add video modules.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 mt-2 md:mt-0">
          {isEditMode && (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="glass-button px-6 py-3.5 rounded-xl font-extrabold text-gray-700 dark:text-gray-300 transition-all text-[15px] border border-gray-300 dark:border-slate-600 w-full sm:w-auto text-center"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3.5 rounded-xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:scale-[0.98] transition-transform text-[15px] w-full sm:w-auto"
          >
            <FiSave size={18} /> {isEditMode ? 'Update Changes' : 'Save Curriculum'}
          </button>
        </div>
      </div>

      {/* SUBJECT DETAILS */}
      <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] shadow-sm">
        <h2 className="font-extrabold text-2xl text-gray-900 dark:text-white tracking-tight mb-6 border-b border-gray-200 dark:border-slate-700 pb-5">Subject Details</h2>
        <div className="space-y-6">
          <div>
            <label className={labelCls}>Subject Title</label>
            <input type="text" name="subjectTitle" value={course.subjectTitle} onChange={handleSubjectChange} placeholder="e.g. Advanced Java" className={`${inputCls} font-extrabold text-[15px]`} required />
          </div>
          <div>
            <label className={labelCls}>Course Description</label>
            <textarea name="description" value={course.description} onChange={handleSubjectChange} placeholder="What will students learn?" className={`${inputCls} resize-none h-32 leading-relaxed`} required />
          </div>
        </div>
      </div>

      {/* TOPICS & VIDEOS */}
      {course.topics.map((topic, tIndex) => (
        <div key={topic._id || tIndex} className="glass-panel p-6 md:p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden">
          {/* Blue decorative left border */}
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-500 shadow-[2px_0_10px_rgba(59,130,246,0.5)]"></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-200 dark:border-slate-700 pb-5 pl-3">
            <h2 className="font-extrabold text-2xl text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
               <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-lg text-sm uppercase tracking-wider shadow-sm">Module {tIndex + 1}</span>
            </h2>
            <button onClick={() => removeTopic(tIndex)} type="button" className="w-full sm:w-auto text-xs font-extrabold text-red-600 dark:text-red-400 hover:text-white bg-red-50 dark:bg-red-900/30 hover:bg-red-500 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800 transition-all uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 shrink-0">
              <FiTrash2 size={16} /> Remove Topic
            </button>
          </div>
          
          <div className="mb-8 pl-3">
            <label className={labelCls}>Topic Name</label>
            <input type="text" value={topic.topicName} onChange={(e) => updateTopic(tIndex, e.target.value)} placeholder="e.g. Object Oriented Programming" className={`${inputCls} font-extrabold text-[15px]`} required />
          </div>
          
          <div className="pl-4 md:pl-8 border-l-2 border-gray-200 dark:border-slate-700 space-y-6">
            {topic.videos.map((video, vIndex) => (
              <div key={video._id || vIndex} className="bg-gray-50 dark:bg-slate-800 p-6 md:p-8 rounded-[2rem] border border-gray-200 dark:border-slate-700 shadow-sm relative hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[11px] font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-widest flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-[10px] shadow-sm text-blue-600 dark:text-blue-400">
                      <FiVideo size={16} />
                    </div> 
                    Video {vIndex + 1}
                  </span>
                  <button onClick={() => removeVideo(tIndex, vIndex)} type="button" className="text-gray-400 hover:text-red-500 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 p-2.5 rounded-full transition-colors shadow-sm" title="Remove Video">
                    <FiX size={18} />
                  </button>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Video Title</label>
                    <input type="text" value={video.videoTitle} onChange={(e) => updateVideo(tIndex, vIndex, 'videoTitle', e.target.value)} placeholder="e.g. Introduction to Classes" className={inputCls} required />
                  </div>
                  <div>
                    <label className={labelCls}>YouTube Unlisted Link</label>
                    <input type="url" value={video.youtubeUrl} onChange={(e) => updateVideo(tIndex, vIndex, 'youtubeUrl', e.target.value)} placeholder="https://youtube.com/..." className={`${inputCls} font-mono`} required />
                  </div>
                  <div>
                    <label className={labelCls}>Short Description (Optional)</label>
                    <textarea value={video.description} onChange={(e) => updateVideo(tIndex, vIndex, 'description', e.target.value)} placeholder="What is covered in this video?" className={`${inputCls} resize-none`} rows="2" />
                  </div>
                </div>
              </div>
            ))}
            
            <button type="button" onClick={() => addVideo(tIndex)} className="text-[13px] font-extrabold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2 hover:opacity-80 transition-opacity bg-blue-50 dark:bg-blue-900/30 px-6 py-3.5 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm w-full md:w-fit mt-4">
              <FiPlus size={16} /> Add Video to Topic
            </button>
          </div>
        </div>
      ))}

      <button type="button" onClick={addTopic} className="w-full py-10 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-[2.5rem] text-gray-600 dark:text-gray-400 font-extrabold text-xl flex flex-col md:flex-row items-center justify-center gap-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:border-blue-300 dark:hover:border-blue-700 transition-colors shadow-sm group">
        <div className="p-3 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-500 transition-colors shadow-sm"><FiPlus size={28} /></div> 
        Add New Topic Module
      </button>
    </form>
  );
};

export default AddCourse;