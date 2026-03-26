// Image generation configuration (Google Imagen / DALL-E)

"use strict";

/**
 * Image generation configuration.
 */
export class ImageGenerationConfig {

    /**
     * Gets the configuration instance.
     */
    public static getInstance(): ImageGenerationConfig {
        if (ImageGenerationConfig.instance) {
            return ImageGenerationConfig.instance;
        }

        const config: ImageGenerationConfig = new ImageGenerationConfig();

        config.googleApiKey = process.env.GOOGLE_GENAI_API_KEY || "";
        config.imagenModel = process.env.IMAGEN_MODEL || "imagen-4.0-generate-001";
        config.openaiApiKey = process.env.OPENAI_API_KEY || "";
        config.provider = config.googleApiKey ? "imagen" : config.openaiApiKey ? "dalle" : "none";
        config.enabled = config.provider !== "none";

        ImageGenerationConfig.instance = config;

        return config;
    }
    private static instance: ImageGenerationConfig = null;

    public googleApiKey: string;
    public imagenModel: string;
    public openaiApiKey: string;
    public provider: "imagen" | "dalle" | "none";
    public enabled: boolean;

    constructor() {
        this.googleApiKey = "";
        this.imagenModel = "imagen-4.0-generate-001";
        this.openaiApiKey = "";
        this.provider = "none";
        this.enabled = false;
    }
}
