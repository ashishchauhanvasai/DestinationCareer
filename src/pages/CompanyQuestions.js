import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FiHeart, FiSearch } from 'react-icons/fi';

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
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Company Questions</h1>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder="Search companies" className="pl-10 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:border-blue-500" />
        </div>
      </div>

      <div className="flex gap-6 border-b border-gray-200 mb-6">
        {['All', 'Favorites'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === tab ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>
            {tab === 'All' ? `All ${companies.length}` : `Favorites ${favorites.filter((f) => companies.some((c) => c._id === f)).length}`}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
          </button>
        ))}
      </div>

      {techTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8 items-center">
          <span className="text-sm font-semibold text-gray-500 mr-2">Technology</span>
          {techTags.map((tag) => (
            <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} className={`px-3 py-1 border rounded-full text-xs font-medium transition-colors ${activeTag === tag ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {tag}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-gray-500">No companies found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((company) => (
            <div key={company._id} className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-48">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                      {company.name.charAt(0)}
                    </div>
                    <h3 className="font-bold text-gray-900">{company.name}</h3>
                  </div>
                  <button onClick={() => toggleFav(company._id)} className={`transition-colors ${favorites.includes(company._id) ? 'text-red-500' : 'text-gray-300 hover:text-red-500'}`}>
                    <FiHeart size={18} fill={favorites.includes(company._id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(company.tags || []).slice(0, 4).map((tag, i) => (
                    <span key={i} className="text-xs text-gray-500 font-medium">{tag}</span>
                  ))}
                  {(company.tags || []).length > 4 && <span className="text-xs text-gray-400">+{company.tags.length - 4}</span>}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <Link to={`/company-questions/${company._id}`} className="text-sm font-bold text-blue-600 hover:underline">Explore questions &rarr;</Link>
                <span className="text-xs text-gray-400">{company.questions?.length || 0} questions</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanyQuestions;