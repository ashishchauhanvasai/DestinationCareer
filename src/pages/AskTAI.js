import React from 'react';
import { FiMessageCircle, FiBook, FiList, FiTrendingUp, FiCode, FiDatabase } from 'react-icons/fi';

const AskTAI = () => {
  const options = [
    { icon: <FiMessageCircle className="text-blue-500" size={20}/>, title: 'Resolve a query', desc: 'Clear your code-related doubts' },
    { icon: <FiBook className="text-green-500" size={20}/>, title: 'Learn concepts', desc: 'Understand and practice a topic' },
    { icon: <FiList className="text-purple-500" size={20}/>, title: 'Take a quiz', desc: 'Quick questions to test yourself' },
    { icon: <FiTrendingUp className="text-orange-500" size={20}/>, title: 'Aptitude mentor', desc: 'Sharpen your aptitude skills' },
    { icon: <FiCode className="text-blue-600" size={20}/>, title: 'Coding problem', desc: 'Get a challenge to solve' },
    { icon: <FiDatabase className="text-red-500" size={20}/>, title: 'SQL practice', desc: 'Put your SQL skills to the test' }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-4xl mx-auto px-4">
      <div className="mb-8 flex flex-col items-center">
        {/* Futuristic Icon Placeholder */}
        <div className="text-blue-600 text-5xl mb-4 font-bold flex items-center">
          D<span className="text-3xl mx-1">≡</span>C
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Hi Ashish, I'm TAI</h1>
        <p className="text-gray-500">Your AI study buddy. What do you want to do today?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {options.map((opt, idx) => (
          <button key={idx} className="flex items-start gap-4 p-5 bg-white border border-gray-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all text-left">
            <div className="mt-1 bg-gray-50 p-2 rounded-lg">
              {opt.icon}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">{opt.title}</h3>
              <p className="text-sm text-gray-500">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
      
      {/* Chat Input Area */}
      <div className="w-full mt-12 relative">
         <input type="text" placeholder="Ask DC anything..." className="w-full p-4 pr-12 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
         <button className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700">
           ↑
         </button>
      </div>
    </div>
  );
};

export default AskTAI;