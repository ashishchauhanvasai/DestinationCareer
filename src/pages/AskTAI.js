import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FiSend, FiMessageSquare, FiUser, FiCpu } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';

const API = process.env.REACT_APP_API_URL;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const MD_CLASS = 'text-[15px] leading-relaxed [&_p]:mb-3 [&_h1]:text-lg [&_h1]:font-extrabold [&_h2]:text-base [&_h2]:font-extrabold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_code]:bg-black/10 dark:[&_code]:bg-white/20 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:font-mono [&_code]:text-[13px] [&_pre]:bg-gray-100 dark:[&_pre]:bg-slate-800 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:mb-3 [&_pre]:border [&_pre]:border-gray-200 dark:[&_pre]:border-slate-700 [&_pre_code]:bg-transparent [&_pre_code]:p-0';

const AskTAI = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { text: input.trim(), sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(`${API}/api/ask-tai`, { prompt: userMessage.text }, cfg());
      const taiMessage = { text: res.data.response, sender: 'tai' };
      setMessages((prev) => [...prev, taiMessage]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { text: 'Sorry, I encountered an error processing your request.', sender: 'tai', isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100dvh-6rem)] max-w-5xl mx-auto py-4 sm:py-6 px-2 sm:px-6 lg:px-8 animate-fade-in flex flex-col">
      <div className="flex items-center gap-4 mb-4 md:mb-6 shrink-0">
        <div className="p-3.5 bg-indigo-600/10 dark:bg-indigo-400/10 rounded-2xl border border-indigo-500/20 shadow-sm shrink-0">
          <FiCpu className="text-indigo-600 dark:text-indigo-400" size={28} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Ask TAI</h1>
          <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mt-1">Your AI Teaching Assistant for coding and doubts.</p>
        </div>
      </div>

      <div className="flex-1 glass-panel rounded-[2.5rem] shadow-sm flex flex-col overflow-hidden relative border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center border border-indigo-200 dark:border-indigo-800 shadow-inner">
                <FiMessageSquare size={32} />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-2">Hi, I'm TAI.</p>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">Ask me anything about programming, algorithms, or your coursework.</p>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 md:gap-4 max-w-[90%] md:max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${msg.sender === 'user' ? 'bg-blue-600 text-white border-blue-700' : 'bg-indigo-600 text-white border-indigo-700'}`}>
                  {msg.sender === 'user' ? <FiUser size={16} /> : <FiCpu size={16} />}
                </div>
                <div className={`p-4 md:p-5 shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-blue-600 text-white rounded-[1.5rem] rounded-tr-sm border border-blue-700' 
                      : msg.isError 
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-[1.5rem] rounded-tl-sm' 
                        : 'bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-slate-700 rounded-[1.5rem] rounded-tl-sm'
                  }`}>
                  {msg.sender === 'tai' && !msg.isError ? (
                    <div className={MD_CLASS}><ReactMarkdown>{msg.text}</ReactMarkdown></div>
                  ) : (
                    <p className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
               <div className="flex gap-4">
                 <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm border border-indigo-700">
                    <FiCpu size={16} />
                 </div>
                 <div className="px-5 py-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-[1.5rem] rounded-tl-sm shadow-sm flex items-center gap-2 h-[52px]">
                   <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                   <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                   <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                 </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 md:p-5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-slate-700 shrink-0">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message TAI..."
              className="apple-input pr-[70px] py-4 text-[15px]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 top-2 bottom-2 w-14 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50 transition-transform hover:scale-[0.95] shadow-md shadow-blue-500/20"
            >
              <FiSend size={18} />
            </button>
          </form>
          <p className="text-center text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mt-3">TAI can make mistakes. Verify important information.</p>
        </div>
      </div>
    </div>
  );
};

export default AskTAI;