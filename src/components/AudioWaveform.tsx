import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isPlaying: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  progress: number; // 0 to 1
  onSeek?: (ratio: number) => void;
  accentColor?: string;
}

export function AudioWaveform({
  isPlaying,
  audioRef,
  progress,
  onSeek,
  accentColor = '#C5A059' // Sophisticated warm gold
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Try initializing Web Audio Analyser if possible
    const setupAudioContext = () => {
      try {
        if (!audioContextRef.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 128;
            analyser.smoothingTimeConstant = 0.8;

            const source = ctx.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(ctx.destination);

            audioContextRef.current = ctx;
            analyserRef.current = analyser;
            sourceNodeRef.current = source;
          }
        } else if (audioContextRef.current.state === 'suspended' && isPlaying) {
          audioContextRef.current.resume();
        }
      } catch (e) {
        // Cross-origin or already connected node fallback
      }
    };

    if (isPlaying) {
      setupAudioContext();
    }
  }, [isPlaying, audioRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let barCount = 48;
    const dataArray = new Uint8Array(barCount);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (analyserRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(dataArray);
      } else if (isPlaying) {
        // Aesthetic simulated waveform fluctuation when playing
        const now = Date.now() / 250;
        for (let i = 0; i < barCount; i++) {
          const wave = Math.sin(now + i * 0.35) * Math.cos(now * 0.7 + i * 0.2);
          dataArray[i] = Math.max(20, Math.floor(Math.abs(wave) * 190 + 30));
        }
      } else {
        // Static gentle baseline pattern
        for (let i = 0; i < barCount; i++) {
          const curve = Math.sin((i / barCount) * Math.PI) * 0.6 + 0.2;
          dataArray[i] = Math.floor(curve * 65);
        }
      }

      const totalSpacing = width / barCount;
      const barWidth = Math.max(2, totalSpacing - 2.5);

      for (let i = 0; i < barCount; i++) {
        const x = i * totalSpacing + 1.5;
        const normalized = dataArray[i] / 255;
        const barHeight = Math.max(4, normalized * (height * 0.85));
        const y = (height - barHeight) / 2;

        const barProgress = i / barCount;
        const isPast = barProgress <= progress;

        // Visual coloring based on playback progress
        if (isPast) {
          ctx.fillStyle = accentColor;
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
        }

        // Rounded bar caps
        const radius = barWidth / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, radius);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, progress, accentColor]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio);
  };

  return (
    <div className="w-full relative group cursor-pointer" onClick={handleCanvasClick}>
      <canvas
        ref={canvasRef}
        width={560}
        height={56}
        className="w-full h-14 rounded-md bg-[#0A0B0D] border border-white/10 transition-colors group-hover:border-[#C5A059]/40"
        title="Click to seek"
      />
    </div>
  );
}
