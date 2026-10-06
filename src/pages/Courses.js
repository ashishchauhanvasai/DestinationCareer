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
        const response = await axios.get('http://localhost:5000/api/courses', {
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
    <div className="max-w-7xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Courses</h1>
      
      <div className="flex gap-6 border-b border-gray-200 mb-8">
        {['All'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === tab ? 'text-blue-600' : 'text-gray-500'}`}>
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.length === 0 ? (
          <p className="text-gray-500 col-span-3">No courses found. Go to Admin panel to add one.</p>
        ) : (
          courses.map((course) => {
            const totalVideos = course.topics?.reduce((acc, topic) => acc + (topic.videos?.length || 0), 0) || 0;
            const totalModules = course.topics?.length || 0;
            
            // Get the first video's URL to generate the thumbnail
            const firstVideoUrl = course.topics?.[0]?.videos?.[0]?.youtubeUrl;
            const videoId = getYouTubeId(firstVideoUrl);
            const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

            return (
              <div key={course._id} className="bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  {/* Dynamic Thumbnail Background */}
                  <div 
                    className="h-40 p-6 flex justify-between items-start bg-cover bg-center relative"
                    style={{ backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : 'linear-gradient(to bottom right, #1e3a8a, #2563eb)' }}
                  >
                    {/* Dark overlay to make text readable over the image */}
                    <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                    <h3 className="text-xl font-bold text-white z-10 relative">{course.subjectTitle}</h3>
                  </div>
                  
                  <div className="p-6">
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                    <div className="flex gap-4 text-xs text-gray-500 mb-6">
                      <span className="flex items-center gap-1"><FiBookOpen/> {totalModules} modules</span>
                      <span className="flex items-center gap-1"><FiPlayCircle/> {totalVideos} videos</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 pt-0 flex justify-end mt-auto">
                  <Link 
                    to={`/course-player/${course._id}`} 
                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <FiArrowUpRight size={20} />
                  </Link>
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