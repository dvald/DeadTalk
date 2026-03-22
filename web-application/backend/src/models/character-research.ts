// Character research data models

"use strict";

/**
 * Raw research data gathered from Firecrawl about a historical figure
 */
export interface CharacterResearchData {
    name: string;
    biography: string;
    era: string;
    nationality: string;
    profession: string;
    personality: string;
    speakingStyle: string;
    famousQuotes: string[];
    keyEvents: string[];
    physicalAppearance: string;
    emotionalTriggers: Array<{ emotion: string; trigger: string }>;
    voiceDescription: string;
    imagePrompt: string;
    searchKeywords: string[];
    audioSearchResults: string[];
    sources: Array<{ url: string; title: string; snippet: string }>;
}

/**
 * Synthesized persona ready for use in conversations
 */
export interface SynthesizedPersona {
    id: string;
    name: string;
    era: string;
    nationality: string;
    profession: string;
    voiceDescription: string;
    voiceId: string;
    systemPrompt: string;
    firstMessage: string;
    firstMessageEs: string;
    firstMessages: string[];
    firstMessagesEs: string[];
    emotionalProfile: Array<{ emotion: string; trigger: string }>;
    avatar: string;
    image: string;
    quote: string;
    quoteEs: string;
    searchKeywords: string[];
    isCustom: boolean;
    voiceSource: "cloned" | "designed" | "default";
    createdAt: number;
}

/**
 * Character creation request
 */
export interface CharacterCreateRequest {
    name: string;
    hints?: string;
    photoBase64?: string;
}

/**
 * Character creation progress event
 */
export interface CharacterCreateProgress {
    step: "researching" | "generating-portrait" | "creating-voice" | "synthesizing" | "done";
    detail?: string;
    progress: number; // 0-100
}
