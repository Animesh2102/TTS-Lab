import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Helper to wrap raw 16-bit PCM (24kHz mono) into a valid WAV file with RIFF header
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  // If the audio buffer already has a RIFF header, return it as-is
  if (pcmBuffer.length >= 4 && pcmBuffer.toString("ascii", 0, 4) === "RIFF") {
    return pcmBuffer;
  }

  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // 16 for PCM
  header.writeUInt16LE(1, 20); // AudioFormat 1 = PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

const AVAILABLE_VOICES = [
  {
    id: "Kore",
    name: "Kore",
    gender: "Female",
    description: "Warm, natural, and balanced female voice. Great for narrations, tutorials, and general reading.",
    previewTone: "Warm & Clear",
    tag: "Recommended",
    actualVoiceName: "Kore"
  },
  {
    id: "Charon",
    name: "Charon",
    gender: "Male",
    description: "Deep, authoritative, and steady male voice. Ideal for audiobooks, documentary narration, and news.",
    previewTone: "Deep & Grounded",
    tag: "Documentary",
    actualVoiceName: "Charon"
  },
  {
    id: "Puck",
    name: "Puck",
    gender: "Child / Youth",
    description: "Playful, lively, and spirited youthful voice. Perfect for children's stories, animated dialogue, and games.",
    previewTone: "Youthful & Playful",
    tag: "Child / Youth",
    actualVoiceName: "Puck"
  },
  {
    id: "Aoede",
    name: "Aoede",
    gender: "Female",
    description: "Bright, melodic, and engaging female voice. Excellent for podcasts, announcements, and lifestyle audio.",
    previewTone: "Melodic & Bright",
    tag: "Bright",
    actualVoiceName: "Aoede"
  },
  {
    id: "Fenrir",
    name: "Fenrir",
    gender: "Male",
    description: "Resonant, bold, and dramatic male voice. Impactful for theatrical readings, trailers, and presentations.",
    previewTone: "Bold & Dramatic",
    tag: "Dramatic",
    actualVoiceName: "Fenrir"
  },
  {
    id: "Milo",
    name: "Milo",
    gender: "Child / Youth",
    description: "Curious, bright, and cheerful child voice. Ideal for educational guides, fairy tales, and junior characters.",
    previewTone: "Bright Child Tone",
    tag: "Child / Youth",
    actualVoiceName: "Puck"
  },
  {
    id: "Zephyr",
    name: "Zephyr",
    gender: "Female",
    description: "Gentle, airy, and soothing female voice. Wonderful for meditation, sleep stories, and mindfulness guidance.",
    previewTone: "Calm & Soothing",
    tag: "Soothing",
    actualVoiceName: "Aoede"
  }
];

const AVAILABLE_ACCENTS = [
  {
    id: "en-US",
    name: "American English",
    code: "en-US",
    region: "United States",
    flag: "🇺🇸",
    promptPrefix: "Speak in an authentic American English accent: "
  },
  {
    id: "en-GB",
    name: "British English",
    code: "en-GB",
    region: "United Kingdom",
    flag: "🇬🇧",
    promptPrefix: "Speak in an authentic British English accent (Received Pronunciation): "
  },
  {
    id: "en-AU",
    name: "Australian English",
    code: "en-AU",
    region: "Australia",
    flag: "🇦🇺",
    promptPrefix: "Speak in a natural Australian English accent: "
  },
  {
    id: "en-IN",
    name: "Indian English",
    code: "en-IN",
    region: "India",
    flag: "🇮🇳",
    promptPrefix: "Speak in a natural Indian English accent: "
  }
];

const PRESET_STYLES = [
  { id: "natural", label: "Natural", prompt: "" },
  { id: "cheerful", label: "Cheerful & Friendly", prompt: "Say cheerfully and warmly: " },
  { id: "calm", label: "Calm & Soothing", prompt: "Speak in a gentle, relaxing, and soothing tone: " },
  { id: "professional", label: "Professional & Crisp", prompt: "Speak in a formal, clear, and professional broadcast tone: " },
  { id: "dramatic", label: "Dramatic Storyteller", prompt: "Narrate dramatically with expressive cadence: " },
  { id: "whisper", label: "Soft & Intimate", prompt: "Speak in a quiet, soft, and intimate voice: " }
];

// Status and configuration endpoint
app.get("/api/config", (req, res) => {
  const hasApiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  res.json({
    hasApiKey,
    voices: AVAILABLE_VOICES,
    accents: AVAILABLE_ACCENTS,
    styles: PRESET_STYLES
  });
});

