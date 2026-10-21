import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
  useParticipants,
  useLocalParticipant
} from '@livekit/components-react';
import '@livekit/components-styles';
import {
  FiSend, FiMessageSquare, FiBarChart2, FiUsers, FiBell,
  FiVideoOff, FiLock, FiUnlock, FiCircle, FiPause, FiPlay, FiDownload, FiX, FiMonitor
} from 'react-icons/fi';


const API = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });


// Stable options object (a new object every render makes LiveKit re-evaluate its config)
const LK_OPTIONS = {
  adaptiveStream: true,
  dynacast: true,
  publishDefaults: {
    videoSimulcast: true,
    screenShareSimulcast: true,
  }
};

// Memoized so the 1-second chat/poll refresh does not re-render the video grid
const VideoStage = React.memo(() => (
  <>
    <VideoConference />
    <RoomAudioRenderer />
  </>
));

// Reports who is CURRENTLY connected to the LiveKit room (real-time presence)
const PresenceReporter = ({ onChange }) => {
  const participants = useParticipants();
  const key = participants.map(p => p.identity).sort().join(',');

  useEffect(() => {
    onChange(key ? key.split(',') : []);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

// Screen share button for Trainer / allowed students.
// Only shown on browsers that support screen capture (desktop/laptop).
// Mobile browsers do not provide screen capture, so nothing is shown there.
const ScreenShareButton = () => {
  const { localParticipant, isScreenShareEnabled } = useLocalParticipant();
  const supported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getDisplayMedia;

  if (!supported) return null;

  const toggleScreen = async () => {
    try {
      await localParticipant.setScreenShareEnabled(!isScreenShareEnabled, { audio: true });
    } catch (err) {
      if (err?.name !== 'NotAllowedError') {
        alert('Could not start screen share. ' + (err?.message || ''));
      }
    }
  };

  return (
    <button
      onClick={toggleScreen}
      className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border transition ${
        isScreenShareEnabled
          ? 'bg-blue-600 border-blue-500 text-white'
          : 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700'
      }`}
    >
      <FiMonitor size={16} />
      <span className="hidden sm:inline">{isScreenShareEnabled ? 'Stop Sharing' : 'Share Screen'}</span>
    </button>
  );
};


const LiveClassroom = () => {
  const { batchCode } = useParams();
  const navigate = useNavigate();


  // Core State
  const [lkToken, setLkToken] = useState('');
  const [lkUrl, setLkUrl] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


  // UI State
  const [activeTab, setActiveTab] = useState('chat'); 
  const [chatInput, setChatInput] = useState('');
  const [pollForm, setPollForm] = useState({ question: '', opt1: '', opt2: '', opt3: '' });
  
  // Live presence (user IDs currently connected to the LiveKit room)
  const [activeIds, setActiveIds] = useState([]);

  // Mobile Panel State
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);


  // Recorder State
  const [recorder, setRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const recordedChunks = useRef([]);


  // Gate state (before start / after end)
  const [gate, setGate] = useState(null); // { type: 'NOT_STARTED' | 'ENDED', ...info }
  const [tick, setTick] = useState(Date.now());
  const serverOffset = useRef(0); // serverTime - clientTime, avoids wrong device clocks
  const retryLock = useRef(false);
  const joinedStatus = useRef(''); // class status when we joined


  // 1. Initial Join & Token Generation
  const joinClass = useCallback(async () => {
    try {
      const res = await axios.post(`${API}/online-classes/${batchCode}/join`, {}, cfg());
      setGate(null);
      joinedStatus.current = res.data.classData?.status || '';
      setLkToken(res.data.livekitToken);
      setLkUrl(res.data.livekitUrl);
      setRoomData(res.data.classData);
      setIsHost(res.data.isHost);
      setCanSpeak(res.data.canSpeak);
      setUser(res.data.user);
      setLoading(false);
    } catch (err) {
      const data = err.response?.data;
      if (data?.code === 'NOT_STARTED' || data?.code === 'ENDED') {
        if (data.serverTime) serverOffset.current = new Date(data.serverTime).getTime() - Date.now();
        setGate({ type: data.code, ...data });
        setLoading(false);
        return;
      }
      alert(data?.message || "Failed to join class. Ensure you are logged in.");
      navigate('/login');
    }
  }, [batchCode, navigate]);

  useEffect(() => {
    joinClass();
  }, [joinClass]);


  // Countdown ticker (only while waiting for class to start)
  useEffect(() => {
    if (gate?.type !== 'NOT_STARTED') return;
    const t = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, [gate]);


  // When countdown hits zero, try joining automatically
  useEffect(() => {
    if (gate?.type !== 'NOT_STARTED') return;
    const remaining = new Date(gate.scheduledTime).getTime() - (tick + serverOffset.current);
    if (remaining <= 0 && !retryLock.current) {
      retryLock.current = true;
      joinClass().finally(() => setTimeout(() => { retryLock.current = false; }, 3000));
    }
  }, [tick, gate, joinClass]);


  // 2. Fast Poll Room Data (1s latency) & Dynamic Permission Upgrade
  const fetchRoomState = async () => {
    if (!user) return;

    try {
      const res = await axios.get(`${API}/online-classes/${batchCode}/state`, cfg());
      // Class was closed while we were inside -> show Session Closed screen
      if (res.data.status === 'ended' && joinedStatus.current !== 'ended') {
        setGate({
          type: 'ENDED',
          title: res.data.title,
          subject: res.data.subject,
          scheduledTime: res.data.scheduledTime
        });
        setUser(null); // stops polling
        return;
      }

      setRoomData(res.data);

      if (!isHost) {
        const isNowAllowed = res.data.allowedSpeakers.includes(user._id);

        // If trainer just granted or revoked permission, fetch a fresh LiveKit token
        if (isNowAllowed !== canSpeak) {
          setCanSpeak(isNowAllowed);

          const joinRes = await axios.post(
            `${API}/online-classes/${batchCode}/join`,
            {},
            cfg()
          );

          setLkToken(joinRes.data.livekitToken);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };


  useEffect(() => {
    if (!user) return;

    const interval = setInterval(fetchRoomState, 1000); // 1-second sync for instant chat/polls

    return () => clearInterval(interval);
  }, [batchCode, user, isHost, canSpeak]); // eslint-disable-line react-hooks/exhaustive-deps


  // RECORDING CONTROLS (TRAINER ONLY)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.current.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${batchCode}_Class_Recording.webm`;
        a.click();
        recordedChunks.current = [];
        setIsRecording(false);
        setIsPaused(false);
      };


      stream.getVideoTracks()[0].onended = () => mediaRecorder.stop();
      mediaRecorder.start();
      setRecorder(mediaRecorder);
      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      alert("Failed to start recording. Please allow permissions.");
    }
  };


  const pauseRecording = () => {
    if (recorder && recorder.state === "recording") {
      recorder.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (recorder && recorder.state === "paused") {
      recorder.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (recorder && (recorder.state === "recording" || recorder.state === "paused")) {
      recorder.stop();
      recorder.stream.getTracks().forEach(t => t.stop());
    }
  };


  // API ACTIONS (With instant local refresh)
  const sendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const msgText = chatInput;
    setChatInput(''); // Clear input immediately for snappy feel

    try {
      await axios.post(`${API}/online-classes/${batchCode}/chat`, { text: msgText }, cfg());
      fetchRoomState();
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot send message');
    }
  };

  const toggleChatStatus = async () => {
    if (!isHost) return;

    try {
      await axios.post(
        `${API}/online-classes/${batchCode}/controls`,
        { action: 'toggle-chat', chatEnabled: !roomData.chatEnabled },
        cfg()
      );

      fetchRoomState();
    } catch (e) {}
  };

  const createPoll = async (e) => {
    e.preventDefault();

    const opts = [pollForm.opt1, pollForm.opt2, pollForm.opt3].filter(o => o.trim() !== '');
    if (opts.length < 2) return alert('Provide at least 2 options');

    try {
      await axios.post(
        `${API}/online-classes/${batchCode}/polls`,
        { question: pollForm.question, options: opts },
        cfg()
      );

      setPollForm({ question: '', opt1: '', opt2: '', opt3: '' });
      fetchRoomState();
      alert("Poll launched!");
    } catch (e) {
      alert('Failed to create poll');
    }
  };

  const votePoll = async (pollId, optionIndex) => {
    try {
      await axios.post(
        `${API}/online-classes/${batchCode}/polls/${pollId}/vote`,
        { optionIndex },
        cfg()
      );

      fetchRoomState();
    } catch (e) {
      alert('Failed to cast vote');
    }
  };

  const toggleHandRaise = async () => {
    try {
      await axios.post(`${API}/online-classes/${batchCode}/hand`, {}, cfg());
      fetchRoomState();
    } catch (e) {}
  };

  const handleSpeaker = async (studentId, actionType) => {
    try {
      await axios.post(
        `${API}/online-classes/${batchCode}/controls`,
        { action: actionType, studentId },
        cfg()
      );

      fetchRoomState();
    } catch (e) {
      alert('Action failed');
    }
  };


  // GATE SCREEN: "Class will start soon" countdown / "Session Closed"
  if (gate) {
    const startMs = new Date(gate.scheduledTime).getTime();
    const remaining = Math.max(0, startMs - (tick + serverOffset.current));
    const d = Math.floor(remaining / 86400000);
    const h = Math.floor((remaining % 86400000) / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    const box = (val, label) => (
      <div className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 md:px-5 md:py-4 min-w-[64px]">
        <p className="text-2xl md:text-4xl font-bold text-white tabular-nums">{String(val).padStart(2, '0')}</p>
        <p className="text-[10px] text-gray-400 uppercase mt-1">{label}</p>
      </div>
    );

    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-gray-900 text-white px-4 text-center">
        <h1 className="text-xl md:text-2xl font-bold mb-1">{gate.title}</h1>
        {gate.subject && <p className="text-sm text-gray-400 mb-6">{gate.subject}</p>}

        {gate.type === 'NOT_STARTED' ? (
          <>
            <p className="text-amber-400 font-bold mb-4">Class will start soon</p>
            <div className="flex gap-2 md:gap-3">
              {d > 0 && box(d, 'Days')}
              {box(h, 'Hours')}
              {box(m, 'Minutes')}
              {box(s, 'Seconds')}
            </div>
            <p className="text-xs text-gray-500 mt-5">
              Starts at {new Date(gate.scheduledTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.
              You will join automatically when the timer ends.
            </p>
          </>
        ) : (
          <>
            <p className="text-red-400 font-bold text-lg mb-2">Session Closed</p>
            <p className="text-sm text-gray-400">This class has ended. Please contact your trainer for the next session.</p>
          </>
        )}

        <button
          onClick={() => navigate('/tests')}
          className="mt-8 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 rounded-lg text-sm font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }


  if (loading) return <div className="h-[100dvh] flex items-center justify-center bg-gray-900 text-white font-bold">Joining Live Classroom...</div>;
  if (!lkToken || !lkUrl) return <div className="h-[100dvh] flex items-center justify-center bg-gray-900 text-red-500 font-bold">Connection Failed.</div>;


  // Only people currently in the room can have a raised hand / show as active speaker
  const activeHands = (roomData?.raisedHands || []).filter(h => activeIds.includes(String(h.userId)));
  const activeSpeakerIds = (roomData?.allowedSpeakers || []).filter(id => activeIds.includes(String(id)));


  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-gray-900 text-gray-100 overflow-hidden font-sans relative">
      
      {/* MASTER CSS FIX: 
          1. Hide ONLY the control bar inside VideoConference (.lk-video-conference .lk-control-bar)
          2. Keep our dedicated bottom ControlBar always visible on top! 
      */}
      <style>{`
        .lk-video-conference .lk-control-bar,
        .lk-video-conference .lk-chat {
          display: none !important;
        }
        .lk-video-conference {
          height: 100% !important;
          width: 100% !important;
        }
        .lk-video-container, .lk-participant-tile {
          touch-action: pan-x pan-y pinch-zoom !important;
        }
        .lk-participant-tile video {
          touch-action: pan-x pan-y pinch-zoom !important;
          pointer-events: auto !important;
          object-fit: contain !important;
        }
        /* Style our custom bottom control bar cleanly */
        .custom-control-dock .lk-control-bar {
          display: flex !important;
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          margin: 0 !important;
        }
      `}</style>


      {/* LEFT/TOP: LIVEKIT VIDEO ENGINE */}
      <div className="flex-1 flex flex-col relative w-full h-full min-h-0 overflow-hidden">
        
        {/* Top Navbar */}
        <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-3 md:px-4 z-20 shrink-0">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="flex h-2 w-2 md:h-3 md:w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 md:h-3 md:w-3 bg-red-500"></span>
            </span>

            <h1 className="font-bold text-white tracking-wide text-sm md:text-base truncate max-w-[100px] md:max-w-sm">
              {roomData?.title}
            </h1>
          </div>


          <div className="flex items-center gap-2 md:gap-3">
            
            {/* MOBILE ONLY: Open Chat/Panel Button */}
            <button 
              onClick={() => setShowMobileSidebar(true)} 
              className="md:hidden flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-white shadow-md transition"
            >
              <FiMessageSquare /> Chat
            </button>


            {/* RECORDING CONTROLS (TRAINER ONLY) */}
            {isHost && (
              <div className="flex items-center bg-gray-800 rounded-lg p-1 border border-gray-700">
                {!isRecording ? (
                  <button onClick={startRecording} className="flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded hover:bg-gray-700 text-gray-200 transition">
                    <FiCircle className="text-red-500 fill-current" /> <span className="hidden md:inline">Record Session</span>
                  </button>
                ) : (
                  <>
                    {isPaused ? (
                      <button onClick={resumeRecording} className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-500 transition mr-1">
                        <FiPlay /> <span className="hidden sm:inline">Resume</span>
                      </button>
                    ) : (
                      <button onClick={pauseRecording} className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-amber-600 text-white hover:bg-amber-500 transition mr-1">
                        <FiPause /> <span className="hidden sm:inline">Pause</span>
                      </button>
                    )}

                    <button onClick={stopRecording} className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-red-600 text-white hover:bg-red-500 transition">
                      <FiDownload /> <span className="hidden sm:inline">Save</span>
                    </button>

                    <span className="hidden md:inline text-xs text-red-500 animate-pulse ml-2 font-bold px-2">● REC</span>
                  </>
                )}
              </div>
            )}


            {/* STUDENT: RAISE HAND BUTTON (Always visible to students, even when unmuted) */}
            {!isHost && (
              <button 
                onClick={toggleHandRaise} 
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg shadow-md transition ${
                  (roomData?.raisedHands || []).some(h => h.userId === user?._id) 
                    ? 'bg-amber-500 text-white animate-pulse' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                <FiBell /> 
                <span>
                  {(roomData?.raisedHands || []).some(h => h.userId === user?._id) ? 'Hand Raised' : 'Raise Hand'}
                </span>
              </button>
            )}


            <button onClick={() => navigate('/tests')} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold shadow-md transition">
              Leave
            </button>
          </div>
        </div>


        {/* LiveKit Video Container with Dedicated Bottom Control Dock */}
        <div className="flex-1 relative bg-black flex flex-col min-h-0 overflow-hidden">
          <LiveKitRoom
            video={isHost || canSpeak}
            audio={isHost || canSpeak}
            token={lkToken}
            serverUrl={lkUrl}
            data-lk-theme="default"
            className="flex-1 flex flex-col min-h-0 w-full h-full overflow-hidden"
            options={LK_OPTIONS}
          >
            {/* 1. Video Grid Area (Takes available space without covering controls) */}
            <div className="flex-1 relative min-h-0 w-full overflow-hidden">
              <VideoStage />
              <PresenceReporter onChange={setActiveIds} />
            </div>


            {/* 2. DEDICATED SOLID BOTTOM CONTROL BAR */}
            {(isHost || canSpeak) && (
              <div className="custom-control-dock h-16 bg-gray-900 border-t border-gray-800 flex items-center justify-center gap-2 px-4 shrink-0 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
                <ControlBar 
                  variation="minimal"
                  controls={{ 
                    camera: true, 
                    microphone: true, 
                    screenShare: false, // handled by our own ScreenShareButton below
                    chat: false, 
                    leave: false,
                    settings: false
                  }} 
                />
                <ScreenShareButton />
              </div>
            )}
          </LiveKitRoom>
        </div>
      </div>


      {/* RIGHT/BOTTOM: CUSTOM SIDEBAR (Slide-up on Mobile, Fixed on Desktop) */}
      <div className={`
        fixed bottom-0 left-0 w-full h-[65dvh] z-50 bg-gray-900 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.7)] transform transition-transform duration-300 flex flex-col
        md:relative md:w-80 lg:w-96 md:h-full md:rounded-none md:shadow-none md:translate-y-0 md:border-l md:border-gray-800 shrink-0
        ${showMobileSidebar ? 'translate-y-0' : 'translate-y-full'}
      `}>
        
        {/* Sidebar Tabs */}
        <div className="flex border-b border-gray-800 p-2 gap-1 shrink-0 items-center">
          {[
            { id: 'chat', icon: <FiMessageSquare />, label: 'Chat' },
            { id: 'polls', icon: <FiBarChart2 />, label: 'Polls' },
            { id: 'people', icon: <FiUsers />, label: isHost && activeHands.length > 0 ? `Hands (${activeHands.length})` : 'People' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1 md:gap-2 py-2 md:py-2.5 rounded-lg text-xs font-bold transition ${activeTab === t.id ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-800/50 hover:text-gray-300'}`}
            >
              {t.icon} <span>{t.label}</span>
            </button>
          ))}
          
          {/* Mobile Only: Close Button */}
          <button 
            onClick={() => setShowMobileSidebar(false)} 
            className="md:hidden p-2 text-gray-400 hover:text-white ml-2 rounded-lg bg-gray-800"
          >
            <FiX size={18} />
          </button>
        </div>


        {/* ---------------- CHAT TAB ---------------- */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0">
            {roomData?.pinnedAnnouncement && (
              <div className="bg-blue-900/30 border-b border-blue-900/50 p-3 shrink-0">
                <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">📌 Pinned by Trainer</p>
                <p className="text-sm text-blue-100 leading-snug">{roomData.pinnedAnnouncement}</p>
              </div>
            )}


            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {roomData?.messages?.map((msg, i) => {
                const isMe = msg.senderId === user._id;
                const isT = msg.senderRole === 'Trainer';

                return (
                  <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-baseline gap-2 mb-1 px-1">
                      <span className={`text-[10px] font-bold ${isT ? 'text-amber-400' : 'text-gray-400'}`}>
                        {isMe ? 'You' : msg.senderName} {isT && '(Trainer)'}
                      </span>

                      <span className="text-[9px] text-gray-600">
                        {new Date(msg.createdAt).toLocaleTimeString([], { timeStyle: 'short' })}
                      </span>
                    </div>

                    <div className={`px-4 py-2 rounded-2xl max-w-[90%] text-sm shadow-sm break-words ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : isT ? 'bg-gray-700 text-white border border-gray-600 rounded-tl-sm' : 'bg-gray-800 text-gray-200 rounded-tl-sm'}`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>


            <div className="p-3 md:p-4 bg-gray-900 border-t border-gray-800 shrink-0">
              {isHost && (
                <button onClick={toggleChatStatus} className="text-xs text-gray-400 hover:text-white mb-2 flex items-center gap-1 font-semibold">
                  {roomData?.chatEnabled ? <><FiUnlock/> Lock Chat</> : <><FiLock/> Unlock Chat</>}
                </button>
              )}
              
              {roomData?.chatEnabled || isHost ? (
                <form onSubmit={sendChat} className="relative">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-3 pr-10 py-2.5 md:py-3 text-sm focus:outline-none focus:border-blue-500 transition"
                  />

                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 md:p-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-500 transition"
                  >
                    <FiSend size={14} />
                  </button>
                </form>
              ) : (
                <div className="bg-gray-800 text-center py-2.5 rounded-xl border border-gray-700 text-xs text-red-400 flex items-center justify-center gap-2">
                  <FiLock /> Chat disabled by Trainer
                </div>
              )}
            </div>
          </div>
        )}


        {/* ---------------- POLLS TAB ---------------- */}
        {activeTab === 'polls' && (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 md:gap-6">
            {isHost && (
              <form onSubmit={createPoll} className="bg-gray-800 p-3 md:p-4 rounded-xl border border-gray-700 space-y-3 shrink-0">
                <p className="text-xs font-bold text-gray-400 uppercase">Create Poll</p>

                <input
                  required
                  placeholder="Ask a question..."
                  value={pollForm.question}
                  onChange={e => setPollForm({ ...pollForm, question: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white"
                />

                <input
                  required
                  placeholder="Option 1"
                  value={pollForm.opt1}
                  onChange={e => setPollForm({ ...pollForm, opt1: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white"
                />

                <input
                  required
                  placeholder="Option 2"
                  value={pollForm.opt2}
                  onChange={e => setPollForm({ ...pollForm, opt2: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white"
                />

                <input
                  placeholder="Option 3 (Optional)"
                  value={pollForm.opt3}
                  onChange={e => setPollForm({ ...pollForm, opt3: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white"
                />

                <button type="submit" className="w-full bg-blue-600 py-2 rounded text-sm font-bold hover:bg-blue-500 transition">
                  Launch Poll
                </button>
              </form>
            )}


            {roomData?.polls?.slice().reverse().map((poll) => {
              const totalVotes = poll.votes.length;
              const myVote = poll.votes.find(v => v.userId === user._id);

              return (
                <div key={poll._id} className={`p-3 md:p-4 rounded-xl border ${poll.isActive ? 'bg-blue-900/20 border-blue-800' : 'bg-gray-800 border-gray-700 opacity-70'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <p className="font-bold text-sm text-white">{poll.question}</p>

                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                      {poll.isActive ? 'Live' : 'Closed'}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {poll.options.map((opt, oIdx) => {
                      const votesForOpt = poll.votes.filter(v => v.optionIndex === oIdx).length;
                      const percent = totalVotes > 0 ? Math.round((votesForOpt / totalVotes) * 100) : 0;
                      const hasVotedThis = myVote?.optionIndex === oIdx;


                      return (
                        <button
                          key={oIdx}
                          disabled={!poll.isActive || (myVote && !isHost)}
                          onClick={() => votePoll(poll._id, oIdx)}
                          className="w-full text-left relative overflow-hidden bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-xs md:text-sm flex justify-between group disabled:cursor-default"
                        >
                          <div
                            className={`absolute top-0 left-0 h-full transition-all duration-500 ${hasVotedThis ? 'bg-blue-600/30' : 'bg-gray-700/50'}`}
                            style={{ width: `${(myVote || isHost || !poll.isActive) ? percent : 0}%` }}
                          />

                          <span className="relative z-10 text-gray-200 truncate pr-2">{opt}</span>

                          {(myVote || isHost || !poll.isActive) && (
                            <span className="relative z-10 font-bold text-gray-400">{percent}%</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[10px] text-gray-500 text-right mt-2">{totalVotes} votes</p>
                </div>
              );
            })}
          </div>
        )}


        {/* ---------------- PEOPLE / HANDS TAB ---------------- */}
        {activeTab === 'people' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 md:space-y-6">
            
            {isHost && activeHands.length > 0 && (
              <div className="bg-amber-900/20 border border-amber-900/50 rounded-xl p-3">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-2">
                  Raised Hands ({activeHands.length})
                </p>

                <div className="space-y-2">
                  {activeHands.map(h => (
                    <div key={h.userId} className="flex justify-between items-center bg-gray-900 p-2 rounded border border-gray-800">
                      <div className="truncate pr-2">
                        <p className="text-xs font-bold text-gray-200 truncate">{h.name}</p>
                      </div>

                      <button
                        onClick={() => handleSpeaker(h.userId, 'allow-speaker')}
                        className="text-[10px] font-bold bg-amber-600 hover:bg-amber-500 text-white px-2 py-1 rounded shrink-0 transition"
                      >
                        Allow Mic
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {activeSpeakerIds.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Active Speakers</p>

                  {isHost && (
                    <button
                      onClick={() => handleSpeaker(null, 'revoke-all-speakers')}
                      className="text-[10px] text-gray-500 hover:text-red-400 underline"
                    >
                      Revoke All
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {activeSpeakerIds.map(sid => {
                    const studentData = roomData.attendance.find(a => String(a.student) === sid);

                    return (
                      <div key={sid} className="flex justify-between items-center bg-gray-800 p-2 rounded">
                        <p className="text-xs font-semibold text-gray-200 truncate">
                          {studentData?.name || 'Student'}
                        </p>

                        {isHost && (
                          <button
                            onClick={() => handleSpeaker(sid, 'revoke-speaker')}
                            className="text-gray-500 hover:text-red-400 p-1"
                          >
                            <FiVideoOff size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


            {(() => {
              const students = roomData?.attendance || [];
              const activeStudents = students.filter(a => activeIds.includes(String(a.student)));
              const inactiveStudents = students.filter(a => !activeIds.includes(String(a.student)));

              return (
                <>
                  {/* Counters */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-gray-800 rounded-xl border border-gray-700 text-center">
                      <p className="text-lg font-bold text-white leading-none">{students.length}</p>
                      <p className="text-[9px] text-gray-400 uppercase mt-1">Total Joined</p>
                    </div>
                    <div className="p-3 bg-gray-800 rounded-xl border border-green-900/60 text-center">
                      <p className="text-lg font-bold text-green-400 leading-none">{activeStudents.length}</p>
                      <p className="text-[9px] text-gray-400 uppercase mt-1">Active</p>
                    </div>
                    <div className="p-3 bg-gray-800 rounded-xl border border-gray-700 text-center">
                      <p className="text-lg font-bold text-gray-400 leading-none">{inactiveStudents.length}</p>
                      <p className="text-[9px] text-gray-400 uppercase mt-1">Left</p>
                    </div>
                  </div>

                  {/* Names are visible to Trainer/Admin only */}
                  {isHost && (
                    <>
                      <div>
                        <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-2">
                          Active Students ({activeStudents.length})
                        </p>
                        <div className="space-y-2">
                          {activeStudents.length === 0 && (
                            <p className="text-xs text-gray-500">No students are in the class right now.</p>
                          )}
                          {activeStudents.map(a => (
                            <div key={String(a.student)} className="flex items-center gap-2 bg-gray-800 p-2 rounded">
                              <span className="h-2 w-2 rounded-full bg-green-500 shrink-0"></span>
                              <p className="text-xs font-semibold text-gray-200 truncate">{a.name || 'Student'}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                          Not Active ({inactiveStudents.length})
                        </p>
                        <div className="space-y-2">
                          {inactiveStudents.length === 0 && (
                            <p className="text-xs text-gray-500">Nobody has left.</p>
                          )}
                          {inactiveStudents.map(a => (
                            <div key={String(a.student)} className="flex items-center gap-2 bg-gray-800/60 p-2 rounded opacity-70">
                              <span className="h-2 w-2 rounded-full bg-gray-500 shrink-0"></span>
                              <p className="text-xs font-semibold text-gray-300 truncate">{a.name || 'Student'}</p>
                              {a.firstJoinedAt && (
                                <span className="ml-auto text-[9px] text-gray-500 shrink-0">
                                  Joined {new Date(a.firstJoinedAt).toLocaleTimeString([], { timeStyle: 'short' })}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </>
              );
            })()}

          </div>
        )}


      </div>
    </div>
  );
};


export default LiveClassroom;