import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Sparkles,
  Play,
  RotateCcw,
  Download,
  Copy,
  Check,
  Wand2,
  Loader2,
  MessageSquareQuote,
  Sliders,
  FileText,
  AlertCircle,
  Users,
  WrapText,
  Bookmark,
  CheckCheck,
  Undo2,
  X,
  Save,
  HardDriveDownload,
  History
} from 'lucide-react';
import { GeminiVoice, SpeechStyle, SpeechEngine, GeneratedClip, SamplePreset, VoiceAccent, UserVoicePreset } from './types';
import { SAMPLE_PRESETS } from './data/presets';
import { VoiceSelector } from './components/VoiceSelector';
import { AudioPlayer } from './components/AudioPlayer';
import { ClipHistory } from './components/ClipHistory';

const DEFAULT_GEMINI_VOICES: GeminiVoice[] = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Female',
    description: 'Warm, natural, and balanced female voice. Great for narrations, tutorials, and general reading.',
    previewTone: 'Warm & Clear',
    tag: 'Recommended',
    actualVoiceName: 'Kore'
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Male',
    description: 'Deep, authoritative, and steady male voice. Ideal for audiobooks, documentary narration, and news.',
    previewTone: 'Deep & Grounded',
    tag: 'Documentary',
    actualVoiceName: 'Charon'
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Child / Youth',
    description: 'Playful, lively, and spirited youthful voice. Perfect for children stories, animated dialogue, and games.',
    previewTone: 'Youthful & Playful',
    tag: 'Child / Youth',
    actualVoiceName: 'Puck'
  },
  {
    id: 'Aoede',
    name: 'Aoede',
    gender: 'Female',
    description: 'Bright, melodic, and engaging female voice. Excellent for podcasts, announcements, and lifestyle audio.',
    previewTone: 'Melodic & Bright',
    tag: 'Bright',
    actualVoiceName: 'Aoede'
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Male',
    description: 'Resonant, bold, and dramatic male voice. Impactful for theatrical readings, trailers, and presentations.',
    previewTone: 'Bold & Dramatic',
    tag: 'Dramatic',
    actualVoiceName: 'Fenrir'
  },
  {
    id: 'Milo',
    name: 'Milo',
    gender: 'Child / Youth',
    description: 'Curious, bright, and cheerful child voice. Ideal for educational guides, fairy tales, and junior characters.',
    previewTone: 'Bright Child Tone',
    tag: 'Child / Youth',
    actualVoiceName: 'Puck'
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Female',
    description: 'Gentle, airy, and soothing female voice. Wonderful for meditation, sleep stories, and mindfulness guidance.',
    previewTone: 'Calm & Soothing',
    tag: 'Soothing',
    actualVoiceName: 'Aoede'
  }
];

const DEFAULT_ACCENTS: VoiceAccent[] = [
  {
    id: 'en-US',
    name: 'American English',
    code: 'en-US',
    region: 'United States',
    flag: '🇺🇸',
    promptPrefix: 'Speak in an authentic American English accent: '
  },
  {
    id: 'en-GB',
    name: 'British English',
    code: 'en-GB',
    region: 'United Kingdom',
    flag: '🇬🇧',
    promptPrefix: 'Speak in an authentic British English accent (Received Pronunciation): '
  },
  {
    id: 'en-AU',
    name: 'Australian English',
    code: 'en-AU',
    region: 'Australia',
    flag: '🇦🇺',
    promptPrefix: 'Speak in a natural Australian English accent: '
  },
  {
    id: 'en-IN',
    name: 'Indian English',
    code: 'en-IN',
    region: 'India',
    flag: '🇮🇳',
    promptPrefix: 'Speak in a natural Indian English accent: '
  }
];

const DEFAULT_STYLES: SpeechStyle[] = [
  { id: 'natural', label: 'Natural', prompt: '' },
  { id: 'cheerful', label: 'Cheerful & Upbeat', prompt: 'Say cheerfully and warmly: ' },
  { id: 'calm', label: 'Calm & Soothing', prompt: 'Speak in a gentle, relaxing, and soothing tone: ' },
  { id: 'professional', label: 'Professional & Crisp', prompt: 'Speak in a formal, clear, and professional broadcast tone: ' },
  { id: 'dramatic', label: 'Dramatic Storyteller', prompt: 'Narrate dramatically with expressive cadence: ' },
  { id: 'whisper', label: 'Soft & Intimate', prompt: 'Speak in a quiet, soft, and intimate voice: ' }
];

