import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FiBookmark, FiExternalLink, FiTrash2 } from 'react-icons/fi';

const API = process.env.REACT_APP_API_URL;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = async () => {
    try {
      const res = await axios.get(`${API}/api/bookmarks`, cfg());
      setBookmarks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const removeBookmark = async (id) => {
    if(!window.confirm("Remove this bookmark?")) return;
    try {
      await axios.delete(`${API}/api/bookmarks/${id}`, cfg());
      setBookmarks(bookmarks.filter(b => b._id !== id));
    } catch(err) {
      alert("Failed to remove bookmark");
    }
  }

  if (loading) return <div className="p-16 text-center text-gray-500 font-extrabold text-lg animate-pulse">Loading bookmarks...</div>;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      <div className="flex items-center gap-4 mb-2">
        <div className="p-3 bg-yellow-500/10 dark:bg-yellow-400/10 rounded-2xl backdrop-blur-md border border-yellow-500/20 shadow-sm">
          <FiBookmark className="text-yellow-600 dark:text-yellow-400" size={28} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Saved Items</h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Quick access to your saved courses, jobs, and questions.</p>
        </div>
      </div>

      <div className="glass-panel rounded-[2.5rem] overflow-hidden shadow-xl border-white/60">
        {bookmarks.length === 0 ? (
           <div className="p-16 text-center bg-white/40 dark:bg-slate-900/40">
              <p className="text-gray-500 dark:text-gray-400 font-bold text-lg mb-4">No bookmarks saved yet.</p>
              <p className="text-sm text-gray-500">Click the bookmark icon on items you want to save for later.</p>
           </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-slate-700/50">
            {bookmarks.map(b => (
              <div key={b._id} className="p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors group">
                <div className="min-w-0">
                   <div className="flex items-center gap-3 mb-2">
                     <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 shadow-sm">
                       {b.type}
                     </span>
                   </div>
                   <h3 className="text-xl font-extrabold text-gray-900 dark:text-white truncate tracking-tight">{b.title}</h3>
                   <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 truncate">{b.link}</p>
                </div>
                
                <div className="flex gap-3 shrink-0 mt-4 sm:mt-0">
                  <Link to={b.link} className="glass-button w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                    <FiExternalLink size={18} />
                  </Link>
                  <button onClick={() => removeBookmark(b._id)} className="glass-button w-10 h-10 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm opacity-100 sm:opacity-0 group-hover:opacity-100 border border-red-500/10">
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookmarks;