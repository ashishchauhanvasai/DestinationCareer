import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant
} from '@livekit/components-react';
import '@livekit/components-styles';
import {
  FiSend, FiMessageSquare, FiBarChart2, FiUsers, FiBell,
  FiVideo, FiVideoOff, FiMic, FiMicOff, FiLock, FiUnlock,
  FiCircle, FiPause, FiPlay, FiDownload, FiX, FiMonitor,
  FiChevronLeft, FiChevronRight, FiPower
} from 'react-icons/fi';

const API = `${process.env.REACT_APP_API_URL}/api`;
const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const REC_VIDEO_BPS = 800000;
const REC_FPS = 15;
const WARN_BEFORE_MS = 5 * 60 * 1000;

const LK_OPTIONS = {
  adaptiveStream: true,
  dynacast: true,
  publishDefaults: {
    videoSimulcast: true,
    screenShareSimulcast: true,
  }
};

const VideoStage = React.memo(() => (
  <>
    <VideoConference />
    <RoomAudioRenderer />
  </>
));

const PresenceReporter = ({ onChange }) => {
  const participants = useParticipants();
  const key = participants.map(p => p.identity).sort().join(',');

  useEffect(() => {
    onChange(key ? key.split(',') : []);
  }, [key]); 
  return null;
};

const useIsDesktop = () => {
  const query = '(min-width: 768px)';
  const [match, setMatch] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(query).matches
  );
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(query);
    const onChange = (e) => setMatch(e.matches);
    setMatch(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);
  return match;
};

const PublisherControls = () => {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();
  const [busyMic, setBusyMic] = useState(false);
  const [busyCam, setBusyCam] = useState(false);
  const [busyScreen, setBusyScreen] = useState(false);

  const isDesktopScreenShareSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getDisplayMedia && !/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  const toggleMic = async () => {
    if (!localParticipant || busyMic) return;
    setBusyMic(true);
    try { await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled); } 
    catch (err) { alert('Microphone error: Please allow permissions.'); } 
    finally { setBusyMic(false); }
  };

  const toggleCam = async () => {
    if (!localParticipant || busyCam) return;
    setBusyCam(true);
    try { await localParticipant.setCameraEnabled(!isCameraEnabled); } 
    catch (err) { alert('Camera error: Please allow permissions.'); } 
    finally { setBusyCam(false); }
  };

  const toggleScreen = async () => {
    if (!localParticipant || busyScreen) return;
    setBusyScreen(true);
    try { await localParticipant.setScreenShareEnabled(!isScreenShareEnabled, { audio: true }); } 
    catch (err) { if (err?.name !== 'NotAllowedError') alert('Could not start screen share'); } 
    finally { setBusyScreen(false); }
  };

  return (
    <div className="h-[72px] bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-3 px-4 shrink-0 z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <button onClick={toggleMic} disabled={busyMic} className={`flex items-center gap-2 text-[11px] font-extrabold px-4 py-2.5 rounded-xl border transition-all shadow-sm ${isMicrophoneEnabled ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-red-900/30 border-red-800/50 text-red-400 hover:bg-red-900/50'}`}>
        {isMicrophoneEnabled ? <FiMic size={16} className="text-green-400" /> : <FiMicOff size={16} />}
        <span>{isMicrophoneEnabled ? 'Mute Mic' : 'Unmute Mic'}</span>
      </button>

      <button onClick={toggleCam} disabled={busyCam} className={`flex items-center gap-2 text-[11px] font-extrabold px-4 py-2.5 rounded-xl border transition-all shadow-sm ${isCameraEnabled ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-red-900/30 border-red-800/50 text-red-400 hover:bg-red-900/50'}`}>
        {isCameraEnabled ? <FiVideo size={16} className="text-green-400" /> : <FiVideoOff size={16} />}
        <span>{isCameraEnabled ? 'Stop Cam' : 'Start Cam'}</span>
      </button>

      {isDesktopScreenShareSupported && (
        <button onClick={toggleScreen} disabled={busyScreen} className={`flex items-center gap-2 text-[11px] font-extrabold px-4 py-2.5 rounded-xl border transition-all shadow-sm ${isScreenShareEnabled ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-transparent text-white' : 'bg-slate-800 border-slate-700 text-gray-200 hover:bg-slate-700'}`}>
          <FiMonitor size={16} />
          <span className="hidden sm:inline">{isScreenShareEnabled ? 'Stop Sharing' : 'Share Screen'}</span>
        </button>
      )}
    </div>
  );
};

