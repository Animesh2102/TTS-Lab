# Text to Speech Studio

> Studio-grade text-to-speech web application powered by **Gemini Neural Speech** and the **Web Speech API**, featuring voice tone controls, two-speaker dialogue, waveform visualization, speech grammar polish, and high-fidelity WAV & MP3 export.

---

## ✨ Features

- 🎙️ **Dual Synthesis Engines**:
  - **Gemini Neural Speech**: Studio-grade 24,000 Hz, 16-bit linear PCM audio generated using Gemini multimodal capabilities.
  - **Browser Web Speech API**: Zero-configuration, zero-API-key client-side fallback with live spoken word highlighting.
- 🎭 **Curated Voice Personas**:
  - Male, female, and expressive voices (Kore, Charon, Fenrir, Puck, Aoede, and more) with distinct acoustic characteristics.
  - Filter voices by gender or preview sample recordings.
- 🌍 **Dialect & Accent Calibration**:
  - Standard American (`en-US`), British (`en-GB`), Australian (`en-AU`), and Indian (`en-IN`) speech conditioning.
- 🎛️ **Cadence & Pitch Controls**:
  - Speaking rate adjustment (0.5x – 2.0x) with quick presets.
  - Vocal pitch modulation (0.5x – 1.5x) for custom intonation.
- ✨ **Speech Script & Grammar Polish**:
  - One-click script optimizer to fix typos, expand abbreviations for voice clarity (e.g., "$10" to "10 dollars"), and inject natural breathing punctuation.
  - Powered by Gemini with an automatic offline linguistic fallback engine.
  - Side-by-side diff review with instant **Apply** and **Undo**.
- 👥 **Two-Speaker Dialogue Mode**:
  - Synthesize conversations between two distinct voices (e.g., "Narrator: ... / Hero: ...").
- 📊 **Interactive Waveform Player**:
  - Real-time animated waveform display with seek scrub bar, playback speed control (0.75x to 2x), and loop toggle.
- 💾 **Export Formats**:
  - Uncompressed 24 kHz WAV (PCM).
  - Compressed MP3 (192 kbps high quality or 128 kbps standard) via in-browser LAME encoding.
- 🔖 **Saved Custom Presets & History**:
  - Save favorite voice, pitch, and speed configurations to local storage.
  - Session clip history with instant playback and re-download.
- 🛡️ **Auto-Saved Drafts**:
  - Automatic local recovery if you accidentally refresh or close your browser tab.
- ⌨️ **Keyboard Shortcut**:
  - Press `Cmd + Enter` or `Ctrl + Enter` to synthesize speech immediately.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS v4, Motion, Lucide Icons.
- **Backend**: Express 4, Node.js, `tsx` (development), `esbuild` (production bundle).
- **AI & Audio**:
  - `@google/genai` (Gemini Neural TTS & script optimization).
  - `@breezystack/lamejs` (Client-side MP3 encoding).
  - Web Audio API (PCM playback, gain, waveform rendering).

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm` or `bun`

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/<your-username>/tts-studio.git
cd tts-studio
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root (you can copy `.env.example`):

```bash
cp .env.example .env
```

Add your Google Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Note**: An API key is optional! If no key is provided, the application will automatically offer the **Browser Speech** engine so all core text-to-speech features remain functional without any configuration.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Production Build

To build the application for production:

```bash
npm run build
```

This compiles:
1. The client-side Vite application into `/dist`.
2. The Express server into a standalone bundle at `dist/server.cjs`.

To run the production server:

```bash
npm start
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/config` | Returns available voices, accents, and whether `GEMINI_API_KEY` is loaded. |
| `POST` | `/api/tts` | Generates neural speech audio (WAV format) from input text. |
| `POST` | `/api/fix-grammar` | Optimizes script phrasing, punctuation, and cadence for natural spoken delivery. |

---

## 📄 License

MIT License. Feel free to use, modify, and distribute this project.
