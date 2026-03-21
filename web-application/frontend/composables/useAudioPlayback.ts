/**
 * Composable for playing base64-encoded audio chunks received via WebSocket.
 * Decodes base64 → ArrayBuffer → AudioBuffer and plays through Web Audio API.
 * Exposes an AnalyserNode for real-time waveform visualization.
 */

export function useAudioPlayback() {
    const isPlaying = ref(false);
    let audioContext: AudioContext | null = null;
    let analyserNode: AnalyserNode | null = null;
    let currentSource: AudioBufferSourceNode | null = null;
    let playbackGeneration = 0;
    let processingQueue = false;
    const playbackQueue: Array<{ chunk: string; onEnded?: () => void }> = [];

    function getAudioContext(): AudioContext {
        if (!audioContext || audioContext.state === "closed") {
            audioContext = new AudioContext();
            // Create analyser node once per context
            analyserNode = audioContext.createAnalyser();
            analyserNode.fftSize = 64; // 32 frequency bins — maps well to 24 bars
            analyserNode.smoothingTimeConstant = 0.6;
            analyserNode.connect(audioContext.destination);
        }
        // Resume if suspended (browser autoplay policy)
        if (audioContext.state === "suspended") {
            audioContext.resume();
        }
        return audioContext;
    }

    /**
     * Returns frequency data (0-255) from the current audio playback.
     * Returns null if no analyser is available.
     */
    function getFrequencyData(): Uint8Array | null {
        if (!analyserNode) return null;
        const data = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteFrequencyData(data);
        return data;
    }

    /**
     * Plays a base64-encoded audio chunk (MP3/WAV).
     * Chunks are queued and played sequentially.
     * @param base64Chunk Base64-encoded audio data
     * @param onEnded Optional callback when playback finishes
     */
    async function playChunk(base64Chunk: string, onEnded?: () => void) {
        if (!base64Chunk) return;

        playbackQueue.push({ chunk: base64Chunk, onEnded });
        if (processingQueue) {
            return;
        }
        await processQueue();
    }

    async function processQueue() {
        if (processingQueue) {
            return;
        }
        processingQueue = true;

        try {
            while (playbackQueue.length > 0) {
                const item = playbackQueue.shift();
                if (!item || !item.chunk) {
                    continue;
                }

                try {
                    const generationAtStart = playbackGeneration;
                    const ctx = getAudioContext();

                    // Decode base64 to ArrayBuffer
                    const binaryStr = atob(item.chunk);
                    const bytes = new Uint8Array(binaryStr.length);
                    for (let i = 0; i < binaryStr.length; i++) {
                        bytes[i] = binaryStr.charCodeAt(i);
                    }

                    // Decode audio data
                    const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));

                    // Playback was reset while decoding
                    if (generationAtStart !== playbackGeneration) {
                        continue;
                    }

                    await new Promise<void>((resolve) => {
                        const source = ctx.createBufferSource();
                        source.buffer = audioBuffer;
                        // Route through analyser for visualization
                        source.connect(analyserNode!);

                        source.onended = () => {
                            if (currentSource === source) {
                                currentSource = null;
                            }
                            if (generationAtStart === playbackGeneration && item.onEnded) {
                                item.onEnded();
                            }
                            resolve();
                        };

                        currentSource = source;
                        isPlaying.value = true;
                        source.start(0);
                    });
                } catch (chunkErr) {
                    console.warn("useAudioPlayback: failed to decode queued chunk", chunkErr);
                }
            }
        } catch (err) {
            console.warn("useAudioPlayback: failed to play chunk", err);
        } finally {
            processingQueue = false;
            if (playbackQueue.length > 0) {
                void processQueue();
            }
            if (!currentSource && playbackQueue.length === 0) {
                isPlaying.value = false;
            }
        }
    }

    /**
     * Stops current audio playback.
     */
    function stopPlayback() {
        playbackGeneration++;
        playbackQueue.length = 0;

        if (currentSource) {
            try {
                currentSource.stop();
            } catch {
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
            analyserNode = null;
        }
    });

    return {
        isPlaying,
        playChunk,
        stopPlayback,
        getFrequencyData,
    };
}
