// Image generation service — Google Imagen / DALL-E for character portraits

"use strict";

import HTTPS from "https";
import { Monitor } from "../monitor";
import { ImageGenerationConfig } from "../config/config-image-generation";

/**
 * Generates historical portrait images using Google Imagen or DALL-E.
 * Used during custom character creation to produce persona portraits.
 */
export class ImageGenerationService {
    /* Singleton */

    public static instance: ImageGenerationService = null;

    public static getInstance(): ImageGenerationService {
        if (ImageGenerationService.instance) {
            return ImageGenerationService.instance;
        } else {
            ImageGenerationService.instance = new ImageGenerationService();
            return ImageGenerationService.instance;
        }
    }

    constructor() {}

    /**
     * Checks if image generation is available.
     */
    public isEnabled(): boolean {
        return ImageGenerationConfig.getInstance().enabled;
    }

    /**
     * Generates a portrait image from a text prompt.
     * @param prompt Detailed image generation prompt
     * @returns Base64-encoded image data, or null on failure
     */
    public async generatePortrait(prompt: string): Promise<string | null> {
        const config = ImageGenerationConfig.getInstance();

        if (!config.enabled) {
            Monitor.warning("ImageGenerationService: no provider configured");
            return null;
        }

        if (config.provider === "imagen") {
            return this.generateWithImagen(prompt);
        } else if (config.provider === "dalle") {
            return this.generateWithDalle(prompt);
        }

        return null;
    }

    /**
     * Generates an image using Google Imagen API.
     */
    private async generateWithImagen(prompt: string): Promise<string | null> {
        const config = ImageGenerationConfig.getInstance();
        const enhancedPrompt = `Historical portrait painting, photorealistic style, dramatic chiaroscuro lighting, museum quality. ${prompt}. Dark moody background, slight sepia tone, 3/4 view portrait composition.`;

        try {
            const body = JSON.stringify({
                instances: [{ prompt: enhancedPrompt }],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: "1:1",
                    outputMimeType: "image/jpeg",
                },
            });

            const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.imagenModel}:predict?key=${config.googleApiKey}`;

            const response = await this.httpsPost(url, body, {
                "Content-Type": "application/json",
            });

            const parsed = JSON.parse(response);
            if (parsed.predictions && parsed.predictions[0] && parsed.predictions[0].bytesBase64Encoded) {
                Monitor.info("ImageGenerationService: Imagen portrait generated");
                return parsed.predictions[0].bytesBase64Encoded;
            }

            Monitor.warning("ImageGenerationService: Imagen returned no image", {
                response: response.substring(0, 200),
            });
            return null;
        } catch (err) {
            Monitor.exception(err, "ImageGenerationService: Imagen generation failed");
            // Fallback to DALL-E if available
            if (config.openaiApiKey) {
                Monitor.info("ImageGenerationService: falling back to DALL-E");
                return this.generateWithDalle(prompt);
            }
            return null;
        }
    }

    /**
     * Generates an image using OpenAI DALL-E API.
     */
    private async generateWithDalle(prompt: string): Promise<string | null> {
        const config = ImageGenerationConfig.getInstance();
        const enhancedPrompt = `Historical portrait painting, photorealistic, dramatic lighting, museum quality. ${prompt}. Dark moody background, slight sepia tone.`;

        try {
            const body = JSON.stringify({
                model: "dall-e-3",
                prompt: enhancedPrompt,
                n: 1,
                size: "1024x1024",
                response_format: "b64_json",
            });

            const response = await this.httpsPost(
                "https://api.openai.com/v1/images/generations",
                body,
                {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + config.openaiApiKey,
                },
            );

            const parsed = JSON.parse(response);
            if (parsed.data && parsed.data[0] && parsed.data[0].b64_json) {
                Monitor.info("ImageGenerationService: DALL-E portrait generated");
                return parsed.data[0].b64_json;
            }

            Monitor.warning("ImageGenerationService: DALL-E returned no image");
            return null;
        } catch (err) {
            Monitor.exception(err, "ImageGenerationService: DALL-E generation failed");
            return null;
        }
    }

    /**
     * Simple HTTPS POST helper that returns the response body as a string.
     */
    private httpsPost(url: string, body: string, headers: Record<string, string>): Promise<string> {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                port: 443,
                path: urlObj.pathname + urlObj.search,
                method: "POST",
                headers: {
                    ...headers,
                    "Content-Length": Buffer.byteLength(body),
                },
                timeout: 60000,
            };

            const req = HTTPS.request(options, (res) => {
                const chunks: Buffer[] = [];
                res.on("data", (chunk: Buffer) => chunks.push(chunk));
                res.on("end", () => {
                    const responseBody = Buffer.concat(chunks).toString();
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(responseBody);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${responseBody.substring(0, 300)}`));
                    }
                });
            });

            req.on("error", reject);
            req.on("timeout", () => {
                req.destroy();
                reject(new Error("Request timeout"));
            });

            req.write(body);
            req.end();
        });
    }
}
