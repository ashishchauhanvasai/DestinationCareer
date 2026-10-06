import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FiTrendingUp, FiAward, FiStar } from "react-icons/fi";

// --- NEW GOOGLE DRIVE THUMBNAIL CONVERTER ---
const getDirectImageUrl = (url) => {
  if (!url) return "https://via.placeholder.com/150";

  // Extract the unique file ID from the Google Drive link
  const gDriveMatch =
    url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    url.match(/id=([a-zA-Z0-9_-]+)/);

  if (gDriveMatch && gDriveMatch[1]) {
    // Uses Google's Thumbnail API which bypasses the 403 block for public files
    return `https://drive.google.com/thumbnail?id=${gDriveMatch[1]}&sz=w800`;
  }

  return url;
};

const Dashboard = () => {
  const [courses, setCourses] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [performers, setPerformers] = useState([]);
  const [banner, setBanner] = useState(''); // NEW STATE

  // useEffect(() => {
  //   const fetchData = async () => {
  //     const token = localStorage.getItem("token");
  //     const config = { headers: { Authorization: `Bearer ${token}` } };

  //     const [crsRes, testRes, perfRes] = await Promise.all([
  //       axios
  //         .get("http://localhost:5000/api/courses", config)
  //         .catch(() => ({ data: [] })),
  //       axios
  //         .get("http://localhost:5000/api/testimonials")
  //         .catch(() => ({ data: [] })),
  //       axios
  //         .get("http://localhost:5000/api/performers")
  //         .catch(() => ({ data: [] })),
  //     ]);
  //     setCourses(crsRes.data);
  //     setTestimonials(testRes.data);
  //     setPerformers(perfRes.data);
  //   };
  //   fetchData();
  // }, []);
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      try {
        const [crsRes, testRes, perfRes, bannerRes] = await Promise.all([
          axios.get('http://localhost:5000/api/courses', config).catch(() => ({ data: [] })),
          axios.get('http://localhost:5000/api/testimonials').catch(() => ({ data: [] })),
          axios.get('http://localhost:5000/api/performers').catch(() => ({ data: [] })),
          axios.get('http://localhost:5000/api/banner').catch(() => ({ data: { imageUrl: '' } })) // NEW FETCH
        ]);

        setCourses(crsRes.data);
        setTestimonials(testRes.data);
        setPerformers(perfRes.data);
        setBanner(bannerRes.data.imageUrl); // SET BANNER
      } catch (error) {
        console.error("Failed to fetch data", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-4 space-y-10 relative">
      <style>{`
        @keyframes scrollVertical {
          0% { transform: translateY(100%); }
          100% { transform: translateY(-120%); }
        }
        .animate-scroll-y { animation: scrollVertical 12s linear infinite; }
        .scroll-container:hover .animate-scroll-y { animation-play-state: paused; }
      `}</style>

      {/* Welcome Banner */}
      {/* DYNAMIC WELCOME BANNER */}
      <div className="w-full h-48 md:h-64 rounded-2xl overflow-hidden shadow-md relative bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
        {banner ? (
          <img 
            src={getDirectImageUrl(banner)} 
            alt="Dashboard Banner" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-r from-blue-700 to-blue-500 text-white p-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Welcome back to your learning journey!</h1>
            <p className="opacity-90">Pick up right where you left off and conquer your next module.</p>
          </div>
        )}
      </div>

      {/* MY LEARNING */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <FiTrendingUp
            className="text-blue-600 dark:text-blue-400"
            size={24}
          />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Learning Progress
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.length === 0 && (
            <p className="text-gray-500 dark:text-slate-400 text-sm">
              No courses available.
            </p>
          )}
          {courses.slice(0, 3).map((course) => {
            const totalVideos =
              course.topics?.reduce(
                (acc, topic) => acc + (topic.videos?.length || 0),
                0,
              ) || 0;
            const progress = Math.floor(Math.random() * 60) + 10;

            return (
              <div
                key={course._id}
                className="bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 p-5 shadow-sm hover:shadow transition-shadow"
              >
                <h3 className="font-bold text-lg mb-1 truncate dark:text-white">
                  {course.subjectTitle}
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
                  {totalVideos} total lessons
                </p>
                <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2.5 mb-2">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-gray-500 dark:text-slate-400 mb-4">
                  <span>{progress}% Completed</span>
                </div>
                <Link
                  to={`/course-player/${course._id}`}
                  className="w-full block text-center bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors"
                >
                  Resume Course
                </Link>
              </div>
            );
          })}
        </div>
      </section>

    {/* TOP PERFORMERS */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <FiAward className="text-yellow-500" size={24} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Top Performers of the Week</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {performers.length === 0 ? (
            <p className="text-gray-500 dark:text-slate-400 text-sm">Performers will be updated soon.</p>
          ) : null}
          
          {performers.map(p => (
            <div 
              key={p._id} 
              className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-80 relative group"
            >
              {/* Book Cover Image Section */}
              <div className="h-48 w-full bg-gray-200 dark:bg-slate-700 relative overflow-hidden">
                <img 
                  src={getDirectImageUrl(p.imageUrl)} 
                  alt={p.studentName} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Floating Category Badge */}
                <div className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                  {p.category}
                </div>
              </div>

              {/* Bold Details Section */}
              <div className="flex-1 px-5 py-4 flex flex-col justify-center bg-white dark:bg-slate-800 transition-colors">
                
                <h3 className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight truncate text-center">
                  {p.studentName}
                </h3>
                
                <div className="w-full h-px bg-gray-100 dark:bg-slate-700 my-3"></div>
                
                <div className="flex justify-between items-center w-full">
                  <span className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <FiStar className="text-yellow-500" size={12} />
                    Achievement
                  </span>
                  <span className="font-extrabold text-green-600 dark:text-green-400 text-sm">
                    {p.metric}
                  </span>
                </div>
                
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WALL OF FAME */}
      <section className="pb-10">
        <div className="flex items-center gap-2 mb-6">
          <FiStar className="text-blue-600 dark:text-blue-400" size={24} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Alumni Success Stories
          </h2>
        </div>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.length === 0 ? (
            <p className="text-gray-500 dark:text-slate-400 text-sm col-span-4">
              Testimonials will be updated soon.
            </p>
          ) : null}
          
          {testimonials.map((t) => (
            <div
              key={t._id}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col h-[32rem]"
            >
              
              {/* IMAGE SECTION */}
              <div className="h-56 w-full bg-gray-200 dark:bg-slate-700">
                <img
                  src={getDirectImageUrl(t.imageUrl)}
                  alt={t.studentName}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* PROFESSIONAL DETAILS SECTION */}
              <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700 relative bg-white dark:bg-slate-800 z-10 shadow-sm transition-colors flex flex-col justify-center">
                
                {/* Header: Name and Role */}
                <div className="text-center mb-4">
                  <h4 className="font-extrabold text-gray-900 dark:text-white text-xl tracking-tight">{t.studentName}</h4>
                  <span className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-extrabold px-4 py-1.5 rounded-full mt-2 uppercase tracking-wide shadow-sm">
                    {t.role ? `${t.role} @ ` : 'Placed @ '}{t.company}
                  </span>
                </div>

                {/* Divider Line */}
                <div className="w-full h-px bg-gray-200 dark:bg-slate-600 my-3"></div>

                {/* Structured Details Grid - BOLDER & CLEARER */}
                <div className="space-y-3 mt-2">
                  
                  {t.salaryPackage && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-xs">Package</span>
                      <span className="font-extrabold text-green-600 dark:text-green-400 text-sm">
                        {t.salaryPackage.toUpperCase().includes('LPA') ? t.salaryPackage : `${t.salaryPackage} LPA`}
                      </span>
                    </div>
                  )}

                  {(t.education || t.passoutYear) && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-xs">Education</span>
                      <span className="font-extrabold text-gray-900 dark:text-white text-sm text-right">
                        {t.education} {t.passoutYear ? `(${t.passoutYear})` : ''}
                      </span>
                    </div>
                  )}

                  {t.collegeName && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-xs">College</span>
                      <span className="font-extrabold text-gray-900 dark:text-white text-sm text-right truncate max-w-[150px]" title={t.collegeName}>
                        {t.collegeName}
                      </span>
                    </div>
                  )}
                  
                </div>
              </div>

              {/* MESSAGE SCROLL SECTION */}
              <div className="flex-1 relative overflow-hidden bg-gray-50 dark:bg-slate-900 p-5 scroll-container cursor-default transition-colors">
                <div className="absolute top-0 left-0 w-full h-6 bg-gradient-to-b from-gray-50 to-transparent dark:from-slate-900 z-10"></div>
                <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-t from-gray-50 to-transparent dark:from-slate-900 z-10"></div>
                <div className="animate-scroll-y absolute w-full left-0 px-5">
                  <div className="text-4xl text-blue-300 dark:text-slate-600 text-center font-serif leading-none h-6 mb-3">
                    "
                  </div>
                  <p className="text-gray-700 dark:text-slate-300 text-[15px] font-medium italic text-center leading-relaxed">
                    {t.message}
                  </p>
                </div>
              </div>
              
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
