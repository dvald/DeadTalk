// ElevenLabs service

"use strict";

import HTTPS from "https";
import { URL } from "url";
import { ElevenLabsConfig } from "../config/config-elevenlabs";
import { Monitor } from "../monitor";
import { Request, RequestResponse } from "../utils/request";

/**
 * Options for text-to-speech generation
 */
export interface TTSOptions {
    modelId?: string;
    stability?: number;
    similarityBoost?: number;
    style?: number;
    speed?: number;
    outputFormat?: string;
}

/**
 * Voice metadata from ElevenLabs API
 */
export interface ElevenLabsVoice {
    voiceId: string;
    name: string;
    category: string;
    description: string;
    previewUrl: string;
    labels: Record<string, string>;
}

/**
 * Tool definition for ElevenAgents
 */
export interface ElevenAgentTool {
    type: string;
    name: string;
    description: string;
    parameters: Record<string, any>;
}

/**
 * ElevenAgents configuration object
 */
export interface ElevenAgentConfig {
    agent: {
        prompt: string;
        firstMessage: string;
        language: string;
    };
    tts: {
        voiceId: string;
        modelId: string;
    };
    tools: ElevenAgentTool[];
}

export class ElevenLabsService {
    /* Singleton */

    public static instance: ElevenLabsService = null;

    public static getInstance(): ElevenLabsService {
        if (ElevenLabsService.instance) {
            return ElevenLabsService.instance;
        } else {
            ElevenLabsService.instance = new ElevenLabsService();
            return ElevenLabsService.instance;
        }
    }

    private apiKey: string;
    private baseUrl: string;
    private defaultModel: string;

    constructor() {
        const config = ElevenLabsConfig.getInstance();
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl;
        this.defaultModel = config.defaultModel;
    }

    /**
     * Converts text to speech using ElevenLabs TTS API.
     * Uses native HTTPS to handle binary audio response (the codebase Request util only supports string bodies).
     * @param text The text to convert to speech
     * @param voiceId The voice identifier
     * @param options Optional TTS settings
     * @returns Buffer containing the audio data
     */
    public async textToSpeech(text: string, voiceId: string, options?: TTSOptions): Promise<Buffer> {
        const outputFormat = (options && options.outputFormat) || "mp3_44100_128";
        const url = this.baseUrl + "/text-to-speech/" + encodeURIComponent(voiceId) + "?output_format=" + outputFormat;

        const body: any = {
            text: text,
            model_id: (options && options.modelId) || this.defaultModel,
        };

        const voiceSettings: any = {};
        if (options) {
            if (options.stability !== undefined) voiceSettings.stability = options.stability;
            if (options.similarityBoost !== undefined) voiceSettings.similarity_boost = options.similarityBoost;
            if (options.style !== undefined) voiceSettings.style = options.style;
            if (options.speed !== undefined) voiceSettings.speed = options.speed;
        }
        if (Object.keys(voiceSettings).length > 0) {
            body.voice_settings = voiceSettings;
        }

        const payload = JSON.stringify(body);

        Monitor.debug("ElevenLabsService.textToSpeech", { voiceId, textLength: text.length, outputFormat });

        return new Promise<Buffer>((resolve, reject) => {
            const parsedUrl = new URL(url);

            const req = HTTPS.request({
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || 443,
                path: parsedUrl.pathname + parsedUrl.search,
                method: "POST",
                headers: {
                    "xi-api-key": this.apiKey,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg",
                    "Content-Length": Buffer.byteLength(payload),
                },
            }, (response) => {
                if (response.statusCode !== 200) {
                    let errorData = "";
                    response.on("data", (chunk) => { errorData += chunk; });
                    response.on("end", () => {
                        let errorMsg = "ElevenLabs TTS error (status " + response.statusCode + ")";
                        try {
                            const parsed = JSON.parse(errorData);
                            if (parsed.detail && parsed.detail.message) {
                                errorMsg = parsed.detail.message;
                            }
                        } catch (_e) {
                            // Use default error message
                        }
                        Monitor.warning("ElevenLabsService.textToSpeech API error", { statusCode: response.statusCode, error: errorMsg });
                        reject(Object.assign(new Error(errorMsg), { code: "ELEVENLABS_ERROR" }));
                    });
                    return;
                }

                const chunks: Buffer[] = [];
                response.on("data", (chunk: Buffer) => {
                    chunks.push(chunk);
                });
                response.on("end", () => {
                    const audioBuffer = Buffer.concat(chunks);
                    Monitor.debug("ElevenLabsService.textToSpeech completed", { bytes: audioBuffer.length });
                    resolve(audioBuffer);
                });
            });

            req.on("error", (err) => {
                Monitor.exception(err, "ElevenLabsService.textToSpeech request failed");
                reject(Object.assign(new Error("ElevenLabs request failed: " + err.message), { code: "ELEVENLABS_ERROR" }));
            });

            req.write(payload);
            req.end();
        });
    }

