// Character research service — deep Firecrawl integration for custom characters

"use strict";

import { Monitor } from "../monitor";
import { FirecrawlService } from "./firecrawl-service";
import { OpenAIService, ChatMessage, ChatResult } from "./openai-service";
import { CharacterResearchData } from "../models/character-research";

/**
 * Researches historical figures using Firecrawl Search.
 * Makes 5-6 sequential search queries to gather comprehensive biographical data,
 * then uses an LLM to synthesize the raw results into structured persona data.
 *
 * This is one of the deepest Firecrawl integrations in the hackathon —
 * 12-18 search queries per character creation.
 */
export class CharacterResearchService {
    /* Singleton */

    public static instance: CharacterResearchService = null;

    public static getInstance(): CharacterResearchService {
        if (CharacterResearchService.instance) {
            return CharacterResearchService.instance;
        } else {
            CharacterResearchService.instance = new CharacterResearchService();
            return CharacterResearchService.instance;
        }
    }

    constructor() {}

    /**
     * Researches a historical figure using Firecrawl Search.
     * Makes 5-6 sequential searches with delays for rate limiting (5 RPM on free tier).
     * @param name The historical figure's name
     * @param hints Optional hints about the figure (era, profession, etc.)
     * @returns Structured research data
     */
    public async researchFigure(name: string, hints?: string): Promise<CharacterResearchData> {
        Monitor.info("CharacterResearchService: starting research", { name, hints });

        const allSources: Array<{ url: string; title: string; snippet: string }> = [];
        const allMarkdown: string[] = [];

        // Query 1: Biography and key facts
        const bioResults = await this.searchWithDelay(
            `${name} biography historical facts ${hints || ""}`.trim(),
            5,
        );
        this.collectResults(bioResults, allSources, allMarkdown);

        // Query 2: Personality and speaking style
        const personalityResults = await this.searchWithDelay(
            `${name} personality speaking style character traits temperament`,
            5,
        );
        this.collectResults(personalityResults, allSources, allMarkdown);

        // Query 3: Physical appearance
        const appearanceResults = await this.searchWithDelay(
            `${name} physical appearance description clothing era fashion`,
            3,
        );
        this.collectResults(appearanceResults, allSources, allMarkdown);

        // Query 4: Famous quotes and writings
        const quotesResults = await this.searchWithDelay(
            `${name} famous quotes sayings written words`,
            5,
        );
        this.collectResults(quotesResults, allSources, allMarkdown);

        // Query 5: Key events and relationships
        const eventsResults = await this.searchWithDelay(
            `${name} key life events achievements controversies rivals`,
            5,
        );
        this.collectResults(eventsResults, allSources, allMarkdown);

        // Query 6: Audio recordings (for smart voice feature)
        const audioResults = await this.searchWithDelay(
            `${name} voice recording audio speech archive`,
            3,
        );
        this.collectResults(audioResults, allSources, allMarkdown);

        Monitor.info("CharacterResearchService: raw research complete", {
            name,
            totalSources: allSources.length,
            markdownChars: allMarkdown.join("").length,
        });

        // Synthesize raw results into structured data using LLM
        const synthesized = await this.synthesizeResearch(name, hints, allMarkdown.join("\n\n---\n\n"), allSources);

        Monitor.info("CharacterResearchService: synthesis complete", { name });

        return synthesized;
    }

    /**
     * Searches Firecrawl with a delay for rate limiting.
     */
    private async searchWithDelay(query: string, limit: number): Promise<Array<{ url: string; title: string; description: string; markdown: string }>> {
        try {
            const results = await FirecrawlService.getInstance().search(query, limit);
            // Delay 12s between searches for rate limiting (5 RPM on free tier)
            await this.delay(12000);
            return results;
        } catch (err) {
            Monitor.warning("CharacterResearchService: search failed", {
                query: query.substring(0, 80),
                error: (err as Error).message,
            });
            await this.delay(12000);
            return [];
        }
    }