// Fallback speech normalizer and grammar refiner when Gemini API key is not present or offline
function ruleBasedSpeechPolish(rawText: string): string {
  let text = rawText.trim();

  // Spoken expansions for common TTS symbols
  text = text.replace(/(\d+)\s*%/g, "$1 percent");
  text = text.replace(/\$(\d+(?:\.\d{2})?)/g, "$1 dollars");
  text = text.replace(/&/g, " and ");
  text = text.replace(/\bw\/\b/gi, "with");
  text = text.replace(/\bw\/o\b/gi, "without");
  text = text.replace(/\betc\./gi, "etcetera");
  text = text.replace(/\be\.g\.,?/gi, "for example,");
  text = text.replace(/\bi\.e\.,?/gi, "that is,");
  text = text.replace(/\bvs\.?\b/gi, "versus");
  text = text.replace(/\bDr\.\s*/g, "Doctor ");
  text = text.replace(/\bMr\.\s*/g, "Mister ");
  text = text.replace(/\bMrs\.\s*/g, "Missus ");
  text = text.replace(/\bProf\.\s*/g, "Professor ");

  // Missing apostrophes and common typos
  const contractionFixes: [RegExp, string][] = [
    [/\bi\b/g, "I"],
    [/\bim\b/gi, "I'm"],
    [/\bive\b/gi, "I've"],
    [/\bill\b/g, "I'll"],
    [/\bdont\b/gi, "don't"],
    [/\bcant\b/gi, "can't"],
    [/\bwont\b/gi, "won't"],
    [/\bdoesnt\b/gi, "doesn't"],
    [/\bisnt\b/gi, "isn't"],
    [/\barent\b/gi, "aren't"],
    [/\bwasnt\b/gi, "wasn't"],
    [/\bwerent\b/gi, "weren't"],
    [/\bcouldnt\b/gi, "couldn't"],
    [/\bshouldnt\b/gi, "shouldn't"],
    [/\bwouldnt\b/gi, "wouldn't"],
    [/\byoure\b/gi, "you're"],
    [/\btheyre\b/gi, "they're"],
    [/\bweve\b/gi, "we've"],
    [/\bthats\b/gi, "that's"],
    [/\bwhats\b/gi, "what's"],
    [/\blets\b/gi, "let's"],
    [/\btheres\b/gi, "there's"],
    [/\bcause\b/gi, "because"],
    [/\bgonna\b/gi, "going to"],
    [/\bwanna\b/gi, "want to"]
  ];

  for (const [regex, replacement] of contractionFixes) {
    text = text.replace(regex, replacement);
  }

  // Normalize excessive punctuation and spaces
  text = text.replace(/\s+/g, " ");
  text = text.replace(/\s+([.,!?;:])/g, "$1");
  text = text.replace(/([.,!?;:])(?=[a-zA-Z])/g, "$1 ");

  // Capitalize sentences
  text = text.replace(/(^|[.!?]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());

  // Ensure speech ends with clean sentence punctuation if it ends with alphanumeric
  if (/[a-zA-Z0-9]$/.test(text)) {
    text += ".";
  }

  return text;
}

// Fix Grammar & Polish script for speech synthesis endpoint
app.post("/api/fix-grammar", async (req, res) => {
  try {
    const { text, tone = "natural" } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "Script text is required to fix grammar." });
    }

    // If GEMINI_API_KEY is missing, gracefully use the built-in linguistic rules engine
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim().length === 0) {
      const polished = ruleBasedSpeechPolish(text);
      return res.json({
        success: true,
        originalText: text,
        polishedText: polished,
        hasChanges: polished.trim() !== text.trim(),
        usedFallback: true
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });

      const prompt = `You are a professional voiceover coach, linguist, and speech script editor.
Analyze the following script, correct all grammatical, syntactic, spelling, punctuation, and phrasing flaws, and transform it into a polished, natural-sounding script optimized specifically for speech synthesis.

Optimization directives:
1. Fix all grammar, typo, syntax, and phrasing mistakes.
2. Insert natural punctuation (commas, em-dashes, periods) to ensure the text-to-speech engine speaks with organic cadence and breathing pauses.
3. Clarify ambiguous symbols, abbreviations, and units into spoken equivalents where appropriate (e.g., "$25" -> "twenty-five dollars", "etc." -> "and so forth" or "etcetera", "Dr." -> "Doctor").
4. Preserve speaker tags (such as "Joe:", "Narrator:") if present.
5. Match the desired tone: ${tone}.
6. Output ONLY the polished script text without conversational meta-commentary, introductory remarks, or markdown block wrapping.

Script to refine:
${text.trim()}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert speech synthesis script editor. Return only the polished script text.",
          temperature: 0.3
        }
      });

      const polishedText = response.text?.trim();

      if (polishedText && polishedText.length > 0) {
        return res.json({
          success: true,
          originalText: text,
          polishedText,
          hasChanges: polishedText.trim() !== text.trim(),
          usedFallback: false
        });
      }
    } catch (aiError: any) {
      console.warn("Gemini API grammar polish failed, falling back to linguistic engine:", aiError?.message);
    }

    // Secondary fallback if AI call threw an error or returned empty
    const polishedFallback = ruleBasedSpeechPolish(text);
    return res.json({
      success: true,
      originalText: text,
      polishedText: polishedFallback,
      hasChanges: polishedFallback.trim() !== text.trim(),
      usedFallback: true
    });
  } catch (error: any) {
    console.error("Fix grammar error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to analyze and fix grammar."
    });
  }
});

// Text to Speech synthesis endpoint
app.post("/api/tts", async (req, res) => {
  try {
    const {
      text,
      voice = "Kore",
      accent = "en-US",
      rate = 1.0,
      pitch = 1.0,
      style = "natural",
      isMultiSpeaker = false,
      multiSpeakerConfig
    } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "Text content is required." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: "GEMINI_API_KEY is not configured in the environment. You can use the built-in Browser Speech engine as a zero-setup fallback!",
        isConfigError: true
      });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });

    let speechPrompt = text.trim();

    // Find voice configuration
    const selectedVoiceObj = AVAILABLE_VOICES.find((v) => v.id === voice);
    const actualVoiceName = selectedVoiceObj?.actualVoiceName || voice || "Kore";

    // Build vocal instruction prompt if non-multi-speaker
    if (!isMultiSpeaker) {
      const instructions: string[] = [];

      // Accent instruction
      const matchedAccent = AVAILABLE_ACCENTS.find((a) => a.id === accent || a.code === accent);
      if (matchedAccent && matchedAccent.id !== "en-US") {
        instructions.push(matchedAccent.promptPrefix.replace(/: $/, ""));
      }

      // Child / Youth persona extra conditioning
      if (voice === "Milo") {
        instructions.push("Speak in a lively, cheerful young child's voice");
      }

      // Rate conditioning
      if (rate > 1.25) {
        instructions.push("Speak at a fast, brisk pace");
      } else if (rate < 0.85) {
        instructions.push("Speak slowly and deliberately");
      }

      // Pitch conditioning
      if (pitch > 1.2) {
        instructions.push("Use a higher, upbeat vocal pitch");
      } else if (pitch < 0.85) {
        instructions.push("Use a deeper, lower vocal pitch");
      }

      // Style conditioning
      const matchedStyle = PRESET_STYLES.find((s) => s.id === style);
      if (matchedStyle && matchedStyle.prompt) {
        instructions.push(matchedStyle.prompt.replace(/: $/, ""));
      }

      if (instructions.length > 0) {
        speechPrompt = `[Voice direction: ${instructions.join(", ")}]\n${speechPrompt}`;
      }
    }

    let response;

    if (isMultiSpeaker && multiSpeakerConfig && Array.isArray(multiSpeakerConfig.speakers) && multiSpeakerConfig.speakers.length === 2) {
      // Multi-speaker generation
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: speechPrompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: multiSpeakerConfig.speakers[0].speaker,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: multiSpeakerConfig.speakers[0].voice || "Kore" }
                  }
                },
                {
                  speaker: multiSpeakerConfig.speakers[1].speaker,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: multiSpeakerConfig.speakers[1].voice || "Puck" }
                  }
                }
              ]
            }
          }
        }
      });
    } else {
      // Single speaker generation
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: speechPrompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: actualVoiceName }
            }
          }
        }
      });
    }

    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    const base64Audio = inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({
        error: "The speech generation model did not return audio data. Please try another prompt or voice."
      });
    }

    const rawBuffer = Buffer.from(base64Audio, "base64");
    // Ensure standard WAV header is present for instant cross-browser playback and downloads
    const wavBuffer = pcmToWav(rawBuffer, 24000, 1, 16);
    const wavBase64 = wavBuffer.toString("base64");
    const durationSeconds = rawBuffer.length / (24000 * 2); // 24kHz * 2 bytes per sample (16-bit mono)

    return res.json({
      success: true,
      audioBase64: wavBase64,
      mimeType: "audio/wav",
      sampleRate: 24000,
      durationSeconds: Math.max(0.5, Math.round(durationSeconds * 10) / 10),
      voice,
      accent,
      rate,
      pitch,
      textLength: text.length
    });
  } catch (error: any) {
    console.error("TTS generation error:", error);
    const message = error?.message || "Failed to generate speech audio";
    return res.status(500).json({
      error: message
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
