import React from 'react';
import './Home.css';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCode, FiPenTool, FiDatabase, FiTerminal } from 'react-icons/fi';

const Home = () => {
  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-slate-900 pb-12 overflow-hidden relative">
      {/* Light Color Lifter Gradient Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pt-8 relative z-10 animate-fade-in">
        {/* Hero Slider Section (Upgraded to Glassmorphism) */}
        <div className="glass-panel rounded-[3rem] overflow-hidden shadow-2xl border-white/60 relative flex flex-col md:flex-row items-center min-h-[450px]">
          <div className="absolute inset-0 z-0">
            <img
              src="https://blogassets.leverageedu.com/blog/wp-content/uploads/2020/03/24185535/Online-Learning-800x500.jpg"
              alt="Learn Online"
              className="w-full h-full object-cover opacity-20 dark:opacity-10"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/70 to-transparent dark:from-slate-900/90 dark:via-slate-900/70"></div>
          </div>

          <div className="relative z-10 p-10 md:p-16 md:w-2/3 space-y-6">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl shadow-sm inline-block">
              Destination Career
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
              Welcome to E-learning
            </h1>
            <p className="text-lg md:text-xl font-medium text-gray-600 dark:text-gray-300 max-w-lg leading-relaxed">
              The premier online platform to master new technical skills, practice coding, and launch your career.
            </p>
            <div className="pt-4">
              <Link to="/courses" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-4 rounded-xl font-extrabold text-lg shadow-lg shadow-blue-500/30 hover:scale-[0.98] transition-all w-full sm:w-auto">
                Explore Courses <FiArrowRight />
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Posters Section */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Popular Categories</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Choose your domain and start learning today.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Web Development',
                icon: FiCode,
                img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=compress&cs=tinysrgb&w=800'
              },
              {
                title: 'UI/UX Design',
                icon: FiPenTool,
                img: 'https://img.freepik.com/free-photo/representations-user-experience-interface-design_23-2150104516.jpg?t=st=1746643008~exp=1746646608~hmac=3f1acae5201584647a683ea88540efca0e75dc2146ad635019fe86558e1397f1&w=1380'
              },
              {
                title: 'Backend Development',
                icon: FiDatabase,
                img: 'https://img.freepik.com/free-photo/programming-background-with-person-working-with-codes-computer_23-2150010125.jpg?t=st=1746642977~exp=1746646577~hmac=b476cc00b16b4c11c84aa37731eae08aac9d9c8b8388d54b19b0e1b967c1055b&w=996'
              },
              {
                title: 'Python Programming',
                icon: FiTerminal,
                img: 'https://img.freepik.com/premium-photo/python-programming-language-programing-workflow-abstract-algorithm-concept-virtual-screen_161452-10951.jpg?w=1380'
              }
            ].map((cat, i) => (
              <div key={i} className="glass-panel p-4 rounded-[2rem] shadow-lg border-white/60 group hover:-translate-y-1.5 transition-all duration-300">
                <div className="h-48 w-full rounded-[1.5rem] overflow-hidden relative mb-5 shadow-inner">
                  <img
                    src={cat.img}
                    alt={cat.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 text-white shadow-sm">
                    <cat.icon size={20} />
                  </div>
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white px-2 tracking-tight group-hover:text-blue-600 transition-colors">
                  {cat.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;