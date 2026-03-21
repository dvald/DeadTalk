// Firecrawl service

"use strict";

import { FirecrawlConfig } from "../config/config-firecrawl";
import { Monitor } from "../monitor";
import { Request, RequestResponse } from "../utils/request";

/**
 * Normalized search result from Firecrawl Search API
 */
export interface FirecrawlSearchResult {
    url: string;
    title: string;
    description: string;
    markdown: string;
}

export class FirecrawlService {
    /* Singleton */

    public static instance: FirecrawlService = null;

    public static getInstance(): FirecrawlService {
        if (FirecrawlService.instance) {
            return FirecrawlService.instance;
        } else {
            FirecrawlService.instance = new FirecrawlService();
            return FirecrawlService.instance;
        }
    }

    private apiKey: string;
    private baseUrl: string;

    constructor() {
        const config = FirecrawlConfig.getInstance();
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl;
    }

    /**
     * Searches the web using Firecrawl Search API and returns scraped results with markdown content.
     * @param query The search query
     * @param limit Maximum number of results (default 5)
     * @returns Array of search results with url, title, description, and markdown
     */
    public async search(query: string, limit?: number): Promise<FirecrawlSearchResult[]> {
        const url = this.baseUrl + "/search";
        const payload = {
            query: query,
            limit: limit || 5,
            scrapeOptions: {
                formats: ["markdown"],
                onlyMainContent: true,
            },
        };

        Monitor.debug("FirecrawlService.search", { query, limit: limit || 5 });

        return new Promise<FirecrawlSearchResult[]>((resolve, reject) => {
            Request.post(url, {
                headers: {
                    "Authorization": "Bearer " + this.apiKey,
                },
                json: payload,
            }, (err: Error, response: RequestResponse, body: string) => {
                if (err) {
                    Monitor.exception(err, "FirecrawlService.search request failed");
                    return reject(Object.assign(new Error("Firecrawl request failed: " + err.message), { code: "FIRECRAWL_ERROR" }));
                }

                try {
                    const parsed = JSON.parse(body);

                    if (response.statusCode !== 200 || !parsed.success) {
                        const errorMsg = parsed.error || "Unknown Firecrawl error (status " + response.statusCode + ")";
                        Monitor.warning("FirecrawlService.search API error", { statusCode: response.statusCode, error: errorMsg });
                        return reject(Object.assign(new Error(errorMsg), { code: "FIRECRAWL_ERROR" }));
                    }

                    const results: FirecrawlSearchResult[] = (parsed.data || []).map((item: any) => {
                        return {
                            url: item.url || "",
                            title: (item.metadata && item.metadata.title) || "",
                            description: (item.metadata && item.metadata.description) || "",
                            markdown: item.markdown || "",
                        };
                    });

                    Monitor.debug("FirecrawlService.search completed", { resultCount: results.length });
                    resolve(results);
                } catch (ex) {
                    Monitor.exception(ex, "FirecrawlService.search failed to parse response");
                    reject(Object.assign(new Error("Failed to parse Firecrawl response"), { code: "FIRECRAWL_ERROR" }));
                }
            });
        });
    }
}
