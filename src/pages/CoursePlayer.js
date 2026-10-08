import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { FiPlayCircle } from 'react-icons/fi';
import DoubtSection from './DoubtSection';

// Extract YouTube Video ID from different YouTube URL formats
const getYouTubeId = (url) => {
  if (!url) return null;

  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;

  const match = url.match(regExp);

  return match && match[2].length === 11 ? match[2] : null;
};


const CoursePlayer = () => {
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');


  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = localStorage.getItem('token');

        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/courses/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setCourse(res.data);

        // Automatically select first video
        if (res.data.topics?.[0]?.videos?.[0]) {
          setCurrentVideo(res.data.topics[0].videos[0]);
        }

      } catch (err) {
        console.error('Error fetching course data:', err);
      }
    };

    fetchCourse();
  }, [id]);


  // Loading state
  if (!course) {
    return (
      <div className="p-10 text-center font-bold text-gray-500">
        Loading Course Data from Database...
      </div>
    );
  }


  // Get current YouTube video ID
  const videoId = getYouTubeId(currentVideo?.youtubeUrl);


  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-[1400px] mx-auto h-[calc(100vh-6rem)]">

      {/* =========================================================
          LEFT AREA
          Video Player + Description + Doubt Section
          ========================================================= */}

      <div className="flex-1 overflow-y-auto pr-2">

        {/* Course Name */}
        <div className="flex items-center gap-2 mb-4 text-sm font-bold text-gray-800">
          <span className="text-gray-400">&lt;</span>
          {course.subjectTitle}
        </div>


        {/* =====================================================
            VIDEO PLAYER
            ===================================================== */}

        <div className="w-full bg-black rounded-2xl aspect-video relative flex items-center justify-center mb-6 overflow-hidden shadow-lg">

          {videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=0`}
              title="YouTube video player"
              className="absolute top-0 left-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <p className="text-gray-400">
              Select a valid video from the curriculum
            </p>
          )}

        </div>


        {/* =====================================================
            CURRENT VIDEO TITLE
            ===================================================== */}

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {currentVideo?.videoTitle}
          </h2>
        </div>


        {/* =====================================================
            OVERVIEW TAB
            ===================================================== */}

        <div className="border-b mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('Overview')}
            className={`pb-3 text-sm font-bold ${
              activeTab === 'Overview'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-400'
            }`}
          >
            Overview
          </button>
        </div>


        {/* =====================================================
            VIDEO DESCRIPTION
            ===================================================== */}

        {activeTab === 'Overview' && (
          <div className="text-sm text-gray-600 leading-relaxed mb-8">

            <h3 className="font-bold text-gray-900 mb-2">
              Video Description
            </h3>

            <p>
              {currentVideo?.description ||
                'No description provided for this video.'}
            </p>

          </div>
        )}


        {/* =====================================================
            DOUBT & COMMUNITY SECTION
            ===================================================== */}

        <DoubtSection videoId={videoId} />

      </div>


      {/* =========================================================
          RIGHT AREA
          DYNAMIC CURRICULUM TREE
          ========================================================= */}

      <div className="w-full lg:w-96 bg-white rounded-2xl border shadow-sm flex flex-col h-full">

        {/* Course Content Header */}
        <div className="p-4 border-b bg-gray-50 rounded-t-2xl">

          <p className="font-bold text-gray-900">
            Course content
          </p>

          <p className="text-xs text-gray-500">
            {course.topics?.length || 0} Topics
          </p>

        </div>


        {/* Curriculum List */}
        <div className="overflow-y-auto flex-1 p-2">

          {course.topics?.map((topic, tIdx) => (

            <div
              key={topic._id || tIdx}
              className="mb-2 bg-white rounded-xl border border-gray-100 overflow-hidden"
            >

              {/* Topic Header */}
              <div className="p-4 flex items-start gap-3 bg-blue-50">

                <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {tIdx + 1}
                </div>

                <div className="flex-1">

                  <p className="text-sm font-bold text-blue-900">
                    {topic.topicName}
                  </p>

                  <p className="text-xs text-blue-600/70">
                    {topic.videos?.length || 0} lessons
                  </p>

                </div>

              </div>


              {/* Videos */}
              <div className="py-2">

                {topic.videos?.map((video, vIdx) => (

                  <div
                    key={video._id || vIdx}
                    onClick={() => setCurrentVideo(video)}
                    className={`px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors ${
                      currentVideo?._id === video._id
                        ? 'bg-blue-50/50 border-l-4 border-blue-600'
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                  >

                    {/* Play Icon */}
                    <FiPlayCircle
                      className={
                        currentVideo?._id === video._id
                          ? 'text-blue-600 mt-1'
                          : 'text-gray-400 mt-1'
                      }
                      size={16}
                    />


                    {/* Video Name */}
                    <div className="flex-1">

                      <p
                        className={`text-sm ${
                          currentVideo?._id === video._id
                            ? 'font-bold text-blue-700'
                            : 'font-medium text-gray-700'
                        }`}
                      >
                        {video.videoTitle}
                      </p>

                    </div>

                  </div>

                ))}

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
};

export default CoursePlayer;