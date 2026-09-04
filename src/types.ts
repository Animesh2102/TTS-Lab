export type VoiceGender = 'Female' | 'Male' | 'Child / Youth';

export interface GeminiVoice {
  id: string;
  name: string;
  gender: VoiceGender;
  description: string;
  previewTone: string;
  tag: string;
  actualVoiceName?: string; // underlying API voice (e.g. Puck, Kore, Charon, Aoede, Fenrir)
}

export interface VoiceAccent {
  id: string;
  name: string;
  code: string; // e.g. en-US, en-GB, en-AU
  region: string;
  flag: string;
  promptPrefix: string;
}

export interface SpeechStyle {
  id: string;
  label: string;
  prompt: string;
}

export type SpeechEngine = 'gemini' | 'browser';

export interface GeneratedClip {
  id: string;
  text: string;
  voiceName: string;
  engine: SpeechEngine;
  accent?: string;
  styleName?: string;
  rate?: number;
  pitch?: number;
  audioUrl: string;
  durationSeconds: number;
  timestamp: Date;
  blob?: Blob;
}

export interface SamplePreset {
  id: string;
  title: string;
  category: string;
  text: string;
  recommendedVoice: string;
  recommendedStyle: string;
  recommendedAccent?: string;
  recommendedRate?: number;
  recommendedPitch?: number;
  isDialogue?: boolean;
}

export interface UserVoicePreset {
  id: string;
  name: string;
  engine: SpeechEngine;
  voiceId: string;
  voiceName: string;
  speakingRate: number;
  voicePitch: number;
  accent?: string;
  style?: string;
  browserVoiceIndex?: number;
  createdAt: number;
}

