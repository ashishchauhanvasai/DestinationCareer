import React from 'react';
import { FiInfo, FiUsers, FiTarget, FiAward } from 'react-icons/fi';

const About = () => {
  return (
    <div className="min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden animate-fade-in">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[140px] rounded-full pointer-events-none fixed"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 blur-[140px] rounded-full pointer-events-none fixed"></div>

      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-500/20">
            <FiInfo size={36} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">About Destination Career</h1>
          <p className="text-lg md:text-xl font-medium text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Empowering students with industry-relevant skills and guiding them toward successful technical careers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] shadow-lg border-white/60 hover:-translate-y-1.5 transition-transform duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl shadow-sm border border-purple-500/20">
                <FiTarget size={24} />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Our Mission</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
              To bridge the gap between academic learning and industry expectations by providing comprehensive, hands-on training programs in the latest technologies. We strive to make quality tech education accessible and career-oriented.
            </p>
          </div>

          <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] shadow-lg border-white/60 hover:-translate-y-1.5 transition-transform duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl shadow-sm border border-green-500/20">
                <FiUsers size={24} />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Who We Are</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
              We are a team of experienced industry professionals, educators, and technologists dedicated to mentoring the next generation of software engineers. Our focus is on practical implementation, problem-solving, and continuous learning.
            </p>
          </div>
        </div>

        <div className="glass-panel p-8 md:p-12 rounded-[3rem] shadow-xl border-white/60 text-center">
          <div className="w-16 h-16 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-yellow-500/20">
            <FiAward size={28} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6">Why Choose Us?</h2>
          <div className="grid sm:grid-cols-3 gap-6 text-left">
            <div className="bg-black/5 dark:bg-white/5 p-6 rounded-[1.5rem] shadow-inner border border-black/5 dark:border-white/5">
              <p className="font-extrabold text-gray-900 dark:text-white mb-2 text-lg">Industry Curriculum</p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Courses designed in collaboration with tech experts.</p>
            </div>
            <div className="bg-black/5 dark:bg-white/5 p-6 rounded-[1.5rem] shadow-inner border border-black/5 dark:border-white/5">
              <p className="font-extrabold text-gray-900 dark:text-white mb-2 text-lg">Live Mentorship</p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Direct guidance from trainers via online sessions.</p>
            </div>
            <div className="bg-black/5 dark:bg-white/5 p-6 rounded-[1.5rem] shadow-inner border border-black/5 dark:border-white/5">
              <p className="font-extrabold text-gray-900 dark:text-white mb-2 text-lg">Career Support</p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Mock interviews, resume building, and placement aid.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;