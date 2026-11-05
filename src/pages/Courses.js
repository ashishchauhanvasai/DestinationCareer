import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiPlayCircle, FiBookOpen } from 'react-icons/fi';

// Helper to extract YouTube ID for the thumbnail
const getYouTubeId = (url) => {
  if (!url) return null;
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return (match && match[2].length === 11) ? match[2] : null;
};

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/courses`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourses(response.data);
      } catch (error) {
        console.error('Error fetching courses!', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (loading) return <div className="h-[50vh] flex items-center justify-center font-bold text-gray-500 animate-pulse text-lg">Loading courses...</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8 animate-fade-in pb-12 px-4 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3.5 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl border border-blue-500/20 shadow-sm shrink-0">
          <FiBookOpen className="text-blue-600 dark:text-blue-400" size={28} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Courses</h1>
          <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mt-1 opacity-90">Browse and continue your learning journey.</p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-slate-700 pb-3 overflow-x-auto custom-scrollbar">
        {['All'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`px-6 py-3 rounded-xl font-extrabold text-[13px] transition-all duration-300 relative whitespace-nowrap shadow-sm border ${
              activeTab === tab 
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-gray-200 dark:border-slate-700' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 border-transparent'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.length === 0 ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 glass-panel p-20 rounded-[2.5rem] text-center shadow-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <p className="text-gray-500 dark:text-gray-400 font-bold text-xl">No courses found. Check back later.</p>
          </div>
        ) : (
          courses.map((course) => {
            const totalVideos = course.topics?.reduce((acc, topic) => acc + (topic.videos?.length || 0), 0) || 0;
            const totalModules = course.topics?.length || 0;
            
            // Get the first video's URL to generate the thumbnail
            const firstVideoUrl = course.topics?.[0]?.videos?.[0]?.youtubeUrl;
            const videoId = getYouTubeId(firstVideoUrl);
            const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

            return (
              <div 
                key={course._id} 
                className="glass-panel p-2 md:p-2.5 rounded-[2.5rem] flex flex-col h-full hover:-translate-y-1.5 transition-all duration-300 group shadow-sm hover:shadow-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 min-h-[360px]"
              >
                {/* Dynamic Thumbnail Background with deep gradient overlay */}
                <div 
                  className="h-56 rounded-[2rem] p-6 flex flex-col justify-end bg-cover bg-center relative overflow-hidden shrink-0 shadow-inner border border-gray-200 dark:border-slate-700"
                  style={{ backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : 'linear-gradient(to bottom right, #3b82f6, #4f46e5)' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent z-0"></div>
                  <h3 className="text-2xl font-black text-white z-10 relative leading-tight tracking-tight drop-shadow-md">
                    {course.subjectTitle}
                  </h3>
                </div>
                
                <div className="p-5 md:p-6 flex-1 flex flex-col">
                  <p className="text-gray-600 dark:text-gray-300 text-[13px] mb-6 line-clamp-2 font-medium leading-relaxed">
                    {course.description}
                  </p>
                  
                  <div className="flex gap-3 text-[11px] font-extrabold text-gray-600 dark:text-gray-300 mb-6 mt-auto uppercase tracking-widest flex-wrap">
                    <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
                      <FiBookOpen size={14} className="text-blue-500" /> {totalModules} modules
                    </span>
                    <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
                      <FiPlayCircle size={14} className="text-purple-500" /> {totalVideos} videos
                    </span>
                  </div>

                  <div className="pt-5 border-t border-gray-200 dark:border-slate-700 flex justify-end">
                    <Link 
                      to={`/course-player/${course._id}`} 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-blue-600 transition-all duration-300 shadow-sm border border-blue-200 dark:border-blue-800 group-hover:border-blue-600"
                    >
                      <FiArrowUpRight size={22} className="transition-transform group-hover:scale-110" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Courses;