    /**
     * Lists available voices from ElevenLabs API.
     * @returns Array of voice metadata
     */
    public async listVoices(): Promise<ElevenLabsVoice[]> {
        const url = this.baseUrl + "/voices";

        Monitor.debug("ElevenLabsService.listVoices");

        return new Promise<ElevenLabsVoice[]>((resolve, reject) => {
            Request.get(url, {
                headers: {
                    "xi-api-key": this.apiKey,
                    "Accept": "application/json",
                },
            }, (err: Error, response: RequestResponse, body: string) => {
                if (err) {
                    Monitor.exception(err, "ElevenLabsService.listVoices request failed");
                    return reject(Object.assign(new Error("ElevenLabs request failed: " + err.message), { code: "ELEVENLABS_ERROR" }));
                }

                try {
                    const parsed = JSON.parse(body);

                    if (response.statusCode !== 200) {
                        const errorMsg = (parsed.detail && parsed.detail.message) || "Unknown ElevenLabs error (status " + response.statusCode + ")";
                        Monitor.warning("ElevenLabsService.listVoices API error", { statusCode: response.statusCode, error: errorMsg });
                        return reject(Object.assign(new Error(errorMsg), { code: "ELEVENLABS_ERROR" }));
                    }

                    const voices: ElevenLabsVoice[] = (parsed.voices || []).map((v: any) => {
                        return {
                            voiceId: v.voice_id || "",
                            name: v.name || "",
                            category: v.category || "",
                            description: v.description || "",
                            previewUrl: v.preview_url || "",
                            labels: v.labels || {},
                        };
                    });

                    Monitor.debug("ElevenLabsService.listVoices completed", { voiceCount: voices.length });
                    resolve(voices);
                } catch (ex) {
                    Monitor.exception(ex, "ElevenLabsService.listVoices failed to parse response");
                    reject(Object.assign(new Error("Failed to parse ElevenLabs response"), { code: "ELEVENLABS_ERROR" }));
                }
            });
        });
    }

    /**
     * Transcribes audio to text using ElevenLabs Speech-to-Text API.
     * Sends audio as multipart form-data to POST /v1/speech-to-text.
     * @param audioBuffer Buffer containing the audio data (PCM, WAV, MP3, etc.)
     * @param language Optional language code (e.g., "en"). Auto-detected if omitted.
     * @returns The transcription text
     */
    public async speechToText(audioBuffer: Buffer, language?: string): Promise<string> {
        const url = this.baseUrl + "/speech-to-text";

        Monitor.debug("ElevenLabsService.speechToText", { audioBytes: audioBuffer.length, language: language || "auto" });

        return new Promise<string>((resolve, reject) => {
            // Build multipart form-data manually (no extra dependency)
            const boundary = "----ElevenLabsSTT" + Date.now();
            const parts: Buffer[] = [];

            // Audio file part
            parts.push(Buffer.from(
                "--" + boundary + "\r\n" +
                "Content-Disposition: form-data; name=\"file\"; filename=\"audio.wav\"\r\n" +
                "Content-Type: audio/wav\r\n\r\n"
            ));
            parts.push(audioBuffer);
            parts.push(Buffer.from("\r\n"));

            // Model part
            parts.push(Buffer.from(
                "--" + boundary + "\r\n" +
                "Content-Disposition: form-data; name=\"model_id\"\r\n\r\n" +
                "scribe_v1\r\n"
            ));

            // Language part (optional)
            if (language) {
                parts.push(Buffer.from(
                    "--" + boundary + "\r\n" +
                    "Content-Disposition: form-data; name=\"language_code\"\r\n\r\n" +
                    language + "\r\n"
                ));
            }

            // Closing boundary
            parts.push(Buffer.from("--" + boundary + "--\r\n"));

            const body = Buffer.concat(parts);

            const parsedUrl = new URL(url);

            const req = HTTPS.request({
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || 443,
                path: parsedUrl.pathname + parsedUrl.search,
                method: "POST",
                headers: {
                    "xi-api-key": this.apiKey,
                    "Content-Type": "multipart/form-data; boundary=" + boundary,
                    "Content-Length": body.length,
                },
            }, (response) => {
                let responseData = "";
                response.on("data", (chunk) => { responseData += chunk; });
                response.on("end", () => {
                    if (response.statusCode !== 200) {
                        let errorMsg = "ElevenLabs STT error (status " + response.statusCode + ")";
                        try {
                            const parsed = JSON.parse(responseData);
                            if (parsed.detail && parsed.detail.message) {
                                errorMsg = parsed.detail.message;
                            }
                        } catch (_e) {
                            // Use default error message
                        }
                        Monitor.warning("ElevenLabsService.speechToText API error", { statusCode: response.statusCode, error: errorMsg });
                        return reject(Object.assign(new Error(errorMsg), { code: "ELEVENLABS_ERROR" }));
                    }

                    try {
                        const parsed = JSON.parse(responseData);
                        const text = parsed.text || "";
                        Monitor.debug("ElevenLabsService.speechToText completed", { textLength: text.length });
                        resolve(text);
                    } catch (ex) {
                        Monitor.exception(ex, "ElevenLabsService.speechToText failed to parse response");
                        reject(Object.assign(new Error("Failed to parse STT response"), { code: "ELEVENLABS_ERROR" }));
                    }
                });
            });

            req.on("error", (err) => {
                Monitor.exception(err, "ElevenLabsService.speechToText request failed");
                reject(Object.assign(new Error("ElevenLabs STT request failed: " + err.message), { code: "ELEVENLABS_ERROR" }));
            });

            req.write(body);
            req.end();
        });
    }

    /**
     * Generates a configuration object for an ElevenAgent (Conversational AI).
     * This is a pure local method — no API call.
     * @param persona The system prompt / persona description for the agent
     * @param voiceId The voice to use for the agent's speech
     * @param tools Array of tool definitions the agent can use
     * @returns ElevenAgentConfig ready to be sent to the Conversational AI API
     */
    public getAgentConfig(persona: string, voiceId: string, tools: ElevenAgentTool[]): ElevenAgentConfig {
        return {
            agent: {
                prompt: persona,
                firstMessage: "",
                language: "en",
            },
            tts: {
                voiceId: voiceId,
                modelId: this.defaultModel,
            },
            tools: tools,
        };
    }
}
