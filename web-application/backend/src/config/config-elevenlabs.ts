// ElevenLabs configuration

"use strict";

/**
 * ElevenLabs configuration.
 */
export class ElevenLabsConfig {

    /**
     * Gets the configuration instance.
     */
    public static getInstance(): ElevenLabsConfig {
        if (ElevenLabsConfig.instance) {
            return ElevenLabsConfig.instance;
        }

        const config: ElevenLabsConfig = new ElevenLabsConfig();

        config.apiKey = process.env.ELEVENLABS_API_KEY || "";
        config.baseUrl = process.env.ELEVENLABS_BASE_URL || "https://api.elevenlabs.io/v1";
        config.defaultModel = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";

        ElevenLabsConfig.instance = config;

        return config;
    }
    private static instance: ElevenLabsConfig = null;

    public apiKey: string;
    public baseUrl: string;
    public defaultModel: string;

    constructor() {
        this.apiKey = "";
        this.baseUrl = "https://api.elevenlabs.io/v1";
        this.defaultModel = "eleven_multilingual_v2";
    }
}
