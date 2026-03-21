/**
 * Composable for playing base64-encoded audio chunks received via WebSocket.
 * Decodes base64 → ArrayBuffer → AudioBuffer and plays through Web Audio API.
 */

export function useAudioPlayback() {
  const isPlaying = ref(false);
  let audioContext: AudioContext | null = null;
  let currentSource: AudioBufferSourceNode | null = null;

  function getAudioContext(): AudioContext {
    if (!audioContext || audioContext.state === "closed") {
      audioContext = new AudioContext();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
    return audioContext;
  }

  /**
   * Plays a base64-encoded audio chunk (MP3/WAV).
   * Stops any currently playing audio first.
   * @param base64Chunk Base64-encoded audio data
   * @param onEnded Optional callback when playback finishes
   */
  async function playChunk(base64Chunk: string, onEnded?: () => void) {
    if (!base64Chunk) return;

    try {
      const ctx = getAudioContext();

      // Decode base64 to ArrayBuffer
      const binaryStr = atob(base64Chunk);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      // Decode audio data
      const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));

      // Stop previous playback
      stopPlayback();

      // Create and play source
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      source.onended = () => {
        isPlaying.value = false;
        currentSource = null;
        if (onEnded) onEnded();
      };

      currentSource = source;
      isPlaying.value = true;
      source.start(0);
    } catch (err) {
      console.warn("useAudioPlayback: failed to play chunk", err);
      isPlaying.value = false;
    }
  }

  /**
   * Stops current audio playback.
   */
  function stopPlayback() {
    if (currentSource) {
      try {
        currentSource.stop();
      } catch (_e) {
        // Ignore if already stopped
      }
      currentSource = null;
    }
    isPlaying.value = false;
  }

  // Cleanup on unmount
  onBeforeUnmount(() => {
    stopPlayback();
    if (audioContext && audioContext.state !== "closed") {
      audioContext.close();
      audioContext = null;
    }
  });

  return {
    isPlaying,
    playChunk,
    stopPlayback,
  };
}
