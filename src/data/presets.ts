import { SamplePreset } from '../types';

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'narration',
    title: 'Story Narration',
    category: 'Literature',
    text: 'The ancient observatory perched quietly upon the crest of Mount Solitude. Through its bronze telescope, astronomers had traced wandering comets for three hundred years, waiting for the one star that never moved.',
    recommendedVoice: 'Charon',
    recommendedStyle: 'dramatic',
    recommendedAccent: 'en-GB',
    recommendedRate: 0.95,
    recommendedPitch: 0.9
  },
  {
    id: 'child-story',
    title: 'Junior Adventure',
    category: 'Child / Youth',
    text: 'Look at that giant mushroom fort over by the rainbow pond! If we hop across those lily pads fast enough, we might catch the fireflies before dinnertime!',
    recommendedVoice: 'Milo',
    recommendedStyle: 'cheerful',
    recommendedAccent: 'en-US',
    recommendedRate: 1.1,
    recommendedPitch: 1.2
  },
  {
    id: 'announcement',
    title: 'Product Launch',
    category: 'Commercial',
    text: 'Good morning, and welcome! Today, we are thrilled to unveil our next-generation studio audio suite. Designed with zero latency and studio-grade acoustics, creating compelling audio has never felt this effortless.',
    recommendedVoice: 'Puck',
    recommendedStyle: 'cheerful',
    recommendedAccent: 'en-US',
    recommendedRate: 1.05,
    recommendedPitch: 1.0
  },
  {
    id: 'australian-nature',
    title: 'Outback Expedition',
    category: 'Documentary',
    text: 'Across the vast red plains of the Kimberley, morning arrives with a sudden chorus of kookaburras. The rugged eucalyptus ridges stretch as far as the eye can see under the brilliant southern sky.',
    recommendedVoice: 'Aoede',
    recommendedStyle: 'natural',
    recommendedAccent: 'en-AU',
    recommendedRate: 1.0,
    recommendedPitch: 1.0
  },
  {
    id: 'meditation',
    title: 'Mindful Breathing',
    category: 'Wellness',
    text: 'Gently lower your gaze or close your eyes. Inhale slowly through your nose for four counts... hold calmly at the top... and release with a smooth, lingering exhale. Allow every muscle to rest.',
    recommendedVoice: 'Zephyr',
    recommendedStyle: 'calm',
    recommendedAccent: 'en-GB',
    recommendedRate: 0.85,
    recommendedPitch: 0.95
  },
  {
    id: 'news',
    title: 'Daily Tech Brief',
    category: 'Broadcast',
    text: 'In global technology news, clean-energy grid networks saw a forty percent increase in solar storage efficiency this quarter. Engineers report that adaptive power routing stabilized urban grids ahead of summer peaks.',
    recommendedVoice: 'Kore',
    recommendedStyle: 'professional',
    recommendedAccent: 'en-US',
    recommendedRate: 1.0,
    recommendedPitch: 1.0
  },
  {
    id: 'dialogue',
    title: 'Two-Speaker Dialogue',
    category: 'Conversation',
    text: 'Joe: Have you double-checked the atmospheric readings for sector seven?\nJane: All sensors are green. Solar winds are nominal, and we have full telemetry.',
    recommendedVoice: 'Fenrir',
    recommendedStyle: 'natural',
    recommendedAccent: 'en-US',
    isDialogue: true
  }
];
