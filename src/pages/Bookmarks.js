import React, { useState } from 'react';
import { FiBookmark } from 'react-icons/fi';

const Bookmarks = () => {
  const [activeTab, setActiveTab] = useState('Questions');

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Bookmarks</h1>

      <div className="flex gap-6 border-b border-gray-200 mb-12">
        {['Questions', 'Videos', 'Notes'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === tab ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
          </button>
        ))}
      </div>

      {/* Empty State */}
      <div className="flex-1 flex flex-col items-center justify-center pb-20">
        <div className="w-48 h-48 bg-gradient-to-tr from-blue-50 to-indigo-50 rounded-full flex items-center justify-center mb-6 relative border-4 border-white shadow-sm">
           {/* Abstract Folder/Bookmark Graphic */}
           <div className="absolute inset-0 flex items-center justify-center text-blue-300 opacity-20 text-6xl">{'</>'}</div>
           <div className="w-24 h-20 bg-blue-500 rounded-lg shadow-lg relative z-10 flex flex-col items-center pt-2">
              <div className="w-12 h-16 bg-blue-400 absolute -top-6 rounded-t-md flex justify-center pt-1 shadow-inner">
                 <FiBookmark className="text-blue-100" size={24} />
              </div>
           </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No {activeTab.toLowerCase()} saved</h2>
        <p className="text-gray-500 text-sm max-w-sm text-center">
          Tap the bookmark icon on any question, video or note and it will be waiting for you here.
        </p>
      </div>
    </div>
  );
};

export default Bookmarks;