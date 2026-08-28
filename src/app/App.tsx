import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { WaveformVisualizer } from './components/WaveformVisualizer';
import svgPaths from './imports/svg-m6c21sg1xd';

const MAX_WORDS = 2500;
const MAX_CHARS = 20000;
const REQUEST_TIMEOUT_MS = 30000;

// Voice configuration. `voiceName` is the Chirp 3 HD persona sent to the
// backend; it's validated there against an allowlist per accent.
const VOICES = {
  UK: [
    { id: 'mia-louise', name: 'Mia-Louise', gender: 'female', voiceName: 'Kore', avatar: '👩', color: 'bg-[#f6339a]', default: true },
    { id: 'freya', name: 'Freya', gender: 'female', voiceName: 'Zephyr', avatar: '👩', color: 'bg-[#f6339a]', default: false },
    { id: 'steve', name: 'Steve', gender: 'male', voiceName: 'Charon', avatar: '👨', color: 'bg-[#155dfc]', default: false },
    { id: 'oliver', name: 'Oliver', gender: 'male', voiceName: 'Fenrir', avatar: '👨', color: 'bg-[#155dfc]', default: false },
  ],
  US: [
    { id: 'phil', name: 'Phil', gender: 'male', voiceName: 'Orus', avatar: '👨', color: 'bg-[#155dfc]', default: true },
    { id: 'jake', name: 'Jake', gender: 'male', voiceName: 'Puck', avatar: '👨', color: 'bg-[#155dfc]', default: false },
    { id: 'nicole', name: 'Nicole', gender: 'female', voiceName: 'Leda', avatar: '👩', color: 'bg-[#f6339a]', default: false },
    { id: 'zara', name: 'Zara', gender: 'female', voiceName: 'Aoede', avatar: '👩', color: 'bg-[#f6339a]', default: false },
  ],
  IN: [
    { id: 'priya', name: 'Priya', gender: 'female', voiceName: 'Autonoe', avatar: '👩', color: 'bg-[#f6339a]', default: true },
    { id: 'ananya', name: 'Ananya', gender: 'female', voiceName: 'Callirrhoe', avatar: '👩', color: 'bg-[#f6339a]', default: false },
    { id: 'arjun', name: 'Arjun', gender: 'male', voiceName: 'Algieba', avatar: '👨', color: 'bg-[#155dfc]', default: false },
    { id: 'rohan', name: 'Rohan', gender: 'male', voiceName: 'Iapetus', avatar: '👨', color: 'bg-[#155dfc]', default: false },
  ],
};