const LiveClassroom = () => {
  const { batchCode } = useParams();
  const navigate = useNavigate();

  const [lkToken, setLkToken] = useState('');
  const [lkUrl, setLkUrl] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('chat');
  const [chatInput, setChatInput] = useState('');

  const [pollForm, setPollForm] = useState({ question: '', opt1: '', opt2: '', opt3: '' });
  const [pollOptions, setPollOptions] = useState(['opt1', 'opt2']);
  const [busyHand, setBusyHand] = useState(false); 
  const [activeIds, setActiveIds] = useState([]);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const isDesktop = useIsDesktop();
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [seenAt, setSeenAt] = useState(0);

  const [recorder, setRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const recordedChunks = useRef([]);
  const recStreamsRef = useRef([]);
  const recAudioCtxRef = useRef(null);

  const [gate, setGate] = useState(null);
  const [tick, setTick] = useState(Date.now());
  const serverOffset = useRef(0);
  const retryLock = useRef(false);
  const rejoinLock = useRef(false);
  const joinedStatus = useRef('');

  const chatMessages = roomData?.messages || [];
  const lastMsgMs = chatMessages.length ? new Date(chatMessages[chatMessages.length - 1].createdAt).getTime() : 0;
  const chatVisible = activeTab === 'chat' && (isDesktop ? !chatCollapsed : showMobileSidebar);

  useEffect(() => { if (chatVisible) setSeenAt(lastMsgMs); }, [chatVisible, lastMsgMs]);
  const unread = chatVisible ? 0 : chatMessages.filter(m => new Date(m.createdAt).getTime() > seenAt && m.senderId !== user?._id).length;

  const joinClass = useCallback(async () => {
    try {
      const res = await axios.post(`${API}/online-classes/${batchCode}/join`, {}, cfg());
      if (res.data.serverTime) serverOffset.current = new Date(res.data.serverTime).getTime() - Date.now();
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
      alert(data?.message || 'Failed to join class. Ensure you are logged in.');
      navigate('/login');
    }
  }, [batchCode, navigate]);

  useEffect(() => { joinClass(); }, [joinClass]);

  useEffect(() => {
    if (gate?.type !== 'NOT_STARTED') return;
    const t = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, [gate]);

  useEffect(() => {
    if (gate?.type !== 'NOT_STARTED') return;
    const remaining = new Date(gate.scheduledTime).getTime() - (tick + serverOffset.current);
    if (remaining <= 0 && !retryLock.current) {
      retryLock.current = true;
      joinClass().finally(() => setTimeout(() => { retryLock.current = false; }, 3000));
    }
  }, [tick, gate, joinClass]);

  const fetchRoomState = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API}/online-classes/${batchCode}/state`, cfg());
      if (res.data.serverTime) serverOffset.current = new Date(res.data.serverTime).getTime() - Date.now();

      const prevStatus = joinedStatus.current;
      joinedStatus.current = res.data.status; 

      if (res.data.status === 'ended' || (prevStatus === 'live' && res.data.status === 'scheduled')) {
        setGate({ type: 'ENDED', title: res.data.title, subject: res.data.subject, scheduledTime: res.data.scheduledTime });
        setUser(null); 
        return;
      }

      setRoomData(res.data);
      if (!isHost) {
        const isNowAllowed = (res.data.allowedSpeakers || []).includes(String(user._id));
        if (isNowAllowed !== canSpeak && !rejoinLock.current) {
          rejoinLock.current = true;
          try {
            const joinRes = await axios.post(`${API}/online-classes/${batchCode}/join`, {}, cfg());
            setLkToken(joinRes.data.livekitToken);
            setCanSpeak(isNowAllowed);
          } catch (err) {} 
          finally { setTimeout(() => { rejoinLock.current = false; }, 3000); }
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchRoomState, 1500);
    return () => clearInterval(interval);
  }, [batchCode, user, isHost, canSpeak]);

  const cleanupRecording = () => {
    recStreamsRef.current.forEach(st => st.getTracks().forEach(t => t.stop()));
    recStreamsRef.current = [];
    if (recAudioCtxRef.current) { recAudioCtxRef.current.close().catch(() => {}); recAudioCtxRef.current = null; }
  };

  const startRecording = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: REC_FPS, max: REC_FPS } }, audio: true });
      recStreamsRef.current = [displayStream];
      const screenTrack = displayStream.getVideoTracks()[0];
      if (screenTrack && 'contentHint' in screenTrack) screenTrack.contentHint = 'detail';
      let micStream = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        recStreamsRef.current.push(micStream);
      } catch (e) { alert('Microphone not available - recording will have no trainer voice.'); }
      
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      recAudioCtxRef.current = audioCtx;
      const dest = audioCtx.createMediaStreamDestination();

      if (micStream && micStream.getAudioTracks().length) audioCtx.createMediaStreamSource(micStream).connect(dest);
      if (displayStream.getAudioTracks().length) audioCtx.createMediaStreamSource(new MediaStream(displayStream.getAudioTracks())).connect(dest);

      const mixedStream = new MediaStream([...displayStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
      const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t));
      const mediaRecorder = new MediaRecorder(mixedStream, { mimeType, videoBitsPerSecond: REC_VIDEO_BPS, audioBitsPerSecond: 64000 });

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${batchCode}_Class_Recording.webm`; a.click();
        recordedChunks.current = []; cleanupRecording(); setIsRecording(false); setIsPaused(false);
      };

      displayStream.getVideoTracks()[0].onended = () => { if (mediaRecorder.state !== 'inactive') mediaRecorder.stop(); };
      mediaRecorder.start(1000); setRecorder(mediaRecorder); setIsRecording(true); setIsPaused(false);
    } catch (err) { cleanupRecording(); alert('Failed to start recording. Please allow permissions.'); }
  };

  const pauseRecording = () => { if (recorder && recorder.state === 'recording') { recorder.pause(); setIsPaused(true); } };
  const resumeRecording = () => { if (recorder && recorder.state === 'paused') { recorder.resume(); setIsPaused(false); } };
  const stopRecording = () => { if (recorder && (recorder.state === 'recording' || recorder.state === 'paused')) { recorder.stop(); } };

  const sendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msgText = chatInput;
    setChatInput('');
    try { await axios.post(`${API}/online-classes/${batchCode}/chat`, { text: msgText }, cfg()); fetchRoomState(); } 
    catch (err) { alert(err.response?.data?.message || 'Cannot send message'); }
  };

  const toggleChatStatus = async () => {
    if (!isHost) return;
    try { await axios.post(`${API}/online-classes/${batchCode}/controls`, { action: 'toggle-chat', chatEnabled: !roomData.chatEnabled }, cfg()); fetchRoomState(); } 
    catch (e) {}
  };

  const createPoll = async (e) => {
    e.preventDefault();
    const validOptions = pollOptions.map(key => pollForm[key]).filter(val => val && val.trim() !== '');
    if (validOptions.length < 2) return alert('Provide at least 2 options');
    try {
      await axios.post(`${API}/online-classes/${batchCode}/polls`, { question: pollForm.question, options: validOptions }, cfg());
      setPollForm({ question: '', opt1: '', opt2: '' }); setPollOptions(['opt1', 'opt2']); fetchRoomState(); alert('Poll launched!');
    } catch (e) { alert('Failed to create poll'); }
  };

  const addPollOption = () => setPollOptions([...pollOptions, `opt${pollOptions.length + 1}`]);
  const removePollOption = (indexToRemove) => {
    if (pollOptions.length <= 2) return alert('Minimum 2 options required.');
    setPollOptions(pollOptions.filter((_, i) => i !== indexToRemove));
  };

  const votePoll = async (pollId, optionIndex) => {
    const poll = roomData?.polls?.find(p => p._id === pollId);
    const myVote = poll?.votes.find(v => v.userId === user?._id);
    const changeVote = !!myVote;
    if (changeVote && myVote.optionIndex === optionIndex) return;
    try { await axios.post(`${API}/online-classes/${batchCode}/polls/${pollId}/vote`, { optionIndex, changeVote }, cfg()); fetchRoomState(); } 
    catch (e) { alert(e.response?.data?.message || 'Failed to cast vote'); }
  };

  const toggleHandRaise = async () => {
    if (busyHand) return; 
    setBusyHand(true);
    try { await axios.post(`${API}/online-classes/${batchCode}/hand`, {}, cfg()); fetchRoomState(); } 
    catch (e) {} finally { setTimeout(() => setBusyHand(false), 2000); }
  };

  const handleSpeaker = async (studentId, actionType) => {
    try { await axios.post(`${API}/online-classes/${batchCode}/controls`, { action: actionType, studentId }, cfg()); fetchRoomState(); } 
    catch (e) { alert('Action failed'); }
  };

  const kickStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to remove this student from the class?")) return;
    try { await axios.post(`${API}/online-classes/${batchCode}/kick`, { participantIdentity: studentId }, cfg()); alert("Student removed successfully."); fetchRoomState(); } 
    catch (err) { alert("Could not remove student."); }
  };

  const extendClass = async (minutes) => {
    try { await axios.post(`${API}/online-classes/${batchCode}/controls`, { action: 'extend', minutes }, cfg()); fetchRoomState(); } 
    catch (e) { alert(e.response?.data?.message || 'Could not extend the class'); }
  };

  const endClass = async () => {
    if (!isHost) return;
    const currentHour = new Date().getHours();
    const isLateNight = currentHour >= 20;
    let message = 'End this class for everyone? Students will be disconnected instantly.';
    if (isLateNight) message += '\n\nThe batch will be preserved and available for tomorrow\'s session.';
    if (!window.confirm(message)) return;
    try { await axios.post(`${API}/online-classes/${batchCode}/controls`, { action: 'status', status: 'ended', preserveBatch: isLateNight }, cfg()); } 
    catch (e) { alert(e.response?.data?.message || 'Failed to end class'); }
  };

  if (gate) {
    const startMs = new Date(gate.scheduledTime).getTime();
    const remaining = Math.max(0, startMs - (tick + serverOffset.current));
    const d = Math.floor(remaining / 86400000); const h = Math.floor((remaining % 86400000) / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000); const s = Math.floor((remaining % 60000) / 1000);
    const box = (val, label) => (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-4 md:px-6 md:py-5 min-w-[70px] shadow-sm">
        <p className="text-3xl md:text-5xl font-black text-white tabular-nums tracking-tight">{String(val).padStart(2, '0')}</p>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-extrabold mt-2">{label}</p>
      </div>
    );

    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-[#0f172a] text-white px-4 text-center relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none"></div>
        
        <div className="glass-panel bg-slate-900 p-10 md:p-12 rounded-[3rem] border border-slate-700 shadow-xl relative z-10 animate-fade-in max-w-xl w-full">
          <h1 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">{gate.title}</h1>
          {gate.subject && <p className="text-sm font-medium text-gray-400 mb-8">{gate.subject}</p>}

          {gate.type === 'NOT_STARTED' ? (
            <>
              <p className="text-blue-400 font-extrabold uppercase tracking-widest text-[11px] mb-6 bg-blue-900/30 px-4 py-2 rounded-lg inline-block border border-blue-800/50 shadow-sm">Class starting soon</p>
              <div className="flex justify-center gap-3 md:gap-4 mb-8">
                {d > 0 && box(d, 'Days')}
                {box(h, 'Hours')}
                {box(m, 'Mins')}
                {box(s, 'Secs')}
              </div>
              <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-xs mx-auto">
                Starts at {new Date(gate.scheduledTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.<br/>You will join automatically when the timer ends.
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-900/30 text-red-500 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 border border-red-800/50 shadow-sm"><FiPower size={32}/></div>
              <p className="text-red-400 font-black text-2xl mb-3 tracking-tight">Session Closed</p>
              <p className="text-[13px] text-gray-400 font-medium mb-8 leading-relaxed">
                {isHost ? "You have ended this class." : "This class has ended. Please contact your trainer for the next session."}
              </p>
            </>
          )}

          <button onClick={() => navigate(isHost ? '/trainer' : '/')} className="w-full mt-2 glass-button bg-slate-800 hover:bg-slate-700 border border-slate-700 px-6 py-4 rounded-xl text-[15px] font-extrabold transition-all shadow-sm">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="h-[100dvh] flex items-center justify-center bg-[#09090b] text-gray-400 font-extrabold text-xl animate-pulse">Joining Live Classroom...</div>;
  if (!lkToken || !lkUrl) return <div className="h-[100dvh] flex items-center justify-center bg-[#09090b] text-red-500 font-extrabold text-xl">Connection Failed.</div>;

  const isHandRaised = (roomData?.raisedHands || []).some(h => String(h.userId) === String(user?._id));
  const activeHands = (roomData?.raisedHands || []).filter(h => activeIds.includes(String(h.userId)));
  const activeSpeakerIds = (roomData?.allowedSpeakers || []).filter(id => activeIds.includes(String(id)));
  const endMs = roomData?.scheduledTime ? new Date(roomData.scheduledTime).getTime() + (roomData.durationMinutes || 60) * 60000 : 0;

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-[#09090b] text-gray-100 overflow-hidden font-sans relative">
      <style>{`
        .lk-video-conference .lk-control-bar, .lk-video-conference .lk-chat { display: none !important; }
        .lk-video-conference { height: 100% !important; width: 100% !important; background: transparent !important; }
        .lk-video-container, .lk-participant-tile { touch-action: pan-x pan-y pinch-zoom !important; }
        .lk-participant-tile video { touch-action: pan-x pan-y pinch-zoom !important; pointer-events: auto !important; object-fit: contain !important; border-radius: 1.5rem !important; }
      `}</style>

      <div className="flex-1 flex flex-col relative w-full h-full min-h-0 overflow-hidden">
        {/* Dark Header */}
        <div className="h-[72px] bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 md:px-6 z-20 shrink-0 shadow-sm">
          <div className="flex items-center gap-3 md:gap-4">
            <span className="flex h-3 w-3 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h1 className="font-extrabold text-white tracking-tight text-[15px] md:text-lg truncate max-w-[150px] md:max-w-sm">
              {roomData?.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setShowMobileSidebar(true)} className="md:hidden flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white shadow-sm transition">
              <FiMessageSquare size={16}/> Chat
              {unread > 0 && <span className="min-w-[20px] h-5 px-1 rounded-md bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{unread > 99 ? '99+' : unread}</span>}
            </button>

            {isHost && (
              <div className="flex items-center bg-slate-800 rounded-[1rem] p-1.5 border border-slate-700 shadow-inner">
                {!isRecording ? (
                  <button onClick={startRecording} className="flex items-center gap-2 text-[11px] font-extrabold px-3 py-1.5 rounded-lg hover:bg-slate-700 text-gray-200 transition uppercase tracking-wider">
                    <FiCircle className="text-red-500 fill-current" /> <span className="hidden md:inline">Record</span>
                  </button>
                ) : (
                  <>
                    {isPaused ? (
                      <button onClick={resumeRecording} className="flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition mr-1 uppercase tracking-wider">
                        <FiPlay size={14}/> <span className="hidden sm:inline">Resume</span>
                      </button>
                    ) : (
                      <button onClick={pauseRecording} className="flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-500 transition mr-1 uppercase tracking-wider">
                        <FiPause size={14}/> <span className="hidden sm:inline">Pause</span>
                      </button>
                    )}
                    <button onClick={stopRecording} className="flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-500 transition uppercase tracking-wider">
                      <FiDownload size={14}/> <span className="hidden sm:inline">Save</span>
                    </button>
                    <span className="hidden md:inline text-[10px] text-red-500 animate-pulse ml-3 font-extrabold uppercase tracking-widest px-2">● REC</span>
                  </>
                )}
              </div>
            )}

            {!isHost && (
              <button onClick={toggleHandRaise} disabled={busyHand} className={`flex items-center gap-2 text-[11px] font-extrabold px-4 py-2.5 rounded-xl shadow-sm transition uppercase tracking-wider ${isHandRaised ? 'bg-amber-900/30 text-amber-400 border border-amber-800/50 animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'}`}>
                <FiBell size={16}/> <span>{isHandRaised ? 'Lower Hand' : 'Raise Hand'}</span>
              </button>
            )}

            {isHost && endMs > 0 && (Date.now() + serverOffset.current) > (endMs - WARN_BEFORE_MS) && (
              <div className="flex items-center gap-2 bg-red-900/30 px-3 py-2 rounded-xl border border-red-800/50 shadow-sm">
                <span className="text-[10px] text-red-400 font-extrabold uppercase tracking-wider mr-1 animate-pulse hidden md:inline">Ending Soon</span>
                <button onClick={() => extendClass(15)} className="text-[10px] font-extrabold bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg text-white transition border border-slate-700 shadow-sm">+15m</button>
                <button onClick={endClass} className="text-[10px] font-extrabold bg-red-600 hover:bg-red-500 px-2.5 py-1.5 rounded-lg text-white flex items-center gap-1.5 transition shadow-sm"><FiPower /> End</button>
              </div>
            )}

            <button onClick={() => navigate(isHost ? '/trainer' : '/')} className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all shadow-sm">
              Leave
            </button>
          </div>
        </div>

        <div className="flex-1 relative bg-transparent flex flex-col min-h-0 overflow-hidden p-2 md:p-4">
            <LiveKitRoom
            key={isHost ? 'host' : canSpeak ? 'speaker' : 'viewer'}
            video={isHost} audio={isHost || canSpeak} token={lkToken} serverUrl={lkUrl}
            data-lk-theme="default"
            className="flex-1 flex flex-col min-h-0 w-full h-full overflow-hidden"
            options={LK_OPTIONS}
            onDisconnected={() => {
              setGate({ type: 'ENDED', title: roomData?.title || 'Class', subject: roomData?.subject || '', scheduledTime: roomData?.scheduledTime });
              setUser(null);
            }}
          >
            <div className="flex-1 relative min-h-0 w-full overflow-hidden">
              <VideoStage />
              <PresenceReporter onChange={setActiveIds} />
            </div>
            {(isHost || canSpeak) && <PublisherControls />}
          </LiveKitRoom>
        </div>
      </div>

      {/* Solid Dark Sidebar */}
      <div className={`
        fixed bottom-0 left-0 w-full h-[65dvh] z-50 bg-slate-900 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-slate-800 transform transition-transform duration-300 flex flex-col
        md:relative md:h-full md:rounded-none md:shadow-none md:translate-y-0 md:border-l md:border-t-0 border-slate-800 shrink-0
        ${chatCollapsed ? 'md:w-16' : 'md:w-[400px]'}
        ${showMobileSidebar ? 'translate-y-0' : 'translate-y-full'}
      `}>
        {chatCollapsed && (
          <button onClick={() => setChatCollapsed(false)} className="hidden md:flex flex-col items-center gap-4 py-6 w-full h-full text-gray-500 hover:text-white hover:bg-slate-800 transition-colors">
            <FiChevronLeft size={20} />
            <FiMessageSquare size={20} />
            {unread > 0 && <span className="min-w-[24px] h-6 px-1.5 rounded-md bg-red-500 text-white text-[11px] font-bold flex items-center justify-center shadow-md">{unread > 99 ? '99+' : unread}</span>}
            {isHost && activeHands.length > 0 && <span className="min-w-[24px] h-6 px-1.5 rounded-md bg-amber-600 text-white text-[11px] font-bold flex items-center justify-center animate-pulse shadow-md">✋{activeHands.length}</span>}
          </button>
        )}

        <div className={`flex-1 flex flex-col min-h-0 ${chatCollapsed ? 'md:hidden' : ''}`}>
          <div className="flex border-b border-slate-800 p-3 gap-2 shrink-0 items-center bg-slate-900">
            {[
              { id: 'chat', icon: <FiMessageSquare size={16}/>, label: 'Chat' },
              { id: 'polls', icon: <FiBarChart2 size={16}/>, label: 'Polls' },
              { id: 'people', icon: <FiUsers size={16}/>, label: isHost && activeHands.length > 0 ? `Hands (${activeHands.length})` : 'People' }
            ].map(t => (
              <button
                key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all ${activeTab === t.id ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-gray-500 hover:bg-slate-800 hover:text-gray-300 border border-transparent'}`}
              >
                {t.icon} <span>{t.label}</span>
                {t.id === 'chat' && unread > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-md bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">{unread > 99 ? '99+' : unread}</span>}
              </button>
            ))}

            <button onClick={() => setChatCollapsed(true)} className="hidden md:flex p-3 text-gray-500 hover:text-white ml-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors shadow-sm"><FiChevronRight size={18} /></button>
            <button onClick={() => setShowMobileSidebar(false)} className="md:hidden p-3 text-gray-500 hover:text-white ml-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors shadow-sm"><FiX size={18} /></button>
          </div>

          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0 bg-transparent">
              {roomData?.pinnedAnnouncement && (
                <div className="bg-blue-900/30 border-b border-blue-800/50 p-4 shrink-0 shadow-inner">
                  <p className="text-[10px] text-blue-400 font-extrabold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">📌 Pinned Announcement</p>
                  <p className="text-sm text-blue-100 font-medium leading-relaxed">{roomData.pinnedAnnouncement}</p>
                </div>
              )}

              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
                {roomData?.messages?.map((msg, i) => {
                  const isMe = msg.senderId === user._id;
                  const isT = msg.senderRole === 'Trainer';
                  return (
                    <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-baseline gap-2 mb-1.5 px-1">
                        <span className={`text-[10px] font-extrabold tracking-wide uppercase ${isT ? 'text-amber-400' : 'text-gray-500'}`}>
                          {isMe ? 'You' : msg.senderName} {isT && '(Trainer)'}
                        </span>
                        <span className="text-[9px] text-gray-600 font-medium">{new Date(msg.createdAt).toLocaleTimeString([], { timeStyle: 'short' })}</span>
                      </div>
                      <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-[13px] shadow-sm break-words font-medium leading-relaxed border ${isMe ? 'bg-blue-600 text-white rounded-tr-sm border-blue-600' : isT ? 'bg-amber-900/20 text-amber-50 border-amber-800/50 rounded-tl-sm' : 'bg-slate-800 text-gray-100 rounded-tl-sm border-slate-700'}`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
                {isHost && (
                  <button onClick={toggleChatStatus} className="text-[10px] text-gray-500 hover:text-white mb-3 flex items-center gap-1.5 font-extrabold uppercase tracking-wider transition-colors">
                    {roomData?.chatEnabled ? <><FiUnlock size={14}/> Lock Chat</> : <><FiLock size={14}/> Unlock Chat</>}
                  </button>
                )}

                {roomData?.chatEnabled || isHost ? (
                  <form onSubmit={sendChat} className="relative">
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message..." className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-4 pr-12 py-3.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-slate-800 shadow-inner transition-colors" />
                    <button type="submit" disabled={!chatInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 text-white rounded-[0.5rem] disabled:opacity-50 hover:bg-blue-500 transition-colors shadow-sm">
                      <FiSend size={14} />
                    </button>
                  </form>
                ) : (
                  <div className="bg-red-900/30 text-center py-3.5 rounded-xl border border-red-800/50 text-[11px] font-extrabold uppercase tracking-wider text-red-400 flex items-center justify-center gap-2 shadow-inner">
                    <FiLock size={14}/> Chat disabled by Trainer
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'polls' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-6 bg-transparent">
              {isHost && (
                <form onSubmit={createPoll} className="bg-slate-800 p-5 rounded-[1.5rem] border border-slate-700 space-y-4 shrink-0 shadow-inner">
                  <p className="text-[11px] font-extrabold text-blue-400 uppercase tracking-widest flex items-center gap-2"><FiBarChart2/> Create Poll</p>
                  <input required placeholder="Ask a question..." value={pollForm.question || ''} onChange={e => setPollForm({ ...pollForm, question: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-medium shadow-inner" />
                  <div className="space-y-2.5">
                    {pollOptions.map((optKey, index) => (
                      <div key={index} className="flex gap-2">
                        <input required={index < 2} placeholder={`Option ${index + 1}`} value={pollForm[optKey] || ''} onChange={(e) => setPollForm({ ...pollForm, [optKey]: e.target.value })} className="flex-1 p-3 border border-slate-700 rounded-xl bg-slate-900 text-white text-sm focus:outline-none focus:border-blue-500 font-medium shadow-inner" />
                        {index >= 2 && <button type="button" onClick={() => removePollOption(index)} className="px-4 bg-red-900/30 text-red-400 border border-red-800/50 rounded-xl hover:bg-red-600 hover:text-white transition-colors text-xs font-extrabold shadow-sm"><FiX size={16}/></button>}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addPollOption} className="w-full p-3 bg-slate-700 text-gray-300 border border-slate-600 rounded-xl hover:bg-slate-600 transition-colors text-[11px] font-extrabold uppercase tracking-wider shadow-sm">
                    + Add Option
                  </button>
                  <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 rounded-xl text-[13px] font-extrabold uppercase tracking-wider hover:scale-[0.98] transition-transform text-white mt-2 shadow-sm">
                    Launch Poll
                  </button>
                </form>
              )}

              {roomData?.polls?.slice().reverse().map((poll) => {
                const totalVotes = poll.votes.length;
                const myVote = poll.votes.find(v => String(v.userId) === String(user._id));
                return (
                  <div key={poll._id} className={`p-5 rounded-[1.5rem] border shadow-sm ${poll.isActive ? 'bg-blue-900/20 border-blue-800/50' : 'bg-slate-800 border-slate-700 opacity-70'}`}>
                    <div className="flex justify-between items-start mb-5 gap-4">
                      <p className="font-extrabold text-[15px] text-white leading-snug tracking-tight">{poll.question}</p>
                      <span className={`text-[9px] px-2.5 py-1 rounded-md font-extrabold uppercase tracking-wider shrink-0 border shadow-sm ${poll.isActive ? 'bg-green-900/30 text-green-400 border-green-800/50' : 'bg-slate-700 text-gray-400 border-slate-600'}`}>
                        {poll.isActive ? 'Live' : 'Closed'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {poll.options.map((opt, oIdx) => {
                        const votesForOpt = poll.votes.filter(v => v.optionIndex === oIdx).length;
                        const percent = totalVotes > 0 ? Math.round((votesForOpt / totalVotes) * 100) : 0;
                        const hasVotedThis = myVote?.optionIndex === oIdx;
                        return (
                          <button key={oIdx} disabled={!poll.isActive} onClick={() => votePoll(poll._id, oIdx)} className="w-full text-left relative overflow-hidden bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-sm flex justify-between group disabled:cursor-default transition-colors hover:border-slate-600 shadow-inner">
                            <div className={`absolute top-0 left-0 h-full transition-all duration-700 ease-out ${hasVotedThis ? 'bg-blue-600/40' : 'bg-slate-800'}`} style={{ width: `${(myVote || isHost || !poll.isActive) ? percent : 0}%` }} />
                            <span className="relative z-10 text-gray-100 font-bold truncate pr-4">{opt}</span>
                            {(myVote || isHost || !poll.isActive) && <span className="relative z-10 font-extrabold text-white">{percent}%</span>}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest text-right mt-4">{totalVotes} votes</p>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'people' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6 bg-transparent">
              {isHost && activeHands.length > 0 && (
                <div className="bg-amber-900/20 border border-amber-800/50 rounded-[1.5rem] p-5 shadow-sm">
                  <p className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2"><FiBell size={14}/> Raised Hands ({activeHands.length})</p>
                  <div className="space-y-3">
                    {activeHands.map(h => (
                      <div key={h.userId} className="flex justify-between items-center bg-slate-900 p-3.5 rounded-xl border border-slate-800 shadow-inner">
                        <p className="text-[13px] font-extrabold text-gray-200 truncate pr-3">{h.name}</p>
                        <button onClick={() => handleSpeaker(h.userId, 'allow-speaker')} className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg shrink-0 transition-colors shadow-sm">
                          Allow Mic/Cam
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSpeakerIds.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest">Active Speakers</p>
                    {isHost && <button onClick={() => handleSpeaker(null, 'revoke-all-speakers')} className="text-[10px] font-bold text-gray-500 hover:text-red-400 underline transition-colors">Revoke All</button>}
                  </div>
                  <div className="space-y-3">
                    {activeSpeakerIds.map(sid => {
                      const studentData = roomData.attendance.find(a => String(a.student) === sid);
                      return (
                        <div key={sid} className="flex justify-between items-center bg-slate-800 p-3.5 rounded-xl border border-slate-700 shadow-sm">
                          <p className="text-[13px] font-extrabold text-white truncate pr-3">{studentData?.name || 'Student'}</p>
                          {isHost && <button onClick={() => handleSpeaker(sid, 'revoke-speaker')} className="text-gray-400 hover:text-red-400 p-2 bg-slate-900 rounded-lg transition-colors border border-slate-800 shadow-inner"><FiVideoOff size={14} /></button>}
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
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-4 bg-slate-800 rounded-[1.2rem] border border-slate-700 text-center shadow-sm">
                        <p className="text-xl font-black text-white leading-none mb-1.5">{students.length}</p>
                        <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest">Joined</p>
                      </div>
                      <div className="p-4 bg-green-900/20 rounded-[1.2rem] border border-green-800/50 text-center shadow-sm">
                        <p className="text-xl font-black text-green-400 leading-none mb-1.5">{activeStudents.length}</p>
                        <p className="text-[9px] text-green-600 font-extrabold uppercase tracking-widest">Active</p>
                      </div>
                      <div className="p-4 bg-slate-900 rounded-[1.2rem] border border-slate-800 text-center shadow-inner">
                        <p className="text-xl font-black text-gray-500 leading-none mb-1.5">{inactiveStudents.length}</p>
                        <p className="text-[9px] text-gray-600 font-extrabold uppercase tracking-widest">Left</p>
                      </div>
                    </div>

                    {isHost && (
                      <div className="space-y-8 pt-4">
                        <div>
                          <p className="text-[10px] font-extrabold text-green-400 uppercase tracking-widest mb-4">Online Now ({activeStudents.length})</p>
                          <div className="space-y-3">
                            {activeStudents.length === 0 && <p className="text-[13px] text-gray-500 font-medium">No students inside right now.</p>}
                            {activeStudents.map(a => (
                              <div key={String(a.student)} className="flex items-center gap-4 bg-slate-800 p-3.5 rounded-xl border border-slate-700 shadow-sm">
                                <span className="h-2.5 w-2.5 rounded-full bg-green-500 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                                <p className="text-[13px] font-extrabold text-gray-200 truncate flex-1 tracking-tight">{a.name || 'Student'}</p>
                                <button onClick={() => kickStudent(String(a.student))} className="text-red-400 hover:text-white bg-red-900/30 hover:bg-red-600 p-2.5 rounded-[0.5rem] transition-colors border border-red-800/50 shadow-sm" title="Remove">
                                  <FiX size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-4">Offline ({inactiveStudents.length})</p>
                          <div className="space-y-3">
                            {inactiveStudents.length === 0 && <p className="text-[13px] text-gray-500 font-medium">Nobody has left.</p>}
                            {inactiveStudents.map(a => (
                              <div key={String(a.student)} className="flex items-center gap-4 bg-slate-900 p-3.5 rounded-xl border border-slate-800 opacity-70 shadow-inner">
                                <span className="h-2.5 w-2.5 rounded-full bg-gray-600 shrink-0"></span>
                                <p className="text-[13px] font-bold text-gray-400 truncate flex-1 tracking-tight">{a.name || 'Student'}</p>
                                {a.firstJoinedAt && <span className="text-[9px] font-extrabold text-gray-500 uppercase tracking-widest shrink-0">Joined {new Date(a.firstJoinedAt).toLocaleTimeString([], { timeStyle: 'short' })}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveClassroom;