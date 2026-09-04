import React, { useState } from 'react';
import { GeneratedClip } from '../types';
import { Play, Pause, Trash2, Clock, Archive, CheckSquare, Square, Download, Loader2, BarChart2 } from 'lucide-react';
import { AudioExportMenu } from './AudioExportMenu';
import { ClipHistoryAnalytics } from './ClipHistoryAnalytics';
import JSZip from 'jszip';

interface ClipHistoryProps {
  clips: GeneratedClip[];
  onSelectClip: (clip: GeneratedClip) => void;
  onClearHistory: () => void;
  currentClipId?: string;
}

export function ClipHistory({
  clips,
  onSelectClip,
  onClearHistory,
  currentClipId
}: ClipHistoryProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioInstances, setAudioInstances] = useState<{ [id: string]: HTMLAudioElement }>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [zipMessage, setZipMessage] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState<boolean>(true);

  if (clips.length === 0) {
    return null;
  }

  const toggleInlinePlay = (clip: GeneratedClip, e: React.MouseEvent) => {
    e.stopPropagation();

    if (playingId === clip.id) {
      const existing = audioInstances[clip.id];
      if (existing) {
        existing.pause();
      }
      setPlayingId(null);
      return;
    }

    // Stop currently playing
    if (playingId && audioInstances[playingId]) {
      audioInstances[playingId].pause();
    }

    let audio = audioInstances[clip.id];
    if (!audio) {
      audio = new Audio(clip.audioUrl);
      audio.onended = () => setPlayingId(null);
      setAudioInstances((prev) => ({ ...prev, [clip.id]: audio }));
    }

    audio.currentTime = 0;
    audio.play().then(() => {
      setPlayingId(clip.id);
    }).catch(console.error);
  };

  const handleToggleSelect = (clipId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(clipId)) {
        next.delete(clipId);
      } else {
        next.add(clipId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === clips.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(clips.map((c) => c.id)));
    }
  };

  const handleDownloadSelectedZip = async () => {
    const chosenClips = clips.filter((c) => selectedIds.has(c.id));
    if (chosenClips.length === 0) return;

    setIsZipping(true);
    setZipMessage('Preparing audio tracks...');

    try {
      const zip = new JSZip();
      const folder = zip.folder('speech_clips') || zip;
      const manifestList: any[] = [];

      for (let i = 0; i < chosenClips.length; i++) {
        const clip = chosenClips[i];
        setZipMessage(`Archiving track ${i + 1} of ${chosenClips.length}...`);

        let audioBlob = clip.blob;
        if (!audioBlob) {
          const res = await fetch(clip.audioUrl);
          audioBlob = await res.blob();
        }

        const trackIndex = String(i + 1).padStart(2, '0');
        const cleanVoice = clip.voiceName.replace(/[^a-zA-Z0-9_-]/g, '_');
        const cleanSnippet = clip.text
          .slice(0, 24)
          .trim()
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .toLowerCase();
        const filename = `${trackIndex}_${cleanVoice}_${cleanSnippet || 'clip'}.wav`;

        folder.file(filename, audioBlob);

        manifestList.push({
          track: i + 1,
          filename,
          voice: clip.voiceName,
          engine: clip.engine,
          style: clip.styleName || 'Natural',
          accent: clip.accent || 'en-US',
          durationSeconds: clip.durationSeconds,
          timestamp: new Date(clip.timestamp).toISOString(),
          text: clip.text
        });
      }

      // Add a clean manifest summary text file
      const manifestText = `AI STUDIO NEURAL SPEECH - SESSION TRACK BUNDLE
Generated on: ${new Date().toLocaleString()}
Total Tracks: ${chosenClips.length}
============================================================

${manifestList
  .map(
    (m) =>
      `[Track ${m.track}] ${m.filename}
Voice: ${m.voice} (${m.engine}) | Style: ${m.style} | Accent: ${m.accent} | Duration: ${m.durationSeconds}s
Script:
"${m.text}"
------------------------------------------------------------`
  )
  .join('\n\n')}`;

      folder.file('tracks_manifest.txt', manifestText);
      folder.file('manifest.json', JSON.stringify(manifestList, null, 2));

      setZipMessage('Compressing ZIP archive...');
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `speech_tracks_${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setZipMessage(`Downloaded ZIP with ${chosenClips.length} tracks!`);
      setTimeout(() => setZipMessage(null), 4000);
    } catch (err) {
      console.error('ZIP generation failed:', err);
      setZipMessage('Failed to create ZIP file. Please try again.');
      setTimeout(() => setZipMessage(null), 4000);
    } finally {
      setIsZipping(false);
    }
  };

  const isAllSelected = selectedIds.size === clips.length && clips.length > 0;
  const hasSelection = selectedIds.size > 0;

  return (
    <div className="rounded-sm p-4 shadow-xl border transition-all bg-[#111215] border border-white/5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
          <h3 className="text-[10px] font-bold text-[#C5A059] uppercase tracking-[0.2em]">
            Generation History ({clips.length})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-xs flex items-center gap-1 border transition-colors cursor-pointer ${
              showAnalytics
                ? 'bg-[#C5A059]/15 text-[#C5A059] border-[#C5A059]/40 font-bold'
                : 'text-white/40 border-white/10 hover:text-white'
            }`}
            title="Toggle data visualization analytics chart"
          >
            <BarChart2 className="w-3 h-3" />
            <span>Insights</span>
          </button>

          <button
            type="button"
            onClick={onClearHistory}
            className="text-[10px] uppercase tracking-wider text-white/40 hover:text-rose-400 flex items-center gap-1 transition-colors px-1 cursor-pointer"
            title="Clear session history"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Multi-Select Toolbar & ZIP Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 px-2 py-1.5 rounded-xs bg-black/40 border border-white/5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-[11px] font-semibold text-white/80 hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            {isAllSelected ? (
              <CheckSquare className="w-3.5 h-3.5 text-[#C5A059]" />
            ) : (
              <Square className="w-3.5 h-3.5 text-white/40" />
            )}
            <span>{isAllSelected ? 'Deselect All' : 'Select All'}</span>
          </button>

          {hasSelection && (
            <span className="text-[10px] font-mono text-[#C5A059] bg-[#C5A059]/10 px-1.5 py-0.5 rounded-xs border border-[#C5A059]/30">
              {selectedIds.size} of {clips.length} selected
            </span>
          )}
        </div>

        {/* Download ZIP Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadSelectedZip}
            disabled={!hasSelection || isZipping}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xs text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              hasSelection && !isZipping
                ? 'bg-[#C5A059] text-black hover:bg-[#d4ad60] shadow-sm'
                : 'opacity-30 cursor-not-allowed bg-white/5 text-white/40'
            }`}
            title={hasSelection ? 'Download selected audio clips as a single ZIP package' : 'Select one or more clips to download as ZIP'}
          >
            {isZipping ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                <span>Creating ZIP...</span>
              </>
            ) : (
              <>
                <Archive className="w-3.5 h-3.5" />
                <span>Download ZIP {hasSelection ? `(${selectedIds.size})` : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ZIP Status / Progress Message */}
      {zipMessage && (
        <div className="mb-2 px-2.5 py-1.5 rounded-xs bg-[#C5A059]/10 border border-[#C5A059]/30 text-xs text-[#C5A059] flex items-center gap-2">
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>{zipMessage}</span>
        </div>
      )}

      {/* Clips List */}
      <div className="divide-y divide-white/5 max-h-60 overflow-y-auto pr-1">
        {clips.map((clip) => {
          const isSelected = currentClipId === clip.id;
          const isThisPlaying = playingId === clip.id;
          const isChecked = selectedIds.has(clip.id);

          return (
            <div
              key={clip.id}
              onClick={() => onSelectClip(clip)}
              className={`py-2.5 px-2 rounded-xs flex items-center justify-between gap-3 cursor-pointer transition-all ${
                isSelected
                  ? 'bg-[#16171B] border-l-2 border-[#C5A059]'
                  : 'hover:bg-white/5'
              } ${isChecked ? 'bg-[#C5A059]/5' : ''}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Select Checkbox */}
                <button
                  type="button"
                  onClick={(e) => handleToggleSelect(clip.id, e)}
                  className="p-1 text-white/40 hover:text-white transition-colors cursor-pointer shrink-0"
                  title={isChecked ? 'Deselect clip' : 'Select clip for ZIP export'}
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-[#C5A059]" />
                  ) : (
                    <Square className="w-4 h-4 text-white/30" />
                  )}
                </button>

                {/* Inline Play / Pause */}
                <button
                  type="button"
                  onClick={(e) => toggleInlinePlay(clip, e)}
                  className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                    isThisPlaying
                      ? 'bg-[#C5A059] text-black font-bold'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                  title={isThisPlaying ? 'Pause' : 'Play clip'}
                >
                  {isThisPlaying ? (
                    <Pause className="w-3 h-3 fill-current" />
                  ) : (
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs flex-wrap">
                    <span className="font-semibold text-white/90">{clip.voiceName}</span>
                    {clip.accent && (
                      <span className="text-[9px] font-mono text-[#C5A059] bg-white/5 px-1 py-0.2 rounded-xs border border-white/10">
                        {clip.accent}
                      </span>
                    )}
                    {clip.styleName && (
                      <span className="text-[9px] uppercase tracking-wider text-[#C5A059] bg-[#C5A059]/10 px-1.5 py-0.2 rounded-xs border border-[#C5A059]/20 font-mono">
                        {clip.styleName}
                      </span>
                    )}
                    <span className="text-[10px] text-white/30 font-mono">
                      {clip.durationSeconds}s
                    </span>
                  </div>
                  <p className="text-xs text-white/40 truncate max-w-xs sm:max-w-md font-light">
                    {clip.text}
                  </p>
                </div>
              </div>

              <div
                className="flex items-center gap-1 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <AudioExportMenu
                  clipBlob={clip.blob}
                  audioUrl={clip.audioUrl}
                  voiceName={clip.voiceName}
                  compact={true}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recharts Analytics Visualization */}
      {showAnalytics && (
        <ClipHistoryAnalytics clips={clips} />
      )}
    </div>
  );
}
