import { useState } from 'react';
import { GeminiVoice, SpeechStyle, SpeechEngine, VoiceAccent, VoiceGender, UserVoicePreset } from '../types';
import { Sparkles, Monitor, Check, Wand2, Globe, Gauge, Music, RefreshCw, Bookmark, Plus, Trash2 } from 'lucide-react';

interface VoiceSelectorProps {
  engine: SpeechEngine;
  onEngineChange: (engine: SpeechEngine) => void;
  geminiVoices: GeminiVoice[];
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
  accents: VoiceAccent[];
  selectedAccent: string;
  onAccentChange: (accentId: string) => void;
  speakingRate: number;
  onSpeakingRateChange: (rate: number) => void;
  voicePitch: number;
  onVoicePitchChange: (pitch: number) => void;
  styles: SpeechStyle[];
  selectedStyle: string;
  onStyleChange: (styleId: string) => void;
  browserVoices: SpeechSynthesisVoice[];
  selectedBrowserVoiceIndex: number;
  onBrowserVoiceChange: (index: number) => void;
  hasApiKey: boolean;
  userPresets: UserVoicePreset[];
  onSaveUserPreset: (name: string) => void;
  onApplyUserPreset: (preset: UserVoicePreset) => void;
  onDeleteUserPreset: (presetId: string) => void;
}

