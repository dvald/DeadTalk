// OpenAI configuration

"use strict";

/**
 * OpenAI configuration.
 */
export class OpenAIConfig {

    /**
     * Gets the configuration instance.
     */
    public static getInstance(): OpenAIConfig {
        if (OpenAIConfig.instance) {
            return OpenAIConfig.instance;
        }

        const config: OpenAIConfig = new OpenAIConfig();

        config.apiKey = process.env.OPENAI_API_KEY || "";
        config.model = process.env.OPENAI_MODEL || "gpt-4o";
        config.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || "350", 10);

        if (!config.apiKey) {
            throw new Error("Missing required environment variable: OPENAI_API_KEY");
        }

        OpenAIConfig.instance = config;

        return config;
    }
    private static instance: OpenAIConfig = null;

    public apiKey: string;
    public model: string;
    public maxTokens: number;

    constructor() {
        this.apiKey = "";
        this.model = "gpt-4o";
        this.maxTokens = 1024;
    }
}
