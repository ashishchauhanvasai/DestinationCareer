import React from 'react';

function CourseCard({ title, description, author, image }) {
  return (
    <div className="glass-panel p-5 md:p-6 rounded-[2.5rem] flex flex-col items-center text-center hover:-translate-y-1.5 transition-all duration-300 shadow-sm hover:shadow-lg group">
      
      {/* Image Container */}
      <div className="w-full h-48 sm:h-40 rounded-[2rem] overflow-hidden mb-5 border border-gray-200 dark:border-slate-700 shadow-sm relative bg-gray-100 dark:bg-slate-800">
        {image ? (
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 font-extrabold text-sm uppercase tracking-widest">
            No Image
          </div>
        )}
      </div>

      {/* Content */}
      <h3 className="font-extrabold text-xl text-gray-900 dark:text-white mb-2.5 leading-tight tracking-tight px-2">
        {title}
      </h3>
      <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-6 line-clamp-2 leading-relaxed px-2">
        {description}
      </p>
      
      {/* Badge */}
      <span className="mt-auto text-[10px] font-extrabold uppercase tracking-widest text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-4 py-2 rounded-xl shadow-sm">
        By {author}
      </span>
    </div>
  );
}

export default CourseCard;