/**
 * Composable for real-time voice input with Voice Activity Detection (VAD).
 * Supports two modes:
 *   - "auto" (VAD): Automatically detects when the user speaks and stops speaking.
 *   - "manual" (push-to-talk): VAD always runs; PTT controls when audio is sent.
 *     On push-start: mark active + accumulate VAD segments.
 *     On push-end: pause VAD (forces onSpeechEnd flush) then send accumulated audio.
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

    // PTT state — accumulates VAD-captured audio segments while button is held
    let pttActive = false;
    let pttStartTime = 0;
    let pttAudioSegments: Float32Array[] = [];
    let pttFlushResolve: (() => void) | null = null;
    let pttWaitingForSpeechEnd = false;

    /**
     * Starts listening for voice input.
     * Requests microphone access and initializes VAD.
     */
    async function startListening() {
        if (isListening.value) return;
        error.value = null;

        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            const { MicVAD } = await import("@ricky0123/vad-web");

            const vadAssetBase = "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.30/dist/";
            const onnxWasmBase = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/";

            vadInstance = await MicVAD.new({
                baseAssetPath: vadAssetBase,
                onnxWASMBasePath: onnxWasmBase,
                getStream: async () => mediaStream!,
                onSpeechStart: () => {
                    const currentMode = micMode?.value || "auto";
                    if (currentMode === "auto") {
                        isSpeaking.value = true;
                    }
                    // In manual mode: VAD speech detection still runs silently
                },
                onSpeechEnd: (audio: Float32Array) => {
                    const currentMode = micMode?.value || "auto";

                    if (currentMode === "auto") {
                        isSpeaking.value = false;
                        // Auto mode: send immediately
                        const wavBuffer = float32ToWav(audio, 16000);
                        const base64 = arrayBufferToBase64(wavBuffer);
                        sendMessage({ type: "audio-chunk", chunk: base64 });
                        sendMessage({ type: "speech-end" });
                    } else if (pttActive || pttWaitingForSpeechEnd) {
                        // Manual mode: accumulate segment
                        pttAudioSegments.push(new Float32Array(audio));
                        // If waiting for flush (button released), resolve now
                        if (pttFlushResolve) {
                            pttFlushResolve();
                            pttFlushResolve = null;
                        }
                    }
                },
                positiveSpeechThreshold: 0.8,
                negativeSpeechThreshold: 0.35,
                redemptionMs: 150,
                preSpeechPadMs: 200,
                minSpeechMs: 150,
            });

            // VAD always runs — it captures audio for both modes
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
        pttActive = false;
        pttAudioSegments = [];
        pttStartTime = 0;
        pttFlushResolve = null;
        pttWaitingForSpeechEnd = false;

        if (vadInstance) {
            try {
                vadInstance.destroy();
            } catch {
                /* ignore */
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

            if (playing) {
                try {
                    vadInstance.pause();
                } catch {
                    if (mediaStream) {
                        const track = mediaStream.getAudioTracks()[0];
                        if (track) track.enabled = false;
                    }
                }
            } else {
                try {
                    vadInstance.start();
                } catch {
                    if (mediaStream) {
                        const track = mediaStream.getAudioTracks()[0];
                        if (track) track.enabled = true;
                    }
                }
            }
        });
    }

    // ── Mode switching ──
    if (micMode) {
        watch(micMode, (newMode, oldMode) => {
            if (oldMode === "manual" && pttActive) {
                stopManualRecording();
            }
            // VAD always runs — no pause/resume needed on mode switch
        });
    }

    // ── Push-to-talk (manual mode) ──

    /**
     * Starts manual recording (push-to-talk).
     * VAD keeps running and accumulating speech segments.
     */
    function startManualRecording() {
        if (!isListening.value) return;
        if (pttActive) return;

        pttAudioSegments = [];
        pttStartTime = Date.now();
        pttActive = true;
        pttWaitingForSpeechEnd = false;
        isSpeaking.value = true;

        // Ensure VAD is running
        if (vadInstance) {
            try {
                vadInstance.start();
            } catch {
                /* already running */
            }
        }
    }

    /**
     * Stops manual recording.
     * Does NOT pause VAD — lets it finish detecting the current speech naturally.
     * Waits for onSpeechEnd to fire (user stopped talking → silence detected),
     * then sends accumulated audio.
     */
    function stopManualRecording() {
        if (!pttActive) return;

        const duration = Date.now() - pttStartTime;

        if (duration < MIN_MANUAL_DURATION_MS) {
            pttActive = false;
            isSpeaking.value = false;
            pttAudioSegments = [];
            pttStartTime = 0;
            return;
        }

        // Keep accumulation window open until VAD emits onSpeechEnd
        pttWaitingForSpeechEnd = true;
        isSpeaking.value = false;

        // Wait for VAD to fire onSpeechEnd (user stopped talking → silence)
        const flushPromise = new Promise<void>((resolve) => {
            pttFlushResolve = resolve;
        });

        // Fallback: if VAD doesn't fire, force a VAD flush before finalizing.
        const timeoutId = setTimeout(() => {
            if (!pttFlushResolve) return;
            try {
                vadInstance?.pause();
            } catch {
                /* ignore */
            }
            setTimeout(() => {
                if (pttFlushResolve) {
                    pttFlushResolve();
                    pttFlushResolve = null;
                }
                try {
                    if (!isAgentPlaying?.value) {
                        vadInstance?.start();
                    }
                } catch {
                    /* ignore */
                }
            }, 250);
        }, 3000);

        flushPromise.then(() => {
            clearTimeout(timeoutId);
            pttActive = false;
            pttWaitingForSpeechEnd = false;
            pttFlushResolve = null;
            sendAccumulatedAudio();
        });
    }

    /**
     * Sends all accumulated PTT audio segments as a single WAV.
     */
    function sendAccumulatedAudio() {
        const segments = [...pttAudioSegments];
        pttAudioSegments = [];
        pttStartTime = 0;

        if (segments.length === 0) return;

        // Merge all VAD-captured segments into a single Float32Array
        const totalLength = segments.reduce((sum, arr) => sum + arr.length, 0);
        if (totalLength === 0) return;

        const merged = new Float32Array(totalLength);
        let offset = 0;
        for (const segment of segments) {
            merged.set(segment, offset);
            offset += segment.length;
        }

        // VAD produces 16kHz audio — encode as WAV and send
        const wavBuffer = float32ToWav(merged, 16000);
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

    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, "WAVE");

    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    writeString(view, 36, "data");
    view.setUint32(40, dataSize, true);

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