export default function App() {
  const [text, setText] = useState<string>(SAMPLE_PRESETS[0].text);
  const [engine, setEngine] = useState<SpeechEngine>('gemini');
  const [geminiVoices, setGeminiVoices] = useState<GeminiVoice[]>(DEFAULT_GEMINI_VOICES);
  const [selectedVoice, setSelectedVoice] = useState<string>('Charon');
  const [accents, setAccents] = useState<VoiceAccent[]>(DEFAULT_ACCENTS);
  const [selectedAccent, setSelectedAccent] = useState<string>('en-US');
  const [speakingRate, setSpeakingRate] = useState<number>(1.0);
  const [voicePitch, setVoicePitch] = useState<number>(1.0);
  const [styles, setStyles] = useState<SpeechStyle[]>(DEFAULT_STYLES);
  const [selectedStyle, setSelectedStyle] = useState<string>('dramatic');
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  // Multi-speaker dialogue mode
  const [isDialogueMode, setIsDialogueMode] = useState<boolean>(false);
  const [speaker1Name, setSpeaker1Name] = useState<string>('Joe');
  const [speaker1Voice, setSpeaker1Voice] = useState<string>('Kore');
  const [speaker2Name, setSpeaker2Name] = useState<string>('Jane');
  const [speaker2Voice, setSpeaker2Voice] = useState<string>('Puck');

  // Browser speech state
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedBrowserVoiceIndex, setSelectedBrowserVoiceIndex] = useState<number>(0);
  const [isBrowserSpeaking, setIsBrowserSpeaking] = useState<boolean>(false);

  // Clips and generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentClip, setCurrentClip] = useState<GeneratedClip | null>(null);
  const [historyClips, setHistoryClips] = useState<GeneratedClip[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // User accessibility and display preferences
  const [lineWrap, setLineWrap] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('tts_line_wrap');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // Visual spoken word highlight tracking during browser speech
  const [spokenWordHighlight, setSpokenWordHighlight] = useState<{
    charIndex: number;
    charLength: number;
  } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('tts_line_wrap', String(lineWrap));
    } catch {}
  }, [lineWrap]);

  // User Custom Presets state (saved to localStorage)
  const [userPresets, setUserPresets] = useState<UserVoicePreset[]>(() => {
    try {
      const saved = localStorage.getItem('tts_user_voice_presets');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse user presets from localStorage:', e);
    }
    return [];
  });
  const [userPresetNotification, setUserPresetNotification] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('tts_user_voice_presets', JSON.stringify(userPresets));
    } catch (e) {
      console.warn('Failed to save user presets to localStorage:', e);
    }
  }, [userPresets]);

  // Fix Grammar state
  const [isFixingGrammar, setIsFixingGrammar] = useState<boolean>(false);
  const [grammarResult, setGrammarResult] = useState<{
    originalText: string;
    polishedText: string;
    hasChanges: boolean;
  } | null>(null);
  const [undoHistoryText, setUndoHistoryText] = useState<string | null>(null);
  const [grammarFeedback, setGrammarFeedback] = useState<string | null>(null);

  const handleSaveUserPreset = (customName?: string) => {
    let currentVoiceLabel = selectedVoice;
    if (engine === 'browser') {
      currentVoiceLabel = browserVoices[selectedBrowserVoiceIndex]?.name || 'Browser Voice';
    } else {
      const found = geminiVoices.find((v) => v.id === selectedVoice);
      if (found) currentVoiceLabel = found.name;
    }

    const defaultName = `${currentVoiceLabel} (${speakingRate.toFixed(2)}x / ${voicePitch.toFixed(2)}x)`;
    const name = customName?.trim() || defaultName;

    const newPreset: UserVoicePreset = {
      id: 'preset_' + Date.now(),
      name,
      engine,
      voiceId: selectedVoice,
      voiceName: currentVoiceLabel,
      speakingRate,
      voicePitch,
      accent: selectedAccent,
      style: selectedStyle,
      browserVoiceIndex: selectedBrowserVoiceIndex,
      createdAt: Date.now()
    };

    setUserPresets((prev) => [newPreset, ...prev]);
    setUserPresetNotification(`Preset "${name}" saved to local storage!`);
    setTimeout(() => setUserPresetNotification(null), 4000);
  };

  const handleApplyUserPreset = (preset: UserVoicePreset) => {
    setEngine(preset.engine);
    if (preset.engine === 'gemini') {
      setSelectedVoice(preset.voiceId);
      if (preset.accent) setSelectedAccent(preset.accent);
      if (preset.style) setSelectedStyle(preset.style);
    } else if (preset.browserVoiceIndex !== undefined && browserVoices[preset.browserVoiceIndex]) {
      setSelectedBrowserVoiceIndex(preset.browserVoiceIndex);
    }
    setSpeakingRate(preset.speakingRate);
    setVoicePitch(preset.voicePitch);
    setUserPresetNotification(`Applied preset: "${preset.name}"`);
    setTimeout(() => setUserPresetNotification(null), 3000);
  };

  const handleDeleteUserPreset = (presetId: string) => {
    setUserPresets((prev) => prev.filter((p) => p.id !== presetId));
  };

  const handleFixGrammar = async () => {
    if (!text.trim()) {
      setErrorMessage('Please enter or paste a script in the editor first to fix grammar.');
      return;
    }

    setIsFixingGrammar(true);
    setErrorMessage(null);
    setGrammarFeedback(null);

    try {
      const res = await fetch('/api/fix-grammar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          tone: selectedStyle
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze and fix grammar.');
      }

      if (!data.hasChanges) {
        setGrammarFeedback('Your script is already grammatically polished and optimized for natural speech!');
        setTimeout(() => setGrammarFeedback(null), 5000);
      } else {
        setGrammarResult({
          originalText: text,
          polishedText: data.polishedText,
          hasChanges: true
        });
      }
    } catch (err: any) {
      console.error('Fix grammar error:', err);
      setErrorMessage(err.message || 'Could not fix grammar. Please check your Gemini API key or connection.');
    } finally {
      setIsFixingGrammar(false);
    }
  };

  const handleApplyPolishedText = () => {
    if (!grammarResult) return;
    setUndoHistoryText(text);
    setText(grammarResult.polishedText);
    setGrammarResult(null);
    setGrammarFeedback('Polished script applied! You can click "Undo" to revert if desired.');
  };

  const handleUndoPolishedText = () => {
    if (undoHistoryText !== null) {
      setText(undoHistoryText);
      setUndoHistoryText(null);
      setGrammarFeedback('Reverted back to previous script version.');
      setTimeout(() => setGrammarFeedback(null), 4000);
    }
  };

  // Auto-Save script editor mechanism (persists to localStorage every 5s)
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<number | null>(null);
  const [recoveredDraft, setRecoveredDraft] = useState<{ text: string; timestamp: number } | null>(null);
  const textRef = useRef<string>(text);
  const lastSavedTextRef = useRef<string>(text);

  // Check for auto-saved draft on initial mount
  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem('tts_autosave_script_draft');
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (parsed && typeof parsed.text === 'string' && parsed.text.trim().length > 0) {
          // Check if it differs from the default preset text
          if (parsed.text.trim() !== SAMPLE_PRESETS[0].text.trim()) {
            setRecoveredDraft(parsed);
          }
          setLastAutoSavedAt(parsed.timestamp || null);
        }
      }
    } catch (e) {
      console.warn('Failed to inspect auto-saved draft from localStorage:', e);
    }
  }, []);

  // Sync ref with current text state
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  // Periodic 5-second auto-save timer
  useEffect(() => {
    const timer = setInterval(() => {
      const current = textRef.current;
      // Persist if there is text and it differs from last saved version
      if (current && current.trim().length > 0 && current !== lastSavedTextRef.current) {
        try {
          const payload = {
            text: current,
            timestamp: Date.now()
          };
          localStorage.setItem('tts_autosave_script_draft', JSON.stringify(payload));
          lastSavedTextRef.current = current;
          setLastAutoSavedAt(payload.timestamp);
        } catch (e) {
          console.warn('Failed to auto-save script draft:', e);
        }
      }
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const handleRecoverDraft = () => {
    if (recoveredDraft) {
      setUndoHistoryText(text);
      setText(recoveredDraft.text);
      lastSavedTextRef.current = recoveredDraft.text;
      setRecoveredDraft(null);
      setGrammarFeedback('Auto-saved script draft successfully restored!');
      setTimeout(() => setGrammarFeedback(null), 4000);
    }
  };

  const handleDiscardDraft = () => {
    setRecoveredDraft(null);
  };

  const handleManualRestoreCheck = () => {
    try {
      const savedRaw = localStorage.getItem('tts_autosave_script_draft');
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (parsed && typeof parsed.text === 'string' && parsed.text.trim().length > 0) {
          setRecoveredDraft(parsed);
          return;
        }
      }
      setGrammarFeedback('No previous auto-saved draft found in local storage.');
      setTimeout(() => setGrammarFeedback(null), 3500);
    } catch {
      setGrammarFeedback('Could not read saved draft from local storage.');
      setTimeout(() => setGrammarFeedback(null), 3500);
    }
  };

  // Load server config on mount
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.voices && Array.isArray(data.voices)) {
          setGeminiVoices(data.voices);
        }
        if (data.accents && Array.isArray(data.accents)) {
          setAccents(data.accents);
        }
        if (data.styles && Array.isArray(data.styles)) {
          setStyles(data.styles);
        }
        setHasApiKey(Boolean(data.hasApiKey));
        if (!data.hasApiKey) {
          // If no API key, default to browser speech smoothly
          setEngine('browser');
        }
      })
      .catch((err) => {
        console.warn('Could not fetch server config:', err);
      });
  }, []);

  // Initialize browser speech synthesis voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const available = window.speechSynthesis.getVoices();
        if (available && available.length > 0) {
          setBrowserVoices(available);
          const defaultIdx = available.findIndex((v) => v.default || v.lang.startsWith('en'));
          if (defaultIdx !== -1) {
            setSelectedBrowserVoiceIndex(defaultIdx);
          }
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Change accent and auto-select matching browser voice if in browser mode
  const handleAccentChange = (accentId: string) => {
    setSelectedAccent(accentId);
    if (browserVoices.length > 0) {
      const targetLang = accentId.toLowerCase(); // en-us, en-gb, en-au, en-in
      const regionCode = targetLang.split('-')[1]; // us, gb, au, in
      const matchIdx = browserVoices.findIndex(
        (v) =>
          v.lang.toLowerCase().replace('_', '-') === targetLang ||
          v.lang.toLowerCase().includes(regionCode) ||
          v.name.toLowerCase().includes(regionCode)
      );
      if (matchIdx !== -1) {
        setSelectedBrowserVoiceIndex(matchIdx);
      }
    }
  };

  // Keyboard shortcut Ctrl+Enter / Cmd+Enter to generate
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleApplyPreset = (preset: SamplePreset) => {
    setText(preset.text);
    if (preset.recommendedAccent) {
      handleAccentChange(preset.recommendedAccent);
    }
    if (preset.recommendedRate !== undefined) {
      setSpeakingRate(preset.recommendedRate);
    }
    if (preset.recommendedPitch !== undefined) {
      setVoicePitch(preset.recommendedPitch);
    }
    if (preset.isDialogue) {
      setIsDialogueMode(true);
    } else {
      setIsDialogueMode(false);
      setSelectedVoice(preset.recommendedVoice);
      setSelectedStyle(preset.recommendedStyle);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      setErrorMessage('Please enter some text to generate speech.');
      return;
    }

    setErrorMessage(null);

    // BROWSER SPEECH SYNTHESIS
    if (engine === 'browser') {
      if (!('speechSynthesis' in window)) {
        setErrorMessage('Browser Speech Synthesis is not supported in this browser.');
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (browserVoices[selectedBrowserVoiceIndex]) {
        utterance.voice = browserVoices[selectedBrowserVoiceIndex];
      }
      utterance.pitch = voicePitch;
      utterance.rate = speakingRate;
      utterance.lang = selectedAccent;

      utterance.onstart = () => {
        setIsBrowserSpeaking(true);
        setSpokenWordHighlight(null);
      };

      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        if (event.name === 'word' || event.charIndex !== undefined) {
          const charIndex = event.charIndex;
          let charLength = event.charLength || 0;
          if (!charLength || charLength <= 0) {
            const remaining = text.slice(charIndex);
            const match = remaining.match(/^[\w\u00C0-\u024F'-]+/);
            charLength = match ? match[0].length : 1;
          }
          setSpokenWordHighlight({ charIndex, charLength });
        }
      };

      utterance.onend = () => {
        setIsBrowserSpeaking(false);
        setSpokenWordHighlight(null);
      };

      utterance.onerror = (e) => {
        setIsBrowserSpeaking(false);
        setSpokenWordHighlight(null);
        setErrorMessage('Speech playback error: ' + (e.error || 'unknown'));
      };

      window.speechSynthesis.speak(utterance);
      return;
    }

    // GEMINI NEURAL SPEECH SYNTHESIS
    setIsGenerating(true);

    try {
      const payload: any = {
        text: text.trim(),
        voice: selectedVoice,
        accent: selectedAccent,
        rate: speakingRate,
        pitch: voicePitch,
        style: selectedStyle,
        isMultiSpeaker: isDialogueMode
      };

      if (isDialogueMode) {
        payload.multiSpeakerConfig = {
          speakers: [
            { speaker: speaker1Name, voice: speaker1Voice },
            { speaker: speaker2Name, voice: speaker2Voice }
          ]
        };
      }

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.isConfigError) {
          setErrorMessage(data.error);
          setEngine('browser');
        } else {
          throw new Error(data.error || 'Failed to generate speech');
        }
        return;
      }

      // Construct playable audio URL from WAV base64
      const byteCharacters = atob(data.audioBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);

      const accentObj = accents.find((a) => a.id === selectedAccent);
      const styleObj = styles.find((s) => s.id === selectedStyle);

      const newClip: GeneratedClip = {
        id: Math.random().toString(36).substring(2, 9),
        text: text.trim(),
        voiceName: isDialogueMode ? `${speaker1Name} & ${speaker2Name}` : selectedVoice,
        engine: 'gemini',
        accent: accentObj?.name || selectedAccent,
        rate: speakingRate,
        pitch: voicePitch,
        styleName: isDialogueMode ? 'Dialogue' : styleObj?.label,
        audioUrl,
        durationSeconds: data.durationSeconds,
        timestamp: new Date(),
        blob
      };

      setCurrentClip(newClip);
      setHistoryClips((prev) => [newClip, ...prev]);
    } catch (err: any) {
      console.error('Generation error:', err);
      setErrorMessage(err.message || 'Speech generation encountered an issue. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStopBrowserSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsBrowserSpeaking(false);
      setSpokenWordHighlight(null);
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  // Estimated reading duration at ~150 words per minute
  const estimatedSeconds = Math.max(1, Math.round((wordCount / 150) * 60));

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors bg-[#0A0B0D] text-[#E0E0E0] selection:bg-[#C5A059] selection:text-black">
      {/* Top Header */}
      <header className="border-b sticky top-0 z-30 backdrop-blur-md transition-colors bg-[#0A0B0D] border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-[#C5A059] to-[#8C6B3D] rounded-xs rotate-45 flex items-center justify-center text-black shadow-xs">
              <Volume2 className="w-4 h-4 -rotate-45" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight leading-tight text-white">
                Text to Speech <span className="text-[#C5A059]">Studio</span>
              </h1>
              <p className="text-xs hidden sm:block text-white/40">
                Convert script to lifelike neural audio with tone and voice personas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xs border text-white/50 bg-white/5 border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="font-mono text-[11px]">gemini-3.1-flash-tts</span>
            </div>

            {hasApiKey ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-xs border text-[#C5A059] bg-[#C5A059]/10 border-[#C5A059]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
                AI Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-amber-400 bg-amber-950/30 border border-amber-800/40 px-2.5 py-1 rounded-xs">
                Browser Fallback
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error Alert if any */}
        {errorMessage && (
          <div className="p-3.5 rounded-sm bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-start justify-between gap-2 shadow-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white font-bold px-1"
            >
              ×
            </button>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Text Input Studio & Active Player (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Text Input Studio Card */}
            <div className="rounded-sm p-6 shadow-2xl relative overflow-hidden transition-colors border bg-[#111215] border border-white/10 text-[#E0E0E0]">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#C5A059] opacity-90"></div>

              {/* Presets Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5 text-[#C5A059]">
                    <MessageSquareQuote className="w-3.5 h-3.5 text-[#C5A059]" />
                    Quick Presets
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-2.5 py-1 text-xs rounded-xs border transition-all font-medium cursor-pointer bg-[#0E0F12] border-white/10 hover:border-[#C5A059]/50 hover:text-[#C5A059] text-white/70"
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>

                {/* User Presets Quick Access row if any saved */}
                {userPresets.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-white/5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#C5A059]">
                        <Bookmark className="w-3 h-3 text-[#C5A059]" />
                        My Custom Presets ({userPresets.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {userPresets.map((up) => (
                        <button
                          key={up.id}
                          type="button"
                          onClick={() => handleApplyUserPreset(up)}
                          className="px-2.5 py-1 text-xs rounded-xs border transition-all font-medium cursor-pointer flex items-center gap-1.5 bg-[#16171B] border-[#C5A059]/30 text-white/80 hover:text-[#C5A059] hover:border-[#C5A059]"
                          title={`Apply preset: ${up.voiceName} • ${up.speakingRate.toFixed(2)}x rate • ${up.voicePitch.toFixed(2)}x pitch`}
                        >
                          <span className="font-semibold">{up.name}</span>
                          <span className="text-[10px] font-mono text-[#C5A059] font-bold">
                            {up.speakingRate.toFixed(2)}x
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Dialogue Mode Toggle */}
              {engine === 'gemini' && (
                <div className="mb-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsDialogueMode(!isDialogueMode)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-xs transition-colors cursor-pointer ${
                      isDialogueMode
                        ? 'bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/40 font-bold'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Two-Speaker Dialogue Mode</span>
                  </button>
                  {isDialogueMode && (
                    <span className="text-[10px] font-mono text-white/40">
                      Format: &quot;Name: speech line&quot;
                    </span>
                  )}
                </div>
              )}

              {/* Dialogue Speakers Config when active */}
              {isDialogueMode && engine === 'gemini' && (
                <div className="grid grid-cols-2 gap-3 p-3.5 mb-4 rounded-xs border bg-[#0E0F12] border border-white/5">
                  <div>
                    <label className="block text-[10px] font-bold text-[#C5A059] uppercase tracking-wider mb-1">
                      Speaker 1
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={speaker1Name}
                        onChange={(e) => setSpeaker1Name(e.target.value)}
                        className="w-1/2 text-xs rounded-xs px-2 py-1 font-semibold outline-hidden border bg-[#111215] text-white border-white/10 focus:border-[#C5A059]"
                        placeholder="Speaker 1"
                      />
                      <select
                        value={speaker1Voice}
                        onChange={(e) => setSpeaker1Voice(e.target.value)}
                        className="w-1/2 text-xs rounded-xs px-1.5 py-1 outline-hidden border bg-[#111215] text-white border-white/10 focus:border-[#C5A059]"
                      >
                        {geminiVoices.map((v) => (
                          <option key={v.id} value={v.id} className="bg-[#0E0F12]">
                            {v.name} ({v.gender})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#C5A059] uppercase tracking-wider mb-1">
                      Speaker 2
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={speaker2Name}
                        onChange={(e) => setSpeaker2Name(e.target.value)}
                        className="w-1/2 text-xs rounded-xs px-2 py-1 font-semibold outline-hidden border bg-[#111215] text-white border-white/10 focus:border-[#C5A059]"
                        placeholder="Speaker 2"
                      />
                      <select
                        value={speaker2Voice}
                        onChange={(e) => setSpeaker2Voice(e.target.value)}
                        className="w-1/2 text-xs rounded-xs px-1.5 py-1 outline-hidden border bg-[#111215] text-white border-white/10 focus:border-[#C5A059]"
                      >
                        {geminiVoices.map((v) => (
                          <option key={v.id} value={v.id} className="bg-[#0E0F12]">
                            {v.name} ({v.gender})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Text Input Script Toolbar */}
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059]">
                    Script Editor
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Fix Grammar with Gemini Button */}
                  <button
                    type="button"
                    onClick={handleFixGrammar}
                    disabled={isFixingGrammar || !text.trim()}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-xs font-semibold transition-all cursor-pointer border bg-white/5 hover:bg-[#C5A059]/15 text-white/80 hover:text-[#C5A059] border-white/10 hover:border-[#C5A059]/40 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Analyze script with Gemini to correct grammar, polish syntax, and optimize cadence for speech synthesis"
                  >
                    {isFixingGrammar ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C5A059]" />
                        <span>Polishing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Fix Grammar</span>
                      </>
                    )}
                  </button>

                  {/* Line Wrapping Toggle Switch */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs select-none flex items-center gap-1 font-medium text-white/70">
                      <WrapText className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Line Wrap</span>
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={lineWrap}
                      onClick={() => setLineWrap(!lineWrap)}
                      title={lineWrap ? 'Disable line wrapping (Horizontal scrolling for long scripts)' : 'Enable line wrapping (Wrap text to fit screen)'}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-[#C5A059] ${
                        lineWrap ? 'bg-[#C5A059]' : 'bg-white/15'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ease-in-out ${
                          lineWrap ? 'translate-x-4 bg-black' : 'translate-x-0 bg-white/70'
                        }`}
                      />
                    </button>
                    <span className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${
                      lineWrap ? 'text-[#C5A059]' : 'text-white/40'
                    }`}>
                      {lineWrap ? 'ON' : 'OFF'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleManualRestoreCheck}
                    className="text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 text-white/40 hover:text-[#C5A059]"
                    title="Restore last auto-saved script draft from browser storage"
                  >
                    <History className="w-3 h-3 text-[#C5A059]" />
                    <span className="hidden sm:inline">Restore Draft</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setText('')}
                    className="text-[10px] uppercase tracking-wider transition-colors cursor-pointer text-white/40 hover:text-white"
                  >
                    Clear text
                  </button>
                </div>
              </div>

              {/* Auto-Saved Draft Recovery Banner */}
              {recoveredDraft && (
                <div className="mb-3.5 p-3.5 rounded-xs border text-xs shadow-xl transition-all bg-[#16171B] border border-[#C5A059]/50 text-white">
                  <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-white/5">
                    <div className="flex items-center gap-1.5 text-[#C5A059] font-bold uppercase tracking-wider text-[10px]">
                      <HardDriveDownload className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Recover Auto-Saved Script</span>
                      <span className="text-white/40 font-mono text-[9px] font-normal">
                        ({new Date(recoveredDraft.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleDiscardDraft}
                      className="text-white/40 hover:text-white text-xs px-1 cursor-pointer"
                      title="Dismiss"
                    >
                      ×
                    </button>
                  </div>

                  <p className="text-white/75 text-[11px] mb-2.5 font-mono line-clamp-2 bg-black/40 p-2 rounded-xs border border-white/5 leading-relaxed">
                    &ldquo;{recoveredDraft.text.slice(0, 160)}{recoveredDraft.text.length > 160 ? '...' : ''}&rdquo;
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] text-white/40 font-mono">
                      {recoveredDraft.text.length} chars • {recoveredDraft.text.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDiscardDraft}
                        className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold text-white/50 hover:text-white cursor-pointer"
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        onClick={handleRecoverDraft}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-xs cursor-pointer bg-[#C5A059] text-black hover:bg-[#d4ad60]"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Recover Draft</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* User Preset Saved Notification Banner */}
              {userPresetNotification && (
                <div className="mb-3 p-2.5 rounded-xs border text-xs flex items-center justify-between gap-2 shadow-sm transition-all bg-[#111215] border border-[#C5A059]/40 text-white">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-[#C5A059] shrink-0" />
                    <span className="font-medium">{userPresetNotification}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUserPresetNotification(null)}
                    className="text-white/40 hover:text-white text-xs px-1 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Grammar Polish Feedback / Undo Banner */}
              {grammarFeedback && (
                <div className="mb-3 p-2.5 rounded-xs border text-xs flex items-center justify-between gap-2 shadow-sm transition-all bg-[#111215] border border-[#C5A059]/40 text-white">
                  <div className="flex items-center gap-2">
                    <CheckCheck className="w-4 h-4 text-[#C5A059] shrink-0" />
                    <span>{grammarFeedback}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {undoHistoryText !== null && (
                      <button
                        type="button"
                        onClick={handleUndoPolishedText}
                        className="flex items-center gap-1 text-[11px] font-bold text-[#C5A059] hover:underline px-2 py-0.5 rounded-xs bg-[#C5A059]/15 border border-[#C5A059]/30 cursor-pointer"
                      >
                        <Undo2 className="w-3 h-3" />
                        <span>Undo</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setGrammarFeedback(null)}
                      className="text-white/40 hover:text-white text-xs px-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* Grammar Polish & Cadence Review Card */}
              {grammarResult && (
                <div className="mb-3.5 p-3.5 rounded-xs border shadow-xl transition-all bg-[#0E0F12] border border-[#C5A059]/50 text-white">
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#C5A059]" />
                      <span className="text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                        Gemini Speech Script Polish
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30">
                        Gemini 3.8 Flash
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGrammarResult(null)}
                      className="text-white/40 hover:text-white text-xs px-1 cursor-pointer"
                      title="Dismiss review"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-[11px] text-white/70 mb-2.5">
                    Your script was refined for natural vocal delivery with corrected grammar, organic speech pauses, and spoken phrasing:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    <div className="p-2.5 rounded-xs bg-black/40 border border-white/5">
                      <div className="text-[10px] uppercase font-bold text-white/40 tracking-wider mb-1">
                        Original Script
                      </div>
                      <div className="text-xs text-white/60 max-h-28 overflow-y-auto font-mono whitespace-pre-wrap">
                        {grammarResult.originalText}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xs bg-[#16171B] border border-[#C5A059]/30">
                      <div className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider mb-1 flex items-center justify-between">
                        <span>Polished for Speech</span>
                        <span className="text-[9px] font-mono text-[#C5A059]/80 font-bold">Optimized</span>
                      </div>
                      <div className="text-xs text-white max-h-28 overflow-y-auto whitespace-pre-wrap font-medium">
                        {grammarResult.polishedText}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="text-[10px] text-white/40 font-mono">
                      Applying replaces editor text (revertable with Undo).
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(grammarResult.polishedText);
                          setGrammarFeedback('Polished script copied to clipboard!');
                          setTimeout(() => setGrammarFeedback(null), 3000);
                        }}
                        className="px-2.5 py-1 text-xs rounded-xs font-semibold text-white/70 hover:text-white bg-white/5 border border-white/10 hover:border-white/30 cursor-pointer"
                      >
                        Copy Text
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyPolishedText}
                        className="flex items-center gap-1 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-xs cursor-pointer bg-[#C5A059] text-black hover:bg-[#d4ad60]"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply Polished Script</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Visual Word Highlighter during Browser Speech Synthesis */}
              {engine === 'browser' && isBrowserSpeaking && (
                <div className="mb-3 p-3.5 rounded-xs border transition-all bg-[#0E0F12] border border-[#C5A059]/40 text-white/90 shadow-inner">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[10px] uppercase font-bold tracking-widest text-[#C5A059]">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C5A059] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C5A059]"></span>
                      </span>
                      <span>Live Word Tracker (Browser Speech)</span>
                    </div>
                    {spokenWordHighlight ? (
                      <span className="font-mono text-white/70">
                        Active Word: <mark className="bg-[#C5A059] text-black font-extrabold px-1.5 py-0.5 rounded-xs">{text.slice(spokenWordHighlight.charIndex, spokenWordHighlight.charIndex + spokenWordHighlight.charLength) || '...'}</mark>
                      </span>
                    ) : (
                      <span className="font-mono text-white/40">Reading script...</span>
                    )}
                  </div>

                  <div className={`text-sm leading-relaxed max-h-28 overflow-y-auto pr-1 ${lineWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre overflow-x-auto font-mono'}`}>
                    {spokenWordHighlight ? (
                      <>
                        <span className="text-white/40">
                          {text.slice(0, spokenWordHighlight.charIndex)}
                        </span>
                        <mark className="bg-[#C5A059] text-black font-black px-1.5 py-0.5 rounded-xs mx-0.5 shadow-md scale-105 inline-block ring-2 ring-white">
                          {text.slice(spokenWordHighlight.charIndex, spokenWordHighlight.charIndex + spokenWordHighlight.charLength)}
                        </mark>
                        <span className="text-white/90">
                          {text.slice(spokenWordHighlight.charIndex + spokenWordHighlight.charLength)}
                        </span>
                      </>
                    ) : (
                      <span className="text-white/70">{text}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Textarea Input */}
              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={lineWrap ? 6 : 7}
                  wrap={lineWrap ? 'soft' : 'off'}
                  placeholder="Type or paste text here to convert into natural speech..."
                  className={`w-full p-4 text-sm rounded-xs transition-all resize-y leading-relaxed ${
                    lineWrap
                      ? 'whitespace-pre-wrap break-words overflow-x-hidden'
                      : 'whitespace-pre overflow-x-auto font-mono'
                  } bg-[#0E0F12] text-white/90 placeholder:text-white/30 border border-white/10 focus:bg-[#0E0F12] focus:outline-hidden focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]/40 font-light`}
                />
              </div>

              {/* Metadata & Generate Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-3 text-xs font-mono text-white/40">
                  <span>{charCount} chars</span>
                  <span>•</span>
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>~{estimatedSeconds}s audio</span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 text-white/50" title="Script automatically saves to browser storage every 5 seconds">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                    <span>
                      {lastAutoSavedAt
                        ? `Auto-saved ${new Date(lastAutoSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'Auto-save (5s)'}
                    </span>
                  </span>
                  {!lineWrap && (
                    <span className="text-[#C5A059] font-sans text-[11px] font-semibold hidden sm:inline-block">
                      (Horizontal Scroll Enabled)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {engine === 'browser' && isBrowserSpeaking && (
                    <button
                      type="button"
                      onClick={handleStopBrowserSpeech}
                      className="px-3 py-2 rounded-xs text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer bg-rose-950/60 text-rose-300 border border-rose-800/60 hover:bg-rose-900/80"
                    >
                      Stop Speaking
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating || !text.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xs text-xs uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-all active:scale-98 cursor-pointer text-black bg-[#C5A059] hover:bg-[#d1ab64] font-bold"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                        <span>Synthesizing Audio...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{engine === 'gemini' ? 'Generate Speech' : 'Speak Text'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Generated Audio Player (Featured) */}
            {currentClip && (
              <div>
                <div className="flex items-center gap-2 mb-2.5 px-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059]">
                    Synthesized Audio Result
                  </h2>
                </div>
                <AudioPlayer clip={currentClip} autoPlay={true} />
              </div>
            )}

            {/* Browser Speech Active Banner */}
            {engine === 'browser' && isBrowserSpeaking && (
              <div className="rounded-xs p-4 flex items-center justify-between border bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059]">
                <div className="flex items-center gap-2.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-ping" />
                  <span className="font-semibold">Browser Speech synthesis is active...</span>
                </div>
                <button
                  type="button"
                  onClick={handleStopBrowserSpeech}
                  className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-xs cursor-pointer bg-black/40 text-rose-300 border border-rose-700/50 hover:bg-rose-950/60"
                >
                  Stop
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Voice Selection, Tone Controls, and Clip History (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Voice & Controls Card */}
            <div className="rounded-sm p-6 shadow-2xl relative overflow-hidden transition-colors border bg-[#111215] border border-white/10 text-[#E0E0E0]">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#C5A059] opacity-90"></div>
              <VoiceSelector
                engine={engine}
                onEngineChange={setEngine}
                geminiVoices={geminiVoices}
                selectedVoice={selectedVoice}
                onVoiceChange={setSelectedVoice}
                accents={accents}
                selectedAccent={selectedAccent}
                onAccentChange={handleAccentChange}
                speakingRate={speakingRate}
                onSpeakingRateChange={setSpeakingRate}
                voicePitch={voicePitch}
                onVoicePitchChange={setVoicePitch}
                styles={styles}
                selectedStyle={selectedStyle}
                onStyleChange={setSelectedStyle}
                browserVoices={browserVoices}
                selectedBrowserVoiceIndex={selectedBrowserVoiceIndex}
                onBrowserVoiceChange={setSelectedBrowserVoiceIndex}
                hasApiKey={hasApiKey}
                userPresets={userPresets}
                onSaveUserPreset={handleSaveUserPreset}
                onApplyUserPreset={handleApplyUserPreset}
                onDeleteUserPreset={handleDeleteUserPreset}
              />
            </div>

            {/* History of Clips */}
            <ClipHistory
              clips={historyClips}
              onSelectClip={setCurrentClip}
              onClearHistory={() => setHistoryClips([])}
              currentClipId={currentClip?.id}
            />

            {/* Practical Usage Notes */}
            <div className="p-4 rounded-sm border text-xs space-y-2 bg-[#0E0F12] border border-white/5 text-white/50">
              <div className="font-bold text-[#C5A059] text-[10px] uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Text-to-Speech Capabilities</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] leading-normal text-white/40 font-light">
                <li>Studio Neural synthesis runs at 24,000 Hz, 16-bit linear PCM.</li>
                <li>WAV &amp; Compressed MP3 (192kbps / 128kbps) export with in-browser encoding.</li>
                <li>Toggle Line Wrapping for script editing or horizontal code-style inspection.</li>
                <li>Live Word Tracker automatically follows speech in Browser Speech mode.</li>
                <li>Press <kbd className="font-mono bg-white/10 px-1.5 py-0.5 rounded-xs border border-white/10 text-[#C5A059]">Cmd+Enter</kbd> to synthesize instantly.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 text-center text-[11px] font-mono tracking-widest uppercase transition-colors bg-[#07080A] border-white/5 text-white/30">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Sample Rate: 24.0 kHz &bull; Output: WAV &amp; MP3 &bull; Studio Neural Speech</span>
          <span>Powered by Gemini &amp; Web Speech</span>
        </div>
      </footer>
    </div>
  );
}
