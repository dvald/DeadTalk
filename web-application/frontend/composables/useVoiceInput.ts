/**
 * Composable for real-time voice input with Voice Activity Detection (VAD).
 * Uses @ricky0123/vad-web to detect when the user speaks and stops speaking.
 * Sends audio chunks via WebSocket and triggers speech-end events.
 */

export function useVoiceInput(sendMessage: (msg: any) => void) {
  const isListening = ref(false);
  const isSpeaking = ref(false);
  const error = ref<string | null>(null);

  let mediaStream: MediaStream | null = null;
  let vadInstance: any = null;

  /**
   * Starts listening for voice input.
   * Requests microphone access and initializes VAD.
   */
  async function startListening() {
    if (isListening.value) return;
    error.value = null;

    try {
      // Request microphone access
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Dynamically import VAD to avoid SSR issues
      const { MicVAD } = await import("@ricky0123/vad-web");

      const vadAssetBase = "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.30/dist/";
      const onnxWasmBase = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/";

      vadInstance = await MicVAD.new({
        baseAssetPath: vadAssetBase,
        onnxWASMBasePath: onnxWasmBase,
        getStream: async () => mediaStream!,
        onSpeechStart: () => {
          isSpeaking.value = true;
        },
        onSpeechEnd: (audio: Float32Array) => {
          isSpeaking.value = false;

          // Convert Float32 PCM to 16-bit PCM WAV and send
          const wavBuffer = float32ToWav(audio, 16000);
          const base64 = arrayBufferToBase64(wavBuffer);

          // Send as a single chunk + speech-end
          sendMessage({ type: "audio-chunk", chunk: base64 });
          sendMessage({ type: "speech-end" });
        },
        positiveSpeechThreshold: 0.8,
        negativeSpeechThreshold: 0.4,
        redemptionMs: 250,
        preSpeechPadMs: 100,
        minSpeechMs: 150,
      });

      vadInstance.start();
      isListening.value = true;
    } catch (err: any) {
      error.value = err.message || "Failed to access microphone";
      stopListening();
    }
  }

  /**
   * Stops listening and releases resources.
   */
  function stopListening() {
    if (vadInstance) {
      try {
        vadInstance.destroy();
      } catch (_e) {
        // Ignore cleanup errors
      }
      vadInstance = null;
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    }

    isListening.value = false;
    isSpeaking.value = false;
  }

  // Cleanup on unmount
  onBeforeUnmount(() => {
    stopListening();
  });

  return {
    isListening,
    isSpeaking,
    error,
    startListening,
    stopListening,
  };
}

/**
 * Converts a Float32Array of PCM samples to a WAV file ArrayBuffer.
 */
function float32ToWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const headerSize = 44;
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");

  // fmt sub-chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // Sub-chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Write samples as 16-bit PCM
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return buffer;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  const binaryChunks: string[] = [];

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binaryChunks.push(String.fromCharCode.apply(null, Array.from(chunk)));
  }

  return btoa(binaryChunks.join(""));
}