export function VoiceSelector({
  engine,
  onEngineChange,
  geminiVoices,
  selectedVoice,
  onVoiceChange,
  accents,
  selectedAccent,
  onAccentChange,
  speakingRate,
  onSpeakingRateChange,
  voicePitch,
  onVoicePitchChange,
  styles,
  selectedStyle,
  onStyleChange,
  browserVoices,
  selectedBrowserVoiceIndex,
  onBrowserVoiceChange,
  hasApiKey,
  userPresets,
  onSaveUserPreset,
  onApplyUserPreset,
  onDeleteUserPreset
}: VoiceSelectorProps) {
  const [genderFilter, setGenderFilter] = useState<'All' | VoiceGender>('All');
  const [isCreatingPreset, setIsCreatingPreset] = useState<boolean>(false);
  const [presetNameInput, setPresetNameInput] = useState<string>('');

  const filteredVoices = geminiVoices.filter((v) => {
    if (genderFilter === 'All') return true;
    return v.gender === genderFilter;
  });

  const getRateLabel = (rate: number) => {
    if (rate <= 0.75) return 'Slow & Deliberate';
    if (rate < 1.0) return 'Relaxed Pace';
    if (rate === 1.0) return 'Standard Pace';
    if (rate <= 1.3) return 'Brisk Cadence';
    return 'Fast & Energetic';
  };

  const getPitchLabel = (pitch: number) => {
    if (pitch <= 0.75) return 'Deep & Low';
    if (pitch < 1.0) return 'Grounded';
    if (pitch === 1.0) return 'Natural Pitch';
    if (pitch <= 1.25) return 'Bright & Elevated';
    return 'High & Youthful';
  };

  const handleResetControls = () => {
    onSpeakingRateChange(1.0);
    onVoicePitchChange(1.0);
  };

  return (
    <div className="space-y-6">
      {/* Engine Selection */}
      <div>
        <label className="block text-[10px] font-bold text-[#C5A059] uppercase tracking-[0.2em] mb-2.5">
          Synthesis Engine
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 rounded-sm border bg-[#0E0F12] border-white/5">
          <button
            type="button"
            onClick={() => onEngineChange('gemini')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xs text-xs font-medium transition-all ${
              engine === 'gemini'
                ? 'bg-[#16171B] text-[#C5A059] border border-[#C5A059]/40 shadow-xs font-bold'
                : 'text-white/50 hover:text-white border border-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Gemini Neural Voice</span>
            <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-xs text-[10px] uppercase tracking-wider bg-[#C5A059]/20 text-[#C5A059] font-semibold">
              Studio
            </span>
          </button>

          <button
            type="button"
            onClick={() => onEngineChange('browser')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xs text-xs font-medium transition-all ${
              engine === 'browser'
                ? 'bg-[#16171B] text-white border border-white/20 shadow-xs font-bold'
                : 'text-white/50 hover:text-white border border-transparent'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Browser Speech</span>
            <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-xs text-[10px] uppercase tracking-wider bg-white/10 text-white font-semibold">
              Local
            </span>
          </button>
        </div>

        {!hasApiKey && engine === 'gemini' && (
          <p className="text-xs text-[#C5A059] bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-sm p-3 mt-2.5">
            Notice: Gemini API key is not detected in secrets. You can switch to <strong>Browser Speech</strong> for instant speech synthesis anytime.
          </p>
        )}
      </div>

      {/* Voice Selection (Male, Female, Child) */}
      {engine === 'gemini' ? (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-[#C5A059] uppercase tracking-[0.2em]">
                Voice Persona ({geminiVoices.length} available)
              </label>
            </div>
            <div className="flex items-center gap-1">
              {(['All', 'Male', 'Female', 'Child / Youth'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setGenderFilter(filter)}
                  className={`text-[10px] px-2 py-0.5 rounded-xs transition-colors uppercase tracking-wider font-mono ${
                    genderFilter === filter
                      ? 'bg-[#C5A059] text-black font-bold'
                      : 'bg-white/5 text-white/50 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
            {filteredVoices.map((voice) => {
              const isSelected = selectedVoice === voice.id;
              const isChild = voice.gender === 'Child / Youth';
              const isMale = voice.gender === 'Male';

              return (
                <button
                  key={voice.id}
                  type="button"
                  onClick={() => onVoiceChange(voice.id)}
                  className={`text-left p-3 rounded-sm border transition-all relative ${
                    isSelected
                      ? 'border-[#C5A059] bg-[#16171B] ring-1 ring-[#C5A059]/30'
                      : 'border-white/5 hover:border-[#C5A059]/40 bg-[#111215]/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-white text-sm">{voice.name}</span>
                      <span
                        className={`text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded-xs font-mono font-medium ${
                          isChild
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                            : isMale
                            ? 'bg-blue-400/20 text-blue-300 border border-blue-400/40'
                            : 'bg-rose-400/20 text-rose-300 border border-rose-400/40'
                        }`}
                      >
                        {voice.gender}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-[#C5A059] text-black flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-[#C5A059] font-medium mb-1">{voice.previewTone}</div>
                  <p className="text-xs line-clamp-2 leading-relaxed text-white/40 font-light">
                    {voice.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Browser Voices Configuration */
        <div className="space-y-3.5 bg-[#111215] p-4 rounded-sm border border-white/5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-bold text-[#C5A059] uppercase tracking-[0.2em]">
                System Voices ({browserVoices.length} detected)
              </label>
              <span className="text-[10px] text-white/40 font-mono">Filtered by Accent</span>
            </div>
            <select
              value={selectedBrowserVoiceIndex}
              onChange={(e) => onBrowserVoiceChange(Number(e.target.value))}
              className="w-full text-xs bg-[#0E0F12] border border-white/10 rounded-sm p-2.5 text-white/90 focus:border-[#C5A059] outline-hidden font-mono"
            >
              {browserVoices.map((v, i) => (
                <option key={`${v.name}-${v.lang}-${i}`} value={i} className="bg-[#0E0F12] text-white">
                  {v.name} ({v.lang}) {v.default ? '— Default' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Accent Selection (American, British, Australian, etc.) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#C5A059]" />
            <label className="text-[10px] font-bold text-[#C5A059] uppercase tracking-[0.2em]">
              Accent &amp; Regional Cadence
            </label>
          </div>
          <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
            {accents.length} Accents
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {accents.map((accent) => {
            const isSelected = selectedAccent === accent.id;
            return (
              <button
                key={accent.id}
                type="button"
                onClick={() => onAccentChange(accent.id)}
                className={`flex flex-col items-start p-2.5 rounded-sm border transition-all text-left ${
                  isSelected
                    ? 'bg-[#16171B] border-[#C5A059] shadow-xs ring-1 ring-[#C5A059]/30'
                    : 'bg-[#111215] border-white/5 hover:border-[#C5A059]/30 text-white/70'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-base leading-none">{accent.flag}</span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]"></span>
                  )}
                </div>
                <div className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-white/80'}`}>
                  {accent.name}
                </div>
                <div className="text-[10px] text-white/40 font-mono mt-0.5">
                  {accent.code}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice Pitch & Speaking Rate Controls */}
      <div className="bg-[#111215] p-4 rounded-sm border border-white/5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-[0.2em]">
              Cadence &amp; Pitch Calibration
            </span>
          </div>
          {(speakingRate !== 1.0 || voicePitch !== 1.0) && (
            <button
              type="button"
              onClick={handleResetControls}
              className="text-[10px] uppercase font-mono tracking-wider text-white/40 hover:text-[#C5A059] flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset 1.0x</span>
            </button>
          )}
        </div>

        {/* Speaking Rate */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-white/70 font-medium">Speaking Rate</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/40 font-light">{getRateLabel(speakingRate)}</span>
              <span className="text-xs font-mono text-[#C5A059] font-bold bg-[#0E0F12] px-1.5 py-0.5 rounded-xs border border-white/5">
                {speakingRate.toFixed(2)}x
              </span>
            </div>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={speakingRate}
            onChange={(e) => onSpeakingRateChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#C5A059]"
            aria-label="Speaking rate slider"
          />
          <div className="flex justify-between items-center mt-1.5">
            <div className="flex gap-1.5">
              {[0.75, 1.0, 1.25, 1.5].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onSpeakingRateChange(preset)}
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs transition-colors ${
                    speakingRate === preset
                      ? 'bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/40 font-bold'
                      : 'bg-white/5 text-white/40 hover:text-white'
                  }`}
                >
                  {preset}x
                </button>
              ))}
            </div>
            <span className="text-[10px] text-white/30 font-mono">0.5x - 2.0x</span>
          </div>
        </div>

        {/* Voice Pitch */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-white/70 font-medium">Voice Pitch</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/40 font-light">{getPitchLabel(voicePitch)}</span>
              <span className="text-xs font-mono text-[#C5A059] font-bold bg-[#0E0F12] px-1.5 py-0.5 rounded-xs border border-white/5">
                {voicePitch.toFixed(2)}x
              </span>
            </div>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            value={voicePitch}
            onChange={(e) => onVoicePitchChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#C5A059]"
            aria-label="Voice pitch slider"
          />
          <div className="flex justify-between items-center mt-1.5">
            <div className="flex gap-1.5">
              {[0.8, 1.0, 1.2].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onVoicePitchChange(preset)}
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs transition-colors ${
                    voicePitch === preset
                      ? 'bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/40 font-bold'
                      : 'bg-white/5 text-white/40 hover:text-white'
                  }`}
                >
                  {preset === 0.8 ? 'Deep (0.8x)' : preset === 1.0 ? 'Natural (1.0x)' : 'High (1.2x)'}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-white/30 font-mono">0.5x - 1.5x</span>
          </div>
        </div>
      </div>

      {/* Saved User Presets Section */}
      <div className="p-4 rounded-sm border transition-colors bg-[#111215] border border-white/5">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3">
          <div className="flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059]">
              Saved User Presets
            </span>
            <span className="text-[10px] font-mono text-white/40">({userPresets.length})</span>
          </div>

          {!isCreatingPreset ? (
            <button
              type="button"
              onClick={() => {
                setIsCreatingPreset(true);
                const currentName =
                  engine === 'gemini'
                    ? geminiVoices.find((v) => v.id === selectedVoice)?.name || selectedVoice
                    : browserVoices[selectedBrowserVoiceIndex]?.name || 'Browser Voice';
                setPresetNameInput(`${currentName} (${speakingRate.toFixed(2)}x / ${voicePitch.toFixed(2)}x)`);
              }}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-xs transition-colors cursor-pointer border bg-[#C5A059]/15 text-[#C5A059] border-[#C5A059]/40 hover:bg-[#C5A059]/30"
              title="Save current voice, pitch, and rate configuration as a custom preset"
            >
              <Plus className="w-3 h-3" />
              <span>Save Current</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreatingPreset(false)}
              className="text-[10px] font-mono uppercase tracking-wider text-white/40 hover:text-white"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Inline Save Form */}
        {isCreatingPreset && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const currentName =
                engine === 'gemini'
                  ? geminiVoices.find((v) => v.id === selectedVoice)?.name || selectedVoice
                  : browserVoices[selectedBrowserVoiceIndex]?.name || 'Browser Voice';
              const defaultName = `${currentName} (${speakingRate.toFixed(2)}x / ${voicePitch.toFixed(2)}x)`;
              onSaveUserPreset(presetNameInput.trim() || defaultName);
              setIsCreatingPreset(false);
            }}
            className="mb-3 p-3 rounded-xs bg-[#0E0F12] border border-[#C5A059]/40 space-y-2.5"
          >
            <div className="text-[11px] text-white/70">
              Capturing:{' '}
              <strong className="text-[#C5A059] font-semibold">
                {engine === 'gemini'
                  ? geminiVoices.find((v) => v.id === selectedVoice)?.name || selectedVoice
                  : browserVoices[selectedBrowserVoiceIndex]?.name || 'Browser Voice'}
              </strong>{' '}
              ({engine === 'gemini' ? 'Gemini' : 'Browser'}) at{' '}
              <span className="font-mono text-white font-bold">{speakingRate.toFixed(2)}x rate</span> and{' '}
              <span className="font-mono text-white font-bold">{voicePitch.toFixed(2)}x pitch</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={presetNameInput}
                onChange={(e) => setPresetNameInput(e.target.value)}
                placeholder="Preset name (e.g. Audiobook Hero)..."
                className="flex-1 text-xs px-2.5 py-1.5 rounded-xs outline-hidden border font-medium bg-[#16171B] text-white border-white/10 focus:border-[#C5A059]"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xs text-xs font-bold uppercase tracking-wider bg-[#C5A059] text-black hover:bg-[#d1ab64] cursor-pointer"
              >
                Save
              </button>
            </div>
          </form>
        )}

        {/* User Presets List */}
        {userPresets.length === 0 && !isCreatingPreset ? (
          <p className="text-[11px] text-white/40 font-light leading-relaxed">
            No custom presets saved yet. Configure your preferred voice, rate, and pitch, then click{' '}
            <strong className="text-white/60 font-medium">&apos;Save Current&apos;</strong> to create a quick shortcut stored in local storage.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
            {userPresets.map((preset) => {
              const isCurrentActive =
                preset.engine === engine &&
                (engine === 'gemini' ? preset.voiceId === selectedVoice : preset.browserVoiceIndex === selectedBrowserVoiceIndex) &&
                Math.abs(preset.speakingRate - speakingRate) < 0.01 &&
                Math.abs(preset.voicePitch - voicePitch) < 0.01;

              return (
                <div
                  key={preset.id}
                  className={`flex items-center justify-between p-2.5 rounded-xs border transition-all ${
                    isCurrentActive
                      ? 'bg-[#C5A059]/10 border-[#C5A059]/50 text-white shadow-xs'
                      : 'bg-[#0E0F12] border border-white/5 hover:border-white/20 text-white/80'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold truncate text-white">{preset.name}</span>
                      {isCurrentActive && (
                        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-[#C5A059] text-black rounded-xs">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-mono mt-0.5">
                      <span className="text-white/70 font-sans font-medium">{preset.voiceName}</span>
                      <span>•</span>
                      <span>{preset.speakingRate.toFixed(2)}x</span>
                      <span>•</span>
                      <span>{preset.voicePitch.toFixed(2)}x pitch</span>
                      <span className="text-white/20">•</span>
                      <span className="uppercase text-[9px] text-[#C5A059] font-sans font-bold">{preset.engine}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onApplyUserPreset(preset)}
                      disabled={isCurrentActive}
                      className={`px-2.5 py-1 rounded-xs text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        isCurrentActive
                          ? 'opacity-40 cursor-default text-white/40'
                          : 'bg-white/10 hover:bg-[#C5A059] text-white hover:text-black'
                      }`}
                    >
                      {isCurrentActive ? 'Active' : 'Apply'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteUserPreset(preset.id)}
                      className="p-1 rounded-xs text-white/40 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Delete preset from local storage"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Speaking Style / Emotional Nuance */}
      {engine === 'gemini' && (
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Wand2 className="w-3.5 h-3.5 text-[#C5A059]" />
            <label className="text-[10px] font-bold text-[#C5A059] uppercase tracking-[0.2em]">
              Delivery Style &amp; Emotional Tone
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            {styles.map((style) => {
              const isSelected = selectedStyle === style.id;
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => onStyleChange(style.id)}
                  className={`px-3 py-1.5 rounded-xs text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-[#C5A059] text-black font-bold border-[#C5A059] shadow-xs'
                      : 'bg-[#111215] text-white/70 border-white/10 hover:border-[#C5A059]/40 hover:text-white'
                  }`}
                >
                  {style.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
