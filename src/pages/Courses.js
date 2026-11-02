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
      }
    };
    fetchCourses();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl backdrop-blur-md border border-blue-500/20 shadow-sm">
          <FiBookOpen className="text-blue-600 dark:text-blue-400" size={26} />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Courses</h1>
      </div>
      
      {/* Tabs - Glassmorphism style */}
      <div className="flex gap-4 border-b border-black/5 dark:border-white/5 mb-8 pb-4 overflow-x-auto custom-scrollbar">
        {['All'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 relative ${
              activeTab === tab 
                ? 'bg-white/60 dark:bg-slate-800/60 text-blue-600 dark:text-blue-400 shadow-sm border border-white/50 dark:border-slate-700/50 backdrop-blur-md' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.length === 0 ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 glass-panel p-10 rounded-[2rem] text-center">
            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">No courses found. Go to Admin panel to add one.</p>
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
                className="glass-panel p-2 rounded-[2.5rem] flex flex-col h-full hover:-translate-y-1.5 transition-all duration-300 group"
              >
                {/* Dynamic Thumbnail Background with soft gradient overlay */}
                <div 
                  className="h-52 rounded-[2rem] p-6 flex flex-col justify-end bg-cover bg-center relative overflow-hidden shrink-0 shadow-inner"
                  style={{ backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : 'linear-gradient(to bottom right, #3b82f6, #4f46e5)' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-0"></div>
                  <h3 className="text-2xl font-extrabold text-white z-10 relative leading-tight tracking-tight drop-shadow-md">
                    {course.subjectTitle}
                  </h3>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 line-clamp-2 font-medium leading-relaxed">
                    {course.description}
                  </p>
                  
                  <div className="flex gap-4 text-xs font-bold text-gray-500 dark:text-gray-400 mb-6 mt-auto">
                    <span className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5">
                      <FiBookOpen size={14} className="text-blue-500" /> {totalModules} modules
                    </span>
                    <span className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5">
                      <FiPlayCircle size={14} className="text-purple-500" /> {totalVideos} videos
                    </span>
                  </div>

                  <div className="pt-4 border-t border-black/5 dark:border-white/5 flex justify-end">
                    <Link 
                      to={`/course-player/${course._id}`} 
                      className="glass-button w-12 h-12 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white dark:group-hover:text-white transition-all duration-300 shadow-md"
                    >
                      <FiArrowUpRight size={22} />
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