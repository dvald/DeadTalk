/**
 * Composable for real-time voice input with Voice Activity Detection (VAD).
 * Supports two modes:
 *   - "auto" (VAD): Automatically detects when the user speaks and stops speaking.
 *   - "manual" (push-to-talk): Records while the user holds the button, sends on release.
 *
 * Also supports echo suppression by pausing VAD while the agent is playing audio.
 */

import type { Ref } from "vue";
import type { MicMode } from "~/models/session";

/** Minimum audio duration in ms to consider a valid push-to-talk recording */
const MIN_MANUAL_DURATION_MS = 300;

export function useVoiceInput(sendMessage: (msg: any) => void, isAgentPlaying?: Ref<boolean>, micMode?: Ref<MicMode>) {
    const isListening = ref(false);
    const isSpeaking = ref(false);
    const error = ref<string | null>(null);

    let mediaStream: MediaStream | null = null;
    let vadInstance: any = null;

    // Manual recording state
    let manualRecorder: ScriptProcessorNode | null = null;
    let manualAudioContext: AudioContext | null = null;
    let manualSource: MediaStreamAudioSourceNode | null = null;
    let manualSamples: Float32Array[] = [];
    let manualStartTime = 0;
    let manualSampleRate = 48000;
    let isManualRecording = false;

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
                positiveSpeechThreshold: 0.85,
                negativeSpeechThreshold: 0.4,
                redemptionMs: 700,
                preSpeechPadMs: 100,
                minSpeechMs: 300,
            });

            // Start VAD only if in auto mode (or no mode specified)
            const currentMode = micMode?.value || "auto";
            if (currentMode === "auto") {
                vadInstance.start();
            }

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
        cleanupManualRecording(false);

        if (vadInstance) {
            try {
                vadInstance.destroy();
            } catch {
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

    // ── Echo suppression: pause VAD while agent plays audio ──
    if (isAgentPlaying) {
        watch(isAgentPlaying, (playing) => {
            if (!vadInstance || !isListening.value) return;
            const currentMode = micMode?.value || "auto";
            if (currentMode !== "auto") return;

            if (playing) {
                try {
                    vadInstance.pause();
                } catch {
                    // Fallback: disable audio track
                    if (mediaStream) {
                        const track = mediaStream.getAudioTracks()[0];
                        if (track) track.enabled = false;
                    }
                }
            } else {
                try {
                    vadInstance.start();
                } catch {
                    // Fallback: re-enable audio track
                    if (mediaStream) {
                        const track = mediaStream.getAudioTracks()[0];
                        if (track) track.enabled = true;
                    }
                }
            }
        });
    }

    // ── Mode switching: pause/resume VAD when toggling auto/manual ──
    if (micMode) {
        watch(micMode, (newMode, oldMode) => {
            // If switching away from manual while recording, clean up gracefully
            if (oldMode === "manual" && isManualRecording) {
                cleanupManualRecording(true);
            }

            if (!vadInstance || !isListening.value) return;

            if (newMode === "auto") {
                // Resume VAD (unless agent is currently playing)
                const agentPlaying = isAgentPlaying?.value || false;
                if (!agentPlaying) {
                    try {
                        vadInstance.start();
                    } catch {
                        // Already running
                    }
                }
            } else {
                // Pause VAD for manual mode
                try {
                    vadInstance.pause();
                } catch {
                    // Not running
                }
            }
        });
    }

    // ── Push-to-talk (manual mode) ──

    /**
     * Starts manual recording (push-to-talk).
     * Captures raw PCM samples until stopManualRecording() is called.
     */
    function startManualRecording() {
        if (!mediaStream || !isListening.value) return;
        if (isManualRecording) return; // Already recording

        manualSamples = [];
        manualStartTime = Date.now();
        isManualRecording = true;
        isSpeaking.value = true;

        try {
            // Use default sample rate (browser-native) to avoid compatibility issues
            manualAudioContext = new AudioContext();
            manualSampleRate = manualAudioContext.sampleRate;
            manualSource = manualAudioContext.createMediaStreamSource(mediaStream);

            // ScriptProcessorNode to capture raw PCM (4096 buffer, mono)
            manualRecorder = manualAudioContext.createScriptProcessor(4096, 1, 1);
            manualRecorder.onaudioprocess = (event: AudioProcessingEvent) => {
                if (!isManualRecording) return;
                const inputData = event.inputBuffer.getChannelData(0);
                manualSamples.push(new Float32Array(inputData));
            };

            manualSource.connect(manualRecorder);
            manualRecorder.connect(manualAudioContext.destination);
        } catch (err: any) {
            isManualRecording = false;
            isSpeaking.value = false;
            error.value = err.message || "Failed to start manual recording";
        }
    }

    /**
     * Stops manual recording and sends the captured audio.
     */
    function stopManualRecording() {
        cleanupManualRecording(true);
    }

    /**
     * Cleans up manual recording resources.
     * @param sendAudio If true, sends captured audio to the backend
     */
    function cleanupManualRecording(sendAudio: boolean) {
        if (!isManualRecording && manualSamples.length === 0) return;

        const duration = Date.now() - manualStartTime;
        const samples = [...manualSamples];

        // Reset state immediately
        isManualRecording = false;
        isSpeaking.value = false;
        manualSamples = [];
        manualStartTime = 0;

        // Disconnect and clean up ScriptProcessorNode
        if (manualRecorder) {
            try {
                manualRecorder.disconnect();
            } catch {
                // Ignore
            }
            manualRecorder = null;
        }
        if (manualSource) {
            try {
                manualSource.disconnect();
            } catch {
                // Ignore
            }
            manualSource = null;
        }
        if (manualAudioContext) {
            try {
                manualAudioContext.close();
            } catch {
                // Ignore
            }
            manualAudioContext = null;
        }

        if (!sendAudio) return;

        // Check minimum duration
        if (duration < MIN_MANUAL_DURATION_MS) return;

        // Merge all captured samples into a single Float32Array
        if (samples.length === 0) return;

        const totalLength = samples.reduce((sum, arr) => sum + arr.length, 0);
        if (totalLength === 0) return;

        const merged = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of samples) {
            merged.set(chunk, offset);
            offset += chunk.length;
        }

        // Resample to 16kHz if needed (browser may give 44.1kHz or 48kHz)
        const targetRate = 16000;
        const resampled = manualSampleRate !== targetRate ? resampleLinear(merged, manualSampleRate, targetRate) : merged;

        // Convert to WAV and send
        const wavBuffer = float32ToWav(resampled, targetRate);
        const base64 = arrayBufferToBase64(wavBuffer);

        sendMessage({ type: "audio-chunk", chunk: base64 });
        sendMessage({ type: "speech-end" });
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
        startManualRecording,
        stopManualRecording,
    };
}

/**
 * Simple linear resampling from one sample rate to another.
 */
function resampleLinear(samples: Float32Array, fromRate: number, toRate: number): Float32Array {
    if (fromRate === toRate) return samples;
    const ratio = fromRate / toRate;
    const newLength = Math.round(samples.length / ratio);
    const result = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
        const srcIndex = i * ratio;
        const srcFloor = Math.floor(srcIndex);
        const srcCeil = Math.min(srcFloor + 1, samples.length - 1);
        const frac = srcIndex - srcFloor;
        result[i] = samples[srcFloor] * (1 - frac) + samples[srcCeil] * frac;
    }
    return result;
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
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
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
