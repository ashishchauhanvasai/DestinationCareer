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
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="h-[50vh] flex items-center justify-center font-bold text-gray-500 animate-pulse text-lg">Loading your dashboard...</div>;
  }

  return (
    <div className="max-w-[1600px] mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-12 relative animate-fade-in pb-16">
      <style>{`
        @keyframes scrollVertical {
          0% { transform: translateY(100%); }
          100% { transform: translateY(-120%); }
        }
        .animate-scroll-y { animation: scrollVertical 14s linear infinite; }
        .scroll-container:hover .animate-scroll-y { animation-play-state: paused; }
      `}</style>

      {/* DYNAMIC WELCOME BANNER */}
      <div className="w-full h-56 md:h-[340px] rounded-[2.5rem] p-2 md:p-3 glass-panel overflow-hidden relative shadow-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
        <div className="w-full h-full rounded-[2rem] overflow-hidden relative border border-gray-200 dark:border-slate-700 shadow-inner">
          {banner ? (
            <img 
              src={getDirectImageUrl(banner)} 
              alt="Dashboard Banner" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-8 text-center relative overflow-hidden">
              {/* Decorative shapes for fallback banner */}
              <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-[-20%] left-[-10%] w-72 h-72 bg-indigo-900/30 rounded-full blur-3xl pointer-events-none"></div>
              
              <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight z-10 drop-shadow-md">Welcome back to your learning journey!</h1>
              <p className="opacity-90 font-bold text-lg max-w-2xl z-10 drop-shadow-sm">Pick up right where you left off and conquer your next module.</p>
            </div>
          )}
        </div>
      </div>

      {/* MY JOB APPLICATIONS */}
      <ApplicationsSummary />

      {/* MY LEARNING */}
      <section>
        <div className="flex items-center gap-4 mb-6 md:mb-8">
          <div className="p-3.5 bg-blue-50 dark:bg-blue-900/30 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-sm">
            <FiTrendingUp className="text-blue-600 dark:text-blue-400" size={24} />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            My Learning Progress
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {courses.length === 0 && (
            <div className="col-span-full glass-panel p-16 rounded-[2.5rem] text-center shadow-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <p className="text-gray-500 dark:text-gray-400 font-bold text-lg">No courses currently available.</p>
            </div>
          )}
          {courses.slice(0, 3).map((course) => {
            const totalVideos = course.topics?.reduce((acc, topic) => acc + (topic.videos?.length || 0), 0) || 0;
            // Note: Replace this random generator with real backend progress tracking when available
            const progress = Math.floor(Math.random() * 60) + 10; 

            return (
              <div
                key={course._id}
                className="glass-panel p-6 md:p-8 rounded-[2.5rem] flex flex-col hover:-translate-y-1.5 transition-all duration-300 shadow-sm hover:shadow-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <h3 className="font-black text-xl md:text-2xl mb-2 text-gray-900 dark:text-white tracking-tight leading-tight line-clamp-1 pr-2">
                  {course.subjectTitle}
                </h3>
                <p className="text-[13px] font-extrabold text-gray-500 dark:text-gray-400 mb-8 uppercase tracking-widest bg-gray-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm w-fit">
                  {totalVideos} total lessons
                </p>
                
                <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 mb-3 border border-gray-200 dark:border-slate-700 shadow-inner overflow-hidden mt-auto">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mb-8 uppercase tracking-widest">
                  <span>Progress</span>
                  <span className="text-blue-600 dark:text-blue-400 text-sm">{progress}%</span>
                </div>
                
                <Link
                  to={`/course-player/${course._id}`}
                  className="glass-button w-full block text-center text-blue-600 dark:text-blue-400 font-extrabold py-3.5 rounded-xl border border-gray-300 dark:border-slate-600 shadow-sm hover:bg-blue-600 hover:text-white transition-all text-[15px]"
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
        <div className="flex items-center gap-4 mb-6 md:mb-8">
          <div className="p-3.5 bg-yellow-50 dark:bg-yellow-900/30 rounded-2xl border border-yellow-200 dark:border-yellow-800 shadow-sm">
            <FiAward className="text-yellow-600 dark:text-yellow-500" size={24} />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Top Performers of the Week</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {performers.length === 0 && (
            <div className="col-span-full glass-panel p-16 rounded-[2.5rem] text-center shadow-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <p className="text-gray-500 dark:text-gray-400 font-bold text-lg">Performers will be updated soon.</p>
            </div>
          )}
          
          {performers.map(p => (
            <div 
              key={p._id} 
              className="glass-panel p-2 md:p-2.5 rounded-[2.5rem] flex flex-col h-80 md:h-[340px] group hover:-translate-y-1.5 transition-all duration-300 shadow-sm hover:shadow-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              {/* Image Section */}
              <div className="h-48 md:h-52 w-full rounded-[2rem] relative overflow-hidden bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-inner shrink-0">
                <img 
                  src={getDirectImageUrl(p.imageUrl)} 
                  alt={p.studentName} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out bg-white"
                />
                {/* Floating Category Badge */}
                <div className="absolute top-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-blue-600 dark:text-blue-400 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm border border-gray-200 dark:border-slate-700">
                  {p.category}
                </div>
              </div>

              {/* Details Section */}
              <div className="flex-1 px-4 md:px-5 py-4 flex flex-col justify-center">
                <h3 className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight truncate text-center mb-1">
                  {p.studentName}
                </h3>
                
                <div className="w-full h-px bg-gray-200 dark:bg-slate-700 my-3"></div>
                
                <div className="flex justify-between items-center w-full">
                  <span className="text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-widest text-[10px] flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded border border-gray-200 dark:border-slate-700">
                    <FiStar className="text-yellow-500" size={10} />
                    Achievement
                  </span>
                  <span className="font-black text-green-600 dark:text-green-400 text-[15px]">
                    {p.metric}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WALL OF FAME */}
      <section>
        <div className="flex items-center gap-4 mb-6 md:mb-8">
          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-200 dark:border-indigo-800 shadow-sm">
            <FiStar className="text-indigo-600 dark:text-indigo-400" size={24} />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Alumni Success Stories
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {testimonials.length === 0 && (
            <div className="col-span-full glass-panel p-16 rounded-[2.5rem] text-center shadow-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <p className="text-gray-500 dark:text-gray-400 font-bold text-lg">Testimonials will be updated soon.</p>
            </div>
          )}
          
          {testimonials.map((t) => (
            <div
              key={t._id}
              className="glass-panel p-2.5 rounded-[2.5rem] overflow-hidden flex flex-col h-[34rem] hover:-translate-y-1.5 transition-all duration-300 shadow-sm hover:shadow-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 relative"
            >
              {/* IMAGE SECTION */}
              <div className="h-60 w-full rounded-[2rem] overflow-hidden bg-gray-50 dark:bg-slate-800 relative shrink-0 border border-gray-200 dark:border-slate-700 shadow-inner">
                <img
                  src={getDirectImageUrl(t.imageUrl)}
                  alt={t.studentName}
                  className="w-full h-full object-cover bg-white"
                />
                {/* Floating Role Badge */}
                <div className="absolute bottom-3 left-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-gray-900 dark:text-white text-[11px] font-black px-4 py-2.5 rounded-[1rem] text-center uppercase tracking-widest shadow-sm border border-gray-200 dark:border-slate-700">
                  {t.role ? `${t.role} @ ` : 'Placed @ '}<span className="text-blue-600 dark:text-blue-400">{t.company}</span>
                </div>
              </div>

              {/* DETAILS SECTION */}
              <div className="px-5 py-5 border-b border-gray-200 dark:border-slate-700 relative z-10 shrink-0">
                <div className="text-center mb-4">
                  <h4 className="font-black text-gray-900 dark:text-white text-2xl tracking-tight leading-none">{t.studentName}</h4>
                </div>

                <div className="space-y-2 mt-2 bg-gray-50 dark:bg-slate-800/80 rounded-[1.5rem] p-4 border border-gray-200 dark:border-slate-700 shadow-sm">
                  {t.salaryPackage && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-widest text-[10px]">Package</span>
                      <span className="font-black text-green-600 dark:text-green-400 text-[13px]">
                        {t.salaryPackage.toUpperCase().includes('LPA') ? t.salaryPackage : `${t.salaryPackage} LPA`}
                      </span>
                    </div>
                  )}

                  {(t.education || t.passoutYear) && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-widest text-[10px]">Education</span>
                      <span className="font-extrabold text-gray-900 dark:text-white text-[13px] text-right">
                        {t.education} {t.passoutYear ? `(${t.passoutYear})` : ''}
                      </span>
                    </div>
                  )}

                  {t.collegeName && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-widest text-[10px]">College</span>
                      <span className="font-extrabold text-gray-900 dark:text-white text-[13px] text-right truncate max-w-[140px]" title={t.collegeName}>
                        {t.collegeName}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* MESSAGE SCROLL SECTION */}
              <div className="flex-1 relative overflow-hidden p-6 scroll-container cursor-default bg-white dark:bg-slate-900 rounded-b-[2rem]">
                {/* Solid gradient masks to flawlessly blend text into the solid background */}
                <div className="absolute top-0 left-0 w-full h-10 bg-gradient-to-b from-white dark:from-slate-900 to-transparent z-10 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-white dark:from-slate-900 to-transparent z-10 pointer-events-none"></div>
                
                <div className="animate-scroll-y absolute w-full left-0 px-6 pt-4 pb-12">
                  <div className="text-5xl text-blue-100 dark:text-slate-800 text-center font-serif leading-none h-6 mb-3">
                    "
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-[15px] font-medium italic text-center leading-relaxed px-2">
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