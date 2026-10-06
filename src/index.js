import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App';
import './App.css';
import reportWebVitals from './reportWebVitals';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

// Auto-logout when the token is expired or invalid
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message;
    if (msg === 'Invalid token') {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

reportWebVitals();