import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FiHeart, FiSearch, FiHelpCircle } from 'react-icons/fi';

const CompanyQuestions = () => {
  const [companies, setCompanies] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('favCompanies')) || []; }
    catch { return []; }
  });

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/companies`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCompanies(res.data);
      } catch (err) {
        console.error('Error fetching companies', err);
      }
    };
    fetchCompanies();
  }, []);

  const toggleFav = (id) => {
    const next = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem('favCompanies', JSON.stringify(next));
  };

  const techTags = [...new Set(companies.flatMap((c) => c.tags || []))];

  const visible = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) &&
    (!activeTag || (c.tags || []).includes(activeTag)) &&
    (activeTab === 'All' || favorites.includes(c._id))
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl backdrop-blur-md border border-blue-500/20 shadow-sm">
            <FiHelpCircle className="text-blue-600 dark:text-blue-400" size={28} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Company Questions</h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Prepare for your next interview.</p>
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={18} />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            type="text" 
            placeholder="Search companies..." 
            className="apple-input pl-11 shadow-sm" 
          />
        </div>
      </div>

      <div className="flex gap-4 border-b border-black/5 dark:border-white/5 pb-2 overflow-x-auto custom-scrollbar">
        {['All', 'Favorites'].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 relative whitespace-nowrap ${
              activeTab === tab 
                ? 'bg-white/60 dark:bg-slate-800/60 text-blue-600 dark:text-blue-400 shadow-sm border border-white/50 dark:border-slate-700/50 backdrop-blur-md' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            {tab === 'All' ? `All (${companies.length})` : `Favorites (${favorites.filter((f) => companies.some((c) => c._id === f)).length})`}
          </button>
        ))}
      </div>

      {techTags.length > 0 && (
        <div className="glass-panel p-5 rounded-[1.5rem] flex flex-wrap items-center gap-3 shadow-sm border-white/60">
          <span className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mr-2">Technologies</span>
          {techTags.map((tag) => (
            <button 
              key={tag} 
              onClick={() => setActiveTag(activeTag === tag ? null : tag)} 
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-300 shadow-sm border ${
                activeTag === tag 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20' 
                  : 'bg-white/50 dark:bg-slate-800/50 text-gray-600 dark:text-gray-300 border-white/50 dark:border-slate-700/50 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="glass-panel text-center py-20 rounded-[2.5rem]">
           <p className="text-gray-500 dark:text-gray-400 font-bold text-lg">No companies found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visible.map((company) => (
            <div key={company._id} className="glass-panel p-8 rounded-[2rem] flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300 group shadow-lg border-white/60 min-h-[220px]">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-lg font-extrabold text-blue-600 dark:text-blue-400 shadow-sm border border-white/60 dark:border-slate-600">
                      {company.name.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight">{company.name}</h3>
                  </div>
                  <button onClick={() => toggleFav(company._id)} className={`p-2 rounded-full transition-all ${favorites.includes(company._id) ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-500/10 bg-black/5 dark:bg-white/10'}`}>
                    <FiHeart size={18} fill={favorites.includes(company._id) ? 'currentColor' : 'none'} className={favorites.includes(company._id) ? 'scale-110' : ''} />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2.5">
                  {(company.tags || []).slice(0, 4).map((tag, i) => (
                    <span key={i} className="text-[10px] font-extrabold bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm">
                      {tag}
                    </span>
                  ))}
                  {(company.tags || []).length > 4 && (
                    <span className="text-[10px] font-extrabold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg shadow-sm">
                      +{company.tags.length - 4}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400 bg-white/40 dark:bg-slate-800/40 px-3 py-1.5 rounded-lg border border-white/50 dark:border-slate-700/50 shadow-sm">
                  {company.questions?.length || 0} Q's
                </span>
                <Link to={`/company-questions/${company._id}`} className="glass-button text-blue-600 dark:text-blue-400 font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all group-hover:bg-blue-600 group-hover:text-white">
                  Explore &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanyQuestions;