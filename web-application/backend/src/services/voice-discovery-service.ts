// Voice discovery service — searches for real audio recordings via Firecrawl

"use strict";

import HTTP from "http";
import HTTPS from "https";
import { Monitor } from "../monitor";
import { FirecrawlService } from "./firecrawl-service";

/**
 * Result of a voice discovery search
 */
export interface VoiceDiscoveryResult {
    type: "real" | "generated";
    audioUrl?: string;
    audioSource?: string;
    voiceDescription?: string;
}

/**
 * Searches web audio archives for real voice recordings of historical figures.
 * Uses Firecrawl to search archive.org, Library of Congress, BBC, and other sources.
 * If found, the audio can be used for ElevenLabs IVC (Instant Voice Cloning).
 */
export class VoiceDiscoveryService {
    /* Singleton */

    public static instance: VoiceDiscoveryService = null;

    public static getInstance(): VoiceDiscoveryService {
        if (VoiceDiscoveryService.instance) {
            return VoiceDiscoveryService.instance;
        } else {
            VoiceDiscoveryService.instance = new VoiceDiscoveryService();
            return VoiceDiscoveryService.instance;
        }
    }

    constructor() {}

    /**
     * Searches for real audio recordings of a historical figure.
     * Queries audio archive sites via Firecrawl, parses results for audio URLs.
     * @param name The historical figure's name
     * @param voiceDescription Fallback description for Voice Design
     * @returns Discovery result with audio URL or fallback description
     */
    public async findVoiceReference(name: string, voiceDescription: string): Promise<VoiceDiscoveryResult> {
        Monitor.info("VoiceDiscoveryService: searching for voice", { name });

        const audioUrls: Array<{ url: string; source: string }> = [];

        // Search 1: archive.org
        try {
            const results = await FirecrawlService.getInstance().search(
                `"${name}" speech recording audio site:archive.org`,
                3,
            );
            for (const r of results) {
                const urls = this.extractAudioUrls(r.markdown + " " + r.url);
                for (const u of urls) {
                    audioUrls.push({ url: u, source: "archive.org" });
                }
            }
        } catch (err) {
            Monitor.warning("VoiceDiscoveryService: archive.org search failed", { error: (err as Error).message });
        }

        await this.delay(12000); // Rate limiting

        // Search 2: Library of Congress
        try {
            const results = await FirecrawlService.getInstance().search(
                `"${name}" voice recording audio site:loc.gov`,
                3,
            );
            for (const r of results) {
                const urls = this.extractAudioUrls(r.markdown + " " + r.url);
                for (const u of urls) {
                    audioUrls.push({ url: u, source: "Library of Congress" });
                }
            }
        } catch (err) {
            Monitor.warning("VoiceDiscoveryService: LoC search failed", { error: (err as Error).message });
        }

        await this.delay(12000);

        // Search 3: General audio search
        try {
            const results = await FirecrawlService.getInstance().search(
                `"${name}" historical speech audio mp3 recording`,
                3,
            );
            for (const r of results) {
                const urls = this.extractAudioUrls(r.markdown + " " + r.url);
                for (const u of urls) {
                    audioUrls.push({ url: u, source: r.title });
                }
            }
        } catch (err) {
            Monitor.warning("VoiceDiscoveryService: general audio search failed", { error: (err as Error).message });
        }

        for (const candidate of audioUrls) {
            const isValid = await this.validateAudioUrl(candidate.url);
            if (isValid) {
                Monitor.info("VoiceDiscoveryService: found real audio", {
                    name,
                    url: candidate.url,
                    source: candidate.source,
                });
                return {
                    type: "real",
                    audioUrl: candidate.url,
                    audioSource: candidate.source,
                };
            }
            Monitor.info("VoiceDiscoveryService: audio URL invalid, trying next", { url: candidate.url });
        }

        Monitor.info("VoiceDiscoveryService: no real audio found, using Voice Design", { name });
        return {
            type: "generated",
            voiceDescription: voiceDescription,
        };
    }

    /**
     * Downloads audio from a URL and returns the buffer.
     * @param url The audio URL to download
     * @returns Audio buffer or null on failure
     */
    public async downloadAudio(url: string): Promise<Buffer | null> {
        return new Promise((resolve) => {
            const client = url.startsWith("https") ? HTTPS : HTTP;
            client.get(url, { timeout: 30000 }, (res) => {
                if (res.statusCode !== 200) {
                    resolve(null);
                    return;
                }
                const chunks: Buffer[] = [];
                res.on("data", (chunk: Buffer) => chunks.push(chunk));
                res.on("end", () => resolve(Buffer.concat(chunks)));
                res.on("error", () => resolve(null));
            }).on("error", () => resolve(null));
        });
    }

    /**
     * Extracts audio file URLs from text content.
     */
    private extractAudioUrls(text: string): string[] {
        const urls: string[] = [];
        // Match URLs ending in audio extensions
        const regex = /https?:\/\/[^\s"'<>)]+\.(?:mp3|wav|ogg|flac|m4a)/gi;
        const matches = text.match(regex);
        if (matches) {
            for (const m of matches) {
                if (!urls.includes(m)) {
                    urls.push(m);
                }
            }
        }
        return urls;
    }

    /**
     * Validates an audio URL by making a HEAD request.
     * Follows up to 5 redirects and accepts any 2xx status.
     */
    private validateAudioUrl(url: string): Promise<boolean> {
        const MAX_REDIRECTS = 5;
        return new Promise((resolve) => {
            const attempt = (currentUrl: string, redirectsLeft: number) => {
                try {
                    const urlObj = new URL(currentUrl);
                    const options = {
                        hostname: urlObj.hostname,
                        path: urlObj.pathname + urlObj.search,
                        method: "HEAD",
                        timeout: 10000,
                    };

                    const client = urlObj.protocol === "https:" ? HTTPS : HTTP;
                    const req = client.request(options, (res: any) => {
                        const status = res.statusCode || 0;
                        if (status >= 200 && status < 300) {
                            resolve(true);
                            return;
                        }
                        if (status >= 300 && status < 400 && res.headers?.location && redirectsLeft > 0) {
                            const nextUrl = new URL(res.headers.location as string, currentUrl).toString();
                            res.resume();
                            attempt(nextUrl, redirectsLeft - 1);
                            return;
                        }
                        resolve(false);
                    });
                    req.on("error", () => resolve(false));
                    req.on("timeout", () => { req.destroy(); resolve(false); });
                    req.end();
                } catch {
                    resolve(false);
                }
            };
            attempt(url, MAX_REDIRECTS);
        });
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
