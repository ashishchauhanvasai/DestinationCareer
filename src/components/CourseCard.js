import React from 'react';

function CourseCard({ title, description, author, image }) {
  return (
    <div className="glass-panel p-5 rounded-[2rem] flex flex-col items-center text-center hover:-translate-y-1.5 transition-all duration-300 shadow-lg group border-white/60">
      <div className="w-full h-40 rounded-[1.5rem] overflow-hidden mb-5 border border-black/5 dark:border-white/10 shadow-inner relative">
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
      </div>
      <h3 className="font-extrabold text-xl text-gray-900 dark:text-white mb-2 leading-tight tracking-tight">{title}</h3>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-5 line-clamp-2 leading-relaxed">{description}</p>
      <span className="mt-auto text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg shadow-sm">
        By {author}
      </span>
    </div>
  );
}

export default CourseCard;