// Firecrawl configuration

"use strict";

/**
 * Firecrawl configuration.
 */
export class FirecrawlConfig {

    /**
     * Gets the configuration instance.
     */
    public static getInstance(): FirecrawlConfig {
        if (FirecrawlConfig.instance) {
            return FirecrawlConfig.instance;
        }

        const config: FirecrawlConfig = new FirecrawlConfig();

        config.apiKey = process.env.FIRECRAWL_API_KEY || "";
        config.baseUrl = process.env.FIRECRAWL_BASE_URL || "https://api.firecrawl.dev/v2";

        FirecrawlConfig.instance = config;

        return config;
    }
    private static instance: FirecrawlConfig = null;

    public apiKey: string;
    public baseUrl: string;

    constructor() {
        this.apiKey = "";
        this.baseUrl = "https://api.firecrawl.dev/v2";
    }
}
