import React, { useState } from 'react';
import { GeneratedClip } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3, TrendingUp, Mic, FileText, Clock } from 'lucide-react';

interface ClipHistoryAnalyticsProps {
  clips: GeneratedClip[];
}

export function ClipHistoryAnalytics({ clips }: ClipHistoryAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'words' | 'voices'>('words');

  if (clips.length === 0) return null;

  // Calculate analytics
  let totalWords = 0;
  let totalDuration = 0;
  const voiceUsageMap: { [voice: string]: { count: number; words: number } } = {};

  const chronologicalClips = [...clips].reverse(); // from oldest to newest

  const wordsTimelineData = chronologicalClips.map((clip, index) => {
    const wordCount = clip.text.trim() ? clip.text.trim().split(/\s+/).filter(Boolean).length : 0;
    totalWords += wordCount;
    totalDuration += clip.durationSeconds || 0;

    const voice = clip.voiceName || 'Unknown';
    if (!voiceUsageMap[voice]) {
      voiceUsageMap[voice] = { count: 0, words: 0 };
    }
    voiceUsageMap[voice].count += 1;
    voiceUsageMap[voice].words += wordCount;

    return {
      name: `#${index + 1}`,
      words: wordCount,
      voice: clip.voiceName,
      duration: clip.durationSeconds ? `${clip.durationSeconds}s` : 'N/A'
    };
  });

  const voiceData = Object.entries(voiceUsageMap)
    .map(([voice, data]) => ({
      name: voice,
      count: data.count,
      words: data.words
    }))
    .sort((a, b) => b.count - a.count);

  const mostUsedVoice = voiceData[0]?.name || 'None';

  return (
    <div className="mt-4 p-3.5 rounded-sm border transition-colors bg-[#0E0F12] border border-white/10 text-white">
      {/* Header and KPI Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-[#C5A059]" />
          <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-[0.2em]">
            Session Insights &amp; Voice Distribution
          </span>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-xs border border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('words')}
            className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-xs transition-colors cursor-pointer ${
              activeTab === 'words'
                ? 'bg-[#C5A059] text-black'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Words / Clip
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('voices')}
            className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-xs transition-colors cursor-pointer ${
              activeTab === 'voices'
                ? 'bg-[#C5A059] text-black'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Voice Usage
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="p-2 rounded-xs bg-black/30 border border-white/5 flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-white/40 font-mono flex items-center gap-1">
            <FileText className="w-2.5 h-2.5 text-[#C5A059]" /> Total Words
          </span>
          <span className="text-sm font-bold font-mono text-white mt-0.5">
            {totalWords.toLocaleString()}
          </span>
        </div>

        <div className="p-2 rounded-xs bg-black/30 border border-white/5 flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-white/40 font-mono flex items-center gap-1">
            <Mic className="w-2.5 h-2.5 text-[#C5A059]" /> Top Voice
          </span>
          <span className="text-sm font-bold truncate text-[#C5A059] mt-0.5">
            {mostUsedVoice}
          </span>
        </div>

        <div className="p-2 rounded-xs bg-black/30 border border-white/5 flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-white/40 font-mono flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-[#C5A059]" /> Audio Time
          </span>
          <span className="text-sm font-bold font-mono text-white mt-0.5">
            {totalDuration.toFixed(1)}s
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-36 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'words' ? (
            <BarChart data={wordsTimelineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: '#71717A', fontSize: 10 }}
                axisLine={{ stroke: '#27272A' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#71717A', fontSize: 10 }}
                axisLine={{ stroke: '#27272A' }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(197, 160, 89, 0.08)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#16171B] border border-[#C5A059]/40 p-2 rounded-xs shadow-xl text-xs">
                        <div className="font-bold text-[#C5A059] flex items-center justify-between gap-3">
                          <span>Clip {data.name}</span>
                          <span className="text-[10px] font-mono text-white/50">{data.duration}</span>
                        </div>
                        <div className="text-white mt-1">
                          <span className="text-white/60">Voice:</span> {data.voice}
                        </div>
                        <div className="text-white">
                          <span className="text-white/60">Words:</span> <strong className="text-[#C5A059] font-mono">{data.words}</strong>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="words" radius={[2, 2, 0, 0]}>
                {wordsTimelineData.map((_, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={i === wordsTimelineData.length - 1 ? '#C5A059' : '#8A7038'}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <BarChart
              data={voiceData}
              layout="vertical"
              margin={{ top: 5, right: 15, left: 10, bottom: 0 }}
            >
              <XAxis
                type="number"
                tick={{ fill: '#71717A', fontSize: 10 }}
                axisLine={{ stroke: '#27272A' }}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#E4E4E7', fontSize: 11 }}
                axisLine={{ stroke: '#27272A' }}
                tickLine={false}
                width={70}
              />
              <Tooltip
                cursor={{ fill: 'rgba(197, 160, 89, 0.08)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#16171B] border border-[#C5A059]/40 p-2 rounded-xs shadow-xl text-xs">
                        <div className="font-bold text-[#C5A059]">{data.name}</div>
                        <div className="text-white mt-1">
                          <span className="text-white/60">Clips generated:</span>{' '}
                          <strong className="text-[#C5A059] font-mono">{data.count}</strong>
                        </div>
                        <div className="text-white">
                          <span className="text-white/60">Total words spoken:</span>{' '}
                          <strong className="text-white font-mono">{data.words}</strong>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" fill="#C5A059" radius={[0, 2, 2, 0]}>
                {voiceData.map((entry, index) => (
                  <Cell
                    key={`voice-cell-${index}`}
                    fill={index === 0 ? '#C5A059' : '#9E8043'}
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
