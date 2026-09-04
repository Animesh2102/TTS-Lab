import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Check, Copy } from 'lucide-react';
import { GeneratedClip } from '../types';
import { AudioWaveform } from './AudioWaveform';
import { AudioExportMenu } from './AudioExportMenu';

interface AudioPlayerProps {
  clip: GeneratedClip;
  autoPlay?: boolean;
}

export function AudioPlayer({ clip, autoPlay = true }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(clip.durationSeconds || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.src = clip.audioUrl;
    audio.playbackRate = playbackRate;
    audio.volume = isMuted ? 0 : volume;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    if (autoPlay) {
      audio.play().then(() => setIsPlaying(true)).catch(() => {
        setIsPlaying(false);
      });
    }

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [clip, autoPlay]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    audio.play().then(() => setIsPlaying(true)).catch(console.error);
  };

  const handleSeek = (ratio: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const targetTime = ratio * (duration || clip.durationSeconds || 1);
    audio.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleVolumeToggle = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.volume = nextMuted ? 0 : volume;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(clip.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressRatio = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  return (
    <div className="bg-[#111215] border border-white/10 rounded-sm p-6 shadow-2xl transition-all relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-[#C5A059] opacity-70"></div>
      <audio ref={audioRef} preload="metadata" />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-xs text-[10px] font-bold uppercase tracking-widest bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30">
            Voice: {clip.voiceName}
          </span>
          {clip.accent && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-medium uppercase tracking-wider bg-white/5 text-[#C5A059] border border-[#C5A059]/20 font-mono">
              {clip.accent}
            </span>
          )}
          {clip.styleName && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-medium uppercase tracking-wider bg-white/5 text-white/60 border border-white/10">
              {clip.styleName}
            </span>
          )}
          {clip.rate && clip.rate !== 1 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs text-[10px] font-mono text-white/50 bg-white/5 border border-white/10">
              Rate: {clip.rate}x
            </span>
          )}
          {clip.pitch && clip.pitch !== 1 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs text-[10px] font-mono text-white/50 bg-white/5 border border-white/10">
              Pitch: {clip.pitch}x
            </span>
          )}
          <span className="text-[10px] uppercase tracking-widest text-white/40">
            {clip.engine === 'gemini' ? 'Gemini Neural Voice' : 'Browser Synthesis'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyText}
            className="px-2.5 py-1 text-white/50 hover:text-[#C5A059] hover:bg-white/5 rounded-xs transition-colors text-xs flex items-center gap-1.5 uppercase tracking-wider"
            title="Copy synthesized text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#C5A059]" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <AudioExportMenu
            clipBlob={clip.blob}
            audioUrl={clip.audioUrl}
            voiceName={clip.voiceName}
          />
        </div>
      </div>

      {/* Waveform Visualizer & Scrubbing */}
      <div className="mb-4">
        <AudioWaveform
          isPlaying={isPlaying}
          audioRef={audioRef}
          progress={progressRatio}
          onSeek={handleSeek}
          accentColor="#C5A059"
        />
        <div className="flex justify-between text-[11px] text-white/30 mt-2 font-mono uppercase tracking-widest">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration || clip.durationSeconds)}</span>
        </div>
      </div>

      {/* Playback Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="w-12 h-12 rounded-full border border-[#C5A059] flex items-center justify-center bg-[#C5A059]/10 hover:bg-[#C5A059] text-[#C5A059] hover:text-[#0A0B0D] shadow-xs transition-all active:scale-95 focus:outline-hidden"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="p-2.5 text-white/40 hover:text-white hover:bg-white/5 rounded-xs transition-colors"
            title="Restart from beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2 ml-1">
            <button
              type="button"
              onClick={handleVolumeToggle}
              className="p-1.5 text-white/40 hover:text-[#C5A059] rounded-xs transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-white/30" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#C5A059]"
              aria-label="Volume slider"
            />
          </div>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1 bg-[#0E0F12] p-1 rounded-xs border border-white/5">
          {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => handleRateChange(rate)}
              className={`px-2 py-1 text-xs font-mono font-medium rounded-xs transition-all ${
                playbackRate === rate
                  ? 'bg-[#C5A059] text-black font-bold shadow-xs'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
