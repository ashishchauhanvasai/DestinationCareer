import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FiHeart, FiSearch, FiHelpCircle } from 'react-icons/fi';

const CompanyQuestions = () => {
  const [companies, setCompanies] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [loading, setLoading] = useState(true);
  
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
      } finally {
        setLoading(false);
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

  if (loading) return <div className="h-[50vh] flex items-center justify-center font-bold text-gray-500 animate-pulse text-lg">Loading company questions...</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-600/10 dark:bg-blue-400/10 rounded-2xl border border-blue-500/20 shadow-sm shrink-0">
            <FiHelpCircle className="text-blue-600 dark:text-blue-400" size={28} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Company Questions</h1>
            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mt-1 opacity-90">Prepare for your next interview.</p>
          </div>
        </div>

        <div className="relative w-full md:w-80 shrink-0">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={18} />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            type="text" 
            placeholder="Search companies..." 
            className="apple-input pl-11 py-3.5 font-bold text-[15px] shadow-sm" 
          />
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200 dark:border-slate-700 pb-3 overflow-x-auto custom-scrollbar">
        {['All', 'Favorites'].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`px-6 py-3 rounded-xl font-extrabold text-[13px] transition-all duration-300 relative whitespace-nowrap shadow-sm border ${
              activeTab === tab 
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-gray-200 dark:border-slate-700' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 border-transparent'
            }`}
          >
            {tab === 'All' ? `All (${companies.length})` : `Favorites (${favorites.filter((f) => companies.some((c) => c._id === f)).length})`}
          </button>
        ))}
      </div>

      {techTags.length > 0 && (
        <div className="glass-panel p-6 rounded-[2rem] flex flex-wrap items-center gap-3 shadow-sm border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
          <span className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mr-2 bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">Technologies</span>
          {techTags.map((tag) => (
            <button 
              key={tag} 
              onClick={() => setActiveTag(activeTag === tag ? null : tag)} 
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-300 shadow-sm border ${
                activeTag === tag 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' 
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="glass-panel text-center py-20 rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-slate-700">
           <p className="text-gray-500 dark:text-gray-400 font-bold text-xl">No companies found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visible.map((company) => (
            <div key={company._id} className="glass-panel p-6 md:p-8 rounded-[2.5rem] flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300 group shadow-sm hover:shadow-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 min-h-[220px]">
              <div>
                <div className="flex justify-between items-start mb-6 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-[22px] font-black text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-slate-600 shrink-0">
                      {company.name.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight leading-tight">{company.name}</h3>
                  </div>
                  <button onClick={() => toggleFav(company._id)} className={`p-2.5 rounded-full transition-colors border shadow-sm shrink-0 ${favorites.includes(company._id) ? 'text-red-500 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800' : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800'}`}>
                    <FiHeart size={16} fill={favorites.includes(company._id) ? 'currentColor' : 'none'} className={favorites.includes(company._id) ? 'scale-110 transition-transform' : ''} />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2.5">
                  {(company.tags || []).slice(0, 4).map((tag, i) => (
                    <span key={i} className="text-[10px] font-extrabold bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-md uppercase tracking-wider shadow-sm">
                      {tag}
                    </span>
                  ))}
                  {(company.tags || []).length > 4 && (
                    <span className="text-[10px] font-extrabold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-md shadow-sm uppercase tracking-wider">
                      +{company.tags.length - 4}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
                  {company.questions?.length || 0} Q's
                </span>
                <Link to={`/company-questions/${company._id}`} className="glass-button text-blue-600 dark:text-blue-400 font-extrabold text-[11px] uppercase tracking-wider px-6 py-3 rounded-xl transition-all group-hover:bg-blue-600 group-hover:text-white border border-gray-300 dark:border-slate-600 shadow-sm">
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