export default function App() {
  const [text, setText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [accent, setAccent] = useState('US');
  const [selectedVoiceId, setSelectedVoiceId] = useState('nicole');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [filename, setFilename] = useState('my-narration.mp3');
  const [isEditingFilename, setIsEditingFilename] = useState(false);
  const [isInputSectionOpen, setIsInputSectionOpen] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [text]);

  // Auto-collapse input section when audio is generated
  useEffect(() => {
    if (audioUrl) {
      setIsInputSectionOpen(false);
    }
  }, [audioUrl]);

  // Update voice when accent changes
  useEffect(() => {
    const defaultVoice = VOICES[accent as keyof typeof VOICES].find(v => v.default);
    if (defaultVoice) {
      setSelectedVoiceId(defaultVoice.id);
    }
  }, [accent]);

  // Update time and duration
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [audioUrl]);

  const handleGenerate = async () => {
    const trimmedText = text.trim();

    if (!trimmedText) {
      toast.error('Please enter some text to narrate');
      return;
    }

    if (trimmedText.length > MAX_CHARS) {
      toast.error(`Text exceeds ${MAX_CHARS} character limit`);
      return;
    }

    if (wordCount > MAX_WORDS) {
      toast.error(`Text exceeds ${MAX_WORDS} word limit`);
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setAudioUrl(null);
    setAudioError(false);
    setIsPlaying(false);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const currentVoice = VOICES[accent as keyof typeof VOICES].find(v => v.id === selectedVoiceId);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d7dc0ecc/generate-speech`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            text: trimmedText,
            accent,
            voiceName: currentVoice?.voiceName,
            narrationStyle: 'one-speaker',
          }),
          signal: controller.signal,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate speech');
      }

      setAudioUrl(data.audioUrl);

      const firstWords = trimmedText.split(/\s+/).slice(0, 5).join('-').toLowerCase();
      const cleanFilename = firstWords.replace(/[^a-z0-9-]/g, '') + '.mp3';
      setFilename(cleanFilename);

      toast.success('Audio narration generated successfully!');

    } catch (error) {
      console.error('Error generating speech:', error);
      const message =
        error instanceof DOMException && error.name === 'AbortError'
          ? 'This is taking longer than expected. Please try again.'
          : error instanceof Error
            ? error.message
            : 'Failed to generate audio. Please try again.';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      clearTimeout(timeoutId);
      setIsGenerating(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleDownload = async () => {
    if (!audioUrl || isDownloading) return;

    // The audio URL is a cross-origin Supabase signed URL; browsers ignore
    // the <a download> attribute for cross-origin hrefs and just navigate
    // to it instead. Fetching the audio and downloading from a same-origin
    // blob: URL makes the download attribute (and our chosen filename)
    // actually take effect.
    setIsDownloading(true);
    try {
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error('Failed to fetch audio');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download audio. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAudioError = () => {
    setAudioError(true);
    toast.error('This audio link has expired. Please regenerate the narration.');
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isOverLimit = wordCount > MAX_WORDS || text.length > MAX_CHARS;
  const currentVoice = VOICES[accent as keyof typeof VOICES].find(v => v.id === selectedVoiceId);

  return (
    <>
      <Toaster theme="dark" />
      <div className="min-h-screen bg-[#0a0f1e] relative overflow-hidden">
        {/* Sparkle decorations */}
        <div className="absolute top-[80px] left-[407px]">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 32 32">
            <path d={svgPaths.p34923fc0} stroke="#00D3F2" strokeOpacity="0.2" strokeWidth="2.67" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="absolute top-[95px] left-[343px]">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 48 48">
            <path d={svgPaths.p22ef7500} stroke="#C27AFF" strokeOpacity="0.2" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="absolute top-[180px] left-[300px]">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
            <path d={svgPaths.p259cb680} stroke="#51A2FF" strokeOpacity="0.2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-4xl relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-3">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 40 41">
                <path d={svgPaths.p3be4ee00} stroke="#00D3F2" strokeWidth="3.33" strokeLinecap="round" strokeLinejoin="round" />
                <path d={svgPaths.p12f12c80} stroke="#00D3F2" strokeWidth="3.33" strokeLinecap="round" strokeLinejoin="round" />
                <path d={svgPaths.p3abb3700} stroke="#00D3F2" strokeWidth="3.33" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h1 className="text-white text-[40px] leading-6 tracking-[-0.3125px] font-semibold">Studio Narrator</h1>
            </div>
            <p className="text-[#99a1af] text-base tracking-[-0.3125px]">
              Paste your story and bring to life with Google Chirp 3 HD voice.
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-[#1b1f28] rounded-[14px] shadow-[0_0_15px_#82E2F480] p-8">
            {/* Input Section Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-white text-xl tracking-[-0.45px] font-bold">Generate Narration</h2>
              </div>
              {audioUrl && (
                <button
                  onClick={() => setIsInputSectionOpen(!isInputSectionOpen)}
                  className="text-[#99a1af] hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
                    <path 
                      d={isInputSectionOpen ? "M15 12.5L10 7.5L5 12.5" : "M5 7.5L10 12.5L15 7.5"} 
                      stroke="currentColor" 
                      strokeWidth="1.67" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Collapsible Input Section */}
            {isInputSectionOpen && (
              <div className="space-y-6">
                {/* Text Input */}
                <div>
                  <label className="block text-gray-200 text-base mb-2">Story Text</label>
                  <textarea
                    placeholder="Once upon a time, in a land far away, there were two friends who became lovers..."
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      setErrorMessage(null);
                    }}
                    disabled={isGenerating}
                    className="w-full h-[200px] bg-[#292d33] rounded-lg px-3 py-2 text-white placeholder:text-[#6a7282] text-base resize-none focus:outline-none focus:border-[#00b8db] focus:ring-1 focus:ring-[#00b8db] disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <div className="flex justify-end mt-2">
                    <span className={`text-base ${isOverLimit ? 'text-red-400' : 'text-[#99a1af]'}`}>
                      {wordCount}/{MAX_WORDS} words
                    </span>
                  </div>
                </div>

                {errorMessage && (
                  <div className="bg-[rgba(220,38,38,0.1)] border border-red-500/50 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
                    <span className="text-red-400 text-base">{errorMessage}</span>
                    <button
                      onClick={handleGenerate}
                      className="shrink-0 text-red-300 hover:text-white border border-red-400/50 hover:border-red-300 rounded px-3 py-1 text-sm transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Voice Options Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Accent Selection */}
                  <div>
                    <label className="block text-gray-200 text-base mb-2">Accent</label>
                    <div className="space-y-2">
                      <button
                        onClick={() => setAccent('UK')}
                        disabled={isGenerating}
                        className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                          accent === 'UK'
                            ? 'bg-[rgba(0,184,219,0.2)] border-[#00b8db] shadow-lg'
                            : 'bg-[rgba(15,23,43,0.4)] border-[#45556c] hover:border-[#5a6a82]'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-[#2b7fff] flex items-center justify-center text-2xl">
                          🇬🇧
                        </div>
                        <span className="flex-1 text-left text-[#d1d5dc]">UK English</span>
                        {accent === 'UK' && (
                          <svg className="w-5 h-5" fill="#00D3F2" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d={svgPaths.pb067080} clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => setAccent('US')}
                        disabled={isGenerating}
                        className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                          accent === 'US'
                            ? 'bg-[rgba(0,184,219,0.2)] border-[#00b8db] shadow-lg'
                            : 'bg-[rgba(15,23,43,0.4)] border-[#45556c] hover:border-[#5a6a82]'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-[#fb2c36] flex items-center justify-center text-2xl">
                          🇺🇸
                        </div>
                        <span className="flex-1 text-left text-white">US English</span>
                        {accent === 'US' && (
                          <svg className="w-5 h-5" fill="#00D3F2" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d={svgPaths.pb067080} clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => setAccent('IN')}
                        disabled={isGenerating}
                        className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                          accent === 'IN'
                            ? 'bg-[rgba(0,184,219,0.2)] border-[#00b8db] shadow-lg'
                            : 'bg-[rgba(15,23,43,0.4)] border-[#45556c] hover:border-[#5a6a82]'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-[#ff9933] flex items-center justify-center text-2xl">
                          🇮🇳
                        </div>
                        <span className="flex-1 text-left text-white">Indian English</span>
                        {accent === 'IN' && (
                          <svg className="w-5 h-5" fill="#00D3F2" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d={svgPaths.pb067080} clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Voice Selection */}
                  <div>
                    <label className="block text-gray-200 text-base mb-2">Voice</label>
                    <div className="space-y-2">
                      {VOICES[accent as keyof typeof VOICES].map((voice) => (
                        <button
                          key={voice.id}
                          onClick={() => setSelectedVoiceId(voice.id)}
                          disabled={isGenerating}
                          className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                            selectedVoiceId === voice.id
                              ? 'bg-[rgba(0,184,219,0.2)] border-[#00b8db] shadow-lg'
                              : 'bg-[rgba(15,23,43,0.4)] border-[#45556c] hover:border-[#5a6a82]'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full ${voice.color} flex items-center justify-center text-2xl`}>
                            {voice.avatar}
                          </div>
                          <span className={`flex-1 text-left ${selectedVoiceId === voice.id ? 'text-white' : 'text-[#d1d5dc]'}`}>
                            {voice.name}
                          </span>
                          {selectedVoiceId === voice.id && (
                            <svg className="w-5 h-5" fill="#00D3F2" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d={svgPaths.pb067080} clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={!text.trim() || isOverLimit || isGenerating}
                  className="w-full h-12 rounded-lg text-white text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  style={{ 
                    backgroundImage: 'linear-gradient(90deg, rgb(152, 16, 250) 0%, rgb(0, 146, 184) 100%)'
                  }}
                >
                  {isGenerating ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
                      <path d={svgPaths.p21443880} stroke="white" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
                      <path d={svgPaths.p2ed10d00} stroke="white" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
                      <path d={svgPaths.pd903d00} stroke="white" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {isGenerating ? 'Generating Studio Quality Audio...' : 'Generate Audio Narration'}
                </button>
              </div>
            )}

            {/* Audio Player Section */}
            {audioUrl && (
              <div className="mt-8 pt-8 border-t border-[#314158]">
                <div className="flex items-center gap-2 mb-6">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
                    <path d={svgPaths.p28f68900} stroke="#00D3F2" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16.6667 1.66667V5" stroke="#00D3F2" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M18.3333 3.33333H15" stroke="#00D3F2" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={svgPaths.p2661f400} stroke="#00D3F2" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <h3 className="text-[#00d3f2] text-base">Studio Quality Audio Ready!</h3>
                </div>

                {/* Waveform */}
                <div className="bg-[rgba(2,6,24,0.5)] border border-[#314158] rounded-lg p-4 mb-4">
                  <WaveformVisualizer isPlaying={isPlaying} />
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${(currentTime / duration) * 100}%, #334155 ${(currentTime / duration) * 100}%, #334155 100%)`
                    }}
                  />
                  <div className="flex justify-between text-[#99a1af] text-base mt-2">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Play Button */}
                <div className="flex justify-center mb-6">
                  <button
                    onClick={handlePlayPause}
                    disabled={audioError}
                    className="w-16 h-16 rounded-lg bg-[#00b8db] hover:bg-[#00a5c7] flex items-center justify-center shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPlaying ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="#292929" viewBox="0 0 11 14">
                        <path d={svgPaths.p38145600} />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Download Section */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-gray-200 text-base mb-2">Suggested Filename</label>
                    <div className="bg-[rgba(15,23,43,0.7)] border border-[#45556c] rounded-lg px-3 py-2 flex items-center gap-2">
                      <span className="text-[#99a1af]">📁</span>
                      {isEditingFilename ? (
                        <input
                          value={filename}
                          onChange={(e) => setFilename(e.target.value)}
                          onBlur={() => setIsEditingFilename(false)}
                          onKeyDown={(e) => e.key === 'Enter' && setIsEditingFilename(false)}
                          className="flex-1 bg-transparent text-gray-200 text-base outline-none"
                          autoFocus
                        />
                      ) : (
                        <>
                          <span className="flex-1 text-gray-200 text-base truncate">{filename}</span>
                          <button
                            onClick={() => setIsEditingFilename(true)}
                            className="text-[#99a1af] hover:text-[#00d3f2] transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 15 15">
                              <path d={svgPaths.p4290a20} stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-200 text-base mb-2">Download Format</label>
                    <div className="bg-[rgba(15,23,43,0.7)] border border-[#45556c] rounded-lg px-3 py-2">
                      <span className="text-gray-200 text-base">MP3 (Standard)</span>
                    </div>
                  </div>
                </div>

                {/* Download Button */}
                <button
                  onClick={handleDownload}
                  disabled={audioError || isDownloading}
                  className="w-full h-12 bg-[#155dfc] hover:bg-[#1350e0] rounded-lg text-white text-base flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
                      <path d="M10 12.5V2.5" stroke="white" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
                      <path d={svgPaths.p3053b100} stroke="white" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
                      <path d={svgPaths.p37dcb700} stroke="white" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {isDownloading ? 'Preparing download...' : 'Download'}
                </button>

                {/* Hidden audio element */}
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onError={handleAudioError}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Footer Badge */}
          <div className="mt-8 flex justify-center">
            <div className="bg-[rgba(0,188,125,0.1)] border-2 border-[rgba(0,188,125,0.5)] rounded-full px-7 py-3 flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
                <path d={svgPaths.p21443880} stroke="#00D492" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
                <path d={svgPaths.p2ed10d00} stroke="#00D492" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
                <path d={svgPaths.pd903d00} stroke="#00D492" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[#00d492] text-base">Powered by Google Cloud Chirp 3:HD</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
