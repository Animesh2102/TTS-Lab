import { Mp3Encoder } from '@breezystack/lamejs';

export type AudioCodec = 'wav' | 'mp3-128' | 'mp3-192';

export interface CodecOption {
  id: AudioCodec;
  format: 'wav' | 'mp3';
  label: string;
  sublabel: string;
  extension: 'wav' | 'mp3';
  bitrate?: number;
}

export const CODEC_OPTIONS: CodecOption[] = [
  {
    id: 'wav',
    format: 'wav',
    label: 'WAV',
    sublabel: 'Lossless PCM • 24kHz • Studio Original',
    extension: 'wav'
  },
  {
    id: 'mp3-192',
    format: 'mp3',
    label: 'MP3 High',
    sublabel: '192 kbps • Crisp Compression • Podcasts & Video',
    extension: 'mp3',
    bitrate: 192
  },
  {
    id: 'mp3-128',
    format: 'mp3',
    label: 'MP3 Standard',
    sublabel: '128 kbps • Lightweight • Fast Sharing',
    extension: 'mp3',
    bitrate: 128
  }
];

/**
 * Converts a WAV Blob to an MP3 Blob using client-side LAME encoder.
 */
export async function convertWavToMp3(wavBlob: Blob, bitrate: number = 192): Promise<Blob> {
  const arrayBuffer = await wavBlob.arrayBuffer();

  // Use AudioContext to decode audio safely into raw PCM samples
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioCtx();

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;

    const mp3encoder = new Mp3Encoder(channels, sampleRate, bitrate);
    const mp3Data: Uint8Array[] = [];

    const sampleBlockSize = 1152; // LAME frame size

    if (channels === 1) {
      // Mono audio
      const channelData = audioBuffer.getChannelData(0);
      const samples = new Int16Array(channelData.length);

      // Convert Float32 to Int16
      for (let i = 0; i < channelData.length; i++) {
        const s = Math.max(-1, Math.min(1, channelData[i]));
        samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      for (let i = 0; i < samples.length; i += sampleBlockSize) {
        const sampleChunk = samples.subarray(i, i + sampleBlockSize);
        const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
        if (mp3buf.length > 0) {
          mp3Data.push(mp3buf);
        }
      }
    } else {
      // Stereo audio
      const leftData = audioBuffer.getChannelData(0);
      const rightData = audioBuffer.getChannelData(1);
      const length = leftData.length;

      const leftSamples = new Int16Array(length);
      const rightSamples = new Int16Array(length);

      for (let i = 0; i < length; i++) {
        const l = Math.max(-1, Math.min(1, leftData[i]));
        const r = Math.max(-1, Math.min(1, rightData[i]));
        leftSamples[i] = l < 0 ? l * 0x8000 : l * 0x7fff;
        rightSamples[i] = r < 0 ? r * 0x8000 : r * 0x7fff;
      }

      for (let i = 0; i < length; i += sampleBlockSize) {
        const leftChunk = leftSamples.subarray(i, i + sampleBlockSize);
        const rightChunk = rightSamples.subarray(i, i + sampleBlockSize);
        const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
        if (mp3buf.length > 0) {
          mp3Data.push(mp3buf);
        }
      }
    }

    const endBuf = mp3encoder.flush();
    if (endBuf.length > 0) {
      mp3Data.push(endBuf);
    }

    return new Blob(mp3Data, { type: 'audio/mp3' });
  } finally {
    audioContext.close().catch(() => {});
  }
}

/**
 * Downloads audio in the chosen format (WAV or MP3).
 */
export async function downloadAudioClip(
  clipBlob: Blob | undefined,
  clipUrl: string,
  voiceName: string,
  codec: AudioCodec
): Promise<void> {
  const selectedOption = CODEC_OPTIONS.find((c) => c.id === codec) || CODEC_OPTIONS[0];
  const cleanVoice = voiceName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const timestamp = Date.now();
  const filename = `speech-${cleanVoice}-${timestamp}.${selectedOption.extension}`;

  let downloadBlob: Blob;

  if (selectedOption.format === 'wav') {
    if (clipBlob) {
      downloadBlob = clipBlob;
    } else {
      const response = await fetch(clipUrl);
      downloadBlob = await response.blob();
    }
  } else {
    // Convert to MP3
    let sourceBlob = clipBlob;
    if (!sourceBlob) {
      const response = await fetch(clipUrl);
      sourceBlob = await response.blob();
    }
    downloadBlob = await convertWavToMp3(sourceBlob, selectedOption.bitrate || 192);
  }

  const url = URL.createObjectURL(downloadBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
