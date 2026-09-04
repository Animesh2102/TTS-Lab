import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, Check, Loader2, FileAudio, Sparkles } from 'lucide-react';
import { AudioCodec, CODEC_OPTIONS, downloadAudioClip } from '../utils/audioExport';

interface AudioExportMenuProps {
  clipBlob?: Blob;
  audioUrl: string;
  voiceName: string;
  compact?: boolean;
}

export function AudioExportMenu({
  clipBlob,
  audioUrl,
  voiceName,
  compact = false
}: AudioExportMenuProps) {
  const [selectedCodec, setSelectedCodec] = useState<AudioCodec>('mp3-192');
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleDownload = async (codecToUse?: AudioCodec) => {
    const codec = codecToUse || selectedCodec;
    setIsExporting(true);
    try {
      await downloadAudioClip(clipBlob, audioUrl, voiceName, codec);
      setIsOpen(false);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const activeOption = CODEC_OPTIONS.find((c) => c.id === selectedCodec) || CODEC_OPTIONS[0];

  return (
    <div className="relative inline-flex items-center" ref={menuRef}>
      {/* Combined split button or single button */}
      <div className="inline-flex rounded-xs overflow-hidden shadow-xs border border-[#C5A059]/40">
        <button
          type="button"
          onClick={() => handleDownload(selectedCodec)}
          disabled={isExporting}
          title={`Download as ${activeOption.label}`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all bg-[#C5A059] text-black hover:bg-[#d6b065] disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Encoding...</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>Download {activeOption.label.split(' ')[0]}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isExporting}
          title="Choose audio format and codec"
          aria-label="Audio format choices"
          className="px-2 py-1.5 border-l border-black/20 flex items-center justify-center transition-all bg-[#C5A059] text-black hover:bg-[#d6b065] disabled:opacity-50"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Codec Selection Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-72 rounded-sm z-50 p-2 shadow-2xl transition-all bg-[#16171B] border border-white/15 text-white/90">
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/10 mb-1.5">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-[#C5A059]">
              <FileAudio className="w-3.5 h-3.5" />
              <span>Export Audio Codec</span>
            </div>
            <span className="text-[9px] font-mono text-white/40">Select Format</span>
          </div>

          <div className="space-y-1">
            {CODEC_OPTIONS.map((option) => {
              const isSelected = selectedCodec === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setSelectedCodec(option.id);
                    handleDownload(option.id);
                  }}
                  className={`w-full text-left p-2 rounded-xs flex items-start justify-between gap-2 transition-all ${
                    isSelected
                      ? 'bg-[#C5A059]/10 border border-[#C5A059]/40 text-white'
                      : 'hover:bg-white/5 border border-transparent text-white/70'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{option.label}</span>
                      {option.format === 'mp3' && (
                        <span className="text-[9px] px-1 py-0.2 rounded-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Compressed
                        </span>
                      )}
                      {option.format === 'wav' && (
                        <span className="text-[9px] px-1 py-0.2 rounded-xs font-mono bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30">
                          Lossless
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/50 leading-tight mt-0.5 font-light">
                      {option.sublabel}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-[#C5A059] text-black flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-white/10 px-2 flex items-center justify-between text-[10px] text-white/40">
            <span>Fast in-browser encoding</span>
            <span className="font-mono text-[#C5A059]">LAME 3.100</span>
          </div>
        </div>
      )}
    </div>
  );
}
