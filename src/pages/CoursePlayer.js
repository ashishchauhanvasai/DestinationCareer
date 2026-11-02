import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { FiPlayCircle, FiBookOpen } from 'react-icons/fi';
import DoubtSection from './DoubtSection';

const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const CoursePlayer = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/courses/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourse(res.data);
        if (res.data.topics?.[0]?.videos?.[0]) {
          setCurrentVideo(res.data.topics[0].videos[0]);
        }
      } catch (err) {
        console.error('Error fetching course data:', err);
      }
    };
    fetchCourse();
  }, [id]);

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="glass-panel p-10 rounded-[2.5rem] flex flex-col items-center gap-4 animate-pulse">
           <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
           <p className="text-lg font-extrabold text-gray-800 dark:text-gray-200">Loading Course Data...</p>
        </div>
      </div>
    );
  }

  const videoId = getYouTubeId(currentVideo?.youtubeUrl);

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-[1600px] mx-auto min-h-[calc(100vh-6rem)] py-6 px-2 sm:px-4 lg:px-8 animate-fade-in">
      
      {/* LEFT AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-12">
        <div className="flex items-center gap-2 mb-5 text-[11px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md px-4 py-2 rounded-xl w-fit shadow-sm border border-white/50 dark:border-slate-700/50">
          <span className="text-blue-600 dark:text-blue-400 opacity-60">Course</span> 
          <span className="opacity-50">/</span>
          {course.subjectTitle}
        </div>

        {/* VIDEO PLAYER */}
        <div className="w-full bg-black rounded-[2rem] aspect-video relative flex items-center justify-center mb-8 overflow-hidden shadow-2xl border-4 border-white/50 dark:border-slate-700/50">
          {videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=0`}
              title="YouTube video player"
              className="absolute top-0 left-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <p className="text-gray-400 font-bold">Select a valid video from the curriculum</p>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight leading-tight">
            {currentVideo?.videoTitle}
          </h2>
        </div>

        {/* TABS */}
        <div className="flex gap-4 border-b border-black/5 dark:border-white/5 mb-6 overflow-x-auto custom-scrollbar pb-2">
          {['Overview'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 relative whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-white/60 dark:bg-slate-800/60 text-blue-600 dark:text-blue-400 shadow-sm border border-white/50 dark:border-slate-700/50 backdrop-blur-md' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Overview' && (
          <div className="glass-panel p-8 rounded-[2rem] shadow-sm border-white/60 mb-8">
            <h3 className="font-extrabold text-xl text-gray-900 dark:text-white mb-4 tracking-tight">
              Video Description
            </h3>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {currentVideo?.description || 'No description provided for this video.'}
            </p>
          </div>
        )}

        {/* DOUBT SECTION */}
        <DoubtSection videoId={videoId} />
      </div>

      {/* RIGHT AREA - CURRICULUM TREE */}
      <div className="w-full lg:w-[400px] shrink-0 glass-panel rounded-[2rem] shadow-lg flex flex-col h-fit lg:h-[calc(100vh-10rem)] border-white/60">
        
        <div className="p-6 md:p-8 border-b border-black/5 dark:border-white/5 bg-white/20 dark:bg-slate-800/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 dark:bg-blue-400/10 rounded-xl border border-blue-500/20 shadow-sm">
              <FiBookOpen className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
            <div>
              <p className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight leading-tight">Course Content</p>
              <p className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">
                {course.topics?.length || 0} Topics
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1 p-4 space-y-4">
          {course.topics?.map((topic, tIdx) => (
            <div key={topic._id || tIdx} className="bg-white/50 dark:bg-slate-800/50 rounded-[1.5rem] border border-white/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
              
              <div className="p-5 flex items-center gap-4 bg-black/5 dark:bg-white/5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center text-xs font-extrabold shrink-0 shadow-sm">
                  {tIdx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-extrabold text-gray-900 dark:text-white leading-snug tracking-tight truncate">{topic.topicName}</p>
                  <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-0.5">
                    {topic.videos?.length || 0} Lessons
                  </p>
                </div>
              </div>

              <div className="py-2 px-2">
                {topic.videos?.map((video, vIdx) => {
                  const isActive = currentVideo?._id === video._id;
                  return (
                    <div
                      key={video._id || vIdx}
                      onClick={() => setCurrentVideo(video)}
                      className={`px-4 py-3.5 mb-1 rounded-xl flex items-center gap-4 cursor-pointer transition-all duration-300 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'hover:bg-white dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <FiPlayCircle className={isActive ? 'text-white' : 'text-blue-500/50'} size={18} />
                      <p className={`text-sm font-bold flex-1 line-clamp-2 leading-snug ${isActive ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {video.videoTitle}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;