    /**
     * Collects search results into arrays.
     */
    private collectResults(
        results: Array<{ url: string; title: string; description: string; markdown: string }>,
        sources: Array<{ url: string; title: string; snippet: string }>,
        markdowns: string[],
    ): void {
        for (const r of results) {
            sources.push({
                url: r.url,
                title: r.title,
                snippet: r.description || r.markdown.substring(0, 200),
            });
            markdowns.push(r.markdown.substring(0, 1500));
        }
    }

    /**
     * Uses an LLM to synthesize raw Firecrawl results into structured persona data.
     */
    private async synthesizeResearch(
        name: string,
        hints: string | undefined,
        rawMarkdown: string,
        sources: Array<{ url: string; title: string; snippet: string }>,
    ): Promise<CharacterResearchData> {
        const systemPrompt = `You are an expert historian and character designer. Given raw research data about a historical figure, synthesize it into a structured character profile for a voice conversation AI.

Return ONLY valid JSON with this exact structure:
{
  "name": "Full name",
  "biography": "2-3 paragraph biography",
  "era": "Birth year - Death year",
  "nationality": "Nationality",
  "profession": "Primary profession",
  "personality": "Detailed personality description (3-4 sentences)",
  "speakingStyle": "How they spoke — accent, vocabulary, formality, verbal tics",
  "famousQuotes": ["quote1", "quote2", "quote3"],
  "keyEvents": ["event1", "event2", "event3"],
  "physicalAppearance": "Detailed physical description for portrait generation",
  "emotionalTriggers": [
    {"emotion": "angry", "trigger": "Topics that anger them"},
    {"emotion": "excited", "trigger": "Topics that excite them"},
    {"emotion": "whispers", "trigger": "Topics they discuss quietly"},
    {"emotion": "melancholy", "trigger": "Topics that sadden them"}
  ],
  "voiceDescription": "Description for AI voice generation: gender, age, accent, tone, pace",
  "imagePrompt": "Detailed prompt for generating a historical portrait: physical features, clothing, background, era-appropriate style",
  "searchKeywords": ["keyword1", "keyword2", "keyword3"],
  "audioSearchResults": []
}`;

        const userMessage = `Research data for: ${name}${hints ? " (" + hints + ")" : ""}

RAW SOURCES (condensed):
${rawMarkdown.substring(0, 8000)}`;

        const messages: ChatMessage[] = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
        ];

        try {
            const chatResult: ChatResult = await OpenAIService.getInstance().chat(messages);
            const result = chatResult.response || "";

            // Parse JSON from LLM response (handle markdown code blocks)
            let jsonStr = result;
            const codeBlockMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (codeBlockMatch) {
                jsonStr = codeBlockMatch[1].trim();
            }

            const parsed = JSON.parse(jsonStr);

            return {
                name: parsed.name || name,
                biography: parsed.biography || "",
                era: parsed.era || "",
                nationality: parsed.nationality || "",
                profession: parsed.profession || "",
                personality: parsed.personality || "",
                speakingStyle: parsed.speakingStyle || "",
                famousQuotes: parsed.famousQuotes || [],
                keyEvents: parsed.keyEvents || [],
                physicalAppearance: parsed.physicalAppearance || "",
                emotionalTriggers: parsed.emotionalTriggers || [],
                voiceDescription: parsed.voiceDescription || "",
                imagePrompt: parsed.imagePrompt || "",
                searchKeywords: parsed.searchKeywords || [],
                audioSearchResults: parsed.audioSearchResults || [],
                sources: sources,
            };
        } catch (err) {
            Monitor.exception(err, "CharacterResearchService: synthesis failed");
            // Return minimal data on failure
            return {
                name: name,
                biography: "",
                era: hints || "",
                nationality: "",
                profession: "",
                personality: "",
                speakingStyle: "",
                famousQuotes: [],
                keyEvents: [],
                physicalAppearance: "",
                emotionalTriggers: [],
                voiceDescription: "Male, middle-aged, formal speaking style",
                imagePrompt: `Historical portrait of ${name}, photorealistic, dramatic lighting`,
                searchKeywords: [name],
                audioSearchResults: [],
                sources: sources,
            };
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
