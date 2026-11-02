import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FiTrendingUp, FiAward, FiStar } from "react-icons/fi";
import ApplicationsSummary from "../components/ApplicationsSummary";

// --- GOOGLE DRIVE THUMBNAIL CONVERTER ---
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
  const [banner, setBanner] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      try {
        const [crsRes, testRes, perfRes, bannerRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/courses`, config).catch(() => ({ data: [] })),
          axios.get(`${process.env.REACT_APP_API_URL}/api/testimonials`).catch(() => ({ data: [] })),
          axios.get(`${process.env.REACT_APP_API_URL}/api/performers`, config).catch(() => ({ data: [] })),
          axios.get(`${process.env.REACT_APP_API_URL}/api/banner`).catch(() => ({ data: { imageUrl: '' } }))
        ]);

        setCourses(crsRes.data);
        setTestimonials(testRes.data);
        setPerformers(perfRes.data);
        setBanner(bannerRes.data.imageUrl);
      } catch (error) {
        console.error("Failed to fetch data", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-6 px-2 space-y-12 relative">
      <style>{`
        @keyframes scrollVertical {
          0% { transform: translateY(100%); }
          100% { transform: translateY(-120%); }
        }
        .animate-scroll-y { animation: scrollVertical 12s linear infinite; }
        .scroll-container:hover .animate-scroll-y { animation-play-state: paused; }
      `}</style>

      {/* DYNAMIC WELCOME BANNER (Glass panel wrapper) */}
      <div className="w-full h-56 md:h-72 rounded-[2rem] p-2 glass-panel overflow-hidden relative">
        <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative">
          {banner ? (
            <img 
              src={getDirectImageUrl(banner)} 
              alt="Dashboard Banner" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-600/90 to-indigo-500/90 text-white p-8 text-center backdrop-blur-md">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight">Welcome back to your learning journey!</h1>
              <p className="opacity-90 font-medium text-lg">Pick up right where you left off and conquer your next module.</p>
            </div>
          )}
        </div>
      </div>

      {/* MY JOB APPLICATIONS */}
      <ApplicationsSummary />

      {/* MY LEARNING */}
      <section>
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="p-2.5 bg-blue-600/10 dark:bg-blue-400/10 rounded-xl backdrop-blur-md border border-blue-500/20">
            <FiTrendingUp className="text-blue-600 dark:text-blue-400" size={22} />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            My Learning Progress
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.length === 0 && (
            <p className="text-gray-500 dark:text-slate-400 text-sm font-medium px-2">
              No courses available.
            </p>
          )}
          {courses.slice(0, 3).map((course) => {
            const totalVideos = course.topics?.reduce((acc, topic) => acc + (topic.videos?.length || 0), 0) || 0;
            const progress = Math.floor(Math.random() * 60) + 10;

            return (
              <div
                key={course._id}
                className="glass-panel p-6 rounded-[2rem] flex flex-col hover:-translate-y-1 transition-all duration-300"
              >
                <h3 className="font-extrabold text-xl mb-1 truncate text-gray-900 dark:text-white">
                  {course.subjectTitle}
                </h3>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-6">
                  {totalVideos} total lessons
                </p>
                
                <div className="w-full bg-black/5 dark:bg-white/5 rounded-full h-3 mb-3 border border-black/5 dark:border-white/5 backdrop-blur-sm overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center text-xs font-bold text-gray-500 dark:text-slate-400 mb-6">
                  <span>{progress}% Completed</span>
                </div>
                
                <Link
                  to={`/course-player/${course._id}`}
                  className="glass-button w-full block text-center text-blue-600 dark:text-blue-400 font-extrabold py-3 rounded-xl mt-auto"
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
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="p-2.5 bg-yellow-500/10 rounded-xl backdrop-blur-md border border-yellow-500/20">
            <FiAward className="text-yellow-500" size={22} />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Top Performers of the Week</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {performers.length === 0 ? (
            <p className="text-gray-500 dark:text-slate-400 text-sm font-medium px-2">Performers will be updated soon.</p>
          ) : null}
          
          {performers.map(p => (
            <div 
              key={p._id} 
              className="glass-panel p-2 rounded-[2rem] flex flex-col h-80 group hover:-translate-y-1 transition-all duration-300"
            >
              {/* Image Section */}
              <div className="h-48 w-full rounded-[1.5rem] relative overflow-hidden bg-black/5 dark:bg-white/5">
                <img 
                  src={getDirectImageUrl(p.imageUrl)} 
                  alt={p.studentName} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                {/* Floating Category Badge */}
                <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-blue-600 dark:text-blue-400 text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm border border-white/20 dark:border-slate-700/50">
                  {p.category}
                </div>
              </div>

              {/* Details Section */}
              <div className="flex-1 px-4 py-3 flex flex-col justify-center">
                <h3 className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight truncate text-center">
                  {p.studentName}
                </h3>
                
                <div className="w-full h-px bg-black/5 dark:bg-white/5 my-2.5"></div>
                
                <div className="flex justify-between items-center w-full">
                  <span className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
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
      <section className="pb-12">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="p-2.5 bg-blue-600/10 dark:bg-blue-400/10 rounded-xl backdrop-blur-md border border-blue-500/20">
            <FiStar className="text-blue-600 dark:text-blue-400" size={22} />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Alumni Success Stories
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.length === 0 ? (
            <p className="text-gray-500 dark:text-slate-400 text-sm font-medium px-2 col-span-3">
              Testimonials will be updated soon.
            </p>
          ) : null}
          
          {testimonials.map((t) => (
            <div
              key={t._id}
              className="glass-panel p-2 rounded-[2rem] overflow-hidden flex flex-col h-[32rem] hover:-translate-y-1 transition-all duration-300"
            >
              {/* IMAGE SECTION */}
              <div className="h-56 w-full rounded-[1.5rem] overflow-hidden bg-black/5 dark:bg-white/5 relative shrink-0">
                <img
                  src={getDirectImageUrl(t.imageUrl)}
                  alt={t.studentName}
                  className="w-full h-full object-cover"
                />
                {/* Floating Role Badge */}
                <div className="absolute bottom-3 left-3 right-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-gray-900 dark:text-white text-xs font-extrabold px-4 py-2 rounded-xl text-center uppercase tracking-wide shadow-sm border border-white/40 dark:border-slate-700/50">
                  {t.role ? `${t.role} @ ` : 'Placed @ '}<span className="text-blue-600 dark:text-blue-400">{t.company}</span>
                </div>
              </div>

              {/* DETAILS SECTION */}
              <div className="px-5 py-4 border-b border-black/5 dark:border-white/5 relative z-10 shrink-0">
                <div className="text-center mb-3">
                  <h4 className="font-extrabold text-gray-900 dark:text-white text-xl tracking-tight">{t.studentName}</h4>
                </div>

                <div className="space-y-2 mt-2 bg-black/5 dark:bg-white/5 rounded-xl p-3 border border-black/5 dark:border-white/5">
                  {t.salaryPackage && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px]">Package</span>
                      <span className="font-extrabold text-green-600 dark:text-green-400 text-xs">
                        {t.salaryPackage.toUpperCase().includes('LPA') ? t.salaryPackage : `${t.salaryPackage} LPA`}
                      </span>
                    </div>
                  )}

                  {(t.education || t.passoutYear) && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px]">Education</span>
                      <span className="font-extrabold text-gray-900 dark:text-white text-xs text-right">
                        {t.education} {t.passoutYear ? `(${t.passoutYear})` : ''}
                      </span>
                    </div>
                  )}

                  {t.collegeName && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px]">College</span>
                      <span className="font-extrabold text-gray-900 dark:text-white text-xs text-right truncate max-w-[140px]" title={t.collegeName}>
                        {t.collegeName}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* MESSAGE SCROLL SECTION */}
              <div className="flex-1 relative overflow-hidden p-5 scroll-container cursor-default">
                {/* Soft gradient masks to blend scroll into the glass panel */}
                <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-[rgba(255,255,255,0.6)] dark:from-[rgba(15,23,42,0.6)] to-transparent z-10 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[rgba(255,255,255,0.6)] dark:from-[rgba(15,23,42,0.6)] to-transparent z-10 pointer-events-none"></div>
                
                <div className="animate-scroll-y absolute w-full left-0 px-5">
                  <div className="text-4xl text-blue-400/50 dark:text-slate-600 text-center font-serif leading-none h-6 mb-3">
                    "
                  </div>
                  <p className="text-gray-700 dark:text-slate-300 text-sm font-medium italic text-center leading-relaxed">
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